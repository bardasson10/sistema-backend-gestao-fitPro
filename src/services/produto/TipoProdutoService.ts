import { ICreateTipoProdutoRequest, IUpdateTipoProdutoRequest } from "../../interfaces/IProduto";
import prismaClient from "../../prisma";

class CreateTipoProdutoService {
    async execute({ nome }: ICreateTipoProdutoRequest) {
        const tipoProdutoAlreadyExists = await prismaClient.tipoProduto.findFirst({
            where: { nome }
        });

        if (tipoProdutoAlreadyExists) {
            throw new Error("Tipo de produto com este nome já existe.");
        }

        const tipoProduto = await prismaClient.tipoProduto.create({
            data: {
                nome
            },
            include: {
                produtos: true,
                tamanhos: true
            }
        });

        return tipoProduto;
    }
}

class ListAllTipoProdutoService {
    async execute() {
        const tiposProduto = await prismaClient.tipoProduto.findMany({
            include: {
                produtos: true,
                tamanhos: true
            }
        });

        return tiposProduto;
    }
}

class ListByIdTipoProdutoService {
    async execute(id: string) {
        const tipoProduto = await prismaClient.tipoProduto.findUnique({
            where: { id },
            include: {
                produtos: true,
                tamanhos: true
            }
        });

        if (!tipoProduto) {
            throw new Error("Tipo de produto não encontrado.");
        }

        return tipoProduto;
    }
}

class UpdateTipoProdutoService {
    async execute(id: string, { nome }: IUpdateTipoProdutoRequest) {
        const tipoProduto = await prismaClient.tipoProduto.findUnique({
            where: { id }
        });

        if (!tipoProduto) {
            throw new Error("Tipo de produto não encontrado.");
        }

        if (nome) {
            const tipoDuplicado = await prismaClient.tipoProduto.findFirst({
                where: {
                    nome,
                    NOT: { id }
                }
            });

            if (tipoDuplicado) {
                throw new Error("Tipo de produto com este nome já existe.");
            }
        }

        const tipoProdutoAtualizado = await prismaClient.tipoProduto.update({
            where: { id },
            data: {
                nome
            },
            include: {
                produtos: true,
                tamanhos: true
            }
        });

        return tipoProdutoAtualizado;
    }
}

class DeleteTipoProdutoService {
    async execute(id: string) {
        const tipoProduto = await prismaClient.tipoProduto.findUnique({
            where: { id },
            include: {
                produtos: true
            }
        });

        if (!tipoProduto) {
            throw new Error("Tipo de produto não encontrado.");
        }

        if (tipoProduto.produtos.length > 0) {
            throw new Error("Não é possível deletar um tipo de produto que possui produtos associados.");
        }

        await prismaClient.tipoProduto.delete({
            where: { id }
        });

        return { message: "Tipo de produto deletado com sucesso." };
    }
}

export { CreateTipoProdutoService, ListAllTipoProdutoService, ListByIdTipoProdutoService, UpdateTipoProdutoService, DeleteTipoProdutoService };
