import { CnaeInvalidoError } from "../erros/CnaeInvalidoError.js";

const FORMATO_OFICIAL = /^\d{4}-\d\/\d{2}$/;

export class Cnae {
  private constructor(
    public readonly codigo: string,
    public readonly descricao: string,
  ) {}

  static criar(codigo: string, descricao: string): Cnae {
    if (!FORMATO_OFICIAL.test(codigo)) {
      throw new CnaeInvalidoError();
    }

    return new Cnae(codigo, descricao);
  }
}
