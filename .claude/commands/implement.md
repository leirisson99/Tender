---
description: Implementa a próxima tarefa pendente seguindo TDD estrito (red-green-refactor)
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

Você está implementando UMA tarefa da lista de tarefas do projeto Tender,
seguindo TDD estrito. Não implemente mais de uma tarefa nesta execução,
mesmo que pareça rápido continuar.

Tarefa alvo (número ou descrição; vazio = próxima tarefa não concluída):
$ARGUMENTS

Passos, na ordem, sem pular nenhum:

1. Localize a tarefa em `specify/specs/backend/SPEC-{numero}-{slug}/tasks.md`. Se
   `$ARGUMENTS` vier vazio, pegue a primeira tarefa ainda não marcada como
   concluída.
2. **Red:** escreva o teste descrito na tarefa, no caminho exato indicado.
   Rode `npm run test` (ou o teste isolado) e confirme que ele falha pelo
   motivo esperado — não pelo motivo errado (ex: erro de import, não erro
   de asserção). Se falhar pelo motivo errado, corrija o teste antes de
   prosseguir.
3. **Green:** escreva a implementação mínima no caminho indicado pela
   tarefa — o suficiente para o teste passar, nada mais. Não implemente
   funcionalidade de uma tarefa futura só porque está ali do lado.
4. Rode `npm run test` de novo e confirme verde. Rode `npm run typecheck`.
5. **Refactor:** com o teste verde como rede de segurança, limpe nomes,
   remova duplicação óbvia. Nomes seguem a constituição — por extenso, sem
   abreviação, no idioma do domínio (português). Rode os testes de novo
   depois de qualquer refactor.
6. Verifique a regra de dependência: se a tarefa foi em `domain`, confirme
   que nenhum import de Prisma/Zod/Fastify foi introduzido. Se foi em
   `infrastructure`, confirme que a porta (interface) usada já existia no
   `domain` — não crie porta nova sem isso estar no plano.
7. Marque a tarefa como concluída em `tasks.md`.
8. Rode a suíte de testes completa (`npm run test`) para garantir que
   nenhuma tarefa anterior quebrou.

Se qualquer passo falhar e não for possível corrigir dentro do escopo desta
tarefa, pare e explique o bloqueio ao usuário em vez de pular para a
próxima tarefa ou alterar o escopo da tarefa atual sem avisar.

Ao final, diga qual tarefa foi concluída e qual é a próxima da lista.