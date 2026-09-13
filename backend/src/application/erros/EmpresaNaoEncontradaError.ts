export class EmpresaNaoEncontradaError extends Error {
  constructor() {
    super("Nenhuma Empresa cadastrada nesta instância.");
    this.name = "EmpresaNaoEncontradaError";
  }
}
