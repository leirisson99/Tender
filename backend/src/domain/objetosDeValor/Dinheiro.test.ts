import { describe, expect, it } from "vitest";
import { Dinheiro } from "./Dinheiro.js";
import { ValorMonetarioInvalidoError } from "../erros/ValorMonetarioInvalidoError.js";

describe("Dinheiro.criar", () => {
  it("aceita um valor em centavos inteiro maior que zero", () => {
    const dinheiro = Dinheiro.criar(150000);

    expect(dinheiro.valorEmCentavos).toBe(150000);
    expect(dinheiro.moeda).toBe("BRL");
  });

  it("aceita zero centavos", () => {
    const dinheiro = Dinheiro.criar(0);

    expect(dinheiro.valorEmCentavos).toBe(0);
  });

  it("rejeita um valor fracionado (float)", () => {
    expect(() => Dinheiro.criar(150.5)).toThrow(ValorMonetarioInvalidoError);
  });

  it("rejeita um valor negativo", () => {
    expect(() => Dinheiro.criar(-100)).toThrow(ValorMonetarioInvalidoError);
  });
});
