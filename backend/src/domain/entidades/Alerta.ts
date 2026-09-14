import type { EmpresaId } from "./Empresa.js";
import type { TipoDeAlerta } from "../objetosDeValor/TipoDeAlerta.js";
import type { OrigemDoAlerta } from "../objetosDeValor/OrigemDoAlerta.js";
import type { CanalDeNotificacao } from "../objetosDeValor/CanalDeNotificacao.js";
import type { StatusDoEnvio } from "../objetosDeValor/StatusDoEnvio.js";

export type AlertaId = string;

export class Alerta {
  private constructor(
    public readonly id: AlertaId,
    public readonly empresaId: EmpresaId,
    public readonly tipo: TipoDeAlerta,
    public readonly origem: OrigemDoAlerta,
    public readonly canal: CanalDeNotificacao,
    public readonly status: StatusDoEnvio,
    public readonly momentoDeEnvio: Date | null,
  ) {}

  static criar(empresaId: EmpresaId, tipo: TipoDeAlerta, origem: OrigemDoAlerta): Alerta {
    return new Alerta(crypto.randomUUID(), empresaId, tipo, origem, "WhatsApp", "Pendente", null);
  }

  static reconstituir(
    id: AlertaId,
    empresaId: EmpresaId,
    tipo: TipoDeAlerta,
    origem: OrigemDoAlerta,
    canal: CanalDeNotificacao,
    status: StatusDoEnvio,
    momentoDeEnvio: Date | null,
  ): Alerta {
    return new Alerta(id, empresaId, tipo, origem, canal, status, momentoDeEnvio);
  }
}
