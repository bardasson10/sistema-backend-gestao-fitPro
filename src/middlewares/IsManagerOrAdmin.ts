import { Request, Response, NextFunction } from "express";
import prismaClient from "../prisma";

export const isManagerOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({
            error: "Usuario nao autenticado"
        });
        return;
    }

    const user = await prismaClient.usuario.findUnique({
        where: { id: userId },
        select: { perfil: true }
    });

    if (!user || (user.perfil !== "ADM" && user.perfil !== "GERENTE")) {
        res.status(403).json({
            error: "Usuario nao tem permissao"
        });
        return;
    }

    next();
};
