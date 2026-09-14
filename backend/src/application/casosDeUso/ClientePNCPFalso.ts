import type { ClientePNCP, EditalExternoPNCP } from "../../domain/portas/ClientePNCP.js";

export class ClientePNCPFalso implements ClientePNCP {
  itens: EditalExternoPNCP[] = [];
  erroASerLancado: Error | null = null;

  async buscarEditaisPublicados(): Promise<EditalExternoPNCP[]> {
    if (this.erroASerLancado !== null) {
      throw this.erroASerLancado;
    }

    return this.itens;
  }
}
