import { RegiaoInvalidaError } from "../erros/RegiaoInvalidaError.js";

const UFS_VALIDAS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export class Regiao {
  private constructor(
    public readonly uf: string,
    public readonly municipio: string | null,
  ) {}

  static criar(uf: string, municipio?: string): Regiao {
    if (!UFS_VALIDAS.includes(uf)) {
      throw new RegiaoInvalidaError();
    }

    return new Regiao(uf, municipio ?? null);
  }
}
