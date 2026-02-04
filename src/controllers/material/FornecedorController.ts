import { Request, Response } from "express";
import { CreateFornecedorService, ListAllFornecedorService, ListByIdFornecedorService, UpdateFornecedorService, DeleteFornecedorService } from "../../services/material/FornecedorService";

class CreateFornecedorController {
    async handle(req: Request, res: Response) {
        const { nome, tipo, contato } = req.body;
        const fornecedor = await new CreateFornecedorService().execute({
            nome,
            tipo,
            contato
        });
        return res.status(201).json(fornecedor);
    }
}

class ListAllFornecedorController {
    async handle(req: Request, res: Response) {
        const { page, limit } = req.query;
        const fornecedores = await new ListAllFornecedorService().execute(page as string | number | undefined, limit as string | number | undefined);
        return res.json(fornecedores);
    }
}

class ListByIdFornecedorController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const fornecedor = await new ListByIdFornecedorService().execute(id);
        return res.json(fornecedor);
    }
}

class UpdateFornecedorController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const { nome, tipo, contato } = req.body;
        const fornecedor = await new UpdateFornecedorService().execute(id, {
            nome,
            tipo,
            contato
        });
        return res.json(fornecedor);
    }
}

class DeleteFornecedorController {
    async handle(req: Request, res: Response) {
        const id = req.params.id as string 
        const result = await new DeleteFornecedorService().execute(id);
        return res.json(result);
    }
}

export { CreateFornecedorController, ListAllFornecedorController, ListByIdFornecedorController, UpdateFornecedorController, DeleteFornecedorController };
