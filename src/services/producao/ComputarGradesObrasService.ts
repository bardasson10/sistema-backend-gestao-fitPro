import prismaClient from "../../prisma";

/**
 * Service para calcular e atualizar grades de sobra de um lote
 * Sobra = quantidade planejada - soma de todos os direcionamentos
 * 
 * Chamado após criar/atualizar direcionamentos
 */
class ComputarGradesObrasService {
    async execute(loteProducaoId: string) {
        // Buscar lote com todos os items e direcionamentos
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

        // Para cada item do lote, calcular a sobra
        const gradesObrasParaAtualizar: Array<{
            loteProducaoId: string;
            produtoId: string;
            tamanhoId: string;
            quantidadeSobra: number;
        }> = [];

        for (const item of lote.items) {
            // Somar quantidade direcionada deste produto/tamanho
            let quantidadeDirecionada = 0;
            for (const direcionamento of lote.direcionamentos) {
                const dirItem = direcionamento.items.find(
                    di => di.produtoId === item.produtoId && di.tamanhoId === item.tamanhoId
                );
                if (dirItem) {
                    quantidadeDirecionada += dirItem.quantidade;
                }
            }

            // Calcular sobra (se negativa, igualar a 0)
            const quantidadeSobra = Math.max(0, item.quantidadePlanejada - quantidadeDirecionada);

            gradesObrasParaAtualizar.push({
                loteProducaoId,
                produtoId: item.produtoId,
                tamanhoId: item.tamanhoId,
                quantidadeSobra
            });
        }

        // Usar transação para atualizar grades de sobra
        await prismaClient.$transaction(async (tx) => {
            // Deletar todas as grades de sobra existentes para este lote
            await tx.gradeSobra.deleteMany({
                where: { loteProducaoId }
            });

            // Inserir novas grades de sobra (apenas as com sobra > 0)
            const gradesComSobra = gradesObrasParaAtualizar.filter(g => g.quantidadeSobra > 0);
            
            if (gradesComSobra.length > 0) {
                await tx.gradeSobra.createMany({
                    data: gradesComSobra,
                    skipDuplicates: true
                });
            }
        });

        return {
            message: "Grades de sobra calculadas com sucesso.",
            loteId: loteProducaoId,
            gradesAtualizadas: gradesObrasParaAtualizar.filter(g => g.quantidadeSobra > 0).length
        };
    }
}

export { ComputarGradesObrasService };
