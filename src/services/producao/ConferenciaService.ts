import { ICreateConferenciaRequest, IUpdateConferenciaRequest } from "../../interfaces/IProducao";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

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

        // Validar regra: só pode liberar pagamento se statusQualidade for "conforme"
        const statusFinal = statusQualidade || "conforme";
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
                statusQualidade: statusFinal,
                observacao,
                liberadoPagamento: liberadoFinal,
                items: items ? {
                    create: items.map(item => ({
                        tamanhoId: item.tamanhoId,
                        qtdRecebida: item.qtdRecebida,
                        qtdDefeito: item.qtdDefeito || 0
                    }))
                } : undefined
            },
            include: {
                direcionamento: {
                    include: {
                        lote: true,
                        faccao: true
                    }
                },
                responsavel: true,
                items: {
                    include: {
                        tamanho: true
                    }
                }
            }
        });

        return conferencia;
    }
}

class ListAllConferenciaService {
    async execute(statusQualidade?: string, liberadoPagamento?: boolean, page?: number | string, limit?: number | string): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const [conferencias, total] = await Promise.all([
            prismaClient.conferencia.findMany({
                where: {
                    ...(statusQualidade && { statusQualidade }),
                    ...(liberadoPagamento !== undefined && { liberadoPagamento })
                },
                include: {
                    direcionamento: {
                        include: {
                            lote: true,
                            faccao: true
                        }
                    },
                    responsavel: true,
                    items: {
                        include: {
                            tamanho: true
                        }
                    }
                },
                skip,
                take: pageLimit,
                orderBy: {
                    dataConferencia: "desc"
                }
            }),
            prismaClient.conferencia.count({
                where: {
                    ...(statusQualidade && { statusQualidade }),
                    ...(liberadoPagamento !== undefined && { liberadoPagamento })
                }
            })
        ]);

        return createPaginatedResponse(conferencias, total, pageNumber, pageLimit);
    }
}

class ListByIdConferenciaService {
    async execute(id: string) {
        const conferencia = await prismaClient.conferencia.findUnique({
            where: { id },
            include: {
                direcionamento: {
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
                        faccao: true
                    }
                },
                responsavel: true,
                items: {
                    include: {
                        tamanho: true
                    }
                }
            }
        });

        if (!conferencia) {
            throw new Error("Conferência não encontrada.");
        }

        return conferencia;
    }
}

class UpdateConferenciaService {
    async execute(id: string, { direcionamentoId, responsavelId, dataConferencia, statusQualidade, liberadoPagamento, observacao, items }: IUpdateConferenciaRequest) {
        const conferencia = await prismaClient.conferencia.findUnique({
            where: { id }
        });

        if (!conferencia) {
            throw new Error("Conferência não encontrada.");
        }

        const statusFinal = statusQualidade ?? conferencia.statusQualidade;
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
                await tx.conferenciaItem.deleteMany({
                    where: { conferenciaId: id }
                });

                if (items.length > 0) {
                    await tx.conferenciaItem.createMany({
                        data: items.map(item => ({
                            conferenciaId: id,
                            tamanhoId: item.tamanhoId,
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
                    ...(statusQualidade && { statusQualidade }),
                    ...(liberadoPagamento !== undefined && { liberadoPagamento }),
                    ...(observacao !== undefined && { observacao })
                },
                include: {
                    direcionamento: {
                        include: {
                            lote: true,
                            faccao: true
                        }
                    },
                    responsavel: true,
                    items: {
                        include: {
                            tamanho: true
                        }
                    }
                }
            });
        });

        return conferenciaAtualizada;
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
        const conformes = conferencias.filter(c => c.statusQualidade === "conforme").length;
        const naoConformes = conferencias.filter(c => c.statusQualidade === "nao_conforme").length;
        const comDefeito = conferencias.filter(c => c.statusQualidade === "com_defeito").length;
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
            if (conf.statusQualidade === "conforme") porFaccao[faccaoNome].conforme++;
            if (conf.statusQualidade === "com_defeito") porFaccao[faccaoNome].defeitos++;
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
