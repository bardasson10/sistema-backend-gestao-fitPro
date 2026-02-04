import { ICreateFornecedorRequest, IUpdateFornecedorRequest } from "../../interfaces/IMaterial";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
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
    async execute(page?: number | string, limit?: number | string): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const [fornecedores, total] = await Promise.all([
            prismaClient.fornecedor.findMany({
                include: {
                    tecidos: true
                },
                skip,
                take: pageLimit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prismaClient.fornecedor.count()
        ]);

        return createPaginatedResponse(fornecedores, total, pageNumber, pageLimit);
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
