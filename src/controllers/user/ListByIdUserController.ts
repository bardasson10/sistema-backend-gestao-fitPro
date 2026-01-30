import { Request, Response } from "express";
import { ListByIdUserService } from "../../services/user/ListByIdUserService";


class ListByIdUserController {
    async handle(req: Request, res: Response) {
        
        const userId  = req.params.id as string || req.userId;
        
        const listByIdUserService = new ListByIdUserService();

        try {
            const user = await listByIdUserService.execute(userId);
            return res.json(user);
        }
        
        catch(err: any){
            return res.status(404).json({ error: err.message });
        }
        
    }
}

export { ListByIdUserController };