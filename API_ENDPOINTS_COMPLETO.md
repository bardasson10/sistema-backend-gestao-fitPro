# 📚 Documentação Completa de Endpoints - CRUD Sistema de Produção

**Versão**: 1.0.0  
**Última Atualização**: Fevereiro, 2026  
**Status**: Completo e Pronto para Implementação

---

## 🔐 Autenticação

Todos os endpoints (exceto criação de usuário e login) requerem autenticação via JWT.

**Header Obrigatório:**
```http
Authorization: Bearer <seu_token_jwt>
```

**Roles e Permissões:**
- `ADM`: Acesso completo (CRUD de todas as entidades)
- `GERENTE`: Acesso à maioria (sem permissão para deletar)
- `FUNCIONARIO`: Acesso apenas à consulta e criação de alguns registros

---

## 👥 Usuários

### POST /users - Criar Usuário
```http
POST /users
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@example.com",
  "senha": "senha123",
  "perfil": "FUNCIONARIO",  // ADM, GERENTE, FUNCIONARIO
  "funcaoSetor": "Costura"
}
```

**Resposta (201):**
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

### POST /session - Login
```http
POST /session
Content-Type: application/json

{
  "email": "joao@example.com",
  "senha": "senha123"
}
```

**Resposta (200):**
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

### GET /users/all - Listar Todos os Usuários
```http
GET /users/all
Authorization: Bearer <token>
```

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@example.com",
    "perfil": "FUNCIONARIO",
    "status": "ativo",
    "createdAt": "2026-02-03T10:00:00Z"
  }
]
```

---

### GET /user/me - Dados do Usuário Logado
```http
GET /user/me
Authorization: Bearer <token>
```

---

### GET /user/:id - Buscar Usuário (Apenas Admin)
```http
GET /user/uuid-do-usuario
Authorization: Bearer <token>
```

---

## 🏷️ Tipos de Produto

### POST /tipos-produto - Criar Tipo de Produto
```http
POST /tipos-produto
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Camisetas"
}
```

**Resposta (201):**
```json
{
  "id": "uuid",
  "nome": "Camisetas",
  "produtos": [],
  "tamanhos": [],
  "createdAt": "2026-02-03T10:00:00Z"
}
```

---

### GET /tipos-produto - Listar Todos
```http
GET /tipos-produto
Authorization: Bearer <token>
```

---

### GET /tipos-produto/:id - Buscar por ID
```http
GET /tipos-produto/uuid
Authorization: Bearer <token>
```

---

### PUT /tipos-produto/:id - Atualizar
```http
PUT /tipos-produto/uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Camisetas Premium"
}
```

---

### DELETE /tipos-produto/:id - Deletar (Apenas Admin)
```http
DELETE /tipos-produto/uuid
Authorization: Bearer <token>
```

---

## 📏 Tamanhos

### POST /tamanhos - Criar Tamanho
```http
POST /tamanhos
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "P",
  "ordem": 1
}
```

### GET /tamanhos - Listar (ordenado)
```http
GET /tamanhos
Authorization: Bearer <token>
```

### PUT /tamanhos/:id - Atualizar
### DELETE /tamanhos/:id - Deletar

---

## 📦 Produtos

### POST /produtos - Criar Produto
```http
POST /produtos
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipoProdutoId": "uuid-tipo",
  "nome": "Camiseta Básica",
  "sku": "CAM-001",
  "fabricante": "Fábrica XYZ",
  "custoMedioPeca": 15.50,
  "precoMedioVenda": 45.00
}
```

**Resposta (201):**
```json
{
  "id": "uuid",
  "tipoProdutoId": "uuid-tipo",
  "nome": "Camiseta Básica",
  "sku": "CAM-001",
  "fabricante": "Fábrica XYZ",
  "custoMedioPeca": 15.50,
  "precoMedioVenda": 45.00,
  "tipo": {
    "id": "uuid-tipo",
    "nome": "Camisetas"
  },
  "lotes": [],
  "createdAt": "2026-02-03T10:00:00Z"
}
```

### GET /produtos - Listar Produtos
```http
GET /produtos?tipoProdutoId=uuid-tipo
Authorization: Bearer <token>
```

### GET /produtos/:id - Buscar Produto

### PUT /produtos/:id - Atualizar Produto

### DELETE /produtos/:id - Deletar Produto

---

## 🔗 Associar Tamanho a Tipo de Produto

### POST /tipos-produto-tamanho
```http
POST /tipos-produto-tamanho
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipoProdutoId": "uuid-tipo",
  "tamanhoId": "uuid-tamanho"
}
```

### GET /tipos-produto/:tipoProdutoId/tamanhos
```http
GET /tipos-produto/uuid/tamanhos
Authorization: Bearer <token>
```

Retorna todos os tamanhos associados a um tipo de produto.

### DELETE /tipos-produto-tamanho/:id

---

## 🏭 Fornecedores

### POST /fornecedores - Criar Fornecedor
```http
POST /fornecedores
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Fornecedor Têxtil ABC",
  "tipo": "Distribuidor",
  "contato": "contato@abc.com"
}
```

### GET /fornecedores - Listar
### GET /fornecedores/:id - Buscar
### PUT /fornecedores/:id - Atualizar
### DELETE /fornecedores/:id - Deletar

---

## 🎨 Cores

### POST /cores - Criar Cor
```http
POST /cores
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Azul Royal",
  "codigoHex": "#4169E1"
}
```

### GET /cores - Listar
### GET /cores/:id - Buscar
### PUT /cores/:id - Atualizar
### DELETE /cores/:id - Deletar

---

## 🧵 Tecidos

### POST /tecidos - Criar Tecido
```http
POST /tecidos
Authorization: Bearer <token>
Content-Type: application/json

