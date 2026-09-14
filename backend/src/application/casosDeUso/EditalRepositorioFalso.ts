import type { Edital } from "../../domain/entidades/Edital.js";
import type { EditalRepositorio } from "../../domain/portas/EditalRepositorio.js";

export class EditalRepositorioFalso implements EditalRepositorio {
  private readonly editais: Edital[] = [];
  chamadasDeSalvar = 0;

  async buscarUltimaVersao(numeroDeProcesso: string, nomeDoOrgao: string): Promise<Edital | null> {
    const versoes = this.editais.filter(
      (edital) => edital.numeroDeProcesso === numeroDeProcesso && edital.orgao.nome === nomeDoOrgao,
    );

    if (versoes.length === 0) {
      return null;
    }

    return versoes.reduce((maisRecente, atual) => (atual.versao > maisRecente.versao ? atual : maisRecente));
  }

  async salvar(edital: Edital): Promise<void> {
    this.editais.push(edital);
    this.chamadasDeSalvar += 1;
  }

  todasAsVersoesSalvas(numeroDeProcesso: string, nomeDoOrgao: string): readonly Edital[] {
    return this.editais.filter(
      (edital) => edital.numeroDeProcesso === numeroDeProcesso && edital.orgao.nome === nomeDoOrgao,
    );
  }

  async listarPendentesDeCompatibilidade(): Promise<Edital[]> {
    const ultimaVersaoPorEditalId = new Map<string, Edital>();

    for (const edital of this.editais) {
      const atual = ultimaVersaoPorEditalId.get(edital.id);

      if (atual === undefined || edital.versao > atual.versao) {
        ultimaVersaoPorEditalId.set(edital.id, edital);
      }
    }

    return [...ultimaVersaoPorEditalId.values()].filter((edital) => edital.segmentoInferido === null);
  }

  async atualizarClassificacao(edital: Edital): Promise<void> {
    const indice = this.editais.findIndex((e) => e.id === edital.id && e.versao === edital.versao);

    if (indice !== -1) {
      this.editais[indice] = edital;
    }
  }

  async listarCompativeis(): Promise<Edital[]> {
    const ultimaVersaoPorEditalId = new Map<string, Edital>();

    for (const edital of this.editais) {
      const atual = ultimaVersaoPorEditalId.get(edital.id);

      if (atual === undefined || edital.versao > atual.versao) {
        ultimaVersaoPorEditalId.set(edital.id, edital);
      }
    }

    return [...ultimaVersaoPorEditalId.values()].filter((edital) => edital.segmentoInferido !== null);
  }
}
