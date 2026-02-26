  -- CreateTable
CREATE TABLE "enfesto" (
    "id" TEXT NOT NULL,
    "lote_item_id" TEXT NOT NULL,
    "cor" VARCHAR(25) NOT NULL,
    "qtd_folhas" INTEGER NOT NULL,
    "created_at" DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT "enfesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enfesto_rolo" (
    "id" TEXT NOT NULL,
    "enfesto_id" TEXT NOT NULL,
    "estoque_rolo_id" TEXT NOT NULL,
    "peso_reservado" DECIMAL(10,3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enfesto_rolo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enfesto_lote_item_id_idx" ON "enfesto"("lote_item_id");

-- CreateIndex
CREATE INDEX "enfesto_rolo_enfesto_id_idx" ON "enfesto_rolo"("enfesto_id");

-- CreateIndex
CREATE INDEX "enfesto_rolo_estoque_rolo_id_idx" ON "enfesto_rolo"("estoque_rolo_id");

-- AddForeignKey
ALTER TABLE "enfesto" ADD CONSTRAINT "enfesto_lote_item_id_fkey" FOREIGN KEY ("lote_item_id") REFERENCES "lote_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enfesto_rolo" ADD CONSTRAINT "enfesto_rolo_enfesto_id_fkey" FOREIGN KEY ("enfesto_id") REFERENCES "enfesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enfesto_rolo" ADD CONSTRAINT "enfesto_rolo_estoque_rolo_id_fkey" FOREIGN KEY ("estoque_rolo_id") REFERENCES "estoque_rolo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
