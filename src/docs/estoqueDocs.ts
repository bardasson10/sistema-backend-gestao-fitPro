import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
    createEstoqueRoloSchema,
    updateEstoqueRoloSchema,
    createMovimentacaoEstoqueSchema,
} from '../schemas/estoqueSchemas';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const corSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    codigoHex: z.string().nullable().optional()
});

const tecidoResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string()
});

const produtoResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    sku: z.string()
});

const tamanhoResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string()
});

const loteResumoSchema = z.object({
    id: z.string().uuid(),
    codigoLote: z.string(),
    tecido: tecidoResumoSchema
});

const estoqueCorteListItemSchema = z.object({
    id: z.string().uuid(),
    quantidadeDisponivel: z.number().int(),
    produto: produtoResumoSchema,
    tamanho: tamanhoResumoSchema,
    cor: corSchema,
    lote: loteResumoSchema
});

const paginatedEstoqueCorteSchema = z.object({
    data: z.array(estoqueCorteListItemSchema),
    pagination: z.object({
        total: z.number().int(),
        page: z.number().int(),
        limit: z.number().int(),
        pages: z.number().int()
    })
});

const historicoEnvioSchema = z.object({
    direcionamentoId: z.string().uuid(),
    faccao: z.string(),
    quantidadeEnviada: z.number().int(),
    dataSaida: z.string().datetime().nullable().optional()
});

const estoqueCorteDetalheSchema = z.object({
    id: z.string().uuid(),
    quantidadeDisponivel: z.number().int(),
    produto: produtoResumoSchema,
    tamanho: tamanhoResumoSchema,
    cor: corSchema,
    lote: loteResumoSchema,
    historicoEnvios: z.array(historicoEnvioSchema)
});

const ajusteEstoqueCorteResponseSchema = z.object({
    message: z.string(),
    motivo: z.string(),
    usuarioId: z.string().uuid().optional(),
    quantidadeAnterior: z.number().int(),
    quantidadeAtual: z.number().int(),
    item: estoqueCorteListItemSchema
});

const usuarioResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    funcaoSetor: z.string().nullable().optional(),
    perfil: z.string()
});

const movimentacaoSchema = z.object({
    id: z.string().uuid(),
    estoqueRoloId: z.string().uuid(),
    usuarioId: z.string().uuid(),
    tipoMovimentacao: z.string(),
    pesoMovimentado: z.number().optional(),
    createdAt: z.string().datetime(),
    usuario: usuarioResumoSchema.optional()
});

const estoqueRoloSchema = z.object({
    id: z.string().uuid(),
    tecidoId: z.string().uuid(),
    codigoBarraRolo: z.string().nullable().optional(),
    pesoInicialKg: z.number(),
    pesoAtualKg: z.number(),
    situacao: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    tecido: z.any().optional(),
    movimentacoes: z.array(movimentacaoSchema).optional()
});

