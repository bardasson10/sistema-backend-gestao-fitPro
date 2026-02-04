import { ICreateTamanhoRequest, IUpdateTamanhoRequest } from "../../interfaces/IProduto";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

class CreateTamanhoService {
    async execute({ nome, ordem }: ICreateTamanhoRequest) {
        const tamanhoAlreadyExists = await prismaClient.tamanho.findFirst({
            where: { nome }
        });

        if (tamanhoAlreadyExists) {
            throw new Error("Tamanho com este nome já existe.");
        }

        const tamanho = await prismaClient.tamanho.create({
            data: {
                nome,
                ordem
            }
        });

        return tamanho;
    }
}

class ListAllTamanhoService {
    async execute(page?: number | string, limit?: number | string): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const [tamanhos, total] = await Promise.all([
            prismaClient.tamanho.findMany({
                skip,
                take: pageLimit,
                orderBy: [
                    { ordem: 'asc' },
                    { nome: 'desc' }
                ]
            }),
            prismaClient.tamanho.count()
        ]);

        return createPaginatedResponse(tamanhos, total, pageNumber, pageLimit);
    }
}

class ListByIdTamanhoService {
    async execute(id: string) {
        const tamanho = await prismaClient.tamanho.findUnique({
            where: { id }
        });

        if (!tamanho) {
            throw new Error("Tamanho não encontrado.");
        }

        return tamanho;
    }
}

class UpdateTamanhoService {
    async execute(id: string, { nome, ordem }: IUpdateTamanhoRequest) {
        const tamanho = await prismaClient.tamanho.findUnique({
            where: { id }
        });

        if (!tamanho) {
            throw new Error("Tamanho não encontrado.");
        }

        if (nome) {
            const tamanhoDuplicado = await prismaClient.tamanho.findFirst({
                where: {
                    nome,
                    NOT: { id }
                }
            });

            if (tamanhoDuplicado) {
                throw new Error("Tamanho com este nome já existe.");
            }
        }

        const tamanhoAtualizado = await prismaClient.tamanho.update({
            where: { id },
            data: {
                nome,
                ordem
            }
        });

        return tamanhoAtualizado;
    }
}

class DeleteTamanhoService {
    async execute(id: string) {
        const tamanho = await prismaClient.tamanho.findUnique({
            where: { id },
            include: {
                loteItems: true,
                conferenciaItems: true,
                tiposAceitos: true
            }
        });

        if (!tamanho) {
            throw new Error("Tamanho não encontrado.");
        }

        if (tamanho.loteItems.length > 0 || tamanho.conferenciaItems.length > 0) {
            throw new Error("Não é possível deletar um tamanho que possui registros associados.");
        }

        await prismaClient.tamanho.delete({
            where: { id }
        });

        return { message: "Tamanho deletado com sucesso." };
    }
}

export { CreateTamanhoService, ListAllTamanhoService, ListByIdTamanhoService, UpdateTamanhoService, DeleteTamanhoService };
