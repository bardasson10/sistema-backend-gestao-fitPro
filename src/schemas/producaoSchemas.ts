import { z } from "zod";

const loteItemEntradaSchema = z.object({
    produtoId: z.uuid("ID de produto inválido"),
    tamanhoId: z.uuid("ID de tamanho inválido"),
    qtdMultiplicadorGrade: z.number().int().nonnegative("Multiplicador da grade não pode ser negativo"),
}).strict();

const enfestoUpdateProducaoSchema = z.object({
    corId: z.string().uuid("ID de cor inválido").optional().or(z.string().min(1, "Cor é obrigatória")),
    qtdFolhas: z.number().int().nonnegative("Quantidade de folhas não pode ser negativa"),
    rolosProducao: z.array(z.object({
        estoqueRoloId: z.uuid("ID de rolo inválido"),
        pesoReservado: z.number().positive("Peso reservado deve ser positivo"),
    })).min(1, "Informe ao menos um rolo por enfesto."),
});

const enfestoComItensSchema = z.object({
    corId: z.string().uuid("ID de cor inválido").or(z.string().min(1, "Cor é obrigatória")),
    qtdFolhas: z.number().int().positive("Quantidade de folhas deve ser maior que zero"),
    rolosProducao: z.array(z.object({
        estoqueRoloId: z.uuid("ID de rolo inválido"),
    })).min(1, "Informe ao menos um rolo por enfesto."),
    itens: z.array(loteItemEntradaSchema).min(1, "Informe ao menos um item por enfesto."),
});

export const createFaccaoSchema = z.object({
    body: z.object({
        nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        responsavel: z.string().optional(),
        contato: z.string().optional(),
        prazoMedioDias: z.number().int().positive("Prazo deve ser um número positivo").optional(),
        status: z.enum(["ativo", "inativo"]).optional(),
    }),
});

