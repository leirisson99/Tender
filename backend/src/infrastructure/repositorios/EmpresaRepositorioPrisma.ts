import type { PrismaClient } from "../../generated/prisma/client.js";
import type { EmpresaRepositorio } from "../../domain/portas/EmpresaRepositorio.js";
import { Empresa, Monitoramento } from "../../domain/entidades/Empresa.js";
import { Cnpj } from "../../domain/objetosDeValor/Cnpj.js";
import { Cnae } from "../../domain/objetosDeValor/Cnae.js";
import { Regiao } from "../../domain/objetosDeValor/Regiao.js";

export class EmpresaRepositorioPrisma implements EmpresaRepositorio {
  constructor(private readonly prisma: PrismaClient) {}

  async existeEmpresaCadastrada(): Promise<boolean> {
    const total = await this.prisma.empresa.count();

    return total > 0;
  }

  async buscarEmpresaUnica(): Promise<Empresa | null> {
    const registro = await this.prisma.empresa.findFirst({
      include: { monitoramentos: true },
    });

    if (registro === null) {
      return null;
    }

    const monitoramentos = registro.monitoramentos.map((monitoramento) =>
      Monitoramento.reconstituir(
        monitoramento.id,
        Cnae.criar(monitoramento.segmentoCodigo, monitoramento.segmentoDescricao),
        Regiao.criar(monitoramento.uf, monitoramento.municipio ?? undefined),
        monitoramento.ativo,
      ),
    );

    return Empresa.reconstituir(registro.id, Cnpj.criar(registro.cnpj), registro.razaoSocial, monitoramentos);
  }

  async salvar(empresa: Empresa): Promise<void> {
    await this.prisma.empresa.upsert({
      where: { id: empresa.id },
      create: {
        id: empresa.id,
        cnpj: empresa.cnpj.numero,
        razaoSocial: empresa.razaoSocial,
      },
      update: {
        razaoSocial: empresa.razaoSocial,
      },
    });

    for (const monitoramento of empresa.monitoramentos) {
      await this.prisma.monitoramento.upsert({
        where: { id: monitoramento.id },
        create: {
          id: monitoramento.id,
          empresaId: empresa.id,
          segmentoCodigo: monitoramento.segmento.codigo,
          segmentoDescricao: monitoramento.segmento.descricao,
          uf: monitoramento.regiao.uf,
          municipio: monitoramento.regiao.municipio,
          ativo: monitoramento.ativo,
        },
        update: {
          ativo: monitoramento.ativo,
        },
      });
    }
  }
}
