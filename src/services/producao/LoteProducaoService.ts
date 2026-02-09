import { IAddLoteItemsRequest, ICreateLoteProducaoRequest, IUpdateLoteProducaoRequest } from "../../interfaces/IProducao";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

class CreateLoteProducaoService {
    async execute({ codigoLote, tecidoId, responsavelId, status, observacao, items }: ICreateLoteProducaoRequest) {
        // Verificar se código de lote já existe
        const loteAlreadyExists = await prismaClient.loteProducao.findUnique({
            where: { codigoLote }
        });

        if (loteAlreadyExists) {
            throw new Error("Lote com este código já existe.");
        }

        // Verificar se tecido existe
        const tecido = await prismaClient.tecido.findUnique({
            where: { id: tecidoId }
        });

        if (!tecido) {
            throw new Error("Tecido não encontrado.");
        }

        // Verificar se responsável existe
        const responsavel = await prismaClient.usuario.findUnique({
            where: { id: responsavelId }
        });

        if (!responsavel) {
            throw new Error("Responsável não encontrado.");
        }

        // Validar items se fornecidos
        if (items && items.length > 0) {
            // Verificar se produtos e tamanhos existem
            const produtoIds = [...new Set(items.map(item => item.produtoId))];
            const tamanhoIds = [...new Set(items.map(item => item.tamanhoId))];

            const produtos = await prismaClient.produto.findMany({
                where: { id: { in: produtoIds } }
            });

            if (produtos.length !== produtoIds.length) {
                throw new Error("Um ou mais produtos não encontrados.");
            }

            const tamanhos = await prismaClient.tamanho.findMany({
                where: { id: { in: tamanhoIds } }
            });

            if (tamanhos.length !== tamanhoIds.length) {
                throw new Error("Um ou mais tamanhos não encontrados.");
            }
        }

        // Criar lote com items
        const lote = await prismaClient.loteProducao.create({
            data: {
                codigoLote,
                tecidoId,
                responsavelId,
                status: status || "planejado",
                observacao,
                items: items ? {
                    create: items.map(item => ({
                        produtoId: item.produtoId,
                        tamanhoId: item.tamanhoId,
                        quantidadePlanejada: item.quantidadePlanejada
                    }))
                } : undefined
            },
            include: {
                tecido: true,
                responsavel: true,
                items: {
                    include: {
                        tamanho: true,
                        produto: true
                    }
                },
                direcionamentos: true
            }
        });

        return lote;
    }
}

class ListAllLoteProducaoService {
    async execute(status?: string, responsavelId?: string, page?: number | string, limit?: number | string): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const [lotes, total] = await Promise.all([
            prismaClient.loteProducao.findMany({
                where: {
                    ...(status && { status }),
                    ...(responsavelId && { responsavelId })
                },
                include: {
                    tecido: true,
                    responsavel: true,
                    items: {
                        include: {
                            produto: true,
                            tamanho: true
                        }
                    },
                    direcionamentos: true
                },
                skip,
                take: pageLimit,
                orderBy: {
                    createdAt: "desc"
                }
            }),
            prismaClient.loteProducao.count({
                where: {
                    ...(status && { status }),
                    ...(responsavelId && { responsavelId })
                }
            })
        ]);

        return createPaginatedResponse(lotes, total, pageNumber, pageLimit);
    }
}

class ListByIdLoteProducaoService {
    async execute(id: string) {
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id },
            include: {
                tecido: true,
                responsavel: true,
                items: {
                    include: {
                        produto: true,
                        tamanho: true
                    }
                },
                direcionamentos: {
                    include: {
                        faccao: true,
                        conferencias: true
                    }
                }
            }
        });

        if (!lote) {
            throw new Error("Lote não encontrado.");
        }

        return lote;
    }
}

