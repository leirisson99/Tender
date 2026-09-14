import { describe, expect, it } from "vitest";
import { IngerirEditaisDoPNCP } from "./IngerirEditaisDoPNCP.js";
import { ClientePNCPFalso } from "./ClientePNCPFalso.js";
import { EditalRepositorioFalso } from "./EditalRepositorioFalso.js";
import { Edital } from "../../domain/entidades/Edital.js";
import { Dinheiro } from "../../domain/objetosDeValor/Dinheiro.js";
import { Regiao } from "../../domain/objetosDeValor/Regiao.js";

describe("IngerirEditaisDoPNCP", () => {
  it("cria e salva cada edital novo quando o repositório está vazio", async () => {
    const clientePNCP = new ClientePNCPFalso();
    clientePNCP.itens = [
      {
        numeroDeProcesso: "PE-0001/2026",
        nomeDoOrgao: "Prefeitura Fictícia de Exemplópolis",
        esfera: "Municipal",
        uf: "SC",
        objeto: "Aquisição de material de escritório fictício",
        valorEstimadoEmCentavos: 1500000,
        dataDePublicacao: new Date("2026-01-10"),
        dataDeEntregaDaProposta: new Date("2026-02-10"),
      },
      {
        numeroDeProcesso: "PE-0002/2026",
        nomeDoOrgao: "Secretaria Fictícia de Obras",
        esfera: "Estadual",
        uf: "SC",
        objeto: "Contratação de serviço fictício de limpeza",
        valorEstimadoEmCentavos: 800000,
        dataDePublicacao: new Date("2026-01-12"),
        dataDeEntregaDaProposta: new Date("2026-02-12"),
      },
    ];
    const editalRepositorio = new EditalRepositorioFalso();
    const ingerirEditaisDoPNCP = new IngerirEditaisDoPNCP(clientePNCP, editalRepositorio);

    const resultado = await ingerirEditaisDoPNCP.executar({
      dataInicial: new Date("2026-01-01"),
      dataFinal: new Date("2026-01-31"),
    });

    expect(editalRepositorio.chamadasDeSalvar).toBe(2);
    expect(resultado).toEqual({ editaisCriados: 2, editaisVersionados: 0, editaisInalterados: 0 });
  });

  it("cria nova versão quando o conteúdo mudou, sem sobrescrever a versão anterior", async () => {
    const editalRepositorio = new EditalRepositorioFalso();
    const editalExistente = Edital.criar({
      numeroDeProcesso: "PE-0001/2026",
      orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Municipal" },
      regiao: Regiao.criar("SC"),
      objeto: "Aquisição de material de escritório fictício",
      valorEstimado: Dinheiro.criar(1500000),
      dataDePublicacao: new Date("2026-01-10"),
      dataDeEntregaDaProposta: new Date("2026-02-10"),
    });
    await editalRepositorio.salvar(editalExistente);
    const clientePNCP = new ClientePNCPFalso();
    clientePNCP.itens = [
      {
        numeroDeProcesso: "PE-0001/2026",
        nomeDoOrgao: "Prefeitura Fictícia de Exemplópolis",
        esfera: "Municipal",
        uf: "SC",
        objeto: "Aquisição de material de escritório fictício",
        valorEstimadoEmCentavos: 1600000,
        dataDePublicacao: new Date("2026-01-10"),
        dataDeEntregaDaProposta: new Date("2026-02-10"),
      },
    ];
    const ingerirEditaisDoPNCP = new IngerirEditaisDoPNCP(clientePNCP, editalRepositorio);

    const resultado = await ingerirEditaisDoPNCP.executar({
      dataInicial: new Date("2026-01-01"),
      dataFinal: new Date("2026-01-31"),
    });

    expect(resultado).toEqual({ editaisCriados: 0, editaisVersionados: 1, editaisInalterados: 0 });
    const versoesSalvas = editalRepositorio.todasAsVersoesSalvas(
      "PE-0001/2026",
      "Prefeitura Fictícia de Exemplópolis",
    );
    expect(versoesSalvas.map((edital) => edital.versao)).toEqual([1, 2]);
    expect(versoesSalvas[1]?.id).toBe(editalExistente.id);
  });

  it("não chama salvar quando o conteúdo retornado é idêntico ao existente", async () => {
    const editalRepositorio = new EditalRepositorioFalso();
    await editalRepositorio.salvar(
      Edital.criar({
        numeroDeProcesso: "PE-0001/2026",
        orgao: { nome: "Prefeitura Fictícia de Exemplópolis", esfera: "Municipal" },
        regiao: Regiao.criar("SC"),
        objeto: "Aquisição de material de escritório fictício",
        valorEstimado: Dinheiro.criar(1500000),
        dataDePublicacao: new Date("2026-01-10"),
        dataDeEntregaDaProposta: new Date("2026-02-10"),
      }),
    );
    const clientePNCP = new ClientePNCPFalso();
    clientePNCP.itens = [
      {
        numeroDeProcesso: "PE-0001/2026",
        nomeDoOrgao: "Prefeitura Fictícia de Exemplópolis",
        esfera: "Municipal",
        uf: "SC",
        objeto: "Aquisição de material de escritório fictício",
        valorEstimadoEmCentavos: 1500000,
        dataDePublicacao: new Date("2026-01-10"),
        dataDeEntregaDaProposta: new Date("2026-02-10"),
      },
    ];
    const ingerirEditaisDoPNCP = new IngerirEditaisDoPNCP(clientePNCP, editalRepositorio);
    const chamadasDeSalvarAntes = editalRepositorio.chamadasDeSalvar;

    const resultado = await ingerirEditaisDoPNCP.executar({
      dataInicial: new Date("2026-01-01"),
      dataFinal: new Date("2026-01-31"),
    });

    expect(resultado).toEqual({ editaisCriados: 0, editaisVersionados: 0, editaisInalterados: 1 });
    expect(editalRepositorio.chamadasDeSalvar).toBe(chamadasDeSalvarAntes);
  });

  it("propaga o erro do ClientePNCP sem chamar salvar", async () => {
    const editalRepositorio = new EditalRepositorioFalso();
    const clientePNCP = new ClientePNCPFalso();
    clientePNCP.erroASerLancado = new Error("rede indisponível");
    const ingerirEditaisDoPNCP = new IngerirEditaisDoPNCP(clientePNCP, editalRepositorio);

    await expect(
      ingerirEditaisDoPNCP.executar({
        dataInicial: new Date("2026-01-01"),
        dataFinal: new Date("2026-01-31"),
      }),
    ).rejects.toThrow("rede indisponível");
    expect(editalRepositorio.chamadasDeSalvar).toBe(0);
  });
});
