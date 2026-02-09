import { Request, Response } from "express";
import { ListAllUserService } from "../../services/user/ListAllUserService";
import { Perfil } from "../../generated/prisma/enums";


class ListAllUserController {
    async handle(req: Request, res: Response) {
        const { excludeUserId,userPerfil, page, limit } = req.query;
        const users = await new ListAllUserService().execute({  
            page: page as string | undefined, 
            limit: limit as string | undefined, 
            excludeUserId: excludeUserId as string | undefined, 
            userPerfil: userPerfil as Perfil });
        return res.json(users);
    }
}

export { ListAllUserController };