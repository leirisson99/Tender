import { describe, expect, it } from "vitest";
import { Certidao, DossieDeHabilitacao } from "./DossieDeHabilitacao.js";
import { Edital } from "./Edital.js";
import { PeriodoDeValidade } from "../objetosDeValor/PeriodoDeValidade.js";
import { ReferenciaDeArquivo } from "../objetosDeValor/ReferenciaDeArquivo.js";
import { Dinheiro } from "../objetosDeValor/Dinheiro.js";
import { Regiao } from "../objetosDeValor/Regiao.js";
import type { TipoDeDocumentoDeHabilitacao } from "../objetosDeValor/TipoDeDocumentoDeHabilitacao.js";

function criarEditalSintetico(): Edital {
  return Edital.criar({
    numeroDeProcesso: "PE-0099/2026",
    orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Municipal" },
    regiao: Regiao.criar("SC"),
    objeto: "Aquisição de material de escritório fictício",
    valorEstimado: Dinheiro.criar(1000000),
    dataDePublicacao: new Date("2026-01-10"),
    dataDeEntregaDaProposta: new Date("2026-07-10"),
  });
}

describe("Certidao.criar", () => {
  it("gera uma instância com id, tipo, período e arquivo", () => {
    const periodoDeValidade = PeriodoDeValidade.criar(new Date("2026-01-01"), new Date("2027-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2026-01-10"));

    const certidao = Certidao.criar("CndFederal", periodoDeValidade, arquivo);

    expect(certidao.id).toBeTruthy();
    expect(certidao.tipo).toBe("CndFederal");
    expect(certidao.periodoDeValidade).toBe(periodoDeValidade);
    expect(certidao.arquivo).toBe(arquivo);
  });
});

describe("Certidao.categoria", () => {
  it("deriva a CategoriaDeHabilitacao a partir do tipo", () => {
    const periodoDeValidade = PeriodoDeValidade.criar(new Date("2026-01-01"), new Date("2027-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2026-01-10"));

    expect(Certidao.criar("ContratoSocial", periodoDeValidade, arquivo).categoria).toBe("Juridica");
    expect(Certidao.criar("CndFederal", periodoDeValidade, arquivo).categoria).toBe("FiscalETrabalhista");
    expect(Certidao.criar("CrfFgts", periodoDeValidade, arquivo).categoria).toBe("FiscalETrabalhista");
    expect(Certidao.criar("Cndt", periodoDeValidade, arquivo).categoria).toBe("FiscalETrabalhista");
    expect(Certidao.criar("CertidaoEstadual", periodoDeValidade, arquivo).categoria).toBe("FiscalETrabalhista");
    expect(Certidao.criar("CertidaoMunicipal", periodoDeValidade, arquivo).categoria).toBe("FiscalETrabalhista");
    expect(Certidao.criar("CertidaoNegativaDeFalencia", periodoDeValidade, arquivo).categoria).toBe(
      "EconomicoFinanceira",
    );
    expect(Certidao.criar("AtestadoDeCapacidadeTecnica", periodoDeValidade, arquivo).categoria).toBe("Tecnica");
  });
});

