import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prismaClient from '../prisma';

interface Payload {
    sub: string;
}

export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {

    const authToken= req.headers.authorization;
    
    if (!authToken) {
        return res.status(401).json({ 
            error: 'Token não fornecido' 
        });
    }

    const[, token] = authToken.split(" ");

    try{

        const { sub } = jwt.verify(token!, process.env.JWT_SECRET as string) as Payload;
        
        // Verificar se a sessão está ativa no banco
        const sessao = await prismaClient.sessao.findFirst({
            where: {
                token: token,
                usuarioId: sub,
                ativo: true,
                expiresAt: {
                    gte: new Date()
                }
            }
        });

        if (!sessao) {
            return res.status(401).json({
                error: 'Sessão inválida ou expirada. Faça login novamente.'
            });
        }

        req.userId = sub;


    }catch(err){
        
        return res.status(401).json({
            error: 'Token inválido'
        });

    }

    return next();

}
