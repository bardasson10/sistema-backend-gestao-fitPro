import { ICreateTipoProdutoTamanhoRequest } from "../../interfaces/IProduto";
import prismaClient from "../../prisma";

class CreateTipoProdutoTamanhoService {
    async execute({ tipoProdutoId, tamanhoId }: ICreateTipoProdutoTamanhoRequest) {
        // Verificar se tipo de produto existe
        const tipoProduto = await prismaClient.tipoProduto.findUnique({
            where: { id: tipoProdutoId }
        });

        if (!tipoProduto) {
            throw new Error("Tipo de produto não encontrado.");
        }

        // Verificar se tamanho existe
        const tamanho = await prismaClient.tamanho.findUnique({
            where: { id: tamanhoId }
        });

        if (!tamanho) {
            throw new Error("Tamanho não encontrado.");
        }

        // Verificar se já existe associação
        const jaExiste = await prismaClient.tipoProdutoTamanho.findFirst({
            where: {
                tipoProdutoId,
                tamanhoId
            }
        });

        if (jaExiste) {
            throw new Error("Este tamanho já está associado a este tipo de produto.");
        }

        const tipoProdutoTamanho = await prismaClient.tipoProdutoTamanho.create({
            data: {
                tipoProdutoId,
                tamanhoId
            },
            include: {
                tipo: true,
                tamanho: true
            }
        });

        return tipoProdutoTamanho;
    }
}

class ListTipoProdutoTamanhoService {
    async execute(tipoProdutoId: string) {
        const tiposProduto = await prismaClient.tipoProdutoTamanho.findMany({
            where: { tipoProdutoId },
            include: {
                tipo: true,
                tamanho: true
            }
        });

        return tiposProduto;
    }
}

class DeleteTipoProdutoTamanhoService {
    async execute(id: string) {
        const tipoProdutoTamanho = await prismaClient.tipoProdutoTamanho.findUnique({
            where: { id }
        });

        if (!tipoProdutoTamanho) {
            throw new Error("Associação não encontrada.");
        }

        await prismaClient.tipoProdutoTamanho.delete({
            where: { id }
        });

        return { message: "Associação removida com sucesso." };
    }
}

export { CreateTipoProdutoTamanhoService, ListTipoProdutoTamanhoService, DeleteTipoProdutoTamanhoService };
