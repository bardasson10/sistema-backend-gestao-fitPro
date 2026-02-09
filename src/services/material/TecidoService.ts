import { ICreateTecidoRequest, IUpdateTecidoRequest } from "../../interfaces/IMaterial";
import { parsePaginationParams, createPaginatedResponse, PaginatedResponse } from "../../utils/pagination";
import prismaClient from "../../prisma";

class CreateTecidoService {
    async execute({ fornecedorId, corId, nome, codigoReferencia, rendimentoMetroKg, larguraMetros, valorPorKg, gramatura }: ICreateTecidoRequest) {
        // Verificar se fornecedor existe
        const fornecedor = await prismaClient.fornecedor.findUnique({
            where: { id: fornecedorId }
        });

        if (!fornecedor) {
            throw new Error("Fornecedor não encontrado.");
        }

        // Verificar se cor existe
        const cor = await prismaClient.cor.findUnique({
            where: { id: corId }
        });

        if (!cor) {
            throw new Error("Cor não encontrada.");
        }

        // Verificar se já existe tecido com este nome para o mesmo fornecedor
        const tecidoAlreadyExists = await prismaClient.tecido.findFirst({
            where: {
                codigoReferencia,
                fornecedorId
            }
        });

        if (tecidoAlreadyExists) {
            throw new Error("Tecido com este código de referência do tecido já existe para este fornecedor.");
        }

        const tecido = await prismaClient.tecido.create({
            data: {
                fornecedorId,
                corId,
                nome,
                codigoReferencia,
                rendimentoMetroKg,
                larguraMetros,
                valorPorKg,
                gramatura
            },
            include: {
                fornecedor: true,
                cor: true,
                rolos: true,
                lotes: true
            }
        });

        return tecido;
    }
}

class ListAllTecidoService {
    async execute(fornecedorId?: string, corId?: string, page?: number | string, limit?: number | string): Promise<PaginatedResponse<any>> {
        const { page: pageNumber, limit: pageLimit, skip } = parsePaginationParams(page, limit);

        const [tecidos, total] = await Promise.all([
            prismaClient.tecido.findMany({
                where: {
                    ...(fornecedorId && { fornecedorId }),
                    ...(corId && { corId })
                },
                include: {
                    fornecedor: true,
                    cor: true,
                    rolos: true,
                    lotes: true
                },
                skip,
                take: pageLimit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prismaClient.tecido.count({
                where: {
                    ...(fornecedorId && { fornecedorId }),
                    ...(corId && { corId })
                }
            })
        ]);

        return createPaginatedResponse(tecidos, total, pageNumber, pageLimit);
    }
}

class ListByIdTecidoService {
    async execute(id: string) {
        const tecido = await prismaClient.tecido.findUnique({
            where: { id },
            include: {
                fornecedor: true,
                cor: true,
                rolos: true,
                lotes: true
            }
        });

        if (!tecido) {
            throw new Error("Tecido não encontrado.");
        }

        return tecido;
    }
}

class UpdateTecidoService {
    async execute(id: string, data: IUpdateTecidoRequest) {
        const tecido = await prismaClient.tecido.findUnique({
            where: { id }
        });

        if (!tecido) {
            throw new Error("Tecido não encontrado.");
        }

        // Validar fornecedor se for enviado
        if (data.fornecedorId) {
            const fornecedor = await prismaClient.fornecedor.findUnique({
                where: { id: data.fornecedorId }
            });

            if (!fornecedor) {
                throw new Error("Fornecedor não encontrado.");
            }
        }

        // Validar cor se for enviada
        if (data.corId) {
            const cor = await prismaClient.cor.findUnique({
                where: { id: data.corId }
            });

            if (!cor) {
                throw new Error("Cor não encontrada.");
            }
        }

        const tecidoAtualizado = await prismaClient.tecido.update({
            where: { id },
            data,
            include: {
                fornecedor: true,
                cor: true,
                rolos: true,
                lotes: true
            }
        });

        return tecidoAtualizado;
    }
}

class DeleteTecidoService {
    async execute(id: string) {
        const tecido = await prismaClient.tecido.findUnique({
            where: { id },
            include: {
                rolos: true,
                lotes: true
            }
        });

        if (!tecido) {
            throw new Error("Tecido não encontrado.");
        }

        if (tecido.rolos.length > 0 || tecido.lotes.length > 0) {
            throw new Error("Não é possível deletar um tecido que possui rolos ou lotes associados.");
        }

        await prismaClient.tecido.delete({
            where: { id }
        });

        return { message: "Tecido deletado com sucesso." };
    }
}

export { CreateTecidoService, ListAllTecidoService, ListByIdTecidoService, UpdateTecidoService, DeleteTecidoService };
