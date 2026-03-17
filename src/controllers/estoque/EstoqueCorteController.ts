import { Request, Response } from "express";
import { AjusteEstoqueCorteService, ListAllEstoqueCorteService, ListByIdEstoqueCorteService } from "../../services/estoque/EstoqueCorteService";

class ListAllEstoqueCorteController {
    async handle(req: Request, res: Response) {
        const { produtoId, loteProducaoId, tamanhoId } = req.query;

        const estoque = await new ListAllEstoqueCorteService().execute(
            produtoId as string | undefined,
            loteProducaoId as string | undefined,
            tamanhoId as string | undefined
        );

        return res.json(estoque);
    }
}

class ListByIdEstoqueCorteController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string;
        const item = await new ListByIdEstoqueCorteService().execute(id);
        return res.json(item);
    }
}

class AjusteEstoqueCorteController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string;
        const { novaQuantidade, motivo } = req.body;

        const item = await new AjusteEstoqueCorteService().execute(id, novaQuantidade, motivo, req.userId);
        return res.json(item);
    }
}

export { ListAllEstoqueCorteController, ListByIdEstoqueCorteController, AjusteEstoqueCorteController };
