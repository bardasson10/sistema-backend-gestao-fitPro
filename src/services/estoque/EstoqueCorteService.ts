import prismaClient from "../../prisma";

class ListAllEstoqueCorteService {
    async execute(produtoId?: string, loteProducaoId?: string, tamanhoId?: string) {
        return prismaClient.estoqueCorte.findMany({
            where: {
                quantidadeDisponivel: { gt: 0 },
                ...(produtoId && { produtoId }),
                ...(loteProducaoId && { loteProducaoId }),
                ...(tamanhoId && { tamanhoId })
            },
            include: {
                produto: {
                    select: {
                        id: true,
                        nome: true,
                        sku: true
                    }
                },
                tamanho: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                lote: {
                    select: {
                        id: true,
                        codigoLote: true,
                        tecido: {
                            select: {
                                id: true,
                                nome: true,
                                cor: {
                                    select: {
                                        id: true,
                                        nome: true,
                                        codigoHex: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                updatedAt: "desc"
            }
        });
    }
}

class ListByIdEstoqueCorteService {
    async execute(id: string) {
        const estoque = await prismaClient.estoqueCorte.findUnique({
            where: { id },
            include: {
                produto: {
                    select: {
                        id: true,
                        nome: true,
                        sku: true
                    }
                },
                tamanho: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                lote: {
                    select: {
                        id: true,
                        codigoLote: true,
                        tecido: {
                            select: {
                                id: true,
                                nome: true,
                                cor: {
                                    select: {
                                        id: true,
                                        nome: true,
                                        codigoHex: true
                                    }
                                }
                            }
                        }
                    }
                },
                direcionamentoItems: {
                    include: {
                        direcionamento: {
                            select: {
                                id: true,
                                dataSaida: true,
                                faccao: {
                                    select: {
                                        nome: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        direcionamento: {
                            dataSaida: "desc"
                        }
                    }
                }
            }
        });

        if (!estoque) {
            throw new Error("Item de estoque de corte nao encontrado.");
        }

        const historicoEnvios = estoque.direcionamentoItems.map((item) => ({
            direcionamentoId: item.direcionamento.id,
            faccao: item.direcionamento.faccao.nome,
            quantidadeEnviada: item.quantidade,
            dataSaida: item.direcionamento.dataSaida
        }));

        return {
            id: estoque.id,
            quantidadeDisponivel: estoque.quantidadeDisponivel,
            produto: estoque.produto,
            tamanho: estoque.tamanho,
            lote: estoque.lote,
            historicoEnvios
        };
    }
}

class AjusteEstoqueCorteService {
    async execute(id: string, novaQuantidade: number, motivo: string, usuarioId?: string) {
        const estoque = await prismaClient.estoqueCorte.findUnique({
            where: { id },
            include: {
                produto: {
                    select: {
                        nome: true,
                        sku: true
                    }
                },
                tamanho: {
                    select: {
                        nome: true
                    }
                },
                lote: {
                    select: {
                        codigoLote: true
                    }
                }
            }
        });

        if (!estoque) {
            throw new Error("Item de estoque de corte nao encontrado.");
        }

        const atualizado = await prismaClient.estoqueCorte.update({
            where: { id },
            data: {
                quantidadeDisponivel: novaQuantidade
            },
            include: {
                produto: {
                    select: {
                        id: true,
                        nome: true,
                        sku: true
                    }
                },
                tamanho: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                lote: {
                    select: {
                        id: true,
                        codigoLote: true,
                        tecido: {
                            select: {
                                id: true,
                                nome: true,
                                cor: {
                                    select: {
                                        id: true,
                                        nome: true,
                                        codigoHex: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return {
            message: "Estoque de corte ajustado com sucesso.",
            motivo,
            usuarioId,
            quantidadeAnterior: estoque.quantidadeDisponivel,
            quantidadeAtual: atualizado.quantidadeDisponivel,
            item: atualizado
        };
    }
}

export { ListAllEstoqueCorteService, ListByIdEstoqueCorteService, AjusteEstoqueCorteService };
