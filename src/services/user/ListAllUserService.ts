
import { IUserResponse } from "../../interfaces/IUser";
import prismaClient from "../../prisma";

class ListAllUserService {
    async execute() : Promise<IUserResponse[]> {
        
        const users = await prismaClient.usuario.findMany({
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

        if (users.length === 0) {
            throw new Error("Nenhum usuário encontrado");
        }

        return users;
    }


}

export { ListAllUserService };