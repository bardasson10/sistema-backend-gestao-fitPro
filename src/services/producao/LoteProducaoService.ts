import { IAddLoteItemsRequest, ICreateLoteProducaoRequest, IUpdateLoteProducaoRequest } from "../../interfaces/IProducao";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

class CreateLoteProducaoService {
    async execute({ codigoLote, responsavelId, status, observacao, items, rolos }: ICreateLoteProducaoRequest) {
        // Verificar se código de lote já existe
        const loteAlreadyExists = await prismaClient.loteProducao.findUnique({
            where: { codigoLote }
        });

        if (loteAlreadyExists) {
            throw new Error("Lote com este código já existe.");
        }

        if (!rolos || rolos.length === 0) {
            throw new Error("É necessário informar ao menos um rolo para identificar o tecido.");
        }

        // Validar e inferir tecidoId pelos rolos
        const roloIds = [...new Set(rolos.map(rolo => rolo.estoqueRoloId))];

        const rolosExistentes = await prismaClient.estoqueRolo.findMany({
            where: { id: { in: roloIds } }
        });

        if (rolosExistentes.length !== roloIds.length) {
            throw new Error("Um ou mais rolos não encontrados.");
        }

        if (rolosExistentes.length === 0) {
            throw new Error("Nenhum rolo encontrado.");
        }

        // Inferir tecidoId do primeiro rolo
        const primeiroRolo = rolosExistentes[0];
        if (!primeiroRolo) {
            throw new Error("Erro ao processar rolos.");
        }
        const tecidoIdFinal = primeiroRolo.tecidoId;

        // Verificar se todos os rolos são do mesmo tecido
        for (const roloExistente of rolosExistentes) {
            if (roloExistente.tecidoId !== tecidoIdFinal) {
                throw new Error("Todos os rolos devem pertencer ao mesmo tecido.");
            }
        }

        // Verificar se todos os rolos têm peso suficiente
        for (const rolo of rolos) {
            const roloExistente = rolosExistentes.find(r => r.id === rolo.estoqueRoloId);
            // Validar peso somente se rolo existir (já validado acima, mas por segurança de tipagem)
            if (roloExistente && Number(roloExistente.pesoAtualKg) < rolo.pesoReservado) {
                throw new Error(`Rolo ${roloExistente.id} não tem peso suficiente. Disponível: ${roloExistente.pesoAtualKg}kg, Solicitado: ${rolo.pesoReservado}kg`);
            }
        }

        // Verificar se tecido existe
        const tecido = await prismaClient.tecido.findUnique({
            where: { id: tecidoIdFinal }
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

        // Usar transação para criar lote, atualizar rolos e registrar movimentações
        const lote = await prismaClient.$transaction(async (tx) => {
            // Criar lote com items e rolos
            const novoLote = await tx.loteProducao.create({
                data: {
                    codigoLote,
                    tecidoId: tecidoIdFinal,
                    responsavelId,
                    status: status || "planejado",
                    observacao,
                    items: items ? {
                        create: items.map(item => ({
                            produtoId: item.produtoId,
                            tamanhoId: item.tamanhoId,
                            quantidadePlanejada: item.quantidadePlanejada
                        }))
                    } : undefined,
                    rolos: rolos ? {
                        create: rolos.map(rolo => ({
                            estoqueRoloId: rolo.estoqueRoloId,
                            pesoReservado: rolo.pesoReservado
                        }))
                    } : undefined
                },
                include: {
                    tecido: {
                        include: {
                            fornecedor: true,
                            cor: true,
                            rolos: true
                        }
                    },
                    responsavel: {
                        select: {
                            id: true,
                            nome: true,
                            perfil: true,
                            status: true,
                            funcaoSetor: true
                        }
                    },
                    items: {
                        include: {
                            tamanho: true,
                            produto: true
                        }
                    },
                    direcionamentos: true
                }
            });

            // Diminuir peso dos rolos e registrar movimentações de estoque
            for (const roloInfo of rolos) {
                const roloExistente = rolosExistentes.find(r => r.id === roloInfo.estoqueRoloId);
                
                if (roloExistente) {
                    // Atualizar peso do rolo
                    const novopeso = Number(roloExistente.pesoAtualKg) - roloInfo.pesoReservado;
                    
                    // Registrar movimentação de estoque
                    await tx.movimentacaoEstoque.create({
                        data: {
                            estoqueRoloId: roloInfo.estoqueRoloId,
                            usuarioId: responsavelId,
                            tipoMovimentacao: "saida",
                            pesoMovimentado: roloInfo.pesoReservado
                        }
                    });
                    
                    // Se peso chegar a 0, deletar rolo; caso contrário, atualizar
                    if (novopeso <= 0) {
                        await tx.estoqueRolo.delete({
                            where: { id: roloInfo.estoqueRoloId }
                        });
                    } else {
                        await tx.estoqueRolo.update({
                            where: { id: roloInfo.estoqueRoloId },
                            data: {
                                pesoAtualKg: novopeso,
                                situacao: "disponivel"
                            }
                        });
                    }
                }
            }

            return novoLote;
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
                    tecido: {
                        include: {
                            fornecedor: true,
                            cor: true
                        }
                    },
                    responsavel: {
                        select: {
                            id: true,
                            nome: true,
                            perfil: true,
                            status: true,
                            funcaoSetor: true
                        }
                    },
                    items: {
                        include: {
                            produto: true,
                            tamanho: true
                        }
                    },
                    rolos: {
                        include: {
                            rolo: true
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

        const lotesFormatted = lotes.map(lote => {
            const rolosList = lote.rolos.map(lr => ({
                ...lr.rolo,
                pesoReservado: Number(lr.pesoReservado)
            }));
            const pesoTotal = rolosList.reduce((acc, rolo) => acc + rolo.pesoReservado, 0);
            
            // Remover propriedade 'rolos' da raiz para não duplicar, já que estamos movendo para dentro de tecido
            const { rolos, ...loteSemRolos } = lote;

            return {
                ...loteSemRolos,
                tecido: {
                    ...lote.tecido,
                    rolos: {
                        itens: rolosList
                    },
                    pesoTotal
                }
            };
        });

        return createPaginatedResponse(lotesFormatted, total, pageNumber, pageLimit);
    }
}

class ListByIdLoteProducaoService {
    async execute(id: string) {
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id },
            include: {
                tecido: {
                    include: {
                        fornecedor: true,
                        cor: true
                    }
                },
                responsavel: {
                    select: {
                        id: true,
                        nome: true,
                        perfil: true,
                        status: true,
                        funcaoSetor: true
                    }
                },
                items: {
                    include: {
                        produto: true,
                        tamanho: true
                    }
                },
                rolos: {
                    include: {
                        rolo: true
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

        const rolosList = lote.rolos.map(lr => ({
            ...lr.rolo,
            pesoReservado: Number(lr.pesoReservado)
        }));
        const pesoTotal = rolosList.reduce((acc, rolo) => acc + rolo.pesoReservado, 0);
        
        // Remover propriedade 'rolos' da raiz
        const { rolos, ...loteSemRolos } = lote;

        return {
            ...loteSemRolos,
            tecido: {
                ...lote.tecido,
                rolos: {
                    itens: rolosList
                },
                pesoTotal
            }
        };
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

            // // Validar transições de status
            // const statusValidos: Record<string, string[]> = {
            //     "planejado": ["em_producao", "cancelado"],
            //     "em_producao": ["concluido", "cancelado"],
            //     "concluido": [],
            //     "cancelado": []
            // };

            // if (status && !statusValidos[lote.status]?.includes(status)) {
            //     throw new Error(`Não é permitido mudar status de '${lote.status}' para '${status}'.`);
            // }

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
                    const novoPeso = Number(rolo.pesoAtualKg) - roloInfo.pesoUtilizado;
                    
                    // Registrar movimentação de saída
                    await tx.movimentacaoEstoque.create({
                        data: {
                            estoqueRoloId: roloInfo.estoqueRoloId,
                            usuarioId,
                            tipoMovimentacao: "saida",
                            pesoMovimentado: roloInfo.pesoUtilizado
                        }
                    });
                    
                    // Se peso chegar a 0, deletar rolo; caso contrário, atualizar
                    if (novoPeso <= 0) {
                        await tx.estoqueRolo.delete({
                            where: { id: roloInfo.estoqueRoloId }
                        });
                    } else {
                        await tx.estoqueRolo.update({
                            where: { id: roloInfo.estoqueRoloId },
                            data: {
                                pesoAtualKg: novoPeso,
                                situacao: "em_uso"
                            }
                        });
                    }
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
                    tecido: {
                        include: {
                            fornecedor: true,
                            cor: true,
                            rolos: true
                        }
                    },
                    responsavel: {
                        select: {
                            id: true,
                            nome: true,
                            perfil: true,
                            status: true,
                            funcaoSetor: true
                        }
                    },
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
                    tecido: {
                        include: {
                            fornecedor: true,
                            cor: true,
                            rolos: true
                        }
                    },
                    responsavel: {
                        select: {
                            id: true,
                            nome: true,
                            perfil: true,
                            status: true,
                            funcaoSetor: true
                        }
                    },
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
                rolos: true,
                direcionamentos: true
            }
        });

        if (!lote) {
            throw new Error("Lote não encontrado.");
        }

        if (lote.direcionamentos.length > 0) {
            throw new Error("Não é possível deletar um lote que possui direcionamentos associados.");
        }

        // Deletar rolos primeiro (via cascade, mas explícito)
        await prismaClient.loteRolo.deleteMany({
            where: { loteProducaoId: id }
        });

        // Deletar items
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
