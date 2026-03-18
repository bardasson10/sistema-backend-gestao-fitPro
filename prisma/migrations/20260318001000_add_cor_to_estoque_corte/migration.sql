-- Adiciona segregacao de estoque de corte por cor
ALTER TABLE "estoque_corte"
ADD COLUMN "cor_id" TEXT;

-- Backfill dos registros existentes com base na cor do tecido do lote
UPDATE "estoque_corte" ec
SET "cor_id" = t."cor_id"
FROM "lote_producao" lp
JOIN "tecido" t ON t."id" = lp."tecido_id"
WHERE ec."lote_producao_id" = lp."id"
  AND ec."cor_id" IS NULL;

ALTER TABLE "estoque_corte"
ALTER COLUMN "cor_id" SET NOT NULL;

ALTER TABLE "estoque_corte"
ADD CONSTRAINT "estoque_corte_cor_id_fkey"
FOREIGN KEY ("cor_id") REFERENCES "cor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "estoque_corte_lote_producao_id_produto_id_tamanho_id_key";

CREATE UNIQUE INDEX "estoque_corte_lote_producao_id_produto_id_tamanho_id_cor_id_key"
ON "estoque_corte"("lote_producao_id", "produto_id", "tamanho_id", "cor_id");

CREATE INDEX "estoque_corte_cor_id_idx"
ON "estoque_corte"("cor_id");
