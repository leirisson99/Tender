import { describe, expect, it } from "vitest";
import { ConfigurarMonitoramento } from "./ConfigurarMonitoramento.js";
import { EmpresaRepositorioFalso } from "./EmpresaRepositorioFalso.js";
import { Empresa } from "../../domain/entidades/Empresa.js";
import { Cnpj } from "../../domain/objetosDeValor/Cnpj.js";
import { MonitoramentoDuplicadoError } from "../../domain/erros/MonitoramentoDuplicadoError.js";
import { Cnae } from "../../domain/objetosDeValor/Cnae.js";
import { Regiao } from "../../domain/objetosDeValor/Regiao.js";
import { EmpresaNaoEncontradaError } from "../erros/EmpresaNaoEncontradaError.js";

describe("ConfigurarMonitoramento", () => {
  it("adiciona um Monitoramento à Empresa existente", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);
    const configurarMonitoramento = new ConfigurarMonitoramento(empresaRepositorio);

    const monitoramento = await configurarMonitoramento.executar({
      cnae: { codigo: "4120-4/00", descricao: "Construção de edifícios" },
      regiao: { uf: "SC" },
    });

    expect(monitoramento.ativo).toBe(true);
    expect(monitoramento.segmento.codigo).toBe("4120-4/00");
    expect(monitoramento.regiao.uf).toBe("SC");
    expect(empresaRepositorio.chamadasDeSalvar).toBe(2);
  });

  it("rejeita Monitoramento duplicado", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    empresa.adicionarMonitoramento(
      Cnae.criar("4120-4/00", "Construção de edifícios"),
      Regiao.criar("SC"),
    );
    await empresaRepositorio.salvar(empresa);
    const configurarMonitoramento = new ConfigurarMonitoramento(empresaRepositorio);

    await expect(
      configurarMonitoramento.executar({
        cnae: { codigo: "4120-4/00", descricao: "Construção de edifícios" },
        regiao: { uf: "SC" },
      }),
    ).rejects.toThrow(MonitoramentoDuplicadoError);
  });

  it("rejeita quando não há Empresa cadastrada", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const configurarMonitoramento = new ConfigurarMonitoramento(empresaRepositorio);

    await expect(
      configurarMonitoramento.executar({
        cnae: { codigo: "4120-4/00", descricao: "Construção de edifícios" },
        regiao: { uf: "SC" },
      }),
    ).rejects.toThrow(EmpresaNaoEncontradaError);
  });
});
