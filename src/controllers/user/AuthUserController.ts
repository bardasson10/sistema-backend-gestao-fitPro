import { Request, Response } from "express";
import { AuthenticateUserService } from "../../services/user/AuthenticateUserService";

class AuthenticateUserController {
    async handle(req: Request, res: Response) {
        const { email, senha } = req.body;
        
        const authenticateService = new AuthenticateUserService();

        const session = await authenticateService.execute({ email, senha });

        return res.json(session);
    }
}

export { AuthenticateUserController };