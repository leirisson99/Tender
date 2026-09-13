# Constituição — Tender

Este documento é a fundação inegociável do projeto. Toda SPEC, plano técnico,
tarefa e linha de código deve obedecê-lo. Em caso de conflito entre a
constituição e qualquer outro artefato (SPEC, plano, comentário de código),
a constituição vence — o artefato conflitante é corrigido, nunca o inverso.

## 1. Propósito do projeto

Uma empresa fornecedora do setor público perde oportunidade de contratação
por dois motivos combinados: não fica sabendo de um edital compatível com o
seu segmento a tempo, e descobre tarde demais que um documento de
habilitação exigido está vencido. O Tender fecha esse ciclo — monitora
editais publicados e a validade da documentação da própria empresa,
alertando via WhatsApp antes que o prazo vire problema.

É um projeto de portfólio construído com Spec-Driven Development: o processo
(constituição → SPEC → plano → tarefas → implementação) é, em si, parte do
que está sendo demonstrado — tanto quanto o software resultante.

## 2. Princípios de engenharia

Cada princípio abaixo é verificável — nenhum entra na constituição sem uma
regra objetiva por trás.

### 1. TDD sem exceção

Nenhuma linha de código de produção é escrita sem um teste que a exija
primeiro. Teste e implementação nunca nascem no mesmo passo: o teste vem
antes, roda vermelho, só então vem o código mínimo pra ficar verde, depois
refatora.
**Justificativa:** é a única forma barata de garantir que o código faz o que
a SPEC pede, e não o que o autor achou no momento que deveria fazer.

### 2. Fluxo SDD sem pular etapa

A ordem constituição → SPEC da feature → plano técnico → tarefas →
implementação é obrigatória. Nenhuma tarefa é implementada sem uma SPEC
aprovada e um plano técnico por trás; `/implement` nunca roda mais de uma
tarefa por execução.
**Justificativa:** pular etapa é a forma mais comum de introduzir escopo não
revisado — o objetivo do processo é tornar toda decisão rastreável até a
SPEC que a motivou.

### 3. Domínio isolado

`src/domain/` nunca importa Fastify, Prisma, Zod ou qualquer pacote externo.
Regra de dependência: `interfaces` → `application` → `domain`;
`infrastructure` implementa portas (interfaces) declaradas pelo `domain` e é
injetada de fora para dentro — nunca o contrário.
**Justificativa:** regra de negócio (comparação de data, de CNAE, cálculo de
prontidão) precisa sobreviver a qualquer troca de framework, ORM ou
biblioteca de validação sem ser tocada.

### 4. Zod só em duas fronteiras

Validação com Zod acontece exclusivamente em entrada/saída HTTP
(`interfaces/http/`) e em resposta de API externa não confiável (PNCP,
Compras.gov.br, Evolution API). O domínio nunca importa ou vê Zod.
**Justificativa:** é a mesma regra do princípio 3 aplicada a uma biblioteca
específica — fronteira de confiança é onde dado não confiável vira tipo
confiável; dentro do domínio o tipo já é garantido pelo TypeScript.

### 5. Nomenclatura em português, por extenso

Identificadores de domínio (variáveis, funções, tipos) são escritos em
português, sem abreviação — o domínio (licitação, habilitação, edital) é
brasileiro e a linguagem ubíqua da SPEC-00 é a fonte de verdade dos termos.
Exemplo: `dataDeValidade`, nunca `dtValid`; `quantidadeDeDocumentosVencidos`,
nunca `qtdDocVenc`.
**Justificativa:** abreviação obriga o leitor a decodificar em vez de ler; o
nome por extenso em português elimina a tradução mental entre o termo do
negócio e o termo do código.

### 6. Dado sintético em spec, teste e seed

Nenhum CNPJ, razão social ou nome de empresa real aparece em exemplo de
SPEC, teste ou seed — sempre fictício e claramente identificável como tal.
**Justificativa:** o domínio lida com CNPJ e documento de habilitação real
de terceiros; dado sintético evita vazar ou normalizar o uso de dado real de
empresa em artefato versionado publicamente.

### 7. Nunca automatizar captcha ou bloqueio anti-robô

Onde a fonte de dado exige captcha ou tem bloqueio anti-robô — certidão
federal, FGTS, trabalhista —, a entrada é sempre upload manual do usuário.
Nenhuma SPEC ou tarefa pode introduzir automação que contorne esse
mecanismo.
**Justificativa:** é uma linha ética e legal, não uma decisão técnica — o
projeto não se apoia em burlar proteção de portal governamental para
funcionar.