{
  "fornecedorId": "uuid-fornecedor",
  "corId": "uuid-cor",
  "nome": "Algodão 30/1 Azul",
  "codigoReferencia": "ALG-30-AZ",
  "rendimentoMetroKg": 2.5,
  "larguraMetros": 1.5,
  "valorPorKg": 25.00,
  "gramatura": 180.5
}
```

**Resposta (201):**
```json
{
  "id": "uuid",
  "fornecedorId": "uuid-fornecedor",
  "corId": "uuid-cor",
  "nome": "Algodão 30/1 Azul",
  "codigoReferencia": "ALG-30-AZ",
  "rendimentoMetroKg": 2.5,
  "larguraMetros": 1.5,
  "valorPorKg": 25.00,
  "gramatura": 180.5,
  "fornecedor": { ... },
  "cor": { ... },
  "rolos": [],
  "lotes": [],
  "createdAt": "2026-02-03T10:00:00Z"
}
```

### GET /tecidos - Listar
```http
GET /tecidos?fornecedorId=uuid&corId=uuid
Authorization: Bearer <token>
```

### GET /tecidos/:id - Buscar
### PUT /tecidos/:id - Atualizar
### DELETE /tecidos/:id - Deletar

---

## 📦 Estoque de Rolos

### POST /estoque-rolos - Criar Rolo em Estoque
```http
POST /estoque-rolos
Authorization: Bearer <token>
Content-Type: application/json

{
  "tecidoId": "uuid-tecido",
  "codigoBarraRolo": "001-ABC-2026",
  "pesoInicialKg": 100.50,
  "pesoAtualKg": 100.50,
  "situacao": "disponivel"
}
```

**Resposta (201):**
```json
{
  "id": "uuid",
  "tecidoId": "uuid-tecido",
  "codigoBarraRolo": "001-ABC-2026",
  "pesoInicialKg": 100.50,
  "pesoAtualKg": 100.50,
  "situacao": "disponivel",
  "tecido": {
    "id": "uuid-tecido",
    "nome": "Algodão 30/1",
    "fornecedor": { ... },
    "cor": { ... }
  },
  "movimentacoes": [],
  "createdAt": "2026-02-03T10:00:00Z"
}
```

### GET /estoque-rolos - Listar Rolos
```http
GET /estoque-rolos?tecidoId=uuid&situacao=disponivel
Authorization: Bearer <token>
```

**Situações possíveis:**
- `disponivel`: Rolo pronto para uso
- `reservado`: Rolo reservado para um lote
- `em_uso`: Rolo sendo utilizado
- `descartado`: Rolo descartado

### GET /estoque-rolos/:id - Buscar Rolo
```http
GET /estoque-rolos/uuid
Authorization: Bearer <token>
```

Retorna rolo com histórico de movimentações.

### PUT /estoque-rolos/:id - Atualizar Rolo
```http
PUT /estoque-rolos/uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "pesoAtualKg": 95.30,
  "situacao": "em_uso"
}
```

### DELETE /estoque-rolos/:id - Deletar Rolo

### GET /estoque-rolos/relatorio/geral - Relatório de Estoque
```http
GET /estoque-rolos/relatorio/geral
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "totalRolos": 45,
  "pesoTotal": 4250.75,
  "tecidoComMaiorEstoque": "Algodão 30/1",
  "rolosDisponíveis": 30,
  "rolosReservados": 10,
  "rolosEmUso": 5,
  "movimentacoesMes": 120
}
```

---

## 🔄 Movimentações de Estoque

### POST /movimentacoes-estoque - Registrar Movimentação
```http
POST /movimentacoes-estoque
Authorization: Bearer <token>
Content-Type: application/json

