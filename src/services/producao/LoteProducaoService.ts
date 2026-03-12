import { IAddLoteItemsRequest, ICreateLoteProducaoRequest, IEnfestoComItensInput, IEnfestoComItensProducaoInput, ILoteItemComEnfestosInput, ILoteItemInput, IUpdateLoteProducaoRequest } from "../../interfaces/IProducao";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

const INTERACTIVE_TRANSACTION_OPTIONS = {
    maxWait: 10000,
    timeout: 120000
};

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

function calcularQuantidadePlanejadaItem(item: ILoteItemInput, qtdFolhas: number) {
    if (item.qtdMultiplicadorGrade === undefined || item.qtdMultiplicadorGrade === null) {
        throw new Error("qtdMultiplicadorGrade é obrigatório para cada item.");
    }

    return qtdFolhas * item.qtdMultiplicadorGrade;
}

function normalizarItemsEntrada(enfestos?: IEnfestoComItensProducaoInput[]): ILoteItemComEnfestosInput[] {
    if (!enfestos?.length) {
        return [];
    }

    return enfestos.flatMap(enfesto =>
        enfesto.itens.map((item: ILoteItemInput) => ({
            produtoId: item.produtoId,
            tamanhoId: item.tamanhoId,
            qtdMultiplicadorGrade: item.qtdMultiplicadorGrade,
            quantidadePlanejada: calcularQuantidadePlanejadaItem(item, enfesto.qtdFolhas),
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
            qtdMultiplicadorGrade: item.qtdMultiplicadorGrade,
            quantidadePlanejada: calcularQuantidadePlanejadaItem(item, enfesto.qtdFolhas),
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

function criarChaveConsolidacaoItem(item: ILoteItemComEnfestosInput) {
    const enfestosOrdenados = [...item.enfestos].sort((a, b) => {
        const rolosA = [...a.rolos].map(rolo => rolo.estoqueRoloId).sort().join(",");
        const rolosB = [...b.rolos].map(rolo => rolo.estoqueRoloId).sort().join(",");
        const chaveA = `${a.corId}|${a.qtdFolhas}|${rolosA}`;
        const chaveB = `${b.corId}|${b.qtdFolhas}|${rolosB}`;
        return chaveA.localeCompare(chaveB);
    });

    const enfestosKey = enfestosOrdenados
        .map(enfesto => {
            const rolosKey = [...enfesto.rolos].map(rolo => rolo.estoqueRoloId).sort().join(",");
            return `${enfesto.corId}|${enfesto.qtdFolhas}|${rolosKey}`;
        })
        .join("||");

    return `${item.produtoId}|${item.tamanhoId}|${enfestosKey}`;
}

function consolidarItemsNormalizados(items: ILoteItemComEnfestosInput[]) {
    const itensConsolidados = new Map<string, ILoteItemComEnfestosInput>();

    for (const item of items) {
        const chave = criarChaveConsolidacaoItem(item);
        const existente = itensConsolidados.get(chave);

        if (!existente) {
            itensConsolidados.set(chave, {
                ...item,
                enfestos: item.enfestos.map(enfesto => ({
                    ...enfesto,
                    rolos: enfesto.rolos.map(rolo => ({ ...rolo }))
                }))
            });
            continue;
        }

        existente.quantidadePlanejada = item.quantidadePlanejada;
        existente.qtdMultiplicadorGrade = item.qtdMultiplicadorGrade;
    }

    return Array.from(itensConsolidados.values());
}

function filtrarItensComQuantidadePositiva(items: ILoteItemComEnfestosInput[]) {
    return items.filter(item => item.quantidadePlanejada > 0);
}

function ordenarRolosIds(rolos: Array<{ estoqueRoloId: string }>) {
    return [...rolos].map(rolo => rolo.estoqueRoloId).sort();
}

function criarChaveItemPorCorERolos(produtoId: string, tamanhoId: string, cor: string, qtdFolhas: number, rolosIds: string[]) {
    return `${produtoId}|${tamanhoId}|${String(cor).trim().toLowerCase()}|${qtdFolhas}|${rolosIds.join(",")}`;
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

async function obterNomesCorPorId(tx: any, items: ILoteItemComEnfestosInput[]) {
    const corIds = [...new Set(items.flatMap(item => item.enfestos.map(enfesto => enfesto.corId)))];

    const cores = await tx.cor.findMany({
        where: { id: { in: corIds } },
        select: {
            id: true,
            nome: true
        }
    });

    if (cores.length !== corIds.length) {
        throw new Error("Uma ou mais cores não foram encontradas.");
    }

    for (const cor of cores) {
        if (!cor.nome || String(cor.nome).trim().length === 0) {
            throw new Error(`Cor ${cor.id} está sem nome cadastrado.`);
        }

        if (String(cor.nome).length > 25) {
            throw new Error(`Nome da cor ${cor.id} excede 25 caracteres e não pode ser salvo em enfesto.`);
        }
    }

    return new Map<string, string>(
        cores.map((cor: any) => [cor.id, String(cor.nome)])
    );
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

async function validarRolosPertencemAoLote(tx: any, loteId: string, rolosIds: string[]) {
    const loteRolos = await tx.loteRolo.findMany({
        where: {
            loteProducaoId: loteId,
            estoqueRoloId: { in: rolosIds }
        },
        select: {
            estoqueRoloId: true
        }
    });

    if (loteRolos.length !== rolosIds.length) {
        throw new Error("Todos os rolos informados devem estar vinculados ao lote na inicialização.");
    }
}

function formatarLoteResponse(lote: any) {
    const rolosList = lote.rolos.map((lr: any) => ({
        ...lr.rolo,
        pesoReservado: Number(lr.pesoReservado)
    }));

    const pesoTotal = rolosList.reduce((acumulador: number, rolo: any) => acumulador + Number(rolo.pesoReservado), 0);
    const valorPorKgTotal = Array.from(
        new Map<string, number>(
            rolosList
                .filter((rolo: any) => rolo?.tecido?.id)
                .map((rolo: any) => [rolo.tecido.id, Number(rolo.tecido?.valorPorKg ?? 0)])
        ).values()
    ).reduce((acumulador: number, valor: number) => acumulador + valor, 0);

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

    const corNomeParaId = new Map<string, string>();
    for (const [corId, grupoCor] of coresMap.entries()) {
        if (!grupoCor.cor?.nome) {
            continue;
        }
        corNomeParaId.set(String(grupoCor.cor.nome).trim().toLowerCase(), corId);
    }

    const corIdsDisponiveis = Array.from(coresMap.keys()).filter(corId => !corId.startsWith("sem-cor-"));

    const resolverCorKeyEnfesto = (enfesto: any) => {
        const valorOriginal = enfesto?.corId ?? enfesto?.cor;
        if (!valorOriginal) {
            const corIdDoPrimeiroRolo = enfesto?.rolos?.[0]?.rolo?.tecido?.cor?.id;
            if (corIdDoPrimeiroRolo && coresMap.has(corIdDoPrimeiroRolo)) {
                console.warn("[LoteProducao] Fallback de cor aplicado (enfesto sem cor/corId)", {
                    enfestoId: enfesto?.id,
                    corFallbackId: corIdDoPrimeiroRolo
                });
                return corIdDoPrimeiroRolo;
            }

            console.warn("[LoteProducao] Não foi possível resolver cor do enfesto (sem cor/corId e sem rolo)", {
                enfestoId: enfesto?.id
            });
            return undefined;
        }

        if (coresMap.has(valorOriginal)) {
            return valorOriginal;
        }

        const valorNormalizado = String(valorOriginal).trim().toLowerCase();
        const corPorNome = corNomeParaId.get(valorNormalizado);
        if (corPorNome) {
            return corPorNome;
        }

        const corIdDoPrimeiroRolo = enfesto?.rolos?.[0]?.rolo?.tecido?.cor?.id;
        if (corIdDoPrimeiroRolo && coresMap.has(corIdDoPrimeiroRolo)) {
            console.warn("[LoteProducao] Fallback de cor aplicado (nome/id de cor não mapeado)", {
                enfestoId: enfesto?.id,
                valorOriginal,
                corFallbackId: corIdDoPrimeiroRolo
            });
            return corIdDoPrimeiroRolo;
        }

        console.warn("[LoteProducao] Não foi possível resolver cor do enfesto", {
            enfestoId: enfesto?.id,
            valorOriginal
        });

        return undefined;
    };

    const qtdFolhasPorCor = new Map<string, number>();
    const gradeLotePorCor = new Map<string, any[]>();
    const gradeLotePorCorSet = new Set<string>();
    const enfestosComputados = new Set<string>();

    const resolverQtdMultiplicadorGradeItem = (item: any, corKey: string) => {
        const enfestoDaCor = (item.enfestos ?? []).find((enfesto: any) => {
            const corDoEnfesto = resolverCorKeyEnfesto(enfesto);
            return corDoEnfesto === corKey;
        });

        if (!enfestoDaCor || Number(enfestoDaCor.qtdFolhas) <= 0) {
            return null;
        }

        const quantidadePlanejada = Number(item.quantidadePlanejada);
        const qtdFolhas = Number(enfestoDaCor.qtdFolhas);
        const qtdMultiplicadorGrade = quantidadePlanejada / qtdFolhas;

        if (!Number.isFinite(qtdMultiplicadorGrade)) {
            return null;
        }

        return qtdMultiplicadorGrade;
    };

    const montarGradeItem = (corKey: string, item: any) => ({
        id: item.id,
        produtoId: item.produtoId,
        tamanhoId: item.tamanhoId,
        quantidadePlanejada: Number(item.quantidadePlanejada),
        qtdMultiplicadorGrade: resolverQtdMultiplicadorGradeItem(item, corKey),
        produtoNome: item.produto?.nome,
        sku: item.produto?.sku,
        tamanhoNome: item.tamanho?.nome
    });

    const adicionarGradePorCor = (corKey: string, item: any) => {
        const chaveUnica = `${corKey}:${item.id}`;
        if (gradeLotePorCorSet.has(chaveUnica)) {
            return;
        }

        const gradeCorAtual = gradeLotePorCor.get(corKey) ?? [];
        gradeCorAtual.push(montarGradeItem(corKey, item));
        gradeLotePorCor.set(corKey, gradeCorAtual);
        gradeLotePorCorSet.add(chaveUnica);
    };

    for (const item of lote.items) {
        const enfestosItem = item.enfestos ?? [];

        if (enfestosItem.length === 0) {
            for (const corId of corIdsDisponiveis) {
                adicionarGradePorCor(corId, item);
            }
            continue;
        }

        for (const enfesto of item.enfestos ?? []) {
            const corKey = resolverCorKeyEnfesto(enfesto);
            if (!corKey) {
                continue;
            }

            const rolosKey = (enfesto.rolos ?? [])
                .map((enfestoRolo: any) => enfestoRolo.estoqueRoloId)
                .filter(Boolean)
                .sort()
                .join(",");

            const enfestoKey = `${corKey}|${enfesto.qtdFolhas}|${rolosKey}`;
            if (!enfestosComputados.has(enfestoKey)) {
                const qtdAtual = qtdFolhasPorCor.get(corKey) ?? 0;
                qtdFolhasPorCor.set(corKey, qtdAtual + enfesto.qtdFolhas);
                enfestosComputados.add(enfestoKey);
            }

            adicionarGradePorCor(corKey, item);
        }
    }

    const cores = Array.from(coresMap.values()).map(grupoCor => ({
        corId: grupoCor.cor?.id,
        nome: grupoCor.cor?.nome,
        qtdFolhas: qtdFolhasPorCor.get(grupoCor.cor?.id ?? "") ?? 0,
        valorTecido: Array.from(
            new Map<string, number>(
                grupoCor.rolos
                    .filter((rolo: any) => rolo?.tecido?.id)
                    .map((rolo: any) => [rolo.tecido.id, Number(rolo.tecido?.valorPorKg ?? 0)])
            ).values()
        ).reduce((acumulador: number, valor: number) => acumulador + valor, 0),
        codigoHex: grupoCor.cor?.codigoHex,
        rolos: grupoCor.rolos.map((rolo: any) => ({
            id: rolo.id,
            codigoBarraRolo: rolo.codigoBarraRolo,
            pesoAtualKg: Number(rolo.pesoAtualKg),
            pesoReservado: Number(rolo.pesoReservado),
            situacao: rolo.situacao
        })),
        gradeLote: gradeLotePorCor.get(grupoCor.cor?.id ?? "") ?? []
    }));

    const materiais = [
        {
            tecidoId: lote.tecidoId,
            nome: lote.tecido?.nome,
            codigoReferencia: lote.tecido?.codigoReferencia,
            rendimentoMetroKg: Number(lote.tecido?.rendimentoMetroKg),
            larguraMetros: Number(lote.tecido?.larguraMetros),
            gramatura: Number(lote.tecido?.gramatura),
            valorPorKg: valorPorKgTotal,
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
        }, INTERACTIVE_TRANSACTION_OPTIONS);

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

            const enfestosComFolhasPositivas = enfestos?.filter(enfesto => enfesto.qtdFolhas > 0);
            const rolosProducaoEntrada = extrairRolosProducaoDosEnfestos(enfestosComFolhasPositivas);

            if (status === "em_producao" && lote.status === "planejado" && rolosProducaoEntrada.length > 0) {
                if (!usuarioId) {
                    throw new Error("usuárioId é obrigatório para registrar movimentações automáticas.");
                }

                const rolosIdsEntrada = [...new Set(rolosProducaoEntrada.map(rolo => rolo.estoqueRoloId))];
                await validarRolosPertencemAoLote(tx, id, rolosIdsEntrada);

                const rolosExistentes = await tx.estoqueRolo.findMany({
                    where: {
                        id: {
                            in: rolosIdsEntrada
                        }
                    }
                });

                if (rolosExistentes.length !== rolosIdsEntrada.length) {
                    throw new Error("Um ou mais rolos não encontrados.");
                }

                const rolosPorId = new Map<string, { pesoAtualKg: number }>(
                    rolosExistentes.map((rolo: any) => [rolo.id, { pesoAtualKg: Number(rolo.pesoAtualKg) }])
                );

                for (const roloInfo of rolosProducaoEntrada) {
                    const rolo = rolosPorId.get(roloInfo.estoqueRoloId);
                    if (!rolo) {
                        throw new Error(`Rolo ${roloInfo.estoqueRoloId} não encontrado.`);
                    }

                    if (rolo.pesoAtualKg < roloInfo.pesoReservado) {
                        throw new Error(`Rolo ${roloInfo.estoqueRoloId} não tem peso suficiente. Disponível: ${rolo.pesoAtualKg}kg, Solicitado: ${roloInfo.pesoReservado}kg`);
                    }

                    rolo.pesoAtualKg -= roloInfo.pesoReservado;
                }

                await tx.movimentacaoEstoque.createMany({
                    data: rolosProducaoEntrada.map(roloInfo => ({
                        estoqueRoloId: roloInfo.estoqueRoloId,
                        usuarioId,
                        tipoMovimentacao: "saida",
                        pesoMovimentado: roloInfo.pesoReservado
                    }))
                });

                await Promise.all(
                    Array.from(rolosPorId.entries()).map(([estoqueRoloId, rolo]) =>
                        tx.estoqueRolo.update({
                            where: { id: estoqueRoloId },
                            data: {
                                pesoAtualKg: rolo.pesoAtualKg <= 0 ? 0 : rolo.pesoAtualKg,
                                situacao: rolo.pesoAtualKg <= 0 ? "esgotado" : "em_uso"
                            }
                        })
                    )
                );
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

            const itemsNormalizados = consolidarItemsNormalizados(normalizarItemsEntrada(enfestosComFolhasPositivas));
            const itemsComQuantidadePositiva = filtrarItensComQuantidadePositiva(itemsNormalizados);

            if (enfestos !== undefined && enfestos.length > 0) {
                const corIdsPayload = [...new Set(enfestos.map(enfesto => enfesto.corId))];
                const coresPayload = await tx.cor.findMany({
                    where: {
                        id: {
                            in: corIdsPayload
                        }
                    },
                    select: {
                        id: true,
                        nome: true
                    }
                });

                if (coresPayload.length !== corIdsPayload.length) {
                    throw new Error("Uma ou mais cores não foram encontradas.");
                }

                const nomeCorPorId = new Map<string, string>(coresPayload.map(cor => [cor.id, cor.nome]));
                const coresParaAtualizar = [...new Set(corIdsPayload.map(corId => nomeCorPorId.get(corId) as string))];

                const corIdsRemocao = [...new Set(enfestos.filter(enfesto => enfesto.qtdFolhas === 0).map(enfesto => enfesto.corId))];
                const coresParaRemocao = [...new Set(corIdsRemocao.map(corId => nomeCorPorId.get(corId) as string))];

                if (coresParaRemocao.length > 0) {
                    const rolosRemocao = enfestos
                        .filter(enfesto => enfesto.qtdFolhas === 0)
                        .flatMap(enfesto => enfesto.rolosProducao ?? []);

                    const pesoEstornoPorRolo = new Map<string, number>();
                    for (const rolo of rolosRemocao) {
                        const pesoAtual = pesoEstornoPorRolo.get(rolo.estoqueRoloId) ?? 0;
                        pesoEstornoPorRolo.set(rolo.estoqueRoloId, pesoAtual + rolo.pesoReservado);
                    }

                    if (pesoEstornoPorRolo.size > 0) {
                        if (!usuarioId) {
                            throw new Error("usuarioId é obrigatório para estornar peso ao remover enfestos com qtdFolhas igual a 0.");
                        }

                        const rolosIdsEstorno = Array.from(pesoEstornoPorRolo.keys());
                        await validarRolosPertencemAoLote(tx, id, rolosIdsEstorno);

                        const rolosEstoque = await tx.estoqueRolo.findMany({
                            where: {
                                id: {
                                    in: rolosIdsEstorno
                                }
                            },
                            select: {
                                id: true,
                                pesoAtualKg: true,
                                pesoInicialKg: true
                            }
                        });

                        if (rolosEstoque.length !== rolosIdsEstorno.length) {
                            throw new Error("Um ou mais rolos para estorno não foram encontrados no estoque.");
                        }

                        await tx.movimentacaoEstoque.createMany({
                            data: rolosEstoque.map(rolo => ({
                                estoqueRoloId: rolo.id,
                                usuarioId,
                                tipoMovimentacao: "entrada",
                                pesoMovimentado: pesoEstornoPorRolo.get(rolo.id) ?? 0
                            }))
                        });

                        await Promise.all(
                            rolosEstoque.map((rolo) => {
                                const pesoEstorno = pesoEstornoPorRolo.get(rolo.id) ?? 0;
                                const novoPeso = Number(rolo.pesoAtualKg) + pesoEstorno;
                                const pesoInicial = Number(rolo.pesoInicialKg);

                                return tx.estoqueRolo.update({
                                    where: { id: rolo.id },
                                    data: {
                                        pesoAtualKg: novoPeso,
                                        situacao: novoPeso <= 0 ? "esgotado" : (novoPeso < pesoInicial ? "disponivel" : "disponivel")
                                    }
                                });
                            })
                        );

                        await tx.loteRolo.deleteMany({
                            where: {
                                loteProducaoId: id,
                                estoqueRoloId: {
                                    in: rolosIdsEstorno
                                }
                            }
                        });
                    }
                }

                if (coresParaAtualizar.length > 0) {
                    await tx.loteItem.deleteMany({
                        where: {
                            loteProducaoId: id,
                            enfestos: {
                                some: {
                                    cor: {
                                        in: coresParaAtualizar
                                    }
                                }
                            }
                        }
                    });
                }
            }

            if (itemsComQuantidadePositiva.length > 0) {
                if (["concluido", "cancelado"].includes(lote.status)) {
                    throw new Error("Não é possível adicionar items a um lote concluído ou cancelado.");
                }

                const [, nomesCorPorId] = await Promise.all([
                    validarProdutosETamanhos(tx, itemsComQuantidadePositiva),
                    obterNomesCorPorId(tx, itemsComQuantidadePositiva)
                ]);

                const rolosReservadosPorEnfesto = extrairRolosReservados(itemsComQuantidadePositiva);
                const { rolosAgrupados } = await validarRolos(tx, rolosReservadosPorEnfesto);
                const rolosIds = rolosAgrupados.map(rolo => rolo.estoqueRoloId);
                const pesosReservadosPorRolo = await obterPesosReservadosPorRoloNoLote(tx, id, rolosIds);

                for (const item of itemsComQuantidadePositiva) {
                    const loteItemCriado = await tx.loteItem.create({
                        data: {
                            loteProducaoId: id,
                            produtoId: item.produtoId,
                            tamanhoId: item.tamanhoId,
                            quantidadePlanejada: item.quantidadePlanejada
                        }
                    });

                    for (const enfesto of item.enfestos) {
                        await tx.enfesto.create({
                            data: {
                                loteItemId: loteItemCriado.id,
                                cor: nomesCorPorId.get(enfesto.corId) as string,
                                qtdFolhas: enfesto.qtdFolhas,
                                rolos: {
                                    create: enfesto.rolos.map(rolo => ({
                                        estoqueRoloId: rolo.estoqueRoloId,
                                        pesoReservado: pesosReservadosPorRolo.get(rolo.estoqueRoloId) ?? 0
                                    }))
                                }
                            }
                        });
                    }
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
        }, INTERACTIVE_TRANSACTION_OPTIONS);
    }
}

class AddLoteItemsService {
    async execute(id: string, { enfestos }: IAddLoteItemsRequest) {
        const itemsNormalizados = filtrarItensComQuantidadePositiva(
            consolidarItemsNormalizados(normalizarItemsEntradaAdd(enfestos))
        );

        if (!itemsNormalizados || itemsNormalizados.length === 0) {
            throw new Error("Informe ao menos um item com quantidadePlanejada maior que zero.");
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

            const [, nomesCorPorId] = await Promise.all([
                validarProdutosETamanhos(tx, itemsNormalizados),
                obterNomesCorPorId(tx, itemsNormalizados)
            ]);

            const itensExistentes = await tx.loteItem.findMany({
                where: { loteProducaoId: id },
                include: {
                    enfestos: {
                        include: {
                            rolos: true
                        }
                    }
                }
            });

            const itemExistentePorChave = new Map<string, string>();
            const chavesPorItemId = new Map<string, string[]>();
            const itemIdsParaRemover = new Set<string>();

            for (const itemExistente of itensExistentes) {
                const chavesDoItem: string[] = [];

                for (const enfestoExistente of itemExistente.enfestos) {
                    const chave = criarChaveItemPorCorERolos(
                        itemExistente.produtoId,
                        itemExistente.tamanhoId,
                        enfestoExistente.cor,
                        Number(enfestoExistente.qtdFolhas),
                        ordenarRolosIds(enfestoExistente.rolos)
                    );

                    itemExistentePorChave.set(chave, itemExistente.id);
                    chavesDoItem.push(chave);
                }

                chavesPorItemId.set(itemExistente.id, chavesDoItem);
            }

            const rolosReservadosPorEnfesto = extrairRolosReservados(itemsNormalizados);
            const { rolosAgrupados } = await validarRolos(tx, rolosReservadosPorEnfesto);
            const rolosIds = rolosAgrupados.map(rolo => rolo.estoqueRoloId);
            const pesosReservadosPorRolo = await obterPesosReservadosPorRoloNoLote(tx, id, rolosIds);

            for (const item of itemsNormalizados) {
                for (const enfesto of item.enfestos) {
                    const nomeCor = nomesCorPorId.get(enfesto.corId) as string;
                    const chave = criarChaveItemPorCorERolos(
                        item.produtoId,
                        item.tamanhoId,
                        nomeCor,
                        enfesto.qtdFolhas,
                        ordenarRolosIds(enfesto.rolos)
                    );

                    const itemIdExistente = itemExistentePorChave.get(chave);
                    if (itemIdExistente) {
                        itemIdsParaRemover.add(itemIdExistente);

                        const chavesAntigas = chavesPorItemId.get(itemIdExistente) ?? [];
                        for (const chaveAntiga of chavesAntigas) {
                            itemExistentePorChave.delete(chaveAntiga);
                        }
                        chavesPorItemId.delete(itemIdExistente);
                    }
                }
            }

            if (itemIdsParaRemover.size > 0) {
                await tx.loteItem.deleteMany({
                    where: {
                        id: {
                            in: Array.from(itemIdsParaRemover)
                        }
                    }
                });
            }

            for (const item of itemsNormalizados) {
                const loteItemCriado = await tx.loteItem.create({
                    data: {
                        loteProducaoId: id,
                        produtoId: item.produtoId,
                        tamanhoId: item.tamanhoId,
                        quantidadePlanejada: item.quantidadePlanejada
                    }
                });

                for (const enfesto of item.enfestos) {
                    await tx.enfesto.create({
                        data: {
                            loteItemId: loteItemCriado.id,
                            cor: nomesCorPorId.get(enfesto.corId) as string,
                            qtdFolhas: enfesto.qtdFolhas,
                            rolos: {
                                create: enfesto.rolos.map(rolo => ({
                                    estoqueRoloId: rolo.estoqueRoloId,
                                    pesoReservado: pesosReservadosPorRolo.get(rolo.estoqueRoloId) ?? 0
                                }))
                            }
                        }
                    });
                }
            }

            return tx.loteProducao.findUnique({
                where: { id },
                include: loteInclude
            });
        }, INTERACTIVE_TRANSACTION_OPTIONS);

        if (!loteAtualizado) {
            throw new Error("Erro ao atualizar lote.");
        }

        return formatarLoteResponse(loteAtualizado);
    }
}

class DeleteLoteProducaoService {
    async execute(id: string) {
        return prismaClient.$transaction(async (tx) => {
            const lote = await tx.loteProducao.findUnique({
                where: { id },
                include: {
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

            const pesoEstornoPorRolo = new Map<string, number>();
            for (const loteRolo of lote.rolos) {
                const pesoAtual = pesoEstornoPorRolo.get(loteRolo.estoqueRoloId) ?? 0;
                pesoEstornoPorRolo.set(loteRolo.estoqueRoloId, pesoAtual + Number(loteRolo.pesoReservado));
            }

            const rolosIdsEstorno = Array.from(pesoEstornoPorRolo.keys());
            if (rolosIdsEstorno.length > 0) {
                const rolosEstoque = await tx.estoqueRolo.findMany({
                    where: {
                        id: {
                            in: rolosIdsEstorno
                        }
                    },
                    select: {
                        id: true,
                        pesoAtualKg: true
                    }
                });

                if (rolosEstoque.length !== rolosIdsEstorno.length) {
                    throw new Error("Um ou mais rolos do lote não foram encontrados no estoque para estorno.");
                }

                await tx.movimentacaoEstoque.createMany({
                    data: rolosIdsEstorno.map(estoqueRoloId => ({
                        estoqueRoloId,
                        usuarioId: lote.responsavelId,
                        tipoMovimentacao: "entrada",
                        pesoMovimentado: pesoEstornoPorRolo.get(estoqueRoloId) ?? 0
                    }))
                });

                await Promise.all(
                    rolosEstoque.map((rolo) => {
                        const pesoEstorno = pesoEstornoPorRolo.get(rolo.id) ?? 0;
                        const novoPeso = Number(rolo.pesoAtualKg) + pesoEstorno;

                        return tx.estoqueRolo.update({
                            where: { id: rolo.id },
                            data: {
                                pesoAtualKg: novoPeso,
                                situacao: novoPeso <= 0 ? "esgotado" : "disponivel"
                            }
                        });
                    })
                );
            }

            await tx.loteRolo.deleteMany({
                where: { loteProducaoId: id }
            });

            await tx.loteItem.deleteMany({
                where: { loteProducaoId: id }
            });

            await tx.loteProducao.delete({
                where: { id }
            });

            return { message: "Lote deletado com sucesso." };
        }, INTERACTIVE_TRANSACTION_OPTIONS);
    }
}

class AddRolosLoteService {
    async execute(id: string, { rolos }: { rolos: Array<{ estoqueRoloId: string; pesoReservado: number }> }) {
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id }
        });

        if (!lote) {
            throw new Error("Lote não encontrado.");
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

        for (const roloReservado of rolosAgrupados) {
            const rolo = rolosPorId.get(roloReservado.estoqueRoloId) as any;
            if (!rolo) {
                throw new Error(`Rolo ${roloReservado.estoqueRoloId} não encontrado.`);
            }

            if (Number(rolo.pesoAtualKg) < roloReservado.pesoReservado) {
                throw new Error(`Rolo ${rolo.id} não tem peso suficiente. Disponível: ${rolo.pesoAtualKg}kg, Solicitado: ${roloReservado.pesoReservado}kg`);
            }
        }

        const loteAtualizado = await prismaClient.$transaction(async (tx) => {
            // Adicionar rolos ao lote
            await tx.loteRolo.createMany({
                data: rolosAgrupados.map(rolo => ({
                    loteProducaoId: id,
                    estoqueRoloId: rolo.estoqueRoloId,
                    pesoReservado: rolo.pesoReservado
                }))
            });

            // Atualizar peso dos rolos no estoque
            for (const roloInfo of rolosAgrupados) {
                const roloExistente = rolosPorId.get(roloInfo.estoqueRoloId) as any;
                if (!roloExistente) {
                    continue;
                }

                const novoPeso = Number(roloExistente.pesoAtualKg) - roloInfo.pesoReservado;

                await tx.movimentacaoEstoque.create({
                    data: {
                        estoqueRoloId: roloInfo.estoqueRoloId,
                        usuarioId: lote.responsavelId,
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

            return tx.loteProducao.findUnique({
                where: { id },
                include: loteInclude
            });
        }, INTERACTIVE_TRANSACTION_OPTIONS);

        if (!loteAtualizado) {
            throw new Error("Erro ao atualizar lote.");
        }

        return formatarLoteResponse(loteAtualizado);
    }
}

export { CreateLoteProducaoService, ListAllLoteProducaoService, ListByIdLoteProducaoService, UpdateLoteProducaoService, AddLoteItemsService, AddRolosLoteService, DeleteLoteProducaoService };