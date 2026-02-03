import { ICreateDirecionamentoRequest, IUpdateDirecionamentoRequest } from "../../interfaces/IProducao";
import prismaClient from "../../prisma";

class CreateDirecionamentoService {
    async execute({ loteProducaoId, faccaoId, tipoServico, dataSaida, dataPrevisaoRetorno }: ICreateDirecionamentoRequest) {
        // Verificar se lote existe
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id: loteProducaoId }
        });

        if (!lote) {
            throw new Error("Lote não encontrado.");
        }

        // Verificar se facção existe
        const faccao = await prismaClient.faccao.findUnique({
            where: { id: faccaoId }
        });

        if (!faccao) {
            throw new Error("Facção não encontrada.");
        }

        // Verificar status da facção
        if (faccao.status !== "ativo") {
            throw new Error("Facção inativa. Não é possível enviar direcionamentos.");
        }

        // Criar direcionamento
        const direcionamento = await prismaClient.direcionamento.create({
            data: {
                loteProducaoId,
                faccaoId,
                tipoServico,
                dataSaida: dataSaida ? new Date(dataSaida) : new Date(),
                dataPrevisaoRetorno: dataPrevisaoRetorno ? new Date(dataPrevisaoRetorno) : undefined,
                status: "enviado"
            },
            include: {
                lote: {
                    include: {
                        produto: true,
                        tecido: true
                    }
                },
                faccao: true,
                conferencias: true
            }
        });

        return direcionamento;
    }
}

class ListAllDirecionamentoService {
    async execute(status?: string, faccaoId?: string) {
        const direcionamentos = await prismaClient.direcionamento.findMany({
            where: {
                ...(status && { status }),
                ...(faccaoId && { faccaoId })
            },
            include: {
                lote: {
                    include: {
                        produto: true,
                        tecido: true
                    }
                },
                faccao: true,
                conferencias: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return direcionamentos;
    }
}

class ListByIdDirecionamentoService {
    async execute(id: string) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            include: {
                lote: {
                    include: {
                        produto: true,
                        tecido: true,
                        responsavel: true,
                        items: {
                            include: {
                                tamanho: true
                            }
                        }
                    }
                },
                faccao: true,
                conferencias: {
                    include: {
                        responsavel: true,
                        items: {
                            include: {
                                tamanho: true
                            }
                        }
                    }
                }
            }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento não encontrado.");
        }

        return direcionamento;
    }
}

class UpdateDirecionamentoService {
    async execute(id: string, { status, dataSaida, dataPrevisaoRetorno }: IUpdateDirecionamentoRequest) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento não encontrado.");
        }

        // Validar transições de status
        const statusValidos: Record<string, string[]> = {
            "enviado": ["em_processamento", "cancelado"],
            "em_processamento": ["finalizado"],
            "finalizado": [],
            "cancelado": []
        };

        if (status && !statusValidos[direcionamento.status]?.includes(status)) {
            throw new Error(`Não é permitido mudar status de '${direcionamento.status}' para '${status}'.`);
        }

        const direcionamentoAtualizado = await prismaClient.direcionamento.update({
            where: { id },
            data: {
                status,
                dataSaida: dataSaida ? new Date(dataSaida) : undefined,
                dataPrevisaoRetorno: dataPrevisaoRetorno ? new Date(dataPrevisaoRetorno) : undefined
            },
            include: {
                lote: {
                    include: {
                        produto: true,
                        tecido: true
                    }
                },
                faccao: true,
                conferencias: true
            }
        });

        return direcionamentoAtualizado;
    }
}

class DeleteDirecionamentoService {
    async execute(id: string) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            include: {
                conferencias: true
            }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento não encontrado.");
        }

        if (direcionamento.conferencias.length > 0) {
            throw new Error("Não é possível deletar um direcionamento que possui conferências associadas.");
        }

        await prismaClient.direcionamento.delete({
            where: { id }
        });

        return { message: "Direcionamento deletado com sucesso." };
    }
}

export { CreateDirecionamentoService, ListAllDirecionamentoService, ListByIdDirecionamentoService, UpdateDirecionamentoService, DeleteDirecionamentoService };
