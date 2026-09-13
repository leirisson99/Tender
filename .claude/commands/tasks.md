---
description: Quebra um plano técnico em tarefas pequenas guiadas por teste (TDD)
allowed-tools: Read, Write, Grep, Glob
---

Você está quebrando o plano técnico de uma SPEC em tarefas pequenas para o
projeto Tender. Ainda não é para escrever código de produção — só a lista
de tarefas.

SPEC/plano alvo (pode vir vazio para usar o plano mais recente sem tarefas):
$ARGUMENTS

Passos:

1. Localize o plano técnico alvo. Leia-o por completo antes de quebrar
   qualquer tarefa.
2. Leia `.claude/templates/task-template.md` e siga a estrutura exata —
   cada tarefa tem teste primeiro, implementação mínima, critério de
   conclusão e o que fica de fora.
3. Ordene as tarefas respeitando a regra de dependência da constituição:
   tarefas de `domain` antes de `application`, `application` antes de
   `infrastructure`, e a tarefa de `interfaces/http` sempre por último
   dentro de cada fatia vertical de funcionalidade.
4. Cada tarefa deve ser pequena o suficiente para ser revisada em poucos
   minutos — se uma tarefa parece exigir mexer em mais de uma camada ao
   mesmo tempo, quebre em duas tarefas.
5. Nenhuma tarefa pode pular teste. Se uma tarefa parecer "óbvia demais
   para testar" (ex: um getter simples), ainda assim registre o teste — a
   constituição não abre exceção por simplicidade percebida.
6. Cada cenário "Dado/Quando/Então" da SPEC original deve mapear para pelo
   menos uma tarefa com teste correspondente. Confira essa cobertura antes
   de finalizar.
7. Salve como `specify/specs/backend/SPEC-{numero}-{slug}/tasks.md`.

Ao final, apresente a lista de tarefas numerada e pergunte ao usuário se
quer começar o `/implement` pela primeira tarefa.