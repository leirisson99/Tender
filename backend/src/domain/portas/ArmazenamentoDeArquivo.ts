import type { ReferenciaDeArquivo } from "../objetosDeValor/ReferenciaDeArquivo.js";

export interface ArmazenamentoDeArquivo {
  salvar(nomeOriginal: string, conteudo: Buffer): Promise<ReferenciaDeArquivo>;
}
