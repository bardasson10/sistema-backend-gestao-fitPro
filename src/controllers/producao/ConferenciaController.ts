import { Request, Response } from "express";
import { CreateConferenciaService, ListAllConferenciaService, ListByIdConferenciaService, UpdateConferenciaService, DeleteConferenciaService, GetRelatorioProdutividadeService } from "../../services/producao/ConferenciaService";

class CreateConferenciaController {
    async handle(req: Request, res: Response) {
        const { direcionamentoId, responsavelId, dataConferencia, statusQualidade, observacao, items } = req.body;
        const conferencia = await new CreateConferenciaService().execute({
            direcionamentoId,
            responsavelId,
            dataConferencia,
            statusQualidade,
            observacao,
            items
        });
        return res.status(201).json(conferencia);
    }
}

class ListAllConferenciaController {
    async handle(req: Request, res: Response) {
        const { statusQualidade, liberadoPagamento } = req.query;
        const conferencias = await new ListAllConferenciaService().execute(
            statusQualidade as string,
            liberadoPagamento === "true"
        );
        return res.json(conferencias);
    }
}

class ListByIdConferenciaController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const conferencia = await new ListByIdConferenciaService().execute(id);
        return res.json(conferencia);
    }
}

class UpdateConferenciaController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const { dataConferencia, statusQualidade, liberadoPagamento, observacao } = req.body;
        const conferencia = await new UpdateConferenciaService().execute(id, {
            dataConferencia,
            statusQualidade,
            liberadoPagamento,
            observacao
        });
        return res.json(conferencia);
    }
}

class DeleteConferenciaController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteConferenciaService().execute(id);
        return res.json(result);
    }
}

class GetRelatorioProdutividadeController {
    async handle(req: Request, res: Response) {
        const { dataInicio, dataFim } = req.query;
        const relatorio = await new GetRelatorioProdutividadeService().execute(
            dataInicio as string,
            dataFim as string
        );
        return res.json(relatorio);
    }
}

export { CreateConferenciaController, ListAllConferenciaController, ListByIdConferenciaController, UpdateConferenciaController, DeleteConferenciaController, GetRelatorioProdutividadeController };
