import { IAddLoteItemsRequest, ICreateLoteProducaoRequest, IEnfestoComItensInput, IEnfestoComItensProducaoInput, ILoteItemComEnfestosInput, ILoteItemInput, IUpdateLoteProducaoRequest } from "../../interfaces/IProducao";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

const loteInclude = {
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
            tamanho: true,
            enfestos: {
                include: {
                    rolos: {
                        include: {
                            rolo: true
                        }
                    }
                }
            }
        }
    },
    rolos: {
        include: {
            rolo: {
                include: {
                    tecido: {
                        include: {
                            cor: true
                        }
                    }
                }
            }
        }
    },
    direcionamentos: true
} as const;

type RoloReservado = {
    estoqueRoloId: string;
    corId: string;
};

type RoloInicial = {
    estoqueRoloId: string;
    pesoReservado: number;
};

function extrairRolosReservados(items: ILoteItemComEnfestosInput[]) {
    const itensSemEnfesto = items.filter(item => !item.enfestos || item.enfestos.length === 0);
    if (itensSemEnfesto.length > 0) {
        throw new Error("Todos os itens devem informar ao menos um enfesto.");
    }

    const enfestosSemRolo = items.flatMap(item => item.enfestos.filter(enfesto => !enfesto.rolos || enfesto.rolos.length === 0));
    if (enfestosSemRolo.length > 0) {
        throw new Error("Todos os enfestos devem informar ao menos um rolo.");
    }

    const rolosReservados = items.flatMap(item =>
        item.enfestos.flatMap(enfesto =>
            enfesto.rolos.map(rolo => ({
                estoqueRoloId: rolo.estoqueRoloId,
                corId: enfesto.corId
            }))
        )
    );

    if (rolosReservados.length === 0) {
        throw new Error("É necessário informar ao menos um rolo para identificar o tecido.");
    }

    return rolosReservados;
}

function normalizarItemsEntrada(enfestos?: IEnfestoComItensProducaoInput[]): ILoteItemComEnfestosInput[] {
    if (!enfestos?.length) {
        return [];
    }

    return enfestos.flatMap(enfesto =>
        enfesto.itens.map((item: ILoteItemInput) => ({
            produtoId: item.produtoId,
            tamanhoId: item.tamanhoId,
            quantidadePlanejada: item.quantidadePlanejada,
            enfestos: [
                {
                    corId: enfesto.corId,
                    qtdFolhas: enfesto.qtdFolhas,
                    rolos: enfesto.rolosProducao.map(rolo => ({
                        estoqueRoloId: rolo.estoqueRoloId
                    }))
                }
            ]
        }))
    );
}

function normalizarItemsEntradaAdd(enfestos?: IEnfestoComItensInput[]): ILoteItemComEnfestosInput[] {
    if (!enfestos?.length) {
        return [];
    }

    return enfestos.flatMap(enfesto =>
        enfesto.itens.map((item: ILoteItemInput) => ({
            produtoId: item.produtoId,
            tamanhoId: item.tamanhoId,
            quantidadePlanejada: item.quantidadePlanejada,
            enfestos: [
                {
                    corId: enfesto.corId,
                    qtdFolhas: enfesto.qtdFolhas,
                    rolos: enfesto.rolosProducao.map(rolo => ({
                        estoqueRoloId: rolo.estoqueRoloId
                    }))
                }
            ]
        }))
    );
}

function extrairRolosProducaoDosEnfestos(enfestos?: IEnfestoComItensProducaoInput[]) {
    if (!enfestos?.length) {
        return [] as Array<{ estoqueRoloId: string; pesoReservado: number }>;
    }

    const rolosMap = new Map<string, number>();
    for (const enfesto of enfestos) {
        for (const rolo of enfesto.rolosProducao) {
            const pesoAtual = rolosMap.get(rolo.estoqueRoloId) ?? 0;
            rolosMap.set(rolo.estoqueRoloId, pesoAtual + rolo.pesoReservado);
        }
    }

    return Array.from(rolosMap.entries()).map(([estoqueRoloId, pesoReservado]) => ({
        estoqueRoloId,
        pesoReservado
    }));
}

