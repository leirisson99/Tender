import type { EditalId } from "../entidades/Edital.js";
import type { CertidaoId } from "../entidades/DossieDeHabilitacao.js";

export interface OrigemDoAlerta {
  tipo: "Edital" | "Certidao";
  id: EditalId | CertidaoId;
}
