import type { CategoriaDeHabilitacao } from "./CategoriaDeHabilitacao.js";
import type { MotivoDaPendencia } from "./MotivoDaPendencia.js";

export interface Pendencia {
  categoria: CategoriaDeHabilitacao;
  motivo: MotivoDaPendencia;
}
