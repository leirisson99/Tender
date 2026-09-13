import "dotenv/config";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { EmpresaRepositorioPrisma } from "./EmpresaRepositorioPrisma.js";
import { Empresa } from "../../domain/entidades/Empresa.js";
import { Cnpj } from "../../domain/objetosDeValor/Cnpj.js";
import { Cnae } from "../../domain/objetosDeValor/Cnae.js";
import { Regiao } from "../../domain/objetosDeValor/Regiao.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

describe("EmpresaRepositorioPrisma", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.monitoramento.deleteMany();
    await prisma.empresa.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("salvar + buscarEmpresaUnica preserva cnpj, razão social e monitoramentos", async () => {
    const repositorio = new EmpresaRepositorioPrisma(prisma);
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    empresa.adicionarMonitoramento(Cnae.criar("4120-4/00", "Construção de edifícios"), Regiao.criar("SC"));

    await repositorio.salvar(empresa);
    const recuperada = await repositorio.buscarEmpresaUnica();

    expect(recuperada).not.toBeNull();
    expect(recuperada?.cnpj.numero).toBe("12345678000195");
    expect(recuperada?.razaoSocial).toBe("Fábrica Fictícia de Exemplos Ltda");
    expect(recuperada?.monitoramentos).toHaveLength(1);
    expect(recuperada?.monitoramentos[0]?.segmento.codigo).toBe("4120-4/00");
    expect(recuperada?.monitoramentos[0]?.regiao.uf).toBe("SC");
  });

  it("existeEmpresaCadastrada retorna false com o banco vazio e true depois de salvar", async () => {
    const repositorio = new EmpresaRepositorioPrisma(prisma);

    expect(await repositorio.existeEmpresaCadastrada()).toBe(false);

    await repositorio.salvar(Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda"));

    expect(await repositorio.existeEmpresaCadastrada()).toBe(true);
  });

  it("caracterização: o índice único do Prisma não barra dois Monitoramento com município nulo e mesmo (empresaId, segmentoCodigo, uf)", async () => {
    const repositorio = new EmpresaRepositorioPrisma(prisma);
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await repositorio.salvar(empresa);

    await prisma.monitoramento.create({
      data: {
        empresaId: empresa.id,
        segmentoCodigo: "4120-4/00",
        segmentoDescricao: "Construção de edifícios",
        uf: "SC",
        municipio: null,
      },
    });

    // Não deve lançar: Postgres trata `NULL` como valor distinto em índice
    // único, então esta segunda linha com município nulo passa pelo banco
    // mesmo tendo o mesmo (empresaId, segmentoCodigo, uf) da primeira — por
    // isso a invariante de duplicidade tem que estar no domínio (Tarefa 9),
    // não só no `@@unique` (ver plano, seção 7).
    await expect(
      prisma.monitoramento.create({
        data: {
          empresaId: empresa.id,
          segmentoCodigo: "4120-4/00",
          segmentoDescricao: "Outra descrição",
          uf: "SC",
          municipio: null,
        },
      }),
    ).resolves.toBeDefined();
  });
});
