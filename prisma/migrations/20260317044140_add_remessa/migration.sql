-- 1) Criar tabela estoque_corte
CREATE TABLE "estoque_corte" (
  "id" TEXT NOT NULL,
  "lote_producao_id" TEXT NOT NULL,
  "produto_id" TEXT NOT NULL,
  "tamanho_id" TEXT NOT NULL,
  "quantidade_disponivel" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "estoque_corte_pkey" PRIMARY KEY ("id")
);

-- 2) Popular estoque_corte com dados existentes (lote/produto/tamanho)
WITH combinacoes AS (
  SELECT li.lote_producao_id, li.produto_id, li.tamanho_id
  FROM "lote_item" li
  UNION
  SELECT d.lote_producao_id, di.produto_id, di.tamanho_id
  FROM "direcionamento_item" di
  JOIN "direcionamento" d ON d.id = di.direcionamento_id
),
planejado AS (
  SELECT li.lote_producao_id, li.produto_id, li.tamanho_id, SUM(li.quantidade_planejada)::INT AS quantidade_planejada
  FROM "lote_item" li
  GROUP BY li.lote_producao_id, li.produto_id, li.tamanho_id
),
direcionado AS (
  SELECT d.lote_producao_id, di.produto_id, di.tamanho_id, SUM(di.quantidade)::INT AS quantidade_direcionada
  FROM "direcionamento_item" di
  JOIN "direcionamento" d ON d.id = di.direcionamento_id
  GROUP BY d.lote_producao_id, di.produto_id, di.tamanho_id
)
INSERT INTO "estoque_corte" (
  id,
  lote_producao_id,
  produto_id,
  tamanho_id,
  quantidade_disponivel,
  created_at,
  updated_at
)
SELECT
  'ec_' || md5(c.lote_producao_id || '|' || c.produto_id || '|' || c.tamanho_id),
  c.lote_producao_id,
  c.produto_id,
  c.tamanho_id,
  COALESCE(
    gs.quantidade_sobra,
    GREATEST(COALESCE(p.quantidade_planejada, 0) - COALESCE(dq.quantidade_direcionada, 0), 0)
  )::INT,
  NOW(),
  NOW()
FROM combinacoes c
LEFT JOIN planejado p
  ON p.lote_producao_id = c.lote_producao_id
   AND p.produto_id = c.produto_id
   AND p.tamanho_id = c.tamanho_id
LEFT JOIN direcionado dq
  ON dq.lote_producao_id = c.lote_producao_id
   AND dq.produto_id = c.produto_id
   AND dq.tamanho_id = c.tamanho_id
LEFT JOIN "grade_sobra" gs
  ON gs.lote_producao_id = c.lote_producao_id
   AND gs.produto_id = c.produto_id
   AND gs.tamanho_id = c.tamanho_id;

-- 3) Adicionar coluna nova como nullable para backfill
ALTER TABLE "direcionamento_item"
ADD COLUMN "estoque_corte_id" TEXT;

-- 4) Backfill do estoque_corte_id a partir do relacionamento antigo
UPDATE "direcionamento_item" di
SET "estoque_corte_id" = ec.id
FROM "direcionamento" d,
     "estoque_corte" ec
WHERE d.id = di.direcionamento_id
  AND ec.lote_producao_id = d.lote_producao_id
  AND ec.produto_id = di.produto_id
  AND ec.tamanho_id = di.tamanho_id;

-- 5) Garantir que não restou dado sem mapeamento
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "direcionamento_item"
    WHERE "estoque_corte_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Falha no backfill: existem direcionamento_item sem estoque_corte_id.';
  END IF;
END $$;

-- 6) Remover FKs/indices/colunas legadas
ALTER TABLE "direcionamento" DROP CONSTRAINT "direcionamento_lote_producao_id_fkey";
ALTER TABLE "direcionamento_item" DROP CONSTRAINT "direcionamento_item_produto_id_fkey";
ALTER TABLE "direcionamento_item" DROP CONSTRAINT "direcionamento_item_tamanho_id_fkey";
ALTER TABLE "grade_sobra" DROP CONSTRAINT "grade_sobra_lote_producao_id_fkey";
ALTER TABLE "grade_sobra" DROP CONSTRAINT "grade_sobra_produto_id_fkey";
ALTER TABLE "grade_sobra" DROP CONSTRAINT "grade_sobra_tamanho_id_fkey";

DROP INDEX "direcionamento_item_produto_id_idx";
DROP INDEX "direcionamento_item_tamanho_id_idx";

ALTER TABLE "direcionamento" DROP COLUMN "lote_producao_id";
ALTER TABLE "direcionamento_item" DROP COLUMN "produto_id";
ALTER TABLE "direcionamento_item" DROP COLUMN "tamanho_id";

ALTER TABLE "direcionamento_item"
ALTER COLUMN "estoque_corte_id" SET NOT NULL;

DROP TABLE "grade_sobra";

-- 7) Criar índices e FKs novas
CREATE INDEX "estoque_corte_lote_producao_id_idx" ON "estoque_corte"("lote_producao_id");
CREATE UNIQUE INDEX "estoque_corte_lote_producao_id_produto_id_tamanho_id_key" ON "estoque_corte"("lote_producao_id", "produto_id", "tamanho_id");
CREATE INDEX "direcionamento_item_estoque_corte_id_idx" ON "direcionamento_item"("estoque_corte_id");

ALTER TABLE "direcionamento_item"
ADD CONSTRAINT "direcionamento_item_estoque_corte_id_fkey"
FOREIGN KEY ("estoque_corte_id") REFERENCES "estoque_corte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "estoque_corte"
ADD CONSTRAINT "estoque_corte_lote_producao_id_fkey"
FOREIGN KEY ("lote_producao_id") REFERENCES "lote_producao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "estoque_corte"
ADD CONSTRAINT "estoque_corte_produto_id_fkey"
FOREIGN KEY ("produto_id") REFERENCES "produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "estoque_corte"
ADD CONSTRAINT "estoque_corte_tamanho_id_fkey"
FOREIGN KEY ("tamanho_id") REFERENCES "tamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
