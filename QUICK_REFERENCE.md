# ⚡ Quick Reference - CRUD FitPro

## 🚀 Iniciar Servidor
```bash
yarn dev
```

## 📝 Exemplo de Fluxo Completo em 5 Minutos

### 1. Criar Usuário Admin
```bash
curl -X POST http://localhost:3333/users \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Admin FitPro",
    "email": "admin@fitpro.com",
    "senha": "admin123",
    "perfil": "ADM"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3333/session \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fitpro.com","senha":"admin123"}'
```
**Guardar o token retornado**

### 3. Criar Tipo de Produto
```bash
TOKEN="seu_token_aqui"

curl -X POST http://localhost:3333/tipos-produto \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Camisetas"}'
```

### 4. Criar Tamanho
```bash
curl -X POST http://localhost:3333/tamanhos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"P","ordem":1}'
```

### 5. Criar Fornecedor
```bash
curl -X POST http://localhost:3333/fornecedores \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome":"Fornecedor ABC",
    "tipo":"Distribuidor",
    "contato":"contato@abc.com"
  }'
```

### 6. Criar Cor
```bash
curl -X POST http://localhost:3333/cores \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Azul","codigoHex":"#4169E1"}'
```

### 7. Criar Tecido
```bash
curl -X POST http://localhost:3333/tecidos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fornecedorId":"uuid-fornecedor",
    "corId":"uuid-cor",
    "nome":"Algodão Azul",
    "codigoReferencia":"ALG-AZ-001",
    "rendimentoMetroKg":2.5,
    "larguraMetros":1.5,
    "valorPorKg":25.00,
    "gramatura":180.5
  }'
```

### 8. Criar Rolos em Estoque (Lote)
```bash
curl -X POST http://localhost:3333/estoque-rolos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tecidoId":"uuid-tecido",
    "prefixo":"SPP",
    "dataLote":"2026-03-11",
    "rolos":[
      {"pesoInicialKg":25.50},
      {"pesoInicialKg":28.20},
      {"pesoInicialKg":24.00}
    ],
    "situacao":"disponivel"
  }'
```

---

## 📊 Endpoints Principais por Módulo

### Produtos (18)
```
POST   /tipos-produto
POST   /tamanhos
POST   /produtos
POST   /tipos-produto-tamanho
GET    /tipos-produto | /tamanhos | /produtos
PUT    /tipos-produto/:id | /tamanhos/:id | /produtos/:id
DELETE /tipos-produto/:id | /tamanhos/:id | /produtos/:id
```

### Materiais (15)
```
POST   /fornecedores | /cores | /tecidos
GET    /fornecedores | /cores | /tecidos
PUT    /fornecedores/:id | /cores/:id | /tecidos/:id
DELETE /fornecedores/:id | /cores/:id | /tecidos/:id
```

### Estoque (10)
```
POST   /estoque-rolos
POST   /movimentacoes-estoque
GET    /estoque-rolos | /movimentacoes-estoque
GET    /estoque-rolos/relatorio/geral
GET    /movimentacoes-estoque/:estoqueRoloId/historico
PUT    /estoque-rolos/:id
DELETE /estoque-rolos/:id
```

### Estoque de Corte (3)
```
GET    /estoque-corte?produtoId=&loteProducaoId=&tamanhoId=
GET    /estoque-corte/:id
PATCH  /estoque-corte/:id/ajuste
```

### Produção (30)
```
POST   /faccoes | /lotes-producao | /direcionamentos | /conferencias
GET    /faccoes | /lotes-producao | /direcionamentos | /conferencias
PUT    /faccoes/:id | /lotes-producao/:id | /direcionamentos/:id | /conferencias/:id
DELETE /faccoes/:id | /lotes-producao/:id | /direcionamentos/:id | /conferencias/:id
GET    /conferencias/relatorio/produtividade
```

---

## 🔐 Headers Obrigatórios

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 🎯 Estados (Máquinas de Estado)

### Lote de Produção
```
planejado → em_producao → concluido
         ↘ cancelado
```

### Direcionamento
```
enviado → em_processamento → recebido
       ↘ cancelado
```

### Estoque Rolo
```
disponível | reservado | em_uso | descartado
```

### Conferência Qualidade
```
conforme | nao_conforme | com_defeito
```

---

