import { describe, expect, it } from "vitest";
import { AvaliarCompatibilidadeDosEditais } from "./AvaliarCompatibilidadeDosEditais.js";
import { EmpresaRepositorioFalso } from "./EmpresaRepositorioFalso.js";
import { EditalRepositorioFalso } from "./EditalRepositorioFalso.js";
import { Empresa, Monitoramento } from "../../domain/entidades/Empresa.js";
import { Edital } from "../../domain/entidades/Edital.js";
import { Cnpj } from "../../domain/objetosDeValor/Cnpj.js";
import { Cnae } from "../../domain/objetosDeValor/Cnae.js";
import { Regiao } from "../../domain/objetosDeValor/Regiao.js";
import { Dinheiro } from "../../domain/objetosDeValor/Dinheiro.js";

function criarEditalPendente(): Edital {
  return Edital.criar({
    numeroDeProcesso: "PE-0042/2026",
    orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Distrital" },
    regiao: Regiao.criar("SC", "Florianópolis"),
    objeto: "Aquisição de material de escritório fictício",
    valorEstimado: Dinheiro.criar(1500000),
    dataDePublicacao: new Date("2026-01-10"),
    dataDeEntregaDaProposta: new Date("2026-02-10"),
    classificacaoDoItem: { codigo: "4120-4/00", descricao: "Material fictício" },
  });
}

