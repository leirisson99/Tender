import type { Cnpj } from "../objetosDeValor/Cnpj.js";
import type { Cnae } from "../objetosDeValor/Cnae.js";
import type { Regiao } from "../objetosDeValor/Regiao.js";
import { MonitoramentoDuplicadoError } from "../erros/MonitoramentoDuplicadoError.js";

export type EmpresaId = string;
export type MonitoramentoId = string;

export class Monitoramento {
  private constructor(
    public readonly id: MonitoramentoId,
    public readonly segmento: Cnae,
    public readonly regiao: Regiao,
    public readonly ativo: boolean,
  ) {}

  static criar(segmento: Cnae, regiao: Regiao): Monitoramento {
    return new Monitoramento(crypto.randomUUID(), segmento, regiao, true);
  }

  static reconstituir(id: MonitoramentoId, segmento: Cnae, regiao: Regiao, ativo: boolean): Monitoramento {
    return new Monitoramento(id, segmento, regiao, ativo);
  }
}

export class Empresa {
  private readonly listaDeMonitoramentos: Monitoramento[];

  private constructor(
    public readonly id: EmpresaId,
    public readonly cnpj: Cnpj,
    public readonly razaoSocial: string,
    monitoramentos: Monitoramento[],
  ) {
    this.listaDeMonitoramentos = monitoramentos;
  }

  get monitoramentos(): readonly Monitoramento[] {
    return this.listaDeMonitoramentos;
  }

  static criar(cnpj: Cnpj, razaoSocial: string): Empresa {
    return new Empresa(crypto.randomUUID(), cnpj, razaoSocial, []);
  }

  static reconstituir(
    id: EmpresaId,
    cnpj: Cnpj,
    razaoSocial: string,
    monitoramentos: Monitoramento[],
  ): Empresa {
    return new Empresa(id, cnpj, razaoSocial, monitoramentos);
  }

  adicionarMonitoramento(segmento: Cnae, regiao: Regiao): Monitoramento {
    const jaMonitorado = this.listaDeMonitoramentos.some(
      (monitoramento) =>
        monitoramento.segmento.codigo === segmento.codigo &&
        monitoramento.regiao.uf === regiao.uf &&
        monitoramento.regiao.municipio === regiao.municipio,
    );

    if (jaMonitorado) {
      throw new MonitoramentoDuplicadoError();
    }

    const monitoramento = Monitoramento.criar(segmento, regiao);
    this.listaDeMonitoramentos.push(monitoramento);

    return monitoramento;
  }
}