function calcularQuantidadePlanejadaComFolhas(item: ILoteItemComEnfestosInput) {
    const totalFolhas = item.enfestos.reduce((acumulador, enfesto) => acumulador + enfesto.qtdFolhas, 0);
    return item.quantidadePlanejada * totalFolhas;
}

function agruparRolosPorId(rolosReservados: RoloReservado[]) {
    const rolosAgrupadosSet = new Set<string>();
    for (const rolo of rolosReservados) {
        rolosAgrupadosSet.add(rolo.estoqueRoloId);
    }

    return Array.from(rolosAgrupadosSet.values()).map(estoqueRoloId => ({ estoqueRoloId }));
}

function agruparRolosIniciais(rolos: RoloInicial[]) {
    const rolosAgrupadosMap = new Map<string, number>();
    for (const rolo of rolos) {
        const pesoAtual = rolosAgrupadosMap.get(rolo.estoqueRoloId) ?? 0;
        rolosAgrupadosMap.set(rolo.estoqueRoloId, pesoAtual + rolo.pesoReservado);
    }

    return Array.from(rolosAgrupadosMap.entries()).map(([estoqueRoloId, pesoReservado]) => ({
        estoqueRoloId,
        pesoReservado
    }));
}

async function validarProdutosETamanhos(tx: any, items: ILoteItemComEnfestosInput[]) {
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
}

async function validarRolos(tx: any, rolosReservadosPorEnfesto: RoloReservado[]): Promise<{
    rolosAgrupados: Array<{ estoqueRoloId: string }>;
    rolosPorId: Map<string, any>;
    rolosExistentes: any[];
}> {
    const rolosAgrupados = agruparRolosPorId(rolosReservadosPorEnfesto);
    const roloIds = rolosAgrupados.map(rolo => rolo.estoqueRoloId);

    const rolosExistentes = await tx.estoqueRolo.findMany({
        where: { id: { in: roloIds } },
        include: {
            tecido: {
                include: {
                    cor: true
                }
            }
        }
    });

    if (rolosExistentes.length !== roloIds.length) {
        throw new Error("Um ou mais rolos não encontrados.");
    }

    const rolosPorId = new Map<string, any>(rolosExistentes.map((rolo: any) => [rolo.id, rolo]));

    for (const roloReservado of rolosReservadosPorEnfesto) {
        const rolo = rolosPorId.get(roloReservado.estoqueRoloId) as any;
        if (!rolo) {
            throw new Error(`Rolo ${roloReservado.estoqueRoloId} não encontrado.`);
        }

        const corDoRolo = rolo.tecido.corId;
        const corInformada = roloReservado.corId;

        if (corDoRolo !== corInformada) {
            throw new Error(`Rolo ${rolo.id} não pertence à cor informada no enfesto.`);
        }
    }

    return {
        rolosAgrupados,
        rolosPorId,
        rolosExistentes
    };
}

async function obterPesosReservadosPorRoloNoLote(tx: any, loteId: string, rolosIds: string[]) {
    const loteRolos = await tx.loteRolo.findMany({
        where: {
            loteProducaoId: loteId,
            estoqueRoloId: { in: rolosIds }
        }
    });

    if (loteRolos.length !== rolosIds.length) {
        throw new Error("Todos os rolos dos enfestos devem estar vinculados ao lote na inicialização.");
    }

    return new Map<string, number>(
        loteRolos.map((loteRolo: any) => [loteRolo.estoqueRoloId, Number(loteRolo.pesoReservado)])
    );
}

