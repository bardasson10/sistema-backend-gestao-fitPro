import { z } from "zod";

export const createFornecedorSchema = z.object({
    body: z.object({
        nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        tipo: z.string().optional(),
        contato: z.string().optional(),
    }),
});

export const updateFornecedorSchema = z.object({
    body: z.object({
        nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
        tipo: z.string().optional(),
        contato: z.string().optional(),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

export const createCorSchema = z.object({
    body: z.object({
        nome: z.string().min(1, "Nome é obrigatório"),
        codigoHex: z.string().regex(/^#[0-9A-F]{6}$/i, "Código HEX inválido (ex: #FFFFFF)").optional(),
    }),
});

export const updateCorSchema = z.object({
    body: z.object({
        nome: z.string().min(1, "Nome é obrigatório").optional(),
        codigoHex: z.string().regex(/^#[0-9A-F]{6}$/i, "Código HEX inválido (ex: #FFFFFF)").optional(),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

export const createTecidoSchema = z.object({
    body: z.object({
        fornecedorId: z.uuid("ID de fornecedor inválido"),
        corId: z.uuid("ID de cor inválido"),
        nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        codigoReferencia: z.string().optional(),
        rendimentoMetroKg: z.number().positive("Rendimento deve ser positivo").optional(),
        larguraMetros: z.number().positive("Largura deve ser positiva").optional(),
        valorPorKg: z.number().positive("Valor deve ser positivo").optional(),
        gramatura: z.number().positive("Gramatura deve ser positiva").optional(),
    }),
});

export const updateTecidoSchema = z.object({
    body: z.object({
        fornecedorId: z.uuid("ID de fornecedor inválido").optional(),
        corId: z.uuid("ID de cor inválido").optional(),
        nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
        codigoReferencia: z.string().optional(),
        rendimentoMetroKg: z.number().positive("Rendimento deve ser positivo").optional(),
        larguraMetros: z.number().positive("Largura deve ser positiva").optional(),
        valorPorKg: z.number().positive("Valor deve ser positivo").optional(),
        gramatura: z.number().positive("Gramatura deve ser positiva").optional(),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});
