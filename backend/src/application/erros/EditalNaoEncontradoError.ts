export class EditalNaoEncontradoError extends Error {
  constructor() {
    super("Nenhum Edital encontrado para o número de processo e órgão informados.");
    this.name = "EditalNaoEncontradoError";
  }
}
