import type { Empresa } from "../entidades/Empresa.js";

export interface EmpresaRepositorio {
  existeEmpresaCadastrada(): Promise<boolean>;
  buscarEmpresaUnica(): Promise<Empresa | null>;
  salvar(empresa: Empresa): Promise<void>;
}
