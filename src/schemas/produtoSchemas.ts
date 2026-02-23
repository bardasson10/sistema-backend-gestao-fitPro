import { z } from "zod";

export const createTipoProdutoSchema = z.object({
    body: z.object({
        nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    }),
});

export const updateTipoProdutoSchema = z.object({
    body: z.object({
        nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

export const createTamanhoSchema = z.object({
    body: z.object({
        nome: z.string().min(1, "Nome é obrigatório"),
        ordem: z.number().int().positive("Ordem deve ser um número positivo"),
    }),
});

export const updateTamanhoSchema = z.object({
    body: z.object({
        nome: z.string().min(1, "Nome é obrigatório").optional(),
        ordem: z.number().int().positive("Ordem deve ser um número positivo").optional(),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

export const createProdutoSchema = z.object({
    body: z.object({
        tipoProdutoId: z.uuid("ID de tipo inválido"),
        nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        sku: z.string().min(1, "SKU é obrigatório"),
        fabricante: z.string().optional(),
        custoMedioPeca: z.number().positive("Custo deve ser positivo").optional(),
        precoMedioVenda: z.number().positive("Preço deve ser positivo").optional(),
    }),
});

export const updateProdutoSchema = z.object({
    body: z.object({
        tipoProdutoId: z.uuid("ID de tipo inválido").optional(),
        nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
        sku: z.string().min(1, "SKU é obrigatório").optional(),
        fabricante: z.string().optional(),
        custoMedioPeca: z.number().positive("Custo deve ser positivo").optional(),
        precoMedioVenda: z.number().positive("Preço deve ser positivo").optional(),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

export const createTipoProdutoTamanhoSchema = z.object({
    body: z.object({
        tipoProdutoId: z.uuid("ID de tipo inválido"),
        tamanhos: z.array(
            z.object({
                tamanhoId: z.uuid("ID de tamanho inválido"),
            })
        ).min(1, "Informe ao menos um tamanho"),
    }),
});
