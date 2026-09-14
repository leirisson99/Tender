import type { PrismaClient } from "../../generated/prisma/client.js";
import type { DossieDeHabilitacaoRepositorio } from "../../domain/portas/DossieDeHabilitacaoRepositorio.js";
import { DossieDeHabilitacao, Certidao } from "../../domain/entidades/DossieDeHabilitacao.js";
import type { EmpresaId } from "../../domain/entidades/Empresa.js";
import type { TipoDeDocumentoDeHabilitacao } from "../../domain/objetosDeValor/TipoDeDocumentoDeHabilitacao.js";
import { PeriodoDeValidade } from "../../domain/objetosDeValor/PeriodoDeValidade.js";
import { ReferenciaDeArquivo } from "../../domain/objetosDeValor/ReferenciaDeArquivo.js";

export class DossieDeHabilitacaoRepositorioPrisma implements DossieDeHabilitacaoRepositorio {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarPorEmpresaId(empresaId: EmpresaId): Promise<DossieDeHabilitacao | null> {
    const registro = await this.prisma.dossieDeHabilitacao.findUnique({
      where: { empresaId },
      include: { certidoes: true },
    });

    if (registro === null) {
      return null;
    }

    const certidoes = registro.certidoes.map((certidao) =>
      Certidao.reconstituir(
        certidao.id,
        certidao.tipo as TipoDeDocumentoDeHabilitacao,
        PeriodoDeValidade.criar(certidao.dataDeEmissao, certidao.dataDeValidade),
        ReferenciaDeArquivo.criar(certidao.arquivoCaminho, certidao.arquivoNomeOriginal, certidao.arquivoEnviadoEm),
      ),
    );

    return DossieDeHabilitacao.reconstituir(registro.id, registro.empresaId, certidoes);
  }

  async salvar(dossie: DossieDeHabilitacao): Promise<void> {
    await this.prisma.dossieDeHabilitacao.upsert({
      where: { id: dossie.id },
      create: { id: dossie.id, empresaId: dossie.empresaId },
      update: {},
    });

    for (const certidao of dossie.certidoes) {
      await this.prisma.certidao.upsert({
        where: { id: certidao.id },
        create: {
          id: certidao.id,
          dossieDeHabilitacaoId: dossie.id,
          tipo: certidao.tipo,
          dataDeEmissao: certidao.periodoDeValidade.dataDeEmissao,
          dataDeValidade: certidao.periodoDeValidade.dataDeValidade,
          arquivoCaminho: certidao.arquivo.caminho,
          arquivoNomeOriginal: certidao.arquivo.nomeOriginal,
          arquivoEnviadoEm: certidao.arquivo.enviadoEm,
        },
        update: {},
      });
    }
  }
}
