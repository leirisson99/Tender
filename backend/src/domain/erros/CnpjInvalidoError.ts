export class CnpjInvalidoError extends Error {
  constructor() {
    super("CNPJ inválido: dígito verificador não confere.");
    this.name = "CnpjInvalidoError";
  }
}
