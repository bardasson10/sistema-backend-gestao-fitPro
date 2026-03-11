import prismaClient from "../../prisma";

class CreateTipoProdutoTamanhoService {
    async execute({ tipoProdutoId, tamanhos }: any) {
        // Verificar se tipo de produto existe
        const tipoProduto = await prismaClient.tipoProduto.findUnique({
            where: { id: tipoProdutoId }
        });

        if (!tipoProduto) {
            throw new Error("Tipo de produto não encontrado.");
        }

        const resultados = [];
        const erros = [];

        // Processar cada tamanho
        for (const item of tamanhos) {
            try {
                const { tamanhoId } = item;

                // Verificar se tamanho existe
                const tamanho = await prismaClient.tamanho.findUnique({
                    where: { id: tamanhoId }
                });

                if (!tamanho) {
                    erros.push(`Tamanho ${tamanhoId} não encontrado.`);
                    continue;
                }

                // Verificar se já existe associação
                const jaExiste = await prismaClient.tipoProdutoTamanho.findFirst({
                    where: {
                        tipoProdutoId,
                        tamanhoId
                    }
                });

                if (jaExiste) {
                    erros.push(`Tamanho ${tamanho.nome} já está associado a este tipo de produto.`);
                    continue;
                }

                // Criar associação
                const tipoProdutoTamanho = await prismaClient.tipoProdutoTamanho.create({
                    data: {
                        tipoProdutoId,
                        tamanhoId
                    },
                    include: {
                        tipo: true,
                        tamanho: true
                    }
                });

                resultados.push(tipoProdutoTamanho);
            } catch (error) {
                erros.push(`Erro ao processar tamanho: ${error}`);
            }
        }

        return {
            message: `${resultados.length} tamanho(s) associado(s) com sucesso.`,
            criados: resultados,
            erros: erros.length > 0 ? erros : undefined
        };
    }
}

class ListTipoProdutoTamanhoService {
    async execute(tipoProdutoId: string) {
        const tiposProduto = await prismaClient.tipoProdutoTamanho.findMany({
            where: { tipoProdutoId },
            include: {
                tipo: true,
                tamanho: true
            }
        });

        return tiposProduto;
    }
}

class DeleteTipoProdutoTamanhoService {
    async execute({ tipoProdutoId, tamanhos }: { tipoProdutoId: string; tamanhos: Array<{ tamanhoId: string }> }) {
        const tipoProduto = await prismaClient.tipoProduto.findUnique({
            where: { id: tipoProdutoId }
        });

        if (!tipoProduto) {
            throw new Error("Tipo de produto não encontrado.");
        }

        const resultados = [];
        const erros = [];

        // Evita processamento duplicado quando o mesmo tamanho vem repetido no payload.
        const tamanhoIdsUnicos = [...new Set(tamanhos.map((item) => item.tamanhoId))];

        for (const tamanhoId of tamanhoIdsUnicos) {
            try {
                const tamanho = await prismaClient.tamanho.findUnique({
                    where: { id: tamanhoId }
                });

                if (!tamanho) {
                    erros.push(`Tamanho ${tamanhoId} não encontrado.`);
                    continue;
                }

                const associacao = await prismaClient.tipoProdutoTamanho.findFirst({
                    where: {
                        tipoProdutoId,
                        tamanhoId
                    },
                    include: {
                        tipo: true,
                        tamanho: true
                    }
                });

                if (!associacao) {
                    erros.push(`Tamanho ${tamanho.nome} não está associado a este tipo de produto.`);
                    continue;
                }

                await prismaClient.tipoProdutoTamanho.delete({
                    where: { id: associacao.id }
                });

                resultados.push(associacao);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                erros.push(`Erro ao processar tamanho ${tamanhoId}: ${errorMessage}`);
            }
        }

        return {
            message: `${resultados.length} tamanho(s) desassociado(s) com sucesso.`,
            removidos: resultados,
            erros: erros.length > 0 ? erros : undefined
        };
    }
}

export { CreateTipoProdutoTamanhoService, ListTipoProdutoTamanhoService, DeleteTipoProdutoTamanhoService };
