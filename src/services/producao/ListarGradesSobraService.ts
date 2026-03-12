import prismaClient from "../../prisma";
import { IGradeSobraResponse } from "../../interfaces/IProducao";

/**
 * Service para listar grades de sobra de um lote
 */
class ListarGradesSobraService {
    async execute(loteProducaoId: string): Promise<IGradeSobraResponse> {
        // Buscar lote
        const lote = await prismaClient.loteProducao.findUnique({
            where: { id: loteProducaoId },
            include: {
                items: {
                    include: {
                        produto: true,
                        tamanho: true
                    }
                },
                direcionamentos: {
                    include: {
                        items: true
                    }
                }
            }
        });

        if (!lote) {
            throw new Error("Lote não encontrado.");
        }

        // Buscar grades de sobra
        const gradessobra = await prismaClient.gradeSobra.findMany({
            where: { loteProducaoId },
            include: {
                produto: true,
                tamanho: true
            }
        });

        // Montar resposta com detalhes
        const items = lote.items.map(loteItem => {
            // Somar quantidade direcionada deste produto/tamanho
            let quantidadeDirecionada = 0;
            for (const direcionamento of lote.direcionamentos) {
                const dirItem = direcionamento.items.find(
                    di => di.produtoId === loteItem.produtoId && di.tamanhoId === loteItem.tamanhoId
                );
                if (dirItem) {
                    quantidadeDirecionada += dirItem.quantidade;
                }
            }

            const sobra = gradessobra.find(
                gs => gs.produtoId === loteItem.produtoId && gs.tamanhoId === loteItem.tamanhoId
            );

            return {
                produtoId: loteItem.produtoId,
                tamanhoId: loteItem.tamanhoId,
                produtoNome: loteItem.produto.nome,
                sku: loteItem.produto.sku,
                tamanhoNome: loteItem.tamanho.nome,
                quantidadePlanejada: loteItem.quantidadePlanejada,
                quantidadeDirecionada,
                quantidadeSobra: sobra?.quantidadeSobra || 0
            };
        });

        return {
            loteId: lote.id,
            codigoLote: lote.codigoLote,
            items: items.filter(item => item.quantidadeSobra > 0)
        };
    }
}

export { ListarGradesSobraService };
