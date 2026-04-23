import { ICreateEstoqueRoloRequest, IUpdateEstoqueRoloRequest } from "../../interfaces/IEstoque";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

function decimalToNumber(value: { toString: () => string } | null | undefined): number {
    return value ? parseFloat(value.toString()) : 0;
}

function getColorAbbreviation(colorName: string): string {
    return colorName.toUpperCase();
}

function getFabricInitials(tecidoNome: string): string {
    const palavras = tecidoNome
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (palavras.length === 0) {
        return "TEC";
    }

    return palavras.map((palavra) => palavra[0]).join("").toUpperCase();
}

function getFabricCode(tecidoNome: string, codigoReferencia?: string | null): string {
    if (codigoReferencia) {
        return codigoReferencia.trim().toUpperCase();
    }
    return getFabricInitials(tecidoNome);
}

function buildBaseCodigo(fabricCode: string, colorCode: string, dataLoteCodigo: string): string {
    const fabricParts = fabricCode
        .split("-")
        .map((part) => part.trim())
        .filter(Boolean);

    const lastPart = fabricParts[fabricParts.length - 1];
    const corJaNoCodigo = lastPart === colorCode;

    if (corJaNoCodigo) {
        return `${fabricCode}-${dataLoteCodigo}`;
    }

    return `${fabricCode}-${colorCode}-${dataLoteCodigo}`;
}

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
    async execute({ tecidoId, dataLote, rolos, situacao, usuarioId }: ICreateEstoqueRoloRequest) {
        return prismaClient.$transaction(async (tx) => {
            // Verificar se tecido existe
            const tecido = await tx.tecido.findUnique({
                where: { id: tecidoId },
                include: { cor: true }
            });

            if (!tecido) {
                throw new Error("Tecido não encontrado.");
            }

            const fabricCode = getFabricCode(tecido.nome, tecido.codigoReferencia);
            const colorAbbrev = getColorAbbreviation(tecido.cor?.nome || "");
            const dataLoteCodigo = formatarDataLoteParaCodigo(dataLote);
            const baseCodigo = buildBaseCodigo(fabricCode, colorAbbrev, dataLoteCodigo);

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
    async execute(
        tecidoId?: string,
        situacao?: string,
        page?: number | string,
        limit?: number | string,
        estoqueRoloId?: string,
        fornecedorId?: string,
        tipoMovimentacao?: string,
        dataInicio?: string,
        dataFim?: string
    ): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const filtroMovimentacao = {
            ...(tipoMovimentacao && { tipoMovimentacao }),
            ...(dataInicio || dataFim ? {
                createdAt: {
                    ...(dataInicio && { gte: new Date(dataInicio) }),
                    ...(dataFim && { lte: new Date(dataFim) })
                }
            } : {})
        };

        const [rolos, total] = await Promise.all([
            prismaClient.estoqueRolo.findMany({
                where: {
                    ...(tecidoId && { tecidoId }),
                    ...(situacao && { situacao }),
                    ...(estoqueRoloId && { id: estoqueRoloId }),
                    ...(fornecedorId && {
                        tecido: {
                            fornecedorId
                        }
                    }),
                    ...(tipoMovimentacao || dataInicio || dataFim ? {
                        movimentacoes: {
                            some: filtroMovimentacao
                        }
                    } : {}),
                    pesoAtualKg: {
                        gt: 0
                    }
                },
                include: {
                    tecido: {
                        include: {
                            fornecedor: true,
                            cor: true
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
                    ...(situacao && { situacao }),
                    ...(estoqueRoloId && { id: estoqueRoloId }),
                    ...(fornecedorId && {
                        tecido: {
                            fornecedorId
                        }
                    }),
                    ...(tipoMovimentacao || dataInicio || dataFim ? {
                        movimentacoes: {
                            some: filtroMovimentacao
                        }
                    } : {}),
                    pesoAtualKg: {
                        gt: 0
                    }
                }
            })
        ]);

        const response = createPaginatedResponse(rolos, total, pageNumber, pageLimit) as any;
        response.pagination.totalPages = response.pagination.pages;
        return response;
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
        await prismaClient.$transaction(async (tx) => {
            const rolo = await tx.estoqueRolo.findUnique({
                where: { id },
                include: {
                    movimentacoes: true
                }
            });

            if (!rolo) {
                throw new Error("Rolo não encontrado.");
            }

            const temMovimentacaoNaoEntrada = rolo.movimentacoes.some(
                (mov) => mov.tipoMovimentacao !== "entrada"
            );

            if (temMovimentacaoNaoEntrada) {
                throw new Error("Não é possível deletar um rolo que possui movimentações de saída/ajuste/devolução.");
            }

            if (rolo.movimentacoes.length > 0) {
                await tx.movimentacaoEstoque.deleteMany({
                    where: {
                        estoqueRoloId: id
                    }
                });
            }

            await tx.estoqueRolo.delete({
                where: { id }
            });
        });

        return { message: "Rolo deletado com sucesso." };
    }
}

class GetRelatorioEstoqueService {
    async execute(
        tecidoId?: string,
        situacao?: string,
        estoqueRoloId?: string,
        fornecedorId?: string,
        tipoMovimentacao?: string,
        dataInicio?: string,
        dataFim?: string,
        _page?: number | string,
        _limit?: number | string
    ) {
        const filtroMovimentacao = {
            ...(tipoMovimentacao && { tipoMovimentacao }),
            ...(dataInicio || dataFim ? {
                createdAt: {
                    ...(dataInicio && { gte: new Date(dataInicio) }),
                    ...(dataFim && { lte: new Date(dataFim) })
                }
            } : {})
        };

        const rolos = await prismaClient.estoqueRolo.findMany({
            where: {
                ...(tecidoId && { tecidoId }),
                ...(situacao && { situacao }),
                ...(estoqueRoloId && { id: estoqueRoloId }),
                ...(fornecedorId && {
                    tecido: {
                        fornecedorId
                    }
                }),
                ...(tipoMovimentacao || dataInicio || dataFim ? {
                    movimentacoes: {
                        some: filtroMovimentacao
                    }
                } : {})
            },
            include: {
                tecido: true
            }
        });

        const movimentacoes = await prismaClient.movimentacaoEstoque.findMany({
            where: {
                ...(estoqueRoloId && { estoqueRoloId }),
                ...(filtroMovimentacao),
                ...((tecidoId || situacao || fornecedorId) && {
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
                })
            },
            include: {
                rolo: {
                    include: {
                        tecido: {
                            select: {
                                valorPorKg: true
                            }
                        }
                    }
                }
            }
        });

        const totalRolos = rolos.length;
        const pesoTotalEstoque = rolos.reduce((acc: number, rolo: { pesoAtualKg: { toString: () => string; }; }) => acc + parseFloat(rolo.pesoAtualKg.toString()), 0);
        const valorTotalEstoque = rolos.reduce((acc: number, rolo: { pesoAtualKg: { toString: () => string; }; tecido: { valorPorKg: { toString: () => string; } | null; }; }) => {
            const pesoAtualKg = parseFloat(rolo.pesoAtualKg.toString());
            const valorPorKg = rolo.tecido?.valorPorKg ? parseFloat(rolo.tecido.valorPorKg.toString()) : 0;
            return acc + (pesoAtualKg * valorPorKg);
        }, 0);
        const pesoTotalMovimentado = movimentacoes.reduce((acc: number, mov: any) => acc + decimalToNumber(mov.pesoMovimentado), 0);
        const valorTotalMovimentado = movimentacoes.reduce((acc: number, mov: any) => {
            const pesoMovimentado = decimalToNumber(mov.pesoMovimentado);
            const valorPorKg = decimalToNumber(mov.rolo?.tecido?.valorPorKg);
            return acc + (pesoMovimentado * valorPorKg);
        }, 0);
        const usarTotaisMovimentacaoSaida = tipoMovimentacao === "saida";
        const rolosDisponiveis = rolos.filter((r: { situacao: string; }) => r.situacao === "disponivel").length;
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
            pesoTotal: parseFloat((usarTotaisMovimentacaoSaida ? pesoTotalMovimentado : pesoTotalEstoque).toFixed(3)),
            valorTotalEstoque: parseFloat((usarTotaisMovimentacaoSaida ? valorTotalMovimentado : valorTotalEstoque).toFixed(2)),
            tecidoComMaiorEstoque,
            rolosDisponiveis,
            rolosReservados,
            rolosEmUso,
            movimentacoesMes
        };
    }
}

class GetResumoEstoqueRolosService {
    async execute(
        fornecedorId?: string,
        tecidoId?: string,
        page?: number | string,
        limit?: number | string,
        estoqueRoloId?: string,
        tipoMovimentacao?: string,
        dataInicio?: string,
        dataFim?: string
    ): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);
        const tipoMovimentacaoPadrao = tipoMovimentacao || "entrada";
        const resumoMovimentacaoSaida = tipoMovimentacaoPadrao === "saida";

        const filtroMovimentacao = {
            ...(tipoMovimentacaoPadrao && { tipoMovimentacao: tipoMovimentacaoPadrao }),
            ...(dataInicio || dataFim ? {
                createdAt: {
                    ...(dataInicio && { gte: new Date(dataInicio) }),
                    ...(dataFim && { lte: new Date(dataFim) })
                }
            } : {})
        };

        if (resumoMovimentacaoSaida) {
            const movimentacoes = await prismaClient.movimentacaoEstoque.findMany({
                where: {
                    ...(estoqueRoloId && { estoqueRoloId }),
                    ...(filtroMovimentacao),
                    ...((tecidoId || fornecedorId) && {
                        rolo: {
                            is: {
                                ...(tecidoId && { tecidoId }),
                                ...(fornecedorId && {
                                    tecido: {
                                        is: {
                                            fornecedorId
                                        }
                                    }
                                })
                            }
                        }
                    })
                },
                include: {
                    rolo: {
                        include: {
                            tecido: {
                                include: {
                                    cor: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc"
                }
            });

            const resumoPorTecido = movimentacoes.reduce((acc: any, mov: any) => {
                const rolo = mov.rolo;
                const tecido = rolo?.tecido;
                if (!rolo || !tecido) {
                    return acc;
                }

                const tecidoIdAtual = rolo.tecidoId;

                if (!acc[tecidoIdAtual]) {
                    acc[tecidoIdAtual] = {
                        tecidoId: tecidoIdAtual,
                        tecido,
                        rolosUnicos: new Set<string>(),
                        pesoTotalRolos: 0,
                        valorTotalRolos: 0
                    };
                }

                const pesoMovimentado = decimalToNumber(mov.pesoMovimentado);
                const valorPorKg = decimalToNumber(tecido.valorPorKg);

                acc[tecidoIdAtual].rolosUnicos.add(rolo.id);
                acc[tecidoIdAtual].pesoTotalRolos += pesoMovimentado;
                acc[tecidoIdAtual].valorTotalRolos += pesoMovimentado * valorPorKg;

                return acc;
            }, {});

            const resumoArray = Object.values(resumoPorTecido).map((item: any) => ({
                qtdTotalRolos: item.rolosUnicos.size,
                pesoTotalRolos: parseFloat(item.pesoTotalRolos.toFixed(3)),
                valorTotalRolos: parseFloat(item.valorTotalRolos.toFixed(2)),
                tecido: {
                    id: item.tecido.id,
                    nome: item.tecido.nome,
                    codigoReferencia: item.tecido.codigoReferencia,
                    cor: {
                        id: item.tecido.cor?.id,
                        nome: item.tecido.cor?.nome,
                        codigoHex: item.tecido.cor?.codigoHex
                    }
                }
            }));

            const totalItems = resumoArray.length;
            const paginatedData = resumoArray.slice(skip, skip + pageLimit);

            const response = createPaginatedResponse(paginatedData, totalItems, pageNumber, pageLimit) as any;
            response.pagination.totalPages = response.pagination.pages;
            return response;
        }

        const movimentacoes = await prismaClient.movimentacaoEstoque.findMany({
            where: {
                ...(estoqueRoloId && { estoqueRoloId }),
                ...(filtroMovimentacao),
                ...((tecidoId || fornecedorId) && {
                    rolo: {
                        is: {
                            ...(tecidoId && { tecidoId }),
                            ...(fornecedorId && {
                                tecido: {
                                    is: {
                                        fornecedorId
                                    }
                                }
                            })
                        }
                    }
                })
            },
            include: {
                rolo: {
                    include: {
                        tecido: {
                            include: {
                                cor: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        const resumoPorTecido = movimentacoes.reduce((acc: any, mov: any) => {
            const rolo = mov.rolo;
            const tecido = rolo?.tecido;
            if (!rolo || !tecido) {
                return acc;
            }

            const tecidoIdAtual = rolo.tecidoId;

            if (!acc[tecidoIdAtual]) {
                acc[tecidoIdAtual] = {
                    tecidoId: tecidoIdAtual,
                    tecido,
                    rolosUnicos: new Set<string>(),
                    pesoTotalRolos: 0,
                    valorTotalRolos: 0
                };
            }

            const pesoMovimentado = decimalToNumber(mov.pesoMovimentado);
            const valorPorKg = decimalToNumber(tecido.valorPorKg);

            acc[tecidoIdAtual].rolosUnicos.add(rolo.id);
            acc[tecidoIdAtual].pesoTotalRolos += pesoMovimentado;
            acc[tecidoIdAtual].valorTotalRolos += pesoMovimentado * valorPorKg;

            return acc;
        }, {});

        const resumoArray = Object.values(resumoPorTecido).map((item: any) => ({
            qtdTotalRolos: item.rolosUnicos.size,
            pesoTotalRolos: parseFloat(item.pesoTotalRolos.toFixed(3)),
            valorTotalRolos: parseFloat(item.valorTotalRolos.toFixed(2)),
            tecido: {
                id: item.tecido.id,
                nome: item.tecido.nome,
                codigoReferencia: item.tecido.codigoReferencia,
                cor: {
                    id: item.tecido.cor?.id,
                    nome: item.tecido.cor?.nome,
                    codigoHex: item.tecido.cor?.codigoHex
                }
            }
        }));

        // Aplicar paginação no array processado
        const totalItems = resumoArray.length;
        const paginatedData = resumoArray.slice(skip, skip + pageLimit);

        const response = createPaginatedResponse(paginatedData, totalItems, pageNumber, pageLimit) as any;
        response.pagination.totalPages = response.pagination.pages;
        return response;
    }
}

export { CreateEstoqueRoloService, ListAllEstoqueRoloService, ListByIdEstoqueRoloService, UpdateEstoqueRoloService, DeleteEstoqueRoloService, GetRelatorioEstoqueService, GetResumoEstoqueRolosService };
