# Tarefas — SPEC-{NUMERO}

Baseado em: `plano técnico da SPEC-{NUMERO}`
Regra de execução: uma tarefa por vez, na ordem. Nenhuma tarefa começa sem a
anterior estar com teste verde.

## Tarefa {N} — {nome curto e específico}

- **Camada:** domain | application | infrastructure | interfaces/http
- **Teste primeiro:** `{caminho/do/arquivo.test.ts}` — descreve `{o que o
  teste verifica, em uma frase}`
- **Implementação mínima:** `{caminho/do/arquivo.ts}` — o suficiente para o
  teste acima passar, nada além disso
- **Critério de conclusão:** teste acima verde, `npm run typecheck` sem erro,
  nenhuma regressão nos testes já existentes
- **Não fazer nesta tarefa:** {o que fica para a próxima tarefa, mesmo que
  pareça natural incluir agora}

---

{Repita o bloco acima para cada tarefa. Tarefas de domínio vêm antes de
aplicação; aplicação vem antes de infraestrutura; HTTP é sempre a última
camada de cada fatia vertical.}