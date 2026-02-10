import { ICreateEstoqueRoloRequest, IUpdateEstoqueRoloRequest } from "../../interfaces/IEstoque";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

class CreateEstoqueRoloService {
    async execute({ tecidoId, codigoBarraRolo, pesoInicialKg, pesoAtualKg, situacao, usuarioId }: ICreateEstoqueRoloRequest) {
        return prismaClient.$transaction(async (tx) => {
            // Verificar se tecido existe
            const tecido = await tx.tecido.findUnique({
                where: { id: tecidoId }
            });

            if (!tecido) {
                throw new Error("Tecido não encontrado.");
            }

            // Verificar se código de barra é único (se fornecido)
            if (codigoBarraRolo) {
                const roloComCodigo = await tx.estoqueRolo.findUnique({
                    where: { codigoBarraRolo }
                });

                if (roloComCodigo) {
                    throw new Error("Já existe um rolo com este código de barra.");
                }
            }

            // Validar pesos
            if (pesoAtualKg > pesoInicialKg) {
                throw new Error("Peso atual não pode ser maior que o peso inicial.");
            }

            const rolo = await tx.estoqueRolo.create({
                data: {
                    tecidoId,
                    codigoBarraRolo,
                    pesoInicialKg,
                    pesoAtualKg,
                    situacao: situacao || "disponivel"
                }
            });

            // Registrar movimentação automática de ENTRADA
            await tx.movimentacaoEstoque.create({
                data: {
                    estoqueRoloId: rolo.id,
                    usuarioId,
                    tipoMovimentacao: "entrada",
                    pesoMovimentado: pesoInicialKg
                }
            });

            // Re-buscar o rolo com todas as relações
            const roloCompleto = await tx.estoqueRolo.findUnique({
                where: { id: rolo.id },
                include: {
                    tecido: {
                        include: {
                            fornecedor: true,
                            cor: true
                        }
                    },
                    movimentacoes: {
                        include: {
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
                            createdAt: "desc"
                        }
                    }
                }
            });

            return roloCompleto;
        });
    }
}

class ListAllEstoqueRoloService {
    async execute(tecidoId?: string, situacao?: string, page?: number | string, limit?: number | string): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const [rolos, total] = await Promise.all([
            prismaClient.estoqueRolo.findMany({
                where: {
                    ...(tecidoId && { tecidoId }),
                    ...(situacao && { situacao })
                },
                include: {
                    tecido: {
                        include: {
                            fornecedor: true,
                            cor: true
                        }
                    },
                    movimentacoes: {
                        include: {
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
                            createdAt: "desc"
                        }
                    }
                },
                skip,
                take: pageLimit,
                orderBy: {
                    createdAt: "desc"
                }
            }),
            prismaClient.estoqueRolo.count({
                where: {
                    ...(tecidoId && { tecidoId }),
                    ...(situacao && { situacao })
                }
            })
        ]);

        return createPaginatedResponse(rolos, total, pageNumber, pageLimit);
    }
}

class ListByIdEstoqueRoloService {
    async execute(id: string) {
        const rolo = await prismaClient.estoqueRolo.findUnique({
            where: { id },
            include: {
                tecido: {
                    include: {
                        fornecedor: true,
                        cor: true
                    }
                },
                movimentacoes: {
                    include: {
                        usuario: {
                            select: {
                                id: true,
                                nome: true,
                                funcaoSetor: true,
                                perfil: true
                            }
                        }
                    }
                }
            }
        });

        if (!rolo) {
            throw new Error("Rolo não encontrado.");
        }

        return rolo;
    }
}

