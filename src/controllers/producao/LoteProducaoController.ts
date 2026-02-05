import { Request, Response } from "express";
import { CreateLoteProducaoService, ListAllLoteProducaoService, ListByIdLoteProducaoService, UpdateLoteProducaoService, AddLoteItemsService, DeleteLoteProducaoService } from "../../services/producao/LoteProducaoService";

class CreateLoteProducaoController {
    async handle(req: Request, res: Response) {
        const { codigoLote, tecidoId, responsavelId, status, observacao, items } = req.body;
        const lote = await new CreateLoteProducaoService().execute({
            codigoLote,
            tecidoId,
            responsavelId,
            status,
            observacao,
            items
        });
        return res.status(201).json(lote);
    }
}

class ListAllLoteProducaoController {
    async handle(req: Request, res: Response) {
        const { status, responsavelId, page, limit } = req.query;
        const lotes = await new ListAllLoteProducaoService().execute(status as string, responsavelId as string, page as string | number | undefined, limit as string);
        return res.json(lotes);
    }
}

class ListByIdLoteProducaoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const lote = await new ListByIdLoteProducaoService().execute(id);
        return res.json(lote);
    }
}

class UpdateLoteProducaoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const { status, observacao } = req.body;
        const lote = await new UpdateLoteProducaoService().execute(id, {
            status,
            observacao
        });
        return res.json(lote);
    }
}

class AddLoteItemsController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string
        const { items } = req.body;
        const lote = await new AddLoteItemsService().execute(id, { items });
        return res.json(lote);
    }
}

class DeleteLoteProducaoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteLoteProducaoService().execute(id);
        return res.json(result);
    }
}

export { CreateLoteProducaoController, ListAllLoteProducaoController, ListByIdLoteProducaoController, UpdateLoteProducaoController, AddLoteItemsController, DeleteLoteProducaoController };
