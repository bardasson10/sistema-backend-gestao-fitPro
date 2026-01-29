

export interface IAuthUserRequest {
    email: string;
    senha: string;
}

export interface IAuthUserResponse {
    id: string;
    nome: string;
    email: string;
    perfil: string;
    token: string;
    dataCriacao?: Date;
}