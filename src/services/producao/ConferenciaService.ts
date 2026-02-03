import { ICreateConferenciaRequest, IUpdateConferenciaRequest } from "../../interfaces/IProducao";
import prismaClient from "../../prisma";

class CreateConferenciaService {
    async execute({ direcionamentoId, responsavelId, dataConferencia, statusQualidade, observacao, items }: ICreateConferenciaRequest) {
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

        // Criar conferência com items
        const conferencia = await prismaClient.conferencia.create({
            data: {
                direcionamentoId,
                responsavelId,
                dataConferencia: dataConferencia ? new Date(dataConferencia) : new Date(),
                statusQualidade: statusQualidade || "conforme",
                observacao,
                liberadoPagamento: false,
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
    async execute(statusQualidade?: string, liberadoPagamento?: boolean) {
        const conferencias = await prismaClient.conferencia.findMany({
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
            orderBy: {
                dataConferencia: "desc"
            }
        });

        return conferencias;
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
                                produto: true,
                                tecido: true,
                                items: {
                                    include: {
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
    async execute(id: string, { dataConferencia, statusQualidade, liberadoPagamento, observacao }: IUpdateConferenciaRequest) {
        const conferencia = await prismaClient.conferencia.findUnique({
            where: { id }
        });

        if (!conferencia) {
            throw new Error("Conferência não encontrada.");
        }

        // Se mudar status para não conforme, não pode liberar pagamento
        if (statusQualidade && statusQualidade !== "conforme" && liberadoPagamento === true) {
            throw new Error("Não é possível liberar pagamento para conferências não conforme.");
        }

        const conferenciaAtualizada = await prismaClient.conferencia.update({
            where: { id },
            data: {
                dataConferencia: dataConferencia ? new Date(dataConferencia) : undefined,
                statusQualidade,
                liberadoPagamento,
                observacao
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
                inicio: dataInicio || "início",
                fim: dataFim || "hoje"
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
