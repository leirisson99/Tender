import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ClientePNCPHttp } from "./ClientePNCPHttp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureValida = JSON.parse(
  readFileSync(path.join(__dirname, "__fixtures__/editais-pncp.json"), "utf-8"),
);
const fixtureComItemInvalido = JSON.parse(
  readFileSync(path.join(__dirname, "__fixtures__/editais-pncp-com-item-invalido.json"), "utf-8"),
);

function subirServidorDeFixture(corpoDaResposta: unknown): Promise<{ servidor: http.Server; urlBase: string }> {
  return new Promise((resolve) => {
    const servidor = http.createServer((_requisicao, resposta) => {
      resposta.writeHead(200, { "content-type": "application/json" });
      resposta.end(JSON.stringify(corpoDaResposta));
    });

    servidor.listen(0, () => {
      const endereco = servidor.address();
      const porta = typeof endereco === "object" && endereco !== null ? endereco.port : 0;
      resolve({ servidor, urlBase: `http://127.0.0.1:${porta}` });
    });
  });
}

describe("ClientePNCPHttp.buscarEditaisPublicados", () => {
  let servidor: http.Server;
  let urlBase: string;

  beforeAll(async () => {
    ({ servidor, urlBase } = await subirServidorDeFixture(fixtureValida));
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => servidor.close(() => resolve()));
  });

  it("mapeia um item válido corretamente, incluindo esferaId → esfera e reais → centavos", async () => {
    const clientePNCP = new ClientePNCPHttp(urlBase);

    const itens = await clientePNCP.buscarEditaisPublicados({
      dataInicial: new Date("2026-01-01"),
      dataFinal: new Date("2026-01-31"),
      uf: "SC",
    });

    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({
      numeroDeProcesso: "PE-0001/2026",
      nomeDoOrgao: "Prefeitura Fictícia de Exemplópolis",
      esfera: "Distrital",
      uf: "SC",
      municipio: "Florianópolis",
      objeto: "Aquisição de material de escritório fictício",
      valorEstimadoEmCentavos: 1500000,
    });
  });
});

function subirServidorPaginado(corposPorPagina: Record<number, unknown>): Promise<{ servidor: http.Server; urlBase: string }> {
  return new Promise((resolve) => {
    const servidor = http.createServer((requisicao, resposta) => {
      const url = new URL(requisicao.url ?? "", "http://127.0.0.1");
      const pagina = Number(url.searchParams.get("pagina") ?? "1");
      resposta.writeHead(200, { "content-type": "application/json" });
      resposta.end(JSON.stringify(corposPorPagina[pagina]));
    });

    servidor.listen(0, () => {
      const endereco = servidor.address();
      const porta = typeof endereco === "object" && endereco !== null ? endereco.port : 0;
      resolve({ servidor, urlBase: `http://127.0.0.1:${porta}` });
    });
  });
}

describe("ClientePNCPHttp.buscarEditaisPublicados — paginação", () => {
  let servidor: http.Server;
  let urlBase: string;

  beforeAll(async () => {
    ({ servidor, urlBase } = await subirServidorPaginado({
      1: {
        data: [
          {
            processo: "PE-0001/2026",
            orgaoEntidade: { razaoSocial: "Prefeitura Fictícia de Exemplópolis", esferaId: "D" },
            unidadeOrgao: { ufSigla: "SC" },
            objetoCompra: "Aquisição de material de escritório fictício",
            valorTotalEstimado: 15000.0,
            dataPublicacaoPncp: "2026-01-10",
            dataEncerramentoProposta: "2026-02-10",
          },
        ],
        totalPaginas: 2,
        numeroPagina: 1,
      },
      2: {
        data: [
          {
            processo: "PE-0002/2026",
            orgaoEntidade: { razaoSocial: "Secretaria Fictícia de Obras", esferaId: "E" },
            unidadeOrgao: { ufSigla: "SC" },
            objetoCompra: "Contratação de serviço fictício de limpeza",
            valorTotalEstimado: 8000.0,
            dataPublicacaoPncp: "2026-01-12",
            dataEncerramentoProposta: "2026-02-12",
          },
        ],
        totalPaginas: 2,
        numeroPagina: 2,
      },
    }));
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => servidor.close(() => resolve()));
  });

  it("percorre todas as páginas e agrega os itens num único array", async () => {
    const clientePNCP = new ClientePNCPHttp(urlBase);

    const itens = await clientePNCP.buscarEditaisPublicados({
      dataInicial: new Date("2026-01-01"),
      dataFinal: new Date("2026-01-31"),
      uf: "SC",
    });

    expect(itens.map((item) => item.numeroDeProcesso)).toEqual(["PE-0001/2026", "PE-0002/2026"]);
  });
});

describe("ClientePNCPHttp.buscarEditaisPublicados — falha de rede na segunda página", () => {
  let servidor: http.Server;
  let urlBase: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      servidor = http.createServer((requisicao, resposta) => {
        const url = new URL(requisicao.url ?? "", "http://127.0.0.1");
        const pagina = Number(url.searchParams.get("pagina") ?? "1");

        if (pagina === 1) {
          resposta.writeHead(200, { "content-type": "application/json" });
          resposta.end(
            JSON.stringify({
              data: [
                {
                  processo: "PE-0001/2026",
                  orgaoEntidade: { razaoSocial: "Prefeitura Fictícia de Exemplópolis", esferaId: "D" },
                  unidadeOrgao: { ufSigla: "SC" },
                  objetoCompra: "Aquisição de material de escritório fictício",
                  valorTotalEstimado: 15000.0,
                  dataPublicacaoPncp: "2026-01-10",
                  dataEncerramentoProposta: "2026-02-10",
                },
              ],
              totalPaginas: 2,
              numeroPagina: 1,
            }),
          );
          return;
        }

        resposta.writeHead(500, { "content-type": "application/json" });
        resposta.end(JSON.stringify({ data: [], totalPaginas: 2, numeroPagina: 2 }));
      });

      servidor.listen(0, () => {
        const endereco = servidor.address();
        const porta = typeof endereco === "object" && endereco !== null ? endereco.port : 0;
        urlBase = `http://127.0.0.1:${porta}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => servidor.close(() => resolve()));
  });

  it("lança um erro e não retorna nenhum resultado parcial", async () => {
    const clientePNCP = new ClientePNCPHttp(urlBase);

    await expect(
      clientePNCP.buscarEditaisPublicados({
        dataInicial: new Date("2026-01-01"),
        dataFinal: new Date("2026-01-31"),
        uf: "SC",
      }),
    ).rejects.toThrow();
  });
});

describe("ClientePNCPHttp.buscarEditaisPublicados — item inválido no lote", () => {
  let servidor: http.Server;
  let urlBase: string;

  beforeAll(async () => {
    ({ servidor, urlBase } = await subirServidorDeFixture(fixtureComItemInvalido));
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => servidor.close(() => resolve()));
  });

  it("descarta o item inválido individualmente, sem interromper o processamento dos demais", async () => {
    const clientePNCP = new ClientePNCPHttp(urlBase);

    const itens = await clientePNCP.buscarEditaisPublicados({
      dataInicial: new Date("2026-01-01"),
      dataFinal: new Date("2026-01-31"),
      uf: "SC",
    });

    expect(itens).toHaveLength(1);
    expect(itens[0]?.numeroDeProcesso).toBe("PE-0001/2026");
  });
});
