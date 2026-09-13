import { CnpjInvalidoError } from "../erros/CnpjInvalidoError.js";

const PESOS_PRIMEIRO_DIGITO = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_SEGUNDO_DIGITO = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function calcularDigitoVerificador(base: number[], pesos: number[]): number {
  const soma = base.reduce((total, digito, indice) => total + digito * (pesos[indice] ?? 0), 0);
  const resto = soma % 11;

  return resto < 2 ? 0 : 11 - resto;
}

function digitoVerificadorEhValido(numero: string): boolean {
  if (numero.length !== 14) {
    return false;
  }

  const digitos = numero.split("").map(Number);
  const primeiroDigito = calcularDigitoVerificador(digitos.slice(0, 12), PESOS_PRIMEIRO_DIGITO);
  const segundoDigito = calcularDigitoVerificador(
    [...digitos.slice(0, 12), primeiroDigito],
    PESOS_SEGUNDO_DIGITO,
  );

  return digitos[12] === primeiroDigito && digitos[13] === segundoDigito;
}

export class Cnpj {
  private constructor(public readonly numero: string) {}

  static criar(bruto: string): Cnpj {
    const numero = bruto.replace(/\D/g, "");

    if (!digitoVerificadorEhValido(numero)) {
      throw new CnpjInvalidoError();
    }

    return new Cnpj(numero);
  }
}
