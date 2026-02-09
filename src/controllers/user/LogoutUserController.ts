import { Request, Response } from "express";
import { LogoutUserService } from "../../services/user/LogoutUserService";

class LogoutUserController {
    async handle(req: Request, res: Response) {
        const authToken = req.headers.authorization;
        const usuarioId = req.userId;

        if (!authToken) {
            return res.status(401).json({ error: "Token não fornecido" });
        }

        const [, token] = authToken.split(" ");

        const logoutService = new LogoutUserService();
        const result = await logoutService.execute(token, usuarioId);

        return res.json(result);
    }
}

export { LogoutUserController };
