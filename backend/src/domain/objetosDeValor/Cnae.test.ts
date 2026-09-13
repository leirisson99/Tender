import { describe, expect, it } from "vitest";
import { Cnae } from "./Cnae.js";
import { CnaeInvalidoError } from "../erros/CnaeInvalidoError.js";

describe("Cnae.criar", () => {
  it("aceita um código no formato oficial", () => {
    const cnae = Cnae.criar("4120-4/00", "Construção de edifícios");

    expect(cnae.codigo).toBe("4120-4/00");
    expect(cnae.descricao).toBe("Construção de edifícios");
  });

  it("rejeita um código fora do formato oficial", () => {
    expect(() => Cnae.criar("12345", "Descrição qualquer")).toThrow(CnaeInvalidoError);
  });
});
