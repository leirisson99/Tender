import type { Esfera } from "../objetosDeValor/Esfera.js";

export interface EditalExternoPNCP {
  numeroDeProcesso: string;
  nomeDoOrgao: string;
  esfera: Esfera;
  uf: string;
  municipio?: string;
  objeto: string;
  valorEstimadoEmCentavos: number;
  dataDePublicacao: Date;
  dataDeEntregaDaProposta: Date;
}

export interface ClientePNCP {
  buscarEditaisPublicados(parametros: {
    dataInicial: Date;
    dataFinal: Date;
    uf: string;
  }): Promise<EditalExternoPNCP[]>;
}