{
  "estoqueRoloId": "uuid-rolo",
  "tipoMovimentacao": "saida",
  "pesoMovimentado": 5.50
}
```

**Tipos de Movimentação:**
- `entrada`: Recebimento de novos rolos
- `saida`: Saída para produção
- `ajuste`: Ajuste de inventário
- `devolucao`: Devolução de rolo

**Resposta (201):**
```json
{
  "id": "uuid",
  "estoqueRoloId": "uuid-rolo",
  "usuarioId": "uuid-usuario",
  "tipoMovimentacao": "saida",
  "pesoMovimentado": 5.50,
  "rolo": { ... },
  "usuario": { ... },
  "createdAt": "2026-02-03T10:00:00Z"
}
```

**Lógica de Negócio:**
- Movimentações de saída validam se o peso disponível é suficiente
- Peso do rolo é atualizado automaticamente baseado no tipo
- Entrada: aumenta peso
- Saída/Devolução: diminui peso
- Ajuste: define peso

### GET /movimentacoes-estoque - Listar Movimentações
```http
GET /movimentacoes-estoque?estoqueRoloId=uuid&tipoMovimentacao=saida&dataInicio=2026-01-01&dataFim=2026-02-03
Authorization: Bearer <token>
```

### GET /movimentacoes-estoque/:id - Buscar Movimentação

### GET /movimentacoes-estoque/:estoqueRoloId/historico - Histórico do Rolo
```http
GET /movimentacoes-estoque/uuid-rolo/historico
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "rolo": { ... },
  "historico": [
    {
      "id": "uuid",
      "tipoMovimentacao": "entrada",
      "pesoMovimentado": 100.50,
      "pesoAntesMovimentacao": 0,
      "pesoDepoisMovimentacao": 100.50,
      "usuario": { ... },
      "createdAt": "2026-02-03T10:00:00Z"
    },
    {
      "id": "uuid",
      "tipoMovimentacao": "saida",
      "pesoMovimentado": 5.50,
      "pesoAntesMovimentacao": 100.50,
      "pesoDepoisMovimentacao": 95.00,
      "usuario": { ... },
      "createdAt": "2026-02-03T11:00:00Z"
    }
  ],
  "pesoAtual": 95.00,
  "pesoInicial": 100.50,
  "pesoConsumido": 5.50
}
```

---

## 🏢 Facções

### POST /faccoes - Criar Facção
```http
POST /faccoes
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Facção Premium Costura",
  "responsavel": "Carlos Silva",
  "contato": "carlos@faccao.com",
  "prazoMedioDias": 7,
  "status": "ativo"
}
```

### GET /faccoes - Listar Facções
```http
GET /faccoes?status=ativo
Authorization: Bearer <token>
```

### GET /faccoes/:id - Buscar Facção

### PUT /faccoes/:id - Atualizar Facção

### DELETE /faccoes/:id - Deletar Facção

---

## 📋 Lotes de Produção

### POST /lotes-producao - Criar Lote
```http
POST /lotes-producao
Authorization: Bearer <token>
Content-Type: application/json

