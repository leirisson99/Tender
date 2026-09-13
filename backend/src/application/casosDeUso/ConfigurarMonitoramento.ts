import type { Monitoramento } from "../../domain/entidades/Empresa.js";
import { Cnae } from "../../domain/objetosDeValor/Cnae.js";
import { Regiao } from "../../domain/objetosDeValor/Regiao.js";
import type { EmpresaRepositorio } from "../../domain/portas/EmpresaRepositorio.js";
import { EmpresaNaoEncontradaError } from "../erros/EmpresaNaoEncontradaError.js";

export interface ConfigurarMonitoramentoEntrada {
  cnae: { codigo: string; descricao: string };
  regiao: { uf: string; municipio?: string | undefined };
}

export class ConfigurarMonitoramento {
  constructor(private readonly empresaRepositorio: EmpresaRepositorio) {}

  async executar(entrada: ConfigurarMonitoramentoEntrada): Promise<Monitoramento> {
    const empresa = await this.empresaRepositorio.buscarEmpresaUnica();

    if (empresa === null) {
      throw new EmpresaNaoEncontradaError();
    }

    const segmento = Cnae.criar(entrada.cnae.codigo, entrada.cnae.descricao);
    const regiao = Regiao.criar(entrada.regiao.uf, entrada.regiao.municipio);
    const monitoramento = empresa.adicionarMonitoramento(segmento, regiao);
    await this.empresaRepositorio.salvar(empresa);

    return monitoramento;
  }
}
