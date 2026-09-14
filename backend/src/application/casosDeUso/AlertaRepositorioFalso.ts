import type { Alerta } from "../../domain/entidades/Alerta.js";
import type { EmpresaId } from "../../domain/entidades/Empresa.js";
import type { AlertaRepositorio } from "../../domain/portas/AlertaRepositorio.js";
import type { TipoDeAlerta } from "../../domain/objetosDeValor/TipoDeAlerta.js";
import type { OrigemDoAlerta } from "../../domain/objetosDeValor/OrigemDoAlerta.js";

export class AlertaRepositorioFalso implements AlertaRepositorio {
  private readonly alertas: Alerta[] = [];
  chamadasDeSalvar = 0;

  get alertasSalvos(): readonly Alerta[] {
    return this.alertas;
  }

  async existeAlertaAtivo(empresaId: EmpresaId, tipo: TipoDeAlerta, origem: OrigemDoAlerta): Promise<boolean> {
    return this.alertas.some(
      (alerta) =>
        alerta.empresaId === empresaId &&
        alerta.tipo === tipo &&
        alerta.origem.tipo === origem.tipo &&
        alerta.origem.id === origem.id &&
        alerta.status !== "FalhouNoEnvio",
    );
  }

  async salvar(alerta: Alerta): Promise<void> {
    this.alertas.push(alerta);
    this.chamadasDeSalvar += 1;
  }
}
