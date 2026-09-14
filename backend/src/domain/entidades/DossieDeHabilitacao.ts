import type { PeriodoDeValidade } from "../objetosDeValor/PeriodoDeValidade.js";
import type { ReferenciaDeArquivo } from "../objetosDeValor/ReferenciaDeArquivo.js";
import type { TipoDeDocumentoDeHabilitacao } from "../objetosDeValor/TipoDeDocumentoDeHabilitacao.js";
import type { CategoriaDeHabilitacao } from "../objetosDeValor/CategoriaDeHabilitacao.js";
import type { SituacaoDaCertidao } from "../objetosDeValor/SituacaoDaCertidao.js";
import type { Prontidao } from "../objetosDeValor/Prontidao.js";
import type { Pendencia } from "../objetosDeValor/Pendencia.js";
import type { MotivoDaPendencia } from "../objetosDeValor/MotivoDaPendencia.js";
import type { PlacarDeProntidao } from "../objetosDeValor/PlacarDeProntidao.js";
import type { EmpresaId } from "./Empresa.js";
import type { Edital } from "./Edital.js";

export type CertidaoId = string;
export type DossieId = string;

const JANELA_DE_ALERTA_EM_DIAS = 30;
const UM_DIA_EM_MILISSEGUNDOS = 24 * 60 * 60 * 1000;

const CATEGORIA_POR_TIPO: Record<TipoDeDocumentoDeHabilitacao, CategoriaDeHabilitacao> = {
  ContratoSocial: "Juridica",
  CndFederal: "FiscalETrabalhista",
  CrfFgts: "FiscalETrabalhista",
  Cndt: "FiscalETrabalhista",
  CertidaoEstadual: "FiscalETrabalhista",
  CertidaoMunicipal: "FiscalETrabalhista",
  CertidaoNegativaDeFalencia: "EconomicoFinanceira",
  AtestadoDeCapacidadeTecnica: "Tecnica",
};

const TIPOS_POR_CATEGORIA: Record<CategoriaDeHabilitacao, TipoDeDocumentoDeHabilitacao[]> = {
  Juridica: ["ContratoSocial"],
  FiscalETrabalhista: ["CndFederal", "CrfFgts", "Cndt", "CertidaoEstadual", "CertidaoMunicipal"],
  EconomicoFinanceira: ["CertidaoNegativaDeFalencia"],
  Tecnica: ["AtestadoDeCapacidadeTecnica"],
};

const CATEGORIAS_EXIGIDAS_PADRAO: CategoriaDeHabilitacao[] = [
  "Juridica",
  "FiscalETrabalhista",
  "EconomicoFinanceira",
  "Tecnica",
];

const ORDEM_DE_GRAVIDADE_DO_MOTIVO: MotivoDaPendencia[] = [
  "SemCertidaoCadastrada",
  "CertidaoVencida",
  "CertidaoAVencer",
];

function categoriasExigidasPeloEdital(_edital: Edital): CategoriaDeHabilitacao[] {
  return CATEGORIAS_EXIGIDAS_PADRAO;
}

export class Certidao {
  private constructor(
    public readonly id: CertidaoId,
    public readonly tipo: TipoDeDocumentoDeHabilitacao,
    public readonly periodoDeValidade: PeriodoDeValidade,
    public readonly arquivo: ReferenciaDeArquivo,
  ) {}

  static criar(
    tipo: TipoDeDocumentoDeHabilitacao,
    periodoDeValidade: PeriodoDeValidade,
    arquivo: ReferenciaDeArquivo,
  ): Certidao {
    return new Certidao(crypto.randomUUID(), tipo, periodoDeValidade, arquivo);
  }

  static reconstituir(
    id: CertidaoId,
    tipo: TipoDeDocumentoDeHabilitacao,
    periodoDeValidade: PeriodoDeValidade,
    arquivo: ReferenciaDeArquivo,
  ): Certidao {
    return new Certidao(id, tipo, periodoDeValidade, arquivo);
  }

  get categoria(): CategoriaDeHabilitacao {
    return CATEGORIA_POR_TIPO[this.tipo];
  }

  situacaoEm(data: Date): SituacaoDaCertidao {
    const dataDeValidade = this.periodoDeValidade.dataDeValidade.getTime();

    if (data.getTime() >= dataDeValidade) {
      return "Vencida";
    }

    const inicioDaJanelaDeAlerta = dataDeValidade - JANELA_DE_ALERTA_EM_DIAS * UM_DIA_EM_MILISSEGUNDOS;

    if (data.getTime() >= inicioDaJanelaDeAlerta) {
      return "AVencer";
    }

    return "Valida";
  }
}

export class DossieDeHabilitacao {
  private readonly listaDeCertidoes: Certidao[];

  private constructor(
    public readonly id: DossieId,
    public readonly empresaId: EmpresaId,
    certidoes: Certidao[],
  ) {
    this.listaDeCertidoes = certidoes;
  }

  get certidoes(): readonly Certidao[] {
    return this.listaDeCertidoes;
  }

  static criar(empresaId: EmpresaId): DossieDeHabilitacao {
    return new DossieDeHabilitacao(crypto.randomUUID(), empresaId, []);
  }

  static reconstituir(id: DossieId, empresaId: EmpresaId, certidoes: Certidao[]): DossieDeHabilitacao {
    return new DossieDeHabilitacao(id, empresaId, certidoes);
  }

  adicionarCertidao(
    tipo: TipoDeDocumentoDeHabilitacao,
    periodoDeValidade: PeriodoDeValidade,
    arquivo: ReferenciaDeArquivo,
  ): Certidao {
    const certidao = Certidao.criar(tipo, periodoDeValidade, arquivo);
    this.listaDeCertidoes.push(certidao);

    return certidao;
  }

  calcularProntidaoParaEdital(edital: Edital, hoje: Date): Prontidao {
    const pendencias: Pendencia[] = [];

    for (const categoria of categoriasExigidasPeloEdital(edital)) {
      const motivosDosTipos: MotivoDaPendencia[] = [];

      for (const tipo of TIPOS_POR_CATEGORIA[categoria]) {
        const certidoesDoTipo = this.listaDeCertidoes.filter((certidao) => certidao.tipo === tipo);
        const certidaoConsiderada = certidoesDoTipo.reduce<Certidao | undefined>(
          (maisRecente, atual) =>
            maisRecente === undefined ||
            atual.periodoDeValidade.dataDeValidade.getTime() > maisRecente.periodoDeValidade.dataDeValidade.getTime()
              ? atual
              : maisRecente,
          undefined,
        );

        if (certidaoConsiderada === undefined) {
          motivosDosTipos.push("SemCertidaoCadastrada");
          continue;
        }

        const situacao = certidaoConsiderada.situacaoEm(hoje);

        if (situacao === "Vencida") {
          motivosDosTipos.push("CertidaoVencida");
        } else if (situacao === "AVencer") {
          motivosDosTipos.push("CertidaoAVencer");
        }
      }

      const motivo = ORDEM_DE_GRAVIDADE_DO_MOTIVO.find((candidato) => motivosDosTipos.includes(candidato));

      if (motivo !== undefined) {
        pendencias.push({ categoria, motivo });
      }
    }

    const placar: PlacarDeProntidao = pendencias.some((pendencia) => pendencia.motivo !== "CertidaoAVencer")
      ? "Inapta"
      : pendencias.length > 0
        ? "Pendente"
        : "Apta";

    return { placar, pendencias };
  }
}
