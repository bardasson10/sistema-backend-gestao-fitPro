-- Reconciliacao do schema de conferencia para o modelo atual
-- 1) conferencia.status_qualidade -> conferencia.status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conferencia'
      AND column_name = 'status_qualidade'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conferencia'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE "conferencia" RENAME COLUMN "status_qualidade" TO "status";
  END IF;
END $$;

-- 2) conferencia_item.tamanho_id -> conferencia_item.direcionamento_item_id (com backfill)
ALTER TABLE "conferencia_item"
ADD COLUMN IF NOT EXISTS "direcionamento_item_id" TEXT;

WITH candidatos AS (
  SELECT
    ci.id AS conferencia_item_id,
    MIN(di.id) AS direcionamento_item_id,
    COUNT(*) AS total_matches
  FROM "conferencia_item" ci
  JOIN "conferencia" c ON c.id = ci.conferencia_id
  JOIN "direcionamento_item" di ON di.direcionamento_id = c.direcionamento_id
  JOIN "estoque_corte" ec ON ec.id = di.estoque_corte_id
  WHERE ci.direcionamento_item_id IS NULL
    AND ci.tamanho_id IS NOT NULL
    AND ec.tamanho_id = ci.tamanho_id
  GROUP BY ci.id
)
UPDATE "conferencia_item" ci
SET "direcionamento_item_id" = cand.direcionamento_item_id
FROM candidatos cand
WHERE ci.id = cand.conferencia_item_id
  AND cand.total_matches = 1
  AND ci.direcionamento_item_id IS NULL;

DO $$
DECLARE
  pendentes INTEGER;
BEGIN
  SELECT COUNT(*)
    INTO pendentes
  FROM "conferencia_item"
  WHERE "direcionamento_item_id" IS NULL;

  IF pendentes > 0 THEN
    RAISE EXCEPTION 'Nao foi possivel mapear % registro(s) de conferencia_item para direcionamento_item. Resolva manualmente antes de concluir a migracao.', pendentes;
  END IF;
END $$;

-- 3) Ajustar constraints e remover coluna legado
ALTER TABLE "conferencia_item"
DROP CONSTRAINT IF EXISTS "conferencia_item_tamanho_id_fkey";

ALTER TABLE "conferencia_item"
ALTER COLUMN "direcionamento_item_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "conferencia_item_direcionamento_item_id_idx"
ON "conferencia_item"("direcionamento_item_id");

ALTER TABLE "conferencia_item"
ADD CONSTRAINT "conferencia_item_direcionamento_item_id_fkey"
FOREIGN KEY ("direcionamento_item_id") REFERENCES "direcionamento_item"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "conferencia_item"
DROP COLUMN IF EXISTS "tamanho_id";
