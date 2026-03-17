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

export const listEstoqueCorteSchema = z.object({
    query: z.object({
        produtoId: z.uuid("ID de produto invalido").optional(),
        loteProducaoId: z.uuid("ID de lote invalido").optional(),
        tamanhoId: z.uuid("ID de tamanho invalido").optional(),
    }),
});

export const ajusteEstoqueCorteSchema = z.object({
    body: z.object({
        novaQuantidade: z.number().int().nonnegative("Nova quantidade nao pode ser negativa"),
        motivo: z.string().min(3, "Motivo deve ter pelo menos 3 caracteres"),
    }),
    params: z.object({
        id: z.uuid("ID invalido"),
    }),
});
