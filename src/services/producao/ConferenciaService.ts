import { ICreateConferenciaRequest, IUpdateConferenciaRequest } from "../../interfaces/IProducao";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

const conferenciaDirecionamentoInclude = {
    faccao: true,
    items: {
        include: {
            estoqueCorte: {
                include: {
                    lote: true,
                    produto: true,
                    tamanho: true,
                    cor: true
                }
            }
        }
    }
} as const;

const conferenciaItemsInclude = {
    direcionamentoItem: {
        include: {
            estoqueCorte: {
                include: {
                    lote: true,
                    produto: true,
                    tamanho: true,
                    cor: true
                }
            }
        }
    }
} as const;

interface IConferenciaResponse {
    id: string;
    dataConferencia: string | null;
    statusQualidade: string | null;
    observacao: string | null;
    liberadoPagamento: boolean;
    responsavel: {
        id: string;
        nome: string;
    };
    direcionamento: {
        id: string;
        tipoServico: string;
        status: string;
        dataSaida: string | null;
        faccao: {
            id: string;
            nome: string;
        };
    };
    items: Array<{
        id: string;
        quantidadeEnviada: number;
        qtdRecebida: number;
        qtdDefeito: number;
        quebra: number;
        produto: {
            id: string;
            nome: string;
            sku: string;
        };
        tamanho: string;
        cor: {
            nome: string;
            codigoHex: string | null;
        };
        lote: string;
    }>;
}

function mapConferenciaToResponse(conferencia: any): IConferenciaResponse {
    return {
        id: conferencia.id,
        dataConferencia: conferencia.dataConferencia ? conferencia.dataConferencia.toISOString().split('T')[0] : null,
        statusQualidade: conferencia.status,
        observacao: conferencia.observacao,
        liberadoPagamento: conferencia.liberadoPagamento,
        responsavel: {
            id: conferencia.responsavel.id,
            nome: conferencia.responsavel.nome
        },
        direcionamento: {
            id: conferencia.direcionamento.id,
            tipoServico: conferencia.direcionamento.tipoServico,
            status: conferencia.direcionamento.status,
            dataSaida: conferencia.direcionamento.dataSaida ? conferencia.direcionamento.dataSaida.toISOString().split('T')[0] : null,
            faccao: {
                id: conferencia.direcionamento.faccao.id,
                nome: conferencia.direcionamento.faccao.nome
            }
        },
        items: conferencia.items.map((item: any) => {
            const quantidadeEnviada = item.direcionamentoItem.quantidade || 0;
            const quebra = quantidadeEnviada - (item.qtdRecebida + item.qtdDefeito);

            return {
                id: item.id,
                quantidadeEnviada,
                qtdRecebida: item.qtdRecebida,
                qtdDefeito: item.qtdDefeito,
                quebra,
                produto: {
                    id: item.direcionamentoItem.estoqueCorte.produto.id,
                    nome: item.direcionamentoItem.estoqueCorte.produto.nome,
                    sku: item.direcionamentoItem.estoqueCorte.produto.sku
                },
                tamanho: item.direcionamentoItem.estoqueCorte.tamanho.nome,
                cor: {
                    nome: item.direcionamentoItem.estoqueCorte.cor.nome,
                    codigoHex: item.direcionamentoItem.estoqueCorte.cor.codigoHex
                },
                lote: item.direcionamentoItem.estoqueCorte.lote.codigoLote
            };
        })
    };
}

class CreateConferenciaService {
    async execute({ direcionamentoId, responsavelId, dataConferencia, statusQualidade, liberadoPagamento, observacao, items }: ICreateConferenciaRequest) {
        // Verificar se direcionamento existe
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id: direcionamentoId }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento não encontrado.");
        }

        // Verificar se responsável existe
        const responsavel = await prismaClient.usuario.findUnique({
            where: { id: responsavelId }
        });

        if (!responsavel) {
            throw new Error("Responsável não encontrado.");
        }

        if (items?.length) {
            const direcionamentoItemIds = [...new Set(items.map(item => item.direcionamentoItemId))];
            const itensDirecionamento = await prismaClient.direcionamentoItem.findMany({
                where: {
                    id: { in: direcionamentoItemIds },
                    direcionamentoId
                },
                select: { id: true }
            });

            if (itensDirecionamento.length !== direcionamentoItemIds.length) {
                throw new Error("Um ou mais itens não pertencem ao direcionamento informado.");
            }
        }

        // Validar regra: só pode liberar pagamento se statusQualidade for "conforme"
        const statusFinal = statusQualidade || "validando";
        const liberadoFinal = liberadoPagamento !== undefined ? liberadoPagamento : false;
        
        if (liberadoFinal && statusFinal !== "conforme") {
            throw new Error("Não é possível liberar pagamento para conferências não conformes.");
        }

        // Criar conferência com items
        const conferencia = await prismaClient.conferencia.create({
            data: {
                direcionamentoId,
                responsavelId,
                dataConferencia: dataConferencia ? new Date(dataConferencia) : new Date(),
            status: statusFinal,
                observacao,
                liberadoPagamento: liberadoFinal,
                items: items ? {
                    create: items.map(item => ({
                        direcionamentoItemId: item.direcionamentoItemId,
                        qtdRecebida: item.qtdRecebida,
                        qtdDefeito: item.qtdDefeito || 0
                    }))
                } : undefined
            },
            include: {
                direcionamento: {
                    include: conferenciaDirecionamentoInclude
                },
                responsavel: true,
                items: {
                    include: conferenciaItemsInclude
                }
            }
        });

        return mapConferenciaToResponse(conferencia);
    }
}

