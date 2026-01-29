import { Request, Response } from "express";
import { CreateUserService } from "../../services/user/CreateUserService";

class CreateUserController {
    async handle(req: Request, res: Response) {
        
        const {nome, email, senha, perfil, funcaoSetor} = req.body;

        const user = await new CreateUserService().execute({nome, email, senha, perfil, funcaoSetor});
        res.json(user);
    }
}

export { CreateUserController };