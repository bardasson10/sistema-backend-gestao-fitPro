import { ICreateFaccaoRequest, IUpdateFaccaoRequest } from "../../interfaces/IProducao";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

class CreateFaccaoService {
    async execute({ nome, responsavel, contato, prazoMedioDias, status }: ICreateFaccaoRequest) {
        const faccaoAlreadyExists = await prismaClient.faccao.findFirst({
            where: { nome }
        });

        if (faccaoAlreadyExists) {
            throw new Error("Facção com este nome já existe.");
        }

        const faccao = await prismaClient.faccao.create({
            data: {
                nome,
                responsavel,
                contato,
                prazoMedioDias,
                status: status || "ativo"
            },
            include: {
                direcionamentos: true
            }
        });

        return faccao;
    }
}

class ListAllFaccaoService {
    async execute(status?: string, page?: number | string, limit?: number | string): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const [faccoes, total] = await Promise.all([
            prismaClient.faccao.findMany({
                where: status ? { status } : undefined,
                include: {
                    direcionamentos: true
                },
                skip,
                take: pageLimit,
                orderBy: {
                    createdAt: "desc"
                }
            }),
            prismaClient.faccao.count({
                where: status ? { status } : undefined
            })
        ]);

        return createPaginatedResponse(faccoes, total, pageNumber, pageLimit);
    }
}

class ListByIdFaccaoService {
    async execute(id: string) {
        const faccao = await prismaClient.faccao.findUnique({
            where: { id },
            include: {
                direcionamentos: {
                    include: {
                        lote: true,
                        conferencias: true
                    }
                }
            }
        });

        if (!faccao) {
            throw new Error("Facção não encontrada.");
        }

        return faccao;
    }
}

class UpdateFaccaoService {
    async execute(id: string, { nome, responsavel, contato, prazoMedioDias, status }: IUpdateFaccaoRequest) {
        const faccao = await prismaClient.faccao.findUnique({
            where: { id }
        });

        if (!faccao) {
            throw new Error("Facção não encontrada.");
        }

        if (nome) {
            const faccaoDuplicada = await prismaClient.faccao.findFirst({
                where: {
                    nome,
                    NOT: { id }
                }
            });

            if (faccaoDuplicada) {
                throw new Error("Facção com este nome já existe.");
            }
        }

        const faccaoAtualizada = await prismaClient.faccao.update({
            where: { id },
            data: {
                nome,
                responsavel,
                contato,
                prazoMedioDias,
                status
            },
            include: {
                direcionamentos: true
            }
        });

        return faccaoAtualizada;
    }
}

class DeleteFaccaoService {
    async execute(id: string) {
        const faccao = await prismaClient.faccao.findUnique({
            where: { id },
            include: {
                direcionamentos: true
            }
        });

        if (!faccao) {
            throw new Error("Facção não encontrada.");
        }

        if (faccao.direcionamentos.length > 0) {
            throw new Error("Não é possível deletar uma facção que possui direcionamentos associados.");
        }

        await prismaClient.faccao.delete({
            where: { id }
        });

        return { message: "Facção deletada com sucesso." };
    }
}

export { CreateFaccaoService, ListAllFaccaoService, ListByIdFaccaoService, UpdateFaccaoService, DeleteFaccaoService };
