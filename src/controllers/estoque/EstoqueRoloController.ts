import { Request, Response } from "express";
import { CreateEstoqueRoloService, ListAllEstoqueRoloService, ListByIdEstoqueRoloService, UpdateEstoqueRoloService, DeleteEstoqueRoloService, GetRelatorioEstoqueService } from "../../services/estoque/EstoqueRoloService";

class CreateEstoqueRoloController {
    async handle(req: Request, res: Response) {
        const { tecidoId, prefixo, dataLote, rolos, situacao } = req.body;
        const usuarioId = req.userId; // Pega o ID do usuário autenticado
        
        const resultado = await new CreateEstoqueRoloService().execute({
            tecidoId,
            prefixo,
            dataLote,
            rolos,
            situacao,
            usuarioId
        });

        return res.status(201).json(resultado);
    }
}

class ListAllEstoqueRoloController {
    async handle(req: Request, res: Response) {
        const { tecidoId, situacao, page, limit } = req.query;
        const rolos = await new ListAllEstoqueRoloService().execute(tecidoId as string, situacao as string, page as string | number | undefined, limit as string);
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
        const usuarioId = req.userId;
        const rolo = await new UpdateEstoqueRoloService().execute(id, {
            pesoAtualKg,
            situacao,
            usuarioId
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
