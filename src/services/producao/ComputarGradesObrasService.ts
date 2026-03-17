import prismaClient from "../../prisma";

class ComputarGradesObrasService {
    async execute(loteProducaoId: string) {
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id: loteProducaoId },
            include: {
                items: true,
                estoqueCorte: true
            }
        });

        if (!lote) {
            throw new Error("Lote nao encontrado.");
        }

        const planejadoPorProdutoTamanho = new Map<string, {
            produtoId: string;
            tamanhoId: string;
            quantidadePlanejada: number;
        }>();

        for (const item of lote.items) {
            const key = `${item.produtoId}|${item.tamanhoId}`;
            const atual = planejadoPorProdutoTamanho.get(key);

            if (!atual) {
                planejadoPorProdutoTamanho.set(key, {
                    produtoId: item.produtoId,
                    tamanhoId: item.tamanhoId,
                    quantidadePlanejada: item.quantidadePlanejada
                });
                continue;
            }

            atual.quantidadePlanejada += item.quantidadePlanejada;
        }

        const estoqueExistentePorKey = new Map(
            lote.estoqueCorte.map((estoque) => [`${estoque.produtoId}|${estoque.tamanhoId}`, estoque])
        );

        const paraCriar = Array.from(planejadoPorProdutoTamanho.entries())
            .filter(([key]) => !estoqueExistentePorKey.has(key))
            .map(([, item]) => ({
                loteProducaoId,
                produtoId: item.produtoId,
                tamanhoId: item.tamanhoId,
                quantidadeDisponivel: item.quantidadePlanejada
            }));

        if (paraCriar.length > 0) {
            await prismaClient.estoqueCorte.createMany({
                data: paraCriar,
                skipDuplicates: true
            });
        }

        return {
            message: "Estoque de corte sincronizado com sucesso.",
            loteId: loteProducaoId,
            itensCriados: paraCriar.length
        };
    }
}

export { ComputarGradesObrasService };
