import type { Relogio } from "../../domain/portas/Relogio.js";

export class RelogioDoSistema implements Relogio {
  agora(): Date {
    return new Date();
  }
}
