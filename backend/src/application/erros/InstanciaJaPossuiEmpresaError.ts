export class InstanciaJaPossuiEmpresaError extends Error {
  constructor() {
    super("Esta instância já possui uma Empresa cadastrada.");
    this.name = "InstanciaJaPossuiEmpresaError";
  }
}
