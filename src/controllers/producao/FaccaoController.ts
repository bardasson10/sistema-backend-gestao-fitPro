import { Request, Response } from "express";
import { CreateFaccaoService, ListAllFaccaoService, ListByIdFaccaoService, UpdateFaccaoService, DeleteFaccaoService } from "../../services/producao/FaccaoService";

class CreateFaccaoController {
    async handle(req: Request, res: Response) {
        const { nome, responsavel, contato, prazoMedioDias, status } = req.body;
        const faccao = await new CreateFaccaoService().execute({
            nome,
            responsavel,
            contato,
            prazoMedioDias,
            status
        });
        return res.status(201).json(faccao);
    }
}

class ListAllFaccaoController {
    async handle(req: Request, res: Response) {
        const { status } = req.query;
        const faccoes = await new ListAllFaccaoService().execute(status as string);
        return res.json(faccoes);
    }
}

class ListByIdFaccaoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const faccao = await new ListByIdFaccaoService().execute(id);
        return res.json(faccao);
    }
}

class UpdateFaccaoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const { nome, responsavel, contato, prazoMedioDias, status } = req.body;
        const faccao = await new UpdateFaccaoService().execute(id, {
            nome,
            responsavel,
            contato,
            prazoMedioDias,
            status
        });
        return res.json(faccao);
    }
}

class DeleteFaccaoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteFaccaoService().execute(id);
        return res.json(result);
    }
}

export { CreateFaccaoController, ListAllFaccaoController, ListByIdFaccaoController, UpdateFaccaoController, DeleteFaccaoController };
