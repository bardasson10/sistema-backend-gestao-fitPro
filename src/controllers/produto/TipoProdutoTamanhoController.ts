import { Request, Response } from "express";
import { CreateTipoProdutoTamanhoService, ListTipoProdutoTamanhoService, DeleteTipoProdutoTamanhoService } from "../../services/produto/TipoProdutoTamanhoService";

class CreateTipoProdutoTamanhoController {
    async handle(req: Request, res: Response) {
        const { tipoProdutoId, tamanhoId } = req.body;
        const tipoProdutoTamanho = await new CreateTipoProdutoTamanhoService().execute({
            tipoProdutoId,
            tamanhoId
        });
        return res.status(201).json(tipoProdutoTamanho);
    }
}

class ListTipoProdutoTamanhoController {
    async handle(req: Request, res: Response) {
        const { tipoProdutoId } = req.params;
        const tamanhos = await new ListTipoProdutoTamanhoService().execute(tipoProdutoId);
        return res.json(tamanhos);
    }
}

class DeleteTipoProdutoTamanhoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteTipoProdutoTamanhoService().execute(id);
        return res.json(result);
    }
}

export { CreateTipoProdutoTamanhoController, ListTipoProdutoTamanhoController, DeleteTipoProdutoTamanhoController };
