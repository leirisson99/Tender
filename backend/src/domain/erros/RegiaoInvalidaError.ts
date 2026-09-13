export class RegiaoInvalidaError extends Error {
  constructor() {
    super("Região inválida: UF não corresponde a um estado brasileiro ou ao DF.");
    this.name = "RegiaoInvalidaError";
  }
}
