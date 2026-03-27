import { ICreateMovimentacaoEstoqueRequest } from "../../interfaces/IEstoque";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

const mapMovimentacaoResponse = (mov: any) => ({
    id: mov.id,
    tipoMovimentacao: mov.tipoMovimentacao,
    pesoMovimentado: mov.pesoMovimentado ? Number(mov.pesoMovimentado.toString()) : 0,
    rolo: {
        id: mov.rolo?.id,
        codigoBarraRolo: mov.rolo?.codigoBarraRolo,
        fornecedor: {
            id: mov.rolo?.tecido?.fornecedor?.id,
            nome: mov.rolo?.tecido?.fornecedor?.nome,
            tipo: mov.rolo?.tecido?.fornecedor?.tipo,
            tecido: {
                id: mov.rolo?.tecido?.id,
                nome: mov.rolo?.tecido?.nome,
                codigoReferencia: mov.rolo?.tecido?.codigoReferencia,
                cor: {
                    id: mov.rolo?.tecido?.cor?.id,
                    nome: mov.rolo?.tecido?.cor?.nome,
                    codigoHex: mov.rolo?.tecido?.cor?.codigoHex
                }
            }
        }
    },
    reponsavel: {
        id: mov.usuario?.id,
        nome: mov.usuario?.nome
    }
});

class CreateMovimentacaoEstoqueService {
    async execute(usuarioId: string, { estoqueRoloId, tipoMovimentacao, pesoMovimentado }: ICreateMovimentacaoEstoqueRequest) {
        const peso = Number(pesoMovimentado);
        if (!Number.isFinite(peso) || peso < 0) {
            throw new Error("Peso movimentado inválido.");
        }

        return prismaClient.$transaction(async (tx) => {
            // Verificar se estoque rolo existe
            const rolo = await tx.estoqueRolo.findUnique({
                where: { id: estoqueRoloId }
            });

            if (!rolo) {
                throw new Error("Rolo não encontrado.");
            }

            // Validações de lógica de negócio
            if (tipoMovimentacao === "saida" || tipoMovimentacao === "ajuste") {
                if (peso > rolo.pesoAtualKg.toNumber()) {
                    throw new Error("Peso da saída não pode ser maior que o peso atual do rolo.");
                }
            }

            // Atualizar peso do rolo baseado no tipo de movimentação
            let novoPeso = rolo.pesoAtualKg.toNumber();

            if (tipoMovimentacao === "entrada") {
                novoPeso = rolo.pesoAtualKg.toNumber() + peso;
            } else if (tipoMovimentacao === "saida" || tipoMovimentacao === "devolucao") {
                novoPeso = rolo.pesoAtualKg.toNumber() - peso;
            } else if (tipoMovimentacao === "ajuste") {
                novoPeso = peso;
            }

            // Atualizar rolo com novo peso
            await tx.estoqueRolo.update({
                where: { id: estoqueRoloId },
                data: {
                    pesoAtualKg: novoPeso
                }
            });

            // Registrar movimentação
            const movimentacao = await tx.movimentacaoEstoque.create({
                data: {
                    estoqueRoloId,
                    usuarioId,
                    tipoMovimentacao,
                    pesoMovimentado: peso
                },
                include: {
                    rolo: {
                        include: {
                            tecido: true
                        }
                    },
                    usuario: {
                        select: {
                            id: true,
                            nome: true,
                            funcaoSetor: true,
                            perfil: true
                        }
                    }
                }
            });

            return movimentacao;
        });
    }
}

class ListAllMovimentacaoEstoqueService {
    async execute(
        estoqueRoloId?: string,
        tipoMovimentacao?: string,
        dataInicio?: string,
        dataFim?: string,
        page?: number | string,
        limit?: number | string,
        fornecedorId?: string,
        tecidoId?: string,
        situacao?: string
    ): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const [movimentacoes, total] = await Promise.all([
            prismaClient.movimentacaoEstoque.findMany({
                where: {
                    ...(estoqueRoloId && { estoqueRoloId }),
                    ...(tipoMovimentacao && { tipoMovimentacao }),
                    ...((fornecedorId || tecidoId || situacao) && {
                        rolo: {
                            is: {
                                ...(tecidoId && { tecidoId }),
                                ...(situacao && { situacao }),
                                ...(fornecedorId && {
                                    tecido: {
                                        is: {
                                            fornecedorId
                                        }
                                    }
                                })
                            }
                        }
                    }),
                    ...(dataInicio || dataFim ? {
                        createdAt: {
                            ...(dataInicio && { gte: new Date(dataInicio) }),
                            ...(dataFim && { lte: new Date(dataFim) })
                        }
                    } : {})
                },
                include: {
                    rolo: {
                        include: {
                            tecido: {
                                include: {
                                    fornecedor: true,
                                    cor: true
                                }
                            }
                        }
                    },
                    usuario: {
                        select: {
                            id: true,
                            nome: true,
                            email: true,
                            perfil: true,
                            funcaoSetor: true,
                        }
                    }
                },
                skip,
                take: pageLimit,
                orderBy: {
                    createdAt: "desc"
                }
            }),
            prismaClient.movimentacaoEstoque.count({
                where: {
                    ...(estoqueRoloId && { estoqueRoloId }),
                    ...(tipoMovimentacao && { tipoMovimentacao }),
                    ...((fornecedorId || tecidoId || situacao) && {
                        rolo: {
                            is: {
                                ...(tecidoId && { tecidoId }),
                                ...(situacao && { situacao }),
                                ...(fornecedorId && {
                                    tecido: {
                                        is: {
                                            fornecedorId
                                        }
                                    }
                                })
                            }
                        }
                    }),
                    ...(dataInicio || dataFim ? {
                        createdAt: {
                            ...(dataInicio && { gte: new Date(dataInicio) }),
                            ...(dataFim && { lte: new Date(dataFim) })
                        }
                    } : {})
                }
            })
        ]);

        const pagination = createPaginatedResponse(movimentacoes.map(mapMovimentacaoResponse), total, pageNumber, pageLimit);
        return pagination;
    }
}

class ListByIdMovimentacaoEstoqueService {
    async execute(id: string) {
        const movimentacao = await prismaClient.movimentacaoEstoque.findUnique({
            where: { id },
            include: {
                rolo: {
                    include: {
                        tecido: {
                            include: {
                                fornecedor: true,
                                cor: true
                            }
                        }
                    }
                },
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                        funcaoSetor: true,
                        perfil: true
                    }
                }
            }
        });

        if (!movimentacao) {
            throw new Error("Movimentação não encontrada.");
        }

        return {
            data: [mapMovimentacaoResponse(movimentacao)]
        };
    }
}

class GetHistoricoRoloService {
    async execute(estoqueRoloId: string) {
        const rolo = await prismaClient.estoqueRolo.findUnique({
            where: { id: estoqueRoloId }
        });

        if (!rolo) {
            throw new Error("Rolo não encontrado.");
        }

        const movimentacoes = await prismaClient.movimentacaoEstoque.findMany({
            where: { estoqueRoloId },
            include: {
                rolo: {
                    include: {
                        tecido: {
                            include: {
                                fornecedor: true,
                                cor: true
                            }
                        }
                    }
                },
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                        funcaoSetor: true,
                        perfil: true
                    }
                }
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        return {
            data: movimentacoes.map(mapMovimentacaoResponse)
        };
    }
}

export { CreateMovimentacaoEstoqueService, ListAllMovimentacaoEstoqueService, ListByIdMovimentacaoEstoqueService, GetHistoricoRoloService };
