import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import { router } from './route';
import  'dotenv/config';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swaggerConfig';

const app = express();

app.use(express.json());
app.use(cors());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'FitPro API Documentation'
}));

app.use(router);

app.use((error: Error, _: Request, res: Response, _next: NextFunction) => {
    if (error instanceof Error) {
        return res.status(400).json({
            error: error.message
        });
    }
    return res.status(500).json({
        status: "error",
        message: "Internal Server Error"
    });
});
const PORT = process.env.PORT! || 3333;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
