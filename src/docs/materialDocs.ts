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
                description: 'Fornecedor criado com sucesso'
            },
            400: {
                description: 'Erro de validação'
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
                description: 'Lista de fornecedores'
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
                description: 'Fornecedor encontrado'
            },
            404: {
                description: 'Fornecedor não encontrado'
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
                description: 'Fornecedor atualizado'
            },
            404: {
                description: 'Fornecedor não encontrado'
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
                description: 'Fornecedor deletado'
            },
            404: {
                description: 'Fornecedor não encontrado'
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
                description: 'Cor criada com sucesso'
            },
            400: {
                description: 'Erro de validação'
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
                description: 'Lista de cores'
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
                description: 'Cor encontrada'
            },
            404: {
                description: 'Cor não encontrada'
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
                description: 'Cor atualizada'
            },
            404: {
                description: 'Cor não encontrada'
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
                description: 'Cor deletada'
            },
            404: {
                description: 'Cor não encontrada'
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
                description: 'Tecido criado com sucesso'
            },
            400: {
                description: 'Erro de validação'
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
                description: 'Lista de tecidos'
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
                description: 'Tecido encontrado'
            },
            404: {
                description: 'Tecido não encontrado'
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
                description: 'Tecido atualizado'
            },
            404: {
                description: 'Tecido não encontrado'
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
                description: 'Tecido deletado'
            },
            404: {
                description: 'Tecido não encontrado'
            }
        }
    });
}
