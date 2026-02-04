# Guia de Paginação da API

## Overview

A paginação foi implementada em todos os endpoints de listagem (GET) da API. O sistema usa parâmetros de query `page` e `limit` para controlar a paginação.

## Parâmetros

### `page` (opcional)
- **Tipo**: `number`
- **Padrão**: `1`
- **Descrição**: Número da página desejada (começa em 1)
- **Mínimo**: 1

### `limit` (opcional)
- **Tipo**: `number`
- **Padrão**: `10`
- **Descrição**: Quantidade de registros por página
- **Máximo**: 100 (para evitar sobrecarga)
- **Mínimo**: 1

## Resposta Paginada

Todos os endpoints de listagem retornam a seguinte estrutura:

```json
{
  "data": [
    {
      "id": "...",
      "nome": "...",
      // ... outros campos
    }
  ],
  "pagination": {
    "total": 250,
    "page": 1,
    "limit": 10,
    "pages": 25
  }
}
```

### Campos da resposta
- **data**: Array com os registros da página atual
- **pagination.total**: Total de registros no banco
- **pagination.page**: Número da página atual
- **pagination.limit**: Quantidade de registros por página
- **pagination.pages**: Total de páginas disponíveis

## Exemplos de Uso

### Listagem sem paginação (usa padrões)
```
GET /produtos
```

**Resposta**: Primeira página com 10 registros

### Página específica com limite personalizado
```
GET /produtos?page=2&limit=20
```

**Resposta**: Segunda página com 20 registros por página

### Com filtros e paginação
```
GET /tecidos?fornecedorId=uuid-123&page=1&limit=15
GET /estoque-rolos?situacao=disponivel&page=2&limit=25
GET /lotes-producao?status=em_producao&page=1
```

### Filtros avançados com paginação
```
GET /movimentacoes-estoque?dataInicio=2024-01-01&dataFim=2024-12-31&page=1&limit=50
GET /conferencias?statusQualidade=conforme&liberadoPagamento=true&page=1
```

## Endpoints Paginados

### Usuários
- `GET /users/all?page=1&limit=10`

### Produtos
- `GET /tipos-produto?page=1&limit=10`
- `GET /tamanhos?page=1&limit=10`
- `GET /produtos?tipoProdutoId=id&page=1&limit=10`

### Materiais
- `GET /fornecedores?page=1&limit=10`
- `GET /cores?page=1&limit=10`
- `GET /tecidos?fornecedorId=id&corId=id&page=1&limit=10`

### Estoque
- `GET /estoque-rolos?tecidoId=id&situacao=disponivel&page=1&limit=10`
- `GET /movimentacoes-estoque?estoqueRoloId=id&page=1&limit=10`

### Produção
- `GET /faccoes?status=ativo&page=1&limit=10`
- `GET /lotes-producao?status=em_producao&page=1&limit=10`
- `GET /direcionamentos?status=enviado&page=1&limit=10`
- `GET /conferencias?statusQualidade=conforme&page=1&limit=10`

## Boas Práticas

1. **Começar com page=1**: Sempre comece da primeira página
2. **Usar limit apropriado**: 10-20 para listas normais, 50+ para relatórios
3. **Respeitar o máximo**: O limite máximo é 100 registros por página
4. **Cachear resultados**: Quando possível, cache as respostas de paginação
5. **Monitorar performance**: Verificar logs para páginas que levam muito tempo

## Tratamento de Erros

### Page inválida
Se você solicitar uma página que não existe, receberá um array `data` vazio:

```json
{
  "data": [],
  "pagination": {
    "total": 250,
    "page": 26,
    "limit": 10,
    "pages": 25
  }
}
```

### Limit inválido
- Se `limit` > 100: será limitado a 100
- Se `limit` < 1: será definido como 1
- Se `page` < 1: será definido como 1

## Implementação

A paginação está implementada no arquivo `src/utils/pagination.ts` com as funções:

- `parsePaginationParams()`: Valida e normaliza os parâmetros
- `createPaginatedResponse()`: Cria a resposta formatada
- `PaginatedResponse<T>`: Type genérico para responses

Todos os services foram atualizados para usar essas funções, garantindo consistência em toda a API.
