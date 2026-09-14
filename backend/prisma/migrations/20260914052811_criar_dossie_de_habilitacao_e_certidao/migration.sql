-- CreateTable
CREATE TABLE "DossieDeHabilitacao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "DossieDeHabilitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certidao" (
    "id" TEXT NOT NULL,
    "dossieDeHabilitacaoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataDeEmissao" TIMESTAMP(3) NOT NULL,
    "dataDeValidade" TIMESTAMP(3) NOT NULL,
    "arquivoCaminho" TEXT NOT NULL,
    "arquivoNomeOriginal" TEXT NOT NULL,
    "arquivoEnviadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certidao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DossieDeHabilitacao_empresaId_key" ON "DossieDeHabilitacao"("empresaId");

-- AddForeignKey
ALTER TABLE "DossieDeHabilitacao" ADD CONSTRAINT "DossieDeHabilitacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certidao" ADD CONSTRAINT "Certidao_dossieDeHabilitacaoId_fkey" FOREIGN KEY ("dossieDeHabilitacaoId") REFERENCES "DossieDeHabilitacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
