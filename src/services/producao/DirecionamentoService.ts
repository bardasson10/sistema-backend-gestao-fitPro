import { ICreateDirecionamentoRequest, IUpdateDirecionamentoRequest } from "../../interfaces/IProducao";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";
import { ComputarGradesObrasService } from "./ComputarGradesObrasService";

class CreateDirecionamentoService {
    async execute({ loteProducaoId, direcionamentos }: ICreateDirecionamentoRequest) {
        if (!direcionamentos?.length) {
            throw new Error("Informe ao menos um direcionamento.");
        }

        // Verificar se lote existe e buscar itens
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id: loteProducaoId },
            include: {
                items: {
                    include: {
                        produto: true,
                        tamanho: true
                    }
                }
            }
        });

        if (!lote) {
            throw new Error("Lote não encontrado.");
        }

        if (lote.items.length === 0) {
            throw new Error("Não é possível direcionar lote sem itens na grade.");
        }

        // Validar cada direcionamento
        const faccoesIds: string[] = [];
        const itemsMapaProdutoTamanho = new Map<string, number>();

        // Construir mapa de itens do lote
        for (const loteItem of lote.items) {
            itemsMapaProdutoTamanho.set(`${loteItem.produtoId}|${loteItem.tamanhoId}`, loteItem.quantidadePlanejada);
        }

        // Validar direcionamentos
        for (const direcao of direcionamentos) {
            if (!direcao.items || direcao.items.length === 0) {
                throw new Error("Cada direcionamento deve ter ao menos um item.");
            }

            faccoesIds.push(direcao.faccaoId);

            // Validar items do direcionamento
            for (const dirItem of direcao.items) {
                const key = `${dirItem.produtoId}|${dirItem.tamanhoId}`;
                
                // Verificar se produto/tamanho existe no lote
                if (!itemsMapaProdutoTamanho.has(key)) {
                    throw new Error(`Produto/tamanho (${dirItem.produtoId}/${dirItem.tamanhoId}) não existe neste lote.`);
                }

                if (dirItem.quantidade <= 0) {
                    throw new Error("Quantidade de direcionamento deve ser maior que 0.");
                }
            }
        }

        // Validar facções
        const faccoes = await prismaClient.faccao.findMany({
            where: {
                id: {
                    in: [...new Set(faccoesIds)]
                }
            },
            select: {
                id: true,
                status: true
            }
        });

        if (faccoes.length !== new Set(faccoesIds).size) {
            throw new Error("Uma ou mais facções não foram encontradas.");
        }

        const faccaoInativa = faccoes.find((faccao) => faccao.status !== "ativo");
        if (faccaoInativa) {
            throw new Error("Uma ou mais facções estão inativas. Não é possível enviar direcionamentos.");
        }

        // Usar transação para criar direcionamentos
        const direcionamentosCriados = await prismaClient.$transaction(async (tx) => {
            // Atualizar status do lote de "planejado" para "em_producao" se necessário
            if (lote.status === "planejado") {
                await tx.loteProducao.update({
                    where: { id: loteProducaoId },
                    data: { status: "em_producao" }
                });
            }

            const resultado = await Promise.all(
                direcionamentos.map((direcionamento) => {
                    // Calcular quantidade total deste direcionamento (soma dos items)
                    const quantidadeTotal = direcionamento.items.reduce((sum, item) => sum + item.quantidade, 0);

                    return tx.direcionamento.create({
                        data: {
                            loteProducaoId,
                            faccaoId: direcionamento.faccaoId,
                            tipoServico: direcionamento.tipoServico,
                            quantidade: quantidadeTotal, // Armazenar soma como denormalizacao
                            dataSaida: direcionamento.dataSaida || new Date(),
                            dataPrevisaoRetorno: direcionamento.dataPrevisaoRetorno || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                            status: "enviado",
                            items: {
                                create: direcionamento.items.map((item) => ({
                                    produtoId: item.produtoId,
                                    tamanhoId: item.tamanhoId,
                                    quantidade: item.quantidade
                                }))
                            }
                        },
                        include: {
                            lote: {
                                include: {
                                    tecido: true,
                                    items: {
                                        include: {
                                            produto: true,
                                            tamanho: true
                                        }
                                    }
                                }
                            },
                            faccao: true,
                            items: {
                                include: {
                                    produto: true,
                                    tamanho: true
                                }
                            },
                            conferencias: true
                        }
                    });
                })
            );

            return resultado;
        });

        // Atualizar grades de sobra
        const computarSobras = new ComputarGradesObrasService();
        await computarSobras.execute(loteProducaoId);

        return direcionamentosCriados;
    }
}

