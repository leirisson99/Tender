import { DossieDeHabilitacao } from "../../domain/entidades/DossieDeHabilitacao.js";
import type { Prontidao } from "../../domain/objetosDeValor/Prontidao.js";
import type { EditalRepositorio } from "../../domain/portas/EditalRepositorio.js";
import type { EmpresaRepositorio } from "../../domain/portas/EmpresaRepositorio.js";
import type { DossieDeHabilitacaoRepositorio } from "../../domain/portas/DossieDeHabilitacaoRepositorio.js";
import type { Relogio } from "../../domain/portas/Relogio.js";
import { EditalNaoEncontradoError } from "../erros/EditalNaoEncontradoError.js";
import { EmpresaNaoEncontradaError } from "../erros/EmpresaNaoEncontradaError.js";

export interface CalcularProntidaoParaEditalEntrada {
  numeroDeProcesso: string;
  nomeDoOrgao: string;
}

export class CalcularProntidaoParaEdital {
  constructor(
    private readonly editalRepositorio: EditalRepositorio,
    private readonly empresaRepositorio: EmpresaRepositorio,
    private readonly dossieDeHabilitacaoRepositorio: DossieDeHabilitacaoRepositorio,
    private readonly relogio: Relogio,
  ) {}

  async executar(entrada: CalcularProntidaoParaEditalEntrada): Promise<Prontidao> {
    const edital = await this.editalRepositorio.buscarUltimaVersao(entrada.numeroDeProcesso, entrada.nomeDoOrgao);

    if (edital === null) {
      throw new EditalNaoEncontradoError();
    }

    const empresa = await this.empresaRepositorio.buscarEmpresaUnica();

    if (empresa === null) {
      throw new EmpresaNaoEncontradaError();
    }

    const dossieExistente = await this.dossieDeHabilitacaoRepositorio.buscarPorEmpresaId(empresa.id);
    const dossie = dossieExistente ?? DossieDeHabilitacao.criar(empresa.id);

    return dossie.calcularProntidaoParaEdital(edital, this.relogio.agora());
  }
}
