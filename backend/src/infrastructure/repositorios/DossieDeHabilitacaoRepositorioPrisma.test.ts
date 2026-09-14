import "dotenv/config";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { DossieDeHabilitacaoRepositorioPrisma } from "./DossieDeHabilitacaoRepositorioPrisma.js";
import { DossieDeHabilitacao } from "../../domain/entidades/DossieDeHabilitacao.js";
import { Empresa } from "../../domain/entidades/Empresa.js";
import { Cnpj } from "../../domain/objetosDeValor/Cnpj.js";
import { PeriodoDeValidade } from "../../domain/objetosDeValor/PeriodoDeValidade.js";
import { ReferenciaDeArquivo } from "../../domain/objetosDeValor/ReferenciaDeArquivo.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

describe("DossieDeHabilitacaoRepositorioPrisma", () => {
  let empresaIdCriada: string | null = null;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    if (empresaIdCriada !== null) {
      await prisma.certidao.deleteMany({ where: { dossieDeHabilitacao: { empresaId: empresaIdCriada } } });
      await prisma.dossieDeHabilitacao.deleteMany({ where: { empresaId: empresaIdCriada } });
      await prisma.empresa.deleteMany({ where: { id: empresaIdCriada } });
      empresaIdCriada = null;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("salvar + buscarPorEmpresaId round-trip preserva múltiplas Certidões, incluindo duas do mesmo tipo", async () => {
    const empresa = Empresa.criar(Cnpj.criar("11222333000181"), "Fábrica Fictícia de Certidões Ltda");
    empresaIdCriada = empresa.id;
    await prisma.empresa.create({
      data: { id: empresa.id, cnpj: empresa.cnpj.numero, razaoSocial: empresa.razaoSocial },
    });

    const repositorio = new DossieDeHabilitacaoRepositorioPrisma(prisma);
    const dossie = DossieDeHabilitacao.criar(empresa.id);
    const arquivo1 = ReferenciaDeArquivo.criar("uploads/1.pdf", "certidao-1.pdf", new Date("2026-01-01T00:00:00.000Z"));
    const arquivo2 = ReferenciaDeArquivo.criar("uploads/2.pdf", "certidao-2.pdf", new Date("2026-01-02T00:00:00.000Z"));
    dossie.adicionarCertidao(
      "CndFederal",
      PeriodoDeValidade.criar(new Date("2025-01-01T00:00:00.000Z"), new Date("2026-01-01T00:00:00.000Z")),
      arquivo1,
    );
    dossie.adicionarCertidao(
      "CndFederal",
      PeriodoDeValidade.criar(new Date("2026-01-01T00:00:00.000Z"), new Date("2027-01-01T00:00:00.000Z")),
      arquivo2,
    );

    await repositorio.salvar(dossie);
    const recuperado = await repositorio.buscarPorEmpresaId(empresa.id);

    expect(recuperado).not.toBeNull();
    expect(recuperado?.empresaId).toBe(empresa.id);
    expect(recuperado?.certidoes).toHaveLength(2);
    const tipos = recuperado?.certidoes.map((certidao) => certidao.tipo);
    expect(tipos).toEqual(["CndFederal", "CndFederal"]);
    const certidaoRecuperada = recuperado?.certidoes[0];
    expect(certidaoRecuperada?.periodoDeValidade.dataDeEmissao.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(certidaoRecuperada?.arquivo.nomeOriginal).toBe("certidao-1.pdf");
  });
});