describe("AvaliarCompatibilidadeDosEditais", () => {
  it("marca como compatível um Edital pendente com Monitoramento ativo compatível", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    empresa.adicionarMonitoramento(Cnae.criar("4120-4/00", "Construção de edifícios"), Regiao.criar("SC"));
    await empresaRepositorio.salvar(empresa);

    const editalRepositorio = new EditalRepositorioFalso();
    await editalRepositorio.salvar(criarEditalPendente());

    const avaliarCompatibilidadeDosEditais = new AvaliarCompatibilidadeDosEditais(
      editalRepositorio,
      empresaRepositorio,
    );

    const resultado = await avaliarCompatibilidadeDosEditais.executar();

    expect(resultado).toEqual({ editaisAvaliados: 1, editaisCompativeis: 1 });
    const atualizado = await editalRepositorio.buscarUltimaVersao(
      "PE-0042/2026",
      "Prefeitura Fictícia de Exemplópolis",
    );
    expect(atualizado?.segmentoInferido?.codigo).toBe("4120-4/00");
  });

  it("ignora Monitoramento com ativo: false, mesmo região e segmento batendo", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const monitoramentoInativo = Monitoramento.reconstituir(
      crypto.randomUUID(),
      Cnae.criar("4120-4/00", "Construção de edifícios"),
      Regiao.criar("SC"),
      false,
    );
    const empresa = Empresa.reconstituir(
      crypto.randomUUID(),
      Cnpj.criar("12345678000195"),
      "Fábrica Fictícia de Exemplos Ltda",
      [monitoramentoInativo],
    );
    await empresaRepositorio.salvar(empresa);

    const editalRepositorio = new EditalRepositorioFalso();
    await editalRepositorio.salvar(criarEditalPendente());

    const avaliarCompatibilidadeDosEditais = new AvaliarCompatibilidadeDosEditais(
      editalRepositorio,
      empresaRepositorio,
    );

    const resultado = await avaliarCompatibilidadeDosEditais.executar();

    expect(resultado).toEqual({ editaisAvaliados: 1, editaisCompativeis: 0 });
  });

  it("não marca Edital sem Monitoramento compatível (região ou segmento não batem)", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    empresa.adicionarMonitoramento(Cnae.criar("6201-5/01", "Desenvolvimento de programas de computador"), Regiao.criar("SC"));
    await empresaRepositorio.salvar(empresa);

    const editalRepositorio = new EditalRepositorioFalso();
    await editalRepositorio.salvar(criarEditalPendente());

    const avaliarCompatibilidadeDosEditais = new AvaliarCompatibilidadeDosEditais(
      editalRepositorio,
      empresaRepositorio,
    );

    const resultado = await avaliarCompatibilidadeDosEditais.executar();

    expect(resultado).toEqual({ editaisAvaliados: 1, editaisCompativeis: 0 });
    const naoAtualizado = await editalRepositorio.buscarUltimaVersao(
      "PE-0042/2026",
      "Prefeitura Fictícia de Exemplópolis",
    );
    expect(naoAtualizado?.segmentoInferido).toBeNull();
  });

  it("retorna zero sem tocar em nada quando não há Empresa cadastrada", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const editalRepositorio = new EditalRepositorioFalso();
    await editalRepositorio.salvar(criarEditalPendente());

    const avaliarCompatibilidadeDosEditais = new AvaliarCompatibilidadeDosEditais(
      editalRepositorio,
      empresaRepositorio,
    );

    const resultado = await avaliarCompatibilidadeDosEditais.executar();

    expect(resultado).toEqual({ editaisAvaliados: 0, editaisCompativeis: 0 });
    const naoTocado = await editalRepositorio.buscarUltimaVersao(
      "PE-0042/2026",
      "Prefeitura Fictícia de Exemplópolis",
    );
    expect(naoTocado?.segmentoInferido).toBeNull();
  });

  it("é idempotente: Edital já compatível não é reprocessado numa segunda execução", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    empresa.adicionarMonitoramento(Cnae.criar("4120-4/00", "Construção de edifícios"), Regiao.criar("SC"));
    await empresaRepositorio.salvar(empresa);

    const editalRepositorio = new EditalRepositorioFalso();
    await editalRepositorio.salvar(criarEditalPendente());

    const avaliarCompatibilidadeDosEditais = new AvaliarCompatibilidadeDosEditais(
      editalRepositorio,
      empresaRepositorio,
    );
    await avaliarCompatibilidadeDosEditais.executar();

    const segundoResultado = await avaliarCompatibilidadeDosEditais.executar();

    expect(segundoResultado).toEqual({ editaisAvaliados: 0, editaisCompativeis: 0 });
  });

  it("reavalia só a versão mais recente do Edital, ignorando uma versão antiga superada e ainda pendente", async () => {
    const empresaRepositorio = new EmpresaRepositorioFalso();
    const empresa = Empresa.criar(Cnpj.criar("12345678000195"), "Fábrica Fictícia de Exemplos Ltda");
    empresa.adicionarMonitoramento(Cnae.criar("4120-4/00", "Construção de edifícios"), Regiao.criar("SC"));
    await empresaRepositorio.salvar(empresa);

    const editalRepositorio = new EditalRepositorioFalso();
    const editalVersao1 = criarEditalPendente();
    await editalRepositorio.salvar(editalVersao1);
    const editalVersao2 = editalVersao1.criarNovaVersao({
      regiao: editalVersao1.regiao,
      objeto: editalVersao1.objeto,
      valorEstimado: editalVersao1.valorEstimado,
      dataDePublicacao: editalVersao1.dataDePublicacao,
      dataDeEntregaDaProposta: editalVersao1.dataDeEntregaDaProposta,
      ...(editalVersao1.classificacaoDoItem !== null
        ? { classificacaoDoItem: editalVersao1.classificacaoDoItem }
        : {}),
    });
    await editalRepositorio.salvar(editalVersao2);

    const avaliarCompatibilidadeDosEditais = new AvaliarCompatibilidadeDosEditais(
      editalRepositorio,
      empresaRepositorio,
    );

    const resultado = await avaliarCompatibilidadeDosEditais.executar();

    expect(resultado).toEqual({ editaisAvaliados: 1, editaisCompativeis: 1 });
    const versoes = editalRepositorio.todasAsVersoesSalvas(
      "PE-0042/2026",
      "Prefeitura Fictícia de Exemplópolis",
    );
    expect(versoes.find((e) => e.versao === 1)?.segmentoInferido).toBeNull();
    expect(versoes.find((e) => e.versao === 2)?.segmentoInferido?.codigo).toBe("4120-4/00");
  });
});
