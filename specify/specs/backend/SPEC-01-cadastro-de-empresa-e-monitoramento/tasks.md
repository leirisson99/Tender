# Tarefas — SPEC-01

Baseado em: `plano técnico da SPEC-01`
Regra de execução: uma tarefa por vez, na ordem. Nenhuma tarefa começa sem a
anterior estar com teste verde.

**Status:** todas as 26 tarefas concluídas (28 testes verdes). As rotas HTTP
(19–26) foram implementadas e testadas contra o `EmpresaRepositorioFalso`
(fake em memória) — cobrem contrato HTTP e mapeamento de erro. As Tarefas
16–18 (`EmpresaRepositorioPrisma`, Postgres real via `docker-compose.yml`)
ficaram bloqueadas por um tempo nesta sessão porque o Docker Desktop não
estava rodando; foram concluídas depois que o Docker subiu.

**Pendência fora da lista original:** `src/index.ts`/`src/server.ts` (ponto
de entrada real, ligando `construirApp` ao `EmpresaRepositorioPrisma` em vez
do fake) não tinham tarefa própria — foram criados manualmente depois das
26 tarefas, fora do ciclo red/green por serem só composição/wiring sem
lógica de negócio própria.

## Tarefa 1 — `Cnpj.criar` aceita CNPJ válido ✅

- **Camada:** domain
- **Teste primeiro:** `src/domain/objetosDeValor/Cnpj.test.ts` — `Cnpj.criar`
  com um CNPJ sintético de 14 dígitos e dígito verificador correto (com ou
  sem pontuação) retorna uma instância cujo `numero` está sem pontuação.
- **Implementação mínima:** `src/domain/objetosDeValor/Cnpj.ts` — função
  `Cnpj.criar(bruto: string): Cnpj` que remove pontuação e calcula o
  dígito verificador.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, nenhuma regressão nos testes já existentes.
- **Não fazer nesta tarefa:** rejeitar CNPJ inválido — isso é a Tarefa 2.

---

## Tarefa 2 — `Cnpj.criar` rejeita dígito verificador inválido ✅

- **Camada:** domain
- **Teste primeiro:** `src/domain/objetosDeValor/Cnpj.test.ts` — `Cnpj.criar`
  com dígito verificador incorreto lança `CnpjInvalidoError`.
- **Implementação mínima:** `src/domain/erros/CnpjInvalidoError.ts` (nova
  classe de erro) e o branch de validação em `Cnpj.ts` que a lança.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, Tarefa 1 continua verde.
- **Não fazer nesta tarefa:** validar formato de outros objetos de valor.

---

## Tarefa 3 — `Cnae.criar` aceita código no formato oficial ✅

- **Camada:** domain
- **Teste primeiro:** `src/domain/objetosDeValor/Cnae.test.ts` — `Cnae.criar`
  com código `"4120-4/00"` e uma descrição retorna uma instância com esses
  atributos.
- **Implementação mínima:** `src/domain/objetosDeValor/Cnae.ts` — função
  `Cnae.criar(codigo: string, descricao: string): Cnae` validando o
  formato `\d{4}-\d\/\d{2}` com regex.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, testes anteriores continuam verdes.
- **Não fazer nesta tarefa:** rejeitar código inválido — isso é a Tarefa 4.

---

## Tarefa 4 — `Cnae.criar` rejeita código fora do formato oficial ✅

- **Camada:** domain
- **Teste primeiro:** `src/domain/objetosDeValor/Cnae.test.ts` — `Cnae.criar`
  com um código fora do formato (ex.: `"12345"`) lança `CnaeInvalidoError`.
- **Implementação mínima:** `src/domain/erros/CnaeInvalidoError.ts` e o
  branch de validação em `Cnae.ts` que a lança.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, testes anteriores continuam verdes.
- **Não fazer nesta tarefa:** validar `Regiao`.

---

## Tarefa 5 — `Regiao.criar` aceita UF válida, com e sem município ✅

