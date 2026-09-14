import { describe, expect, it } from "vitest";
import { CadastrarCertidao } from "./CadastrarCertidao.js";
import { EmpresaRepositorioFalso } from "./EmpresaRepositorioFalso.js";
import { DossieDeHabilitacaoRepositorioFalso } from "./DossieDeHabilitacaoRepositorioFalso.js";
import { ArmazenamentoDeArquivoFalso } from "./ArmazenamentoDeArquivoFalso.js";
import { Empresa } from "../../domain/entidades/Empresa.js";
import { Cnpj } from "../../domain/objetosDeValor/Cnpj.js";
import { PeriodoDeValidadeInvalidoError } from "../../domain/erros/PeriodoDeValidadeInvalidoError.js";
import { EmpresaNaoEncontradaError } from "../erros/EmpresaNaoEncontradaError.js";

describe("CadastrarCertidao", () => {
  it("cria o Dossiê automaticamente na primeira Certidão de uma Empresa", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);
    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const armazenamentoDeArquivo = new ArmazenamentoDeArquivoFalso();
    const cadastrarCertidao = new CadastrarCertidao(
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      armazenamentoDeArquivo,
    );

    const certidao = await cadastrarCertidao.executar({
      tipo: "CndFederal",
      dataDeEmissao: new Date("2026-01-01"),
      dataDeValidade: new Date("2027-01-01"),
      nomeOriginalDoArquivo: "certidao.pdf",
      conteudoDoArquivo: Buffer.from("conteúdo fictício"),
    });

    expect(certidao.tipo).toBe("CndFederal");
    expect(dossieDeHabilitacaoRepositorio.chamadasDeSalvar).toBe(1);
    const dossie = await dossieDeHabilitacaoRepositorio.buscarPorEmpresaId(empresa.id);
    expect(dossie?.empresaId).toBe(empresa.id);
    expect(dossie?.certidoes).toEqual([certidao]);
  });

  it("reaproveita o Dossiê existente, sem criar um segundo", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);
    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const armazenamentoDeArquivo = new ArmazenamentoDeArquivoFalso();
    const cadastrarCertidao = new CadastrarCertidao(
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      armazenamentoDeArquivo,
    );
    await cadastrarCertidao.executar({
      tipo: "CndFederal",
      dataDeEmissao: new Date("2026-01-01"),
      dataDeValidade: new Date("2027-01-01"),
      nomeOriginalDoArquivo: "certidao-1.pdf",
      conteudoDoArquivo: Buffer.from("conteúdo fictício 1"),
    });

    await cadastrarCertidao.executar({
      tipo: "CrfFgts",
      dataDeEmissao: new Date("2026-01-01"),
      dataDeValidade: new Date("2027-01-01"),
      nomeOriginalDoArquivo: "certidao-2.pdf",
      conteudoDoArquivo: Buffer.from("conteúdo fictício 2"),
    });

    const dossie = await dossieDeHabilitacaoRepositorio.buscarPorEmpresaId(empresa.id);
    expect(dossie?.certidoes).toHaveLength(2);
  });

  it("propaga PeriodoDeValidadeInvalidoError sem tocar em armazenamento nem repositório", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    await empresaRepositorio.salvar(Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda"));
    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const armazenamentoDeArquivo = new ArmazenamentoDeArquivoFalso();
    const cadastrarCertidao = new CadastrarCertidao(
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      armazenamentoDeArquivo,
    );

    await expect(
      cadastrarCertidao.executar({
        tipo: "CndFederal",
        dataDeEmissao: new Date("2027-01-01"),
        dataDeValidade: new Date("2026-01-01"),
        nomeOriginalDoArquivo: "certidao.pdf",
        conteudoDoArquivo: Buffer.from("conteúdo fictício"),
      }),
    ).rejects.toThrow(PeriodoDeValidadeInvalidoError);
    expect(armazenamentoDeArquivo.chamadasDeSalvar).toBe(0);
    expect(dossieDeHabilitacaoRepositorio.chamadasDeSalvar).toBe(0);
  });

  it("propaga EmpresaNaoEncontradaError sem chamar armazenamento", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const armazenamentoDeArquivo = new ArmazenamentoDeArquivoFalso();
    const cadastrarCertidao = new CadastrarCertidao(
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      armazenamentoDeArquivo,
    );

    await expect(
      cadastrarCertidao.executar({
        tipo: "CndFederal",
        dataDeEmissao: new Date("2026-01-01"),
        dataDeValidade: new Date("2027-01-01"),
        nomeOriginalDoArquivo: "certidao.pdf",
        conteudoDoArquivo: Buffer.from("conteúdo fictício"),
      }),
    ).rejects.toThrow(EmpresaNaoEncontradaError);
    expect(armazenamentoDeArquivo.chamadasDeSalvar).toBe(0);
  });
});
