-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monitoramento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "segmentoCodigo" TEXT NOT NULL,
    "segmentoDescricao" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "municipio" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Monitoramento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Monitoramento_empresaId_segmentoCodigo_uf_municipio_key" ON "Monitoramento"("empresaId", "segmentoCodigo", "uf", "municipio");

-- AddForeignKey
ALTER TABLE "Monitoramento" ADD CONSTRAINT "Monitoramento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
