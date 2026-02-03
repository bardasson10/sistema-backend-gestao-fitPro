import { ICreateLoteProducaoRequest, IUpdateLoteProducaoRequest } from "../../interfaces/IProducao";
import prismaClient from "../../prisma";

class CreateLoteProducaoService {
    async execute({ codigoLote, produtoId, tecidoId, responsavelId, status, observacao, items }: ICreateLoteProducaoRequest) {
        // Verificar se código de lote já existe
        const loteAlreadyExists = await prismaClient.loteProducao.findUnique({
            where: { codigoLote }
        });

        if (loteAlreadyExists) {
            throw new Error("Lote com este código já existe.");
        }

        // Verificar se produto existe
        const produto = await prismaClient.produto.findUnique({
            where: { id: produtoId }
        });

        if (!produto) {
            throw new Error("Produto não encontrado.");
        }

        // Verificar se tecido existe
        const tecido = await prismaClient.tecido.findUnique({
            where: { id: tecidoId }
        });

        if (!tecido) {
            throw new Error("Tecido não encontrado.");
        }

        // Verificar se responsável existe
        const responsavel = await prismaClient.usuario.findUnique({
            where: { id: responsavelId }
        });

        if (!responsavel) {
            throw new Error("Responsável não encontrado.");
        }

        // Criar lote com items
        const lote = await prismaClient.loteProducao.create({
            data: {
                codigoLote,
                produtoId,
                tecidoId,
                responsavelId,
                status: status || "planejado",
                observacao,
                items: items ? {
                    create: items.map(item => ({
                        tamanhoId: item.tamanhoId,
                        quantidadePlanejada: item.quantidadePlanejada
                    }))
                } : undefined
            },
            include: {
                produto: true,
                tecido: true,
                responsavel: true,
                items: {
                    include: {
                        tamanho: true
                    }
                },
                direcionamentos: true
            }
        });

        return lote;
    }
}

class ListAllLoteProducaoService {
    async execute(status?: string, responsavelId?: string) {
        const lotes = await prismaClient.loteProducao.findMany({
            where: {
                ...(status && { status }),
                ...(responsavelId && { responsavelId })
            },
            include: {
                produto: true,
                tecido: true,
                responsavel: true,
                items: {
                    include: {
                        tamanho: true
                    }
                },
                direcionamentos: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return lotes;
    }
}

class ListByIdLoteProducaoService {
    async execute(id: string) {
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id },
            include: {
                produto: true,
                tecido: true,
                responsavel: true,
                items: {
                    include: {
                        tamanho: true
                    }
                },
                direcionamentos: {
                    include: {
                        faccao: true,
                        conferencias: true
                    }
                }
            }
        });

        if (!lote) {
            throw new Error("Lote não encontrado.");
        }

        return lote;
    }
}

class UpdateLoteProducaoService {
    async execute(id: string, { status, observacao }: IUpdateLoteProducaoRequest) {
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id }
        });

        if (!lote) {
            throw new Error("Lote não encontrado.");
        }

        // Validar transições de status
        const statusValidos: Record<string, string[]> = {
            "planejado": ["em_producao", "cancelado"],
            "em_producao": ["concluido", "cancelado"],
            "concluido": [],
            "cancelado": []
        };

        if (status && !statusValidos[lote.status]?.includes(status)) {
            throw new Error(`Não é permitido mudar status de '${lote.status}' para '${status}'.`);
        }

        const loteAtualizado = await prismaClient.loteProducao.update({
            where: { id },
            data: {
                status,
                observacao
            },
            include: {
                produto: true,
                tecido: true,
                responsavel: true,
                items: {
                    include: {
                        tamanho: true
                    }
                },
                direcionamentos: true
            }
        });

        return loteAtualizado;
    }
}

class DeleteLoteProducaoService {
    async execute(id: string) {
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id },
            include: {
                items: true,
                direcionamentos: true
            }
        });

        if (!lote) {
            throw new Error("Lote não encontrado.");
        }

        if (lote.direcionamentos.length > 0) {
            throw new Error("Não é possível deletar um lote que possui direcionamentos associados.");
        }

        // Deletar items primeiro
        await prismaClient.loteItem.deleteMany({
            where: { loteProducaoId: id }
        });

        // Deletar lote
        await prismaClient.loteProducao.delete({
            where: { id }
        });

        return { message: "Lote deletado com sucesso." };
    }
}

export { CreateLoteProducaoService, ListAllLoteProducaoService, ListByIdLoteProducaoService, UpdateLoteProducaoService, DeleteLoteProducaoService };