class ListAllConferenciaService {
    async execute(statusQualidade?: string, liberadoPagamento?: boolean, page?: number | string, limit?: number | string): Promise<PaginatedResponse<IConferenciaResponse>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        // Por padrão, mostrar apenas conferências que:
        // - NÃO estão em (statusQualidade === "conforme" AND liberadoPagamento === true)
        // Ou seja, mostrar as que ainda precisam de ação
        let whereCondition: any = {};
        
        if (statusQualidade || liberadoPagamento !== undefined) {
            // Se filtros são passados, usar eles
            whereCondition = {
                ...(statusQualidade && { status: statusQualidade }),
                ...(liberadoPagamento !== undefined && { liberadoPagamento })
            };
        } else {
            // Padrão: NãO mostrar conferencias finalizadas (conforme + pagamento liberado)
            whereCondition = {
                NOT: {
                    AND: [
                        { status: "conforme" },
                        { liberadoPagamento: true }
                    ]
                }
            };
        }

        const [conferencias, total] = await Promise.all([
            prismaClient.conferencia.findMany({
                where: whereCondition,
                include: {
                    direcionamento: {
                        include: conferenciaDirecionamentoInclude
                    },
                    responsavel: true,
                    items: {
                        include: conferenciaItemsInclude
                    }
                },
                skip,
                take: pageLimit,
                orderBy: {
                    dataConferencia: "desc"
                }
            }),
            prismaClient.conferencia.count({
                where: whereCondition
            })
        ]);

        const conferenciasFormatadas = conferencias.map(mapConferenciaToResponse);
        return createPaginatedResponse(conferenciasFormatadas, total, pageNumber, pageLimit);
    }
}

class ListByIdConferenciaService {
    async execute(id: string): Promise<IConferenciaResponse> {
        const conferencia = await prismaClient.conferencia.findUnique({
            where: { id },
            include: {
                direcionamento: {
                    include: conferenciaDirecionamentoInclude
                },
                responsavel: true,
                items: {
                    include: conferenciaItemsInclude
                }
            }
        });

        if (!conferencia) {
            throw new Error("Conferência não encontrada.");
        }

        return mapConferenciaToResponse(conferencia);
    }
}

class UpdateConferenciaService {
    async execute(id: string, { direcionamentoId, responsavelId, dataConferencia, statusQualidade, liberadoPagamento, observacao, items }: IUpdateConferenciaRequest): Promise<IConferenciaResponse> {
        const conferencia = await prismaClient.conferencia.findUnique({
            where: { id }
        });

        if (!conferencia) {
            throw new Error("Conferência não encontrada.");
        }

        const statusFinal = statusQualidade ?? conferencia.status;
        if (liberadoPagamento === true && statusFinal !== "conforme") {
            throw new Error("Não é possível liberar pagamento para conferências não conforme.");
        }

        const conferenciaAtualizada = await prismaClient.$transaction(async (tx) => {
            if (direcionamentoId) {
                const direcionamento = await tx.direcionamento.findUnique({
                    where: { id: direcionamentoId }
                });
                if (!direcionamento) {
                    throw new Error("Direcionamento não encontrado.");
                }
            }

            if (responsavelId) {
                const responsavel = await tx.usuario.findUnique({
                    where: { id: responsavelId }
                });
                if (!responsavel) {
                    throw new Error("Responsável não encontrado.");
                }
            }

            if (items) {
                const direcionamentoAlvoId = direcionamentoId ?? conferencia.direcionamentoId;
                const direcionamentoItemIds = [...new Set(items.map(item => item.direcionamentoItemId))];
                const itensDirecionamento = await tx.direcionamentoItem.findMany({
                    where: {
                        id: { in: direcionamentoItemIds },
                        direcionamentoId: direcionamentoAlvoId
                    },
                    select: { id: true }
                });

                if (itensDirecionamento.length !== direcionamentoItemIds.length) {
                    throw new Error("Um ou mais itens não pertencem ao direcionamento informado.");
                }

                await tx.conferenciaItem.deleteMany({
                    where: { conferenciaId: id }
                });

                if (items.length > 0) {
                    await tx.conferenciaItem.createMany({
                        data: items.map(item => ({
                            conferenciaId: id,
                            direcionamentoItemId: item.direcionamentoItemId,
                            qtdRecebida: item.qtdRecebida,
                            qtdDefeito: item.qtdDefeito || 0
                        }))
                    });
                }
            }

            return tx.conferencia.update({
                where: { id },
                data: {
                    ...(direcionamentoId && { direcionamentoId }),
                    ...(responsavelId && { responsavelId }),
                    ...(dataConferencia && { dataConferencia: new Date(dataConferencia) }),
                    ...(statusQualidade && { status: statusQualidade }),
                    ...(liberadoPagamento !== undefined && { liberadoPagamento }),
                    ...(observacao !== undefined && { observacao })
                },
                include: {
                    direcionamento: {
                        include: conferenciaDirecionamentoInclude
                    },
                    responsavel: true,
                    items: {
                        include: conferenciaItemsInclude
                    }
                }
            });
        });

        return mapConferenciaToResponse(conferenciaAtualizada);
    }
}

