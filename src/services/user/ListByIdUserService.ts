import { IUserResponse } from "../../interfaces/IUser";
import prismaClient from "../../prisma";

class ListByIdUserService {
    async execute(userId: string): Promise<IUserResponse> {

        const user = await prismaClient.usuario.findFirst({
            where: {
                id: userId
            },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                status: true,
                funcaoSetor: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            throw new Error("Usuário não encontrado");
        }

        return user;
    }

}

export { ListByIdUserService };