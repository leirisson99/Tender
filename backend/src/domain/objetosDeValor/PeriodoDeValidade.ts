import { PeriodoDeValidadeInvalidoError } from "../erros/PeriodoDeValidadeInvalidoError.js";

export class PeriodoDeValidade {
  private constructor(
    public readonly dataDeEmissao: Date,
    public readonly dataDeValidade: Date,
  ) {}

  static criar(dataDeEmissao: Date, dataDeValidade: Date): PeriodoDeValidade {
    if (dataDeValidade.getTime() <= dataDeEmissao.getTime()) {
      throw new PeriodoDeValidadeInvalidoError();
    }

    return new PeriodoDeValidade(dataDeEmissao, dataDeValidade);
  }
}
