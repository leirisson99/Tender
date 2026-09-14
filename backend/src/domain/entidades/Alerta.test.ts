import { describe, expect, it } from "vitest";
import { Alerta } from "./Alerta.js";

describe("Alerta.criar", () => {
  it("monta uma instância com canal, status e momentoDeEnvio fixos", () => {
    const empresaId = crypto.randomUUID();
    const editalId = "PE-0042/2026::Prefeitura Fictícia de Exemplópolis";

    const alerta = Alerta.criar(empresaId, "EditalCompativel", { tipo: "Edital", id: editalId });

    expect(alerta.id).toBeTruthy();
    expect(alerta.empresaId).toBe(empresaId);
    expect(alerta.tipo).toBe("EditalCompativel");
    expect(alerta.origem).toEqual({ tipo: "Edital", id: editalId });
    expect(alerta.canal).toBe("WhatsApp");
    expect(alerta.status).toBe("Pendente");
    expect(alerta.momentoDeEnvio).toBeNull();
  });
});

describe("Alerta.reconstituir", () => {
  it("reidrata uma instância preservando todos os atributos informados", () => {
    const id = crypto.randomUUID();
    const empresaId = crypto.randomUUID();
    const certidaoId = crypto.randomUUID();
    const momentoDeEnvio = new Date("2026-06-01T10:00:00Z");

    const alerta = Alerta.reconstituir(
      id,
      empresaId,
      "CertidaoVencida",
      { tipo: "Certidao", id: certidaoId },
      "WhatsApp",
      "Enviado",
      momentoDeEnvio,
    );

    expect(alerta.id).toBe(id);
    expect(alerta.empresaId).toBe(empresaId);
    expect(alerta.tipo).toBe("CertidaoVencida");
    expect(alerta.origem).toEqual({ tipo: "Certidao", id: certidaoId });
    expect(alerta.canal).toBe("WhatsApp");
    expect(alerta.status).toBe("Enviado");
    expect(alerta.momentoDeEnvio).toBe(momentoDeEnvio);
  });
});
