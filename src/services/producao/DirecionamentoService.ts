import { ICreateDirecionamentoRequest, IUpdateDirecionamentoRequest } from "../../interfaces/IProducao";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

class CreateDirecionamentoService {
    async execute({ loteProducaoId, direcionamentos }: ICreateDirecionamentoRequest) {
        if (!direcionamentos?.length) {
            throw new Error("Informe ao menos um direcionamento.");
        }

        // Verificar se lote existe
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id: loteProducaoId },
            select: {
                id: true,
                status: true,
                items: {
                    select: {
                        quantidadePlanejada: true
                    }
                },
                _count: {
                    select: {
                        items: true
                    }
                }
            }
        });

        if (!lote) {
            throw new Error("Lote não encontrado.");
        }

        if (lote._count.items === 0) {
            throw new Error("Não é possível direcionar lote sem itens na grade.");
        }

        const quantidadeTotalLote = lote.items.reduce((total, item) => total + item.quantidadePlanejada, 0);
        const quantidadeTotalDirecionada = direcionamentos.reduce((total, direcionamento) => total + direcionamento.quantidade, 0);

        if (quantidadeTotalDirecionada !== quantidadeTotalLote) {
            throw new Error(`Quantidade total direcionada (${quantidadeTotalDirecionada}) deve ser igual à quantidade necessária do lote (${quantidadeTotalLote}).`);
        }

        const faccoesIds = [...new Set(direcionamentos.map((direcionamento) => direcionamento.faccaoId))];

        const faccoes = await prismaClient.faccao.findMany({
            where: {
                id: {
                    in: faccoesIds
                }
            },
            select: {
                id: true,
                status: true
            }
        });

        if (faccoes.length !== faccoesIds.length) {
            throw new Error("Uma ou mais facções não foram encontradas.");
        }

        const faccaoInativa = faccoes.find((faccao) => faccao.status !== "ativo");
        if (faccaoInativa) {
            throw new Error("Uma ou mais facções estão inativas. Não é possível enviar direcionamentos.");
        }

        // Usar transação para criar direcionamentos e atualizar status do lote
        const direcionamentosCriados = await prismaClient.$transaction(async (tx) => {
            // Atualizar status do lote de "planejado" para "em_producao"
            if (lote.status === "planejado") {
                await tx.loteProducao.update({
                    where: { id: loteProducaoId },
                    data: { status: "em_producao" }
                });
            }

            const resultado = await Promise.all(
                direcionamentos.map((direcionamento) =>
                    tx.direcionamento.create({
                        data: {
                            loteProducaoId,
                            faccaoId: direcionamento.faccaoId,
                            tipoServico: direcionamento.tipoServico,
                            quantidade: direcionamento.quantidade,
                            dataSaida: new Date(),
                            dataPrevisaoRetorno: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                            status: "enviado"
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
                            conferencias: true
                        }
                    })
                )
            );

            return resultado;
        });

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

        return direcionamentoAtualizado;
    }
}

class DeleteDirecionamentoService {
    async execute(id: string) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            include: {
                conferencias: true
            }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento não encontrado.");
        }

        if (direcionamento.conferencias.length > 0) {
            throw new Error("Não é possível deletar um direcionamento que possui conferências associadas.");
        }

        await prismaClient.direcionamento.delete({
            where: { id }
        });

        return { message: "Direcionamento deletado com sucesso." };
    }
}

export { CreateDirecionamentoService, ListAllDirecionamentoService, ListByIdDirecionamentoService, UpdateDirecionamentoService, DeleteDirecionamentoService };
