import { ICreateDirecionamentoRequest, IUpdateDirecionamentoRequest } from "../../interfaces/IProducao";
import { parsePaginationParams, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

const direcionamentoInclude = {
    faccao: true,
    items: {
        include: {
            estoqueCorte: {
                include: {
                    lote: {
                        include: {
                            tecido: true,
                            responsavel: true
                        }
                    },
                    produto: true,
                    tamanho: true
                }
            }
        }
    },
    conferencias: {
        include: {
            responsavel: true,
            items: {
                include: {
                    direcionamentoItem: {
                        include: {
                            estoqueCorte: {
                                include: {
                                    produto: true,
                                    tamanho: true,
                                    cor: true,
                                    lote: {
                                        select: {
                                            id: true,
                                            codigoLote: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
} as const;

function mapQuantidadeSolicitadaPorEstoque(direcionamentos: ICreateDirecionamentoRequest["direcionamentos"]) {
    const quantidadePorEstoque = new Map<string, number>();

    for (const direcionamento of direcionamentos) {
        for (const item of direcionamento.items) {
            const atual = quantidadePorEstoque.get(item.estoqueCorteId) ?? 0;
            quantidadePorEstoque.set(item.estoqueCorteId, atual + item.quantidade);
        }
    }

    return quantidadePorEstoque;
}

class CreateDirecionamentoService {
    async execute({ direcionamentos }: ICreateDirecionamentoRequest) {
        if (!direcionamentos?.length) {
            throw new Error("Informe ao menos um direcionamento.");
        }

        const faccoesIds: string[] = [];

        for (const direcao of direcionamentos) {
            if (!direcao.items?.length) {
                throw new Error("Cada direcionamento deve ter ao menos um item.");
            }

            faccoesIds.push(direcao.faccaoId);

            for (const dirItem of direcao.items) {
                if (dirItem.quantidade <= 0) {
                    throw new Error("Quantidade de direcionamento deve ser maior que 0.");
                }
            }
        }

        const faccoesUnicas = [...new Set(faccoesIds)];
        const faccoes = await prismaClient.faccao.findMany({
            where: { id: { in: faccoesUnicas } },
            select: { id: true, status: true }
        });

        if (faccoes.length !== faccoesUnicas.length) {
            throw new Error("Uma ou mais faccoes nao foram encontradas.");
        }

        if (faccoes.some((faccao) => faccao.status !== "ativo")) {
            throw new Error("Uma ou mais faccoes estao inativas. Nao e possivel enviar direcionamentos.");
        }

        const quantidadePorEstoque = mapQuantidadeSolicitadaPorEstoque(direcionamentos);
        const estoqueIds = Array.from(quantidadePorEstoque.keys());

        const estoques = await prismaClient.estoqueCorte.findMany({
            where: { id: { in: estoqueIds } },
            include: {
                lote: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            }
        });

        if (estoques.length !== estoqueIds.length) {
            throw new Error("Um ou mais itens de estoque de corte nao foram encontrados.");
        }

        const estoquePorId = new Map(estoques.map((estoque) => [estoque.id, estoque]));

        for (const [estoqueCorteId, quantidadeSolicitada] of quantidadePorEstoque.entries()) {
            const estoque = estoquePorId.get(estoqueCorteId);
            if (!estoque) {
                throw new Error("Item de estoque de corte nao encontrado.");
            }

            if (quantidadeSolicitada > estoque.quantidadeDisponivel) {
                throw new Error(`Estoque insuficiente para o item ${estoqueCorteId}. Disponivel: ${estoque.quantidadeDisponivel}.`);
            }
        }

        const lotesPlanejados = [...new Set(
            estoques
                .filter((estoque) => estoque.lote.status === "planejado")
                .map((estoque) => estoque.lote.id)
        )];

        const direcionamentosCriadosIds = await prismaClient.$transaction(async (tx) => {
            for (const loteId of lotesPlanejados) {
                await tx.loteProducao.update({
                    where: { id: loteId },
                    data: { status: "em_producao" }
                });
            }

            for (const [estoqueCorteId, quantidadeSolicitada] of quantidadePorEstoque.entries()) {
                const resultado = await tx.estoqueCorte.updateMany({
                    where: {
                        id: estoqueCorteId,
                        quantidadeDisponivel: {
                            gte: quantidadeSolicitada
                        }
                    },
                    data: {
                        quantidadeDisponivel: {
                            decrement: quantidadeSolicitada
                        }
                    }
                });

                if (resultado.count !== 1) {
                    throw new Error(`Saldo insuficiente para o item ${estoqueCorteId} durante a confirmacao da remessa.`);
                }
            }

            const criados = await Promise.all(
                direcionamentos.map((direcionamento) => {
                    const quantidadeTotal = direcionamento.items.reduce((sum, item) => sum + item.quantidade, 0);

                    return tx.direcionamento.create({
                        data: {
                            faccaoId: direcionamento.faccaoId,
                            tipoServico: direcionamento.tipoServico,
                            quantidade: quantidadeTotal,
                            dataSaida: direcionamento.dataSaida || new Date(),
                            dataPrevisaoRetorno: direcionamento.dataPrevisaoRetorno || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                            status: "enviado",
                            items: {
                                create: direcionamento.items.map((item) => ({
                                    estoqueCorteId: item.estoqueCorteId,
                                    quantidade: item.quantidade
                                }))
                            }
                        },
                        select: {
                            id: true
                        }
                    });
                })
            );

            return criados.map((direcionamento) => direcionamento.id);
        }, {
            maxWait: 10000,
            timeout: 30000
        });

        const direcionamentosCriados = await prismaClient.direcionamento.findMany({
            where: {
                id: {
                    in: direcionamentosCriadosIds
                }
            },
            include: direcionamentoInclude
        });

        const direcionamentosPorId = new Map(
            direcionamentosCriados.map((direcionamento) => [direcionamento.id, direcionamento])
        );

        return direcionamentosCriadosIds
            .map((id) => direcionamentosPorId.get(id))
            .filter((direcionamento): direcionamento is NonNullable<typeof direcionamento> => Boolean(direcionamento));
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
                select: {
                    id: true,
                    status: true,
                    tipoServico: true,
                    quantidade: true,
                    dataSaida: true,
                    dataPrevisaoRetorno: true,
                    createdAt: true,
                    faccao: {
                        select: {
                            id: true,
                            nome: true,
                            responsavel: true
                        }
                    },
                    items: {
                        select: {
                            id: true,
                            quantidade: true,
                            estoqueCorte: {
                                select: {
                                    produto: {
                                        select: {
                                            id: true,
                                            nome: true,
                                            sku: true
                                        }
                                    },
                                    cor: {
                                        select: {
                                            id: true,
                                            nome: true,
                                            codigoHex: true
                                        }
                                    },
                                    tamanho: {
                                        select: {
                                            nome: true
                                        }
                                    },
                                    lote: {
                                        select: {
                                            id: true,
                                            codigoLote: true
                                        }
                                    }
                                }
                            }
                        }
                    }
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

        const data = direcionamentos.map((direcionamento) => ({
            id: direcionamento.id,
            status: direcionamento.status,
            tipoServico: direcionamento.tipoServico,
            quantidade: direcionamento.quantidade,
            dataSaida: direcionamento.dataSaida,
            dataPrevisaoRetorno: direcionamento.dataPrevisaoRetorno,
            faccao: {
                id: direcionamento.faccao.id,
                nome: direcionamento.faccao.nome,
                responsavel: direcionamento.faccao.responsavel ?? ""
            },
            items: direcionamento.items.map((item) => ({
                id: item.id,
                quantidade: item.quantidade,
                produto: {
                    id: item.estoqueCorte.produto.id,
                    nome: item.estoqueCorte.produto.nome,
                    sku: item.estoqueCorte.produto.sku,
                    cor: {
                        id: item.estoqueCorte.cor.id,
                        nome: item.estoqueCorte.cor.nome,
                        codigoHex: item.estoqueCorte.cor.codigoHex ?? ""
                    },
                    tamanho: item.estoqueCorte.tamanho.nome
                },
                lote: {
                    id: item.estoqueCorte.lote.id,
                    codigoLote: item.estoqueCorte.lote.codigoLote
                }
            })),
            createdAt: direcionamento.createdAt
        }));

        const totalPages = Math.ceil(total / pageLimit);

        return {
            data,
            pagination: {
                total,
                page: pageNumber,
                limit: pageLimit,
                totalPages,
                pages: totalPages
            }
        } as PaginatedResponse<any>;
    }
}

class ListByIdDirecionamentoService {
    async execute(id: string) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            include: direcionamentoInclude
        });

        if (!direcionamento) {
            throw new Error("Direcionamento nao encontrado.");
        }

        return direcionamento;
    }
}

class UpdateDirecionamentoService {
    async execute(id: string, { status }: IUpdateDirecionamentoRequest) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        estoqueCorte: {
                            include: {
                                lote: {
                                    select: {
                                        responsavelId: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento nao encontrado.");
        }

        const statusValidos: Record<string, string[]> = {
            enviado: ["em_processamento", "recebido", "cancelado"],
            em_processamento: ["recebido", "cancelado"],
            recebido: [],
            cancelado: []
        };

        if (status && !statusValidos[direcionamento.status]?.includes(status)) {
            throw new Error(`Nao e permitido mudar status de '${direcionamento.status}' para '${status}'.`);
        }

        const direcionamentoAtualizado = await prismaClient.$transaction(async (tx) => {
            if (status === "cancelado" && direcionamento.status !== "cancelado") {
                for (const item of direcionamento.items) {
                    await tx.estoqueCorte.update({
                        where: { id: item.estoqueCorteId },
                        data: {
                            quantidadeDisponivel: {
                                increment: item.quantidade
                            }
                        }
                    });
                }
            }

            const dataUpdate: { status?: string; dataPrevisaoRetorno?: Date } = { status };
            if (status === "recebido") {
                dataUpdate.dataPrevisaoRetorno = new Date();
            }

            if (status === "recebido") {
                const conferenciaExistente = await tx.conferencia.findFirst({
                    where: { direcionamentoId: id }
                });

                if (!conferenciaExistente) {
                    const responsavelIds = [...new Set(
                        direcionamento.items
                            .map((item) => item.estoqueCorte.lote.responsavelId)
                            .filter(Boolean)
                    )];

                    const responsavelId = responsavelIds[0];
                    if (!responsavelId) {
                        throw new Error("Nao foi possivel identificar um responsavel para criar a conferencia.");
                    }

                    await tx.conferencia.create({
                        data: {
                            direcionamentoId: id,
                            responsavelId,
                            dataConferencia: new Date(),
                            status: "validando",
                            liberadoPagamento: false
                        }
                    });
                }
            }

            return tx.direcionamento.update({
                where: { id },
                data: dataUpdate,
                include: direcionamentoInclude
            });
        }, {
            maxWait: 10000,
            timeout: 30000
        });

        return direcionamentoAtualizado;
    }
}

class DeleteDirecionamentoService {
    async execute(id: string) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            include: {
                conferencias: true,
                items: true
            }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento nao encontrado.");
        }

        if (direcionamento.conferencias.length > 0) {
            throw new Error("Nao e possivel deletar um direcionamento que possui conferencias associadas.");
        }

        await prismaClient.$transaction(async (tx) => {
            if (direcionamento.status !== "cancelado") {
                for (const item of direcionamento.items) {
                    await tx.estoqueCorte.update({
                        where: { id: item.estoqueCorteId },
                        data: {
                            quantidadeDisponivel: {
                                increment: item.quantidade
                            }
                        }
                    });
                }
            }

            await tx.direcionamento.delete({
                where: { id }
            });
        }, {
            maxWait: 10000,
            timeout: 30000
        });

        return { message: "Direcionamento deletado com sucesso." };
    }
}

export { CreateDirecionamentoService, ListAllDirecionamentoService, ListByIdDirecionamentoService, UpdateDirecionamentoService, DeleteDirecionamentoService };
