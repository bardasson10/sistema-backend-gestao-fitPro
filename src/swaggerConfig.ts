import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registerUserRoutes } from './docs/userDocs';
import { registerProdutoRoutes } from './docs/produtoDocs';
import { registerMaterialRoutes } from './docs/materialDocs';
import { registerEstoqueRoutes } from './docs/estoqueDocs';
import { registerProducaoRoutes } from './docs/producaoDocs';

const registry = new OpenAPIRegistry();

// Registrar componente de segurança Bearer Auth
registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Token JWT obtido através do endpoint /session'
});

// Registrar todas as rotas dos módulos
registerUserRoutes(registry);
registerProdutoRoutes(registry);
registerMaterialRoutes(registry);
registerEstoqueRoutes(registry);
registerProducaoRoutes(registry);

// Gerar documentação
const generator = new OpenApiGeneratorV3(registry.definitions);

export const swaggerSpec = generator.generateDocument({
    openapi: '3.0.0',
    info: {
        title: 'FitPro - Sistema de Gestão de Produção Têxtil',
        version: '1.0.0',
        description: 'API REST para gestão de produção de confecção têxtil - controle de produtos, materiais, estoque e produção.',
        contact: {
            name: 'FitPro Team',
            email: 'contato@fitpro.com'
        }
    },
    servers: [
        {
            url: 'http://localhost:3333',
            description: 'local development server'
        },
        {
            url: 'https://sistema-backend-gestao-fitpro.onrender.com',
            description: 'development server'
        },
        {
            url: 'https://bienjoli.tech',
            description: 'production server'
        }
    ],
    tags: [
        { name: 'Autenticação', description: 'Endpoints de autenticação e gestão de usuários' },
        { name: 'Produtos', description: 'Gestão de tipos de produto, tamanhos e produtos' },
        { name: 'Materiais', description: 'Gestão de fornecedores, cores e tecidos' },
        { name: 'Estoque', description: 'Controle de rolos de tecido e movimentações' },
        { name: 'Produção - Facções', description: 'Cadastro e gestão das facções parceiras' },
        { name: 'Produção - Lotes', description: 'Fluxo de lotes de produção e estoque de corte por lote' },
        { name: 'Produção - Direcionamentos', description: 'Remessas para facções a partir do estoque de corte' },
        { name: 'Produção - Conferências', description: 'Conferência de retorno e qualidade das remessas' }
    ]
});
