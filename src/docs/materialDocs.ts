import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
    createFornecedorSchema,
    updateFornecedorSchema,
    createCorSchema,
    updateCorSchema,
    createTecidoSchema,
    updateTecidoSchema,
} from '../schemas/materialSchemas';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const errorSchema = z.object({
    error: z.string()
});

const messageSchema = z.object({
    message: z.string()
});

const tecidoResumoSchema = z.object({
    id: z.string().uuid(),
    fornecedorId: z.string().uuid().optional(),
    corId: z.string().uuid().optional(),
    nome: z.string(),
    codigoReferencia: z.string().nullable().optional(),
    rendimentoMetroKg: z.number().nullable().optional(),
    larguraMetros: z.number().nullable().optional(),
    valorPorKg: z.number().nullable().optional(),
    gramatura: z.number().nullable().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional()
});

const fornecedorSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    tipo: z.string().nullable().optional(),
    contato: z.string().nullable().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    tecidos: z.array(tecidoResumoSchema).optional()
});

const corSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    codigoHex: z.string().nullable().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    tecidos: z.array(tecidoResumoSchema).optional()
});

const tecidoSchema = z.object({
    id: z.string().uuid(),
    fornecedorId: z.string().uuid(),
    corId: z.string().uuid(),
    nome: z.string(),
    codigoReferencia: z.string(),
    rendimentoMetroKg: z.number().nullable().optional(),
    larguraMetros: z.number().nullable().optional(),
    valorPorKg: z.number().nullable().optional(),
    gramatura: z.number().nullable().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    fornecedor: fornecedorSchema.optional(),
    cor: corSchema.optional(),
    rolos: z.array(z.any()).optional(),
    lotes: z.array(z.any()).optional()
});

const paginatedFornecedoresSchema = z.object({
    data: z.array(fornecedorSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});

const paginatedCoresSchema = z.object({
    data: z.array(corSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});

const paginatedTecidosSchema = z.object({
    data: z.array(tecidoSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});

export function registerMaterialRoutes(registry: OpenAPIRegistry) {
    // POST /fornecedores - Criar fornecedor
    registry.registerPath({
        method: 'post',
        path: '/fornecedores',
        tags: ['Materiais'],
        summary: 'Criar fornecedor',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createFornecedorSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Fornecedor criado com sucesso',
                content: {
                    'application/json': {
                        schema: fornecedorSchema
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

    // GET /fornecedores - Listar fornecedores
    registry.registerPath({
        method: 'get',
        path: '/fornecedores',
        tags: ['Materiais'],
        summary: 'Listar fornecedores',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de fornecedores',
                content: {
                    'application/json': {
                        schema: paginatedFornecedoresSchema
                    }
                }
            }
        }
    });

    // GET /fornecedores/{id} - Buscar fornecedor por ID
    registry.registerPath({
        method: 'get',
        path: '/fornecedores/{id}',
        tags: ['Materiais'],
        summary: 'Buscar fornecedor por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Fornecedor encontrado',
                content: {
                    'application/json': {
                        schema: fornecedorSchema
                    }
                }
            },
            404: {
                description: 'Fornecedor não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /fornecedores/{id} - Atualizar fornecedor
    registry.registerPath({
        method: 'put',
        path: '/fornecedores/{id}',
        tags: ['Materiais'],
        summary: 'Atualizar fornecedor',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateFornecedorSchema.shape.body
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
                description: 'Fornecedor atualizado',
                content: {
                    'application/json': {
                        schema: fornecedorSchema
                    }
                }
            },
            404: {
                description: 'Fornecedor não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /fornecedores/{id} - Deletar fornecedor
    registry.registerPath({
        method: 'delete',
        path: '/fornecedores/{id}',
        tags: ['Materiais'],
        summary: 'Deletar fornecedor (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Fornecedor deletado',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Fornecedor não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /cores - Criar cor
    registry.registerPath({
        method: 'post',
        path: '/cores',
        tags: ['Materiais'],
        summary: 'Criar cor',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createCorSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Cor criada com sucesso',
                content: {
                    'application/json': {
                        schema: corSchema
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

    // GET /cores - Listar cores
    registry.registerPath({
        method: 'get',
        path: '/cores',
        tags: ['Materiais'],
        summary: 'Listar cores',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de cores',
                content: {
                    'application/json': {
                        schema: paginatedCoresSchema
                    }
                }
            }
        }
    });

    // GET /cores/{id} - Buscar cor por ID
    registry.registerPath({
        method: 'get',
        path: '/cores/{id}',
        tags: ['Materiais'],
        summary: 'Buscar cor por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Cor encontrada',
                content: {
                    'application/json': {
                        schema: corSchema
                    }
                }
            },
            404: {
                description: 'Cor não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /cores/{id} - Atualizar cor
    registry.registerPath({
        method: 'put',
        path: '/cores/{id}',
        tags: ['Materiais'],
        summary: 'Atualizar cor',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateCorSchema.shape.body
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
                description: 'Cor atualizada',
                content: {
                    'application/json': {
                        schema: corSchema
                    }
                }
            },
            404: {
                description: 'Cor não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /cores/{id} - Deletar cor
    registry.registerPath({
        method: 'delete',
        path: '/cores/{id}',
        tags: ['Materiais'],
        summary: 'Deletar cor (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Cor deletada',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Cor não encontrada',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /tecidos - Criar tecido
    registry.registerPath({
        method: 'post',
        path: '/tecidos',
        tags: ['Materiais'],
        summary: 'Criar tecido',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createTecidoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Tecido criado com sucesso',
                content: {
                    'application/json': {
                        schema: tecidoSchema
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

    // GET /tecidos - Listar tecidos
    registry.registerPath({
        method: 'get',
        path: '/tecidos',
        tags: ['Materiais'],
        summary: 'Listar tecidos',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de tecidos',
                content: {
                    'application/json': {
                        schema: paginatedTecidosSchema
                    }
                }
            }
        }
    });

    // GET /tecidos/{id} - Buscar tecido por ID
    registry.registerPath({
        method: 'get',
        path: '/tecidos/{id}',
        tags: ['Materiais'],
        summary: 'Buscar tecido por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Tecido encontrado',
                content: {
                    'application/json': {
                        schema: tecidoSchema
                    }
                }
            },
            404: {
                description: 'Tecido não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // PUT /tecidos/{id} - Atualizar tecido
    registry.registerPath({
        method: 'put',
        path: '/tecidos/{id}',
        tags: ['Materiais'],
        summary: 'Atualizar tecido',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateTecidoSchema.shape.body
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
                description: 'Tecido atualizado',
                content: {
                    'application/json': {
                        schema: tecidoSchema
                    }
                }
            },
            404: {
                description: 'Tecido não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // DELETE /tecidos/{id} - Deletar tecido
    registry.registerPath({
        method: 'delete',
        path: '/tecidos/{id}',
        tags: ['Materiais'],
        summary: 'Deletar tecido (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Tecido deletado',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            404: {
                description: 'Tecido não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });
}
