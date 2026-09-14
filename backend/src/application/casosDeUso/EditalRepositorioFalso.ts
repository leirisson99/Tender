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
}
