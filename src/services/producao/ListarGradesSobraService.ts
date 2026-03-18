import prismaClient from "../../prisma";
import { IGradeSobraResponse } from "../../interfaces/IProducao";

class ListarGradesSobraService {
    async execute(loteProducaoId: string): Promise<IGradeSobraResponse> {
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id: loteProducaoId },
            include: {
                items: {
                    include: {
                        produto: true,
                        tamanho: true,
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
                        produto: true,
                        tamanho: true,
                        cor: true
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

        const planejadoPorProdutoTamanhoCor = new Map<string, number>();
        for (const loteItem of lote.items) {
            const enfestosComCor = loteItem.enfestos
                .filter((enfesto) => enfesto.qtdFolhas > 0)
                .map((enfesto) => ({
                    enfesto,
                    corId: resolverCorIdEnfesto(enfesto, loteItem.id)
                }));

            if (enfestosComCor.length === 0) {
                continue;
            }

            const totalFolhas = enfestosComCor.reduce((acc, { enfesto }) => acc + Number(enfesto.qtdFolhas), 0);
            let quantidadeRestante = Number(loteItem.quantidadePlanejada);
            let folhasRestantes = totalFolhas;

            for (const [idx, enfestoComCor] of enfestosComCor.entries()) {
                const { enfesto, corId } = enfestoComCor;
                const folhasEnfesto = Number(enfesto.qtdFolhas);
                const quantidadePlanejadaCor = idx === enfestosComCor.length - 1
                    ? quantidadeRestante
                    : Math.max(0, Math.round((quantidadeRestante * folhasEnfesto) / Math.max(folhasRestantes, 1)));

                quantidadeRestante -= quantidadePlanejadaCor;
                folhasRestantes -= folhasEnfesto;

                const key = `${loteItem.produtoId}|${loteItem.tamanhoId}|${corId}`;
                const atual = planejadoPorProdutoTamanhoCor.get(key) ?? 0;
                planejadoPorProdutoTamanhoCor.set(key, atual + quantidadePlanejadaCor);
            }
        }

        const items = lote.estoqueCorte
            .filter((estoque) => estoque.quantidadeDisponivel > 0)
            .map((estoque) => {
                const key = `${estoque.produtoId}|${estoque.tamanhoId}|${estoque.corId}`;
                const quantidadePlanejada = planejadoPorProdutoTamanhoCor.get(key) ?? 0;
                const quantidadeSobra = estoque.quantidadeDisponivel;
                const quantidadeDirecionada = Math.max(0, quantidadePlanejada - quantidadeSobra);

                return {
                    estoqueCorteId: estoque.id,
                    produtoId: estoque.produtoId,
                    tamanhoId: estoque.tamanhoId,
                    corId: estoque.corId,
                    corNome: estoque.cor.nome,
                    corCodigoHex: estoque.cor.codigoHex,
                    produtoNome: estoque.produto.nome,
                    sku: estoque.produto.sku,
                    tamanhoNome: estoque.tamanho.nome,
                    quantidadePlanejada,
                    quantidadeDirecionada,
                    quantidadeSobra,
                    quantidadeDisponivel: estoque.quantidadeDisponivel
                };
            });

        return {
            loteId: lote.id,
            codigoLote: lote.codigoLote,
            items
        };
    }
}

export { ListarGradesSobraService };
