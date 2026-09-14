export class PeriodoDeValidadeInvalidoError extends Error {
  constructor() {
    super("dataDeValidade deve ser posterior a dataDeEmissao.");
    this.name = "PeriodoDeValidadeInvalidoError";
  }
}