class UpdateEstoqueRoloService {
    async execute(id: string, { pesoAtualKg, situacao, usuarioId }: IUpdateEstoqueRoloRequest) {
        return prismaClient.$transaction(async (tx) => {
            const rolo = await tx.estoqueRolo.findUnique({
                where: { id }
            });

            if (!rolo) {
                throw new Error("Rolo não encontrado.");
            }

            const pesoAtualBanco = rolo.pesoAtualKg.toNumber();

            if (pesoAtualKg !== undefined) {
                // if (pesoAtualKg > rolo.pesoInicialKg.toNumber()) {
                //     throw new Error("Peso atual não pode ser maior que o peso inicial.");
                // }

                if (pesoAtualKg < 0) {
                    throw new Error("Peso atual não pode ser negativo.");
                }
            }

            // Atualizar o rolo
            await tx.estoqueRolo.update({
                where: { id },
                data: {
                    pesoAtualKg,
                    situacao
                }
            });

            // Registrar movimentação automática se houver alteração de peso
            if (pesoAtualKg !== undefined) {
                const diferenca = Number((pesoAtualKg - pesoAtualBanco).toFixed(3));

                if (diferenca !== 0) {
                    if (!usuarioId) {
                        throw new Error("usuarioId é obrigatório para registrar movimentação.");
                    }

                    await tx.movimentacaoEstoque.create({
                        data: {
                            estoqueRoloId: rolo.id,
                            usuarioId,
                            tipoMovimentacao: diferenca > 0 ? "entrada" : "saida",
                            pesoMovimentado: Math.abs(diferenca)
                        }
                    });
                }
            }

            // Re-buscar o rolo com todas as movimentações atualizadas
            const roloAtualizado = await tx.estoqueRolo.findUnique({
                where: { id },
                include: {
                    tecido: {
                        include: {
                            fornecedor: true,
                            cor: true
                        }
                    },
                    movimentacoes: {
                        include: {
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
                            createdAt: "desc"
                        }
                    }
                }
            });

            return roloAtualizado;
        });
    }
}

class DeleteEstoqueRoloService {
    async execute(id: string) {
        const rolo = await prismaClient.estoqueRolo.findUnique({
            where: { id },
            include: {
                movimentacoes: true
            }
        });

        if (!rolo) {
            throw new Error("Rolo não encontrado.");
        }

        if (rolo.movimentacoes.length > 0) {
            throw new Error("Não é possível deletar um rolo que possui movimentações associadas.");
        }

        await prismaClient.estoqueRolo.delete({
            where: { id }
        });

        return { message: "Rolo deletado com sucesso." };
    }
}

class GetRelatorioEstoqueService {
    async execute() {
        const rolos = await prismaClient.estoqueRolo.findMany({
            include: {
                tecido: true
            }
        });

        const movimentacoes = await prismaClient.movimentacaoEstoque.findMany({
            where: {
                createdAt: {
                    gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
                }
            }
        });

        const totalRolos = rolos.length;
        const pesoTotal = rolos.reduce((acc: number, rolo: { pesoAtualKg: { toString: () => string; }; }) => acc + parseFloat(rolo.pesoAtualKg.toString()), 0);
        const rolosDisponíveis = rolos.filter((r: { situacao: string; }) => r.situacao === "disponivel").length;
        const rolosReservados = rolos.filter((r: { situacao: string; }) => r.situacao === "reservado").length;
        const rolosEmUso = rolos.filter((r: { situacao: string; }) => r.situacao === "em_uso").length;
        const movimentacoesMes = movimentacoes.length;

        // Encontrar tecido com maior estoque
        let tecidoComMaiorEstoque = "N/A";
        if (rolos.length > 0) {
            const estoquePorTecido = rolos.reduce((acc: { [x: string]: any; }, rolo: { tecidoId: any; pesoAtualKg: { toString: () => string; }; }) => {
                const tecidoId = rolo.tecidoId;
                acc[tecidoId] = (acc[tecidoId] || 0) + parseFloat(rolo.pesoAtualKg.toString());
                return acc;
            }, {} as Record<string, number>);

            const roloComMaiorEstoque = rolos.find((r: { tecidoId: string | number; }) => estoquePorTecido[r.tecidoId] === Math.max(...Object.values(estoquePorTecido).map(Number)));
            if (roloComMaiorEstoque && roloComMaiorEstoque.tecido) {
                tecidoComMaiorEstoque = roloComMaiorEstoque.tecido.nome;
            }
        }

        return {
            totalRolos,
            pesoTotal: parseFloat(pesoTotal.toFixed(3)),
            tecidoComMaiorEstoque,
            rolosDisponíveis,
            rolosReservados,
            rolosEmUso,
            movimentacoesMes
        };
    }
}

export { CreateEstoqueRoloService, ListAllEstoqueRoloService, ListByIdEstoqueRoloService, UpdateEstoqueRoloService, DeleteEstoqueRoloService, GetRelatorioEstoqueService };
