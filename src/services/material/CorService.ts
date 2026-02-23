import { ICreateCorRequest, IUpdateCorRequest } from "../../interfaces/IMaterial";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

class CreateCorService {
    async execute({ nome, codigoHex }: ICreateCorRequest) {
        const corAlreadyExists = await prismaClient.cor.findFirst({
            where: { nome }
        });

        if (corAlreadyExists) {
            throw new Error("Cor com este nome já existe.");
        }

        const cor = await prismaClient.cor.create({
            data: {
                nome,
                codigoHex
            },
            include: {
                tecidos: true
            }
        });

        return cor;
    }
}

class ListAllCorService {
    async execute(page?: number | string, limit?: number | string): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const [cores, total] = await Promise.all([
            prismaClient.cor.findMany({
                skip,
                take: pageLimit,
                // Replace 'createdAt' with a valid field from your Prisma 'cor' model, e.g., 'nome'
                orderBy: {
                    nome: 'desc'
                }
            }),
            prismaClient.cor.count()
        ]);

        return createPaginatedResponse(cores, total, pageNumber, pageLimit);
    }
}

class ListByIdCorService {
    async execute(id: string) {
        const cor = await prismaClient.cor.findUnique({
            where: { id },
            include: {
                tecidos: true
            }
        });

        if (!cor) {
            throw new Error("Cor não encontrada.");
        }

        return cor;
    }
}

class UpdateCorService {
    async execute(id: string, { nome, codigoHex }: IUpdateCorRequest) {
        const cor = await prismaClient.cor.findUnique({
            where: { id }
        });

        if (!cor) {
            throw new Error("Cor não encontrada.");
        }

        if (nome) {
            const corDuplicada = await prismaClient.cor.findFirst({
                where: {
                    nome,
                    NOT: { id }
                }
            });

            if (corDuplicada) {
                throw new Error("Cor com este nome já existe.");
            }
        }

        const corAtualizada = await prismaClient.cor.update({
            where: { id },
            data: {
                nome,
                codigoHex
            },
            include: {
                tecidos: true
            }
        });

        return corAtualizada;
    }
}

class DeleteCorService {
    async execute(id: string) {
        const cor = await prismaClient.cor.findUnique({
            where: { id },
            include: {
                tecidos: true
            }
        });

        if (!cor) {
            throw new Error("Cor não encontrada.");
        }

        if (cor.tecidos.length > 0) {
            throw new Error("Não é possível deletar uma cor que possui tecidos associados.");
        }

        await prismaClient.cor.delete({
            where: { id }
        });

        return { message: "Cor deletada com sucesso." };
    }
}

export { CreateCorService, ListAllCorService, ListByIdCorService, UpdateCorService, DeleteCorService };