## 💡 Lógicas Importantes

### Movimentação de Estoque
```
Entrada:   peso_atual += peso_movimentado
Saída:     peso_atual -= peso_movimentado
Ajuste:    peso_atual = peso_movimentado
Devolução: peso_atual -= peso_movimentado
```

### Liberação de Pagamento
```
✓ Permitido se statusQualidade = "conforme"
✗ Bloqueado se statusQualidade = "nao_conforme" ou "com_defeito"
```

### Transições de Status
```
Validadas antes de atualizar
Evita estados inválidos
Exemplo: Não pode ir de "recebido" para outro estado
```

---

## 🐛 Validações Automáticas

| Campo | Validação |
|-------|-----------|
| email | Must be valid email |
| senha | Min 6 characters |
| nome | Min 2 characters |
| SKU | Unique per product |
| codigoHex | Format #RRGGBB |
| peso | Must be > 0 |
| quantidade | Must be > 0 |
| ordem | Must be integer > 0 |

---

## 📋 Listar com Filtros

```bash
# Filtrar por status
GET /lotes-producao?status=em_producao

# Filtrar por tipo
GET /estoque-rolos?situacao=disponivel&tecidoId=uuid

# Filtrar por data
GET /movimentacoes-estoque?dataInicio=2026-01-01&dataFim=2026-02-03

# Múltiplos filtros
GET /conferencias?statusQualidade=conforme&liberadoPagamento=true

# Estoque de corte disponivel
GET /estoque-corte?loteProducaoId=uuid-do-lote
```

---

## 📊 Relatórios Disponíveis

```bash
# Relatório de Estoque
GET /estoque-rolos/relatorio/geral

# Relatório de Produtividade
GET /conferencias/relatorio/produtividade?dataInicio=2026-01-01&dataFim=2026-02-03

# Histórico de Rolo
GET /movimentacoes-estoque/:estoqueRoloId/historico
```

---

## 🔍 Consultar Dados

```bash
# Listar todos os rolos
GET /estoque-rolos?Authorization: Bearer $TOKEN

# Buscar rolo específico
GET /estoque-rolos/uuid?Authorization: Bearer $TOKEN

# Listar com relacionamentos inclusos
GET /lotes-producao/uuid → Retorna com produtos, tecidos, items
```

---

## ✍️ Criar com Related Data

```bash
# Criar lote com items
POST /lotes-producao
{
  "codigoLote": "LOTE-001",
  "produtoId": "uuid",
  "tecidoId": "uuid",
  "responsavelId": "uuid",
  "items": [
    {"tamanhoId": "uuid-P", "quantidadePlanejada": 50},
    {"tamanhoId": "uuid-M", "quantidadePlanejada": 100}
  ]
}

# Criar conferência com items
POST /conferencias
{
  "direcionamentoId": "uuid",
  "responsavelId": "uuid",
  "items": [
    {"direcionamentoItemId": "uuid-item-P-preto", "qtdRecebida": 50, "qtdDefeito": 0},
    {"direcionamentoItemId": "uuid-item-M-branco", "qtdRecebida": 95, "qtdDefeito": 5}
  ]
}
```

---

## 🚨 Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| 401 Unauthorized | Token inválido/expirado | Fazer login novamente |
| 400 Validation Failed | Dados inválidos | Verificar schema |
| 404 Not Found | Recurso não existe | Verificar ID |
| 400 Duplicate | SKU/email duplicado | Usar outro valor |
| 400 Invalid Status | Status inválido | Verificar máquina de estados |

---

## 📱 Ferramentas Úteis

```bash
# Insomnia / Postman
# Importar collection com todos os endpoints

# Thunder Client (VS Code)
# Extensão para testar endpoints

# Bruno
# Cliente REST open-source

# Curl (Terminal)
# Usar scripts bash para automação
```

---

## 📖 Documentação Completa

- **CONTEXTO_PROJETO.md**: Visão geral, arquitetura, banco de dados
- **API_ENDPOINTS_COMPLETO.md**: Todos os 134 endpoints documentados
- **CRUD_IMPLEMENTADO.md**: Implementação detalhada, complexidade, testes

---

## ⚙️ Configuração

`.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/fitpro
JWT_SECRET=sua-chave-super-secreta
PORT=3333
```

---

**Quick Reference v1.0**
