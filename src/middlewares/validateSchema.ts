import { ZodType, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

export const validateSchema =
    (schemas: ZodType) => async (req: Request, res: Response, next: NextFunction) => {

        try {
            await schemas.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (err) {

            if (err instanceof ZodError) {
                return res.status(400).json({
                    message: "Validation failed",
                    details: err.issues.map(issue => ({
                        mensage: issue.message
                    }))
                });
            }

            return res.status(500).json({
                message: "Internal server error"
            });
        }
    };