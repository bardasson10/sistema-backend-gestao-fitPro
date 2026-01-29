import { z } from "zod";

export const createUserSchema = z.object({
    body: z.object({
        nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        email: z.email("Email inválido"),
        senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        perfil: z.enum(["ADM", "GERENTE", "FUNCIONARIO"]).optional(),
        status: z.string().optional(),
        funcaoSetor: z.string().optional(),
    }),
});

export const authenticateUserSchema = z.object({
    body: z.object({
        email: z.email("Email inválido"),
        senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    }),
});