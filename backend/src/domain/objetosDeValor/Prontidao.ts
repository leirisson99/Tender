import type { PlacarDeProntidao } from "./PlacarDeProntidao.js";
import type { Pendencia } from "./Pendencia.js";

export interface Prontidao {
  placar: PlacarDeProntidao;
  pendencias: Pendencia[];
}
