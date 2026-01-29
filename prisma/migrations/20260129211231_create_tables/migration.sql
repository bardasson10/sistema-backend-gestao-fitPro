-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADM', 'GERENTE', 'FUNCIONARIO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'FUNCIONARIO',
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "funcao_setor" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_produto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipo_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto" (
    "id" TEXT NOT NULL,
    "tipo_produto_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "fabricante" TEXT,
    "custo_medio_peca" DECIMAL(10,2),
    "preco_medio_venda" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tamanho" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "tamanho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_produto_tamanho" (
    "id" TEXT NOT NULL,
    "tipo_produto_id" TEXT NOT NULL,
    "tamanho_id" TEXT NOT NULL,

    CONSTRAINT "tipo_produto_tamanho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "contato" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo_hex" TEXT,

    CONSTRAINT "cor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tecido" (
    "id" TEXT NOT NULL,
    "fornecedor_id" TEXT NOT NULL,
    "cor_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo_referencia" TEXT,
    "rendimento_metro_kg" DECIMAL(10,3),
    "largura_metros" DECIMAL(10,2),
    "valor_por_kg" DECIMAL(10,2),
    "gramatura" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tecido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque_rolo" (
    "id" TEXT NOT NULL,
    "tecido_id" TEXT NOT NULL,
    "codigo_barra_rolo" TEXT,
    "peso_inicial_kg" DECIMAL(10,3) NOT NULL,
    "peso_atual_kg" DECIMAL(10,3) NOT NULL,
    "situacao" TEXT NOT NULL DEFAULT 'disponivel',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoque_rolo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacao_estoque" (
    "id" TEXT NOT NULL,
    "estoque_rolo_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo_movimentacao" TEXT NOT NULL,
    "peso_movimentado" DECIMAL(10,3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacao_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faccao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "responsavel" TEXT,
    "contato" TEXT,
    "prazo_medio_dias" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faccao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lote_producao" (
    "id" TEXT NOT NULL,
    "codigo_lote" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "tecido_id" TEXT NOT NULL,
    "responsavel_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lote_producao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lote_item" (
    "id" TEXT NOT NULL,
    "lote_producao_id" TEXT NOT NULL,
    "tamanho_id" TEXT NOT NULL,
    "quantidade_planejada" INTEGER NOT NULL,

    CONSTRAINT "lote_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direcionamento" (
    "id" TEXT NOT NULL,
    "lote_producao_id" TEXT NOT NULL,
    "faccao_id" TEXT NOT NULL,
    "tipo_servico" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'enviado',
    "data_saida" DATE,
    "data_previsao_retorno" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direcionamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conferencia" (
    "id" TEXT NOT NULL,
    "direcionamento_id" TEXT NOT NULL,
    "responsavel_id" TEXT NOT NULL,
    "data_conferencia" DATE,
    "observacao" TEXT,
    "liberado_pagamento" BOOLEAN NOT NULL DEFAULT false,
    "status_qualidade" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conferencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conferencia_item" (
    "id" TEXT NOT NULL,
    "conferencia_id" TEXT NOT NULL,
    "tamanho_id" TEXT NOT NULL,
    "qtd_recebida" INTEGER NOT NULL,
    "qtd_defeito" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "conferencia_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "produto_sku_key" ON "produto"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_produto_tamanho_tipo_produto_id_tamanho_id_key" ON "tipo_produto_tamanho"("tipo_produto_id", "tamanho_id");

-- CreateIndex
CREATE UNIQUE INDEX "estoque_rolo_codigo_barra_rolo_key" ON "estoque_rolo"("codigo_barra_rolo");

-- CreateIndex
CREATE UNIQUE INDEX "lote_producao_codigo_lote_key" ON "lote_producao"("codigo_lote");

-- AddForeignKey
ALTER TABLE "produto" ADD CONSTRAINT "produto_tipo_produto_id_fkey" FOREIGN KEY ("tipo_produto_id") REFERENCES "tipo_produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipo_produto_tamanho" ADD CONSTRAINT "tipo_produto_tamanho_tipo_produto_id_fkey" FOREIGN KEY ("tipo_produto_id") REFERENCES "tipo_produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipo_produto_tamanho" ADD CONSTRAINT "tipo_produto_tamanho_tamanho_id_fkey" FOREIGN KEY ("tamanho_id") REFERENCES "tamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tecido" ADD CONSTRAINT "tecido_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tecido" ADD CONSTRAINT "tecido_cor_id_fkey" FOREIGN KEY ("cor_id") REFERENCES "cor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_rolo" ADD CONSTRAINT "estoque_rolo_tecido_id_fkey" FOREIGN KEY ("tecido_id") REFERENCES "tecido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao_estoque" ADD CONSTRAINT "movimentacao_estoque_estoque_rolo_id_fkey" FOREIGN KEY ("estoque_rolo_id") REFERENCES "estoque_rolo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao_estoque" ADD CONSTRAINT "movimentacao_estoque_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_producao" ADD CONSTRAINT "lote_producao_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_producao" ADD CONSTRAINT "lote_producao_tecido_id_fkey" FOREIGN KEY ("tecido_id") REFERENCES "tecido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_producao" ADD CONSTRAINT "lote_producao_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_item" ADD CONSTRAINT "lote_item_lote_producao_id_fkey" FOREIGN KEY ("lote_producao_id") REFERENCES "lote_producao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_item" ADD CONSTRAINT "lote_item_tamanho_id_fkey" FOREIGN KEY ("tamanho_id") REFERENCES "tamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcionamento" ADD CONSTRAINT "direcionamento_lote_producao_id_fkey" FOREIGN KEY ("lote_producao_id") REFERENCES "lote_producao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcionamento" ADD CONSTRAINT "direcionamento_faccao_id_fkey" FOREIGN KEY ("faccao_id") REFERENCES "faccao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conferencia" ADD CONSTRAINT "conferencia_direcionamento_id_fkey" FOREIGN KEY ("direcionamento_id") REFERENCES "direcionamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conferencia" ADD CONSTRAINT "conferencia_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conferencia_item" ADD CONSTRAINT "conferencia_item_conferencia_id_fkey" FOREIGN KEY ("conferencia_id") REFERENCES "conferencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conferencia_item" ADD CONSTRAINT "conferencia_item_tamanho_id_fkey" FOREIGN KEY ("tamanho_id") REFERENCES "tamanho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
