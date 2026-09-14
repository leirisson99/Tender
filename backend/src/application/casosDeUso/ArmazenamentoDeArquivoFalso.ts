import type { ArmazenamentoDeArquivo } from "../../domain/portas/ArmazenamentoDeArquivo.js";
import { ReferenciaDeArquivo } from "../../domain/objetosDeValor/ReferenciaDeArquivo.js";

export class ArmazenamentoDeArquivoFalso implements ArmazenamentoDeArquivo {
  chamadasDeSalvar = 0;

  async salvar(nomeOriginal: string, _conteudo: Buffer): Promise<ReferenciaDeArquivo> {
    this.chamadasDeSalvar += 1;

    return ReferenciaDeArquivo.criar(`fake://${nomeOriginal}`, nomeOriginal, new Date());
  }
}