{
  "codigoLote": "LOTE-2026-001",
  "tecidoId": "uuid-tecido",
  "responsavelId": "uuid-usuario",
  "status": "planejado",
  "observacao": "Lote de teste",
  "items": [
    {
      "produtoId": "uuid-produto-1",
      "tamanhoId": "uuid-tamanho-P",
      "quantidadePlanejada": 50
    },
    {
      "produtoId": "uuid-produto-2",
      "tamanhoId": "uuid-tamanho-M",
      "quantidadePlanejada": 100
    },
    {
      "produtoId": "uuid-produto-2",
      "tamanhoId": "uuid-tamanho-G",
      "quantidadePlanejada": 50
    }
  ]
}
```

**Status Válidos:**
- `planejado`: Lote em planejamento
- `em_producao`: Em produção
- `concluido`: Finalizado
- `cancelado`: Cancelado

**Resposta (201):**
```json
{
  "id": "uuid",
  "codigoLote": "LOTE-2026-001",
  "tecidoId": "uuid-tecido",
  "responsavelId": "uuid-usuario",
  "status": "planejado",
  "observacao": "Lote de teste",
  "tecido": { ... },
  "responsavel": { ... },
  "items": [
    {
      "id": "uuid",
      "produtoId": "uuid-produto-1",
      "tamanhoId": "uuid-tamanho-P",
      "quantidadePlanejada": 50,
      "produto": { ... },
      "tamanho": { ... }
    }
  ],
  "direcionamentos": [],
  "createdAt": "2026-02-03T10:00:00Z"
}
```

### GET /lotes-producao - Listar Lotes
```http
GET /lotes-producao?status=em_producao&responsavelId=uuid
Authorization: Bearer <token>
```

### GET /lotes-producao/:id - Buscar Lote

### PUT /lotes-producao/:id - Atualizar Lote
```http
PUT /lotes-producao/uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "codigoLote": "LOTE-2026-001",
  "tecidoId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "responsavelId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "planejado",
  "observacao": "string",
  "items": [
    {
      "produtoId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "tamanhoId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "quantidadePlanejada": 1
    }
  ]
}
```

**Obs:** Todos os campos são opcionais. Pode enviar apenas alguns campos para atualizar:
- Só `status` e `observacao` para mudar estado
- `items` para adicionar produtos/tamanhos
- `codigoLote`, `tecidoId`, `responsavelId` para alterar dados principais
- Qualquer combinação desses campos

**Transições Válidas:**
- `planejado` → `em_producao` ou `cancelado`
- `em_producao` → `concluido` ou `cancelado`
- `concluido` → (nenhuma)
- `cancelado` → (nenhuma)

### DELETE /lotes-producao/:id - Deletar Lote

---

## 🚚 Direcionamentos

### POST /direcionamentos - Criar Direcionamento
```http
POST /direcionamentos
Authorization: Bearer <token>
Content-Type: application/json

{
  "loteProducaoId": "uuid-lote",
  "faccaoId": "uuid-faccao",
  "tipoServico": "costura",
  "dataSaida": "2026-02-03",
  "dataPrevisaoRetorno": "2026-02-10"
}
```

**Tipos de Serviço:**
- `costura`: Serviço de costura
- `estampa`: Serviço de estampa
- `tingimento`: Serviço de tingimento
- `acabamento`: Serviço de acabamento
- `corte`: Serviço de corte
- `outro`: Outro tipo

**Status:**
- `enviado`: Enviado para facção
- `em_processamento`: Em processamento
- `finalizado`: Finalizado
- `cancelado`: Cancelado

### GET /direcionamentos - Listar
```http
GET /direcionamentos?status=enviado&faccaoId=uuid
Authorization: Bearer <token>
```

### GET /direcionamentos/:id - Buscar com Detalhes Completos

### PUT /direcionamentos/:id - Atualizar Status
```http
PUT /direcionamentos/uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "em_processamento",
  "dataSaida": "2026-02-03",
  "dataPrevisaoRetorno": "2026-02-10"
}
```

### DELETE /direcionamentos/:id - Deletar

---

## ✅ Conferências

### POST /conferencias - Criar Conferência
```http
POST /conferencias
Authorization: Bearer <token>
Content-Type: application/json

{
  "direcionamentoId": "uuid-direcionamento",
  "responsavelId": "uuid-usuario",
  "dataConferencia": "2026-02-10",
  "statusQualidade": "conforme",
  "observacao": "Tudo em ordem",
  "items": [
    {
      "tamanhoId": "uuid-tamanho-P",
      "qtdRecebida": 50,
      "qtdDefeito": 0
    },
    {
      "tamanhoId": "uuid-tamanho-M",
      "qtdRecebida": 95,
      "qtdDefeito": 5
    }
  ]
}
```

**Status de Qualidade:**
- `conforme`: Tudo conforme esperado
- `nao_conforme`: Não atende aos padrões
- `com_defeito`: Apresenta defeitos

### GET /conferencias - Listar Conferências
```http
GET /conferencias?statusQualidade=conforme&liberadoPagamento=true
Authorization: Bearer <token>
```

### GET /conferencias/:id - Buscar Conferência com Detalhes

### PUT /conferencias/:id - Atualizar Conferência
```http
PUT /conferencias/uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "dataConferencia": "2026-02-10",
  "statusQualidade": "com_defeito",
  "liberadoPagamento": false,
  "observacao": "Encontrado defeitos na costura"
}
```

**Regra de Negócio:**
- Não é possível liberar pagamento para conferências não conforme
- Só é possível liberar pagamento se status for `conforme`

### DELETE /conferencias/:id - Deletar Conferência

### GET /conferencias/relatorio/produtividade - Relatório de Produtividade
```http
GET /conferencias/relatorio/produtividade?dataInicio=2026-01-01&dataFim=2026-02-03
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "periodo": {
    "inicio": "2026-01-01",
    "fim": "2026-02-03"
  },
  "totalConferencias": 120,
  "conformes": 110,
  "naoConformes": 5,
  "comDefeito": 5,
  "taxaConformidade": "91.67%",
  "pagasAutorizadas": 110,
  "porFaccao": {
    "Facção Premium Costura": {
      "total": 50,
      "conforme": 48,
      "defeitos": 2
    },
    "Facção Acabamento": {
      "total": 70,
      "conforme": 62,
      "defeitos": 3
    }
  }
}
```

---

## 🔄 Fluxo Completo de Produção

```
1. Criar Tipo de Produto
   POST /tipos-produto { nome }

