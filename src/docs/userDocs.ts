import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { createUserSchema, authenticateUserSchema, updateUserSchema } from '../schemas/userSchemas';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export function registerUserRoutes(registry: OpenAPIRegistry) {
    // POST /users - Criar usuário
    registry.registerPath({
        method: 'post',
        path: '/users',
        tags: ['Autenticação'],
        summary: 'Criar novo usuário',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createUserSchema.shape.body
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'Usuário criado com sucesso',
                content: {
                    'application/json': {
                        schema: createUserSchema
                    }
                }
            },
            400: {
                description: 'Erro de validação',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    });

    // POST /session - Autenticar
    registry.registerPath({
        method: 'post',
        path: '/session',
        tags: ['Autenticação'],
        summary: 'Autenticar usuário',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: authenticateUserSchema.shape.body
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'Autenticação realizada',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                token: { type: 'string' },
                                user: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        nome: { type: 'string' },
                                        email: { type: 'string' },
                                        perfil: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            401: {
                description: 'Credenciais inválidas'
            }
        }
    });

    // GET /users/all - Listar todos
    registry.registerPath({
        method: 'get',
        path: '/users/all',
        tags: ['Autenticação'],
        summary: 'Listar todos os usuários',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de usuários',
                content: {
                    'application/json': {
                        schema: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    nome: { type: 'string' },
                                    email: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    // GET /user/me - Usuário autenticado
    registry.registerPath({
        method: 'get',
        path: '/user/me',
        tags: ['Autenticação'],
        summary: 'Obter dados do usuário autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Dados do usuário'
            }
        }
    });

    // GET /user/:id - Buscar por ID
    registry.registerPath({
        method: 'get',
        path: '/user/{id}',
        tags: ['Autenticação'],
        summary: 'Buscar usuário por ID (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Usuário encontrado'
            },
            404: {
                description: 'Usuário não encontrado'
            }
        }
    });

    // PUT /user/:id - Atualizar usuário
    registry.registerPath({
        method: 'put',
        path: '/user/{id}',
        tags: ['Autenticação'],
        summary: 'Atualizar dados de um usuário',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            }),
            body: {
                content: {
                    'application/json': {
                        schema: updateUserSchema.shape.body
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'Usuário atualizado com sucesso',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                nome: { type: 'string' },
                                email: { type: 'string' },
                                perfil: { type: 'string', enum: ['ADM', 'GERENTE', 'FUNCIONARIO'] },
                                status: { type: 'string' },
                                funcaoSetor: { type: 'string' },
                                createdAt: { type: 'string', format: 'date-time' },
                                updatedAt: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
                }
            },
            400: {
                description: 'Erro de validação'
            },
            404: {
                description: 'Usuário não encontrado'
            }
        }
    });
}
