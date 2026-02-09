import { Request, Response } from "express";
import { UpdateUserService } from "../../services/user/UpdateUserService";

class UpdateUserController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string;
        const { nome, email, senha, perfil, status, funcaoSetor } = req.body;
        const user = await new UpdateUserService().execute(id, { nome, email, senha, perfil, status, funcaoSetor });
        return res.json(user);
    }
}

export { UpdateUserController };
