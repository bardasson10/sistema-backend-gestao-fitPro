import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
    createFaccaoSchema,
    updateFaccaoSchema,
    createLoteProducaoSchema,
    updateLoteProducaoSchema,
    createDirecionamentoSchema,
    updateDirecionamentoSchema,
    createConferenciaSchema,
    updateConferenciaSchema,
} from '../schemas/producaoSchemas';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export function registerProducaoRoutes(registry: OpenAPIRegistry) {
    // POST /faccoes - Criar facção
    registry.registerPath({
        method: 'post',
        path: '/faccoes',
        tags: ['Produção'],
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
                description: 'Facção criada com sucesso'
            },
            400: {
                description: 'Erro de validação'
            }
        }
    });

    // GET /faccoes - Listar facções
    registry.registerPath({
        method: 'get',
        path: '/faccoes',
        tags: ['Produção'],
        summary: 'Listar facções',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de facções'
            }
        }
    });

    // GET /faccoes/{id} - Buscar facção por ID
    registry.registerPath({
        method: 'get',
        path: '/faccoes/{id}',
        tags: ['Produção'],
        summary: 'Buscar facção por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Facção encontrada'
            },
            404: {
                description: 'Facção não encontrada'
            }
        }
    });

    // PUT /faccoes/{id} - Atualizar facção
    registry.registerPath({
        method: 'put',
        path: '/faccoes/{id}',
        tags: ['Produção'],
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
                description: 'Facção atualizada'
            },
            404: {
                description: 'Facção não encontrada'
            }
        }
    });

    // DELETE /faccoes/{id} - Deletar facção
    registry.registerPath({
        method: 'delete',
        path: '/faccoes/{id}',
        tags: ['Produção'],
        summary: 'Deletar facção (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Facção deletada'
            },
            404: {
                description: 'Facção não encontrada'
            }
        }
    });

    // POST /lotes-producao - Criar lote de produção
    registry.registerPath({
        method: 'post',
        path: '/lotes-producao',
        tags: ['Produção'],
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
                description: 'Lote de produção criado com sucesso'
            },
            400: {
                description: 'Erro de validação'
            }
        }
    });

    // GET /lotes-producao - Listar lotes de produção
    registry.registerPath({
        method: 'get',
        path: '/lotes-producao',
        tags: ['Produção'],
        summary: 'Listar lotes de produção',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de lotes de produção'
            }
        }
    });

    // GET /lotes-producao/{id} - Buscar lote por ID
    registry.registerPath({
        method: 'get',
        path: '/lotes-producao/{id}',
        tags: ['Produção'],
        summary: 'Buscar lote de produção por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Lote de produção encontrado'
            },
            404: {
                description: 'Lote de produção não encontrado'
            }
        }
    });

    // PUT /lotes-producao/{id} - Atualizar lote de produção
    registry.registerPath({
        method: 'put',
        path: '/lotes-producao/{id}',
        tags: ['Produção'],
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
                description: 'Lote de produção atualizado'
            },
            404: {
                description: 'Lote de produção não encontrado'
            }
        }
    });

    // DELETE /lotes-producao/{id} - Deletar lote de produção
    registry.registerPath({
        method: 'delete',
        path: '/lotes-producao/{id}',
        tags: ['Produção'],
        summary: 'Deletar lote de produção (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Lote de produção deletado'
            },
            404: {
                description: 'Lote de produção não encontrado'
            }
        }
    });

    // POST /direcionamentos - Criar direcionamento
    registry.registerPath({
        method: 'post',
        path: '/direcionamentos',
        tags: ['Produção'],
        summary: 'Criar direcionamento',
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
                description: 'Direcionamento criado com sucesso'
            },
            400: {
                description: 'Erro de validação'
            }
        }
    });

    // GET /direcionamentos - Listar direcionamentos
    registry.registerPath({
        method: 'get',
        path: '/direcionamentos',
        tags: ['Produção'],
        summary: 'Listar direcionamentos',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de direcionamentos'
            }
        }
    });

    // GET /direcionamentos/{id} - Buscar direcionamento por ID
    registry.registerPath({
        method: 'get',
        path: '/direcionamentos/{id}',
        tags: ['Produção'],
        summary: 'Buscar direcionamento por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Direcionamento encontrado'
            },
            404: {
                description: 'Direcionamento não encontrado'
            }
        }
    });

    // PUT /direcionamentos/{id} - Atualizar direcionamento
    registry.registerPath({
        method: 'put',
        path: '/direcionamentos/{id}',
        tags: ['Produção'],
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
                description: 'Direcionamento atualizado'
            },
            404: {
                description: 'Direcionamento não encontrado'
            }
        }
    });

    // DELETE /direcionamentos/{id} - Deletar direcionamento
    registry.registerPath({
        method: 'delete',
        path: '/direcionamentos/{id}',
        tags: ['Produção'],
        summary: 'Deletar direcionamento (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Direcionamento deletado'
            },
            404: {
                description: 'Direcionamento não encontrado'
            }
        }
    });

    // POST /conferencias - Criar conferência
    registry.registerPath({
        method: 'post',
        path: '/conferencias',
        tags: ['Produção'],
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
                description: 'Conferência criada com sucesso'
            },
            400: {
                description: 'Erro de validação'
            }
        }
    });

    // GET /conferencias - Listar conferências
    registry.registerPath({
        method: 'get',
        path: '/conferencias',
        tags: ['Produção'],
        summary: 'Listar conferências',
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: 'Lista de conferências'
            }
        }
    });

    // GET /conferencias/{id} - Buscar conferência por ID
    registry.registerPath({
        method: 'get',
        path: '/conferencias/{id}',
        tags: ['Produção'],
        summary: 'Buscar conferência por ID',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Conferência encontrada'
            },
            404: {
                description: 'Conferência não encontrada'
            }
        }
    });

    // PUT /conferencias/{id} - Atualizar conferência
    registry.registerPath({
        method: 'put',
        path: '/conferencias/{id}',
        tags: ['Produção'],
        summary: 'Atualizar conferência',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: updateConferenciaSchema.shape.body
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
                description: 'Conferência atualizada'
            },
            404: {
                description: 'Conferência não encontrada'
            }
        }
    });

    // DELETE /conferencias/{id} - Deletar conferência
    registry.registerPath({
        method: 'delete',
        path: '/conferencias/{id}',
        tags: ['Produção'],
        summary: 'Deletar conferência (admin)',
        security: [{ bearerAuth: [] }],
        request: {
            params: z.object({
                id: z.uuid()
            })
        },
        responses: {
            200: {
                description: 'Conferência deletada'
            },
            404: {
                description: 'Conferência não encontrada'
            }
        }
    });

  ['get', 'put', 'delete'].forEach(method => {
    registry.registerPath({
      method: method as any,
      path: '/conferencias/{id}',
      tags: ['Produção'],
      summary: method === 'get' ? 'Buscar conferência por ID' : method === 'put' ? 'Atualizar conferência' : 'Deletar conferência (admin)',
      security: [{ bearerAuth: [] }],
      request: {
        params: z.object({
          id: z.uuid()
        })
      },
      responses: { 200: { description: method === 'get' ? 'Conferência encontrada' : method === 'put' ? 'Conferência atualizada' : 'Conferência removida' } }
    });
  });

  registry.registerPath({
    method: 'get',
    path: '/conferencias/relatorio/produtividade',
    tags: ['Produção'],
    summary: 'Relatório de produtividade de conferências',
    security: [{ bearerAuth: [] }],
    responses: { 200: { description: 'Relatório de produtividade' } }
  });
}
