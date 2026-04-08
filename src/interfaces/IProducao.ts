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
    qtdMultiplicadorGrade: number;
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
    quantidadePlanejada: number;
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

export interface IEnfestoProducaoUpdateInput {
    corId: string;
    qtdFolhas: number;
    rolosProducao: Array<{ estoqueRoloId: string; pesoReservado: number }>;
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
    status?: "lote_criado" | "enfesto" | "cortado";
    observacao?: string;
    rolos: ILoteRoloInput[];
}

export interface IUpdateLoteProducaoRequest {
    loteId?: string;
    codigoLote?: string;
    responsavelId?: string;
    status?: "lote_criado" | "enfesto" | "cortado";
    observacao?: string;
    gradeItens?: ILoteItemInput[];
    enfestos?: IEnfestoProducaoUpdateInput[];
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
export interface IDirecionamentoItemInput {
    estoqueCorteId: string;
    quantidade: number;
}

export interface IProdutoSKUValorFaccaoInput {
    sku: string;
    valorFaccaoPorPeca: number;
}

export interface IDirecionamentoInput {
    faccaoId: string;
    tipoServico: "costura" | "corte";
    items: IDirecionamentoItemInput[];
}

export interface ICreateDirecionamentoRequest {
    direcionamentos: IDirecionamentoInput[];
}

export interface IUpdateDirecionamentoRequest {
    direcionamentos: IDirecionamentoInput[];
}

export interface IEditDirecionamentoItemsRequest {
    itensAdicionar?: IDirecionamentoItemInput[];
    itensRemover?: IDirecionamentoItemInput[];
}

export interface IUpdateDirecionamentoStatusRequest {
    status: "separado" | "em_producao" | "entregue";
}

export interface IUpdateDirecionamentoSkuPriceRequest {
    produtoSKU: IProdutoSKUValorFaccaoInput[];
}

// Grade Sobra - Rastreamento de itens não direcionados
export interface IGradeSobraItem {
    estoqueCorteId: string;
    produtoId: string;
    tamanhoId: string;
    corId: string;
    corNome: string;
    corCodigoHex?: string | null;
    produtoNome: string;
    sku: string;
    tamanhoNome: string;
    quantidadePlanejada: number;
    quantidadeDirecionada: number;
    quantidadeSobra: number;
    quantidadeDisponivel: number;
}

export interface IGradeSobraResponse {
    loteId: string;
    codigoLote: string;
    items: IGradeSobraItem[];
}

// Conferencia
export interface IConferenciaItemInput {
    id?: string;
    direcionamentoItemId?: string;
    qtdRecebida: number;
    qtdDefeito?: number;
}

export interface ICreateConferenciaRequest {
    direcionamentoId: string;
    responsavelId: string;
    dataConferencia?: string;
    statusQualidade?: "recebido" | "em_conferencia" | "aprovado" | "aprovado_parcial" | "aprovado_defeito";
    produtoSKU?: IProdutoSKUValorFaccaoInput[];
    liberadoPagamento?: boolean;
    observacao?: string;
    items?: IConferenciaItemInput[];
}

export interface IUpdateConferenciaRequest {
    direcionamentoId?: string;
    responsavelId?: string;
    dataConferencia?: string;
    statusQualidade?: "recebido" | "em_conferencia" | "aprovado" | "aprovado_parcial" | "aprovado_defeito";
    produtoSKU?: IProdutoSKUValorFaccaoInput[];
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
    statusQualidade?: "recebido" | "em_conferencia" | "aprovado" | "aprovado_parcial" | "aprovado_defeito";
    createdAt: Date;
    updatedAt: Date;
}
