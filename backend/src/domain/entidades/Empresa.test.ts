import { describe, expect, it } from "vitest";
import { Empresa } from "./Empresa.js";
import { Cnpj } from "../objetosDeValor/Cnpj.js";
import { Cnae } from "../objetosDeValor/Cnae.js";
import { Regiao } from "../objetosDeValor/Regiao.js";
import { MonitoramentoDuplicadoError } from "../erros/MonitoramentoDuplicadoError.js";

describe("Empresa.criar", () => {
  it("gera uma Empresa com id, cnpj, razão social e nenhum Monitoramento", () => {
    const cnpj = Cnpj.criar("12345678000195");

    const empresa = Empresa.criar(cnpj, "Fábrica Fictícia de Exemplos Ltda");

    expect(empresa.id).toBeTruthy();
    expect(empresa.cnpj).toBe(cnpj);
    expect(empresa.razaoSocial).toBe("Fábrica Fictícia de Exemplos Ltda");
    expect(empresa.monitoramentos).toEqual([]);
  });
});

describe("Empresa.adicionarMonitoramento", () => {
  it("adiciona um Monitoramento ativo quando não há duplicata", () => {
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    const segmento = Cnae.criar("4120-4/00", "Construção de edifícios");
    const regiao = Regiao.criar("SC");

    const monitoramento = empresa.adicionarMonitoramento(segmento, regiao);

    expect(monitoramento.ativo).toBe(true);
    expect(monitoramento.segmento).toBe(segmento);
    expect(monitoramento.regiao).toBe(regiao);
    expect(empresa.monitoramentos).toEqual([monitoramento]);
  });

  it("rejeita duplicata pelo mesmo (código, UF, município), mesmo com descrição diferente", () => {
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    empresa.adicionarMonitoramento(Cnae.criar("4120-4/00", "Construção de edifícios"), Regiao.criar("SC"));

    expect(() =>
      empresa.adicionarMonitoramento(Cnae.criar("4120-4/00", "Outra descrição"), Regiao.criar("SC")),
    ).toThrow(MonitoramentoDuplicadoError);
  });
});
