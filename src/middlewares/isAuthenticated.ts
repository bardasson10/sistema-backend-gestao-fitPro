import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface Payload {
    sub: string;
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {

    const authToken= req.headers.authorization;
    
    if (!authToken) {
        return res.status(401).json({ 
            error: 'Token não fornecido' 
        });
    }

    const[, token] = authToken.split(" ");

    try{

        const { sub } = jwt.verify(token!, process.env.JWT_SECRET as string) as Payload;
        
        req.userId = sub;


    }catch(err){
        
        return res.status(401).json({
            error: 'Token inválido'
        });

    }

    return next();

}