export const updateFaccaoSchema = z.object({
    body: z.object({
        nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
        responsavel: z.string().optional(),
        contato: z.string().optional(),
        prazoMedioDias: z.number().int().positive("Prazo deve ser um número positivo").optional(),
        status: z.enum(["ativo", "inativo"]).optional(),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

export const createLoteProducaoSchema = z.object({
    body: z.object({
        codigoLote: z.string().min(1, "Código do lote é obrigatório"),
        responsavelId: z.uuid("ID de responsável inválido"),
        observacao: z.string().optional(),
        rolos: z.array(z.object({
            estoqueRoloId: z.uuid("ID de rolo inválido"),
            pesoReservado: z.number().positive("Peso reservado deve ser positivo"),
        })).min(1, "Informe ao menos um rolo."),
    }),
});

export const updateLoteProducaoSchema = z.object({
    body: z.object({
        loteId: z.uuid("ID de lote inválido").optional(),
        codigoLote: z.string().min(1, "Código do lote é obrigatório").optional(),
        responsavelId: z.uuid("ID de responsável inválido").optional(),
        status: z.enum(["lote_criado", "enfesto", "cortado"]).optional(),
        observacao: z.string().optional(),
        gradeItens: z.array(loteItemEntradaSchema).min(1, "Informe ao menos um item na grade.").optional(),
        enfestos: z.array(enfestoUpdateProducaoSchema).optional(),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
}).superRefine((data, ctx) => {
    const enfestos = data.body.enfestos ?? [];
    const existeEnfestoComFolhas = enfestos.some((enfesto) => enfesto.qtdFolhas > 0);

    if (existeEnfestoComFolhas && (!data.body.gradeItens || data.body.gradeItens.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["body", "gradeItens"],
            message: "Informe gradeItens quando houver enfestos com qtdFolhas maior que zero."
        });
    }
});

export const addLoteItemsSchema = z.object({
    body: z.object({
        enfestos: z.array(enfestoComItensSchema).min(1, "Informe ao menos um enfesto"),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

export const createDirecionamentoSchema = z.object({
    body: z.object({
        direcionamentos: z.array(z.object({
            faccaoId: z.uuid("ID de facção inválido"),
            tipoServico: z.enum(["costura", "corte"]),
            items: z.array(z.object({
                estoqueCorteId: z.uuid("ID de estoque de corte inválido"),
                quantidade: z.number().int().positive("Quantidade deve ser maior que zero"),
            })).min(1, "Informe ao menos um item por direcionamento."),
        })).min(1, "Informe ao menos um direcionamento."),
    }),
});

export const updateDirecionamentoSchema = z.object({
    body: z.object({
        direcionamentos: z.array(z.object({
            faccaoId: z.uuid("ID de facção inválido"),
            tipoServico: z.enum(["costura", "corte"]),
            items: z.array(z.object({
                estoqueCorteId: z.uuid("ID de estoque de corte inválido"),
                quantidade: z.number().int().positive("Quantidade deve ser maior que zero"),
            })).min(1, "Informe ao menos um item por direcionamento."),
        })).length(1, "Informe exatamente um direcionamento para atualização."),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

export const updateDirecionamentoStatusSchema = z.object({
    body: z.object({
        status: z.enum(["separado", "em_producao", "entregue"]),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

export const updateDirecionamentoSkuPriceSchema = z.object({
    body: z.object({
        produtoSKU: z.array(z.object({
            sku: z.string().min(1, "SKU é obrigatório"),
            valorFaccaoPorPeca: z.coerce.number().positive("Valor por peça deve ser maior que zero"),
        })).min(1, "Informe ao menos um SKU para atualizar o preço."),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

export const createConferenciaSchema = z.object({
    body: z.object({
        direcionamentoId: z.uuid("ID de direcionamento inválido"),
        responsavelId: z.uuid("ID de responsável inválido"),
        dataConferencia: z.coerce.date().optional(),
        statusQualidade: z.enum(["validando", "conforme", "nao_conforme", "com_defeito"]).optional(),
        liberadoPagamento: z.boolean().optional(),
        observacao: z.string().optional(),
        items: z.array(z.object({
            direcionamentoItemId: z.uuid("ID de item do direcionamento inválido"),
            qtdRecebida: z.number().int().positive("Quantidade deve ser positiva"),
            qtdDefeito: z.number().int().nonnegative("Defeitos não podem ser negativos").optional(),
        })).optional(),
    }),
});

export const updateConferenciaSchema = z.object({
    body: z.object({
        direcionamentoId: z.uuid("ID de direcionamento inválido").optional(),
        responsavelId: z.uuid("ID de responsável inválido").optional(),
        dataConferencia: z.coerce.date().optional(),
        statusQualidade: z.enum(["validando", "conforme", "nao_conforme", "com_defeito"]).optional(),
        liberadoPagamento: z.boolean().optional(),
        observacao: z.string().optional(),
        items: z.array(z.object({
            direcionamentoItemId: z.uuid("ID de item do direcionamento inválido"),
            qtdRecebida: z.number().int().positive("Quantidade deve ser positiva"),
            qtdDefeito: z.number().int().nonnegative("Defeitos não podem ser negativos").optional(),
        })).optional(),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

// Schema de resposta para Conferência
export const conferenciaResponseSchema = z.object({
    id: z.string().uuid(),
    dataConferencia: z.string().nullable(),
    statusQualidade: z.string().nullable(),
    observacao: z.string().nullable(),
    liberadoPagamento: z.boolean(),
    responsavel: z.object({
        id: z.string().uuid(),
        nome: z.string(),
    }),
    direcionamento: z.object({
        id: z.string().uuid(),
        tipoServico: z.string(),
        status: z.string(),
        dataSaida: z.string().nullable(),
        faccao: z.object({
            id: z.string().uuid(),
            nome: z.string(),
        }),
    }),
    items: z.array(z.object({
        id: z.string().uuid(),
        quantidadeEnviada: z.number().int().nonnegative(),
        qtdRecebida: z.number().int().nonnegative(),
        qtdDefeito: z.number().int().nonnegative(),
        quebra: z.number().int(),
        produto: z.object({
            id: z.string().uuid(),
            nome: z.string(),
            sku: z.string(),
        }),
        tamanho: z.string(),
        cor: z.object({
            nome: z.string(),
            codigoHex: z.string().nullable(),
        }),
        lote: z.string(),
    })),
});

// Schema para resposta paginada de Conferências
export const conferenciaPaginatedResponseSchema = z.object({
    data: z.array(conferenciaResponseSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
});

export const addRolosLoteSchema = z.object({
    body: z.object({
        rolos: z.array(z.object({
            estoqueRoloId: z.uuid("ID de rolo inválido"),
            pesoReservado: z.number().positive("Peso reservado deve ser positivo"),
        })).min(1, "Informe ao menos um rolo."),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});