function formatarLoteResponse(lote: any) {
    const rolosList = lote.rolos.map((lr: any) => ({
        ...lr.rolo,
        pesoReservado: Number(lr.pesoReservado)
    }));

    const pesoTotal = rolosList.reduce((acumulador: number, rolo: any) => acumulador + Number(rolo.pesoReservado), 0);

    const qtdFolhasPorCor = new Map<string, number>();
    for (const item of lote.items) {
        for (const enfesto of item.enfestos ?? []) {
            const corKey = enfesto.corId;
            const qtdAtual = qtdFolhasPorCor.get(corKey) ?? 0;
            qtdFolhasPorCor.set(corKey, qtdAtual + enfesto.qtdFolhas);
        }
    }

    const coresMap = new Map<string, { cor: any; rolos: any[] }>();
    for (const rolo of rolosList) {
        const corDoRolo = rolo?.tecido?.cor;
        const corKey = corDoRolo?.id ?? `sem-cor-${rolo.id}`;

        if (!coresMap.has(corKey)) {
            coresMap.set(corKey, {
                cor: corDoRolo ?? null,
                rolos: []
            });
        }

        const grupoCor = coresMap.get(corKey)!;
        grupoCor.rolos.push(rolo);
    }

    const cores = Array.from(coresMap.values()).map(grupoCor => ({
        corId: grupoCor.cor?.id,
        nome: grupoCor.cor?.nome,
        qtdFolhas: qtdFolhasPorCor.get(grupoCor.cor?.id ?? "") ?? 0,
        codigoHex: grupoCor.cor?.codigoHex,
        rolos: grupoCor.rolos.map((rolo: any) => ({
            id: rolo.id,
            codigoBarraRolo: rolo.codigoBarraRolo,
            pesoAtualKg: Number(rolo.pesoAtualKg),
            pesoReservado: Number(rolo.pesoReservado),
            situacao: rolo.situacao
        }))
    }));

    const gradeLote = lote.items.map((item: any) => ({
        id: item.id,
        produtoId: item.produtoId,
        tamanhoId: item.tamanhoId,
        quantidadePlanejada: Number(item.quantidadePlanejada),
        produtoNome: item.produto?.nome,
        sku: item.produto?.sku,
        tamanhoNome: item.tamanho?.nome
    }));

    const materiais = [
        {
            tecidoId: lote.tecidoId,
            nome: lote.tecido?.nome,
            codigoReferencia: lote.tecido?.codigoReferencia,
            rendimentoMetroKg: Number(lote.tecido?.rendimentoMetroKg),
            larguraMetros: Number(lote.tecido?.larguraMetros),
            gramatura: Number(lote.tecido?.gramatura),
            valorPorKg: Number(lote.tecido?.valorPorKg),
            pesoTotal,
            cores
        }
    ];

    const direcionamentos = lote.direcionamentos.map((direcionamento: any) => ({
        id: direcionamento.id,
        faccaoId: direcionamento.faccaoId,
        tipoServico: direcionamento.tipoServico,
        status: direcionamento.status,
        dataPrevisaoRetorno: direcionamento.dataPrevisaoRetorno
    }));

    return {
        id: lote.id,
        codigoLote: lote.codigoLote,
        tecidoId: lote.tecidoId,
        responsavelId: lote.responsavelId,
        status: lote.status,
        observacao: lote.observacao,
        createdAt: lote.createdAt,
        updatedAt: lote.updatedAt,
        responsavel: {
            id: lote.responsavel?.id,
            nome: lote.responsavel?.nome,
            funcaoSetor: lote.responsavel?.funcaoSetor
        },
        materiais,
        gradeLote,
        direcionamentos
    };
}

