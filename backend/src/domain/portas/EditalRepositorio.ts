import type { Edital } from "../entidades/Edital.js";

export interface EditalRepositorio {
  buscarUltimaVersao(numeroDeProcesso: string, nomeDoOrgao: string): Promise<Edital | null>;
  salvar(edital: Edital): Promise<void>;
}
