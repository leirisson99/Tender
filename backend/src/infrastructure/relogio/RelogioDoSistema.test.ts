import { describe, expect, it } from "vitest";
import { RelogioDoSistema } from "./RelogioDoSistema.js";

describe("RelogioDoSistema.agora", () => {
  it("retorna a data/hora atual, dentro de uma janela de poucos milissegundos", () => {
    const antes = Date.now();

    const agora = new RelogioDoSistema().agora();

    const depois = Date.now();

    expect(agora.getTime()).toBeGreaterThanOrEqual(antes);
    expect(agora.getTime()).toBeLessThanOrEqual(depois);
  });
});
