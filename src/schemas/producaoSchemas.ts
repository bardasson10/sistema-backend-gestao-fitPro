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
        id: z.string().uuid("ID inválido"),
    }),
});

export const createLoteProducaoSchema = z.object({
    body: z.object({
        codigoLote: z.string().min(1, "Código do lote é obrigatório"),
        tecidoId: z.string().uuid("ID de tecido inválido"),
        responsavelId: z.string().uuid("ID de responsável inválido"),
        status: z.enum(["planejado", "em_producao", "concluido", "cancelado"]).optional(),
        observacao: z.string().optional(),
        items: z.array(z.object({
            produtoId: z.string().uuid("ID de produto inválido"),
            tamanhoId: z.string().uuid("ID de tamanho inválido"),
            quantidadePlanejada: z.number().int().positive("Quantidade deve ser positiva"),
        })).optional(),
    }),
});

export const updateLoteProducaoSchema = z.object({
    body: z.object({
        status: z.enum(["planejado", "em_producao", "concluido", "cancelado"]).optional(),
        observacao: z.string().optional(),
    }),
    params: z.object({
        id: z.string().uuid("ID inválido"),
    }),
});

export const createDirecionamentoSchema = z.object({
    body: z.object({
        loteProducaoId: z.string().uuid("ID de lote inválido"),
        faccaoId: z.string().uuid("ID de facção inválido"),
        tipoServico: z.enum(["costura", "estampa", "tingimento", "acabamento", "outro"]),
        dataSaida: z.string().date().optional(),
        dataPrevisaoRetorno: z.string().date().optional(),
    }),
});

export const updateDirecionamentoSchema = z.object({
    body: z.object({
        status: z.enum(["enviado", "em_processamento", "finalizado", "cancelado"]).optional(),
        dataSaida: z.string().date().optional(),
        dataPrevisaoRetorno: z.string().date().optional(),
    }),
    params: z.object({
        id: z.string().uuid("ID inválido"),
    }),
});

export const createConferenciaSchema = z.object({
    body: z.object({
        direcionamentoId: z.string().uuid("ID de direcionamento inválido"),
        responsavelId: z.string().uuid("ID de responsável inválido"),
        dataConferencia: z.string().date().optional(),
        statusQualidade: z.enum(["conforme", "nao_conforme", "com_defeito"]).optional(),
        observacao: z.string().optional(),
        items: z.array(z.object({
            tamanhoId: z.string().uuid("ID de tamanho inválido"),
            qtdRecebida: z.number().int().positive("Quantidade deve ser positiva"),
            qtdDefeito: z.number().int().nonnegative("Defeitos não podem ser negativos").optional(),
        })).optional(),
    }),
});

export const updateConferenciaSchema = z.object({
    body: z.object({
        dataConferencia: z.string().date().optional(),
        statusQualidade: z.enum(["conforme", "nao_conforme", "com_defeito"]).optional(),
        liberadoPagamento: z.boolean().optional(),
        observacao: z.string().optional(),
    }),
    params: z.object({
        id: z.string().uuid("ID inválido"),
    }),
});