class DeleteConferenciaService {
    async execute(id: string) {
        const conferencia = await prismaClient.conferencia.findUnique({
            where: { id },
            include: {
                items: true
            }
        });

        if (!conferencia) {
            throw new Error("Conferência não encontrada.");
        }

        // Deletar items primeiro
        await prismaClient.conferenciaItem.deleteMany({
            where: { conferenciaId: id }
        });

        // Deletar conferência
        await prismaClient.conferencia.delete({
            where: { id }
        });

        return { message: "Conferência deletada com sucesso." };
    }
}

class GetRelatorioProdutividadeService {
    async execute(dataInicio?: string, dataFim?: string) {
        const conferencias = await prismaClient.conferencia.findMany({
            where: {
                dataConferencia: {
                    ...(dataInicio && { gte: new Date(dataInicio) }),
                    ...(dataFim && { lte: new Date(dataFim) })
                }
            },
            include: {
                direcionamento: {
                    include: {
                        faccao: true
                    }
                },
                items: true
            }
        });

        // Calcular período baseado nas datas reais
        let periodoInicio = "início";
        let periodoFim = "hoje";

        if (conferencias.length > 0) {
            const dataSaidas = conferencias
                .map(c => c.direcionamento.dataSaida)
                .filter((d): d is Date => d !== null);

            if (dataSaidas.length > 0) {
                const menorDataSaida = new Date(Math.min(...dataSaidas.map(d => d.getTime())));
                periodoInicio = menorDataSaida.toISOString().split("T")[0] ?? "início";
            }

            const datasConferencia = conferencias
                .map(c => c.dataConferencia)
                .filter((d): d is Date => d !== null);

            if (datasConferencia.length > 0) {
                const maiorDataConferencia = new Date(Math.max(...datasConferencia.map(d => d.getTime())));
                periodoFim = maiorDataConferencia.toISOString().split("T")[0] || "hoje";
            }
        }

        const totalConferencias = conferencias.length;
        const conformes = conferencias.filter(c => c.status === "conforme").length;
        const naoConformes = conferencias.filter(c => c.status === "nao_conforme").length;
        const comDefeito = conferencias.filter(c => c.status === "com_defeito").length;
        const pagasAutorizadas = conferencias.filter(c => c.liberadoPagamento === true).length;

        // Agrupar por facção
        const porFaccao: Record<string, any> = {};
        conferencias.forEach(conf => {
            const faccaoNome = conf.direcionamento.faccao.nome;
            if (!porFaccao[faccaoNome]) {
                porFaccao[faccaoNome] = {
                    total: 0,
                    conforme: 0,
                    defeitos: 0
                };
            }
            porFaccao[faccaoNome].total++;
            if (conf.status === "conforme") porFaccao[faccaoNome].conforme++;
            if (conf.status === "com_defeito") porFaccao[faccaoNome].defeitos++;
        });

        return {
            periodo: {
                inicio: periodoInicio,
                fim: periodoFim
            },
            totalConferencias,
            conformes,
            naoConformes,
            comDefeito,
            taxaConformidade: totalConferencias > 0 ? (conformes / totalConferencias * 100).toFixed(2) + "%" : "0%",
            pagasAutorizadas,
            porFaccao
        };
    }
}

export { CreateConferenciaService, ListAllConferenciaService, ListByIdConferenciaService, UpdateConferenciaService, DeleteConferenciaService, GetRelatorioProdutividadeService };
export type { IConferenciaResponse };
