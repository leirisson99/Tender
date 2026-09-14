import { describe, expect, it } from "vitest";
import { GerarAlertaDeEditalCompativel } from "./GerarAlertaDeEditalCompativel.js";
import { EditalRepositorioFalso } from "./EditalRepositorioFalso.js";
import { EmpresaRepositorioFalso } from "./EmpresaRepositorioFalso.js";
import { AlertaRepositorioFalso } from "./AlertaRepositorioFalso.js";
import { Edital } from "../../domain/entidades/Edital.js";
import { Alerta } from "../../domain/entidades/Alerta.js";
import { Empresa } from "../../domain/entidades/Empresa.js";
import { Cnpj } from "../../domain/objetosDeValor/Cnpj.js";
import { Cnae } from "../../domain/objetosDeValor/Cnae.js";
import { Dinheiro } from "../../domain/objetosDeValor/Dinheiro.js";
import { Regiao } from "../../domain/objetosDeValor/Regiao.js";

function criarEditalSintetico(numeroDeProcesso: string): Edital {
  return Edital.criar({
    numeroDeProcesso,
    orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Municipal" },
    regiao: Regiao.criar("SC"),
    objeto: "Aquisição de material de escritório fictício",
    valorEstimado: Dinheiro.criar(1000000),
    dataDePublicacao: new Date("2026-01-10"),
    dataDeEntregaDaProposta: new Date("2026-07-10"),
  });
}

describe("GerarAlertaDeEditalCompativel", () => {
  it("cria Alerta para Edital compatível sem alerta ativo", async () => {
    const editalRepositorio = new EditalRepositorioFalso();
    const editalCompativel = criarEditalSintetico("PE-0099/2026").marcarComoCompativel(
      Cnae.criar("4120-4/00", "Construção de edifícios"),
    );
    await editalRepositorio.salvar(editalCompativel);

    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);

    const alertaRepositorio = new AlertaRepositorioFalso();

    const gerarAlertaDeEditalCompativel = new GerarAlertaDeEditalCompativel(
      editalRepositorio,
      empresaRepositorio,
      alertaRepositorio,
    );

    const resultado = await gerarAlertaDeEditalCompativel.executar();

    expect(resultado).toEqual({ editaisAvaliados: 1, alertasGerados: 1 });
    expect(alertaRepositorio.chamadasDeSalvar).toBe(1);
    const alertaSalvo = alertaRepositorio.alertasSalvos[0];
    expect(alertaSalvo?.tipo).toBe("EditalCompativel");
    expect(alertaSalvo?.origem).toEqual({ tipo: "Edital", id: editalCompativel.id });
    expect(alertaSalvo?.empresaId).toBe(empresa.id);
  });

  it("não gera Alerta para Edital ainda não compatível", async () => {
    const editalRepositorio = new EditalRepositorioFalso();
    await editalRepositorio.salvar(criarEditalSintetico("PE-0100/2026"));

    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);

    const alertaRepositorio = new AlertaRepositorioFalso();

    const gerarAlertaDeEditalCompativel = new GerarAlertaDeEditalCompativel(
      editalRepositorio,
      empresaRepositorio,
      alertaRepositorio,
    );

    const resultado = await gerarAlertaDeEditalCompativel.executar();

    expect(resultado).toEqual({ editaisAvaliados: 0, alertasGerados: 0 });
    expect(alertaRepositorio.chamadasDeSalvar).toBe(0);
  });

  it("não duplica Alerta quando já existe um ativo para o mesmo Edital", async () => {
    const editalRepositorio = new EditalRepositorioFalso();
    const editalCompativel = criarEditalSintetico("PE-0101/2026").marcarComoCompativel(
      Cnae.criar("4120-4/00", "Construção de edifícios"),
    );
    await editalRepositorio.salvar(editalCompativel);

    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);

    const alertaRepositorio = new AlertaRepositorioFalso();
    await alertaRepositorio.salvar(
      Alerta.criar(empresa.id, "EditalCompativel", { tipo: "Edital", id: editalCompativel.id }),
    );

    const gerarAlertaDeEditalCompativel = new GerarAlertaDeEditalCompativel(
      editalRepositorio,
      empresaRepositorio,
      alertaRepositorio,
    );

    const resultado = await gerarAlertaDeEditalCompativel.executar();

    expect(resultado).toEqual({ editaisAvaliados: 1, alertasGerados: 0 });
    expect(alertaRepositorio.chamadasDeSalvar).toBe(1); // só o alerta pré-existente
  });

  it("retorna zero sem tocar em nada quando não há Empresa cadastrada", async () => {
    const editalRepositorio = new EditalRepositorioFalso();
    await editalRepositorio.salvar(
      criarEditalSintetico("PE-0102/2026").marcarComoCompativel(Cnae.criar("4120-4/00", "Construção de edifícios")),
    );

    const empresaRepositorio = new EmpresaRepositorioFalso();
    const alertaRepositorio = new AlertaRepositorioFalso();

    const gerarAlertaDeEditalCompativel = new GerarAlertaDeEditalCompativel(
      editalRepositorio,
      empresaRepositorio,
      alertaRepositorio,
    );

    const resultado = await gerarAlertaDeEditalCompativel.executar();

    expect(resultado).toEqual({ editaisAvaliados: 0, alertasGerados: 0 });
    expect(alertaRepositorio.chamadasDeSalvar).toBe(0);
  });
});
