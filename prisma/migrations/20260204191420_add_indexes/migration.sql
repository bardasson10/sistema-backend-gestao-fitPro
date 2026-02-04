-- CreateIndex
CREATE INDEX "conferencia_data_conferencia_idx" ON "conferencia"("data_conferencia");

-- CreateIndex
CREATE INDEX "direcionamento_status_idx" ON "direcionamento"("status");

-- CreateIndex
CREATE INDEX "estoque_rolo_tecido_id_idx" ON "estoque_rolo"("tecido_id");

-- CreateIndex
CREATE INDEX "estoque_rolo_situacao_idx" ON "estoque_rolo"("situacao");

-- CreateIndex
CREATE INDEX "lote_producao_status_idx" ON "lote_producao"("status");

-- CreateIndex
CREATE INDEX "movimentacao_estoque_estoque_rolo_id_idx" ON "movimentacao_estoque"("estoque_rolo_id");

-- CreateIndex
CREATE INDEX "movimentacao_estoque_usuario_id_idx" ON "movimentacao_estoque"("usuario_id");

-- CreateIndex
CREATE INDEX "movimentacao_estoque_created_at_idx" ON "movimentacao_estoque"("created_at");
