// Estoque Rolo
export interface ICreateEstoqueRoloRequest {
    tecidoId: string;
    codigoBarraRolo?: string;
    pesoInicialKg: number;
    pesoAtualKg: number;
    situacao?: string;
    usuarioId: string; // ID do usuário que está criando o rolo (para movimentação automática)
}

export interface IUpdateEstoqueRoloRequest {
    pesoAtualKg?: number;
    situacao?: string;
    usuarioId?: string;
}

export interface IEstoqueRoloResponse {
    id: string;
    tecidoId: string;
    codigoBarraRolo?: string;
    pesoInicialKg: number;
    pesoAtualKg: number;
    situacao: string;
    createdAt: Date;
    updatedAt: Date;
}

// Movimentação Estoque
export interface ICreateMovimentacaoEstoqueRequest {
    estoqueRoloId: string;
    tipoMovimentacao: "entrada" | "saida" | "ajuste" | "devolucao";
    pesoMovimentado: number;
}

export interface IMovimentacaoEstoqueResponse {
    id: string;
    estoqueRoloId: string;
    usuarioId: string;
    tipoMovimentacao: string;
    pesoMovimentado?: number;
    createdAt: Date;
}

export interface IRelatoriEstoqueResponse {
    totalRolos: number;
    pesoTotal: number;
    tecidoComMaiorEstoque: string;
    rolosDisponíveis: number;
    rolosReservados: number;
    rolosEmUso: number;
    movimentacoesMes: number;
}
