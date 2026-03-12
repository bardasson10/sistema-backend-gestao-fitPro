-- CreateTable
CREATE TABLE "direcionamento_item" (
    "id" TEXT NOT NULL,
    "direcionamento_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "tamanho_id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "direcionamento_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_sobra" (
    "id" TEXT NOT NULL,
    "lote_producao_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "tamanho_id" TEXT NOT NULL,
    "quantidade_sobra" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_sobra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "direcionamento_item_direcionamento_id_idx" ON "direcionamento_item"("direcionamento_id");

-- CreateIndex
CREATE INDEX "direcionamento_item_produto_id_idx" ON "direcionamento_item"("produto_id");

-- CreateIndex
CREATE INDEX "direcionamento_item_tamanho_id_idx" ON "direcionamento_item"("tamanho_id");

-- CreateIndex
CREATE INDEX "grade_sobra_lote_producao_id_idx" ON "grade_sobra"("lote_producao_id");

-- CreateIndex
CREATE UNIQUE INDEX "grade_sobra_lote_producao_id_produto_id_tamanho_id_key" ON "grade_sobra"("lote_producao_id", "produto_id", "tamanho_id");

-- AddForeignKey
ALTER TABLE "direcionamento_item" ADD CONSTRAINT "direcionamento_item_direcionamento_id_fkey" FOREIGN KEY ("direcionamento_id") REFERENCES "direcionamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcionamento_item" ADD CONSTRAINT "direcionamento_item_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcionamento_item" ADD CONSTRAINT "direcionamento_item_tamanho_id_fkey" FOREIGN KEY ("tamanho_id") REFERENCES "tamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_sobra" ADD CONSTRAINT "grade_sobra_lote_producao_id_fkey" FOREIGN KEY ("lote_producao_id") REFERENCES "lote_producao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_sobra" ADD CONSTRAINT "grade_sobra_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_sobra" ADD CONSTRAINT "grade_sobra_tamanho_id_fkey" FOREIGN KEY ("tamanho_id") REFERENCES "tamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
