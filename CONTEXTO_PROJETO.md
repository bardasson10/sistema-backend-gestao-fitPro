# 📋 Contexto do Projeto - Sistema Backend Gestão FitPro

**Versão**: 1.0.0  
**Data**: Fevereiro, 2026  
**Tipo**: Backend API REST  
**Stack**: Node.js + TypeScript + Express + PostgreSQL + Prisma

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Organização de Pastas](#organização-de-pastas)
4. [Dependências e Versões](#dependências-e-versões)
5. [Modelagem do Banco de Dados](#modelagem-do-banco-de-dados)
6. [Endpoints](#endpoints)
7. [Middlewares](#middlewares)
8. [Validação de Schema](#validação-de-schema)
9. [Fluxo de Requisição](#fluxo-de-requisição)

---

## 🎯 Visão Geral

Sistema de gestão de produção e controle de estoque para a indústria de confecção (FitPro). O sistema gerencia:

- **Usuários e Permissões**: Autenticação com JWT e controle de perfis (ADM, GERENTE, FUNCIONÁRIO)
- **Gestão de Produtos**: Cadastro de produtos com tipos, tamanhos e SKU
- **Controle de Estoque**: Gerenciamento de rolos de tecido e suas movimentações
- **Fluxo de Produção**: Lotes de produção, direcionamentos para facções e conferências de qualidade
- **Fornecedores e Materiais**: Cadastro de fornecedores, cores e tipos de tecidos

---

## 🏗️ Arquitetura

O projeto segue a arquitetura **MVC em 3 camadas** com separação clara de responsabilidades:

```
REQUISIÇÃO HTTP
    ↓
ROTAS (Router)
    ↓
MIDDLEWARES (Validação e Autenticação)
    ↓
CONTROLLER (Recebe a requisição)
    ↓
SERVICE (Lógica de negócio)
    ↓
PRISMA (Comunicação com banco de dados)
    ↓
POSTGRESQL (Banco de dados)
```

### Fluxo Detalhado:

1. **Rotas**: Define as endpoints e aplica middlewares
2. **Controller**: Extrai dados da requisição e chama o serviço apropriado
3. **Service**: Contém toda a lógica de negócio, validações e operações com banco de dados
4. **Prisma Client**: ORM que comunica com o PostgreSQL
5. **Banco de Dados**: Persistência dos dados

### Exemplo Prático - Criação de Usuário:

```
POST /users (com schema validado)
    ↓
validateSchema Middleware (validação com Zod)
    ↓
CreateUserController.handle()
    ↓
CreateUserService.execute()
    ↓
prismaClient.usuario.create()
    ↓
Response com dados do usuário criado
```

---

## 📁 Organização de Pastas

```
sistema-backend-gestao-fitPro/
├── src/
│   ├── controllers/
│   │   └── user/
│   │       ├── AuthUserController.ts       # Autenticação
│   │       ├── CreateUserController.ts     # Criação de usuários
│   │       ├── ListAllUserController.ts    # Listagem de todos
│   │       └── ListByIdUserController.ts   # Busca específica
│   │
│   ├── services/
│   │   └── user/
│   │       ├── AuthenticateUserService.ts  # Lógica de autenticação
│   │       ├── CreateUserService.ts        # Lógica de criação
│   │       ├── ListAllUserService.ts       # Lógica de listagem
│   │       └── ListByIdUserService.ts      # Lógica de busca
│   │
│   ├── middlewares/
│   │   ├── validateSchema.ts   # Validação de entrada com Zod
│   │   ├── isAuthenticated.ts  # Verificação de JWT
│   │   └── IsAdmin.ts          # Verificação de permissão ADM
│   │
│   ├── schemas/
│   │   └── userSchemas.ts      # Definição de schemas Zod
│   │
│   ├── interfaces/
│   │   ├── IUser.ts            # Interfaces para usuários
│   │   └── IAuthUser.ts        # Interfaces de autenticação
│   │
│   ├── @types/
│   │   └── express/
│   │       └── index.d.ts      # Extensões de tipos Express
│   │
│   ├── prisma/
│   │   └── index.ts            # Instância do Prisma Client
│   │
│   ├── route.ts                # Definição de rotas
│   └── server.ts               # Configuração Express
│
├── prisma/
│   ├── schema.prisma           # Modelo de dados
│   ├── migrations/             # Histórico de migrações
│   └── migration_lock.toml     # Lock de migrações
│
├── package.json                # Dependências
├── tsconfig.json               # Configuração TypeScript
├── prisma.config.ts            # Configuração Prisma
└── LICENSE
```

---

## 📦 Dependências e Versões

### Dependências de Produção

| Pacote | Versão | Propósito |
|--------|--------|----------|
| `express` | ^5.2.1 | Framework web |
| `@prisma/client` | ^7.3.0 | ORM para banco de dados |
| `@prisma/adapter-pg` | ^7.3.0 | Adapter PostgreSQL para Prisma |
| `pg` | ^8.17.2 | Driver PostgreSQL |
| `bcryptjs` | ^3.0.3 | Hash de senhas |
| `jsonwebtoken` | ^9.0.3 | Geração e validação de JWT |
| `zod` | ^4.3.6 | Validação de schema |
| `cors` | ^2.8.6 | CORS middleware |
| `dotenv` | ^17.2.3 | Variáveis de ambiente |
| `tsx` | ^4.21.0 | Executor TypeScript |
| `@types/node` | ^25.1.0 | Tipos Node.js |

### Dependências de Desenvolvimento

| Pacote | Versão | Propósito |
|--------|--------|----------|
| `typescript` | ^5.9.3 | Linguagem TypeScript |
| `prisma` | ^7.3.0 | Prisma CLI |
| `@types/express` | ^5.0.6 | Tipos Express |
| `@types/jsonwebtoken` | ^9.0.10 | Tipos JWT |
| `@types/cors` | ^2.8.19 | Tipos CORS |
| `@types/pg` | ^8.16.0 | Tipos PostgreSQL |

### Banco de Dados

- **PostgreSQL**: Banco relacional principal
- **Prisma**: ORM com migrations e geração de tipos

---

## 🗄️ Modelagem do Banco de Dados

### Diagrama de Entidades

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENUMS E TIPOS                                │
├─────────────────────────────────────────────────────────────────┤
│ Perfil: ADM, GERENTE, FUNCIONARIO                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 GESTÃO DE USUÁRIOS                              │
├─────────────────────────────────────────────────────────────────┤
│ usuario                                                         │
│ ├─ id (UUID, PK)                                               │
│ ├─ perfil (Enum: ADM, GERENTE, FUNCIONARIO)                   │
│ ├─ nome (String)                                               │
│ ├─ email (String, UNIQUE)                                      │
│ ├─ senha (String - Hash bcrypt)                                │
│ ├─ status (String, default: "ativo")                           │
│ ├─ funcaoSetor (String, nullable)                              │
│ ├─ createdAt (DateTime)                                        │
│ ├─ updatedAt (DateTime)                                        │
│ └─ Relacionamentos: movimentacoes, lotesResponsa, conferencias│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              CADASTROS BASE DE PRODUTOS                         │
├─────────────────────────────────────────────────────────────────┤
│ tipo_produto                                                    │
│ ├─ id (UUID, PK)                                               │
│ ├─ nome (String)                                               │
│ ├─ createdAt (DateTime)                                        │
│ └─ Relacionamentos: produtos, tamanhos                         │
│                                                                 │
│ produto                                                         │
│ ├─ id (UUID, PK)                                               │
│ ├─ tipoProdutoId (FK)                                          │
│ ├─ nome (String)                                               │
│ ├─ sku (String, UNIQUE)                                        │
│ ├─ fabricante (String, nullable)                               │
│ ├─ custoMedioPeca (Decimal(10,2), nullable)                    │
│ ├─ precoMedioVenda (Decimal(10,2), nullable)                   │
│ ├─ createdAt (DateTime)                                        │
│ ├─ updatedAt (DateTime)                                        │
│ └─ Relacionamentos: tipo, lotes                                │
│                                                                 │
│ tamanho                                                         │
│ ├─ id (UUID, PK)                                               │
│ ├─ nome (String)                                               │
│ ├─ ordem (Int)                                                 │
│ ├─ createdAt (DateTime)                                        │
│ └─ Relacionamentos: tiposAceitos, loteItems, conferenciaItems │
│                                                                 │
│ tipo_produto_tamanho                                            │
│ ├─ id (UUID, PK)                                               │
│ ├─ tipoProdutoId (FK)                                          │
│ ├─ tamanhoId (FK)                                              │
│ └─ UNIQUE(tipoProdutoId, tamanhoId)                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              GESTÃO DE MATERIAIS                                │
├─────────────────────────────────────────────────────────────────┤
│ fornecedor                                                      │
│ ├─ id (UUID, PK)                                               │
│ ├─ nome (String)                                               │
│ ├─ tipo (String, nullable)                                     │
│ ├─ contato (String, nullable)                                  │
│ ├─ createdAt (DateTime)                                        │
│ ├─ updatedAt (DateTime)                                        │
│ └─ Relacionamentos: tecidos                                    │
│                                                                 │
│ cor                                                             │
│ ├─ id (UUID, PK)                                               │
│ ├─ nome (String)                                               │
│ ├─ codigoHex (String, nullable)                                │
│ └─ Relacionamentos: tecidos                                    │
│                                                                 │
│ tecido                                                          │
│ ├─ id (UUID, PK)                                               │
│ ├─ fornecedorId (FK)                                           │
│ ├─ corId (FK)                                                  │
│ ├─ nome (String)                                               │
│ ├─ codigoReferencia (String, nullable)                         │
│ ├─ rendimentoMetroKg (Decimal(10,3), nullable)                 │
│ ├─ larguraMetros (Decimal(10,2), nullable)                     │
│ ├─ valorPorKg (Decimal(10,2), nullable)                        │
│ ├─ gramatura (Decimal(10,2), nullable)                         │
│ ├─ createdAt (DateTime)                                        │
│ ├─ updatedAt (DateTime)                                        │
│ └─ Relacionamentos: fornecedor, cor, rolos, lotes             │
│                                                                 │
│ estoque_rolo                                                    │
│ ├─ id (UUID, PK)                                               │
│ ├─ tecidoId (FK)                                               │
│ ├─ codigoBarraRolo (String, UNIQUE, nullable)                  │
│ ├─ pesoInicialKg (Decimal(10,3))                               │
│ ├─ pesoAtualKg (Decimal(10,3))                                 │
│ ├─ situacao (String, default: "disponivel")                    │
│ ├─ createdAt (DateTime)                                        │
│ ├─ updatedAt (DateTime)                                        │
│ └─ Relacionamentos: tecido, movimentacoes                      │
│                                                                 │
│ movimentacao_estoque                                            │
│ ├─ id (UUID, PK)                                               │
│ ├─ estoqueRoloId (FK)                                          │
│ ├─ usuarioId (FK)                                              │
│ ├─ tipoMovimentacao (String)                                   │
│ ├─ pesoMovimentado (Decimal(10,3), nullable)                   │
│ ├─ createdAt (DateTime)                                        │
│ └─ Relacionamentos: rolo, usuario                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              PARCEIROS (FACÇÕES)                                │
├─────────────────────────────────────────────────────────────────┤
│ faccao                                                          │
│ ├─ id (UUID, PK)                                               │
│ ├─ nome (String)                                               │
│ ├─ responsavel (String, nullable)                              │
│ ├─ contato (String, nullable)                                  │
│ ├─ prazoMedioDias (Int, nullable)                              │
│ ├─ status (String, default: "ativo")                           │
│ ├─ createdAt (DateTime)                                        │
│ ├─ updatedAt (DateTime)                                        │
│ └─ Relacionamentos: direcionamentos                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              FLUXO DE PRODUÇÃO                                  │
├─────────────────────────────────────────────────────────────────┤
│ lote_producao                                                   │
│ ├─ id (UUID, PK)                                               │
│ ├─ codigoLote (String, UNIQUE)                                 │
│ ├─ produtoId (FK)                                              │
│ ├─ tecidoId (FK)                                               │
│ ├─ responsavelId (FK → usuario)                                │
│ ├─ status (String)                                             │
│ ├─ observacao (String, nullable)                               │
│ ├─ createdAt (DateTime)                                        │
│ ├─ updatedAt (DateTime)                                        │
│ └─ Relacionamentos: produto, tecido, responsavel, items, direcionamentos│
│                                                                 │
│ lote_item                                                       │
│ ├─ id (UUID, PK)                                               │
│ ├─ loteProducaoId (FK)                                         │
│ ├─ tamanhoId (FK)                                              │
│ ├─ quantidadePlanejada (Int)                                   │
│ └─ Relacionamentos: lote, tamanho                              │
│                                                                 │
│ direcionamento                                                  │
│ ├─ id (UUID, PK)                                               │
│ ├─ loteProducaoId (FK)                                         │
│ ├─ faccaoId (FK)                                               │
│ ├─ tipoServico (String)                                        │
│ ├─ status (String, default: "enviado")                         │
│ ├─ dataSaida (Date, nullable)                                  │
│ ├─ dataPrevisaoRetorno (Date, nullable)                        │
│ ├─ createdAt (DateTime)                                        │
│ ├─ updatedAt (DateTime)                                        │
│ └─ Relacionamentos: lote, faccao, conferencias                 │
│                                                                 │
│ conferencia                                                     │
│ ├─ id (UUID, PK)                                               │
│ ├─ direcionamentoId (FK)                                       │
│ ├─ responsavelId (FK → usuario)                                │
│ ├─ dataConferencia (Date, nullable)                            │
│ ├─ observacao (String, nullable)                               │
│ ├─ liberadoPagamento (Boolean, default: false)                 │
│ ├─ statusQualidade (String, nullable)                          │
│ ├─ createdAt (DateTime)                                        │
│ ├─ updatedAt (DateTime)                                        │
│ └─ Relacionamentos: direcionamento, responsavel, items         │
│                                                                 │
│ conferencia_item                                                │
│ ├─ id (UUID, PK)                                               │
│ ├─ conferenciaId (FK)                                          │
│ ├─ tamanhoId (FK)                                              │
│ ├─ qtdRecebida (Int)                                           │
│ ├─ qtdDefeito (Int, default: 0)                                │
│ └─ Relacionamentos: conferencia, tamanho                       │
└─────────────────────────────────────────────────────────────────┘
```

### Chaves Primárias e Relacionamentos

- **Todas as tabelas** usam UUID como chave primária
- **Foreign Keys** estabelecem relacionamentos entre as tabelas
- **Constraints Únicos**: email (usuario), sku (produto), código_barra_rolo (estoque_rolo), código_lote (lote_producao)

---

## 🔌 Endpoints

### Autenticação e Usuários

#### 1. Criar Usuário (Sign Up)
```http
POST /users
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@example.com",
  "senha": "senha123",
  "perfil": "FUNCIONARIO",          // Opcional, padrão: FUNCIONARIO
  "funcaoSetor": "Costura"          // Opcional
}
```

**Middlewares**: `validateSchema(createUserSchema)`

**Resposta (201/200)**:
```json
{
  "id": "uuid",
  "nome": "João Silva",
  "email": "joao@example.com",
  "perfil": "FUNCIONARIO",
  "status": "ativo",
  "funcaoSetor": "Costura",
  "createdAt": "2026-02-03T10:00:00Z"
}
```

---

#### 2. Autenticar Usuário (Login)
```http
POST /session
Content-Type: application/json

{
  "email": "joao@example.com",
  "senha": "senha123"
}
```

**Middlewares**: `validateSchema(authenticateUserSchema)`

**Resposta (200)**:
```json
{
  "id": "uuid",
  "nome": "João Silva",
  "email": "joao@example.com",
  "perfil": "FUNCIONARIO",
  "status": "ativo",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 3. Listar Todos os Usuários
```http
GET /users/all
Authorization: Bearer <token>
```

**Middlewares**: `isAuthenticated`

**Resposta (200)**:
```json
[
  {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@example.com",
    "perfil": "FUNCIONARIO",
    "status": "ativo",
    "funcaoSetor": "Costura",
    "createdAt": "2026-02-03T10:00:00Z"
  }
]
```

---

#### 4. Obter Dados do Usuário Logado
```http
GET /user/me
Authorization: Bearer <token>
```

**Middlewares**: `isAuthenticated`

**Resposta (200)**:
```json
{
  "id": "uuid",
  "nome": "João Silva",
  "email": "joao@example.com",
  "perfil": "FUNCIONARIO",
  "status": "ativo",
  "funcaoSetor": "Costura",
  "createdAt": "2026-02-03T10:00:00Z"
}
```

---

#### 5. Obter Usuário por ID (Apenas Admin)
```http
GET /user/:id
Authorization: Bearer <token>
```

**Middlewares**: `isAuthenticated`, `isAdmin`

**Resposta (200)**:
```json
{
  "id": "uuid",
  "nome": "João Silva",
  "email": "joao@example.com",
  "perfil": "FUNCIONARIO",
  "status": "ativo",
  "funcaoSetor": "Costura",
  "createdAt": "2026-02-03T10:00:00Z"
}
```

---

## 🛡️ Middlewares

### 1. `validateSchema`

**Arquivo**: [src/middlewares/validateSchema.ts](src/middlewares/validateSchema.ts)

**Propósito**: Validar dados de entrada contra um schema Zod

**Parâmetros**:
- `schemas: ZodType` - Schema Zod para validação

**Validações**:
- Body da requisição
- Query parameters
- Route parameters

**Erro (400)**:
```json
{
  "message": "Validation failed",
  "details": [
    {
      "mensage": "Email inválido"
    },
    {
      "mensage": "Senha deve ter pelo menos 6 caracteres"
    }
  ]
}
```

**Fluxo**:
```
Requisição → validateSchema → Zod Parser → ✓ next() ou ✗ erro 400
```

---

### 2. `isAuthenticated`

**Arquivo**: [src/middlewares/isAuthenticated.ts](src/middlewares/isAuthenticated.ts)

**Propósito**: Verificar se o usuário possui um JWT válido

**Verificações**:
- Token presente no header `Authorization`
- Token no formato `Bearer <token>`
- Token válido usando `JWT_SECRET`
- Extrai `sub` (user ID) do token

**Erro (401)**:
```json
{
  "error": "Token não fornecido"
}
```
ou
```json
{
  "error": "Token inválido"
}
```

**Fluxo**:
```
Header Authorization → Split "Bearer token" → jwt.verify() → ✓ req.userId = sub ou ✗ erro 401
```

---

### 3. `isAdmin`

**Arquivo**: [src/middlewares/IsAdmin.ts](src/middlewares/IsAdmin.ts)

**Propósito**: Verificar se o usuário logado tem perfil ADM

**Verificações**:
- Validar se `req.userId` existe (requer `isAuthenticated` antes)
- Buscar usuário no banco de dados
- Validar se `perfil === "ADM"`

**Erro (401)**:
```json
{
  "error": "Usuário não autenticado"
}
```
ou
```json
{
  "error": "Usuário não tem permissão"
}
```

**Fluxo**:
```
isAuthenticated → req.userId → prisma.usuario.findUnique() → verificar perfil → ✓ next() ou ✗ erro 401
```

---

## ✅ Validação de Schema

### Arquivo: [src/schemas/userSchemas.ts](src/schemas/userSchemas.ts)

Utilizamos **Zod** para validação de entrada com mensagens de erro personalizadas.

---

### Schema: `createUserSchema`

```typescript
export const createUserSchema = z.object({
    body: z.object({
        nome: z.string()
            .min(2, "Nome deve ter pelo menos 2 caracteres"),
        email: z.email("Email inválido"),
        senha: z.string()
            .min(6, "Senha deve ter pelo menos 6 caracteres"),
        perfil: z.enum(["ADM", "GERENTE", "FUNCIONARIO"]).optional(),
        status: z.string().optional(),
        funcaoSetor: z.string().optional(),
    }),
});
```

**Validações**:
- `nome`: String com mínimo 2 caracteres
- `email`: Email válido
- `senha`: String com mínimo 6 caracteres
- `perfil`: Um dos valores: ADM, GERENTE, FUNCIONARIO (opcional)
- `status`: String (opcional)
- `funcaoSetor`: String (opcional)

---

### Schema: `authenticateUserSchema`

```typescript
export const authenticateUserSchema = z.object({
    body: z.object({
        email: z.email("Email inválido"),
        senha: z.string()
            .min(6, "Senha deve ter pelo menos 6 caracteres"),
    }),
});
```

**Validações**:
- `email`: Email válido
- `senha`: String com mínimo 6 caracteres

---

## 🔄 Fluxo de Requisição

### Exemplo: Criar Usuário

```
1. Cliente faz requisição
   POST /users
   {
     "nome": "João",
     "email": "joao@example.com",
     "senha": "senha123"
   }

2. Route (router.ts)
   ├─ Aplica validateSchema(createUserSchema)
   └─ Chama CreateUserController.handle()

3. Middleware validateSchema
   ├─ Zod valida body, query, params
   ├─ Se válido → next()
   └─ Se inválido → erro 400

4. CreateUserController
   ├─ Extrai dados do req.body
   ├─ Instancia CreateUserService
   ├─ Chama service.execute(dados)
   └─ Retorna res.json(user)

5. CreateUserService
   ├─ Verifica se email já existe
   │  └─ Se existe → throw Error("User already exists")
   ├─ Hash a senha com bcryptjs
   ├─ Chama prismaClient.usuario.create()
   ├─ Select campos para resposta
   └─ Retorna user criado

6. Prisma Client
   ├─ Comunica com PostgreSQL
   ├─ Executa INSERT na tabela usuario
   └─ Retorna registro inserido

7. Response (Sucesso)
   {
     "id": "uuid",
     "nome": "João",
     "email": "joao@example.com",
     "perfil": "FUNCIONARIO",
     "status": "ativo",
     "createdAt": "2026-02-03T10:00:00Z"
   }
```

---

### Exemplo: Autenticar Usuário

```
1. Cliente faz requisição
   POST /session
   {
     "email": "joao@example.com",
     "senha": "senha123"
   }

2. Route (router.ts)
   ├─ Aplica validateSchema(authenticateUserSchema)
   └─ Chama AuthenticateUserController.handle()

3. Middleware validateSchema
   ├─ Zod valida email e senha
   ├─ Se válido → next()
   └─ Se inválido → erro 400

4. AuthenticateUserController
   ├─ Extrai email e senha
   ├─ Instancia AuthenticateUserService
   ├─ Chama service.execute(email, senha)
   └─ Retorna res.json({...user, token})

5. AuthenticateUserService
   ├─ Busca usuário por email
   │  └─ Se não encontrado → throw Error("User not found")
   ├─ Compara senha com hash usando bcryptjs
   │  └─ Se diferente → throw Error("Invalid password")
   ├─ Gera JWT com jwt.sign({sub: userId}, JWT_SECRET)
   ├─ Retorna user + token

6. Response (Sucesso)
   {
     "id": "uuid",
     "nome": "João",
     "email": "joao@example.com",
     "perfil": "FUNCIONARIO",
     "status": "ativo",
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
```

---

### Exemplo: Obter Usuário por ID (com proteção admin)

```
1. Cliente faz requisição
   GET /user/123e4567-e89b-12d3-a456-426614174000
   Authorization: Bearer <token>

2. Route (router.ts)
   ├─ Aplica isAuthenticated
   ├─ Aplica isAdmin
   └─ Chama ListByIdUserController.handle()

3. Middleware isAuthenticated
   ├─ Extrai token do header
   ├─ Verifica JWT
   ├─ Se válido → req.userId = sub, next()
   └─ Se inválido → erro 401

4. Middleware isAdmin
   ├─ Verifica se req.userId existe
   ├─ Busca usuário no banco
   ├─ Se perfil === "ADM" → next()
   └─ Se diferente → erro 401

5. ListByIdUserController
   ├─ Extrai id do route params
   ├─ Instancia ListByIdUserService
   ├─ Chama service.execute(id)
   └─ Retorna res.json(user)

6. ListByIdUserService
   ├─ Busca usuário por id
   └─ Retorna usuário

7. Response (Sucesso)
   {
     "id": "uuid",
     "nome": "João",
     "email": "joao@example.com",
     "perfil": "FUNCIONARIO",
     "status": "ativo",
     "createdAt": "2026-02-03T10:00:00Z"
   }
```

---

## 📝 Tratamento de Erros

A aplicação utiliza um middleware global de tratamento de erros em [src/server.ts](src/server.ts):

```typescript
app.use((error: Error, _: Request, res: Response, next: NextFunction) => {
    if (error instanceof Error) {
        return res.status(400).json({
            error: error.message
        });
    }
    return res.status(500).json({
        status: "error",
        message: "Internal Server Error"
    });
})
```

**Tratamento**:
- Erros do tipo `Error` → Retorna 400 com mensagem do erro
- Outros erros → Retorna 500 com mensagem genérica

---

## 🚀 Scripts Disponíveis

```bash
# Iniciar servidor em produção
yarn start

# Iniciar servidor em desenvolvimento (watch mode)
yarn dev

# Criar/executar migrations
yarn prisma migrate dev

# Gerar cliente Prisma
yarn prisma generate

# Acessar Prisma Studio
yarn prisma studio
```

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de dados
DATABASE_URL="postgresql://user:password@localhost:5432/fitpro"

# JWT
JWT_SECRET="sua_chave_secreta_muito_segura"

# Servidor
PORT=3333

# CORS
CORS_ORIGIN="http://localhost:3000"
```

---

## 📊 Resumo da Arquitetura

| Camada | Responsabilidade | Exemplos |
|--------|------------------|----------|
| **Routes** | Mapear endpoints e aplicar middlewares | `/users`, `/session` |
| **Middlewares** | Validação, autenticação e autorização | `validateSchema`, `isAuthenticated`, `isAdmin` |
| **Controllers** | Receber requisição e chamar service | `CreateUserController` |
| **Services** | Lógica de negócio | `CreateUserService` |
| **Prisma** | Comunicar com banco de dados | `prismaClient.usuario.create()` |
| **Database** | Persistir dados | PostgreSQL |

---

## 🎯 Próximas Implementações (Sugestão)

Com base na estrutura atual, você pode expandir:

1. **Gestão de Produtos**: Controllers, Services e Endpoints para CRUD de produtos
2. **Gestão de Estoque**: Controle de rolos e movimentações
3. **Fluxo de Produção**: Lotes, direcionamentos e conferências
4. **Relatórios**: Endpoints para gerar relatórios de produção e estoque
5. **Paginação**: Adicionar paginação aos endpoints de listagem
6. **Filtros**: Implementar filtros avançados (por status, data, etc)
7. **Rate Limiting**: Proteger endpoints com rate limiting
8. **Logs**: Sistema de logging estruturado
9. **Testes**: Suite de testes unitários e integração

---

**Versão do Documento**: 1.0.0  
**Última Atualização**: Fevereiro, 2026
