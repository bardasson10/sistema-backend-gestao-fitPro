import { Request, Response } from "express";
import { ListAllUserService } from "../../services/user/listAllUserService";

class ListAllUserController {
    async handle(_: Request, res: Response) {
        
        const users = await new ListAllUserService().execute();
        
        res.json(users);
    }
}

export { ListAllUserController };