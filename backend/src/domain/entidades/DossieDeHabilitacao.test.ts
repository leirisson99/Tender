import { describe, expect, it } from "vitest";
import { Certidao, DossieDeHabilitacao } from "./DossieDeHabilitacao.js";
import { PeriodoDeValidade } from "../objetosDeValor/PeriodoDeValidade.js";
import { ReferenciaDeArquivo } from "../objetosDeValor/ReferenciaDeArquivo.js";

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
