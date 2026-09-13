import { describe, expect, it } from "vitest";
import { construirApp } from "../app.js";
import { EmpresaRepositorioFalso } from "../../../application/casosDeUso/EmpresaRepositorioFalso.js";

describe("POST /empresa", () => {
  it("retorna 201 e a Empresa criada no caminho feliz", async () => {
    const app = construirApp(new EmpresaRepositorioFalso());

    const resposta = await app.inject({
      method: "POST",
      url: "/empresa",
      payload: { cnpj: "12345678000195", razaoSocial: "Fábrica Fictícia de Exemplos Ltda" },
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = resposta.json();
    expect(corpo.cnpj).toBe("12345678000195");
    expect(corpo.razaoSocial).toBe("Fábrica Fictícia de Exemplos Ltda");
    expect(corpo.id).toBeTruthy();
  });

  it("retorna 400 quando o CNPJ é inválido", async () => {
    const app = construirApp(new EmpresaRepositorioFalso());

    const resposta = await app.inject({
      method: "POST",
      url: "/empresa",
      payload: { cnpj: "12345678000194", razaoSocial: "Fábrica Fictícia de Exemplos Ltda" },
    });

    expect(resposta.statusCode).toBe(400);
  });

  it("retorna 409 na segunda tentativa de cadastro", async () => {
    const app = construirApp(new EmpresaRepositorioFalso());
    await app.inject({
      method: "POST",
      url: "/empresa",
      payload: { cnpj: "12345678000195", razaoSocial: "Fábrica Fictícia de Exemplos Ltda" },
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/empresa",
      payload: { cnpj: "12345678000195", razaoSocial: "Outra Fábrica Fictícia Ltda" },
    });

    expect(resposta.statusCode).toBe(409);
  });
});

describe("POST /empresa/monitoramentos", () => {
  it("retorna 201 e o Monitoramento criado no caminho feliz", async () => {
    const app = construirApp(new EmpresaRepositorioFalso());
    await app.inject({
      method: "POST",
      url: "/empresa",
      payload: { cnpj: "12345678000195", razaoSocial: "Fábrica Fictícia de Exemplos Ltda" },
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/empresa/monitoramentos",
      payload: {
        cnae: { codigo: "4120-4/00", descricao: "Construção de edifícios" },
        regiao: { uf: "SC" },
      },
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = resposta.json();
    expect(corpo.ativo).toBe(true);
    expect(corpo.segmento.codigo).toBe("4120-4/00");
    expect(corpo.regiao.uf).toBe("SC");
  });

  it("retorna 400 quando o CNAE é inválido", async () => {
    const app = construirApp(new EmpresaRepositorioFalso());
    await app.inject({
      method: "POST",
      url: "/empresa",
      payload: { cnpj: "12345678000195", razaoSocial: "Fábrica Fictícia de Exemplos Ltda" },
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/empresa/monitoramentos",
      payload: {
        cnae: { codigo: "12345", descricao: "Descrição qualquer" },
        regiao: { uf: "SC" },
      },
    });

    expect(resposta.statusCode).toBe(400);
  });

  it("retorna 400 quando a UF é inválida", async () => {
    const app = construirApp(new EmpresaRepositorioFalso());
    await app.inject({
      method: "POST",
      url: "/empresa",
      payload: { cnpj: "12345678000195", razaoSocial: "Fábrica Fictícia de Exemplos Ltda" },
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/empresa/monitoramentos",
      payload: {
        cnae: { codigo: "4120-4/00", descricao: "Construção de edifícios" },
        regiao: { uf: "XX" },
      },
    });

    expect(resposta.statusCode).toBe(400);
  });

  it("retorna 404 quando não há Empresa cadastrada", async () => {
    const app = construirApp(new EmpresaRepositorioFalso());

    const resposta = await app.inject({
      method: "POST",
      url: "/empresa/monitoramentos",
      payload: {
        cnae: { codigo: "4120-4/00", descricao: "Construção de edifícios" },
        regiao: { uf: "SC" },
      },
    });

    expect(resposta.statusCode).toBe(404);
  });

  it("retorna 409 quando o Monitoramento já existe", async () => {
    const app = construirApp(new EmpresaRepositorioFalso());
    await app.inject({
      method: "POST",
      url: "/empresa",
      payload: { cnpj: "12345678000195", razaoSocial: "Fábrica Fictícia de Exemplos Ltda" },
    });
    const payload = {
      cnae: { codigo: "4120-4/00", descricao: "Construção de edifícios" },
      regiao: { uf: "SC" },
    };
    await app.inject({ method: "POST", url: "/empresa/monitoramentos", payload });

    const resposta = await app.inject({ method: "POST", url: "/empresa/monitoramentos", payload });

    expect(resposta.statusCode).toBe(409);
  });
});
