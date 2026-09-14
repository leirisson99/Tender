import type { Dinheiro } from "../objetosDeValor/Dinheiro.js";
import type { Regiao } from "../objetosDeValor/Regiao.js";
import type { Cnae } from "../objetosDeValor/Cnae.js";
import type { Esfera } from "../objetosDeValor/Esfera.js";
import type { ClassificacaoDoItem } from "../objetosDeValor/ClassificacaoDoItem.js";

export type EditalId = string;

export interface OrgaoEmissor {
  nome: string;
  esfera: Esfera;
}

export interface DadosDoEdital {
  numeroDeProcesso: string;
  orgao: OrgaoEmissor;
  regiao: Regiao;
  objeto: string;
  valorEstimado: Dinheiro;
  dataDePublicacao: Date;
  dataDeEntregaDaProposta: Date;
  classificacaoDoItem?: ClassificacaoDoItem;
}

export interface ConteudoDoEdital {
  regiao: Regiao;
  objeto: string;
  valorEstimado: Dinheiro;
  dataDePublicacao: Date;
  dataDeEntregaDaProposta: Date;
  classificacaoDoItem?: ClassificacaoDoItem;
}

export interface DadosDeReconstituicaoDoEdital {
  id: EditalId;
  numeroDeProcesso: string;
  orgao: OrgaoEmissor;
  regiao: Regiao;
  objeto: string;
  valorEstimado: Dinheiro;
  dataDePublicacao: Date;
  dataDeEntregaDaProposta: Date;
  segmentoInferido: Cnae | null;
  classificacaoDoItem: ClassificacaoDoItem | null;
  versao: number;
}

export class Edital {
  private constructor(
    public readonly id: EditalId,
    public readonly numeroDeProcesso: string,
    public readonly orgao: OrgaoEmissor,
    public readonly regiao: Regiao,
    public readonly objeto: string,
    public readonly valorEstimado: Dinheiro,
    public readonly dataDePublicacao: Date,
    public readonly dataDeEntregaDaProposta: Date,
    public readonly segmentoInferido: Cnae | null,
    public readonly classificacaoDoItem: ClassificacaoDoItem | null,
    public readonly versao: number,
  ) {}

  static criar(dados: DadosDoEdital): Edital {
    const id = `${dados.numeroDeProcesso}::${dados.orgao.nome}`;

    return new Edital(
      id,
      dados.numeroDeProcesso,
      dados.orgao,
      dados.regiao,
      dados.objeto,
      dados.valorEstimado,
      dados.dataDePublicacao,
      dados.dataDeEntregaDaProposta,
      null,
      dados.classificacaoDoItem ?? null,
      1,
    );
  }

  static reconstituir(dados: DadosDeReconstituicaoDoEdital): Edital {
    return new Edital(
      dados.id,
      dados.numeroDeProcesso,
      dados.orgao,
      dados.regiao,
      dados.objeto,
      dados.valorEstimado,
      dados.dataDePublicacao,
      dados.dataDeEntregaDaProposta,
      dados.segmentoInferido,
      dados.classificacaoDoItem,
      dados.versao,
    );
  }

  temMesmoConteudoQue(dados: ConteudoDoEdital): boolean {
    return (
      this.objeto === dados.objeto &&
      this.valorEstimado.valorEmCentavos === dados.valorEstimado.valorEmCentavos &&
      this.dataDePublicacao.getTime() === dados.dataDePublicacao.getTime() &&
      this.dataDeEntregaDaProposta.getTime() === dados.dataDeEntregaDaProposta.getTime() &&
      this.regiao.uf === dados.regiao.uf &&
      this.regiao.municipio === dados.regiao.municipio
    );
  }

  marcarComoCompativel(segmento: Cnae): Edital {
    return new Edital(
      this.id,
      this.numeroDeProcesso,
      this.orgao,
      this.regiao,
      this.objeto,
      this.valorEstimado,
      this.dataDePublicacao,
      this.dataDeEntregaDaProposta,
      segmento,
      this.classificacaoDoItem,
      this.versao,
    );
  }

  criarNovaVersao(dados: ConteudoDoEdital): Edital {
    return new Edital(
      this.id,
      this.numeroDeProcesso,
      this.orgao,
      dados.regiao,
      dados.objeto,
      dados.valorEstimado,
      dados.dataDePublicacao,
      dados.dataDeEntregaDaProposta,
      null,
      dados.classificacaoDoItem ?? null,
      this.versao + 1,
    );
  }
}
