import type { PrismaClient } from "../../generated/prisma/client.js";
import type { AlertaRepositorio } from "../../domain/portas/AlertaRepositorio.js";
import type { Alerta } from "../../domain/entidades/Alerta.js";
import type { EmpresaId } from "../../domain/entidades/Empresa.js";
import type { TipoDeAlerta } from "../../domain/objetosDeValor/TipoDeAlerta.js";
import type { OrigemDoAlerta } from "../../domain/objetosDeValor/OrigemDoAlerta.js";

export class AlertaRepositorioPrisma implements AlertaRepositorio {
  constructor(private readonly prisma: PrismaClient) {}

  async existeAlertaAtivo(empresaId: EmpresaId, tipo: TipoDeAlerta, origem: OrigemDoAlerta): Promise<boolean> {
    const registro = await this.prisma.alerta.findFirst({
      where: {
        empresaId,
        tipo,
        origemTipo: origem.tipo,
        origemId: origem.id,
        status: { not: "FalhouNoEnvio" },
      },
    });

    return registro !== null;
  }

  async salvar(alerta: Alerta): Promise<void> {
    await this.prisma.alerta.create({
      data: {
        id: alerta.id,
        empresaId: alerta.empresaId,
        tipo: alerta.tipo,
        origemTipo: alerta.origem.tipo,
        origemId: alerta.origem.id,
        canal: alerta.canal,
        status: alerta.status,
        momentoDeEnvio: alerta.momentoDeEnvio,
      },
    });
  }
}
