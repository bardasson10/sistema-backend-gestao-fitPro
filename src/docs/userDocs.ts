import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { createUserSchema, authenticateUserSchema, updateUserSchema } from '../schemas/userSchemas';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const errorSchema = z.object({
    error: z.string()
});

const messageSchema = z.object({
    message: z.string()
});

const userSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    email: z.string().email(),
    perfil: z.enum(['ADM', 'GERENTE', 'FUNCIONARIO']),
    status: z.string().optional(),
    funcaoSetor: z.string().nullable().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional()
});

const authResponseSchema = z.object({
    id: z.string().uuid(),
    nome: z.string(),
    email: z.string().email(),
    perfil: z.enum(['ADM', 'GERENTE', 'FUNCIONARIO']),
    token: z.string(),
    dataCriacao: z.string().datetime()
});

const paginatedUsersSchema = z.object({
    data: z.array(userSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});

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
                        schema: userSchema
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

    // POST /session - Autenticar
    registry.registerPath({
        method: 'post',
        path: '/session',
        tags: ['Autenticação'],
        summary: 'Autenticar usuário',
        description: 'Realiza login do usuário. Apenas uma sessão pode estar ativa por conta. Ao fazer novo login, a sessão anterior será automaticamente invalidada.',
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
                        schema: authResponseSchema
                    }
                }
            },
            401: {
                description: 'Credenciais inválidas',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });

    // POST /logout - Logout
    registry.registerPath({
        method: 'post',
        path: '/logout',
        tags: ['Autenticação'],
        summary: 'Realizar logout',
        description: 'Invalida a sessão atual do usuário autenticado.',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Logout realizado com sucesso',
                content: {
                    'application/json': {
                        schema: messageSchema
                    }
                }
            },
            401: {
                description: 'Token não fornecido ou inválido',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
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
                        schema: paginatedUsersSchema
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
                description: 'Dados do usuário',
                content: {
                    'application/json': {
                        schema: userSchema
                    }
                }
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
                description: 'Usuário encontrado',
                content: {
                    'application/json': {
                        schema: userSchema
                    }
                }
            },
            404: {
                description: 'Usuário não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
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
                description: 'Erro de validação',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            },
            404: {
                description: 'Usuário não encontrado',
                content: {
                    'application/json': {
                        schema: errorSchema
                    }
                }
            }
        }
    });
}
