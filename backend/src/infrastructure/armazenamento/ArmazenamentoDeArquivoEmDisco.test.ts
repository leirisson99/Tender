import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ArmazenamentoDeArquivoEmDisco } from "./ArmazenamentoDeArquivoEmDisco.js";

describe("ArmazenamentoDeArquivoEmDisco.salvar", () => {
  let diretorio: string;

  beforeAll(async () => {
    diretorio = await mkdtemp(path.join(tmpdir(), "tender-armazenamento-"));
  });

  afterAll(async () => {
    await rm(diretorio, { recursive: true, force: true });
  });

  it("grava o conteúdo no disco e permite reler o mesmo conteúdo", async () => {
    const armazenamento = new ArmazenamentoDeArquivoEmDisco(diretorio);
    const conteudo = Buffer.from("conteúdo fictício de certidão");

    const referencia = await armazenamento.salvar("certidao.pdf", conteudo);

    expect(referencia.nomeOriginal).toBe("certidao.pdf");
    const conteudoLido = await readFile(referencia.caminho);
    expect(conteudoLido.equals(conteudo)).toBe(true);
  });
});
