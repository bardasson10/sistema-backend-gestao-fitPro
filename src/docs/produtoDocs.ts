import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
    createTipoProdutoSchema,
    updateTipoProdutoSchema,
    createTamanhoSchema,
    updateTamanhoSchema,
    createProdutoSchema,
    updateProdutoSchema,
    createTipoProdutoTamanhoSchema,
} from '../schemas/produtoSchemas';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export function registerProdutoRoutes(registry: OpenAPIRegistry) {
    // POST /tipos-produto - Criar tipo de produto
    registry.registerPath({
        method: 'post',
        path: '/tipos-produto',
        tags: ['Produtos'],
        summary: 'Criar tipo de produto',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createTipoProdutoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Tipo de produto criado com sucesso',
                content: {
                    'application/json': {
                        schema: createTipoProdutoSchema
                    }
                }
            },
            400: {
                description: 'Erro de validação'
            }
        }
    });

    // GET /tipos-produto - Listar tipos de produto
    registry.registerPath({
        method: 'get',
        path: '/tipos-produto',
        tags: ['Produtos'],
        summary: 'Listar tipos de produto',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de tipos de produto'
            }
        }
    });

    // GET /tipos-produto/{id} - Buscar tipo de produto por ID
    registry.registerPath({
        method: 'get',
        path: '/tipos-produto/{id}',
        tags: ['Produtos'],
        summary: 'Buscar tipo de produto por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Tipo de produto encontrado'
            },
            404: {
                description: 'Tipo de produto não encontrado'
            }
        }
    });

    // PUT /tipos-produto/{id} - Atualizar tipo de produto
    registry.registerPath({
        method: 'put',
        path: '/tipos-produto/{id}',
        tags: ['Produtos'],
        summary: 'Atualizar tipo de produto',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateTipoProdutoSchema.shape.body
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
                description: 'Tipo de produto atualizado'
            },
            404: {
                description: 'Tipo de produto não encontrado'
            }
        }
    });

    // DELETE /tipos-produto/{id} - Deletar tipo de produto
    registry.registerPath({
        method: 'delete',
        path: '/tipos-produto/{id}',
        tags: ['Produtos'],
        summary: 'Deletar tipo de produto (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Tipo de produto deletado'
            },
            404: {
                description: 'Tipo de produto não encontrado'
            }
        }
    });

    // POST /tamanhos - Criar tamanho
    registry.registerPath({
        method: 'post',
        path: '/tamanhos',
        tags: ['Produtos'],
        summary: 'Criar tamanho',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createTamanhoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Tamanho criado com sucesso'
            },
            400: {
                description: 'Erro de validação'
            }
        }
    });

    // GET /tamanhos - Listar tamanhos
    registry.registerPath({
        method: 'get',
        path: '/tamanhos',
        tags: ['Produtos'],
        summary: 'Listar tamanhos',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de tamanhos'
            }
        }
    });

    // GET /tamanhos/{id} - Buscar tamanho por ID
    registry.registerPath({
        method: 'get',
        path: '/tamanhos/{id}',
        tags: ['Produtos'],
        summary: 'Buscar tamanho por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Tamanho encontrado'
            },
            404: {
                description: 'Tamanho não encontrado'
            }
        }
    });

    // PUT /tamanhos/{id} - Atualizar tamanho
    registry.registerPath({
        method: 'put',
        path: '/tamanhos/{id}',
        tags: ['Produtos'],
        summary: 'Atualizar tamanho',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateTamanhoSchema.shape.body
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
                description: 'Tamanho atualizado'
            },
            404: {
                description: 'Tamanho não encontrado'
            }
        }
    });

    // DELETE /tamanhos/{id} - Deletar tamanho
    registry.registerPath({
        method: 'delete',
        path: '/tamanhos/{id}',
        tags: ['Produtos'],
        summary: 'Deletar tamanho (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Tamanho deletado'
            },
            404: {
                description: 'Tamanho não encontrado'
            }
        }
    });

    // POST /produtos - Criar produto
    registry.registerPath({
        method: 'post',
        path: '/produtos',
        tags: ['Produtos'],
        summary: 'Criar produto',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createProdutoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Produto criado com sucesso'
            },
            400: {
                description: 'Erro de validação'
            }
        }
    });

    // GET /produtos - Listar produtos
    registry.registerPath({
        method: 'get',
        path: '/produtos',
        tags: ['Produtos'],
        summary: 'Listar produtos',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de produtos'
            }
        }
    });

    // GET /produtos/{id} - Buscar produto por ID
    registry.registerPath({
        method: 'get',
        path: '/produtos/{id}',
        tags: ['Produtos'],
        summary: 'Buscar produto por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Produto encontrado'
            },
            404: {
                description: 'Produto não encontrado'
            }
        }
    });

    // PUT /produtos/{id} - Atualizar produto
    registry.registerPath({
        method: 'put',
        path: '/produtos/{id}',
        tags: ['Produtos'],
        summary: 'Atualizar produto',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateProdutoSchema.shape.body
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
                description: 'Produto atualizado'
            },
            404: {
                description: 'Produto não encontrado'
            }
        }
    });

    // DELETE /produtos/{id} - Deletar produto
    registry.registerPath({
        method: 'delete',
        path: '/produtos/{id}',
        tags: ['Produtos'],
        summary: 'Deletar produto (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Produto deletado'
            },
            404: {
                description: 'Produto não encontrado'
            }
        }
    });

    // POST /tipos-produto-tamanho - Associar tipo de produto a tamanho
    registry.registerPath({
        method: 'post',
        path: '/tipos-produto-tamanho',
        tags: ['Produtos'],
        summary: 'Associar tipo de produto a tamanho',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createTipoProdutoTamanhoSchema.shape.body
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Associação criada com sucesso'
            },
            400: {
                description: 'Erro de validação'
            }
        }
    });

    // GET /tipos-produto/{tipoProdutoId}/tamanhos - Listar tamanhos por tipo
    registry.registerPath({
        method: 'get',
        path: '/tipos-produto/{tipoProdutoId}/tamanhos',
        tags: ['Produtos'],
        summary: 'Listar tamanhos por tipo de produto',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                tipoProdutoId: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Lista de tamanhos do tipo de produto'
            },
            404: {
                description: 'Tipo de produto não encontrado'
            }
        }
    });

    // DELETE /tipos-produto-tamanho/{id} - Remover associação
    registry.registerPath({
        method: 'delete',
        path: '/tipos-produto-tamanho/{id}',
        tags: ['Produtos'],
        summary: 'Remover associação tipo de produto e tamanho (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Associação removida'
            },
            404: {
                description: 'Associação não encontrada'
            }
        }
    });
}