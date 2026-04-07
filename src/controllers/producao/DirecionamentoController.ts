import { Request, Response } from "express";
import {
    CreateDirecionamentoService,
    ListAllDirecionamentoService,
    ListByIdDirecionamentoService,
    UpdateDirecionamentoService,
    UpdateDirecionamentoStatusService,
    UpdateDirecionamentoSkuPriceService,
    DeleteDirecionamentoService
} from "../../services/producao/DirecionamentoService";
import { ListarGradesSobraService } from "../../services/producao/ListarGradesSobraService";

class CreateDirecionamentoController {
    async handle(req: Request, res: Response) {
        const { direcionamentos } = req.body;
        const direcionamento = await new CreateDirecionamentoService().execute({
            direcionamentos
        });
        return res.status(201).json(direcionamento);
    }
}

class ListAllDirecionamentoController {
    async handle(req: Request, res: Response) {
        const { status, faccaoId, page, limit } = req.query;
        const direcionamentos = await new ListAllDirecionamentoService().execute(
            status as string | string[] | undefined,
            faccaoId as string | string[] | undefined,
            page as string | number | undefined,
            limit as string | number | undefined
        );
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
        const id = req.params.id as string;
        const { direcionamentos } = req.body;
        const direcionamento = await new UpdateDirecionamentoService().execute(id, {
            direcionamentos
        });
        return res.json(direcionamento);
    }
}

class UpdateDirecionamentoStatusController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string;
        const { status } = req.body;
        const direcionamento = await new UpdateDirecionamentoStatusService().execute(id, {
            status
        });
        return res.json(direcionamento);
    }
}

class UpdateDirecionamentoSkuPriceController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string;
        const { produtoSKU } = req.body;
        const direcionamento = await new UpdateDirecionamentoSkuPriceService().execute(id, {
            produtoSKU
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

class ListarGradesSobraController {
    async handle(req: Request, res: Response) {
        const loteProducaoId = req.params.loteId as string;
        const sobras = await new ListarGradesSobraService().execute(loteProducaoId);
        return res.json(sobras);
    }
}

class ListRemessasProntasController {
    async handle(req: Request, res: Response) {
        const { page, limit } = req.query;
        // Remessas prontas sao status entregue e sem conferencia em andamento/finalizada.
        const remessas = await new ListAllDirecionamentoService().execute(
            "entregue",
            undefined,
            page as string | number | undefined,
            limit as string | number | undefined,
            true
        );
        return res.json(remessas);
    }
}

export {
    CreateDirecionamentoController,
    ListAllDirecionamentoController,
    ListByIdDirecionamentoController,
    UpdateDirecionamentoController,
    UpdateDirecionamentoStatusController,
    UpdateDirecionamentoSkuPriceController,
    DeleteDirecionamentoController,
    ListarGradesSobraController,
    ListRemessasProntasController
};
