// Estoque Rolo
export interface ICreateEstoqueRoloItemRequest {
    pesoInicialKg: number;
}

export interface ICreateEstoqueRoloRequest {
    tecidoId: string;
    prefixo: string;
    dataLote: string;
    rolos: ICreateEstoqueRoloItemRequest[];
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
    valorTotalEstoque: number;
    tecidoComMaiorEstoque: string;
    rolosDisponiveis: number;
    rolosReservados: number;
    rolosEmUso: number;
    movimentacoesMes: number;
}

export interface IAjusteEstoqueCorteRequest {
    novaQuantidade: number;
    motivo: string;
}