- **Camada:** domain
- **Teste primeiro:** `src/domain/objetosDeValor/Regiao.test.ts` —
  `Regiao.criar("SC")` retorna instância com `municipio: null`;
  `Regiao.criar("SC", "Florianópolis")` retorna instância com o município
  informado.
- **Implementação mínima:** `src/domain/objetosDeValor/Regiao.ts` — função
  `Regiao.criar(uf: string, municipio?: string): Regiao` validando `uf`
  contra a lista das 27 siglas de estado + DF.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, testes anteriores continuam verdes.
- **Não fazer nesta tarefa:** rejeitar UF inválida — isso é a Tarefa 6.

---

## Tarefa 6 — `Regiao.criar` rejeita UF inválida ✅

- **Camada:** domain
- **Teste primeiro:** `src/domain/objetosDeValor/Regiao.test.ts` —
  `Regiao.criar("XX")` lança `RegiaoInvalidaError`.
- **Implementação mínima:** `src/domain/erros/RegiaoInvalidaError.ts` e o
  branch de validação em `Regiao.ts` que a lança.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, testes anteriores continuam verdes.
- **Não fazer nesta tarefa:** modelar `Empresa` ou `Monitoramento`.

---

## Tarefa 7 — `Empresa.criar` gera Empresa com lista de Monitoramento vazia ✅

- **Camada:** domain
- **Teste primeiro:** `src/domain/entidades/Empresa.test.ts` —
  `Empresa.criar(cnpj, razaoSocial)` retorna uma Empresa com `id` gerado,
  `cnpj` e `razaoSocial` informados, e `monitoramentos: []`.
- **Implementação mínima:** `src/domain/entidades/Empresa.ts` — classe
  `Empresa` com método estático `criar`, usando `crypto.randomUUID()` para
  o `id`.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, testes anteriores continuam verdes.
- **Não fazer nesta tarefa:** implementar `adicionarMonitoramento`.

---

## Tarefa 8 — `Empresa.adicionarMonitoramento` adiciona quando não há duplicata ✅

- **Camada:** domain
- **Teste primeiro:** `src/domain/entidades/Empresa.test.ts` — dada uma
  Empresa sem Monitoramentos, `adicionarMonitoramento(segmento, regiao)`
  retorna um `Monitoramento` com `ativo: true` e o adiciona à lista da
  Empresa.
- **Implementação mínima:** método `adicionarMonitoramento` em
  `Empresa.ts`, e o tipo/classe `Monitoramento` no mesmo arquivo.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, testes anteriores continuam verdes.
- **Não fazer nesta tarefa:** validar duplicidade — isso é a Tarefa 9.

---

## Tarefa 9 — `Empresa.adicionarMonitoramento` rejeita duplicata por (código, UF, município) ✅

- **Camada:** domain
- **Teste primeiro:** `src/domain/entidades/Empresa.test.ts` — dada uma
  Empresa que já monitora `(codigo, uf, municipio)`, chamar
  `adicionarMonitoramento` de novo com o mesmo `codigo`/`uf`/`municipio`
  mas `descricao` diferente lança `MonitoramentoDuplicadoError`.
- **Implementação mínima:** `src/domain/erros/MonitoramentoDuplicadoError.ts`
  e a checagem de duplicidade em `adicionarMonitoramento`.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, todos os testes de domínio continuam verdes.
- **Não fazer nesta tarefa:** qualquer código de `application`.

---

## Tarefa 10 — `CadastrarEmpresa` cria Empresa quando nenhuma existe ✅

- **Camada:** application
- **Teste primeiro:** `src/application/casosDeUso/CadastrarEmpresa.test.ts`
  — com um `EmpresaRepositorioFalso` (fake em memória, `existeEmpresaCadastrada`
  retorna `false`), executar o caso de uso com CNPJ e razão social válidos
  retorna a Empresa criada e chama `salvar` uma vez.
