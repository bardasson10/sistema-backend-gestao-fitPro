import { Request, Response } from "express";
import { CreateDirecionamentoService, ListAllDirecionamentoService, ListByIdDirecionamentoService, UpdateDirecionamentoService, DeleteDirecionamentoService } from "../../services/producao/DirecionamentoService";

class CreateDirecionamentoController {
    async handle(req: Request, res: Response) {
        const { loteProducaoId, faccaoId, tipoServico } = req.body;
        const direcionamento = await new CreateDirecionamentoService().execute({
            loteProducaoId,
            faccaoId,
            tipoServico
        });
        return res.status(201).json(direcionamento);
    }
}

class ListAllDirecionamentoController {
    async handle(req: Request, res: Response) {
        const { status, faccaoId, page, limit } = req.query;
        const direcionamentos = await new ListAllDirecionamentoService().execute(status as string, faccaoId as string, page as string | number | undefined, limit as string | number | undefined);
        return res.json(direcionamentos);
    }
}

class ListByIdDirecionamentoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const direcionamento = await new ListByIdDirecionamentoService().execute(id);
        return res.json(direcionamento);
    }
}

class UpdateDirecionamentoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const { status, dataSaida, dataPrevisaoRetorno } = req.body;
        const direcionamento = await new UpdateDirecionamentoService().execute(id, {
            status,
            dataSaida,
            dataPrevisaoRetorno
        });
        return res.json(direcionamento);
    }
}

class DeleteDirecionamentoController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteDirecionamentoService().execute(id);
        return res.json(result);
    }
}

export { CreateDirecionamentoController, ListAllDirecionamentoController, ListByIdDirecionamentoController, UpdateDirecionamentoController, DeleteDirecionamentoController };
