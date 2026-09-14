import "dotenv/config";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { EditalRepositorioPrisma } from "./EditalRepositorioPrisma.js";
import { Edital } from "../../domain/entidades/Edital.js";
import { Dinheiro } from "../../domain/objetosDeValor/Dinheiro.js";
import { Regiao } from "../../domain/objetosDeValor/Regiao.js";
import { Cnae } from "../../domain/objetosDeValor/Cnae.js";

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
      classificacaoDoItem: { codigo: "7890", descricao: "Material fictício" },
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
    expect(recuperado?.classificacaoDoItem).toEqual({ codigo: "7890", descricao: "Material fictício" });
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

  it("listarPendentesDeCompatibilidade retorna só a versão mais recente de cada Edital com classificação nula", async () => {
    const repositorio = new EditalRepositorioPrisma(prisma);

    const editalPendente = Edital.criar({
      numeroDeProcesso: "PE-0003/2026",
      orgao: { nome: "Câmara Fictícia de Vereadores", esfera: "Municipal" },
      regiao: Regiao.criar("SC"),
      objeto: "Aquisição de material fictício",
      valorEstimado: Dinheiro.criar(500000),
      dataDePublicacao: new Date("2026-01-05T00:00:00.000Z"),
      dataDeEntregaDaProposta: new Date("2026-02-05T00:00:00.000Z"),
    });
    await repositorio.salvar(editalPendente);

    const editalJaCompativelVersao1 = Edital.criar({
      numeroDeProcesso: "PE-0004/2026",
      orgao: { nome: "Fundação Fictícia de Cultura", esfera: "Municipal" },
      regiao: Regiao.criar("SC"),
      objeto: "Contratação de serviço fictício de eventos",
      valorEstimado: Dinheiro.criar(700000),
      dataDePublicacao: new Date("2026-01-06T00:00:00.000Z"),
      dataDeEntregaDaProposta: new Date("2026-02-06T00:00:00.000Z"),
    });
    await repositorio.salvar(editalJaCompativelVersao1);
    const editalComVersaoAntigaPendente = editalJaCompativelVersao1.criarNovaVersao({
      regiao: editalJaCompativelVersao1.regiao,
      objeto: editalJaCompativelVersao1.objeto,
      valorEstimado: editalJaCompativelVersao1.valorEstimado,
      dataDePublicacao: editalJaCompativelVersao1.dataDePublicacao,
      dataDeEntregaDaProposta: editalJaCompativelVersao1.dataDeEntregaDaProposta,
    });
    const editalJaCompativelVersao2 = editalComVersaoAntigaPendente.marcarComoCompativel(
      Cnae.criar("9001-9/01", "Artes cênicas"),
    );
    await repositorio.salvar(editalJaCompativelVersao2);

    const pendentes = await repositorio.listarPendentesDeCompatibilidade();

    expect(pendentes.map((edital) => edital.numeroDeProcesso)).toEqual(["PE-0003/2026"]);
  });

  it("atualizarClassificacao faz UPDATE na mesma linha, sem inserir versão nova", async () => {
    const repositorio = new EditalRepositorioPrisma(prisma);
    const edital = Edital.criar({
      numeroDeProcesso: "PE-0005/2026",
      orgao: { nome: "Instituto Fictício de Pesquisa", esfera: "Federal" },
      regiao: Regiao.criar("SC"),
      objeto: "Aquisição de equipamento fictício de laboratório",
      valorEstimado: Dinheiro.criar(300000),
      dataDePublicacao: new Date("2026-01-08T00:00:00.000Z"),
      dataDeEntregaDaProposta: new Date("2026-02-08T00:00:00.000Z"),
    });
    await repositorio.salvar(edital);

    const cnae = Cnae.criar("7211-0/00", "Pesquisa e desenvolvimento experimental");
    await repositorio.atualizarClassificacao(edital.marcarComoCompativel(cnae));

    const atualizado = await repositorio.buscarUltimaVersao(
      "PE-0005/2026",
      "Instituto Fictício de Pesquisa",
    );
    expect(atualizado?.segmentoInferido?.codigo).toBe("7211-0/00");
    expect(atualizado?.id).toBe(edital.id);
    expect(atualizado?.versao).toBe(1);
    const totalDeLinhas = await prisma.edital.count({ where: { editalId: edital.id } });
    expect(totalDeLinhas).toBe(1);
  });

  it("listarCompativeis retorna só a última versão de cada Edital com segmentoInferido preenchido", async () => {
    const repositorio = new EditalRepositorioPrisma(prisma);

    const editalNaoCompativel = Edital.criar({
      numeroDeProcesso: "PE-0006/2026",
      orgao: { nome: "Autarquia Fictícia de Trânsito", esfera: "Municipal" },
      regiao: Regiao.criar("SC"),
      objeto: "Aquisição de material fictício de sinalização",
      valorEstimado: Dinheiro.criar(400000),
      dataDePublicacao: new Date("2026-01-07T00:00:00.000Z"),
      dataDeEntregaDaProposta: new Date("2026-02-07T00:00:00.000Z"),
    });
    await repositorio.salvar(editalNaoCompativel);

    const editalCompativelVersao1 = Edital.criar({
      numeroDeProcesso: "PE-0007/2026",
      orgao: { nome: "Departamento Fictício de Águas", esfera: "Estadual" },
      regiao: Regiao.criar("SC"),
      objeto: "Contratação de serviço fictício de saneamento",
      valorEstimado: Dinheiro.criar(600000),
      dataDePublicacao: new Date("2026-01-09T00:00:00.000Z"),
      dataDeEntregaDaProposta: new Date("2026-02-09T00:00:00.000Z"),
    }).marcarComoCompativel(Cnae.criar("3600-6/01", "Captação, tratamento e distribuição de água"));
    await repositorio.salvar(editalCompativelVersao1);
    const editalCompativelVersao2SemClassificacao = editalCompativelVersao1.criarNovaVersao({
      regiao: editalCompativelVersao1.regiao,
      objeto: editalCompativelVersao1.objeto,
      valorEstimado: editalCompativelVersao1.valorEstimado,
      dataDePublicacao: editalCompativelVersao1.dataDePublicacao,
      dataDeEntregaDaProposta: editalCompativelVersao1.dataDeEntregaDaProposta,
    });
    await repositorio.salvar(editalCompativelVersao2SemClassificacao);
    await repositorio.atualizarClassificacao(
      editalCompativelVersao2SemClassificacao.marcarComoCompativel(
        Cnae.criar("3600-6/01", "Captação, tratamento e distribuição de água"),
      ),
    );

    const compativeis = await repositorio.listarCompativeis();

    expect(compativeis.map((edital) => edital.numeroDeProcesso)).toEqual(["PE-0007/2026"]);
    expect(compativeis[0]?.versao).toBe(2);
  });
});
