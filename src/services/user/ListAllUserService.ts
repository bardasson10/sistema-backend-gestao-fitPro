
import { IUserResponse } from "../../interfaces/IUser";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import { Perfil } from "../../generated/prisma/enums";
import prismaClient from "../../prisma";

interface IListAllUserParams {
    page?: number | string;
    limit?: number | string;
    userPerfil: Perfil;
    excludeUserId?: string;
}

class ListAllUserService {
    async execute({ page, limit, userPerfil, excludeUserId }: IListAllUserParams): Promise<PaginatedResponse<IUserResponse>> {

        if (userPerfil === Perfil.FUNCIONARIO) {
            return createPaginatedResponse([], 0, 1, 10);
        }

        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const whereClause: any = {};
        if (userPerfil === Perfil.GERENTE) {
            whereClause.perfil = Perfil.FUNCIONARIO;
        }

        if (excludeUserId) {
            whereClause.id = {
                not: excludeUserId
            };
        }

        const [users, total] = await Promise.all([
            prismaClient.usuario.findMany({
                where: whereClause,
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
            prismaClient.usuario.count({ where: whereClause })
        ]);

        return createPaginatedResponse(users, total, pageNumber, pageLimit);
    }
}

export { ListAllUserService };