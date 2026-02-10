-- CreateTable
CREATE TABLE "lote_rolo" (
    "id" TEXT NOT NULL,
    "lote_producao_id" TEXT NOT NULL,
    "estoque_rolo_id" TEXT NOT NULL,
    "peso_reservado" DECIMAL(10,3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lote_rolo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lote_rolo_lote_producao_id_idx" ON "lote_rolo"("lote_producao_id");

-- CreateIndex
CREATE INDEX "lote_rolo_estoque_rolo_id_idx" ON "lote_rolo"("estoque_rolo_id");

-- AddForeignKey
ALTER TABLE "lote_rolo" ADD CONSTRAINT "lote_rolo_lote_producao_id_fkey" FOREIGN KEY ("lote_producao_id") REFERENCES "lote_producao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_rolo" ADD CONSTRAINT "lote_rolo_estoque_rolo_id_fkey" FOREIGN KEY ("estoque_rolo_id") REFERENCES "estoque_rolo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
