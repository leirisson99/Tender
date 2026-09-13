# Tender

Agente que monitora editais de licitação compatíveis com o segmento de uma
empresa e a validade da sua documentação de habilitação, alertando via
WhatsApp antes que o prazo vire problema. Projeto de portfólio construído
com Spec-Driven Development.

Leia sempre, nesta ordem, antes de tocar em qualquer código:
1. `specify/memory/constitution.md` — princípios inegociáveis
2. `specify/specs/backend/SPEC-00-dominio-e-arquitetura/spec.md` — glossário, contextos delimitados, arquitetura
3. `specify/specs/backend/SPEC-dominio/spec-dominio.md` — atributos, tipos e invariantes de cada entidade; todo `/plan` reaproveita o que está aqui em vez de redefinir

## Regras inegociáveis (resumo — a fonte de verdade é a constituição)

- **TDD sem exceção.** Nenhuma linha de código de produção sem um teste que
  a exija primeiro. Nunca escreva implementação e teste no mesmo passo —
  o teste vem antes, roda vermelho, depois vem o código mínimo pra ficar verde.
- **Nunca pule etapa do fluxo SDD.** Constituição → SPEC da feature → plano
  técnico → tarefas → implementação. Não implemente nada que não tenha uma
  SPEC aprovada e um plano técnico por trás.
- **Domínio isolado.** `src/domain/` nunca importa Fastify, Prisma, Zod ou
  qualquer pacote externo. Regra de dependência: `interfaces` → `application`
  → `domain`; `infrastructure` implementa portas declaradas pelo `domain`.
- **Zod só em duas fronteiras:** entrada/saída HTTP e resposta de API
  externa não confiável (PNCP, Compras.gov.br). O domínio nunca vê Zod.
- **Nomes por extenso, sem abreviação, em português** (o domínio —
  licitação, habilitação, edital — é brasileiro). Ex.: `dataDeValidade`,
  nunca `dtValid`; `quantidadeDeDocumentosVencidos`, nunca `qtdDocVenc`.
- **Nunca automatize captcha ou bloqueio anti-robô** de portal
  governamental. Onde a fonte exige isso (certidão federal, FGTS,
  trabalhista), a entrada é sempre upload manual do usuário.
- **Dado sintético em spec, teste e seed.** Nenhum CNPJ ou nome de empresa
  real em exemplo — sempre fictício e claramente identificável como tal.
- **Pipeline determinístico primeiro, agente depois.** SPEC-01 a SPEC-08
  não usam LLM nem agente — é regra de negócio simples (comparação de data,
  de CNAE). LangGraph só entra depois, numa camada `interfaces/agent/`
  separada, orquestrando os casos de uso já existentes — nunca recalculando
  o que o domínio decide (ver SPEC-00, seção 9.1).

## Stack

Node.js 20+ / TypeScript · Fastify · Prisma · PostgreSQL · Zod · Vitest ·
tsup · Docker. Justificativa de cada escolha está na constituição, seção 3.

## Estrutura de pastas

```
src/
  domain/            entidades, objetos de valor, regras puras — zero dependência externa
  application/        casos de uso, orquestra domínio via portas (interfaces)
  infrastructure/      repositórios Prisma, cliente PNCP, cliente Evolution API
  interfaces/http/     rotas Fastify, schemas Zod, tradução de erro → HTTP
specify/
  memory/constitution.md
  specs/backend/SPEC-XX-nome/  (spec.md, plan.md, tasks.md por feature)
.claude/
  commands/            constitution.md, specify.md, plan.md, tasks.md, implement.md
  templates/           spec-template.md, plan-template.md, task-template.md
```

## Fluxo de trabalho — use os comandos, nesta ordem

1. `/constitution` — só quando um princípio de engenharia do projeto inteiro muda
2. `/specify {descrição da feature}` — cria a próxima SPEC a partir do backlog da SPEC-00 seção 7
3. `/plan {SPEC}` — traduz a SPEC em entidades, casos de uso, endpoints, schema Prisma
4. `/tasks {plano}` — quebra o plano em tarefas pequenas, cada uma com teste primeiro
5. `/implement {tarefa}` — implementa UMA tarefa por vez, red-green-refactor

Nunca pule de `/specify` direto para código. Nunca implemente mais de uma
tarefa por execução do `/implement`.

## Comandos do dia a dia

```
npm run dev              # sobe o servidor em watch mode
npm run test              # roda a suíte Vitest
npm run test:watch        # Vitest em modo watch
npm run test:coverage     # cobertura
npm run typecheck         # tsc --noEmit
npm run build              # build via tsup
npm run prisma:generate    # gera o client Prisma
npm run prisma:migrate     # cria/aplica migration em dev
docker compose up -d       # sobe o Postgres local
```

## Backlog de features (ordem obrigatória — ver SPEC-00 seção 7)

SPEC-01 Cadastro de Empresa e Monitoramento → SPEC-02 Ingestão de Editais
do PNCP → SPEC-03 Compatibilidade de Edital → SPEC-04 Upload e Ciclo de
Vida de Certidão → SPEC-05 Cálculo de Prontidão → SPEC-06 Geração de Alerta
→ SPEC-07 Envio via WhatsApp → SPEC-08 API HTTP de Consulta.

Evoluções futuras (servidor MCP, agente LangGraph, multi-tenant, contexto
fiscal, diligência de terceiro) estão na seção 9 da SPEC-00 e não são
abertas antes deste backlog estar concluído.