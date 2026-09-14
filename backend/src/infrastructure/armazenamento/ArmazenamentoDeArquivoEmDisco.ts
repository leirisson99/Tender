import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ArmazenamentoDeArquivo } from "../../domain/portas/ArmazenamentoDeArquivo.js";
import { ReferenciaDeArquivo } from "../../domain/objetosDeValor/ReferenciaDeArquivo.js";

export class ArmazenamentoDeArquivoEmDisco implements ArmazenamentoDeArquivo {
  constructor(private readonly diretorio: string) {}

  async salvar(nomeOriginal: string, conteudo: Buffer): Promise<ReferenciaDeArquivo> {
    await mkdir(this.diretorio, { recursive: true });

    const nomeUnico = `${crypto.randomUUID()}${path.extname(nomeOriginal)}`;
    const caminho = path.join(this.diretorio, nomeUnico);
    await writeFile(caminho, conteudo);

    return ReferenciaDeArquivo.criar(caminho, nomeOriginal, new Date());
  }
}
