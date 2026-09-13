---
description: Cria uma nova SPEC de feature a partir de uma descrição em linguagem natural
allowed-tools: Read, Write, Grep, Glob
---

Você está criando uma nova SPEC de feature para o projeto Tender.

Descrição da feature recebida do usuário: $ARGUMENTS

Passos:

1. Leia `specify/memory/constitution.md` e `specify/specs/SPEC-00-dominio-e-arquitetura.md`
   antes de escrever qualquer coisa — a SPEC nova tem que usar a mesma
   linguagem ubíqua já definida, sem inventar termo equivalente com outro
   nome (ex: nunca criar "Fornecedor" se o glossário já usa "Empresa").
2. Liste os arquivos existentes em `specify/specs/` (Glob
   `specify/specs/SPEC-*.md`) e determine o próximo número disponível.
   Confirme também se a feature descrita já não corresponde a uma SPEC do
   backlog listado na seção 7 da SPEC-00 — se corresponder, use o mesmo
   número e nome já reservados lá, não invente um novo.
3. Leia `.claude/templates/spec-template.md` e use exatamente essa
   estrutura de seções — não adicione nem remova seção.
4. Preencha o template usando SOMENTE o que a descrição do usuário e o
   glossário existente permitem inferir. Onde faltar informação para um
   critério de aceite objetivo, escreva a pergunta na seção "Dúvidas em
   aberto" em vez de inventar uma resposta.
5. Se a feature introduzir termo novo de domínio, preencha a seção 2 da
   SPEC e sinalize ao usuário que o glossário da SPEC-00 precisa ser
   atualizado depois (não edite a SPEC-00 automaticamente).
6. Verifique a regra de dependência da constituição: se a feature descrita
   parece exigir que o domínio dependa de algo externo, isso é um sinal de
   que a modelagem de domínio precisa mudar — aponte isso no plano, não
   ignore.
7. Salve o arquivo em `specify/specs/SPEC-{numero com dois dígitos}-{slug-em-portugues}.md`.

Ao final, aponte explicitamente qualquer "Dúvida em aberto" que ficou
registrada — essas precisam de resposta do usuário antes do `/plan`.