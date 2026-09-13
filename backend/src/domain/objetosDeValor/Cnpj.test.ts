import { describe, expect, it } from "vitest";
import { Cnpj } from "./Cnpj.js";
import { CnpjInvalidoError } from "../erros/CnpjInvalidoError.js";

describe("Cnpj.criar", () => {
  it("aceita um CNPJ sintético válido sem pontuação", () => {
    const cnpj = Cnpj.criar("12345678000195");

    expect(cnpj.numero).toBe("12345678000195");
  });

  it("aceita um CNPJ sintético válido com pontuação e remove a formatação", () => {
    const cnpj = Cnpj.criar("12.345.678/0001-95");

    expect(cnpj.numero).toBe("12345678000195");
  });

  it("rejeita CNPJ com dígito verificador inválido", () => {
    expect(() => Cnpj.criar("12345678000194")).toThrow(CnpjInvalidoError);
  });
});
