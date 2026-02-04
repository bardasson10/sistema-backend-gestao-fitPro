import { Request, Response } from "express";
import { CreateTecidoService, ListAllTecidoService, ListByIdTecidoService, UpdateTecidoService, DeleteTecidoService } from "../../services/material/TecidoService";

class CreateTecidoController {
    async handle(req: Request, res: Response) {
        const { fornecedorId, corId, nome, codigoReferencia, rendimentoMetroKg, larguraMetros, valorPorKg, gramatura } = req.body;
        const tecido = await new CreateTecidoService().execute({
            fornecedorId,
            corId,
            nome,
            codigoReferencia,
            rendimentoMetroKg,
            larguraMetros,
            valorPorKg,
            gramatura
        });
        return res.status(201).json(tecido);
    }
}

class ListAllTecidoController {
    async handle(req: Request, res: Response) {
        const { fornecedorId, corId, page, limit } = req.query;
        const tecidos = await new ListAllTecidoService().execute(fornecedorId as string, corId as string, page as string | number | undefined, limit as string | number | undefined);
        return res.json(tecidos);
    }
}

class ListByIdTecidoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const tecido = await new ListByIdTecidoService().execute(id);
        return res.json(tecido);
    }
}

class UpdateTecidoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const { fornecedorId, corId, nome, codigoReferencia, rendimentoMetroKg, larguraMetros, valorPorKg, gramatura } = req.body;
        const tecido = await new UpdateTecidoService().execute(id, {
            fornecedorId,
            corId,
            nome,
            codigoReferencia,
            rendimentoMetroKg,
            larguraMetros,
            valorPorKg,
            gramatura
        });
        return res.json(tecido);
    }
}

class DeleteTecidoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteTecidoService().execute(id);
        return res.json(result);
    }
}

export { CreateTecidoController, ListAllTecidoController, ListByIdTecidoController, UpdateTecidoController, DeleteTecidoController };
