import { Alerta } from "../../domain/entidades/Alerta.js";
import type { EditalRepositorio } from "../../domain/portas/EditalRepositorio.js";
import type { EmpresaRepositorio } from "../../domain/portas/EmpresaRepositorio.js";
import type { AlertaRepositorio } from "../../domain/portas/AlertaRepositorio.js";

export interface GerarAlertaDeEditalCompativelResultado {
  editaisAvaliados: number;
  alertasGerados: number;
}

export class GerarAlertaDeEditalCompativel {
  constructor(
    private readonly editalRepositorio: EditalRepositorio,
    private readonly empresaRepositorio: EmpresaRepositorio,
    private readonly alertaRepositorio: AlertaRepositorio,
  ) {}

  async executar(): Promise<GerarAlertaDeEditalCompativelResultado> {
    const empresa = await this.empresaRepositorio.buscarEmpresaUnica();

    if (empresa === null) {
      return { editaisAvaliados: 0, alertasGerados: 0 };
    }

    const editaisCompativeis = await this.editalRepositorio.listarCompativeis();

    const resultado: GerarAlertaDeEditalCompativelResultado = {
      editaisAvaliados: 0,
      alertasGerados: 0,
    };

    for (const edital of editaisCompativeis) {
      resultado.editaisAvaliados += 1;

      const origem = { tipo: "Edital" as const, id: edital.id };
      const jaAlertado = await this.alertaRepositorio.existeAlertaAtivo(empresa.id, "EditalCompativel", origem);

      if (!jaAlertado) {
        await this.alertaRepositorio.salvar(Alerta.criar(empresa.id, "EditalCompativel", origem));
        resultado.alertasGerados += 1;
      }
    }

    return resultado;
  }
}
