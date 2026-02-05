// Faccao
export interface ICreateFaccaoRequest {
    nome: string;
    responsavel?: string;
    contato?: string;
    prazoMedioDias?: number;
    status?: string;
}

export interface IUpdateFaccaoRequest {
    nome?: string;
    responsavel?: string;
    contato?: string;
    prazoMedioDias?: number;
    status?: string;
}

// Lote Producao
export interface ILoteItemInput {
    produtoId: string;
    tamanhoId: string;
    quantidadePlanejada: number;
}

export interface ICreateLoteProducaoRequest {
    codigoLote: string;
    tecidoId: string;
    responsavelId: string;
    status?: string;
    observacao?: string;
    items?: ILoteItemInput[];
}

export interface IUpdateLoteProducaoRequest {
    codigoLote?: string;
    tecidoId?: string;
    responsavelId?: string;
    status?: string;
    observacao?: string;
    items?: ILoteItemInput[];
}

export interface IAddLoteItemsRequest {
    items: ILoteItemInput[];
}

export interface ILoteProducaoResponse {
    id: string;
    codigoLote: string;
    tecidoId: string;
    responsavelId: string;
    status: string;
    observacao?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Direcionamento
export interface ICreateDirecionamentoRequest {
    loteProducaoId: string;
    faccaoId: string;
    tipoServico: "costura" | "estampa" | "tingimento" | "acabamento" | "corte" | "outro";
    dataSaida?: string;
    dataPrevisaoRetorno?: string;
}

export interface IUpdateDirecionamentoRequest {
    status?: string;
    dataSaida?: string;
    dataPrevisaoRetorno?: string;
}

// Conferencia
export interface IConferenciaItemInput {
    tamanhoId: string;
    qtdRecebida: number;
    qtdDefeito?: number;
}

export interface ICreateConferenciaRequest {
    direcionamentoId: string;
    responsavelId: string;
    dataConferencia?: string;
    statusQualidade?: string;
    liberadoPagamento?: boolean;
    observacao?: string;
    items?: IConferenciaItemInput[];
}

export interface IUpdateConferenciaRequest {
    direcionamentoId?: string;
    responsavelId?: string;
    dataConferencia?: string;
    statusQualidade?: string;
    liberadoPagamento?: boolean;
    observacao?: string;
    items?: IConferenciaItemInput[];
}

export interface IConferenciaResponse {
    id: string;
    direcionamentoId: string;
    responsavelId: string;
    dataConferencia?: Date;
    observacao?: string;
    liberadoPagamento: boolean;
    statusQualidade?: string;
    createdAt: Date;
    updatedAt: Date;
}
