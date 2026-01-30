import { Request, Response, NextFunction } from "express";
import prismaClient from "../prisma";


export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {

    const userId = req.userId;

    if (!userId) {
        res.status(401).json({
            error: "Usuário não autenticado"
        });
        return;
    }

    const user = await prismaClient.usuario.findUnique({
        where: { id: userId }
    });

    if (user!.perfil !== "ADM") {
        res.status(401).json({ error: "Usuário não tem permissão" });
        return;
    }

    next();
}