import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Testes de infraestrutura compartilham um único Postgres real e a
    // invariante de domínio "uma única Empresa por instância" (SPEC-00,
    // seção 6) — arquivos de teste em paralelo escrevendo na mesma tabela
    // Empresa causam corrida entre processos. Serializa a execução dos
    // arquivos para manter os testes de integração determinísticos.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