2. Criar Tamanhos
   POST /tamanhos { nome, ordem }

3. Associar Tamanhos ao Tipo
   POST /tipos-produto-tamanho { tipoProdutoId, tamanhoId }

4. Criar Produto
   POST /produtos { tipoProdutoId, nome, sku, ... }

5. Criar Fornecedor
   POST /fornecedores { nome, ... }

6. Criar Cores
   POST /cores { nome, codigoHex }

7. Criar Tecido
   POST /tecidos { fornecedorId, corId, nome, ... }

8. Criar Estoque de Rolo
   POST /estoque-rolos { tecidoId, pesoInicialKg, ... }

9. Registrar Movimentação (saída para produção)
   POST /movimentacoes-estoque { estoqueRoloId, tipoMovimentacao: "saida", ... }

10. Criar Facção
    POST /faccoes { nome, ... }

11. Criar Lote de Produção
    POST /lotes-producao { codigoLote, tecidoId, ..., items (com produtoId) }

12. Atualizar Status do Lote (em_producao)
    PUT /lotes-producao/:id { status: "em_producao" }

12.1. Adicionar Itens ao Lote (quando necessário)
     POST /lotes-producao/:id/items { items }

13. Criar Direcionamento para Facção
    POST /direcionamentos { loteProducaoId, faccaoId, tipoServico, ... }

14. Atualizar Status (em_processamento)
    PUT /direcionamentos/:id { status: "em_processamento" }

15. Criar Conferência de Retorno
    POST /conferencias { direcionamentoId, responsavelId, items, ... }

16. Atualizar Conferência (liberar pagamento)
    PUT /conferencias/:id { liberadoPagamento: true, ... }

17. Consultar Relatório de Produtividade
    GET /conferencias/relatorio/produtividade?dataInicio=...&dataFim=...
```

---

## 🔒 Permissões por Perfil

| Endpoint | ADM | GERENTE | FUNCIONARIO |
|----------|-----|---------|-------------|
| POST /users | ✓ | ✗ | ✗ |
| GET /users/all | ✓ | ✓ | ✗ |
| DELETE /* | ✓ | ✗ | ✗ |
| POST /tipos-produto | ✓ | ✓ | ✗ |
| GET /tipos-produto | ✓ | ✓ | ✓ |
| POST /produtos | ✓ | ✓ | ✗ |
| GET /produtos | ✓ | ✓ | ✓ |
| POST /estoque-rolos | ✓ | ✓ | ✗ |
| GET /estoque-rolos | ✓ | ✓ | ✓ |
| POST /movimentacoes-estoque | ✓ | ✓ | ✓ |
| POST /lotes-producao | ✓ | ✓ | ✗ |
| PUT /lotes-producao | ✓ | ✓ | ✗ |
| POST /lotes-producao/:id/items | ✓ | ✓ | ✗ |
| POST /conferencias | ✓ | ✓ | ✓ |
| PUT /conferencias | ✓ | ✓ | ✗ |

---

## 📋 Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 201 | Recurso criado com sucesso |
| 200 | Requisição bem-sucedida |
| 400 | Validação falhou |
| 401 | Não autenticado / Sem permissão |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

---

## 🧪 Exemplo de Fluxo Completo com CURL

```bash
# 1. Login
curl -X POST http://localhost:3333/session \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitpro.com","senha":"senha123"}'

# 2. Guardar token
TOKEN="eyJhbGciOi..."

# 3. Criar tipo de produto
curl -X POST http://localhost:3333/tipos-produto \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Camisetas"}'

# 4. Criar tamanho
curl -X POST http://localhost:3333/tamanhos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"P","ordem":1}'

# 5. Listar rolos de estoque
curl -X GET "http://localhost:3333/estoque-rolos?situacao=disponivel" \
  -H "Authorization: Bearer $TOKEN"
```

---

**Documentação Completa - Versão 1.0.0**
