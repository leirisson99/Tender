import { describe, expect, it } from "vitest";
import { CalcularProntidaoParaEdital } from "./CalcularProntidaoParaEdital.js";
import { EditalRepositorioFalso } from "./EditalRepositorioFalso.js";
import { EmpresaRepositorioFalso } from "./EmpresaRepositorioFalso.js";
import { DossieDeHabilitacaoRepositorioFalso } from "./DossieDeHabilitacaoRepositorioFalso.js";
import { RelogioFalso } from "./RelogioFalso.js";
import { EditalNaoEncontradoError } from "../erros/EditalNaoEncontradoError.js";
import { EmpresaNaoEncontradaError } from "../erros/EmpresaNaoEncontradaError.js";
import { Edital } from "../../domain/entidades/Edital.js";
import { DossieDeHabilitacao } from "../../domain/entidades/DossieDeHabilitacao.js";
import { Empresa } from "../../domain/entidades/Empresa.js";
import { Cnpj } from "../../domain/objetosDeValor/Cnpj.js";
import { Dinheiro } from "../../domain/objetosDeValor/Dinheiro.js";
import { Regiao } from "../../domain/objetosDeValor/Regiao.js";
import { PeriodoDeValidade } from "../../domain/objetosDeValor/PeriodoDeValidade.js";
import { ReferenciaDeArquivo } from "../../domain/objetosDeValor/ReferenciaDeArquivo.js";
import type { TipoDeDocumentoDeHabilitacao } from "../../domain/objetosDeValor/TipoDeDocumentoDeHabilitacao.js";

const NUMERO_DE_PROCESSO = "PE-0099/2026";
const NOME_DO_ORGAO = "Prefeitura Fictícia de Exemplópolis";

function criarEditalSintetico(): Edital {
  return Edital.criar({
    numeroDeProcesso: NUMERO_DE_PROCESSO,
    orgao: { nome: NOME_DO_ORGAO, esfera: "Municipal" },
    regiao: Regiao.criar("SC"),
    objeto: "Aquisição de material de escritório fictício",
    valorEstimado: Dinheiro.criar(1000000),
    dataDePublicacao: new Date("2026-01-10"),
    dataDeEntregaDaProposta: new Date("2026-07-10"),
  });
}

describe("CalcularProntidaoParaEdital", () => {
  it("calcula a Prontidão no caminho feliz", async () => {
    const editalRepositorio = new EditalRepositorioFalso();
    await editalRepositorio.salvar(criarEditalSintetico());

    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);

    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const dossie = DossieDeHabilitacao.criar(empresa.id);
    const periodoValido = PeriodoDeValidade.criar(new Date("2026-01-01"), new Date("2027-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2026-01-10"));
    const tiposExigidos: TipoDeDocumentoDeHabilitacao[] = [
      "ContratoSocial",
      "CndFederal",
      "CrfFgts",
      "Cndt",
      "CertidaoEstadual",
      "CertidaoMunicipal",
      "CertidaoNegativaDeFalencia",
      "AtestadoDeCapacidadeTecnica",
    ];
    for (const tipo of tiposExigidos) {
      dossie.adicionarCertidao(tipo, periodoValido, arquivo);
    }
    await dossieDeHabilitacaoRepositorio.salvar(dossie);

    const relogio = new RelogioFalso(new Date("2026-06-01"));

    const calcularProntidaoParaEdital = new CalcularProntidaoParaEdital(
      editalRepositorio,
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      relogio,
    );

    const prontidao = await calcularProntidaoParaEdital.executar({
      numeroDeProcesso: NUMERO_DE_PROCESSO,
      nomeDoOrgao: NOME_DO_ORGAO,
    });

    expect(prontidao).toEqual({ placar: "Apta", pendencias: [] });
  });

  it("propaga EditalNaoEncontradoError sem consultar Empresa nem Dossiê", async () => {
    const editalRepositorio = new EditalRepositorioFalso();
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const relogio = new RelogioFalso(new Date("2026-06-01"));

    const calcularProntidaoParaEdital = new CalcularProntidaoParaEdital(
      editalRepositorio,
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      relogio,
    );

    await expect(
      calcularProntidaoParaEdital.executar({
        numeroDeProcesso: NUMERO_DE_PROCESSO,
        nomeDoOrgao: NOME_DO_ORGAO,
      }),
    ).rejects.toThrow(EditalNaoEncontradoError);
  });

  it("propaga EmpresaNaoEncontradaError quando não há Empresa cadastrada", async () => {
    const editalRepositorio = new EditalRepositorioFalso();
    await editalRepositorio.salvar(criarEditalSintetico());

    const empresaRepositorio = new EmpresaRepositorioFalso();
    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const relogio = new RelogioFalso(new Date("2026-06-01"));

    const calcularProntidaoParaEdital = new CalcularProntidaoParaEdital(
      editalRepositorio,
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      relogio,
    );

    await expect(
      calcularProntidaoParaEdital.executar({
        numeroDeProcesso: NUMERO_DE_PROCESSO,
        nomeDoOrgao: NOME_DO_ORGAO,
      }),
    ).rejects.toThrow(EmpresaNaoEncontradaError);
  });

  it("calcula a Prontidão de uma Empresa sem Dossiê, sem persistir nada", async () => {
    const editalRepositorio = new EditalRepositorioFalso();
    await editalRepositorio.salvar(criarEditalSintetico());

    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    await empresaRepositorio.salvar(empresa);

    const dossieDeHabilitacaoRepositorio = new DossieDeHabilitacaoRepositorioFalso();
    const relogio = new RelogioFalso(new Date("2026-06-01"));

    const calcularProntidaoParaEdital = new CalcularProntidaoParaEdital(
      editalRepositorio,
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      relogio,
    );

    const prontidao = await calcularProntidaoParaEdital.executar({
      numeroDeProcesso: NUMERO_DE_PROCESSO,
      nomeDoOrgao: NOME_DO_ORGAO,
    });

    expect(prontidao.placar).toBe("Inapta");
    expect(prontidao.pendencias).toHaveLength(4);
    expect(dossieDeHabilitacaoRepositorio.chamadasDeSalvar).toBe(0);
  });
});
