import type { PrismaClient, Edital as EditalPrisma } from "../../generated/prisma/client.js";
import type { EditalRepositorio } from "../../domain/portas/EditalRepositorio.js";
import { Edital } from "../../domain/entidades/Edital.js";
import type { Esfera } from "../../domain/objetosDeValor/Esfera.js";
import { Dinheiro } from "../../domain/objetosDeValor/Dinheiro.js";
import { Regiao } from "../../domain/objetosDeValor/Regiao.js";
import { Cnae } from "../../domain/objetosDeValor/Cnae.js";

function reidratarEdital(registro: EditalPrisma): Edital {
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
    classificacaoDoItem:
      registro.classificacaoDoItemCodigo !== null && registro.classificacaoDoItemDescricao !== null
        ? { codigo: registro.classificacaoDoItemCodigo, descricao: registro.classificacaoDoItemDescricao }
        : null,
    versao: registro.versao,
  });
}

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

    return reidratarEdital(registro);
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
        classificacaoDoItemCodigo: edital.classificacaoDoItem?.codigo ?? null,
        classificacaoDoItemDescricao: edital.classificacaoDoItem?.descricao ?? null,
      },
    });
  }

  async listarPendentesDeCompatibilidade(): Promise<Edital[]> {
    const registros = await this.prisma.edital.findMany({
      orderBy: [{ editalId: "asc" }, { versao: "desc" }],
    });

    const ultimaVersaoPorEditalId = new Map<string, EditalPrisma>();

    for (const registro of registros) {
      if (!ultimaVersaoPorEditalId.has(registro.editalId)) {
        ultimaVersaoPorEditalId.set(registro.editalId, registro);
      }
    }

    return [...ultimaVersaoPorEditalId.values()]
      .filter((registro) => registro.segmentoInferidoCodigo === null)
      .map(reidratarEdital);
  }

  async atualizarClassificacao(edital: Edital): Promise<void> {
    await this.prisma.edital.update({
      where: { editalId_versao: { editalId: edital.id, versao: edital.versao } },
      data: {
        segmentoInferidoCodigo: edital.segmentoInferido?.codigo ?? null,
        segmentoInferidoDescricao: edital.segmentoInferido?.descricao ?? null,
        classificacaoDoItemCodigo: edital.classificacaoDoItem?.codigo ?? null,
        classificacaoDoItemDescricao: edital.classificacaoDoItem?.descricao ?? null,
      },
    });
  }
}
