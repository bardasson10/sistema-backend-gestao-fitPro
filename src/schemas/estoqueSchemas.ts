import { z } from "zod";

export const createEstoqueRoloSchema = z.object({
    body: z.object({
        tecidoId: z.uuid("ID de tecido inválido"),
        prefixo: z.string()
            .trim()
            .min(2, "Prefixo deve ter pelo menos 2 caracteres")
            .max(10, "Prefixo deve ter no máximo 10 caracteres")
            .regex(/^[A-Za-z0-9]+$/, "Prefixo deve conter apenas letras e números"),
        dataLote: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data do lote deve estar no formato YYYY-MM-DD"),
        rolos: z.array(
            z.object({
                pesoInicialKg: z.number().positive("Peso inicial deve ser positivo"),
            })
        ).min(1, "Informe ao menos um rolo"),
        situacao: z.enum(["disponivel", "reservado", "em_uso", "descartado"]).optional(),
    }),
});

export const updateEstoqueRoloSchema = z.object({
    body: z.object({
        pesoAtualKg: z.number().positive("Peso atual deve ser positivo").optional(),
        situacao: z.enum(["disponivel", "reservado", "em_uso", "descartado"]).optional(),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

export const createMovimentacaoEstoqueSchema = z.object({
    body: z.object({
        estoqueRoloId: z.uuid("ID de estoque inválido"),
        tipoMovimentacao: z.enum(["entrada", "saida", "ajuste", "devolucao"]),
        pesoMovimentado: z.number().positive("Peso deve ser positivo"),
    }),
});

export const listMovimentacaoSchema = z.object({
    query: z.object({
        estoqueRoloId: z.uuid().optional(),
        tipoMovimentacao: z.string().optional(),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
    }),
});
