import { z } from "zod";

export const createEstoqueRoloSchema = z.object({
    body: z.object({
        tecidoId: z.uuid("ID de tecido inválido"),
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
        codigoBarraRolo: z.string().min(1, "Código de barra não pode estar vazio").optional(),
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
        tecidoId: z.uuid().optional(),
        situacao: z.enum(["disponivel", "reservado", "em_uso", "descartado"]).optional(),
        estoqueRoloId: z.uuid().optional(),
        fornecedorId: z.uuid().optional(),
        tipoMovimentacao: z.enum(["entrada", "saida", "ajuste", "devolucao"]).optional(),
        dataInicio: z.coerce.date().optional(),
        dataFim: z.coerce.date().optional(),
        page: z.string().regex(/^\d+$/, "Page deve ser numerico").optional(),
        limit: z.string().regex(/^\d+$/, "Limit deve ser numerico").optional(),
    }),
});

export const movimentacaoFornecedorSchema = z.object({
    id: z.uuid(),
    nome: z.string(),
    tipo: z.string().nullable().optional(),
    tecido: z.object({
        id: z.uuid(),
        nome: z.string(),
        codigoReferencia: z.string().nullable().optional(),
        cor: z.object({
            id: z.uuid(),
            nome: z.string(),
            codigoHex: z.string().nullable().optional()
        })
    })
});

export const movimentacaoDataItemSchema = z.object({
    id: z.uuid(),
    tipoMovimentacao: z.string(),
    pesoMovimentado: z.number(),
    rolo: z.object({
        id: z.uuid(),
        codigoBarraRolo: z.string().nullable().optional(),
        fornecedor: movimentacaoFornecedorSchema
    }),
    reponsavel: z.object({
        id: z.uuid(),
        nome: z.string()
    })
});

export const movimentacaoDataResponseSchema = z.object({
    data: z.array(movimentacaoDataItemSchema),
    pagination: z.object({
        total: z.number().int(),
        page: z.number().int(),
        limit: z.number().int(),
        pages: z.number().int()
    })
});

export const listEstoqueCorteSchema = z.object({
    query: z.object({
        produtoId: z.uuid("ID de produto invalido").optional(),
        loteProducaoId: z.uuid("ID de lote invalido").optional(),
        tamanhoId: z.uuid("ID de tamanho invalido").optional(),
        corId: z.uuid("ID de cor invalido").optional(),
        page: z.string().regex(/^\d+$/, "Page deve ser numerico").optional(),
        limit: z.string().regex(/^\d+$/, "Limit deve ser numerico").optional(),
    }),
});

export const ajusteEstoqueCorteSchema = z.object({
    body: z.object({
        produtoId: z.uuid("ID de produto invalido"),
        loteProducaoId: z.uuid("ID de lote invalido"),
        tamanhoId: z.uuid("ID de tamanho invalido"),
        corId: z.uuid("ID de cor invalido"),
        novaQuantidade: z.number().int().nonnegative("Nova quantidade nao pode ser negativa"),
        motivo: z.string().min(3, "Motivo deve ter pelo menos 3 caracteres"),
    }),
});

export const getResumoEstoqueRolosSchema = z.object({
    query: z.object({
        fornecedorId: z.uuid().optional(),
        tecidoId: z.uuid().optional(),
        corId: z.uuid().optional(),
        page: z.string().regex(/^\d+$/, "Page deve ser numerico").optional(),
        limit: z.string().regex(/^\d+$/, "Limit deve ser numerico").optional(),
    }),
});

export const listEstoqueRolosSchema = z.object({
    query: z.object({
        tecidoId: z.uuid().optional(),
        situacao: z.enum(["disponivel", "reservado", "em_uso", "descartado"]).optional(),
        estoqueRoloId: z.uuid().optional(),
        fornecedorId: z.uuid().optional(),
        corId: z.uuid().optional(),
        tipoMovimentacao: z.enum(["entrada", "saida", "ajuste", "devolucao"]).optional(),
        dataInicio: z.string().datetime().optional(),
        dataFim: z.string().datetime().optional(),
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),
    }),
});