- **Implementação mínima:** `src/domain/portas/EmpresaRepositorio.ts`
  (interface), `src/application/casosDeUso/EmpresaRepositorioFalso.ts`
  (fake de teste) e `src/application/casosDeUso/CadastrarEmpresa.ts`.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, testes de domínio continuam verdes.
- **Não fazer nesta tarefa:** tratar CNPJ inválido ou Empresa duplicada.

---

## Tarefa 11 — `CadastrarEmpresa` propaga `CnpjInvalidoError` sem persistir ✅

- **Camada:** application
- **Teste primeiro:** `src/application/casosDeUso/CadastrarEmpresa.test.ts`
  — com CNPJ de dígito verificador inválido, o caso de uso lança
  `CnpjInvalidoError` e `salvar` do fake nunca é chamado.
- **Implementação mínima:** nenhuma mudança de lógica nova — `Cnpj.criar`
  já lança o erro; garantir que `CadastrarEmpresa` não o intercepta.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, Tarefa 10 continua verde.
- **Não fazer nesta tarefa:** tratar Empresa duplicada.

---

## Tarefa 12 — `CadastrarEmpresa` rejeita segunda Empresa ✅

- **Camada:** application
- **Teste primeiro:** `src/application/casosDeUso/CadastrarEmpresa.test.ts`
  — com o fake configurado para `existeEmpresaCadastrada` retornar `true`,
  o caso de uso lança `InstanciaJaPossuiEmpresaError` e `salvar` nunca é
  chamado.
- **Implementação mínima:** `src/application/erros/InstanciaJaPossuiEmpresaError.ts`
  e a checagem no início de `CadastrarEmpresa`.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, Tarefas 10 e 11 continuam verdes.
- **Não fazer nesta tarefa:** qualquer código de `ConfigurarMonitoramento`.

---

## Tarefa 13 — `ConfigurarMonitoramento` adiciona Monitoramento à Empresa existente ✅

- **Camada:** application
- **Teste primeiro:** `src/application/casosDeUso/ConfigurarMonitoramento.test.ts`
  — com o fake retornando uma Empresa sem Monitoramentos em
  `buscarEmpresaUnica`, o caso de uso retorna o Monitoramento criado e
  chama `salvar` com a Empresa atualizada.
- **Implementação mínima:** `src/application/casosDeUso/ConfigurarMonitoramento.ts`,
  estendendo `EmpresaRepositorio` e o fake com `buscarEmpresaUnica`.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, testes de `CadastrarEmpresa` continuam verdes.
- **Não fazer nesta tarefa:** tratar duplicidade ou Empresa inexistente.

---

## Tarefa 14 — `ConfigurarMonitoramento` rejeita Monitoramento duplicado ✅

- **Camada:** application
- **Teste primeiro:** `src/application/casosDeUso/ConfigurarMonitoramento.test.ts`
  — com o fake retornando uma Empresa que já monitora o par informado, o
  caso de uso lança `MonitoramentoDuplicadoError` e `salvar` nunca é
  chamado.
- **Implementação mínima:** nenhuma lógica nova — `Empresa.adicionarMonitoramento`
  já lança o erro; garantir que o caso de uso propaga sem interceptar.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, Tarefa 13 continua verde.
- **Não fazer nesta tarefa:** tratar Empresa inexistente.

---

## Tarefa 15 — `ConfigurarMonitoramento` rejeita quando não há Empresa cadastrada ✅

- **Camada:** application
- **Teste primeiro:** `src/application/casosDeUso/ConfigurarMonitoramento.test.ts`
  — com o fake retornando `null` em `buscarEmpresaUnica`, o caso de uso
  lança `EmpresaNaoEncontradaError`.
- **Implementação mínima:** `src/application/erros/EmpresaNaoEncontradaError.ts`
  e a checagem no início de `ConfigurarMonitoramento`.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, todos os testes de `application` continuam verdes.
