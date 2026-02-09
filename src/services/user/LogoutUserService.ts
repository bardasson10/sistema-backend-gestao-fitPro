import prismaClient from "../../prisma";

class LogoutUserService {
    async execute(token: string, usuarioId: string) {
        // Invalidar a sessão específica do usuário
        await prismaClient.sessao.updateMany({
            where: {
                token: token,
                usuarioId: usuarioId,
                ativo: true
            },
            data: {
                ativo: false
            }
        });

        return { message: "Logout realizado com sucesso." };
    }
}

export { LogoutUserService };
