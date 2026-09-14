import type { DossieDeHabilitacao } from "../../domain/entidades/DossieDeHabilitacao.js";
import type { EmpresaId } from "../../domain/entidades/Empresa.js";
import type { DossieDeHabilitacaoRepositorio } from "../../domain/portas/DossieDeHabilitacaoRepositorio.js";

export class DossieDeHabilitacaoRepositorioFalso implements DossieDeHabilitacaoRepositorio {
  private readonly dossies: DossieDeHabilitacao[] = [];
  chamadasDeSalvar = 0;

  async buscarPorEmpresaId(empresaId: EmpresaId): Promise<DossieDeHabilitacao | null> {
    return this.dossies.find((dossie) => dossie.empresaId === empresaId) ?? null;
  }

  async salvar(dossie: DossieDeHabilitacao): Promise<void> {
    const indice = this.dossies.findIndex((existente) => existente.id === dossie.id);

    if (indice === -1) {
      this.dossies.push(dossie);
    } else {
      this.dossies[indice] = dossie;
    }

    this.chamadasDeSalvar += 1;
  }
}
