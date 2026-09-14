import { Alerta } from "../../domain/entidades/Alerta.js";
import type { EmpresaRepositorio } from "../../domain/portas/EmpresaRepositorio.js";
import type { DossieDeHabilitacaoRepositorio } from "../../domain/portas/DossieDeHabilitacaoRepositorio.js";
import type { AlertaRepositorio } from "../../domain/portas/AlertaRepositorio.js";
import type { Relogio } from "../../domain/portas/Relogio.js";

export interface GerarAlertaDeCertidaoResultado {
  certidoesAvaliadas: number;
  alertasGerados: number;
}

export class GerarAlertaDeCertidao {
  constructor(
    private readonly empresaRepositorio: EmpresaRepositorio,
    private readonly dossieDeHabilitacaoRepositorio: DossieDeHabilitacaoRepositorio,
    private readonly alertaRepositorio: AlertaRepositorio,
    private readonly relogio: Relogio,
  ) {}

  async executar(): Promise<GerarAlertaDeCertidaoResultado> {
    const empresa = await this.empresaRepositorio.buscarEmpresaUnica();

    if (empresa === null) {
      return { certidoesAvaliadas: 0, alertasGerados: 0 };
    }

    const dossie = await this.dossieDeHabilitacaoRepositorio.buscarPorEmpresaId(empresa.id);

    if (dossie === null) {
      return { certidoesAvaliadas: 0, alertasGerados: 0 };
    }

    const hoje = this.relogio.agora();

    const resultado: GerarAlertaDeCertidaoResultado = {
      certidoesAvaliadas: 0,
      alertasGerados: 0,
    };

    for (const certidao of dossie.certidoes) {
      resultado.certidoesAvaliadas += 1;

      const situacao = certidao.situacaoEm(hoje);

      if (situacao === "AVencer" || situacao === "Vencida") {
        const tipo = situacao === "AVencer" ? "CertidaoAVencer" : "CertidaoVencida";
        const origem = { tipo: "Certidao" as const, id: certidao.id };
        const jaAlertado = await this.alertaRepositorio.existeAlertaAtivo(empresa.id, tipo, origem);

        if (!jaAlertado) {
          await this.alertaRepositorio.salvar(Alerta.criar(empresa.id, tipo, origem));
          resultado.alertasGerados += 1;
        }
      }
    }

    return resultado;
  }
}
