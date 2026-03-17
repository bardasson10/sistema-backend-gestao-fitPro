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
                        tamanho: true
                    }
                },
                estoqueCorte: {
                    include: {
                        produto: true,
                        tamanho: true
                    }
                }
            }
        });

        if (!lote) {
            throw new Error("Lote nao encontrado.");
        }

        const planejadoPorProdutoTamanho = new Map<string, number>();
        for (const loteItem of lote.items) {
            const key = `${loteItem.produtoId}|${loteItem.tamanhoId}`;
            const atual = planejadoPorProdutoTamanho.get(key) ?? 0;
            planejadoPorProdutoTamanho.set(key, atual + loteItem.quantidadePlanejada);
        }

        const items = lote.estoqueCorte
            .filter((estoque) => estoque.quantidadeDisponivel > 0)
            .map((estoque) => {
                const key = `${estoque.produtoId}|${estoque.tamanhoId}`;
                const quantidadePlanejada = planejadoPorProdutoTamanho.get(key) ?? 0;
                const quantidadeSobra = estoque.quantidadeDisponivel;
                const quantidadeDirecionada = Math.max(0, quantidadePlanejada - quantidadeSobra);

                return {
                    estoqueCorteId: estoque.id,
                    produtoId: estoque.produtoId,
                    tamanhoId: estoque.tamanhoId,
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
