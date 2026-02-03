// Fornecedor
export interface ICreateFornecedorRequest {
    nome: string;
    tipo?: string;
    contato?: string;
}

export interface IUpdateFornecedorRequest {
    nome?: string;
    tipo?: string;
    contato?: string;
}

// Cor
export interface ICreateCorRequest {
    nome: string;
    codigoHex?: string;
}

export interface IUpdateCorRequest {
    nome?: string;
    codigoHex?: string;
}

// Tecido
export interface ICreateTecidoRequest {
    fornecedorId: string;
    corId: string;
    nome: string;
    codigoReferencia?: string;
    rendimentoMetroKg?: number;
    larguraMetros?: number;
    valorPorKg?: number;
    gramatura?: number;
}

export interface IUpdateTecidoRequest {
    fornecedorId?: string;
    corId?: string;
    nome?: string;
    codigoReferencia?: string;
    rendimentoMetroKg?: number;
    larguraMetros?: number;
    valorPorKg?: number;
    gramatura?: number;
}

export interface ITecidoResponse {
    id: string;
    fornecedorId: string;
    corId: string;
    nome: string;
    codigoReferencia?: string;
    rendimentoMetroKg?: number;
    larguraMetros?: number;
    valorPorKg?: number;
    gramatura?: number;
    createdAt: Date;
    updatedAt: Date;
}
