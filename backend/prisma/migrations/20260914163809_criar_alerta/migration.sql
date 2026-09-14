-- CreateTable
CREATE TABLE "Alerta" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "origemTipo" TEXT NOT NULL,
    "origemId" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "momentoDeEnvio" TIMESTAMP(3),

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Alerta_empresaId_tipo_origemTipo_origemId_idx" ON "Alerta"("empresaId", "tipo", "origemTipo", "origemId");

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
