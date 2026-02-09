import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
    createEstoqueRoloSchema,
    updateEstoqueRoloSchema,
    createMovimentacaoEstoqueSchema,
} from '../schemas/estoqueSchemas';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export function registerEstoqueRoutes(registry: OpenAPIRegistry) {
    // POST /estoque-rolos - Criar rolo de estoque
    registry.registerPath({
        method: 'post',
        path: '/estoque-rolos',
        tags: ['Estoque'],
        summary: 'Criar rolo de estoque',
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
            200: {
                description: 'Rolo de estoque criado com sucesso'
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
                description: 'Lista de rolos de estoque'
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
                description: 'Rolo de estoque encontrado'
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
                description: 'Rolo de estoque atualizado'
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
                description: 'Rolo de estoque deletado'
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
                description: 'Relatório do estoque'
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
                description: 'Movimentação de estoque criada com sucesso'
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
                description: 'Lista de movimentações de estoque'
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
                description: 'Movimentação de estoque encontrada'
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
                description: 'Histórico de movimentações do rolo'
            },
            404: {
                description: 'Rolo não encontrado'
            }
        }
    });
}
