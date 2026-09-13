---
description: Cria ou revisa a constituição do projeto (specify/memory/constitution.md)
allowed-tools: Read, Write, Edit, Grep, Glob
---

Você está revisando a constituição do projeto Tender, em
`specify/memory/constitution.md`. A constituição é a fundação inegociável:
todo o resto (SPECs, planos, tarefas, código) deve obedecê-la.

Argumento recebido do usuário (pode estar vazio): $ARGUMENTS

Passos:

1. Leia `specify/memory/constitution.md` se já existir. Se não existir,
   parta de uma constituição vazia.
2. Se o argumento pedir uma mudança específica (ex: "adicionar princípio
   sobre X", "trocar Vitest por Jest"), aplique só essa mudança — não
   reescreva o documento inteiro sem necessidade.
3. Se o argumento estiver vazio, faça perguntas objetivas ao usuário sobre o
   que falta definir: princípios de engenharia não cobertos, stack ainda
   sem justificativa registrada, ou regras de negócio transversais (ex:
   nunca automatizar captcha) que ainda não estão escritas.
4. Mantenha sempre estas seções, mesmo ao editar: Propósito do projeto,
   Princípios de engenharia (numerados, cada um com uma frase de
   justificativa), Stack tecnológica e justificativa (tabela), Estratégia de
   testes, Fluxo de trabalho (SDD).
5. Cada princípio precisa ser verificável — nada de "escrever código
   limpo" sem uma regra objetiva por trás (ex: "nomes sem abreviação",
   "domínio sem import externo").
6. Depois de editar, verifique se alguma SPEC existente em
   `specify/specs/` contradiz a mudança feita. Se contradizer, avise o
   usuário explicitamente — não corrija a SPEC sozinho sem confirmação.
7. Nunca adicione um princípio que enfraqueça TDD, DDD ou a regra de
   dependência (domain isolado) sem o usuário pedir isso de forma explícita
   e consciente — se pedirem, confirme antes de aplicar.

Ao final, resuma em poucas linhas o que mudou na constituição — não repita o
documento inteiro na resposta.