import { ICreateMovimentacaoEstoqueRequest } from "../../interfaces/IEstoque";
import prismaClient from "../../prisma";

class CreateMovimentacaoEstoqueService {
    async execute(usuarioId: string, { estoqueRoloId, tipoMovimentacao, pesoMovimentado }: ICreateMovimentacaoEstoqueRequest) {
        // Verificar se estoque rolo existe
        const rolo = await prismaClient.estoqueRolo.findUnique({
            where: { id: estoqueRoloId }
        });

        if (!rolo) {
            throw new Error("Rolo não encontrado.");
        }

        // Validações de lógica de negócio
        if (tipoMovimentacao === "saida" || tipoMovimentacao === "ajuste") {
            if (pesoMovimentado > rolo.pesoAtualKg.toNumber()) {
                throw new Error("Peso da saída não pode ser maior que o peso atual do rolo.");
            }
        }

        // Registrar movimentação
        const movimentacao = await prismaClient.movimentacaoEstoque.create({
            data: {
                estoqueRoloId,
                usuarioId,
                tipoMovimentacao,
                pesoMovimentado
            },
            include: {
                rolo: {
                    include: {
                        tecido: true
                    }
                },
                usuario: true
            }
        });

        // Atualizar peso do rolo baseado no tipo de movimentação
        let novoPheso = rolo.pesoAtualKg.toNumber();

        if (tipoMovimentacao === "entrada") {
            novoPheso = rolo.pesoAtualKg.toNumber() + pesoMovimentado;
        } else if (tipoMovimentacao === "saida" || tipoMovimentacao === "devolucao") {
            novoPheso = rolo.pesoAtualKg.toNumber() - pesoMovimentado;
        } else if (tipoMovimentacao === "ajuste") {
            novoPheso = pesoMovimentado;
        }

        // Atualizar rolo com novo peso
        await prismaClient.estoqueRolo.update({
            where: { id: estoqueRoloId },
            data: {
                pesoAtualKg: novoPheso
            }
        });

        return movimentacao;
    }
}

class ListAllMovimentacaoEstoqueService {
    async execute(estoqueRoloId?: string, tipoMovimentacao?: string, dataInicio?: string, dataFim?: string) {
        const movimentacoes = await prismaClient.movimentacaoEstoque.findMany({
            where: {
                ...(estoqueRoloId && { estoqueRoloId }),
                ...(tipoMovimentacao && { tipoMovimentacao }),
                ...(dataInicio || dataFim ? {
                    createdAt: {
                        ...(dataInicio && { gte: new Date(dataInicio) }),
                        ...(dataFim && { lte: new Date(dataFim) })
                    }
                } : {})
            },
            include: {
                rolo: {
                    include: {
                        tecido: true
                    }
                },
                usuario: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return movimentacoes;
    }
}

class ListByIdMovimentacaoEstoqueService {
    async execute(id: string) {
        const movimentacao = await prismaClient.movimentacaoEstoque.findUnique({
            where: { id },
            include: {
                rolo: {
                    include: {
                        tecido: true
                    }
                },
                usuario: true
            }
        });

        if (!movimentacao) {
            throw new Error("Movimentação não encontrada.");
        }

        return movimentacao;
    }
}

class GetHistoricoRoloService {
    async execute(estoqueRoloId: string) {
        const rolo = await prismaClient.estoqueRolo.findUnique({
            where: { id: estoqueRoloId }
        });

        if (!rolo) {
            throw new Error("Rolo não encontrado.");
        }

        const movimentacoes = await prismaClient.movimentacaoEstoque.findMany({
            where: { estoqueRoloId },
            include: {
                usuario: true
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        let pesoRastreado = rolo.pesoInicialKg;
        const historico = movimentacoes.map((mov) => {
            let novoPheso = pesoRastreado;
            const peso = typeof mov.pesoMovimentado === 'number' ? mov.pesoMovimentado : mov.pesoMovimentado?.toNumber() || 0;

            if (mov.tipoMovimentacao === "entrada") {
                novoPheso = pesoRastreado.plus(peso);
            } else if (mov.tipoMovimentacao === "saida" || mov.tipoMovimentacao === "devolucao") {
                novoPheso = pesoRastreado.minus(peso);
            } else if (mov.tipoMovimentacao === "ajuste") {
                novoPheso = pesoRastreado.constructor(peso);
            }

            pesoRastreado = novoPheso;

            return {
                ...mov,
                pesoAntesMovimentacao: (typeof pesoRastreado === 'number' ? pesoRastreado : pesoRastreado?.toNumber?.() ?? 0) - (mov.tipoMovimentacao === "entrada" ? peso : 0),
                pesoDepoisMovimentacao: novoPheso
            };
        });

        return {
            rolo,
            historico,
            pesoAtual: rolo.pesoAtualKg,
            pesoInicial: rolo.pesoInicialKg,
            pesoConsumido: rolo.pesoInicialKg.toNumber() - rolo.pesoAtualKg.toNumber()
        };
    }
}

export { CreateMovimentacaoEstoqueService, ListAllMovimentacaoEstoqueService, ListByIdMovimentacaoEstoqueService, GetHistoricoRoloService };
