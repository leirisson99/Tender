import type { EditalRepositorio } from "../../domain/portas/EditalRepositorio.js";
import type { EmpresaRepositorio } from "../../domain/portas/EmpresaRepositorio.js";
import { encontrarMonitoramentoCompativel } from "../../domain/regras/encontrarMonitoramentoCompativel.js";

export interface AvaliarCompatibilidadeDosEditaisResultado {
  editaisAvaliados: number;
  editaisCompativeis: number;
}

export class AvaliarCompatibilidadeDosEditais {
  constructor(
    private readonly editalRepositorio: EditalRepositorio,
    private readonly empresaRepositorio: EmpresaRepositorio,
  ) {}

  async executar(): Promise<AvaliarCompatibilidadeDosEditaisResultado> {
    const empresa = await this.empresaRepositorio.buscarEmpresaUnica();

    if (empresa === null) {
      return { editaisAvaliados: 0, editaisCompativeis: 0 };
    }

    const monitoramentosAtivos = empresa.monitoramentos.filter((monitoramento) => monitoramento.ativo);
    const editaisPendentes = await this.editalRepositorio.listarPendentesDeCompatibilidade();

    const resultado: AvaliarCompatibilidadeDosEditaisResultado = {
      editaisAvaliados: 0,
      editaisCompativeis: 0,
    };

    for (const edital of editaisPendentes) {
      resultado.editaisAvaliados += 1;

      const monitoramentoCompativel = encontrarMonitoramentoCompativel(edital, monitoramentosAtivos);

      if (monitoramentoCompativel !== null) {
        await this.editalRepositorio.atualizarClassificacao(
          edital.marcarComoCompativel(monitoramentoCompativel.segmento),
        );
        resultado.editaisCompativeis += 1;
      }
    }

    return resultado;
  }
}
