import { IUpdateUserRequest, IUserResponse } from "../../interfaces/IUser";
import prismaClient from "../../prisma";
import { hash } from "bcryptjs";

class UpdateUserService {
    async execute(id: string, { nome, email, senha, perfil, status, funcaoSetor }: IUpdateUserRequest): Promise<IUserResponse> {
        const user = await prismaClient.usuario.findUnique({
            where: { id }
        });

        if (!user) {
            throw new Error("Usuário não encontrado.");
        }

        if (email) {
            const userWithEmail = await prismaClient.usuario.findFirst({
                where: {
                    email,
                    NOT: { id }
                }
            });

            if (userWithEmail) {
                throw new Error("Email já está em uso.");
            }
        }

        const dataToUpdate: any = {
            nome,
            email,
            perfil,
            status,
            funcaoSetor
        };

        if (senha) {
            dataToUpdate.senha = await hash(senha, 8);
        }

        const userUpdated = await prismaClient.usuario.update({
            where: { id },
            data: dataToUpdate,
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

        return userUpdated;
    }
}

export { UpdateUserService };
