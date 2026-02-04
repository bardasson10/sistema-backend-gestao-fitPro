import { Request, Response } from "express";
import { CreateTamanhoService, ListAllTamanhoService, ListByIdTamanhoService, UpdateTamanhoService, DeleteTamanhoService } from "../../services/produto/TamanhoService";

class CreateTamanhoController {
    async handle(req: Request, res: Response) {
        const { nome, ordem } = req.body;
        const tamanho = await new CreateTamanhoService().execute({ nome, ordem });
        return res.status(201).json(tamanho);
    }
}

class ListAllTamanhoController {
    async handle(req: Request, res: Response) {
        const { page, limit } = req.query;
        const tamanhos = await new ListAllTamanhoService().execute(page as string | number | undefined, limit as string);
        return res.json(tamanhos);
    }
}

class ListByIdTamanhoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const tamanho = await new ListByIdTamanhoService().execute(id);
        return res.json(tamanho);
    }
}

class UpdateTamanhoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const { nome, ordem } = req.body;
        const tamanho = await new UpdateTamanhoService().execute(id, { nome, ordem });
        return res.json(tamanho);
    }
}

class DeleteTamanhoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteTamanhoService().execute(id);
        return res.json(result);
    }
}

export { CreateTamanhoController, ListAllTamanhoController, ListByIdTamanhoController, UpdateTamanhoController, DeleteTamanhoController };
