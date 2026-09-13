import type { Empresa } from "../../domain/entidades/Empresa.js";
import type { EmpresaRepositorio } from "../../domain/portas/EmpresaRepositorio.js";

export class EmpresaRepositorioFalso implements EmpresaRepositorio {
  private empresa: Empresa | null = null;
  chamadasDeSalvar = 0;

  async existeEmpresaCadastrada(): Promise<boolean> {
    return this.empresa !== null;
  }

  async buscarEmpresaUnica(): Promise<Empresa | null> {
    return this.empresa;
  }

  async salvar(empresa: Empresa): Promise<void> {
    this.empresa = empresa;
    this.chamadasDeSalvar += 1;
  }
}