class UpdateLoteProducaoService {
    async execute(id: string, { codigoLote, tecidoId, responsavelId, status, observacao, items, rolosProducao, usuarioId }: IUpdateLoteProducaoRequest) {
        return prismaClient.$transaction(async (tx) => {
            const lote = await tx.loteProducao.findUnique({
                where: { id }
            });

            if (!lote) {
                throw new Error("Lote não encontrado.");
            }

            // Validar transições de status
            const statusValidos: Record<string, string[]> = {
                "planejado": ["em_producao", "cancelado"],
                "em_producao": ["concluido", "cancelado"],
                "concluido": [],
                "cancelado": []
            };

            if (status && !statusValidos[lote.status]?.includes(status)) {
                throw new Error(`Não é permitido mudar status de '${lote.status}' para '${status}'.`);
            }

            // Registrar movimentações automáticas ao iniciar produção
            if (status === "em_producao" && lote.status === "planejado" && rolosProducao && rolosProducao.length > 0) {
                if (!usuarioId) {
                    throw new Error("usuárioId é obrigatório para registrar movimentações automáticas.");
                }

                // Validar e registrar saída de cada rolo
                for (const roloInfo of rolosProducao) {
                    const rolo = await tx.estoqueRolo.findUnique({
                        where: { id: roloInfo.estoqueRoloId }
                    });

                    if (!rolo) {
                        throw new Error(`Rolo ${roloInfo.estoqueRoloId} não encontrado.`);
                    }

                    // Verificar se o rolo é do tecido correto
                    if (rolo.tecidoId !== lote.tecidoId) {
                        throw new Error(`Rolo ${roloInfo.estoqueRoloId} não é do tecido especificado no lote.`);
                    }

                    // Verificar se tem peso suficiente
                    if (Number(rolo.pesoAtualKg) < roloInfo.pesoUtilizado) {
                        throw new Error(`Rolo ${roloInfo.estoqueRoloId} não tem peso suficiente. Disponível: ${rolo.pesoAtualKg}kg, Solicitado: ${roloInfo.pesoUtilizado}kg`);
                    }

                    // Atualizar peso do rolo
                    await tx.estoqueRolo.update({
                        where: { id: roloInfo.estoqueRoloId },
                        data: {
                            pesoAtualKg: Number(rolo.pesoAtualKg) - roloInfo.pesoUtilizado,
                            situacao: "em_uso"
                        }
                    });

                    // Registrar movimentação de saída
                    await tx.movimentacaoEstoque.create({
                        data: {
                            estoqueRoloId: roloInfo.estoqueRoloId,
                            usuarioId,
                            tipoMovimentacao: "saida",
                            pesoMovimentado: roloInfo.pesoUtilizado
                        }
                    });
                }
            }

            // Se codigoLote foi mudado, verificar se já existe outro lote com esse código
            if (codigoLote && codigoLote !== lote.codigoLote) {
                const loteComMesmoCodigo = await tx.loteProducao.findUnique({
                    where: { codigoLote }
                });
                if (loteComMesmoCodigo) {
                    throw new Error("Já existe outro lote com este código.");
                }
            }

            // Se tecidoId foi fornecido, validar
            if (tecidoId) {
                const tecido = await tx.tecido.findUnique({
                    where: { id: tecidoId }
                });
                if (!tecido) {
                    throw new Error("Tecido não encontrado.");
                }
            }

            // Se responsavelId foi fornecido, validar
            if (responsavelId) {
                const responsavel = await tx.usuario.findUnique({
                    where: { id: responsavelId }
                });
                if (!responsavel) {
                    throw new Error("Responsável não encontrado.");
                }
            }

            // Se items foram fornecidos, validar e criar
            if (items && items.length > 0) {
                if (["concluido", "cancelado"].includes(lote.status)) {
                    throw new Error("Não é possível adicionar items a um lote concluído ou cancelado.");
                }

                const produtoIds = [...new Set(items.map(item => item.produtoId))];
                const tamanhoIds = [...new Set(items.map(item => item.tamanhoId))];

                const produtos = await tx.produto.findMany({
                    where: { id: { in: produtoIds } }
                });

                if (produtos.length !== produtoIds.length) {
                    throw new Error("Um ou mais produtos não encontrados.");
                }

                const tamanhos = await tx.tamanho.findMany({
                    where: { id: { in: tamanhoIds } }
                });

                if (tamanhos.length !== tamanhoIds.length) {
                    throw new Error("Um ou mais tamanhos não encontrados.");
                }

                // Adicionar novos items
                await tx.loteItem.createMany({
                    data: items.map(item => ({
                        loteProducaoId: id,
                        produtoId: item.produtoId,
                        tamanhoId: item.tamanhoId,
                        quantidadePlanejada: item.quantidadePlanejada
                    }))
                });
            }

            const loteAtualizado = await tx.loteProducao.update({
                where: { id },
                data: {
                    ...(codigoLote && { codigoLote }),
                    ...(tecidoId && { tecidoId }),
                    ...(responsavelId && { responsavelId }),
                    status,
                    observacao
                },
                include: {
                    tecido: true,
                    responsavel: true,
                    items: {
                        include: {
                            produto: true,
                            tamanho: true
                        }
                    },
                    direcionamentos: true
                }
            });

            return loteAtualizado;
        });
    }
}

