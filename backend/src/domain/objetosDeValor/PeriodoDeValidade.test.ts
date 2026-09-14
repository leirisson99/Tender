import { describe, expect, it } from "vitest";
import { PeriodoDeValidade } from "./PeriodoDeValidade.js";
import { PeriodoDeValidadeInvalidoError } from "../erros/PeriodoDeValidadeInvalidoError.js";

describe("PeriodoDeValidade.criar", () => {
  it("aceita dataDeValidade posterior a dataDeEmissao", () => {
    const dataDeEmissao = new Date("2026-01-01");
    const dataDeValidade = new Date("2027-01-01");

    const periodo = PeriodoDeValidade.criar(dataDeEmissao, dataDeValidade);

    expect(periodo.dataDeEmissao).toBe(dataDeEmissao);
    expect(periodo.dataDeValidade).toBe(dataDeValidade);
  });

  it("rejeita dataDeValidade anterior ou igual à dataDeEmissao", () => {
    expect(() => PeriodoDeValidade.criar(new Date("2026-01-01"), new Date("2026-01-01"))).toThrow(
      PeriodoDeValidadeInvalidoError,
    );
    expect(() => PeriodoDeValidade.criar(new Date("2026-01-01"), new Date("2025-12-31"))).toThrow(
      PeriodoDeValidadeInvalidoError,
    );
  });
});