class CreateLoteProducaoService {
    async execute({ codigoLote, responsavelId, status, observacao, rolos }: ICreateLoteProducaoRequest) {
        const loteAlreadyExists = await prismaClient.loteProducao.findUnique({
            where: { codigoLote }
        });

        if (loteAlreadyExists) {
            throw new Error("Lote com este código já existe.");
        }

        if (!rolos || rolos.length === 0) {
            throw new Error("É necessário informar ao menos um rolo.");
        }

        const rolosAgrupados = agruparRolosIniciais(rolos);
        const roloIds = rolosAgrupados.map(rolo => rolo.estoqueRoloId);
        const rolosExistentes = await prismaClient.estoqueRolo.findMany({
            where: { id: { in: roloIds } }
        });

        if (rolosExistentes.length !== roloIds.length) {
            throw new Error("Um ou mais rolos não encontrados.");
        }

        const rolosPorId = new Map<string, any>(rolosExistentes.map((rolo: any) => [rolo.id, rolo]));

        const primeiroRolo = rolosExistentes[0];
        if (!primeiroRolo) {
            throw new Error("Erro ao processar rolos.");
        }

        const tecidoIdFinal = primeiroRolo.tecidoId;

        for (const roloReservado of rolosAgrupados) {
            const rolo = rolosPorId.get(roloReservado.estoqueRoloId) as any;
            if (!rolo) {
                throw new Error(`Rolo ${roloReservado.estoqueRoloId} não encontrado.`);
            }

            if (Number(rolo.pesoAtualKg) < roloReservado.pesoReservado) {
                throw new Error(`Rolo ${rolo.id} não tem peso suficiente. Disponível: ${rolo.pesoAtualKg}kg, Solicitado: ${roloReservado.pesoReservado}kg`);
            }
        }

        const tecido = await prismaClient.tecido.findUnique({
            where: { id: tecidoIdFinal }
        });

        if (!tecido) {
            throw new Error("Tecido não encontrado.");
        }

        const responsavel = await prismaClient.usuario.findUnique({
            where: { id: responsavelId }
        });

        if (!responsavel) {
            throw new Error("Responsável não encontrado.");
        }

        const lote = await prismaClient.$transaction(async (tx) => {
            const novoLote = await tx.loteProducao.create({
                data: {
                    codigoLote,
                    tecidoId: tecidoIdFinal,
                    responsavelId,
                    status: status || "planejado",
                    observacao,
                    rolos: {
                        create: rolosAgrupados.map(rolo => ({
                            estoqueRoloId: rolo.estoqueRoloId,
                            pesoReservado: rolo.pesoReservado
                        }))
                    }
                },
                include: loteInclude
            });

            for (const roloInfo of rolosAgrupados) {
                const roloExistente = rolosPorId.get(roloInfo.estoqueRoloId) as any;
                if (!roloExistente) {
                    continue;
                }

                const novoPeso = Number(roloExistente.pesoAtualKg) - roloInfo.pesoReservado;

                await tx.movimentacaoEstoque.create({
                    data: {
                        estoqueRoloId: roloInfo.estoqueRoloId,
                        usuarioId: responsavelId,
                        tipoMovimentacao: "saida",
                        pesoMovimentado: roloInfo.pesoReservado
                    }
                });

                await tx.estoqueRolo.update({
                    where: { id: roloInfo.estoqueRoloId },
                    data: {
                        pesoAtualKg: novoPeso <= 0 ? 0 : novoPeso,
                        situacao: novoPeso <= 0 ? "esgotado" : "disponivel"
                    }
                });
            }

            return novoLote;
        });

        return formatarLoteResponse(lote);
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
                include: loteInclude,
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

        const lotesFormatados = lotes.map(formatarLoteResponse);
        return createPaginatedResponse(lotesFormatados, total, pageNumber, pageLimit);
    }
}

class ListByIdLoteProducaoService {
    async execute(id: string) {
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id },
            include: {
                ...loteInclude,
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

        return formatarLoteResponse(lote);
    }
}

