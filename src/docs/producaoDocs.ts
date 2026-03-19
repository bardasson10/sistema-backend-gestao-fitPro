import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
    createFaccaoSchema,
    updateFaccaoSchema,
    createLoteProducaoSchema,
    updateLoteProducaoSchema,
    addLoteItemsSchema,
    addRolosLoteSchema,
    createDirecionamentoSchema,
    updateDirecionamentoSchema,
    createConferenciaSchema,
    updateConferenciaSchema,
} from '../schemas/producaoSchemas';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const TAG_FACCOES = 'Produção - Facções';
const TAG_LOTES = 'Produção - Lotes';
const TAG_DIRECIONAMENTOS = 'Produção - Direcionamentos';
const TAG_CONFERENCIAS = 'Produção - Conferências';

const errorSchema = z.object({
    error: z.string()
});

const messageSchema = z.object({
    message: z.string()
});

const usuarioResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    perfil: z.string().optional(),
    status: z.string().optional(),
    funcaoSetor: z.string().nullable().optional()
});

const faccaoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    responsavel: z.string().nullable().optional(),
    contato: z.string().nullable().optional(),
    prazoMedioDias: z.number().int().nullable().optional(),
    status: z.string(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    direcionamentos: z.array(z.any()).optional()
});

const corResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    codigoHex: z.string().nullable().optional()
});

const tecidoResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    codigoReferencia: z.string().nullable().optional(),
    cor: corResumoSchema.optional(),
    fornecedor: z.any().optional(),
    rolos: z.array(z.any()).optional()
});

const produtoResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    sku: z.string(),
    fabricante: z.string().nullable().optional()
});

const tamanhoResumoSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    ordem: z.number().int().optional()
});

const estoqueCorteResumoSchema = z.object({
    id: z.string().uuid(),
    produtoId: z.string().uuid(),
    tamanhoId: z.string().uuid(),
    loteProducaoId: z.string().uuid(),
    quantidadeDisponivel: z.number().int(),
    produto: produtoResumoSchema.optional(),
    tamanho: tamanhoResumoSchema.optional()
});

const loteItemSchema = z.object({
    id: z.string().uuid(),
    loteProducaoId: z.string().uuid(),
    produtoId: z.string().uuid(),
    tamanhoId: z.string().uuid(),
    quantidadePlanejada: z.number().int(),
    quantidadeProduzida: z.number().int().nullable().optional(),
    produto: produtoResumoSchema.optional(),
    tamanho: tamanhoResumoSchema.optional(),
    enfestos: z.array(z.any()).optional()
});

const loteSchema = z.object({
    id: z.string().uuid(),
    codigoLote: z.string(),
    tecidoId: z.string().uuid(),
    responsavelId: z.string().uuid().nullable().optional(),
    status: z.string(),
    dataInicio: z.string().datetime().nullable().optional(),
    dataFim: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    tecido: tecidoResumoSchema.optional(),
    responsavel: usuarioResumoSchema.optional(),
    items: z.array(loteItemSchema).optional(),
    rolos: z.array(z.any()).optional(),
    estoqueCorte: z.array(estoqueCorteResumoSchema.extend({
        direcionamentoItems: z.array(z.any()).optional()
    })).optional()
});

const direcionamentoItemSchema = z.object({
    id: z.string().uuid(),
    direcionamentoId: z.string().uuid(),
    estoqueCorteId: z.string().uuid(),
    quantidade: z.number().int(),
    estoqueCorte: estoqueCorteResumoSchema.extend({
        lote: loteSchema.pick({ id: true, codigoLote: true, status: true, tecido: true, responsavel: true }).optional()
    }).optional()
});

