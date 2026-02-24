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

export interface ILoteRoloInput {
    estoqueRoloId: string;
    pesoReservado: number;
}

export interface ILoteItemComRolosInput extends ILoteItemInput {
    corId: string;
    rolos: ILoteRoloInput[];
}

export interface ICreateLoteProducaoRequest {
    codigoLote: string;
    responsavelId: string;
    status?: string;
    observacao?: string;
    items: ILoteItemComRolosInput[];
}

export interface IUpdateLoteProducaoRequest {
    codigoLote?: string;
    tecidoId?: string;
    responsavelId?: string;
    status?: string;
    observacao?: string;
    items?: ILoteItemComRolosInput[];
    rolosProducao?: Array<{ estoqueRoloId: string; pesoUtilizado: number }>; // Rolos usados ao iniciar produção (movimentação automática)
    usuarioId?: string; // ID do usuário para movimentação automática
}

export interface IAddLoteItemsRequest {
    items: ILoteItemComRolosInput[];
    usuarioId?: string;
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
}

export interface IUpdateDirecionamentoRequest {
    status?: string;
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
