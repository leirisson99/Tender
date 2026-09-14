import { describe, expect, it } from "vitest";
import { ReferenciaDeArquivo } from "./ReferenciaDeArquivo.js";

describe("ReferenciaDeArquivo.criar", () => {
  it("monta o objeto de valor com caminho, nomeOriginal e enviadoEm", () => {
    const enviadoEm = new Date("2026-01-10");

    const referencia = ReferenciaDeArquivo.criar("uploads/abc.pdf", "certidao.pdf", enviadoEm);

    expect(referencia.caminho).toBe("uploads/abc.pdf");
    expect(referencia.nomeOriginal).toBe("certidao.pdf");
    expect(referencia.enviadoEm).toBe(enviadoEm);
  });
});
