import { Request, Response } from "express";
import { CreateMovimentacaoEstoqueService, ListAllMovimentacaoEstoqueService, ListByIdMovimentacaoEstoqueService, GetHistoricoRoloService } from "../../services/estoque/MovimentacaoEstoqueService";

class CreateMovimentacaoEstoqueController {
    async handle(req: Request, res: Response) {
        const { estoqueRoloId, tipoMovimentacao, pesoMovimentado } = req.body;
        const usuarioId = req.userId;

        const movimentacao = await new CreateMovimentacaoEstoqueService().execute(usuarioId!, {
            estoqueRoloId,
            tipoMovimentacao,
            pesoMovimentado
        });
        return res.status(201).json(movimentacao);
    }
}

class ListAllMovimentacaoEstoqueController {
    async handle(req: Request, res: Response) {
        const { estoqueRoloId, tipoMovimentacao, dataInicio, dataFim } = req.query;
        const movimentacoes = await new ListAllMovimentacaoEstoqueService().execute(
            estoqueRoloId as string,
            tipoMovimentacao as string,
            dataInicio as string,
            dataFim as string
        );
        return res.json(movimentacoes);
    }
}

class ListByIdMovimentacaoEstoqueController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const movimentacao = await new ListByIdMovimentacaoEstoqueService().execute(id);
        return res.json(movimentacao);
    }
}

class GetHistoricoRoloController {
    async handle(req: Request, res: Response) {
        const estoqueRoloId = req.params.estoqueRoloId as string;
        const historico = await new GetHistoricoRoloService().execute(estoqueRoloId);
        return res.json(historico);
    }
}

export { CreateMovimentacaoEstoqueController, ListAllMovimentacaoEstoqueController, ListByIdMovimentacaoEstoqueController, GetHistoricoRoloController };