- **Não fazer nesta tarefa:** qualquer código de `infrastructure`.

---

## Tarefa 16 — `EmpresaRepositorioPrisma`: `salvar` + `buscarEmpresaUnica` ✅

- **Camada:** infrastructure
- **Teste primeiro:** `src/infrastructure/repositorios/EmpresaRepositorioPrisma.test.ts`
  — contra o Postgres real (`docker-compose.yml` de pé), salvar uma
  Empresa com um Monitoramento e recuperá-la via `buscarEmpresaUnica`
  preserva `cnpj`, `razaoSocial`, e os atributos do Monitoramento.
- **Implementação mínima:** incremento em `prisma/schema.prisma` (models
  `Empresa` e `Monitoramento`, ver plano seção 5), migration
  `criar_empresa_e_monitoramento`, e
  `src/infrastructure/repositorios/EmpresaRepositorioPrisma.ts`
  implementando `salvar` e `buscarEmpresaUnica`.
- **Critério de conclusão:** teste acima verde contra Postgres real,
  `npm run typecheck` sem erro, suíte de `domain`/`application` continua
  verde.
- **Não fazer nesta tarefa:** implementar `existeEmpresaCadastrada`.

---

## Tarefa 17 — `EmpresaRepositorioPrisma.existeEmpresaCadastrada` ✅

- **Camada:** infrastructure
- **Teste primeiro:** `src/infrastructure/repositorios/EmpresaRepositorioPrisma.test.ts`
  — `existeEmpresaCadastrada()` retorna `false` com o banco vazio e `true`
  depois de uma Empresa ser salva.
- **Implementação mínima:** método `existeEmpresaCadastrada` no
  repositório Prisma.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, Tarefa 16 continua verde.
- **Não fazer nesta tarefa:** rotas HTTP.

---

## Tarefa 18 — Caracterização: `@@unique` do Prisma não barra município nulo duplicado ✅

- **Camada:** infrastructure
- **Teste primeiro:** `src/infrastructure/repositorios/EmpresaRepositorioPrisma.test.ts`
  — inserir diretamente via Prisma Client (bypassando o domínio) duas
  linhas de `Monitoramento` com `municipio: null` e o mesmo
  `(empresaId, segmentoCodigo, uf)` não gera erro de constraint do banco.
- **Implementação mínima:** nenhuma — este teste documenta uma limitação
  do Postgres (ver plano, seção 7), não exige código novo.
- **Critério de conclusão:** teste acima verde (comprova a limitação),
  comentário no teste apontando para o plano, `npm run typecheck` sem
  erro.
- **Não fazer nesta tarefa:** tentar "corrigir" o índice único — a
  correção é a checagem em `domain`, já coberta pela Tarefa 9.

---

## Tarefa 19 — `POST /empresa` retorna 201 no caminho feliz ✅

- **Camada:** interfaces/http
- **Teste primeiro:** `src/interfaces/http/rotas/empresa.test.ts` — via
  `app.inject`, `POST /empresa` com `{ cnpj, razaoSocial }` válidos retorna
  201 e o corpo `{ id, cnpj, razaoSocial }`.
- **Implementação mínima:** schema Zod de entrada/saída e a rota em
  `src/interfaces/http/rotas/empresa.ts`, ligando ao caso de uso
  `CadastrarEmpresa` com `EmpresaRepositorioPrisma`.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, suíte completa até aqui continua verde.
- **Não fazer nesta tarefa:** tratar os erros 400/409 — isso é as Tarefas
  20 e 21.

---

## Tarefa 20 — `POST /empresa` retorna 400 com CNPJ inválido ✅

- **Camada:** interfaces/http
- **Teste primeiro:** `src/interfaces/http/rotas/empresa.test.ts` —
  `POST /empresa` com CNPJ de dígito verificador inválido retorna 400.
