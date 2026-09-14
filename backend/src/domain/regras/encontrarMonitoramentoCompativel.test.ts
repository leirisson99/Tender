import { describe, expect, it } from "vitest";
import { encontrarMonitoramentoCompativel } from "./encontrarMonitoramentoCompativel.js";
import { Edital } from "../entidades/Edital.js";
import { Monitoramento } from "../entidades/Empresa.js";
import { Cnae } from "../objetosDeValor/Cnae.js";
import { Regiao } from "../objetosDeValor/Regiao.js";
import { Dinheiro } from "../objetosDeValor/Dinheiro.js";

function criarEditalDeTeste(dados: {
  regiao: Regiao;
  classificacaoDoItem?: { codigo: string; descricao: string };
}): Edital {
  return Edital.criar({
    numeroDeProcesso: "PE-0042/2026",
    orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Distrital" },
    regiao: dados.regiao,
    objeto: "Aquisição de material de escritório fictício",
    valorEstimado: Dinheiro.criar(1500000),
    dataDePublicacao: new Date("2026-01-10"),
    dataDeEntregaDaProposta: new Date("2026-02-10"),
    ...(dados.classificacaoDoItem !== undefined ? { classificacaoDoItem: dados.classificacaoDoItem } : {}),
  });
}

describe("encontrarMonitoramentoCompativel", () => {
  it("retorna o Monitoramento quando região (município nulo) e segmento batem", () => {
    const monitoramento = Monitoramento.criar(
      Cnae.criar("4120-4/00", "Construção de edifícios"),
      Regiao.criar("SC"),
    );
    const edital = criarEditalDeTeste({
      regiao: Regiao.criar("SC", "Florianópolis"),
      classificacaoDoItem: { codigo: "4120-4/00", descricao: "Material fictício" },
    });

    const resultado = encontrarMonitoramentoCompativel(edital, [monitoramento]);

    expect(resultado).toBe(monitoramento);
  });

  it("retorna null quando a UF é diferente, mesmo com segmento igual", () => {
    const monitoramento = Monitoramento.criar(
      Cnae.criar("4120-4/00", "Construção de edifícios"),
      Regiao.criar("SC"),
    );
    const edital = criarEditalDeTeste({
      regiao: Regiao.criar("PR"),
      classificacaoDoItem: { codigo: "4120-4/00", descricao: "Material fictício" },
    });

    const resultado = encontrarMonitoramentoCompativel(edital, [monitoramento]);

    expect(resultado).toBeNull();
  });

  it("retorna null quando o Monitoramento tem município específico diferente do Edital", () => {
    const monitoramento = Monitoramento.criar(
      Cnae.criar("4120-4/00", "Construção de edifícios"),
      Regiao.criar("SC", "Joinville"),
    );
    const edital = criarEditalDeTeste({
      regiao: Regiao.criar("SC", "Florianópolis"),
      classificacaoDoItem: { codigo: "4120-4/00", descricao: "Material fictício" },
    });

    const resultado = encontrarMonitoramentoCompativel(edital, [monitoramento]);

    expect(resultado).toBeNull();
  });

  it("retorna null quando a região bate mas o segmento não bate", () => {
    const monitoramento = Monitoramento.criar(
      Cnae.criar("4120-4/00", "Construção de edifícios"),
      Regiao.criar("SC"),
    );
    const editalComSegmentoDiferente = criarEditalDeTeste({
      regiao: Regiao.criar("SC"),
      classificacaoDoItem: { codigo: "9999-9/99", descricao: "Outro material fictício" },
    });
    const editalSemClassificacao = criarEditalDeTeste({ regiao: Regiao.criar("SC") });

    expect(encontrarMonitoramentoCompativel(editalComSegmentoDiferente, [monitoramento])).toBeNull();
    expect(encontrarMonitoramentoCompativel(editalSemClassificacao, [monitoramento])).toBeNull();
  });

  it("retorna o primeiro Monitoramento compatível da lista quando mais de um bate", () => {
    const primeiro = Monitoramento.criar(Cnae.criar("4120-4/00", "Construção de edifícios"), Regiao.criar("SC"));
    const segundo = Monitoramento.criar(
      Cnae.criar("4120-4/00", "Construção de edifícios"),
      Regiao.criar("SC", "Florianópolis"),
    );
    const edital = criarEditalDeTeste({
      regiao: Regiao.criar("SC", "Florianópolis"),
      classificacaoDoItem: { codigo: "4120-4/00", descricao: "Material fictício" },
    });

    const resultado = encontrarMonitoramentoCompativel(edital, [primeiro, segundo]);

    expect(resultado).toBe(primeiro);
  });
});