class ListAllDirecionamentoService {
    async execute(status?: string, faccaoId?: string, page?: number | string, limit?: number | string): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const [direcionamentos, total] = await Promise.all([
            prismaClient.direcionamento.findMany({
                where: {
                    ...(status && { status }),
                    ...(faccaoId && { faccaoId })
                },
                include: {
                    lote: {
                        include: {
                            tecido: true,
                            items: {
                                include: {
                                    produto: true,
                                    tamanho: true
                                }
                            }
                        }
                    },
                    faccao: true,
                    items: {
                        include: {
                            produto: true,
                            tamanho: true
                        }
                    },
                    conferencias: true
                },
                skip,
                take: pageLimit,
                orderBy: {
                    createdAt: "desc"
                }
            }),
            prismaClient.direcionamento.count({
                where: {
                    ...(status && { status }),
                    ...(faccaoId && { faccaoId })
                }
            })
        ]);

        return createPaginatedResponse(direcionamentos, total, pageNumber, pageLimit);
    }
}

class ListByIdDirecionamentoService {
    async execute(id: string) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            include: {
                lote: {
                    include: {
                        tecido: true,
                        responsavel: true,
                        items: {
                            include: {
                                produto: true,
                                tamanho: true
                            }
                        }
                    }
                },
                faccao: true,
                items: {
                    include: {
                        produto: true,
                        tamanho: true
                    }
                },
                conferencias: {
                    include: {
                        responsavel: true,
                        items: {
                            include: {
                                tamanho: true
                            }
                        }
                    }
                }
            }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento não encontrado.");
        }

        return direcionamento;
    }
}

class UpdateDirecionamentoService {
    async execute(id: string, { status }: IUpdateDirecionamentoRequest) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            include: {
                lote: true
            }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento não encontrado.");
        }

        // Validar transições de status
        const statusValidos: Record<string, string[]> = {
            "enviado": ["em_processamento", "recebido", "cancelado"],
            "em_processamento": ["recebido", "cancelado"],
            "recebido": [],
            "cancelado": []
        };

        if (status && !statusValidos[direcionamento.status]?.includes(status)) {
            throw new Error(`Não é permitido mudar status de '${direcionamento.status}' para '${status}'.`);
        }

        // Usar transação para atualizar direcionamento
        const direcionamentoAtualizado = await prismaClient.$transaction(async (tx) => {
            // Preparar dados para atualização
            const dataUpdate: any = { status };
            
            // Se status for "recebido", preencher dataPrevisaoRetorno
            if (status === "recebido") {
                dataUpdate.dataPrevisaoRetorno = new Date();
            }

            if (status === "recebido") {
                const conferenciaExistente = await tx.conferencia.findFirst({
                    where: { direcionamentoId: id }
                });

                if (!conferenciaExistente) {
                    if (!direcionamento.lote?.responsavelId) {
                        throw new Error("Responsável do lote não encontrado para criar conferência.");
                    }

                    await tx.conferencia.create({
                        data: {
                            direcionamentoId: id,
                            responsavelId: direcionamento.lote.responsavelId,
                            dataConferencia: new Date(),
                            statusQualidade: "validando",
                            liberadoPagamento: false
                        }
                    });
                }
            }

            // Atualizar direçionamento
            const novoDir = await tx.direcionamento.update({
                where: { id },
                data: dataUpdate,
                include: {
                    lote: {
                        include: {
                            tecido: true,
                            items: {
                                include: {
                                    produto: true,
                                    tamanho: true
                                }
                            }
                        }
                    },
                    faccao: true,
                    items: {
                        include: {
                            produto: true,
                            tamanho: true
                        }
                    },
                    conferencias: {
                        include: {
                            responsavel: true,
                            items: {
                                include: {
                                    tamanho: true
                                }
                            }
                        }
                    }
                }
            });

            return novoDir;
        });

        // Recalcular sobras após atualizar (em caso de cancelamento, por exemplo)
        const computarSobras = new ComputarGradesObrasService();
        await computarSobras.execute(direcionamento.loteProducaoId);

        return direcionamentoAtualizado;
    }
}

class DeleteDirecionamentoService {
    async execute(id: string) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            include: {
                conferencias: true,
                lote: true
            }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento não encontrado.");
        }

        if (direcionamento.conferencias.length > 0) {
            throw new Error("Não é possível deletar um direcionamento que possui conferências associadas.");
        }

        // Deletar direcionamento em transação e recalcular sobras
        await prismaClient.$transaction(async (tx) => {
            await tx.direcionamento.delete({
                where: { id }
            });
        });

        // Recalcular sobras após deletar
        const computarSobras = new ComputarGradesObrasService();
        await computarSobras.execute(direcionamento.loteProducaoId);

        return { message: "Direcionamento deletado com sucesso." };
    }
}

export { CreateDirecionamentoService, ListAllDirecionamentoService, ListByIdDirecionamentoService, UpdateDirecionamentoService, DeleteDirecionamentoService };
