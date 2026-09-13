import { Empresa } from "../../domain/entidades/Empresa.js";
import { Cnpj } from "../../domain/objetosDeValor/Cnpj.js";
import type { EmpresaRepositorio } from "../../domain/portas/EmpresaRepositorio.js";
import { InstanciaJaPossuiEmpresaError } from "../erros/InstanciaJaPossuiEmpresaError.js";

export interface CadastrarEmpresaEntrada {
  cnpj: string;
  razaoSocial: string;
}

export class CadastrarEmpresa {
  constructor(private readonly empresaRepositorio: EmpresaRepositorio) {}

  async executar(entrada: CadastrarEmpresaEntrada): Promise<Empresa> {
    if (await this.empresaRepositorio.existeEmpresaCadastrada()) {
      throw new InstanciaJaPossuiEmpresaError();
    }

    const empresa = Empresa.criar(Cnpj.criar(entrada.cnpj), entrada.razaoSocial);
    await this.empresaRepositorio.salvar(empresa);

    return empresa;
  }
}
