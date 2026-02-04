import { Request, Response } from "express";
import { CreateCorService, ListAllCorService, ListByIdCorService, UpdateCorService, DeleteCorService } from "../../services/material/CorService";

class CreateCorController {
    async handle(req: Request, res: Response) {
        const { nome, codigoHex } = req.body;
        const cor = await new CreateCorService().execute({
            nome,
            codigoHex
        });
        return res.status(201).json(cor);
    }
}

class ListAllCorController {
    async handle(req: Request, res: Response) {
        const { page, limit } = req.query;
        const cores = await new ListAllCorService().execute(page as string | number | undefined, limit as string | number | undefined);
        return res.json(cores);
    }
}

class ListByIdCorController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const cor = await new ListByIdCorService().execute(id);
        return res.json(cor);
    }
}

class UpdateCorController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const { nome, codigoHex } = req.body;
        const cor = await new UpdateCorService().execute(id, {
            nome,
            codigoHex
        });
        return res.json(cor);
    }
}

class DeleteCorController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteCorService().execute(id);
        return res.json(result);
    }
}

export { CreateCorController, ListAllCorController, ListByIdCorController, UpdateCorController, DeleteCorController };
