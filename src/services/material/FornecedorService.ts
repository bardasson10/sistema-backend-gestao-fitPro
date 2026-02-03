import { ICreateFornecedorRequest, IUpdateFornecedorRequest } from "../../interfaces/IMaterial";
import prismaClient from "../../prisma";

class CreateFornecedorService {
    async execute({ nome, tipo, contato }: ICreateFornecedorRequest) {
        const fornecedorAlreadyExists = await prismaClient.fornecedor.findFirst({
            where: { nome }
        });

        if (fornecedorAlreadyExists) {
            throw new Error("Fornecedor com este nome já existe.");
        }

        const fornecedor = await prismaClient.fornecedor.create({
            data: {
                nome,
                tipo,
                contato
            },
            include: {
                tecidos: true
            }
        });

        return fornecedor;
    }
}

class ListAllFornecedorService {
    async execute() {
        const fornecedores = await prismaClient.fornecedor.findMany({
            include: {
                tecidos: true
            }
        });

        return fornecedores;
    }
}

class ListByIdFornecedorService {
    async execute(id: string) {
        const fornecedor = await prismaClient.fornecedor.findUnique({
            where: { id },
            include: {
                tecidos: true
            }
        });

        if (!fornecedor) {
            throw new Error("Fornecedor não encontrado.");
        }

        return fornecedor;
    }
}

class UpdateFornecedorService {
    async execute(id: string, { nome, tipo, contato }: IUpdateFornecedorRequest) {
        const fornecedor = await prismaClient.fornecedor.findUnique({
            where: { id }
        });

        if (!fornecedor) {
            throw new Error("Fornecedor não encontrado.");
        }

        if (nome) {
            const fornecedorDuplicado = await prismaClient.fornecedor.findFirst({
                where: {
                    nome,
                    NOT: { id }
                }
            });

            if (fornecedorDuplicado) {
                throw new Error("Fornecedor com este nome já existe.");
            }
        }

        const fornecedorAtualizado = await prismaClient.fornecedor.update({
            where: { id },
            data: {
                nome,
                tipo,
                contato
            },
            include: {
                tecidos: true
            }
        });

        return fornecedorAtualizado;
    }
}

class DeleteFornecedorService {
    async execute(id: string) {
        const fornecedor = await prismaClient.fornecedor.findUnique({
            where: { id },
            include: {
                tecidos: true
            }
        });

        if (!fornecedor) {
            throw new Error("Fornecedor não encontrado.");
        }

        if (fornecedor.tecidos.length > 0) {
            throw new Error("Não é possível deletar um fornecedor que possui tecidos associados.");
        }

        await prismaClient.fornecedor.delete({
            where: { id }
        });

        return { message: "Fornecedor deletado com sucesso." };
    }
}

export { CreateFornecedorService, ListAllFornecedorService, ListByIdFornecedorService, UpdateFornecedorService, DeleteFornecedorService };
