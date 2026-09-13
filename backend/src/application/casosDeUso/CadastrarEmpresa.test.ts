import { describe, expect, it } from "vitest";
import { CadastrarEmpresa } from "./CadastrarEmpresa.js";
import { EmpresaRepositorioFalso } from "./EmpresaRepositorioFalso.js";
import { CnpjInvalidoError } from "../../domain/erros/CnpjInvalidoError.js";
import { InstanciaJaPossuiEmpresaError } from "../erros/InstanciaJaPossuiEmpresaError.js";

describe("CadastrarEmpresa", () => {
  it("cria a Empresa quando nenhuma está cadastrada", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const cadastrarEmpresa = new CadastrarEmpresa(empresaRepositorio);

    const empresa = await cadastrarEmpresa.executar({
      cnpj: "12345678000195",
      razaoSocial: "Fábrica Fictícia de Exemplos Ltda",
    });

    expect(empresa.cnpj.numero).toBe("12345678000195");
    expect(empresa.razaoSocial).toBe("Fábrica Fictícia de Exemplos Ltda");
    expect(empresaRepositorio.chamadasDeSalvar).toBe(1);
  });

  it("propaga CnpjInvalidoError e não persiste quando o CNPJ é inválido", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const cadastrarEmpresa = new CadastrarEmpresa(empresaRepositorio);

    await expect(
      cadastrarEmpresa.executar({
        cnpj: "12345678000194",
        razaoSocial: "Fábrica Fictícia de Exemplos Ltda",
      }),
    ).rejects.toThrow(CnpjInvalidoError);
    expect(empresaRepositorio.chamadasDeSalvar).toBe(0);
  });

  it("rejeita cadastrar uma segunda Empresa quando já existe uma cadastrada", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const cadastrarEmpresa = new CadastrarEmpresa(empresaRepositorio);
    await cadastrarEmpresa.executar({
      cnpj: "12345678000195",
      razaoSocial: "Fábrica Fictícia de Exemplos Ltda",
    });

    await expect(
      cadastrarEmpresa.executar({
        cnpj: "12345678000195",
        razaoSocial: "Outra Fábrica Fictícia Ltda",
      }),
    ).rejects.toThrow(InstanciaJaPossuiEmpresaError);
    expect(empresaRepositorio.chamadasDeSalvar).toBe(1);
  });
});
