import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { EmpresaRepositorio } from "../../../domain/portas/EmpresaRepositorio.js";
import { CadastrarEmpresa } from "../../../application/casosDeUso/CadastrarEmpresa.js";
import { ConfigurarMonitoramento } from "../../../application/casosDeUso/ConfigurarMonitoramento.js";

const cadastrarEmpresaEntradaSchema = z.object({
  cnpj: z.string(),
  razaoSocial: z.string(),
});

const configurarMonitoramentoEntradaSchema = z.object({
  cnae: z.object({
    codigo: z.string(),
    descricao: z.string(),
  }),
  regiao: z.object({
    uf: z.string(),
    municipio: z.string().optional(),
  }),
});

export function registrarRotasDeEmpresa(app: FastifyInstance, empresaRepositorio: EmpresaRepositorio): void {
  app.post("/empresa", async (request, reply) => {
    const entrada = cadastrarEmpresaEntradaSchema.parse(request.body);
    const cadastrarEmpresa = new CadastrarEmpresa(empresaRepositorio);
    const empresa = await cadastrarEmpresa.executar(entrada);

    reply.code(201).send({
      id: empresa.id,
      cnpj: empresa.cnpj.numero,
      razaoSocial: empresa.razaoSocial,
    });
  });

  app.post("/empresa/monitoramentos", async (request, reply) => {
    const entrada = configurarMonitoramentoEntradaSchema.parse(request.body);
    const configurarMonitoramento = new ConfigurarMonitoramento(empresaRepositorio);
    const monitoramento = await configurarMonitoramento.executar(entrada);

    reply.code(201).send({
      id: monitoramento.id,
      segmento: { codigo: monitoramento.segmento.codigo, descricao: monitoramento.segmento.descricao },
      regiao: { uf: monitoramento.regiao.uf, municipio: monitoramento.regiao.municipio },
      ativo: monitoramento.ativo,
    });
  });
}
