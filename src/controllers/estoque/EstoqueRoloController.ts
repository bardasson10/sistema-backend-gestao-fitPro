import { Request, Response } from "express";
import { CreateEstoqueRoloService, ListAllEstoqueRoloService, ListByIdEstoqueRoloService, UpdateEstoqueRoloService, DeleteEstoqueRoloService, GetRelatorioEstoqueService } from "../../services/estoque/EstoqueRoloService";

class CreateEstoqueRoloController {
    async handle(req: Request, res: Response) {
        const { tecidoId, codigoBarraRolo, pesoInicialKg, pesoAtualKg, situacao } = req.body;
        const rolo = await new CreateEstoqueRoloService().execute({
            tecidoId,
            codigoBarraRolo,
            pesoInicialKg,
            pesoAtualKg,
            situacao
        });
        return res.status(201).json(rolo);
    }
}

class ListAllEstoqueRoloController {
    async handle(req: Request, res: Response) {
        const { tecidoId, situacao } = req.query;
        const rolos = await new ListAllEstoqueRoloService().execute(tecidoId as string, situacao as string);
        return res.json(rolos);
    }
}

class ListByIdEstoqueRoloController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const rolo = await new ListByIdEstoqueRoloService().execute(id);
        return res.json(rolo);
    }
}

class UpdateEstoqueRoloController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const { pesoAtualKg, situacao } = req.body;
        const rolo = await new UpdateEstoqueRoloService().execute(id, {
            pesoAtualKg,
            situacao
        });
        return res.json(rolo);
    }
}

class DeleteEstoqueRoloController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteEstoqueRoloService().execute(id);
        return res.json(result);
    }
}

class GetRelatorioEstoqueController {
    async handle(_: Request, res: Response) {
        const relatorio = await new GetRelatorioEstoqueService().execute();
        return res.json(relatorio);
    }
}

export { CreateEstoqueRoloController, ListAllEstoqueRoloController, ListByIdEstoqueRoloController, UpdateEstoqueRoloController, DeleteEstoqueRoloController, GetRelatorioEstoqueController };
