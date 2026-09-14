import { describe, expect, it } from "vitest";
import { construirApp } from "../app.js";
import { EmpresaRepositorioFalso } from "../../../application/casosDeUso/EmpresaRepositorioFalso.js";
import { DossieDeHabilitacaoRepositorioFalso } from "../../../application/casosDeUso/DossieDeHabilitacaoRepositorioFalso.js";
import { ArmazenamentoDeArquivoFalso } from "../../../application/casosDeUso/ArmazenamentoDeArquivoFalso.js";

describe("POST /dossie/certidoes", () => {
  it("retorna 201 e a Certidão criada no caminho feliz", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const app = construirApp(
      empresaRepositorio,
      new DossieDeHabilitacaoRepositorioFalso(),
      new ArmazenamentoDeArquivoFalso(),
    );
    await app.inject({
      method: "POST",
      url: "/empresa",
      payload: { cnpj: "12345678000195", razaoSocial: "Fábrica Fictícia de Exemplos Ltda" },
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/dossie/certidoes",
      payload: {
        tipo: "CndFederal",
        dataDeEmissao: "2026-01-01",
        dataDeValidade: "2027-01-01",
        nomeOriginal: "certidao.pdf",
        conteudoBase64: Buffer.from("conteúdo fictício").toString("base64"),
      },
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = resposta.json();
    expect(corpo.tipo).toBe("CndFederal");
    expect(corpo.arquivo.nomeOriginal).toBe("certidao.pdf");
    expect(corpo.id).toBeTruthy();
  });

  it("retorna 400 quando o período de validade é inválido", async () => {
    const app = construirApp(
      new EmpresaRepositorioFalso(),
      new DossieDeHabilitacaoRepositorioFalso(),
      new ArmazenamentoDeArquivoFalso(),
    );
    await app.inject({
      method: "POST",
      url: "/empresa",
      payload: { cnpj: "12345678000195", razaoSocial: "Fábrica Fictícia de Exemplos Ltda" },
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/dossie/certidoes",
      payload: {
        tipo: "CndFederal",
        dataDeEmissao: "2027-01-01",
        dataDeValidade: "2026-01-01",
        nomeOriginal: "certidao.pdf",
        conteudoBase64: Buffer.from("conteúdo fictício").toString("base64"),
      },
    });

    expect(resposta.statusCode).toBe(400);
  });

  it("retorna 404 quando não há Empresa cadastrada", async () => {
    const app = construirApp(
      new EmpresaRepositorioFalso(),
      new DossieDeHabilitacaoRepositorioFalso(),
      new ArmazenamentoDeArquivoFalso(),
    );

    const resposta = await app.inject({
      method: "POST",
      url: "/dossie/certidoes",
      payload: {
        tipo: "CndFederal",
        dataDeEmissao: "2026-01-01",
        dataDeValidade: "2027-01-01",
        nomeOriginal: "certidao.pdf",
        conteudoBase64: Buffer.from("conteúdo fictício").toString("base64"),
      },
    });

    expect(resposta.statusCode).toBe(404);
  });
});
