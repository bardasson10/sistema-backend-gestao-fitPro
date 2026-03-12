import { ICreateEstoqueRoloRequest, IUpdateEstoqueRoloRequest } from "../../interfaces/IEstoque";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

function formatarDataLoteParaCodigo(dataLote: string): string {
    const match = dataLote.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
        throw new Error("Data do lote deve estar no formato YYYY-MM-DD.");
    }

    const ano = match[1];
    const mes = match[2];
    const dia = match[3];

    if (!ano || !mes || !dia) {
        throw new Error("Data do lote inválida.");
    }

    const anoNumero = Number(ano);
    const mesNumero = Number(mes);
    const diaNumero = Number(dia);

    const dataValidacao = new Date(Date.UTC(anoNumero, mesNumero - 1, diaNumero));

    if (
        dataValidacao.getUTCFullYear() !== anoNumero
        || dataValidacao.getUTCMonth() + 1 !== mesNumero
        || dataValidacao.getUTCDate() !== diaNumero
    ) {
        throw new Error("Data do lote inválida.");
    }

    return `${dia}${mes}${ano.slice(-2)}`;
}

class CreateEstoqueRoloService {
    async execute({ tecidoId, prefixo, dataLote, rolos, situacao, usuarioId }: ICreateEstoqueRoloRequest) {
        return prismaClient.$transaction(async (tx) => {
            // Verificar se tecido existe
            const tecido = await tx.tecido.findUnique({
                where: { id: tecidoId }
            });

            if (!tecido) {
                throw new Error("Tecido não encontrado.");
            }

            const prefixoFormatado = prefixo.trim().toUpperCase();
            const dataLoteCodigo = formatarDataLoteParaCodigo(dataLote);
            const baseCodigo = `${prefixoFormatado}-${dataLoteCodigo}`;

            const codigosExistentes = await tx.estoqueRolo.findMany({
                where: {
                    codigoBarraRolo: {
                        startsWith: `${baseCodigo}-`
                    }
                },
                select: {
                    codigoBarraRolo: true
                }
            });

            const maiorSequenciaExistente = codigosExistentes.reduce((maior, item) => {
                if (!item.codigoBarraRolo) {
                    return maior;
                }

                const partesCodigo = item.codigoBarraRolo.split("-");
                const sufixo = partesCodigo[partesCodigo.length - 1];
                const sequencia = Number(sufixo);

                if (Number.isInteger(sequencia)) {
                    return Math.max(maior, sequencia);
                }

                return maior;
            }, 0);

            const idsCriados: string[] = [];

            for (const [index, item] of rolos.entries()) {
                const sequenciaAtual = maiorSequenciaExistente + index + 1;
                const codigoBarraRolo = `${baseCodigo}-${String(sequenciaAtual).padStart(3, "0")}`;
                const pesoInicialKg = Number(item.pesoInicialKg.toFixed(3));

                const rolo = await tx.estoqueRolo.create({
                    data: {
                        tecidoId,
                        codigoBarraRolo,
                        pesoInicialKg,
                        // No cadastro inicial, o peso atual é igual ao peso inicial.
                        pesoAtualKg: pesoInicialKg,
                        situacao: situacao || "disponivel"
                    }
                });

                await tx.movimentacaoEstoque.create({
                    data: {
                        estoqueRoloId: rolo.id,
                        usuarioId,
                        tipoMovimentacao: "entrada",
                        pesoMovimentado: pesoInicialKg
                    }
                });

                idsCriados.push(rolo.id);
            }

            const rolosCriados = await tx.estoqueRolo.findMany({
                where: {
                    id: {
                        in: idsCriados
                    }
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
                }
            });

            const rolosPorId = new Map(rolosCriados.map((rolo) => [rolo.id, rolo]));
            const rolosOrdenados = idsCriados
                .map((id) => rolosPorId.get(id))
                .filter((rolo): rolo is NonNullable<typeof rolo> => rolo !== undefined);

            return {
                message: `${rolosOrdenados.length} rolo(s) criado(s) com sucesso.`,
                rolos: rolosOrdenados
            };
        });
    }
}

//TODO melhorar essa response, dividir em 3 modulos conforme abas do frontend
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