class UpdateLoteProducaoService {
    async execute(id: string, { loteId, codigoLote, responsavelId, status, observacao, enfestos, usuarioId }: IUpdateLoteProducaoRequest) {
        return prismaClient.$transaction(async (tx) => {
            const lote = await tx.loteProducao.findUnique({
                where: { id }
            });

            if (!lote) {
                throw new Error("Lote não encontrado.");
            }

            if (loteId && loteId !== id) {
                throw new Error("loteId do body deve ser igual ao id da rota.");
            }

            const rolosProducaoEntrada = extrairRolosProducaoDosEnfestos(enfestos);

            if (status === "em_producao" && lote.status === "planejado" && rolosProducaoEntrada.length > 0) {
                if (!usuarioId) {
                    throw new Error("usuárioId é obrigatório para registrar movimentações automáticas.");
                }

                for (const roloInfo of rolosProducaoEntrada) {
                    const rolo = await tx.estoqueRolo.findUnique({
                        where: { id: roloInfo.estoqueRoloId }
                    });

                    if (!rolo) {
                        throw new Error(`Rolo ${roloInfo.estoqueRoloId} não encontrado.`);
                    }

                    if (rolo.tecidoId !== lote.tecidoId) {
                        throw new Error(`Rolo ${roloInfo.estoqueRoloId} não é do tecido especificado no lote.`);
                    }

                    if (Number(rolo.pesoAtualKg) < roloInfo.pesoReservado) {
                        throw new Error(`Rolo ${roloInfo.estoqueRoloId} não tem peso suficiente. Disponível: ${rolo.pesoAtualKg}kg, Solicitado: ${roloInfo.pesoReservado}kg`);
                    }

                    const novoPeso = Number(rolo.pesoAtualKg) - roloInfo.pesoReservado;

                    await tx.movimentacaoEstoque.create({
                        data: {
                            estoqueRoloId: roloInfo.estoqueRoloId,
                            usuarioId,
                            tipoMovimentacao: "saida",
                            pesoMovimentado: roloInfo.pesoReservado
                        }
                    });

                    await tx.estoqueRolo.update({
                        where: { id: roloInfo.estoqueRoloId },
                        data: {
                            pesoAtualKg: novoPeso <= 0 ? 0 : novoPeso,
                            situacao: novoPeso <= 0 ? "esgotado" : "em_uso"
                        }
                    });
                }
            }

            if (codigoLote && codigoLote !== lote.codigoLote) {
                const loteComMesmoCodigo = await tx.loteProducao.findUnique({
                    where: { codigoLote }
                });
                if (loteComMesmoCodigo) {
                    throw new Error("Já existe outro lote com este código.");
                }
            }

            if (responsavelId) {
                const responsavel = await tx.usuario.findUnique({
                    where: { id: responsavelId }
                });
                if (!responsavel) {
                    throw new Error("Responsável não encontrado.");
                }
            }

            const itemsNormalizados = normalizarItemsEntrada(enfestos);

            if (itemsNormalizados.length > 0) {
                if (["concluido", "cancelado"].includes(lote.status)) {
                    throw new Error("Não é possível adicionar items a um lote concluído ou cancelado.");
                }

                await validarProdutosETamanhos(tx, itemsNormalizados);

                const rolosReservadosPorEnfesto = extrairRolosReservados(itemsNormalizados);
                const { rolosAgrupados, rolosPorId } = await validarRolos(tx, rolosReservadosPorEnfesto);
                const rolosIds = rolosAgrupados.map(rolo => rolo.estoqueRoloId);
                const pesosReservadosPorRolo = await obterPesosReservadosPorRoloNoLote(tx, id, rolosIds);

                for (const roloInfo of rolosAgrupados) {
                    const rolo = rolosPorId.get(roloInfo.estoqueRoloId) as any;
                    if (!rolo) {
                        continue;
                    }

                    if (rolo.tecidoId !== lote.tecidoId) {
                        throw new Error(`Rolo ${roloInfo.estoqueRoloId} não pertence ao tecido do lote.`);
                    }
                }

                for (const item of itemsNormalizados) {
                    await tx.loteItem.create({
                        data: {
                            loteProducaoId: id,
                            produtoId: item.produtoId,
                            tamanhoId: item.tamanhoId,
                            quantidadePlanejada: calcularQuantidadePlanejadaComFolhas(item),
                            enfestos: {
                                create: item.enfestos.map(enfesto => ({
                                    cor: enfesto.corId,
                                    qtdFolhas: enfesto.qtdFolhas,
                                    rolos: {
                                        create: enfesto.rolos.map(rolo => ({
                                            estoqueRoloId: rolo.estoqueRoloId,
                                            pesoReservado: pesosReservadosPorRolo.get(rolo.estoqueRoloId) ?? 0
                                        }))
                                    }
                                }))
                            }
                        }
                    });
                }
            }

            const loteAtualizado = await tx.loteProducao.update({
                where: { id },
                data: {
                    ...(codigoLote && { codigoLote }),
                    ...(responsavelId && { responsavelId }),
                    status,
                    observacao
                },
                include: loteInclude
            });

            return formatarLoteResponse(loteAtualizado);
        });
    }
}

