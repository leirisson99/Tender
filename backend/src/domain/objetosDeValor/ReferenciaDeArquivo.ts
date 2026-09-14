export class ReferenciaDeArquivo {
  private constructor(
    public readonly caminho: string,
    public readonly nomeOriginal: string,
    public readonly enviadoEm: Date,
  ) {}

  static criar(caminho: string, nomeOriginal: string, enviadoEm: Date): ReferenciaDeArquivo {
    return new ReferenciaDeArquivo(caminho, nomeOriginal, enviadoEm);
  }
}
