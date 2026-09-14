import "dotenv/config";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { AlertaRepositorioPrisma } from "./AlertaRepositorioPrisma.js";
import { Alerta } from "../../domain/entidades/Alerta.js";
import { Empresa } from "../../domain/entidades/Empresa.js";
import { Cnpj } from "../../domain/objetosDeValor/Cnpj.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

describe("AlertaRepositorioPrisma", () => {
  let empresaIdCriada: string | null = null;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    if (empresaIdCriada !== null) {
      await prisma.alerta.deleteMany({ where: { empresaId: empresaIdCriada } });
      await prisma.empresa.deleteMany({ where: { id: empresaIdCriada } });
      empresaIdCriada = null;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("salvar + existeAlertaAtivo: Alerta Pendente conta como ativo, Alerta FalhouNoEnvio não", async () => {
    const empresa = Empresa.criar(Cnpj.criar("11444555000149"), "Fábrica Fictícia de Alertas Ltda");
    empresaIdCriada = empresa.id;
    await prisma.empresa.create({
      data: { id: empresa.id, cnpj: empresa.cnpj.numero, razaoSocial: empresa.razaoSocial },
    });

    const repositorio = new AlertaRepositorioPrisma(prisma);

    const origemPendente = { tipo: "Edital" as const, id: "PE-0001/2026::Orgao Fictício" };
    await repositorio.salvar(Alerta.criar(empresa.id, "EditalCompativel", origemPendente));

    const origemFalhou = { tipo: "Certidao" as const, id: crypto.randomUUID() };
    const alertaQueFalhou = Alerta.reconstituir(
      crypto.randomUUID(),
      empresa.id,
      "CertidaoVencida",
      origemFalhou,
      "WhatsApp",
      "FalhouNoEnvio",
      null,
    );
    await repositorio.salvar(alertaQueFalhou);

    const ativoParaPendente = await repositorio.existeAlertaAtivo(empresa.id, "EditalCompativel", origemPendente);
    const ativoParaFalhou = await repositorio.existeAlertaAtivo(empresa.id, "CertidaoVencida", origemFalhou);

    expect(ativoParaPendente).toBe(true);
    expect(ativoParaFalhou).toBe(false);
  });
});
