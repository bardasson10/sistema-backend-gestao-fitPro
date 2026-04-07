import {
    ICreateDirecionamentoRequest,
    IUpdateDirecionamentoRequest,
    IUpdateDirecionamentoStatusRequest,
    IUpdateDirecionamentoSkuPriceRequest
} from "../../interfaces/IProducao";
import { parsePaginationParams, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

type QueryFilterValue = string | string[] | undefined;

function normalizarQueryParaArray(valor?: QueryFilterValue) {
    if (!valor) {
        return [] as string[];
    }

    const valores = Array.isArray(valor) ? valor : [valor];
    return valores
        .flatMap(item => String(item).split(","))
        .map(item => item.trim())
        .filter(Boolean);
}

function toNumber(value: unknown): number | null {
    if (value == null) {
        return null;
    }

    if (typeof value === "number") {
        return value;
    }

    if (typeof value === "object" && value !== null && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
        return (value as { toNumber: () => number }).toNumber();
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

const direcionamentoInclude = {
    faccao: true,
    items: {
        include: {
            estoqueCorte: {
                include: {
                    lote: {
                        include: {
                            tecido: true,
                            responsavel: true
                        }
                    },
                    produto: true,
                    tamanho: true
                }
            }
        }
    },
    conferencias: {
        include: {
            responsavel: true,
            items: {
                include: {
                    direcionamentoItem: {
                        include: {
                            estoqueCorte: {
                                include: {
                                    produto: true,
                                    tamanho: true,
                                    cor: true,
                                    lote: {
                                        select: {
                                            id: true,
                                            codigoLote: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
} as const;

const direcionamentoListSelect = {
    id: true,
    status: true,
    tipoServico: true,
    quantidade: true,
    dataSaida: true,
    dataPrevisaoRetorno: true,
    createdAt: true,
    faccao: {
        select: {
            id: true,
            nome: true,
            responsavel: true
        }
    },
    items: {
        select: {
            id: true,
            quantidade: true,
            valorFaccaoPorPeca: true,
            estoqueCorte: {
                select: {
                    produto: {
                        select: {
                            id: true,
                            nome: true,
                            sku: true
                        }
                    },
                    cor: {
                        select: {
                            id: true,
                            nome: true,
                            codigoHex: true
                        }
                    },
                    tamanho: {
                        select: {
                            nome: true
                        }
                    },
                    lote: {
                        select: {
                            id: true,
                            codigoLote: true
                        }
                    }
                }
            }
        }
    }
} as const;

function mapDirecionamentoParaListagem(direcionamento: any) {
    return {
        valorTotalEstimado: direcionamento.items.reduce((sum: number, item: any) => {
            const valorPorPeca = toNumber(item.valorFaccaoPorPeca) ?? 0;
            return sum + (item.quantidade * valorPorPeca);
        }, 0),
        id: direcionamento.id,
        status: direcionamento.status,
        tipoServico: direcionamento.tipoServico,
        quantidade: direcionamento.quantidade,
        dataSaida: direcionamento.dataSaida,
        dataPrevisaoRetorno: direcionamento.dataPrevisaoRetorno,
        faccao: {
            id: direcionamento.faccao.id,
            nome: direcionamento.faccao.nome,
            responsavel: direcionamento.faccao.responsavel ?? ""
        },
        items: direcionamento.items.map((item: any) => ({
            valorFaccaoPorPeca: toNumber(item.valorFaccaoPorPeca),
            valorEstimadoItem: item.quantidade * (toNumber(item.valorFaccaoPorPeca) ?? 0),
            id: item.id,
            quantidade: item.quantidade,
            produto: {
                id: item.estoqueCorte.produto.id,
                nome: item.estoqueCorte.produto.nome,
                sku: item.estoqueCorte.produto.sku,
                cor: {
                    id: item.estoqueCorte.cor.id,
                    nome: item.estoqueCorte.cor.nome,
                    codigoHex: item.estoqueCorte.cor.codigoHex ?? ""
                },
                tamanho: item.estoqueCorte.tamanho.nome
            },
            lote: {
                id: item.estoqueCorte.lote.id,
                codigoLote: item.estoqueCorte.lote.codigoLote
            }
        })),
        createdAt: direcionamento.createdAt
    };
}

function mapQuantidadeSolicitadaPorEstoque(direcionamentos: ICreateDirecionamentoRequest["direcionamentos"]) {
    const quantidadePorEstoque = new Map<string, number>();

    for (const direcionamento of direcionamentos) {
        for (const item of direcionamento.items) {
            const atual = quantidadePorEstoque.get(item.estoqueCorteId) ?? 0;
            quantidadePorEstoque.set(item.estoqueCorteId, atual + item.quantidade);
        }
    }

    return quantidadePorEstoque;
}

class CreateDirecionamentoService {
    async execute({ direcionamentos }: ICreateDirecionamentoRequest) {
        if (!direcionamentos?.length) {
            throw new Error("Informe ao menos um direcionamento.");
        }

        const faccoesIds: string[] = [];

        for (const direcao of direcionamentos) {
            if (!direcao.items?.length) {
                throw new Error("Cada direcionamento deve ter ao menos um item.");
            }

            faccoesIds.push(direcao.faccaoId);

            for (const dirItem of direcao.items) {
                if (dirItem.quantidade <= 0) {
                    throw new Error("Quantidade de direcionamento deve ser maior que 0.");
                }
            }
        }

        const faccoesUnicas = [...new Set(faccoesIds)];
        const faccoes = await prismaClient.faccao.findMany({
            where: { id: { in: faccoesUnicas } },
            select: { id: true, status: true }
        });

        if (faccoes.length !== faccoesUnicas.length) {
            throw new Error("Uma ou mais faccoes nao foram encontradas.");
        }

        if (faccoes.some((faccao) => faccao.status !== "ativo")) {
            throw new Error("Uma ou mais faccoes estao inativas. Nao e possivel enviar direcionamentos.");
        }

        const quantidadePorEstoque = mapQuantidadeSolicitadaPorEstoque(direcionamentos);
        const estoqueIds = Array.from(quantidadePorEstoque.keys());

        const estoques = await prismaClient.estoqueCorte.findMany({
            where: { id: { in: estoqueIds } },
            include: {
                lote: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            }
        });

        if (estoques.length !== estoqueIds.length) {
            throw new Error("Um ou mais itens de estoque de corte nao foram encontrados.");
        }

        const estoquePorId = new Map(estoques.map((estoque) => [estoque.id, estoque]));

        for (const [estoqueCorteId, quantidadeSolicitada] of quantidadePorEstoque.entries()) {
            const estoque = estoquePorId.get(estoqueCorteId);
            if (!estoque) {
                throw new Error("Item de estoque de corte nao encontrado.");
            }

            if (estoque.lote.status !== "cortado") {
                throw new Error(`Nao e permitido enviar para remessa itens de lote ainda nao cortado. Lote ${estoque.lote.id} com status '${estoque.lote.status}'.`);
            }

            if (quantidadeSolicitada > estoque.quantidadeDisponivel) {
                throw new Error(`Estoque insuficiente para o item ${estoqueCorteId}. Disponivel: ${estoque.quantidadeDisponivel}.`);
            }
        }

        const direcionamentosCriadosIds = await prismaClient.$transaction(async (tx) => {
            for (const [estoqueCorteId, quantidadeSolicitada] of quantidadePorEstoque.entries()) {
                const resultado = await tx.estoqueCorte.updateMany({
                    where: {
                        id: estoqueCorteId,
                        quantidadeDisponivel: {
                            gte: quantidadeSolicitada
                        }
                    },
                    data: {
                        quantidadeDisponivel: {
                            decrement: quantidadeSolicitada
                        }
                    }
                });

                if (resultado.count !== 1) {
                    throw new Error(`Saldo insuficiente para o item ${estoqueCorteId} durante a confirmacao da remessa.`);
                }
            }

            const criados = await Promise.all(
                direcionamentos.map((direcionamento) => {
                    const quantidadeTotal = direcionamento.items.reduce((sum, item) => sum + item.quantidade, 0);

                    return tx.direcionamento.create({
                        data: {
                            faccaoId: direcionamento.faccaoId,
                            tipoServico: direcionamento.tipoServico,
                            quantidade: quantidadeTotal,
                            status: "separado",
                            items: {
                                create: direcionamento.items.map((item) => ({
                                    estoqueCorteId: item.estoqueCorteId,
                                    quantidade: item.quantidade
                                }))
                            }
                        },
                        select: {
                            id: true
                        }
                    });
                })
            );

            return criados.map((direcionamento) => direcionamento.id);
        }, {
            maxWait: 10000,
            timeout: 30000
        });

        const direcionamentosCriados = await prismaClient.direcionamento.findMany({
            where: {
                id: {
                    in: direcionamentosCriadosIds
                }
            },
            include: direcionamentoInclude
        });

        const direcionamentosPorId = new Map(
            direcionamentosCriados.map((direcionamento) => [direcionamento.id, direcionamento])
        );

        return direcionamentosCriadosIds
            .map((id) => direcionamentosPorId.get(id))
            .filter((direcionamento): direcionamento is NonNullable<typeof direcionamento> => Boolean(direcionamento));
    }
}

class ListAllDirecionamentoService {
    async execute(status?: QueryFilterValue, faccaoId?: QueryFilterValue, page?: number | string, limit?: number | string, somenteProntasParaConferencia = false): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const statusArray = normalizarQueryParaArray(status);
        const faccaoIdArray = normalizarQueryParaArray(faccaoId);

        const whereBase: any = {
            ...(statusArray.length > 0 && { status: { in: statusArray } }),
            ...(faccaoIdArray.length > 0 && { faccaoId: { in: faccaoIdArray } })
        };

        if (somenteProntasParaConferencia) {
            whereBase.NOT = {
                conferencias: {
                    some: {
                        OR: [
                            { status: null },
                            { status: { not: "recebido" } }
                        ]
                    }
                }
            };
        }

        const [direcionamentos, total] = await Promise.all([
            prismaClient.direcionamento.findMany({
                where: whereBase,
                select: direcionamentoListSelect,
                skip,
                take: pageLimit,
                orderBy: {
                    createdAt: "desc"
                }
            }),
            prismaClient.direcionamento.count({
                where: whereBase
            })
        ]);

        const data = direcionamentos.map(mapDirecionamentoParaListagem);

        const totalPages = Math.ceil(total / pageLimit);

        return {
            data,
            pagination: {
                total,
                page: pageNumber,
                limit: pageLimit,
                totalPages,
                pages: totalPages
            }
        } as PaginatedResponse<any>;
    }
}

class ListByIdDirecionamentoService {
    async execute(id: string) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            select: direcionamentoListSelect
        });

        if (!direcionamento) {
            throw new Error("Direcionamento nao encontrado.");
        }

        return mapDirecionamentoParaListagem(direcionamento);
    }
}

class UpdateDirecionamentoService {
    async execute(id: string, { direcionamentos }: IUpdateDirecionamentoRequest) {
        if (!direcionamentos?.length) {
            throw new Error("Informe o direcionamento para atualização.");
        }

        const payload = direcionamentos[0];
        if (!payload?.items?.length) {
            throw new Error("Informe ao menos um item na remessa.");
        }

        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            include: {
                items: true
            }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento nao encontrado.");
        }

        if (direcionamento.status !== "separado") {
            throw new Error("A remessa so pode ser editada enquanto estiver com status 'separado'.");
        }

        const faccao = await prismaClient.faccao.findUnique({
            where: { id: payload.faccaoId },
            select: { id: true, status: true }
        });

        if (!faccao) {
            throw new Error("Faccao nao encontrada.");
        }

        if (faccao.status !== "ativo") {
            throw new Error("Nao e possivel atualizar a remessa para uma faccao inativa.");
        }

        const quantidadeAntiga = new Map<string, number>();
        for (const item of direcionamento.items) {
            const atual = quantidadeAntiga.get(item.estoqueCorteId) ?? 0;
            quantidadeAntiga.set(item.estoqueCorteId, atual + item.quantidade);
        }

        const quantidadeNova = new Map<string, number>();
        for (const item of payload.items) {
            if (item.quantidade <= 0) {
                throw new Error("Quantidade de direcionamento deve ser maior que 0.");
            }

            const atual = quantidadeNova.get(item.estoqueCorteId) ?? 0;
            quantidadeNova.set(item.estoqueCorteId, atual + item.quantidade);
        }

        const todosEstoqueIds = [...new Set([...quantidadeAntiga.keys(), ...quantidadeNova.keys()])];
        const estoques = await prismaClient.estoqueCorte.findMany({
            where: { id: { in: todosEstoqueIds } },
            include: {
                lote: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            }
        });

        if (estoques.length !== todosEstoqueIds.length) {
            throw new Error("Um ou mais itens de estoque de corte nao foram encontrados.");
        }

        const estoquePorId = new Map(estoques.map((estoque) => [estoque.id, estoque]));
        const diferencas = new Map<string, number>();

        for (const estoqueId of todosEstoqueIds) {
            const anterior = quantidadeAntiga.get(estoqueId) ?? 0;
            const novo = quantidadeNova.get(estoqueId) ?? 0;
            const diferenca = novo - anterior;
            diferencas.set(estoqueId, diferenca);

            const estoque = estoquePorId.get(estoqueId);
            if (!estoque) {
                throw new Error("Item de estoque de corte nao encontrado.");
            }

            if (estoque.lote.status !== "cortado") {
                throw new Error(`Nao e permitido atualizar remessa com itens de lote ainda nao cortado. Lote ${estoque.lote.id} com status '${estoque.lote.status}'.`);
            }

            if (diferenca > 0) {
                if (diferenca > estoque.quantidadeDisponivel) {
                    throw new Error(`Estoque insuficiente para o item ${estoqueId}. Disponivel: ${estoque.quantidadeDisponivel}.`);
                }
            }
        }

        const direcionamentoAtualizado = await prismaClient.$transaction(async (tx) => {
            for (const [estoqueCorteId, diferenca] of diferencas.entries()) {
                if (diferenca === 0) {
                    continue;
                }

                if (diferenca > 0) {
                    await tx.estoqueCorte.update({
                        where: { id: estoqueCorteId },
                        data: {
                            quantidadeDisponivel: {
                                decrement: diferenca
                            }
                        }
                    });
                } else {
                    await tx.estoqueCorte.update({
                        where: { id: estoqueCorteId },
                        data: {
                            quantidadeDisponivel: {
                                increment: Math.abs(diferenca)
                            }
                        }
                    });
                }
            }

            const quantidadeTotal = payload.items.reduce((sum, item) => sum + item.quantidade, 0);

            return tx.direcionamento.update({
                where: { id },
                data: {
                    faccaoId: payload.faccaoId,
                    tipoServico: payload.tipoServico,
                    quantidade: quantidadeTotal,
                    items: {
                        deleteMany: {},
                        create: payload.items.map((item) => ({
                            estoqueCorteId: item.estoqueCorteId,
                            quantidade: item.quantidade
                        }))
                    }
                },
                include: direcionamentoInclude
            });
        }, {
            maxWait: 10000,
            timeout: 30000
        });

        return direcionamentoAtualizado;
    }
}

class UpdateDirecionamentoStatusService {
    async execute(id: string, { status }: IUpdateDirecionamentoStatusRequest) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            include: {
                faccao: {
                    select: {
                        prazoMedioDias: true
                    }
                },
                items: {
                    include: {
                        estoqueCorte: {
                            include: {
                                lote: {
                                    select: {
                                        id: true,
                                        status: true,
                                        responsavelId: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento nao encontrado.");
        }

        if (direcionamento.status === "entregue") {
            throw new Error("Nao e possivel alterar status de uma remessa ja entregue.");
        }

        const statusValidos: Record<string, string[]> = {
            separado: ["em_producao"],
            em_producao: ["entregue"],
            entregue: []
        };

        if (!statusValidos[direcionamento.status]?.includes(status)) {
            throw new Error(`Nao e permitido mudar status de '${direcionamento.status}' para '${status}'.`);
        }

        const direcionamentoAtualizado = await prismaClient.$transaction(async (tx) => {
            const dataUpdate: { status: string; dataSaida?: Date; dataPrevisaoRetorno?: Date } = { status };

            if (status === "em_producao") {
                const dataSaida = new Date();
                const prazoMedioDias = direcionamento.faccao.prazoMedioDias ?? 0;
                const dataPrevisaoRetorno = new Date(dataSaida);
                dataPrevisaoRetorno.setDate(dataPrevisaoRetorno.getDate() + prazoMedioDias);

                dataUpdate.dataSaida = dataSaida;
                dataUpdate.dataPrevisaoRetorno = dataPrevisaoRetorno;

                const lotesPlanejados = [...new Set(
                    direcionamento.items
                        .filter((item) => item.estoqueCorte.lote.status === "planejado")
                        .map((item) => item.estoqueCorte.lote.id)
                )];

                for (const loteId of lotesPlanejados) {
                    await tx.loteProducao.update({
                        where: { id: loteId },
                        data: { status: "em_producao" }
                    });
                }
            }

            if (status === "entregue") {
                const conferenciaExistente = await tx.conferencia.findFirst({
                    where: { direcionamentoId: id }
                });

                if (!conferenciaExistente) {
                    const responsavelIds = [...new Set(
                        direcionamento.items
                            .map((item) => item.estoqueCorte.lote.responsavelId)
                            .filter(Boolean)
                    )];

                    const responsavelId = responsavelIds[0];
                    if (!responsavelId) {
                        throw new Error("Nao foi possivel identificar um responsavel para criar a conferencia.");
                    }

                    await tx.conferencia.create({
                        data: {
                            direcionamentoId: id,
                            responsavelId,
                            dataConferencia: new Date(),
                            status: "recebido",
                            liberadoPagamento: false
                        }
                    });
                }
            }

            return tx.direcionamento.update({
                where: { id },
                data: dataUpdate,
                include: direcionamentoInclude
            });
        }, {
            maxWait: 10000,
            timeout: 30000
        });

        return direcionamentoAtualizado;
    }
}

class UpdateDirecionamentoSkuPriceService {
    async execute(id: string, { produtoSKU }: IUpdateDirecionamentoSkuPriceRequest) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        estoqueCorte: {
                            include: {
                                produto: {
                                    select: {
                                        sku: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento nao encontrado.");
        }

        if (direcionamento.status !== "em_producao") {
            throw new Error("O preco por SKU so pode ser atualizado quando a remessa estiver em 'em_producao'.");
        }

        const skusDuplicados = produtoSKU
            .map((item) => item.sku)
            .filter((sku, index, array) => array.indexOf(sku) !== index);

        if (skusDuplicados.length > 0) {
            throw new Error(`SKU duplicado no payload: ${skusDuplicados[0]}.`);
        }

        const skusDirecionamento = new Set(direcionamento.items.map((item) => item.estoqueCorte.produto.sku));

        for (const itemSku of produtoSKU) {
            if (!skusDirecionamento.has(itemSku.sku)) {
                throw new Error(`O SKU ${itemSku.sku} nao pertence a este direcionamento.`);
            }
        }

        const direcionamentoAtualizado = await prismaClient.$transaction(async (tx) => {
            for (const itemSku of produtoSKU) {
                const idsItensSku = direcionamento.items
                    .filter((item) => item.estoqueCorte.produto.sku === itemSku.sku)
                    .map((item) => item.id);

                await tx.direcionamentoItem.updateMany({
                    where: {
                        id: {
                            in: idsItensSku
                        }
                    },
                    data: {
                        valorFaccaoPorPeca: itemSku.valorFaccaoPorPeca
                    }
                });
            }

            return tx.direcionamento.update({
                where: { id },
                data: {
                    updatedAt: new Date()
                },
                include: direcionamentoInclude
            });
        }, {
            maxWait: 10000,
            timeout: 30000
        });

        return direcionamentoAtualizado;
    }
}

class DeleteDirecionamentoService {
    async execute(id: string) {
        const direcionamento = await prismaClient.direcionamento.findUnique({
            where: { id },
            include: {
                conferencias: true,
                items: true
            }
        });

        if (!direcionamento) {
            throw new Error("Direcionamento nao encontrado.");
        }

        if (direcionamento.conferencias.length > 0) {
            throw new Error("Nao e possivel deletar um direcionamento que possui conferencias associadas.");
        }

        await prismaClient.$transaction(async (tx) => {
            if (direcionamento.status !== "entregue") {
                for (const item of direcionamento.items) {
                    await tx.estoqueCorte.update({
                        where: { id: item.estoqueCorteId },
                        data: {
                            quantidadeDisponivel: {
                                increment: item.quantidade
                            }
                        }
                    });
                }
            }

            await tx.direcionamento.delete({
                where: { id }
            });
        }, {
            maxWait: 10000,
            timeout: 30000
        });

        return { message: "Direcionamento deletado com sucesso." };
    }
}

export {
    CreateDirecionamentoService,
    ListAllDirecionamentoService,
    ListByIdDirecionamentoService,
    UpdateDirecionamentoService,
    UpdateDirecionamentoStatusService,
    UpdateDirecionamentoSkuPriceService,
    DeleteDirecionamentoService
};
