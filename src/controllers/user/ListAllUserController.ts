import { Request, Response } from "express";
import { ListAllUserService } from "../../services/user/listAllUserService";

class ListAllUserController {
    async handle(req: Request, res: Response) {
        const { page, limit } = req.query;
        const users = await new ListAllUserService().execute(page, limit);
        return res.json(users);
    }
}

export { ListAllUserController };