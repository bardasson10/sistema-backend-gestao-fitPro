import { ICreateProdutoRequest, IUpdateProdutoRequest } from "../../interfaces/IProduto";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

class CreateProdutoService {
    async execute({ tipoProdutoId, nome, sku, fabricante, custoMedioPeca, precoMedioVenda }: ICreateProdutoRequest) {
        // Verificar se tipo de produto existe
        const tipoProduto = await prismaClient.tipoProduto.findUnique({
            where: { id: tipoProdutoId }
        });

        if (!tipoProduto) {
            throw new Error("Tipo de produto não encontrado.");
        }

        // Verificar se SKU já existe
        const produtoComSKU = await prismaClient.produto.findUnique({
            where: { sku }
        });

        if (produtoComSKU) {
            throw new Error("Produto com este SKU já existe.");
        }

        const produto = await prismaClient.produto.create({
            data: {
                tipoProdutoId,
                nome,
                sku,
                fabricante,
                custoMedioPeca,
                precoMedioVenda
            },
            include: {
                tipo: true,
                lotes: true
            }
        });

        return produto;
    }
}

class ListAllProdutoService {
    async execute(tipoProdutoId?: string, page?: number | string, limit?: number | string): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const [produtos, total] = await Promise.all([
            prismaClient.produto.findMany({
                where: tipoProdutoId ? { tipoProdutoId } : undefined,
                include: {
                    tipo: true,
                    lotes: true
                },
                skip,
                take: pageLimit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prismaClient.produto.count({
                where: tipoProdutoId ? { tipoProdutoId } : undefined
            })
        ]);

        return createPaginatedResponse(produtos, total, pageNumber, pageLimit);
    }
}

class ListByIdProdutoService {
    async execute(id: string) {
        const produto = await prismaClient.produto.findUnique({
            where: { id },
            include: {
                tipo: true,
                lotes: true
            }
        });

        if (!produto) {
            throw new Error("Produto não encontrado.");
        }

        return produto;
    }
}

class UpdateProdutoService {
    async execute(id: string, data: IUpdateProdutoRequest) {
        const produto = await prismaClient.produto.findUnique({
            where: { id }
        });

        if (!produto) {
            throw new Error("Produto não encontrado.");
        }

        // Se estiver atualizando o tipo, verificar se existe
        if (data.tipoProdutoId) {
            const tipoProduto = await prismaClient.tipoProduto.findUnique({
                where: { id: data.tipoProdutoId }
            });

            if (!tipoProduto) {
                throw new Error("Tipo de produto não encontrado.");
            }
        }

        // Se estiver atualizando SKU, verificar duplicação
        if (data.sku && data.sku !== produto.sku) {
            const produtoDuplicado = await prismaClient.produto.findUnique({
                where: { sku: data.sku }
            });

            if (produtoDuplicado) {
                throw new Error("Produto com este SKU já existe.");
            }
        }

        const produtoAtualizado = await prismaClient.produto.update({
            where: { id },
            data,
            include: {
                tipo: true,
                lotes: true
            }
        });

        return produtoAtualizado;
    }
}

class DeleteProdutoService {
    async execute(id: string) {
        const produto = await prismaClient.produto.findUnique({
            where: { id },
            include: {
                lotes: true
            }
        });

        if (!produto) {
            throw new Error("Produto não encontrado.");
        }

        if (produto.lotes.length > 0) {
            throw new Error("Não é possível deletar um produto que possui lotes de produção associados.");
        }

        await prismaClient.produto.delete({
            where: { id }
        });

        return { message: "Produto deletado com sucesso." };
    }
}

export { CreateProdutoService, ListAllProdutoService, ListByIdProdutoService, UpdateProdutoService, DeleteProdutoService };
