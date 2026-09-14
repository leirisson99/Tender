import { Edital, type ConteudoDoEdital } from "../../domain/entidades/Edital.js";
import { Dinheiro } from "../../domain/objetosDeValor/Dinheiro.js";
import { Regiao } from "../../domain/objetosDeValor/Regiao.js";
import type { ClientePNCP, EditalExternoPNCP } from "../../domain/portas/ClientePNCP.js";
import type { EditalRepositorio } from "../../domain/portas/EditalRepositorio.js";

const UF_FIXA_DESTA_FASE = "SC";

export interface IngerirEditaisDoPNCPEntrada {
  dataInicial: Date;
  dataFinal: Date;
}

export interface IngerirEditaisDoPNCPResultado {
  editaisCriados: number;
  editaisVersionados: number;
  editaisInalterados: number;
}

function converterItemParaConteudo(item: EditalExternoPNCP): ConteudoDoEdital {
  return {
    regiao: Regiao.criar(item.uf, item.municipio),
    objeto: item.objeto,
    valorEstimado: Dinheiro.criar(item.valorEstimadoEmCentavos),
    dataDePublicacao: item.dataDePublicacao,
    dataDeEntregaDaProposta: item.dataDeEntregaDaProposta,
  };
}

function criarEditalDoItemExterno(item: EditalExternoPNCP): Edital {
  return Edital.criar({
    numeroDeProcesso: item.numeroDeProcesso,
    orgao: { nome: item.nomeDoOrgao, esfera: item.esfera },
    ...converterItemParaConteudo(item),
  });
}

export class IngerirEditaisDoPNCP {
  constructor(
    private readonly clientePNCP: ClientePNCP,
    private readonly editalRepositorio: EditalRepositorio,
  ) {}

  async executar(entrada: IngerirEditaisDoPNCPEntrada): Promise<IngerirEditaisDoPNCPResultado> {
    const itens = await this.clientePNCP.buscarEditaisPublicados({
      dataInicial: entrada.dataInicial,
      dataFinal: entrada.dataFinal,
      uf: UF_FIXA_DESTA_FASE,
    });

    const resultado: IngerirEditaisDoPNCPResultado = {
      editaisCriados: 0,
      editaisVersionados: 0,
      editaisInalterados: 0,
    };

    for (const item of itens) {
      const existente = await this.editalRepositorio.buscarUltimaVersao(item.numeroDeProcesso, item.nomeDoOrgao);

      if (existente === null) {
        await this.editalRepositorio.salvar(criarEditalDoItemExterno(item));
        resultado.editaisCriados += 1;
      } else if (!existente.temMesmoConteudoQue(converterItemParaConteudo(item))) {
        await this.editalRepositorio.salvar(existente.criarNovaVersao(converterItemParaConteudo(item)));
        resultado.editaisVersionados += 1;
      } else {
        resultado.editaisInalterados += 1;
      }
    }

    return resultado;
  }
}
