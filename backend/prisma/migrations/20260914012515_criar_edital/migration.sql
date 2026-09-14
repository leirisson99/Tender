-- CreateTable
CREATE TABLE "Edital" (
    "id" TEXT NOT NULL,
    "editalId" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "numeroDeProcesso" TEXT NOT NULL,
    "nomeDoOrgao" TEXT NOT NULL,
    "esfera" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "municipio" TEXT,
    "objeto" TEXT NOT NULL,
    "valorEstimadoEmCentavos" INTEGER NOT NULL,
    "dataDePublicacao" TIMESTAMP(3) NOT NULL,
    "dataDeEntregaDaProposta" TIMESTAMP(3) NOT NULL,
    "segmentoInferidoCodigo" TEXT,
    "segmentoInferidoDescricao" TEXT,

    CONSTRAINT "Edital_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Edital_editalId_versao_key" ON "Edital"("editalId", "versao");
