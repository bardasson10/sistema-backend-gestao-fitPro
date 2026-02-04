
import { IUserResponse } from "../../interfaces/IUser";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

class ListAllUserService {
    async execute(page?: number | string, limit?: number | string): Promise<PaginatedResponse<IUserResponse>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const [users, total] = await Promise.all([
            prismaClient.usuario.findMany({
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    perfil: true,
                    status: true,
                    funcaoSetor: true,
                    createdAt: true,
                    updatedAt: true
                },
                skip,
                take: pageLimit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prismaClient.usuario.count()
        ]);

        return createPaginatedResponse(users, total, pageNumber, pageLimit);
    }
}

export { ListAllUserService };