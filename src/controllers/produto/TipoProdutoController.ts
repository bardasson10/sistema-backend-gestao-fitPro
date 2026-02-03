import { Request, Response } from "express";
import { CreateTipoProdutoService, ListAllTipoProdutoService, ListByIdTipoProdutoService, UpdateTipoProdutoService, DeleteTipoProdutoService } from "../../services/produto/TipoProdutoService";

class CreateTipoProdutoController {
    async handle(req: Request, res: Response) {
        const { nome } = req.body;
        const tipoProduto = await new CreateTipoProdutoService().execute({ nome });
        return res.status(201).json(tipoProduto);
    }
}

class ListAllTipoProdutoController {
    async handle(req: Request, res: Response) {
        const tiposProduto = await new ListAllTipoProdutoService().execute();
        return res.json(tiposProduto);
    }
}

class ListByIdTipoProdutoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const tipoProduto = await new ListByIdTipoProdutoService().execute(id);
        return res.json(tipoProduto);
    }
}

class UpdateTipoProdutoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const { nome } = req.body;
        const tipoProduto = await new UpdateTipoProdutoService().execute(id, { nome });
        return res.json(tipoProduto);
    }
}

class DeleteTipoProdutoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteTipoProdutoService().execute(id);
        return res.json(result);
    }
}

export { CreateTipoProdutoController, ListAllTipoProdutoController, ListByIdTipoProdutoController, UpdateTipoProdutoController, DeleteTipoProdutoController };
