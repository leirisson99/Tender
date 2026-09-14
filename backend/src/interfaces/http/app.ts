import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import type { EmpresaRepositorio } from "../../domain/portas/EmpresaRepositorio.js";
import type { DossieDeHabilitacaoRepositorio } from "../../domain/portas/DossieDeHabilitacaoRepositorio.js";
import type { ArmazenamentoDeArquivo } from "../../domain/portas/ArmazenamentoDeArquivo.js";
import { CnpjInvalidoError } from "../../domain/erros/CnpjInvalidoError.js";
import { CnaeInvalidoError } from "../../domain/erros/CnaeInvalidoError.js";
import { RegiaoInvalidaError } from "../../domain/erros/RegiaoInvalidaError.js";
import { PeriodoDeValidadeInvalidoError } from "../../domain/erros/PeriodoDeValidadeInvalidoError.js";
import { InstanciaJaPossuiEmpresaError } from "../../application/erros/InstanciaJaPossuiEmpresaError.js";
import { EmpresaNaoEncontradaError } from "../../application/erros/EmpresaNaoEncontradaError.js";
import { MonitoramentoDuplicadoError } from "../../domain/erros/MonitoramentoDuplicadoError.js";
import { registrarRotasDeEmpresa } from "./rotas/empresa.js";
import { registrarRotasDeCertidao } from "./rotas/certidao.js";

export function construirApp(
  empresaRepositorio: EmpresaRepositorio,
  dossieDeHabilitacaoRepositorio?: DossieDeHabilitacaoRepositorio,
  armazenamentoDeArquivo?: ArmazenamentoDeArquivo,
): FastifyInstance {
  const app = Fastify();

  app.setErrorHandler((erro, _request, reply) => {
    if (
      erro instanceof ZodError ||
      erro instanceof CnpjInvalidoError ||
      erro instanceof CnaeInvalidoError ||
      erro instanceof RegiaoInvalidaError ||
      erro instanceof PeriodoDeValidadeInvalidoError
    ) {
      reply.code(400).send({ mensagem: erro.message });
      return;
    }

    if (erro instanceof InstanciaJaPossuiEmpresaError || erro instanceof MonitoramentoDuplicadoError) {
      reply.code(409).send({ mensagem: erro.message });
      return;
    }

    if (erro instanceof EmpresaNaoEncontradaError) {
      reply.code(404).send({ mensagem: erro.message });
      return;
    }

    reply.send(erro);
  });

  registrarRotasDeEmpresa(app, empresaRepositorio);

  if (dossieDeHabilitacaoRepositorio !== undefined && armazenamentoDeArquivo !== undefined) {
    registrarRotasDeCertidao(app, empresaRepositorio, dossieDeHabilitacaoRepositorio, armazenamentoDeArquivo);
  }

  return app;
}
