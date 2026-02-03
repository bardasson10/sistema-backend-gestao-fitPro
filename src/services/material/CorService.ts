import { ICreateCorRequest, IUpdateCorRequest } from "../../interfaces/IMaterial";
import prismaClient from "../../prisma";

class CreateCorService {
    async execute({ nome, codigoHex }: ICreateCorRequest) {
        const corAlreadyExists = await prismaClient.cor.findFirst({
            where: { nome }
        });

        if (corAlreadyExists) {
            throw new Error("Cor com este nome já existe.");
        }

        const cor = await prismaClient.cor.create({
            data: {
                nome,
                codigoHex
            },
            include: {
                tecidos: true
            }
        });

        return cor;
    }
}

class ListAllCorService {
    async execute() {
        const cores = await prismaClient.cor.findMany({
            include: {
                tecidos: true
            }
        });

        return cores;
    }
}

class ListByIdCorService {
    async execute(id: string) {
        const cor = await prismaClient.cor.findUnique({
            where: { id },
            include: {
                tecidos: true
            }
        });

        if (!cor) {
            throw new Error("Cor não encontrada.");
        }

        return cor;
    }
}

class UpdateCorService {
    async execute(id: string, { nome, codigoHex }: IUpdateCorRequest) {
        const cor = await prismaClient.cor.findUnique({
            where: { id }
        });

        if (!cor) {
            throw new Error("Cor não encontrada.");
        }

        if (nome) {
            const corDuplicada = await prismaClient.cor.findFirst({
                where: {
                    nome,
                    NOT: { id }
                }
            });

            if (corDuplicada) {
                throw new Error("Cor com este nome já existe.");
            }
        }

        const corAtualizada = await prismaClient.cor.update({
            where: { id },
            data: {
                nome,
                codigoHex
            },
            include: {
                tecidos: true
            }
        });

        return corAtualizada;
    }
}

class DeleteCorService {
    async execute(id: string) {
        const cor = await prismaClient.cor.findUnique({
            where: { id },
            include: {
                tecidos: true
            }
        });

        if (!cor) {
            throw new Error("Cor não encontrada.");
        }

        if (cor.tecidos.length > 0) {
            throw new Error("Não é possível deletar uma cor que possui tecidos associados.");
        }

        await prismaClient.cor.delete({
            where: { id }
        });

        return { message: "Cor deletada com sucesso." };
    }
}

export { CreateCorService, ListAllCorService, ListByIdCorService, UpdateCorService, DeleteCorService };
