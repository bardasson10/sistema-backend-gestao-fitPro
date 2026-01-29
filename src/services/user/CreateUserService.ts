import { ICreateUserRequest, ICreateUserResponse } from "../../interfaces/ICreateUser";
import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
class CreateUserService {
    async execute({ nome, email, senha, perfil, funcaoSetor }: ICreateUserRequest): Promise<ICreateUserResponse> {

        const userAlreadyExists = await prismaClient.usuario.findFirst({
            where: {
                email: email
            }
        });

        if (userAlreadyExists) {
            throw new Error("User already exists.");
        }

        const senhaCriptografada = await hash(senha, 8);
        const user = await prismaClient.usuario.create({
            data: {
                nome: nome,
                email: email,
                senha: senhaCriptografada,
                perfil: perfil,
                funcaoSetor: funcaoSetor
            },

            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                status: true,
                funcaoSetor: true,
                createdAt: true,
            }
        });
        
        return user;
    }

}

export { CreateUserService };