- **Implementação mínima:** tradução de `CnpjInvalidoError` (e de falha de
  validação Zod) para status 400 na rota.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, Tarefa 19 continua verde.
- **Não fazer nesta tarefa:** tratar o erro 409.

---

## Tarefa 21 — `POST /empresa` retorna 409 na segunda tentativa de cadastro ✅

- **Camada:** interfaces/http
- **Teste primeiro:** `src/interfaces/http/rotas/empresa.test.ts` — depois
  de uma Empresa já cadastrada, um segundo `POST /empresa` retorna 409.
- **Implementação mínima:** tradução de `InstanciaJaPossuiEmpresaError`
  para status 409 na rota.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, Tarefas 19 e 20 continuam verdes.
- **Não fazer nesta tarefa:** qualquer rota de Monitoramento.

---

## Tarefa 22 — `POST /empresa/monitoramentos` retorna 201 no caminho feliz ✅

- **Camada:** interfaces/http
- **Teste primeiro:** `src/interfaces/http/rotas/empresa.test.ts` — com uma
  Empresa já cadastrada, `POST /empresa/monitoramentos` com CNAE e região
  válidos retorna 201 e o Monitoramento criado.
- **Implementação mínima:** schema Zod e rota para
  `POST /empresa/monitoramentos` em `empresa.ts`, ligando ao caso de uso
  `ConfigurarMonitoramento`.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, suíte completa até aqui continua verde.
- **Não fazer nesta tarefa:** tratar os erros 400/404/409.

---

## Tarefa 23 — `POST /empresa/monitoramentos` retorna 400 com CNAE inválido ✅

- **Camada:** interfaces/http
- **Teste primeiro:** `src/interfaces/http/rotas/empresa.test.ts` — CNAE
  fora do formato oficial retorna 400.
- **Implementação mínima:** tradução de `CnaeInvalidoError` (e falha de
  validação Zod) para status 400.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, Tarefa 22 continua verde.
- **Não fazer nesta tarefa:** tratar UF inválida.

---

## Tarefa 24 — `POST /empresa/monitoramentos` retorna 400 com UF inválida ✅

- **Camada:** interfaces/http
- **Teste primeiro:** `src/interfaces/http/rotas/empresa.test.ts` — UF fora
  da lista de estados válidos retorna 400.
- **Implementação mínima:** tradução de `RegiaoInvalidaError` para status
  400.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, Tarefas 22 e 23 continuam verdes.
- **Não fazer nesta tarefa:** tratar Empresa inexistente ou duplicidade.

---

## Tarefa 25 — `POST /empresa/monitoramentos` retorna 404 sem Empresa cadastrada ✅

- **Camada:** interfaces/http
- **Teste primeiro:** `src/interfaces/http/rotas/empresa.test.ts` — sem
  nenhuma Empresa cadastrada, `POST /empresa/monitoramentos` retorna 404.
- **Implementação mínima:** tradução de `EmpresaNaoEncontradaError` para
  status 404.
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem
  erro, Tarefas 22–24 continuam verdes.
- **Não fazer nesta tarefa:** tratar duplicidade.

---

## Tarefa 26 — `POST /empresa/monitoramentos` retorna 409 em Monitoramento duplicado ✅ (rotas ligadas ao `EmpresaRepositorioFalso`, ver nota de bloqueio nas Tarefas 16-18)

- **Camada:** interfaces/http
- **Teste primeiro:** `src/interfaces/http/rotas/empresa.test.ts` —
  configurar o mesmo par (CNAE, região) duas vezes retorna 409 na segunda
  chamada.
- **Implementação mínima:** tradução de `MonitoramentoDuplicadoError` para
  status 409.
- **Critério de conclusão:** todos os critérios de aceite da SPEC-01
  cobertos por teste, `npm run test` e `npm run typecheck` sem erro,
  nenhum import de `infrastructure`/framework dentro de `domain`.
- **Não fazer nesta tarefa:** qualquer escopo da SPEC-02 em diante.