describe("Certidao.situacaoEm", () => {
  it("retorna Vencida quando a data de referência é igual ou posterior à dataDeValidade", () => {
    const periodoDeValidade = PeriodoDeValidade.criar(new Date("2025-01-01"), new Date("2026-06-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2025-01-10"));
    const certidao = Certidao.criar("CndFederal", periodoDeValidade, arquivo);

    expect(certidao.situacaoEm(new Date("2026-06-01"))).toBe("Vencida");
    expect(certidao.situacaoEm(new Date("2026-07-01"))).toBe("Vencida");
  });

  it("retorna AVencer dentro de 30 dias corridos antes do vencimento", () => {
    const periodoDeValidade = PeriodoDeValidade.criar(new Date("2025-01-01"), new Date("2026-06-30"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2025-01-10"));
    const certidao = Certidao.criar("CndFederal", periodoDeValidade, arquivo);

    expect(certidao.situacaoEm(new Date("2026-06-01"))).toBe("AVencer");
    expect(certidao.situacaoEm(new Date("2026-05-31"))).toBe("AVencer");
  });

  it("retorna Valida além de 30 dias corridos antes do vencimento", () => {
    const periodoDeValidade = PeriodoDeValidade.criar(new Date("2025-01-01"), new Date("2026-06-30"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2025-01-10"));
    const certidao = Certidao.criar("CndFederal", periodoDeValidade, arquivo);

    expect(certidao.situacaoEm(new Date("2026-05-01"))).toBe("Valida");
  });
});

describe("DossieDeHabilitacao.criar", () => {
  it("gera um Dossiê vazio associado a uma Empresa", () => {
    const empresaId = crypto.randomUUID();

    const dossie = DossieDeHabilitacao.criar(empresaId);

    expect(dossie.id).toBeTruthy();
    expect(dossie.empresaId).toBe(empresaId);
    expect(dossie.certidoes).toEqual([]);
  });
});

describe("DossieDeHabilitacao.adicionarCertidao", () => {
  it("adiciona Certidão, permitindo duas do mesmo tipo (renovação)", () => {
    const dossie = DossieDeHabilitacao.criar(crypto.randomUUID());
    const periodoAntigo = PeriodoDeValidade.criar(new Date("2024-01-01"), new Date("2025-01-01"));
    const periodoNovo = PeriodoDeValidade.criar(new Date("2025-01-01"), new Date("2026-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2025-01-01"));

    const certidaoAntiga = dossie.adicionarCertidao("CndFederal", periodoAntigo, arquivo);
    const certidaoNova = dossie.adicionarCertidao("CndFederal", periodoNovo, arquivo);

    expect(dossie.certidoes).toEqual([certidaoAntiga, certidaoNova]);
  });
});

describe("DossieDeHabilitacao.calcularProntidaoParaEdital", () => {
  it("retorna Apta quando todos os tipos de toda categoria exigida têm Certidão Valida", () => {
    const hoje = new Date("2026-06-01");
    const dossie = DossieDeHabilitacao.criar(crypto.randomUUID());
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

    const prontidao = dossie.calcularProntidaoParaEdital(criarEditalSintetico(), hoje);

    expect(prontidao).toEqual({ placar: "Apta", pendencias: [] });
  });

  it("retorna Inapta quando uma categoria de tipo único não tem nenhuma Certidão cadastrada", () => {
    const hoje = new Date("2026-06-01");
    const dossie = DossieDeHabilitacao.criar(crypto.randomUUID());
    const periodoValido = PeriodoDeValidade.criar(new Date("2026-01-01"), new Date("2027-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2026-01-10"));

    const tiposCadastrados: TipoDeDocumentoDeHabilitacao[] = [
      "ContratoSocial",
      "CndFederal",
      "CrfFgts",
      "Cndt",
      "CertidaoEstadual",
      "CertidaoMunicipal",
      "CertidaoNegativaDeFalencia",
      // "AtestadoDeCapacidadeTecnica" (Tecnica) propositalmente nunca cadastrado
    ];

    for (const tipo of tiposCadastrados) {
      dossie.adicionarCertidao(tipo, periodoValido, arquivo);
    }

    const prontidao = dossie.calcularProntidaoParaEdital(criarEditalSintetico(), hoje);

    expect(prontidao).toEqual({
      placar: "Inapta",
      pendencias: [{ categoria: "Tecnica", motivo: "SemCertidaoCadastrada" }],
    });
  });

  it("considera uma categoria não satisfeita quando falta Certidão de apenas um dos seus tipos mapeados", () => {
    const hoje = new Date("2026-06-01");
    const dossie = DossieDeHabilitacao.criar(crypto.randomUUID());
    const periodoValido = PeriodoDeValidade.criar(new Date("2026-01-01"), new Date("2027-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2026-01-10"));

    const tiposCadastrados: TipoDeDocumentoDeHabilitacao[] = [
      "ContratoSocial",
      "CndFederal",
      "CrfFgts",
      "Cndt",
      "CertidaoEstadual",
      // "CertidaoMunicipal" (também FiscalETrabalhista) propositalmente nunca cadastrado
      "CertidaoNegativaDeFalencia",
      "AtestadoDeCapacidadeTecnica",
    ];

    for (const tipo of tiposCadastrados) {
      dossie.adicionarCertidao(tipo, periodoValido, arquivo);
    }

    const prontidao = dossie.calcularProntidaoParaEdital(criarEditalSintetico(), hoje);

    expect(prontidao).toEqual({
      placar: "Inapta",
      pendencias: [{ categoria: "FiscalETrabalhista", motivo: "SemCertidaoCadastrada" }],
    });
  });

  it("retorna Pendente quando um tipo só está coberto por Certidão AVencer", () => {
    const hoje = new Date("2026-06-01");
    const dossie = DossieDeHabilitacao.criar(crypto.randomUUID());
    const periodoValido = PeriodoDeValidade.criar(new Date("2026-01-01"), new Date("2027-01-01"));
    const periodoAVencer = PeriodoDeValidade.criar(new Date("2025-01-01"), new Date("2026-06-20"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2026-01-10"));

    const tiposComPeriodoValido: TipoDeDocumentoDeHabilitacao[] = [
      "ContratoSocial",
      "CndFederal",
      "CrfFgts",
      "Cndt",
      "CertidaoEstadual",
      "CertidaoMunicipal",
      "CertidaoNegativaDeFalencia",
    ];

    for (const tipo of tiposComPeriodoValido) {
      dossie.adicionarCertidao(tipo, periodoValido, arquivo);
    }

    dossie.adicionarCertidao("AtestadoDeCapacidadeTecnica", periodoAVencer, arquivo);

    const prontidao = dossie.calcularProntidaoParaEdital(criarEditalSintetico(), hoje);

    expect(prontidao).toEqual({
      placar: "Pendente",
      pendencias: [{ categoria: "Tecnica", motivo: "CertidaoAVencer" }],
    });
  });

  it("retorna Inapta quando a única Certidão de um tipo está Vencida", () => {
    const hoje = new Date("2026-06-01");
    const dossie = DossieDeHabilitacao.criar(crypto.randomUUID());
    const periodoValido = PeriodoDeValidade.criar(new Date("2026-01-01"), new Date("2027-01-01"));
    const periodoVencido = PeriodoDeValidade.criar(new Date("2024-01-01"), new Date("2025-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2026-01-10"));

    const tiposComPeriodoValido: TipoDeDocumentoDeHabilitacao[] = [
      "ContratoSocial",
      "CndFederal",
      "CrfFgts",
      "Cndt",
      "CertidaoEstadual",
      "CertidaoMunicipal",
      "CertidaoNegativaDeFalencia",
    ];

    for (const tipo of tiposComPeriodoValido) {
      dossie.adicionarCertidao(tipo, periodoValido, arquivo);
    }

    dossie.adicionarCertidao("AtestadoDeCapacidadeTecnica", periodoVencido, arquivo);

    const prontidao = dossie.calcularProntidaoParaEdital(criarEditalSintetico(), hoje);

    expect(prontidao).toEqual({
      placar: "Inapta",
      pendencias: [{ categoria: "Tecnica", motivo: "CertidaoVencida" }],
    });
  });

  it("reporta o motivo mais grave quando dois tipos da mesma categoria têm problemas diferentes", () => {
    const hoje = new Date("2026-06-01");
    const dossie = DossieDeHabilitacao.criar(crypto.randomUUID());
    const periodoValido = PeriodoDeValidade.criar(new Date("2026-01-01"), new Date("2027-01-01"));
    const periodoVencido = PeriodoDeValidade.criar(new Date("2024-01-01"), new Date("2025-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2026-01-10"));

    const tiposComPeriodoValido: TipoDeDocumentoDeHabilitacao[] = [
      "ContratoSocial",
      "CndFederal",
      "CrfFgts",
      "CertidaoEstadual",
      // "CertidaoMunicipal" (FiscalETrabalhista) propositalmente nunca cadastrado
      "CertidaoNegativaDeFalencia",
      "AtestadoDeCapacidadeTecnica",
    ];

    for (const tipo of tiposComPeriodoValido) {
      dossie.adicionarCertidao(tipo, periodoValido, arquivo);
    }

    dossie.adicionarCertidao("Cndt", periodoVencido, arquivo); // FiscalETrabalhista, Vencida

    const prontidao = dossie.calcularProntidaoParaEdital(criarEditalSintetico(), hoje);

    expect(prontidao).toEqual({
      placar: "Inapta",
      pendencias: [{ categoria: "FiscalETrabalhista", motivo: "SemCertidaoCadastrada" }],
    });
  });

  it("uma categoria Inapta domina o placar geral mesmo com outra categoria Pendente", () => {
    const hoje = new Date("2026-06-01");
    const dossie = DossieDeHabilitacao.criar(crypto.randomUUID());
    const periodoValido = PeriodoDeValidade.criar(new Date("2026-01-01"), new Date("2027-01-01"));
    const periodoAVencer = PeriodoDeValidade.criar(new Date("2025-01-01"), new Date("2026-06-20"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2026-01-10"));

    const tiposComPeriodoValido: TipoDeDocumentoDeHabilitacao[] = [
      // "ContratoSocial" (Juridica) propositalmente nunca cadastrado
      "CndFederal",
      "CrfFgts",
      "Cndt",
      "CertidaoEstadual",
      "CertidaoMunicipal",
      "CertidaoNegativaDeFalencia",
    ];

    for (const tipo of tiposComPeriodoValido) {
      dossie.adicionarCertidao(tipo, periodoValido, arquivo);
    }

    dossie.adicionarCertidao("AtestadoDeCapacidadeTecnica", periodoAVencer, arquivo); // Tecnica, AVencer

    const prontidao = dossie.calcularProntidaoParaEdital(criarEditalSintetico(), hoje);

    expect(prontidao.placar).toBe("Inapta");
    expect(prontidao.pendencias).toEqual(
      expect.arrayContaining([
        { categoria: "Juridica", motivo: "SemCertidaoCadastrada" },
        { categoria: "Tecnica", motivo: "CertidaoAVencer" },
      ]),
    );
    expect(prontidao.pendencias).toHaveLength(2);
  });

  it("usa a Certidão de dataDeValidade mais distante no futuro quando há mais de uma do mesmo tipo", () => {
    const hoje = new Date("2026-06-01");
    const dossie = DossieDeHabilitacao.criar(crypto.randomUUID());
    const periodoValido = PeriodoDeValidade.criar(new Date("2026-01-01"), new Date("2027-01-01"));
    const periodoVencido = PeriodoDeValidade.criar(new Date("2024-01-01"), new Date("2025-01-01"));
    const arquivo = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", new Date("2026-01-10"));

    const tiposComPeriodoValido: TipoDeDocumentoDeHabilitacao[] = [
      "ContratoSocial",
      "CrfFgts",
      "Cndt",
      "CertidaoEstadual",
      "CertidaoMunicipal",
      "CertidaoNegativaDeFalencia",
      "AtestadoDeCapacidadeTecnica",
    ];

    for (const tipo of tiposComPeriodoValido) {
      dossie.adicionarCertidao(tipo, periodoValido, arquivo);
    }

    // CndFederal com duas Certidões: a antiga (vencida) cadastrada primeiro,
    // a renovação (válida, dataDeValidade mais distante) cadastrada depois.
    dossie.adicionarCertidao("CndFederal", periodoVencido, arquivo);
    dossie.adicionarCertidao("CndFederal", periodoValido, arquivo);

    const prontidao = dossie.calcularProntidaoParaEdital(criarEditalSintetico(), hoje);

    expect(prontidao).toEqual({ placar: "Apta", pendencias: [] });
  });

  it("retorna Inapta com pendência em toda categoria exigida quando o Dossiê não tem nenhuma Certidão", () => {
    const hoje = new Date("2026-06-01");
    const dossie = DossieDeHabilitacao.criar(crypto.randomUUID());

    const prontidao = dossie.calcularProntidaoParaEdital(criarEditalSintetico(), hoje);

    expect(prontidao).toEqual({
      placar: "Inapta",
      pendencias: [
        { categoria: "Juridica", motivo: "SemCertidaoCadastrada" },
        { categoria: "FiscalETrabalhista", motivo: "SemCertidaoCadastrada" },
        { categoria: "EconomicoFinanceira", motivo: "SemCertidaoCadastrada" },
        { categoria: "Tecnica", motivo: "SemCertidaoCadastrada" },
      ],
    });
  });
});
