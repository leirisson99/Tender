import type { EmpresaId } from "../entidades/Empresa.js";
import type { Alerta } from "../entidades/Alerta.js";
import type { TipoDeAlerta } from "../objetosDeValor/TipoDeAlerta.js";
import type { OrigemDoAlerta } from "../objetosDeValor/OrigemDoAlerta.js";

export interface AlertaRepositorio {
  existeAlertaAtivo(empresaId: EmpresaId, tipo: TipoDeAlerta, origem: OrigemDoAlerta): Promise<boolean>;
  salvar(alerta: Alerta): Promise<void>;
}
