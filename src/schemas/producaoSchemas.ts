import { z } from "zod";

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
        status: z.enum(["planejado", "em_producao", "concluido", "cancelado"]).optional(),
        observacao: z.string().optional(),
        items: z.array(z.object({
            produtoId: z.uuid("ID de produto inválido"),
            tamanhoId: z.uuid("ID de tamanho inválido"),
            quantidadePlanejada: z.number().int().positive("Quantidade deve ser positiva"),
        })).optional(),
        rolos: z.array(z.object({
            estoqueRoloId: z.uuid("ID de rolo inválido"),
            pesoReservado: z.number().positive("Peso reservado deve ser positivo"),
        })).min(1, "Informe ao menos um rolo para identificar o tecido."),
    }),
});

export const updateLoteProducaoSchema = z.object({
    body: z.object({
        codigoLote: z.string().min(1, "Código do lote é obrigatório").optional(),
        tecidoId: z.uuid("ID de tecido inválido").optional(),
        responsavelId: z.uuid("ID de responsável inválido").optional(),
        status: z.string().optional(),
        observacao: z.string().optional(),
        items: z.array(z.object({
            produtoId: z.uuid("ID de produto inválido"),
            tamanhoId: z.uuid("ID de tamanho inválido"),
            quantidadePlanejada: z.number().int().positive("Quantidade deve ser positiva"),
        })).optional(),
        rolosProducao: z.array(z.object({
            estoqueRoloId: z.uuid("ID de rolo inválido"),
            pesoUtilizado: z.number().positive("Peso utilizado deve ser positivo"),
        })).optional(),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

export const addLoteItemsSchema = z.object({
    body: z.object({
        items: z.array(z.object({
            produtoId: z.uuid("ID de produto inválido"),
            tamanhoId: z.uuid("ID de tamanho inválido"),
            quantidadePlanejada: z.number().int().positive("Quantidade deve ser positiva"),
        })).min(1, "Informe ao menos um item"),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});

export const createDirecionamentoSchema = z.object({
    body: z.object({
        loteProducaoId: z.uuid("ID de lote inválido"),
        faccaoId: z.uuid("ID de facção inválido"),
        tipoServico: z.enum(["costura", "estampa", "tingimento", "acabamento", "corte", "outro"]),
        dataSaida: z.coerce.date().optional(),
        dataPrevisaoRetorno: z.coerce.date().optional(),
    }),
});

export const updateDirecionamentoSchema = z.object({
    body: z.object({
        status: z.enum(["enviado", "em_processamento", "finalizado", "cancelado"]).optional(),
        dataSaida: z.coerce.date().optional(),
        dataPrevisaoRetorno: z.coerce.date().optional(),
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
        statusQualidade: z.enum(["conforme", "nao_conforme", "com_defeito"]).optional(),
        liberadoPagamento: z.boolean().optional(),
        observacao: z.string().optional(),
        items: z.array(z.object({
            tamanhoId: z.uuid("ID de tamanho inválido"),
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
        statusQualidade: z.enum(["conforme", "nao_conforme", "com_defeito"]).optional(),
        liberadoPagamento: z.boolean().optional(),
        observacao: z.string().optional(),
        items: z.array(z.object({
            tamanhoId: z.uuid("ID de tamanho inválido"),
            qtdRecebida: z.number().int().positive("Quantidade deve ser positiva"),
            qtdDefeito: z.number().int().nonnegative("Defeitos não podem ser negativos").optional(),
        })).optional(),
    }),
    params: z.object({
        id: z.uuid("ID inválido"),
    }),
});
