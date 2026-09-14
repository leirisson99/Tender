import { describe, expect, it } from "vitest";
import { GerarAlertaDeCertidao } from "./GerarAlertaDeCertidao.js";
import { EmpresaRepositorioFalso } from "./EmpresaRepositorioFalso.js";
import { DossieDeHabilitacaoRepositorioFalso } from "./DossieDeHabilitacaoRepositorioFalso.js";
import { AlertaRepositorioFalso } from "./AlertaRepositorioFalso.js";
import { RelogioFalso } from "./RelogioFalso.js";
import { Empresa } from "../../domain/entidades/Empresa.js";
import { DossieDeHabilitacao } from "../../domain/entidades/DossieDeHabilitacao.js";
import { Alerta } from "../../domain/entidades/Alerta.js";
import { Cnpj } from "../../domain/objetosDeValor/Cnpj.js";
import { PeriodoDeValidade } from "../../domain/objetosDeValor/PeriodoDeValidade.js";
import { ReferenciaDeArquivo } from "../../domain/objetosDeValor/ReferenciaDeArquivo.js";

describe("GerarAlertaDeCertidao", () => {
  it("cria Alerta para Certidão AVencer sem alerta ativo", async () => {
    const hoje = new Date("2026-06-01");

    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);

    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const dossie = DossieDeHabilitacao.criar(empresa.id);
    const periodoAVencer = PeriodoDeValidade.criar(new Date("2025-01-01"), new Date("2026-06-20"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2026-01-10"));
    const certidao = dossie.adicionarCertidao("CndFederal", periodoAVencer, arquivo);
    await dossieDeHabilitacaoRepositorio.salvar(dossie);

    const alertaRepositorio = new AlertaRepositorioFalso();
    const relogio = new RelogioFalso(hoje);

    const gerarAlertaDeCertidao = new GerarAlertaDeCertidao(
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      alertaRepositorio,
      relogio,
    );

    const resultado = await gerarAlertaDeCertidao.executar();

    expect(resultado).toEqual({ certidoesAvaliadas: 1, alertasGerados: 1 });
    expect(alertaRepositorio.chamadasDeSalvar).toBe(1);
    const alertaSalvo = alertaRepositorio.alertasSalvos[0];
    expect(alertaSalvo?.tipo).toBe("CertidaoAVencer");
    expect(alertaSalvo?.origem).toEqual({ tipo: "Certidao", id: certidao.id });
    expect(alertaSalvo?.empresaId).toBe(empresa.id);
  });

  it("cria Alerta para Certidão Vencida sem alerta ativo", async () => {
    const hoje = new Date("2026-06-01");

    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);

    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const dossie = DossieDeHabilitacao.criar(empresa.id);
    const periodoVencido = PeriodoDeValidade.criar(new Date("2024-01-01"), new Date("2025-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2024-01-10"));
    const certidao = dossie.adicionarCertidao("CndFederal", periodoVencido, arquivo);
    await dossieDeHabilitacaoRepositorio.salvar(dossie);

    const alertaRepositorio = new AlertaRepositorioFalso();
    const relogio = new RelogioFalso(hoje);

    const gerarAlertaDeCertidao = new GerarAlertaDeCertidao(
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      alertaRepositorio,
      relogio,
    );

    const resultado = await gerarAlertaDeCertidao.executar();

    expect(resultado).toEqual({ certidoesAvaliadas: 1, alertasGerados: 1 });
    const alertaSalvo = alertaRepositorio.alertasSalvos[0];
    expect(alertaSalvo?.tipo).toBe("CertidaoVencida");
    expect(alertaSalvo?.origem).toEqual({ tipo: "Certidao", id: certidao.id });
  });

  it("não gera Alerta para Certidão Valida", async () => {
    const hoje = new Date("2026-06-01");

    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);

    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const dossie = DossieDeHabilitacao.criar(empresa.id);
    const periodoValido = PeriodoDeValidade.criar(new Date("2026-01-01"), new Date("2027-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2026-01-10"));
    dossie.adicionarCertidao("CndFederal", periodoValido, arquivo);
    await dossieDeHabilitacaoRepositorio.salvar(dossie);

    const alertaRepositorio = new AlertaRepositorioFalso();
    const relogio = new RelogioFalso(hoje);

    const gerarAlertaDeCertidao = new GerarAlertaDeCertidao(
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      alertaRepositorio,
      relogio,
    );

    const resultado = await gerarAlertaDeCertidao.executar();

    expect(resultado).toEqual({ certidoesAvaliadas: 1, alertasGerados: 0 });
    expect(alertaRepositorio.chamadasDeSalvar).toBe(0);
  });

  it("não duplica Alerta quando já existe um ativo para a mesma Certidão", async () => {
    const hoje = new Date("2026-06-01");

    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);

    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const dossie = DossieDeHabilitacao.criar(empresa.id);
    const periodoVencido = PeriodoDeValidade.criar(new Date("2024-01-01"), new Date("2025-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2024-01-10"));
    const certidao = dossie.adicionarCertidao("CndFederal", periodoVencido, arquivo);
    await dossieDeHabilitacaoRepositorio.salvar(dossie);

    const alertaRepositorio = new AlertaRepositorioFalso();
    const alertaExistente = Alerta.criar(empresa.id, "CertidaoVencida", { tipo: "Certidao", id: certidao.id });
    await alertaRepositorio.salvar(alertaExistente);
    const relogio = new RelogioFalso(hoje);

    const gerarAlertaDeCertidao = new GerarAlertaDeCertidao(
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      alertaRepositorio,
      relogio,
    );

    const resultado = await gerarAlertaDeCertidao.executar();

    expect(resultado).toEqual({ certidoesAvaliadas: 1, alertasGerados: 0 });
    expect(alertaRepositorio.chamadasDeSalvar).toBe(1); // só o alerta pré-existente
  });

  it("permite novo Alerta quando o único anterior tem status FalhouNoEnvio", async () => {
    const hoje = new Date("2026-06-01");

    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);

    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const dossie = DossieDeHabilitacao.criar(empresa.id);
    const periodoVencido = PeriodoDeValidade.criar(new Date("2024-01-01"), new Date("2025-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2024-01-10"));
    const certidao = dossie.adicionarCertidao("CndFederal", periodoVencido, arquivo);
    await dossieDeHabilitacaoRepositorio.salvar(dossie);

    const alertaRepositorio = new AlertaRepositorioFalso();
    const alertaQueFalhou = Alerta.reconstituir(
      crypto.randomUUID(),
      empresa.id,
      "CertidaoVencida",
      { tipo: "Certidao", id: certidao.id },
      "WhatsApp",
      "FalhouNoEnvio",
      null,
    );
    await alertaRepositorio.salvar(alertaQueFalhou);
    const relogio = new RelogioFalso(hoje);

    const gerarAlertaDeCertidao = new GerarAlertaDeCertidao(
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      alertaRepositorio,
      relogio,
    );

    const resultado = await gerarAlertaDeCertidao.executar();

    expect(resultado).toEqual({ certidoesAvaliadas: 1, alertasGerados: 1 });
    expect(alertaRepositorio.chamadasDeSalvar).toBe(2); // o FalhouNoEnvio + o novo
  });

  it("gera novo Alerta CertidaoVencida quando uma Certidão já alertada como AVencer evolui para Vencida", async () => {
    const hoje = new Date("2026-06-01");

    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);

    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const dossie = DossieDeHabilitacao.criar(empresa.id);
    // hoje já é >= dataDeValidade: a Certidão está Vencida nesta execução,
    // mas foi alertada como AVencer numa execução anterior.
    const periodoVencido = PeriodoDeValidade.criar(new Date("2024-01-01"), new Date("2025-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2024-01-10"));
    const certidao = dossie.adicionarCertidao("CndFederal", periodoVencido, arquivo);
    await dossieDeHabilitacaoRepositorio.salvar(dossie);

    const alertaRepositorio = new AlertaRepositorioFalso();
    const alertaDeAVencerJaEnviado = Alerta.reconstituir(
      crypto.randomUUID(),
      empresa.id,
      "CertidaoAVencer",
      { tipo: "Certidao", id: certidao.id },
      "WhatsApp",
      "Enviado",
      new Date("2026-05-01"),
    );
    await alertaRepositorio.salvar(alertaDeAVencerJaEnviado);
    const relogio = new RelogioFalso(hoje);

    const gerarAlertaDeCertidao = new GerarAlertaDeCertidao(
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      alertaRepositorio,
      relogio,
    );

    const resultado = await gerarAlertaDeCertidao.executar();

    expect(resultado).toEqual({ certidoesAvaliadas: 1, alertasGerados: 1 });
    const novoAlerta = alertaRepositorio.alertasSalvos[1];
    expect(novoAlerta?.tipo).toBe("CertidaoVencida");
    expect(novoAlerta?.origem).toEqual({ tipo: "Certidao", id: certidao.id });
  });

  it("retorna zero sem tocar em nada quando a Empresa não tem Dossiê", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);

    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const alertaRepositorio = new AlertaRepositorioFalso();
    const relogio = new RelogioFalso(new Date("2026-06-01"));

    const gerarAlertaDeCertidao = new GerarAlertaDeCertidao(
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      alertaRepositorio,
      relogio,
    );

    const resultado = await gerarAlertaDeCertidao.executar();

    expect(resultado).toEqual({ certidoesAvaliadas: 0, alertasGerados: 0 });
    expect(alertaRepositorio.chamadasDeSalvar).toBe(0);
  });

  it("retorna zero sem tocar em nada quando não há Empresa cadastrada", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const alertaRepositorio = new AlertaRepositorioFalso();
    const relogio = new RelogioFalso(new Date("2026-06-01"));

    const gerarAlertaDeCertidao = new GerarAlertaDeCertidao(
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      alertaRepositorio,
      relogio,
    );

    const resultado = await gerarAlertaDeCertidao.executar();

    expect(resultado).toEqual({ certidoesAvaliadas: 0, alertasGerados: 0 });
    expect(alertaRepositorio.chamadasDeSalvar).toBe(0);
  });
});