class AddLoteItemsService {
    async execute(id: string, { enfestos }: IAddLoteItemsRequest) {
        const itemsNormalizados = normalizarItemsEntradaAdd(enfestos);

        if (!itemsNormalizados || itemsNormalizados.length === 0) {
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

            await validarProdutosETamanhos(tx, itemsNormalizados);

            const rolosReservadosPorEnfesto = extrairRolosReservados(itemsNormalizados);
            const { rolosAgrupados, rolosPorId } = await validarRolos(tx, rolosReservadosPorEnfesto);
            const rolosIds = rolosAgrupados.map(rolo => rolo.estoqueRoloId);
            const pesosReservadosPorRolo = await obterPesosReservadosPorRoloNoLote(tx, id, rolosIds);

            for (const roloInfo of rolosAgrupados) {
                const rolo = rolosPorId.get(roloInfo.estoqueRoloId) as any;
                if (!rolo) {
                    continue;
                }

                if (rolo.tecidoId !== lote.tecidoId) {
                    throw new Error(`Rolo ${roloInfo.estoqueRoloId} não pertence ao tecido do lote.`);
                }
            }

            for (const item of itemsNormalizados) {
                await tx.loteItem.create({
                    data: {
                        loteProducaoId: id,
                        produtoId: item.produtoId,
                        tamanhoId: item.tamanhoId,
                        quantidadePlanejada: calcularQuantidadePlanejadaComFolhas(item),
                        enfestos: {
                            create: item.enfestos.map(enfesto => ({
                                cor: enfesto.corId,
                                qtdFolhas: enfesto.qtdFolhas,
                                rolos: {
                                    create: enfesto.rolos.map(rolo => ({
                                        estoqueRoloId: rolo.estoqueRoloId,
                                        pesoReservado: pesosReservadosPorRolo.get(rolo.estoqueRoloId) ?? 0
                                    }))
                                }
                            }))
                        }
                    }
                });
            }

            return tx.loteProducao.findUnique({
                where: { id },
                include: loteInclude
            });
        });

        if (!loteAtualizado) {
            throw new Error("Erro ao atualizar lote.");
        }

        return formatarLoteResponse(loteAtualizado);
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

        await prismaClient.loteRolo.deleteMany({
            where: { loteProducaoId: id }
        });

        await prismaClient.loteItem.deleteMany({
            where: { loteProducaoId: id }
        });

        await prismaClient.loteProducao.delete({
            where: { id }
        });

        return { message: "Lote deletado com sucesso." };
    }
}

export { CreateLoteProducaoService, ListAllLoteProducaoService, ListByIdLoteProducaoService, UpdateLoteProducaoService, AddLoteItemsService, DeleteLoteProducaoService };