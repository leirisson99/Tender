import type { Relogio } from "../../domain/portas/Relogio.js";

export class RelogioFalso implements Relogio {
  constructor(private readonly dataFixa: Date) {}

  agora(): Date {
    return this.dataFixa;
  }
}
