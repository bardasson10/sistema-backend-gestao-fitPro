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
                },
                include: {
                    tecido: {
                        include: {
                            fornecedor: true,
                            cor: true
                        }
                    },
                    movimentacoes: true
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

            return rolo;
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
                    movimentacoes: true
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
    async execute(id: string, { pesoAtualKg, situacao }: IUpdateEstoqueRoloRequest) {
        const rolo = await prismaClient.estoqueRolo.findUnique({
            where: { id }
        });

        if (!rolo) {
            throw new Error("Rolo não encontrado.");
        }

        // // Validar peso se for atualizar
        // if (
        //     pesoAtualKg !== undefined &&
        //     pesoAtualKg > Number(rolo.pesoInicialKg)
        // ) {
        //     throw new Error("Peso atual não pode ser maior que o peso inicial.");
        // }

        const roloAtualizado = await prismaClient.estoqueRolo.update({
            where: { id },
            data: {
                pesoAtualKg,
                situacao
            },
            include: {
                tecido: {
                    include: {
                        fornecedor: true,
                        cor: true
                    }
                },
                movimentacoes: true
            }
        });

        return roloAtualizado;
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