### 8. Pipeline determinístico primeiro, agente depois

SPEC-01 a SPEC-08 não usam LLM nem agente — são regra de negócio simples
(comparação de data, de CNAE). Camada agêntica (LangGraph) só é aberta
depois do pipeline determinístico estar com todos os critérios de aceite
cumpridos, numa camada `interfaces/agent/` separada, orquestrando casos de
uso já existentes — nunca recalculando o que o domínio já decide (ver
SPEC-00, seção 9.1).
**Justificativa:** decisão que pode ser regra de negócio simples não deve
pagar o custo de latência, não-determinismo e complexidade de um agente —
IA generativa entra só onde a tarefa genuinamente exige linguagem natural
não estruturada.

## 3. Stack tecnológica e justificativa

| Camada                  | Escolha                   | Justificativa                                                                                                             |
| ----------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Linguagem               | TypeScript / Node.js 20+   | Tipagem estática reforça o princípio 3 (domínio isolado) em tempo de compilação; Node 20 é LTS ativo.                     |
| Framework HTTP          | Fastify                    | Overhead baixo, schema de rota nativo e injeção de dependência simples o bastante para não vazar para dentro do domínio. |
| ORM / acesso a dado     | Prisma                     | Migration versionada e client tipado a partir do schema — reduz erro de mapeamento entre `infrastructure` e PostgreSQL.  |
| Banco de dados          | PostgreSQL                 | Relacional, com suporte maduro a data/hora e consulta temporal — central para "situação da certidão" e "prazo de edital". |
| Validação de fronteira  | Zod                         | Runtime validation com inferência de tipo estática — cobre exatamente as duas fronteiras do princípio 4 sem duplicar tipo manualmente. |
| Testes                  | Vitest                      | Nativo em ESM/TypeScript, rápido o bastante para rodar em todo ciclo red-green-refactor do princípio 1.                   |
| Build                   | tsup                        | Empacotamento sem configuração manual de bundler, suficiente para um serviço HTTP único.                                 |
| Infraestrutura local    | Docker (Compose)            | Sobe PostgreSQL local reprodutível sem exigir instalação na máquina do desenvolvedor.                                    |
| Notificação             | Evolution API (WhatsApp)    | Canal onde o usuário-alvo (fornecedor de licitação) já está, evita construir app dedicado para o MVP.                    |

## 4. Estratégia de testes

- **TDD red-green-refactor é o processo, não uma meta de cobertura à parte**
  (princípio 1) — mas a cobertura mínima de linha exigida em CI é **80%**,
  medida por `npm run test:coverage`.
- **Pirâmide de teste por camada:**
  - `domain/`: teste unitário puro, sem mock — a própria natureza do
    princípio 3 (zero dependência externa) torna isso trivial.
  - `application/`: teste unitário contra porta (interface) fake/em memória
    — nunca contra o Prisma real.
  - `infrastructure/`: teste de integração contra o PostgreSQL real subido
    via `docker-compose.yml`, e contra **fixture HTTP gravada** (payload de
    exemplo sintético, salvo em repositório) para cliente de API externa
    não confiável (PNCP, Compras.gov.br, Evolution API) — nunca chamando a
    API real durante o test run, e nunca simulando ou contornando captcha
    (princípio 7 continua valendo mesmo em teste).
  - `interfaces/http/`: teste de integração via injeção de request do
    Fastify (`app.inject`), cobrindo tradução de erro de domínio para
    código HTTP e validação Zod de entrada/saída.
- Fixture HTTP gravada é revisada como qualquer outro artefato de teste —
  se o contrato da API externa mudar, o teste quebra e a fixture é
  atualizada deliberadamente, nunca regravada automaticamente contra a API
  real em CI.

## 5. Fluxo de trabalho (SDD)

1. `/constitution` — só quando um princípio de engenharia do projeto inteiro
   muda.
2. `/specify {descrição da feature}` — cria a próxima SPEC a partir do
   backlog da SPEC-00, seção 7, na ordem definida.
3. `/plan {SPEC}` — traduz a SPEC em entidades, casos de uso, endpoints,
   schema Prisma.
4. `/tasks {plano}` — quebra o plano em tarefas pequenas, cada uma com teste
   primeiro.
5. `/implement {tarefa}` — implementa uma tarefa por vez, red-green-refactor.

Nunca se pula de `/specify` direto para código. Nunca se implementa mais de
uma tarefa por execução do `/implement`. Nenhuma SPEC de evolução listada na
SPEC-00 seção 9 é aberta antes do backlog da seção 7 (SPEC-01 a SPEC-08)
estar com os critérios de aceite cumpridos.
