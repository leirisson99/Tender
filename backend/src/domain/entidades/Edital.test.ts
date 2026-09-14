import { describe, expect, it } from "vitest";
import { Edital } from "./Edital.js";
import { Dinheiro } from "../objetosDeValor/Dinheiro.js";
import { Regiao } from "../objetosDeValor/Regiao.js";
import { Cnae } from "../objetosDeValor/Cnae.js";

describe("Edital.criar", () => {
  it("gera id determinístico, segmentoInferido nulo e versão 1", () => {
    const edital = Edital.criar({
      numeroDeProcesso: "PE-0042/2026",
      orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Distrital" },
      regiao: Regiao.criar("SC"),
      objeto: "Aquisição de material de escritório fictício",
      valorEstimado: Dinheiro.criar(1500000),
      dataDePublicacao: new Date("2026-01-10"),
      dataDeEntregaDaProposta: new Date("2026-02-10"),
    });

    expect(edital.id).toBe("PE-0042/2026::Prefeitura Fictícia de Exemplópolis");
    expect(edital.segmentoInferido).toBeNull();
    expect(edital.versao).toBe(1);
  });

  it("aceita classificacaoDoItem opcional, default null quando ausente", () => {
    const dadosBase = {
      numeroDeProcesso: "PE-0042/2026",
      orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Distrital" as const },
      regiao: Regiao.criar("SC"),
      objeto: "Aquisição de material de escritório fictício",
      valorEstimado: Dinheiro.criar(1500000),
      dataDePublicacao: new Date("2026-01-10"),
      dataDeEntregaDaProposta: new Date("2026-02-10"),
    };

    const semClassificacao = Edital.criar(dadosBase);
    expect(semClassificacao.classificacaoDoItem).toBeNull();

    const comClassificacao = Edital.criar({
      ...dadosBase,
      classificacaoDoItem: { codigo: "7890", descricao: "Material fictício" },
    });
    expect(comClassificacao.classificacaoDoItem).toEqual({ codigo: "7890", descricao: "Material fictício" });
  });
});

describe("Edital.temMesmoConteudoQue", () => {
  it("retorna true quando objeto, valor, datas e região são idênticos", () => {
    const dadosOriginais = {
      numeroDeProcesso: "PE-0042/2026",
      orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Distrital" as const },
      regiao: Regiao.criar("SC"),
      objeto: "Aquisição de material de escritório fictício",
      valorEstimado: Dinheiro.criar(1500000),
      dataDePublicacao: new Date("2026-01-10"),
      dataDeEntregaDaProposta: new Date("2026-02-10"),
    };
    const edital = Edital.criar(dadosOriginais);

    const mesmoConteudo = edital.temMesmoConteudoQue({
      objeto: "Aquisição de material de escritório fictício",
      valorEstimado: Dinheiro.criar(1500000),
      dataDePublicacao: new Date("2026-01-10"),
      dataDeEntregaDaProposta: new Date("2026-02-10"),
      regiao: Regiao.criar("SC"),
    });

    expect(mesmoConteudo).toBe(true);
  });

  it("retorna false quando objeto, valor, datas ou região mudam, um de cada vez", () => {
    const edital = Edital.criar({
      numeroDeProcesso: "PE-0042/2026",
      orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Distrital" as const },
      regiao: Regiao.criar("SC"),
      objeto: "Aquisição de material de escritório fictício",
      valorEstimado: Dinheiro.criar(1500000),
      dataDePublicacao: new Date("2026-01-10"),
      dataDeEntregaDaProposta: new Date("2026-02-10"),
    });
    const conteudoBase = {
      objeto: "Aquisição de material de escritório fictício",
      valorEstimado: Dinheiro.criar(1500000),
      dataDePublicacao: new Date("2026-01-10"),
      dataDeEntregaDaProposta: new Date("2026-02-10"),
      regiao: Regiao.criar("SC"),
    };

    expect(edital.temMesmoConteudoQue({ ...conteudoBase, objeto: "Outro objeto fictício" })).toBe(false);
    expect(edital.temMesmoConteudoQue({ ...conteudoBase, valorEstimado: Dinheiro.criar(999999) })).toBe(false);
    expect(edital.temMesmoConteudoQue({ ...conteudoBase, dataDePublicacao: new Date("2026-01-11") })).toBe(false);
    expect(
      edital.temMesmoConteudoQue({ ...conteudoBase, dataDeEntregaDaProposta: new Date("2026-02-11") }),
    ).toBe(false);
    expect(edital.temMesmoConteudoQue({ ...conteudoBase, regiao: Regiao.criar("PR") })).toBe(false);
  });
});

