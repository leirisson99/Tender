import { ValorMonetarioInvalidoError } from "../erros/ValorMonetarioInvalidoError.js";

export class Dinheiro {
  private constructor(
    public readonly valorEmCentavos: number,
    public readonly moeda: "BRL",
  ) {}

  static criar(valorEmCentavos: number): Dinheiro {
    if (!Number.isInteger(valorEmCentavos) || valorEmCentavos < 0) {
      throw new ValorMonetarioInvalidoError();
    }

    return new Dinheiro(valorEmCentavos, "BRL");
  }
}
