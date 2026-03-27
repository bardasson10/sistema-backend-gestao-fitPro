-- Adiciona campo de observação na tabela direcionamento
ALTER TABLE "direcionamento"
ADD COLUMN "observacao" TEXT;

-- Criar índice para melhor performance (opcional)
CREATE INDEX "direcionamento_observacao_idx" ON "direcionamento"("status", "observacao");
