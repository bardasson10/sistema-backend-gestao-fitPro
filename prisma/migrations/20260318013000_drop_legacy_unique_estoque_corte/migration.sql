-- Remove a unique legada que impedia multiplas cores por produto+tamanho no mesmo lote
ALTER TABLE "estoque_corte"
DROP CONSTRAINT IF EXISTS "estoque_corte_lote_producao_id_produto_id_tamanho_id_key";

DROP INDEX IF EXISTS "estoque_corte_lote_producao_id_produto_id_tamanho_id_key";