const paginatedEstoqueRoloSchema = z.object({
    data: z.array(estoqueRoloSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});

export function registerEstoqueRoutes(registry: OpenAPIRegistry) {
    // GET /estoque-corte - Listar saldo disponivel para remessas
    registry.registerPath({
        method: 'get',
        path: '/estoque-corte',
        tags: ['Estoque'],
        summary: 'Listar estoque de corte disponivel',
        security: [{ bearerAuth: [] }],
        request: {
            query: z.object({
                produtoId: z.uuid().optional(),
                loteProducaoId: z.uuid().optional(),
                tamanhoId: z.uuid().optional(),
                corId: z.uuid().optional(),
                page: z.coerce.number().int().positive().optional(),
                limit: z.coerce.number().int().positive().optional()
            })
        },
        responses: {
            200: {
                description: 'Itens com quantidadeDisponivel maior que zero',
                content: {
                    'application/json': {
                        schema: paginatedEstoqueCorteSchema
                    }
                }
            }
        }
    });

    // GET /estoque-corte/{id} - Detalhar item e historico de envios
    registry.registerPath({
        method: 'get',
        path: '/estoque-corte/{id}',
        tags: ['Estoque'],
        summary: 'Detalhar item do estoque de corte',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Detalhes do item com historico de remessas',
                content: {
                    'application/json': {
                        schema: estoqueCorteDetalheSchema
                    }
                }
            },
            404: {
                description: 'Item não encontrado'
            }
        }
    });

    // PATCH /estoque-corte/{id}/ajuste - Ajuste manual de saldo
    registry.registerPath({
        method: 'patch',
        path: '/estoque-corte/{id}/ajuste',
        tags: ['Estoque'],
        summary: 'Ajustar saldo do estoque de corte (ADM/GERENTE)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            }),
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            novaQuantidade: z.number().int().nonnegative(),
                            motivo: z.string().min(3)
                        })
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'Saldo ajustado com sucesso',
                content: {
                    'application/json': {
                        schema: ajusteEstoqueCorteResponseSchema
                    }
                }
            },
            403: {
                description: 'Usuário sem permissão'
            },
            404: {
                description: 'Item não encontrado'
            }
        }
    });

    // POST /estoque-rolos - Criar rolos de estoque em lote
    registry.registerPath({
        method: 'post',
        path: '/estoque-rolos',
        tags: ['Estoque'],
        summary: 'Criar rolos de estoque em lote',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createEstoqueRoloSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            201: {
                description: 'Rolos de estoque criados com sucesso',
                content: {
                    'application/json': {
                        schema: z.object({
                            message: z.string(),
                            rolos: z.array(estoqueRoloSchema)
                        })
                    }
                }
            },
            400: {
                description: 'Erro de validação'
            }
        }
    });

    // GET /estoque-rolos - Listar rolos de estoque
    registry.registerPath({
        method: 'get',
        path: '/estoque-rolos',
        tags: ['Estoque'],
        summary: 'Listar rolos de estoque',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de rolos de estoque',
                content: {
                    'application/json': {
                        schema: paginatedEstoqueRoloSchema
                    }
                }
            }
        }
    });

    // GET /estoque-rolos/{id} - Buscar rolo por ID
    registry.registerPath({
        method: 'get',
        path: '/estoque-rolos/{id}',
        tags: ['Estoque'],
        summary: 'Buscar rolo de estoque por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Rolo de estoque encontrado',
                content: {
                    'application/json': {
                        schema: estoqueRoloSchema
                    }
                }
            },
            404: {
                description: 'Rolo de estoque não encontrado'
            }
        }
    });

    // PUT /estoque-rolos/{id} - Atualizar rolo de estoque
    registry.registerPath({
        method: 'put',
        path: '/estoque-rolos/{id}',
        tags: ['Estoque'],
        summary: 'Atualizar rolo de estoque',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateEstoqueRoloSchema.shape.body
                    }
                }
            },
            params: z.object({
                id: z.uuid()
            })
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Rolo de estoque atualizado',
                content: {
                    'application/json': {
                        schema: estoqueRoloSchema
                    }
                }
            },
            404: {
                description: 'Rolo de estoque não encontrado'
            }
        }
    });

    // DELETE /estoque-rolos/{id} - Deletar rolo de estoque
    registry.registerPath({
        method: 'delete',
        path: '/estoque-rolos/{id}',
        tags: ['Estoque'],
        summary: 'Deletar rolo de estoque (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Rolo de estoque deletado',
                content: {
                    'application/json': {
                        schema: z.object({
                            message: z.string()
                        })
                    }
                }
            },
            404: {
                description: 'Rolo de estoque não encontrado'
            }
        }
    });

    // GET /estoque-rolos/relatorio/geral - Relatório geral de estoque
    registry.registerPath({
        method: 'get',
        path: '/estoque-rolos/relatorio/geral',
        tags: ['Estoque'],
        summary: 'Relatório geral de estoque',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Relatório do estoque',
                content: {
                    'application/json': {
                        schema: z.object({
                            totalRolos: z.number().int(),
                            pesoTotal: z.number(),
                            tecidoComMaiorEstoque: z.string(),
                            rolosDisponiveis: z.number().int(),
                            rolosReservados: z.number().int(),
                            rolosEmUso: z.number().int(),
                            movimentacoesMes: z.number().int()
                        })
                    }
                }
            }
        }
    });

    // POST /movimentacoes-estoque - Criar movimentação de estoque
    registry.registerPath({
        method: 'post',
        path: '/movimentacoes-estoque/{usuarioId}',
        tags: ['Estoque'],
        summary: 'Criar movimentação de estoque',
        request: {
            params: z.object({
                usuarioId: z.uuid()
            }),

            body: {
                content: {
                    'application/json': {
                        schema: createMovimentacaoEstoqueSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Movimentação de estoque criada com sucesso',
                content: {
                    'application/json': {
                        schema: movimentacaoSchema
                    }
                }
            },
            400: {
                description: 'Erro de validação'
            }
        }
    });

    // GET /movimentacoes-estoque - Listar movimentações de estoque
    registry.registerPath({
        method: 'get',
        path: '/movimentacoes-estoque',
        tags: ['Estoque'],
        summary: 'Listar movimentações de estoque',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de movimentações de estoque',
                content: {
                    'application/json': {
                        schema: z.array(movimentacaoSchema)
                    }
                }
            }
        }
    });

    // GET /movimentacoes-estoque/{id} - Buscar movimentação por ID
    registry.registerPath({
        method: 'get',
        path: '/movimentacoes-estoque/{id}',
        tags: ['Estoque'],
        summary: 'Buscar movimentação de estoque por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Movimentação de estoque encontrada',
                content: {
                    'application/json': {
                        schema: movimentacaoSchema
                    }
                }
            },
            404: {
                description: 'Movimentação de estoque não encontrada'
            }
        }
    });

    // GET /movimentacoes-estoque/{estoqueRoloId}/historico - Histórico de movimentações do rolo
    registry.registerPath({
        method: 'get',
        path: '/movimentacoes-estoque/{estoqueRoloId}/historico',
        tags: ['Estoque'],
        summary: 'Histórico de movimentações do rolo',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                estoqueRoloId: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Histórico de movimentações do rolo',
                content: {
                    'application/json': {
                        schema: z.array(movimentacaoSchema)
                    }
                }
            },
            404: {
                description: 'Rolo não encontrado'
            }
        }
    });
}
