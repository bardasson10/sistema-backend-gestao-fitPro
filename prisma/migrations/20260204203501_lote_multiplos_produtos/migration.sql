/*
  Warnings:

  - You are about to drop the column `produto_id` on the `lote_producao` table. All the data in the column will be lost.
  - Added the required column `produto_id` to the `lote_item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "lote_producao" DROP CONSTRAINT "lote_producao_produto_id_fkey";

-- AlterTable
ALTER TABLE "lote_item" ADD COLUMN     "produto_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "lote_producao" DROP COLUMN "produto_id";

-- AddForeignKey
ALTER TABLE "lote_item" ADD CONSTRAINT "lote_item_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
