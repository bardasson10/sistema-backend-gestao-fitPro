// Produto
export interface ICreateProdutoRequest {
    tipoProdutoId: string;
    nome: string;
    sku: string;
    fabricante?: string;
    custoMedioPeca?: number;
    precoMedioVenda?: number;
}

export interface IUpdateProdutoRequest {
    tipoProdutoId?: string;
    nome?: string;
    sku?: string;
    fabricante?: string;
    custoMedioPeca?: number;
    precoMedioVenda?: number;
}

export interface IProdutoResponse {
    id: string;
    tipoProdutoId: string;
    nome: string;
    sku: string;
    fabricante?: string;
    custoMedioPeca?: number;
    precoMedioVenda?: number;
    createdAt: Date;
    updatedAt: Date;
}

// Tipo Produto
export interface ICreateTipoProdutoRequest {
    nome: string;
}

export interface IUpdateTipoProdutoRequest {
    nome?: string;
}

// Tamanho
export interface ICreateTamanhoRequest {
    nome: string;
    ordem: number;
}

export interface IUpdateTamanhoRequest {
    nome?: string;
    ordem?: number;
}

// Tipo Produto Tamanho
export interface ICreateTipoProdutoTamanhoRequest {
    tipoProdutoId: string;
    tamanhoId: string;
}
