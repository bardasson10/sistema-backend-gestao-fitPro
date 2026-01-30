
import { compare } from "bcryptjs";
import { IAuthUserRequest, IAuthUserResponse } from "../../interfaces/IAuthUser";
import prismaClient from "../../prisma";
import jwt from "jsonwebtoken";




class AuthenticateUserService {
    async execute({ email, senha}: IAuthUserRequest): Promise<IAuthUserResponse> {

        const user = await prismaClient.usuario.findFirst({
            where: {
                email: email
            }
        });

        if (!user) {
            throw new Error("Email ou Senha são obrigatórios.");
        }

        const passwordMatches = await compare(senha, user.senha);

        if (!passwordMatches) {
            throw new Error("Email ou Senha inválidos.");
        }

        const token = jwt.sign({
            nome: user.nome,
            perfil: user.perfil,
        },
            process.env.JWT_SECRET as string,{
            subject: user.id,
            expiresIn: "1d"
        });

        return {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil,
            token: token,
            dataCriacao: new Date(),
        }

    }
}

export { AuthenticateUserService };