describe("Edital.criarNovaVersao", () => {
  it("incrementa a versão, preserva o id e mantém segmentoInferido nulo", () => {
    const edital = Edital.criar({
      numeroDeProcesso: "PE-0042/2026",
      orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Distrital" as const },
      regiao: Regiao.criar("SC"),
      objeto: "Aquisição de material de escritório fictício",
      valorEstimado: Dinheiro.criar(1500000),
      dataDePublicacao: new Date("2026-01-10"),
      dataDeEntregaDaProposta: new Date("2026-02-10"),
    });

    const novaVersao = edital.criarNovaVersao({
      objeto: "Aquisição de material de escritório fictício — retificado",
      valorEstimado: Dinheiro.criar(1600000),
      dataDePublicacao: new Date("2026-01-10"),
      dataDeEntregaDaProposta: new Date("2026-02-20"),
      regiao: Regiao.criar("SC"),
    });

    expect(novaVersao.versao).toBe(2);
    expect(novaVersao.id).toBe(edital.id);
    expect(novaVersao.segmentoInferido).toBeNull();
    expect(novaVersao.objeto).toBe("Aquisição de material de escritório fictício — retificado");
  });

  it("aceita classificacaoDoItem no novo conteúdo, sem herdar da versão anterior", () => {
    const edital = Edital.criar({
      numeroDeProcesso: "PE-0042/2026",
      orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Distrital" as const },
      regiao: Regiao.criar("SC"),
      objeto: "Aquisição de material de escritório fictício",
      valorEstimado: Dinheiro.criar(1500000),
      dataDePublicacao: new Date("2026-01-10"),
      dataDeEntregaDaProposta: new Date("2026-02-10"),
      classificacaoDoItem: { codigo: "7890", descricao: "Material fictício antigo" },
    });

    const conteudoBase = {
      objeto: "Aquisição de material de escritório fictício",
      valorEstimado: Dinheiro.criar(1500000),
      dataDePublicacao: new Date("2026-01-10"),
      dataDeEntregaDaProposta: new Date("2026-02-10"),
      regiao: Regiao.criar("SC"),
    };

    const comNovaClassificacao = edital.criarNovaVersao({
      ...conteudoBase,
      classificacaoDoItem: { codigo: "1234", descricao: "Material fictício novo" },
    });
    expect(comNovaClassificacao.classificacaoDoItem).toEqual({
      codigo: "1234",
      descricao: "Material fictício novo",
    });

    const semClassificacaoInformada = edital.criarNovaVersao(conteudoBase);
    expect(semClassificacaoInformada.classificacaoDoItem).toBeNull();
  });
});

describe("Edital.marcarComoCompativel", () => {
  it("preenche segmentoInferido, mantendo os demais campos intactos", () => {
    const edital = Edital.criar({
      numeroDeProcesso: "PE-0042/2026",
      orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Distrital" as const },
      regiao: Regiao.criar("SC"),
      objeto: "Aquisição de material de escritório fictício",
      valorEstimado: Dinheiro.criar(1500000),
      dataDePublicacao: new Date("2026-01-10"),
      dataDeEntregaDaProposta: new Date("2026-02-10"),
      classificacaoDoItem: { codigo: "7890", descricao: "Material fictício" },
    });
    const cnae = Cnae.criar("4120-4/00", "Construção de edifícios");

    const editalCompativel = edital.marcarComoCompativel(cnae);

    expect(editalCompativel.segmentoInferido).toBe(cnae);
    expect(editalCompativel.id).toBe(edital.id);
    expect(editalCompativel.versao).toBe(edital.versao);
    expect(editalCompativel.classificacaoDoItem).toEqual(edital.classificacaoDoItem);
  });
});
