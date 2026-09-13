---
description: Traduz uma SPEC aprovada em um plano técnico (entidades, casos de uso, endpoints, schema)
allowed-tools: Read, Write, Grep, Glob
---

Você está escrevendo o plano técnico de uma SPEC já aprovada do projeto
Tender. Ainda não é para escrever código de produção.

SPEC alvo (número ou nome, pode vir vazio para usar a mais recente sem
plano): $ARGUMENTS

Passos:

1. Localize a SPEC alvo em `specify/specs/`. Se `$ARGUMENTS` vier vazio,
   escolha a SPEC de menor número que ainda não tem um plano associado.
2. Confira se a SPEC tem alguma "Dúvida em aberto" sem resposta na seção 6.
   Se tiver, pare e pergunte ao usuário antes de continuar — planejar em
   cima de dúvida não resolvida produz retrabalho.
3. Leia `specify/memory/constitution.md` e `specify/specs/SPEC-00-dominio-e-arquitetura.md`
   para reusar entidades e portas já definidas em vez de recriar.
4. Leia `.claude/templates/plan-template.md` e siga a estrutura exata.
5. Para cada cenário "Dado/Quando/Então" da seção 3 da SPEC, garanta que
   ele apareça na seção 6 do plano (estratégia de teste) — nenhum cenário
   da SPEC pode ficar sem teste correspondente planejado.
6. Ao definir entidades (seção 1 do plano), confirme que nenhuma delas
   importa Prisma, Zod ou Fastify — se a modelagem parecer exigir isso,
   pare e explique o conflito com a constituição em vez de violá-la
   silenciosamente.
7. Ao definir o schema Prisma (seção 5), descreva apenas o incremento
   (novo model/campo), nunca reescreva o schema inteiro no plano.
8. Salve como `specify/specs/SPEC-{numero}-{slug}/plan.md`, criando a pasta
   se a SPEC ainda for um arquivo único (nesse caso, mova a SPEC para
   `specify/specs/SPEC-{numero}-{slug}/spec.md` antes de adicionar o plano,
   preservando o conteúdo).

Ao final, liste as decisões da seção 7 do plano que dependem de confirmação
do usuário antes do `/tasks`.