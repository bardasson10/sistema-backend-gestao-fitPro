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

export interface IEnfestoRoloInput {
    estoqueRoloId: string;
}

export interface IEnfestoInput {
    corId: string; // ID da cor
    qtdFolhas: number;
    rolos: IEnfestoRoloInput[];
}

export interface ILoteItemComEnfestosInput extends ILoteItemInput {
    enfestos: IEnfestoInput[];
}

export interface IEnfestoComItemsInput extends IEnfestoInput {
    items: ILoteItemInput[];
}

export interface IEnfestoComItensProducaoInput {
    corId: string;
    qtdFolhas: number;
    rolosProducao: Array<{ estoqueRoloId: string; pesoReservado: number }>;
    itens: ILoteItemInput[];
}

export interface IEnfestoComItensInput {
    corId: string;
    qtdFolhas: number;
    rolosProducao: Array<{ estoqueRoloId: string }>;
    itens: ILoteItemInput[];
}

export interface ICreateLoteProducaoRequest {
    codigoLote: string;
    responsavelId: string;
    status?: string;
    observacao?: string;
    rolos: ILoteRoloInput[];
}

export interface IUpdateLoteProducaoRequest {
    loteId?: string;
    codigoLote?: string;
    responsavelId?: string;
    status?: string;
    observacao?: string;
    enfestos?: IEnfestoComItensProducaoInput[];
    usuarioId?: string; // ID do usuário para movimentação automática
}

export interface IAddLoteItemsRequest {
    enfestos: IEnfestoComItensInput[];
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
