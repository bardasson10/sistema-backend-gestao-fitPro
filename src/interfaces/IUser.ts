import { Perfil } from "../generated/prisma/enums";

export interface ICreateUserRequest {
    nome: string;
    email: string;
    senha?: string;
    perfil?: Perfil;
    status?: string;
    funcaoSetor?: string;
}

export interface ICreateUserResponse {
    id: string;
    nome: string;
    email: string;
    perfil: Perfil;
    status: string;
    funcaoSetor?: string | null;
    createdAt: Date;
}

export interface IUpdateUserRequest {
    nome?: string;
    email?: string;
    senha?: string;
    perfil?: Perfil;
    status?: string;
    funcaoSetor?: string;
}

export interface IUserResponse {
    id: string;
    nome: string;
    email: string;
    perfil: Perfil;
    status: string;
    funcaoSetor?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
