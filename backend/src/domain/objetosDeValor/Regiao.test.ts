import { describe, expect, it } from "vitest";
import { Regiao } from "./Regiao.js";
import { RegiaoInvalidaError } from "../erros/RegiaoInvalidaError.js";

describe("Regiao.criar", () => {
  it("aceita uma UF válida sem município", () => {
    const regiao = Regiao.criar("SC");

    expect(regiao.uf).toBe("SC");
    expect(regiao.municipio).toBeNull();
  });

  it("aceita uma UF válida com município", () => {
    const regiao = Regiao.criar("SC", "Florianópolis");

    expect(regiao.uf).toBe("SC");
    expect(regiao.municipio).toBe("Florianópolis");
  });

  it("rejeita uma UF que não corresponde a nenhum estado brasileiro ou ao DF", () => {
    expect(() => Regiao.criar("XX")).toThrow(RegiaoInvalidaError);
  });
});
