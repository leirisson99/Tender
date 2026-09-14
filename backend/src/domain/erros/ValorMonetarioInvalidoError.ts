export class ValorMonetarioInvalidoError extends Error {
  constructor() {
    super("Valor monetário inválido: deve ser um número inteiro de centavos maior ou igual a zero.");
    this.name = "ValorMonetarioInvalidoError";
  }
}
