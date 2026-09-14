import type { PrismaClient } from "../../generated/prisma/client.js";
import type { EditalRepositorio } from "../../domain/portas/EditalRepositorio.js";
import { Edital } from "../../domain/entidades/Edital.js";
import type { Esfera } from "../../domain/objetosDeValor/Esfera.js";
import { Dinheiro } from "../../domain/objetosDeValor/Dinheiro.js";
import { Regiao } from "../../domain/objetosDeValor/Regiao.js";
import { Cnae } from "../../domain/objetosDeValor/Cnae.js";

export class EditalRepositorioPrisma implements EditalRepositorio {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarUltimaVersao(numeroDeProcesso: string, nomeDoOrgao: string): Promise<Edital | null> {
    const registro = await this.prisma.edital.findFirst({
      where: { numeroDeProcesso, nomeDoOrgao },
      orderBy: { versao: "desc" },
    });

    if (registro === null) {
      return null;
    }

    return Edital.reconstituir({
      id: registro.editalId,
      numeroDeProcesso: registro.numeroDeProcesso,
      orgao: { nome: registro.nomeDoOrgao, esfera: registro.esfera as Esfera },
      regiao: Regiao.criar(registro.uf, registro.municipio ?? undefined),
      objeto: registro.objeto,
      valorEstimado: Dinheiro.criar(registro.valorEstimadoEmCentavos),
      dataDePublicacao: registro.dataDePublicacao,
      dataDeEntregaDaProposta: registro.dataDeEntregaDaProposta,
      segmentoInferido:
        registro.segmentoInferidoCodigo !== null && registro.segmentoInferidoDescricao !== null
          ? Cnae.criar(registro.segmentoInferidoCodigo, registro.segmentoInferidoDescricao)
          : null,
      versao: registro.versao,
    });
  }

  async salvar(edital: Edital): Promise<void> {
    await this.prisma.edital.create({
      data: {
        editalId: edital.id,
        versao: edital.versao,
        numeroDeProcesso: edital.numeroDeProcesso,
        nomeDoOrgao: edital.orgao.nome,
        esfera: edital.orgao.esfera,
        uf: edital.regiao.uf,
        municipio: edital.regiao.municipio,
        objeto: edital.objeto,
        valorEstimadoEmCentavos: edital.valorEstimado.valorEmCentavos,
        dataDePublicacao: edital.dataDePublicacao,
        dataDeEntregaDaProposta: edital.dataDeEntregaDaProposta,
        segmentoInferidoCodigo: edital.segmentoInferido?.codigo ?? null,
        segmentoInferidoDescricao: edital.segmentoInferido?.descricao ?? null,
      },
    });
  }
}
