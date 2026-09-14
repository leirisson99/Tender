import { Certidao, DossieDeHabilitacao } from "../../domain/entidades/DossieDeHabilitacao.js";
import { PeriodoDeValidade } from "../../domain/objetosDeValor/PeriodoDeValidade.js";
import type { TipoDeDocumentoDeHabilitacao } from "../../domain/objetosDeValor/TipoDeDocumentoDeHabilitacao.js";
import type { EmpresaRepositorio } from "../../domain/portas/EmpresaRepositorio.js";
import type { DossieDeHabilitacaoRepositorio } from "../../domain/portas/DossieDeHabilitacaoRepositorio.js";
import type { ArmazenamentoDeArquivo } from "../../domain/portas/ArmazenamentoDeArquivo.js";
import { EmpresaNaoEncontradaError } from "../erros/EmpresaNaoEncontradaError.js";

export interface CadastrarCertidaoEntrada {
  tipo: TipoDeDocumentoDeHabilitacao;
  dataDeEmissao: Date;
  dataDeValidade: Date;
  nomeOriginalDoArquivo: string;
  conteudoDoArquivo: Buffer;
}

export class CadastrarCertidao {
  constructor(
    private readonly empresaRepositorio: EmpresaRepositorio,
    private readonly dossieDeHabilitacaoRepositorio: DossieDeHabilitacaoRepositorio,
    private readonly armazenamentoDeArquivo: ArmazenamentoDeArquivo,
  ) {}

  async executar(entrada: CadastrarCertidaoEntrada): Promise<Certidao> {
    const periodoDeValidade = PeriodoDeValidade.criar(entrada.dataDeEmissao, entrada.dataDeValidade);

    const empresa = await this.empresaRepositorio.buscarEmpresaUnica();

    if (empresa === null) {
      throw new EmpresaNaoEncontradaError();
    }

    const arquivo = await this.armazenamentoDeArquivo.salvar(
      entrada.nomeOriginalDoArquivo,
      entrada.conteudoDoArquivo,
    );

    const dossieExistente = await this.dossieDeHabilitacaoRepositorio.buscarPorEmpresaId(empresa.id);
    const dossie = dossieExistente ?? DossieDeHabilitacao.criar(empresa.id);
    const certidao = dossie.adicionarCertidao(entrada.tipo, periodoDeValidade, arquivo);
    await this.dossieDeHabilitacaoRepositorio.salvar(dossie);

    return certidao;
  }
}
