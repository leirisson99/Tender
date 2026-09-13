export class CnaeInvalidoError extends Error {
  constructor() {
    super("CNAE inválido: código fora do formato oficial.");
    this.name = "CnaeInvalidoError";
  }
}
