import { z } from "zod";

export const createEstoqueRoloSchema = z.object({
    body: z.object({
        tecidoId: z.string().uuid("ID de tecido inválido"),
        codigoBarraRolo: z.string().optional(),
        pesoInicialKg: z.number().positive("Peso inicial deve ser positivo"),
        pesoAtualKg: z.number().positive("Peso atual deve ser positivo"),
        situacao: z.enum(["disponivel", "reservado", "em_uso", "descartado"]).optional(),
    }),
});

export const updateEstoqueRoloSchema = z.object({
    body: z.object({
        pesoAtualKg: z.number().positive("Peso atual deve ser positivo").optional(),
        situacao: z.enum(["disponivel", "reservado", "em_uso", "descartado"]).optional(),
    }),
    params: z.object({
        id: z.string().uuid("ID inválido"),
    }),
});

export const createMovimentacaoEstoqueSchema = z.object({
    body: z.object({
        estoqueRoloId: z.string().uuid("ID de estoque inválido"),
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
