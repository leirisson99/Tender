import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { EmpresaRepositorio } from "../../../domain/portas/EmpresaRepositorio.js";
import type { DossieDeHabilitacaoRepositorio } from "../../../domain/portas/DossieDeHabilitacaoRepositorio.js";
import type { ArmazenamentoDeArquivo } from "../../../domain/portas/ArmazenamentoDeArquivo.js";
import { CadastrarCertidao } from "../../../application/casosDeUso/CadastrarCertidao.js";

const cadastrarCertidaoEntradaSchema = z.object({
  tipo: z.enum([
    "CndFederal",
    "CrfFgts",
    "Cndt",
    "CertidaoEstadual",
    "CertidaoMunicipal",
    "CertidaoNegativaDeFalencia",
    "AtestadoDeCapacidadeTecnica",
    "ContratoSocial",
  ]),
  dataDeEmissao: z.coerce.date(),
  dataDeValidade: z.coerce.date(),
  nomeOriginal: z.string(),
  conteudoBase64: z.string(),
});

export function registrarRotasDeCertidao(
  app: FastifyInstance,
  empresaRepositorio: EmpresaRepositorio,
  dossieDeHabilitacaoRepositorio: DossieDeHabilitacaoRepositorio,
  armazenamentoDeArquivo: ArmazenamentoDeArquivo,
): void {
  app.post("/dossie/certidoes", async (request, reply) => {
    const entrada = cadastrarCertidaoEntradaSchema.parse(request.body);
    const cadastrarCertidao = new CadastrarCertidao(
      empresaRepositorio,
      dossieDeHabilitacaoRepositorio,
      armazenamentoDeArquivo,
    );
    const certidao = await cadastrarCertidao.executar({
      tipo: entrada.tipo,
      dataDeEmissao: entrada.dataDeEmissao,
      dataDeValidade: entrada.dataDeValidade,
      nomeOriginalDoArquivo: entrada.nomeOriginal,
      conteudoDoArquivo: Buffer.from(entrada.conteudoBase64, "base64"),
    });

    reply.code(201).send({
      id: certidao.id,
      tipo: certidao.tipo,
      periodoDeValidade: {
        dataDeEmissao: certidao.periodoDeValidade.dataDeEmissao,
        dataDeValidade: certidao.periodoDeValidade.dataDeValidade,
      },
      arquivo: {
        nomeOriginal: certidao.arquivo.nomeOriginal,
        enviadoEm: certidao.arquivo.enviadoEm,
      },
    });
  });
}
