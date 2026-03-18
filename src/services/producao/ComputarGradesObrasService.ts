import prismaClient from "../../prisma";

class ComputarGradesObrasService {
    async execute(loteProducaoId: string) {
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id: loteProducaoId },
            include: {
                items: {
                    include: {
                        enfestos: {
                            include: {
                                rolos: {
                                    include: {
                                        rolo: {
                                            select: {
                                                tecido: {
                                                    select: {
                                                        corId: true
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
                estoqueCorte: {
                    include: {
                        direcionamentoItems: {
                            select: {
                                id: true
                            }
                        }
                    }
                }
            }
        });

        if (!lote) {
            throw new Error("Lote nao encontrado.");
        }

        const cores = await prismaClient.cor.findMany({
            select: {
                id: true,
                nome: true
            }
        });

        const coresPorNome = new Map<string, string>();
        const nomesCorAmbiguos = new Set<string>();
        for (const cor of cores) {
            const nomeNormalizado = String(cor.nome).trim().toLowerCase();

            if (!coresPorNome.has(nomeNormalizado)) {
                coresPorNome.set(nomeNormalizado, cor.id);
                continue;
            }

            // Nomes duplicados em Cor tornam o fallback por nome ambiguo.
            nomesCorAmbiguos.add(nomeNormalizado);
        }

        const resolverCorIdEnfesto = (enfesto: {
            cor: string;
            rolos: Array<{ rolo: { tecido: { corId: string } } }>;
        }, itemId: string): string => {
            const corIdDoRolo = enfesto.rolos[0]?.rolo?.tecido?.corId;
            if (corIdDoRolo) {
                return corIdDoRolo;
            }

            const nomeCor = String(enfesto.cor).trim().toLowerCase();
            if (nomesCorAmbiguos.has(nomeCor)) {
                throw new Error(`Cor ambigua no enfesto '${enfesto.cor}' do item ${itemId}. Cadastre nomes de cor unicos ou informe rolos com cor valida.`);
            }

            const corPorNome = coresPorNome.get(nomeCor);
            if (corPorNome) {
                return corPorNome;
            }

            throw new Error(`Nao foi possivel resolver a cor do enfesto '${enfesto.cor}' no item ${itemId}.`);
        };

        const planejadoPorProdutoTamanhoCor = new Map<string, {
            produtoId: string;
            tamanhoId: string;
            corId: string;
            quantidadePlanejada: number;
        }>();

        for (const item of lote.items) {
            const enfestosComCor = item.enfestos
                .filter((enfesto) => enfesto.qtdFolhas > 0)
                .map((enfesto) => ({
                    enfesto,
                    corId: resolverCorIdEnfesto(enfesto, item.id)
                }));

            if (enfestosComCor.length === 0) {
                continue;
            }

            const totalFolhas = enfestosComCor.reduce((acc, { enfesto }) => acc + Number(enfesto.qtdFolhas), 0);
            let quantidadeRestante = Number(item.quantidadePlanejada);
            let folhasRestantes = totalFolhas;

            for (const [idx, enfestoComCor] of enfestosComCor.entries()) {
                const { enfesto, corId } = enfestoComCor;
                const folhasEnfesto = Number(enfesto.qtdFolhas);

                const quantidadePlanejadaCor = idx === enfestosComCor.length - 1
                    ? quantidadeRestante
                    : Math.max(0, Math.round((quantidadeRestante * folhasEnfesto) / Math.max(folhasRestantes, 1)));

                quantidadeRestante -= quantidadePlanejadaCor;
                folhasRestantes -= folhasEnfesto;

                const key = `${item.produtoId}|${item.tamanhoId}|${corId}`;
                const atual = planejadoPorProdutoTamanhoCor.get(key);

                if (!atual) {
                    planejadoPorProdutoTamanhoCor.set(key, {
                        produtoId: item.produtoId,
                        tamanhoId: item.tamanhoId,
                        corId,
                        quantidadePlanejada: quantidadePlanejadaCor
                    });
                    continue;
                }

                atual.quantidadePlanejada += quantidadePlanejadaCor;
            }
        }

        const estoqueExistentePorKey = new Map(
            lote.estoqueCorte.map((estoque) => [`${estoque.produtoId}|${estoque.tamanhoId}|${estoque.corId}`, estoque])
        );

        const chavesPlanejadas = new Set(planejadoPorProdutoTamanhoCor.keys());
        const paraCriar: Array<{ loteProducaoId: string; produtoId: string; tamanhoId: string; corId: string; quantidadeDisponivel: number; }> = [];
        const divergenciasComDirecionamento: string[] = [];

        await prismaClient.$transaction(async (tx) => {
            for (const [key, planejado] of planejadoPorProdutoTamanhoCor.entries()) {
                const estoqueExistente = estoqueExistentePorKey.get(key);

                if (!estoqueExistente) {
                    paraCriar.push({
                        loteProducaoId,
                        produtoId: planejado.produtoId,
                        tamanhoId: planejado.tamanhoId,
                        corId: planejado.corId,
                        quantidadeDisponivel: planejado.quantidadePlanejada
                    });
                    continue;
                }

                const possuiDirecionamentos = estoqueExistente.direcionamentoItems.length > 0;
                if (possuiDirecionamentos && estoqueExistente.quantidadeDisponivel !== planejado.quantidadePlanejada) {
                    divergenciasComDirecionamento.push(key);
                    continue;
                }

                if (!possuiDirecionamentos && estoqueExistente.quantidadeDisponivel !== planejado.quantidadePlanejada) {
                    await tx.estoqueCorte.update({
                        where: { id: estoqueExistente.id },
                        data: {
                            quantidadeDisponivel: planejado.quantidadePlanejada
                        }
                    });
                }
            }

            for (const [key, estoqueExistente] of estoqueExistentePorKey.entries()) {
                if (chavesPlanejadas.has(key)) {
                    continue;
                }

                if (estoqueExistente.direcionamentoItems.length > 0) {
                    divergenciasComDirecionamento.push(key);
                    continue;
                }

                await tx.estoqueCorte.delete({
                    where: { id: estoqueExistente.id }
                });
            }

            if (paraCriar.length > 0) {
                const createManyResult = await tx.estoqueCorte.createMany({
                    data: paraCriar,
                    skipDuplicates: true
                });

                if (createManyResult.count !== paraCriar.length) {
                    throw new Error(
                        "Nao foi possivel criar todos os itens por cor no estoque de corte. " +
                        "Verifique se ainda existe a unique legada (lote_producao_id, produto_id, tamanho_id) no banco."
                    );
                }
            }
        });

        if (divergenciasComDirecionamento.length > 0) {
            throw new Error(
                `Nao foi possivel sincronizar alguns itens do estoque de corte porque ja possuem direcionamentos associados: ${divergenciasComDirecionamento.join(", ")}.`
            );
        }

        return {
            message: "Estoque de corte sincronizado com sucesso.",
            loteId: loteProducaoId,
            itensCriados: paraCriar.length
        };
    }
}

export { ComputarGradesObrasService };
