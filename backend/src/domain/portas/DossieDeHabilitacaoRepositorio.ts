import type { DossieDeHabilitacao } from "../entidades/DossieDeHabilitacao.js";
import type { EmpresaId } from "../entidades/Empresa.js";

export interface DossieDeHabilitacaoRepositorio {
  buscarPorEmpresaId(empresaId: EmpresaId): Promise<DossieDeHabilitacao | null>;
  salvar(dossie: DossieDeHabilitacao): Promise<void>;
}