class AddLoteItemsService {
    async execute(id: string, { items }: IAddLoteItemsRequest) {
        if (!items || items.length === 0) {
            throw new Error("Informe ao menos um item.");
        }

        const loteAtualizado = await prismaClient.$transaction(async (tx) => {
            const lote = await tx.loteProducao.findUnique({
                where: { id }
            });

            if (!lote) {
                throw new Error("Lote não encontrado.");
            }

            if (["concluido", "cancelado"].includes(lote.status)) {
                throw new Error("Não é possível adicionar items a um lote concluído ou cancelado.");
            }

            const produtoIds = [...new Set(items.map(item => item.produtoId))];
            const tamanhoIds = [...new Set(items.map(item => item.tamanhoId))];

            const produtos = await tx.produto.findMany({
                where: { id: { in: produtoIds } }
            });

            if (produtos.length !== produtoIds.length) {
                throw new Error("Um ou mais produtos não encontrados.");
            }

            const tamanhos = await tx.tamanho.findMany({
                where: { id: { in: tamanhoIds } }
            });

            if (tamanhos.length !== tamanhoIds.length) {
                throw new Error("Um ou mais tamanhos não encontrados.");
            }

            await tx.loteItem.createMany({
                data: items.map(item => ({
                    loteProducaoId: id,
                    produtoId: item.produtoId,
                    tamanhoId: item.tamanhoId,
                    quantidadePlanejada: item.quantidadePlanejada
                }))
            });

            return tx.loteProducao.findUnique({
                where: { id },
                include: {
                    tecido: true,
                    responsavel: true,
                    items: {
                        include: {
                            produto: true,
                            tamanho: true
                        }
                    },
                    direcionamentos: true
                }
            });
        });

        return loteAtualizado;
    }
}

class DeleteLoteProducaoService {
    async execute(id: string) {
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id },
            include: {
                items: true,
                direcionamentos: true
            }
        });

        if (!lote) {
            throw new Error("Lote não encontrado.");
        }

        if (lote.direcionamentos.length > 0) {
            throw new Error("Não é possível deletar um lote que possui direcionamentos associados.");
        }

        // Deletar items primeiro
        await prismaClient.loteItem.deleteMany({
            where: { loteProducaoId: id }
        });

        // Deletar lote
        await prismaClient.loteProducao.delete({
            where: { id }
        });

        return { message: "Lote deletado com sucesso." };
    }
}

export { CreateLoteProducaoService, ListAllLoteProducaoService, ListByIdLoteProducaoService, UpdateLoteProducaoService, AddLoteItemsService, DeleteLoteProducaoService };
