import "dotenv/config";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { EditalRepositorioPrisma } from "./EditalRepositorioPrisma.js";
import { Edital } from "../../domain/entidades/Edital.js";
import { Dinheiro } from "../../domain/objetosDeValor/Dinheiro.js";
import { Regiao } from "../../domain/objetosDeValor/Regiao.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

describe("EditalRepositorioPrisma", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.edital.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("salvar + buscarUltimaVersao round-trip preserva todos os atributos", async () => {
    const repositorio = new EditalRepositorioPrisma(prisma);
    const edital = Edital.criar({
      numeroDeProcesso: "PE-0001/2026",
      orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Distrital" },
      regiao: Regiao.criar("SC", "Florianópolis"),
      objeto: "Aquisição de material de escritório fictício",
      valorEstimado: Dinheiro.criar(1500000),
      dataDePublicacao: new Date("2026-01-10T00:00:00.000Z"),
      dataDeEntregaDaProposta: new Date("2026-02-10T00:00:00.000Z"),
    });

    await repositorio.salvar(edital);
    const recuperado = await repositorio.buscarUltimaVersao(
      "PE-0001/2026",
      "Prefeitura Fictícia de Exemplópolis",
    );

    expect(recuperado).not.toBeNull();
    expect(recuperado?.id).toBe(edital.id);
    expect(recuperado?.numeroDeProcesso).toBe("PE-0001/2026");
    expect(recuperado?.orgao).toEqual({ nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Distrital" });
    expect(recuperado?.regiao.uf).toBe("SC");
    expect(recuperado?.regiao.municipio).toBe("Florianópolis");
    expect(recuperado?.objeto).toBe("Aquisição de material de escritório fictício");
    expect(recuperado?.valorEstimado.valorEmCentavos).toBe(1500000);
    expect(recuperado?.dataDePublicacao.toISOString()).toBe("2026-01-10T00:00:00.000Z");
    expect(recuperado?.dataDeEntregaDaProposta.toISOString()).toBe("2026-02-10T00:00:00.000Z");
    expect(recuperado?.segmentoInferido).toBeNull();
    expect(recuperado?.versao).toBe(1);
  });

  it("buscarUltimaVersao retorna a versão mais recente, mantendo a anterior no banco", async () => {
    const repositorio = new EditalRepositorioPrisma(prisma);
    const editalVersao1 = Edital.criar({
      numeroDeProcesso: "PE-0002/2026",
      orgao: { nome: "Secretaria Fictícia de Obras", esfera: "Estadual" },
      regiao: Regiao.criar("SC"),
      objeto: "Contratação de serviço fictício de limpeza",
      valorEstimado: Dinheiro.criar(800000),
      dataDePublicacao: new Date("2026-01-12T00:00:00.000Z"),
      dataDeEntregaDaProposta: new Date("2026-02-12T00:00:00.000Z"),
    });
    await repositorio.salvar(editalVersao1);
    const editalVersao2 = editalVersao1.criarNovaVersao({
      regiao: editalVersao1.regiao,
      objeto: editalVersao1.objeto,
      valorEstimado: Dinheiro.criar(900000),
      dataDePublicacao: editalVersao1.dataDePublicacao,
      dataDeEntregaDaProposta: editalVersao1.dataDeEntregaDaProposta,
    });
    await repositorio.salvar(editalVersao2);

    const recuperado = await repositorio.buscarUltimaVersao(
      "PE-0002/2026",
      "Secretaria Fictícia de Obras",
    );

    expect(recuperado?.versao).toBe(2);
    expect(recuperado?.valorEstimado.valorEmCentavos).toBe(900000);
    const totalDeLinhas = await prisma.edital.count({ where: { editalId: editalVersao1.id } });
    expect(totalDeLinhas).toBe(2);
  });
});