const direcionamentoSchema = z.object({
    id: z.string().uuid(),
    faccaoId: z.string().uuid(),
    tipoServico: z.enum(["costura", "corte"]),
    quantidade: z.number().int(),
    dataSaida: z.string().datetime().nullable().optional(),
    dataPrevisaoRetorno: z.string().datetime().nullable().optional(),
    status: z.string(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    faccao: faccaoSchema.optional(),
    items: z.array(direcionamentoItemSchema)
});

const direcionamentoListItemSchema = z.object({
    id: z.string().uuid(),
    status: z.string(),
    tipoServico: z.enum(["costura", "corte"]),
    quantidade: z.number().int(),
    dataSaida: z.string().datetime(),
    dataPrevisaoRetorno: z.string().datetime(),
    faccao: z.object({
        id: z.string().uuid(),
        nome: z.string(),
        responsavel: z.string()
    }),
    items: z.array(z.object({
        id: z.string().uuid(),
        quantidade: z.number().int(),
        produto: z.object({
            id: z.string().uuid(),
            nome: z.string(),
            sku: z.string(),
            cor: z.object({
                id: z.string().uuid(),
                nome: z.string(),
                codigoHex: z.string()
            }),
            tamanho: z.string()
        }),
        lote: z.object({
            id: z.string().uuid(),
            codigoLote: z.string()
        })
    })),
    createdAt: z.string().datetime()
});

const conferenciaItemSchema = z.object({
    id: z.string().uuid(),
    conferenciaId: z.string().uuid(),
    direcionamentoItemId: z.string().uuid(),
    qtdRecebida: z.number().int(),
    qtdDefeito: z.number().int(),
    quantidadeEnviada: z.number().int().optional(),
    quebra: z.number().int().optional(),
    direcionamentoItem: direcionamentoItemSchema.optional()
});

const conferenciaSchema = z.object({
    id: z.string().uuid(),
    direcionamentoId: z.string().uuid(),
    responsavelId: z.string().uuid(),
    dataConferencia: z.string().datetime().nullable().optional(),
    statusQualidade: z.string(),
    observacao: z.string().nullable().optional(),
    liberadoPagamento: z.boolean(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    direcionamento: direcionamentoSchema.optional(),
    responsavel: usuarioResumoSchema.optional(),
    items: z.array(conferenciaItemSchema).optional()
});

const paginatedFaccoesSchema = z.object({
    data: z.array(faccaoSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});

const paginatedLotesSchema = z.object({
    data: z.array(loteSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});

const paginatedDirecionamentosSchema = z.object({
    data: z.array(direcionamentoListItemSchema),
    pagination: z.object({
        total: z.number().int(),
        page: z.number().int(),
        limit: z.number().int(),
        totalPages: z.number().int(),
        pages: z.number().int().optional()
    })
});

const paginatedConferenciasSchema = z.object({
    data: z.array(conferenciaSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});

const relatorioProdutividadeSchema = z.object({
    periodo: z.object({
        inicio: z.string(),
        fim: z.string()
    }),
    totalConferencias: z.number().int(),
    conformes: z.number().int(),
    naoConformes: z.number().int(),
    comDefeito: z.number().int(),
    taxaConformidade: z.string(),
    pagasAutorizadas: z.number().int(),
    porFaccao: z.record(z.string(), z.object({
        total: z.number().int(),
        conforme: z.number().int(),
        defeitos: z.number().int()
    }))
});

export function registerProducaoRoutes(registry: OpenAPIRegistry) {
    // POST /faccoes - Criar facção
    registry.registerPath({
        method: 'post',
        path: '/faccoes',
        tags: [TAG_FACCOES],
        summary: 'Criar facção',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createFaccaoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Facção criada com sucesso',
                content: {
                    'application/json': {
                        schema: faccaoSchema
                    }
                }
            },
            400: {
                description: 'Erro de validação',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // GET /faccoes - Listar facções
    registry.registerPath({
        method: 'get',
        path: '/faccoes',
        tags: [TAG_FACCOES],
        summary: 'Listar facções',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de facções',
                content: {
                    'application/json': {
                        schema: paginatedFaccoesSchema
                    }
                }
            }
        }
    });

    // GET /faccoes/{id} - Buscar facção por ID
    registry.registerPath({
        method: 'get',
        path: '/faccoes/{id}',
        tags: [TAG_FACCOES],
        summary: 'Buscar facção por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Facção encontrada',
                content: {
                    'application/json': {
                        schema: faccaoSchema
                    }
                }
            },
            404: {
                description: 'Facção não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /faccoes/{id} - Atualizar facção
    registry.registerPath({
        method: 'put',
        path: '/faccoes/{id}',
        tags: [TAG_FACCOES],
        summary: 'Atualizar facção',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateFaccaoSchema.shape.body
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
                description: 'Facção atualizada',
                content: {
                    'application/json': {
                        schema: faccaoSchema
                    }
                }
            },
            404: {
                description: 'Facção não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /faccoes/{id} - Deletar facção
    registry.registerPath({
        method: 'delete',
        path: '/faccoes/{id}',
        tags: [TAG_FACCOES],
        summary: 'Deletar facção (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Facção deletada',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Facção não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /lotes-producao - Criar lote de produção
    registry.registerPath({
        method: 'post',
        path: '/lotes-producao',
        tags: [TAG_LOTES],
        summary: 'Criar lote de produção',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createLoteProducaoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lote de produção criado com sucesso',
                content: {
                    'application/json': {
                        schema: loteSchema
                    }
                }
            },
            400: {
                description: 'Erro de validação',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // GET /lotes-producao - Listar lotes de produção
    registry.registerPath({
        method: 'get',
        path: '/lotes-producao',
        tags: [TAG_LOTES],
        summary: 'Listar lotes de produção',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de lotes de produção',
                content: {
                    'application/json': {
                        schema: paginatedLotesSchema
                    }
                }
            }
        }
    });

    // GET /lotes-producao/{id} - Buscar lote por ID
    registry.registerPath({
        method: 'get',
        path: '/lotes-producao/{id}',
        tags: [TAG_LOTES],
        summary: 'Buscar lote de produção por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Lote de produção encontrado',
                content: {
                    'application/json': {
                        schema: loteSchema
                    }
                }
            },
            404: {
                description: 'Lote de produção não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // GET /lotes/{loteId}/sobras - Listar grade de sobras do lote
    registry.registerPath({
        method: 'get',
        path: '/lotes/{loteId}/sobras',
        tags: [TAG_LOTES],
        summary: 'Listar saldo de estoque de corte por produto/tamanho de um lote',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                loteId: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Saldo disponivel de estoque de corte do lote',
                content: {
                    'application/json': {
                        schema: z.object({
                            loteId: z.string().uuid(),
                            codigoLote: z.string(),
                            items: z.array(z.object({
                                estoqueCorteId: z.string().uuid(),
                                produtoId: z.string().uuid(),
                                tamanhoId: z.string().uuid(),
                                produtoNome: z.string(),
                                sku: z.string(),
                                tamanhoNome: z.string(),
                                quantidadePlanejada: z.number().int(),
                                quantidadeDirecionada: z.number().int(),
                                quantidadeSobra: z.number().int(),
                                quantidadeDisponivel: z.number().int()
                            }))
                        })
                    }
                }
            },
            404: {
                description: 'Lote não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /lotes-producao/{id} - Atualizar lote de produção
    registry.registerPath({
        method: 'put',
        path: '/lotes-producao/{id}',
        tags: [TAG_LOTES],
        summary: 'Atualizar lote de produção',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateLoteProducaoSchema.shape.body
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
                description: 'Lote de produção atualizado',
                content: {
                    'application/json': {
                        schema: loteSchema
                    }
                }
            },
            404: {
                description: 'Lote de produção não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /lotes-producao/{id}/items - Adicionar items ao lote
    registry.registerPath({
        method: 'post',
        path: '/lotes-producao/{id}/items',
        tags: [TAG_LOTES],
        summary: 'Adicionar items ao lote de produção',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: addLoteItemsSchema.shape.body
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
                description: 'Items adicionados ao lote',
                content: {
                    'application/json': {
                        schema: loteSchema
                    }
                }
            },
            404: {
                description: 'Lote de produção não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /lotes-producao/{id}/rolos - Adicionar rolos ao lote
    registry.registerPath({
        method: 'post',
        path: '/lotes-producao/{id}/rolos',
        tags: [TAG_LOTES],
        summary: 'Adicionar rolos ao lote de produção',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: addRolosLoteSchema.shape.body
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
                description: 'Rolos adicionados ao lote',
                content: {
                    'application/json': {
                        schema: loteSchema
                    }
                }
            },
            404: {
                description: 'Lote de produção não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /lotes-producao/{id} - Deletar lote de produção
    registry.registerPath({
        method: 'delete',
        path: '/lotes-producao/{id}',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Deletar lote de produção (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Lote de produção deletado',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Lote de produção não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /direcionamentos - Criar direcionamentos
    registry.registerPath({
        method: 'post',
        path: '/direcionamentos',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Criar direcionamentos',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createDirecionamentoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Direcionamentos criados com sucesso',
                content: {
                    'application/json': {
                        schema: z.array(direcionamentoSchema)
                    }
                }
            },
            400: {
                description: 'Erro de validação',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // GET /direcionamentos - Listar direcionamentos
    registry.registerPath({
        method: 'get',
        path: '/direcionamentos',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Listar direcionamentos',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de direcionamentos',
                content: {
                    'application/json': {
                        schema: paginatedDirecionamentosSchema
                    }
                }
            }
        }
    });

    // GET /direcionamentos/{id} - Buscar direcionamento por ID
    registry.registerPath({
        method: 'get',
        path: '/direcionamentos/{id}',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Buscar direcionamento por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Direcionamento encontrado',
                content: {
                    'application/json': {
                        schema: direcionamentoSchema
                    }
                }
            },
            404: {
                description: 'Direcionamento não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /direcionamentos/{id} - Atualizar direcionamento
    registry.registerPath({
        method: 'put',
        path: '/direcionamentos/{id}',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Atualizar direcionamento',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateDirecionamentoSchema.shape.body
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
                description: 'Direcionamento atualizado',
                content: {
                    'application/json': {
                        schema: direcionamentoSchema
                    }
                }
            },
            404: {
                description: 'Direcionamento não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /direcionamentos/{id} - Deletar direcionamento
    registry.registerPath({
        method: 'delete',
        path: '/direcionamentos/{id}',
        tags: [TAG_DIRECIONAMENTOS],
        summary: 'Deletar direcionamento (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Direcionamento deletado',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Direcionamento não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /conferencias - Criar conferência
    registry.registerPath({
        method: 'post',
        path: '/conferencias',
        tags: [TAG_CONFERENCIAS],
        summary: 'Criar conferência',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createConferenciaSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Conferência criada com sucesso',
                content: {
                    'application/json': {
                        schema: conferenciaSchema
                    }
                }
            },
            400: {
                description: 'Erro de validação',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // GET /conferencias - Listar conferências
    registry.registerPath({
        method: 'get',
        path: '/conferencias',
        tags: [TAG_CONFERENCIAS],
        summary: 'Listar conferências',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de conferências',
                content: {
                    'application/json': {
                        schema: paginatedConferenciasSchema
                    }
                }
            }
        }
    });

    // GET /conferencias/{id} - Buscar conferência por ID
    registry.registerPath({
        method: 'get',
        path: '/conferencias/{id}',
        tags: [TAG_CONFERENCIAS],
        summary: 'Buscar conferência por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Conferência encontrada',
                content: {
                    'application/json': {
                        schema: conferenciaSchema
                    }
                }
            },
            404: {
                description: 'Conferência não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /conferencias/{id} - Atualizar conferência
    registry.registerPath({
        method: 'put',
        path: '/conferencias/{id}',
        tags: [TAG_CONFERENCIAS],
        summary: 'Atualizar conferência',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateConferenciaSchema.shape.body,
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
                description: 'Conferência atualizada',
                content: {
                    'application/json': {
                        schema: conferenciaSchema
                    }
                }
            },
            404: {
                description: 'Conferência não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /conferencias/{id} - Deletar conferência
    registry.registerPath({
        method: 'delete',
        path: '/conferencias/{id}',
        tags: [TAG_CONFERENCIAS],
        summary: 'Deletar conferência (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Conferência deletada',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Conferência não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    registry.registerPath({
        method: 'get',
        path: '/conferencias/relatorio/produtividade',
        tags: [TAG_CONFERENCIAS],
        summary: 'Relatório de produtividade de conferências',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Relatório de produtividade',
                content: {
                    'application/json': {
                        schema: relatorioProdutividadeSchema
                    }
                }
            }
        }
    });
}
