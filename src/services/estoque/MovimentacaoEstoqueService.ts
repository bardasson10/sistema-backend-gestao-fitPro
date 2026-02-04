import { ICreateMovimentacaoEstoqueRequest } from "../../interfaces/IEstoque";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

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
    async execute(estoqueRoloId?: string, tipoMovimentacao?: string, dataInicio?: string, dataFim?: string, page?: number | string, limit?: number | string): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const [movimentacoes, total] = await Promise.all([
            prismaClient.movimentacaoEstoque.findMany({
                where: {
                    ...(estoqueRoloId && { estoqueRoloId }),
                    ...(tipoMovimentacao && { tipoMovimentacao }),
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
                            tecido: true
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
                    ...(dataInicio || dataFim ? {
                        createdAt: {
                            ...(dataInicio && { gte: new Date(dataInicio) }),
                            ...(dataFim && { lte: new Date(dataFim) })
                        }
                    } : {})
                }
            })
        ]);

        return createPaginatedResponse(movimentacoes, total, pageNumber, pageLimit);
    }
}

class ListByIdMovimentacaoEstoqueService {
    async execute(id: string) {
        const movimentacao = await prismaClient.movimentacaoEstoque.findUnique({
            where: { id },
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

        if (!movimentacao) {
            throw new Error("Movimentação não encontrada.");
        }

        return movimentacao;
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

        let pesoRastreado = rolo.pesoInicialKg;
        const historico = movimentacoes.map((mov) => {
            let novoPheso = pesoRastreado;
            const peso = typeof mov.pesoMovimentado === 'number' ? mov.pesoMovimentado : mov.pesoMovimentado?.toNumber() || 0;

            if (mov.tipoMovimentacao === "entrada") {
                novoPheso = pesoRastreado.plus(peso);
            } else if (mov.tipoMovimentacao === "saida" || mov.tipoMovimentacao === "devolucao") {
                novoPheso = pesoRastreado.minus(peso);
            } else if (mov.tipoMovimentacao === "ajuste") {
                novoPheso = pesoRastreado.constructor(peso);
            }

            pesoRastreado = novoPheso;

            return {
                ...mov,
                pesoAntesMovimentacao: (typeof pesoRastreado === 'number' ? pesoRastreado : pesoRastreado?.toNumber?.() ?? 0) - (mov.tipoMovimentacao === "entrada" ? peso : 0),
                pesoDepoisMovimentacao: novoPheso
            };
        });

        return {
            rolo,
            historico,
            pesoAtual: rolo.pesoAtualKg,
            pesoInicial: rolo.pesoInicialKg,
            pesoConsumido: rolo.pesoInicialKg.toNumber() - rolo.pesoAtualKg.toNumber()
        };
    }
}

export { CreateMovimentacaoEstoqueService, ListAllMovimentacaoEstoqueService, ListByIdMovimentacaoEstoqueService, GetHistoricoRoloService };
