import { z } from "zod";
import type { ClientePNCP, EditalExternoPNCP } from "../../domain/portas/ClientePNCP.js";
import type { Esfera } from "../../domain/objetosDeValor/Esfera.js";

const MODALIDADE_PREGAO_ELETRONICO = 6;

const esferaPorEsferaId: Record<string, Esfera> = {
  F: "Federal",
  E: "Estadual",
  M: "Municipal",
  D: "Distrital",
};

const itemPNCPSchema = z.object({
  processo: z.string(),
  orgaoEntidade: z.object({
    razaoSocial: z.string(),
    esferaId: z.enum(["F", "E", "M", "D"]),
  }),
  unidadeOrgao: z.object({
    ufSigla: z.string(),
    municipioNome: z.string().optional(),
  }),
  objetoCompra: z.string(),
  valorTotalEstimado: z.number(),
  dataPublicacaoPncp: z.string(),
  dataEncerramentoProposta: z.string(),
});

const envelopeDePaginacaoSchema = z.object({
  data: z.array(z.unknown()),
  totalPaginas: z.number(),
  numeroPagina: z.number(),
});

function mapearItemParaEditalExterno(item: z.infer<typeof itemPNCPSchema>): EditalExternoPNCP {
  return {
    numeroDeProcesso: item.processo,
    nomeDoOrgao: item.orgaoEntidade.razaoSocial,
    esfera: esferaPorEsferaId[item.orgaoEntidade.esferaId] as Esfera,
    uf: item.unidadeOrgao.ufSigla,
    ...(item.unidadeOrgao.municipioNome !== undefined ? { municipio: item.unidadeOrgao.municipioNome } : {}),
    objeto: item.objetoCompra,
    valorEstimadoEmCentavos: Math.round(item.valorTotalEstimado * 100),
    dataDePublicacao: new Date(item.dataPublicacaoPncp),
    dataDeEntregaDaProposta: new Date(item.dataEncerramentoProposta),
  };
}

export class ClientePNCPHttp implements ClientePNCP {
  constructor(private readonly urlBase: string = "https://pncp.gov.br/api/consulta") {}

  async buscarEditaisPublicados(parametros: {
    dataInicial: Date;
    dataFinal: Date;
    uf: string;
  }): Promise<EditalExternoPNCP[]> {
    const itens: EditalExternoPNCP[] = [];
    let pagina = 1;
    let totalPaginas = 1;

    do {
      const url = this.montarUrl(parametros, pagina);
      const resposta = await fetch(url);

      if (!resposta.ok) {
        throw new Error(`Falha ao consultar o PNCP: HTTP ${resposta.status}`);
      }

      const corpo = await resposta.json();
      const envelope = envelopeDePaginacaoSchema.parse(corpo);
      totalPaginas = envelope.totalPaginas;

      for (const itemBruto of envelope.data) {
        const resultado = itemPNCPSchema.safeParse(itemBruto);

        if (resultado.success) {
          itens.push(mapearItemParaEditalExterno(resultado.data));
        }
      }

      pagina += 1;
    } while (pagina <= totalPaginas);

    return itens;
  }

  private montarUrl(parametros: { dataInicial: Date; dataFinal: Date; uf: string }, pagina: number): string {
    const formatarData = (data: Date): string => data.toISOString().slice(0, 10).replace(/-/g, "");

    const query = new URLSearchParams({
      dataInicial: formatarData(parametros.dataInicial),
      dataFinal: formatarData(parametros.dataFinal),
      codigoModalidadeContratacao: String(MODALIDADE_PREGAO_ELETRONICO),
      uf: parametros.uf,
      pagina: String(pagina),
    });

    return `${this.urlBase}/v1/contratacoes/publicacao?${query.toString()}`;
  }
}
