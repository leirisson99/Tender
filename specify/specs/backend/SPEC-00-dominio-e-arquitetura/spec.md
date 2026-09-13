# SPEC-00 — Domínio e Arquitetura (Tender)

Status: fundação · não implementa feature, define o alicerce para as SPECs seguintes.

## 1. Problema

Uma empresa fornecedora do setor público perde oportunidade de contratação
por dois motivos combinados: não fica sabendo de um edital compatível com o
seu segmento a tempo, e descobre tarde demais que um documento de
habilitação exigido está vencido. O projeto fecha esse ciclo: monitora
editais publicados e a validade da documentação da própria empresa,
alertando antes que o prazo vire problema.

## 2. Linguagem ubíqua (glossário do domínio)

| Termo | Significado no domínio |
|---|---|
| **Empresa** | O cliente do sistema — a pessoa jurídica fornecedora que quer participar de licitações. Identificada por CNPJ. |
| **Segmento** | Classificação de atividade da empresa (CNAE) usada para filtrar editais relevantes. |
| **Órgão** | A entidade pública que publica um edital (prefeitura, secretaria, autarquia). |
| **Edital** | Um processo de contratação pública publicado, com objeto, valor estimado, prazo de entrega de proposta e órgão responsável. |
| **Monitoramento** | A configuração de uma empresa que define quais segmentos e regiões devem gerar alerta de edital. |
| **Documento de Habilitação** | Um tipo de documento exigido pela legislação de licitação (ex.: CND Federal, CRF do FGTS, CNDT, atestado de capacidade técnica), pertencente a uma das quatro categorias de habilitação. |
| **Categoria de Habilitação** | Uma das quatro exigidas pela Lei 14.133/2021: jurídica, fiscal e trabalhista, econômico-financeira, técnica. |
| **Certidão** | A instância concreta de um Documento de Habilitação pertencente a uma Empresa, com data de emissão e data de validade, enviada por upload. |
| **Situação da Certidão** | Estado derivado da data de validade: válida, a vencer (dentro da janela de alerta), ou vencida. |
| **Prontidão** | Medida do quanto a Empresa está apta a participar de um Edital específico, calculada a partir da situação das Certidões exigidas por aquele edital. |
| **Alerta** | Notificação gerada quando um Edital compatível é publicado ou quando a Situação de uma Certidão muda para "a vencer" ou "vencida". |

## 3. Contextos delimitados (bounded contexts)

```
┌───────────────────────┐   ┌──────────────────────────┐   ┌───────────────────┐
│ Perfil da Empresa      │   │ Descoberta de Editais     │   │ Habilitação        │
│ (Company Profile)      │   │ (Tender Discovery)        │   │ (Qualification)     │
│                        │   │                           │   │                    │
│ Empresa, Segmento,     │──▶│ Edital, Órgão,            │──▶│ Documento,          │
│ Monitoramento          │   │ Compatibilidade           │   │ Certidão, Prontidão │
└───────────────────────┘   └──────────────────────────┘   └───────────────────┘
                                        │                            │
                                        ▼                            ▼
                              ┌──────────────────────────────────────────┐
                              │ Notificação (Notification)                │
                              │ Alerta, Canal de Envio                    │
                              └──────────────────────────────────────────┘
```

- **Perfil da Empresa** é a fonte de verdade sobre quem é o cliente e o que
  ele monitora. As outras três dependem dele, nunca o contrário.
- **Descoberta de Editais** e **Habilitação** não se conhecem diretamente —
  ambos publicam eventos de domínio que o contexto de **Notificação**
  consome. Isso mantém os dois substituíveis de forma independente (por
  exemplo, trocar a fonte de edital sem tocar em habilitação).

## 4. Modelo de domínio (agregados)

Visão geral abaixo. Atributos, tipos, objetos de valor e o diagrama de
relacionamento completo estão em `specify/specs/modelo-de-dominio.md` — todo
`/plan` de feature consulta aquele documento antes de definir entidade nova.

### Agregado `Empresa` (contexto Perfil da Empresa)
- Raiz: `Empresa` (identificada por CNPJ)
- Contém: lista de `Monitoramento` (segmento + região)
- Invariante: uma Empresa não pode ter dois Monitoramentos idênticos (mesmo segmento e mesma região)

### Agregado `Edital` (contexto Descoberta de Editais)
- Raiz: `Edital` (identificado por número de processo + órgão)
- Atributos: objeto, órgão, valor estimado, data de publicação, data de entrega de proposta, segmento inferido
- Invariante: um Edital é imutável após publicado — atualização gera uma nova versão, nunca sobrescreve o histórico

### Agregado `DossiêDeHabilitação` (contexto Habilitação)
- Raiz: `DossiêDeHabilitação` (um por Empresa)
- Contém: lista de `Certidão`, cada uma com tipo, data de emissão, data de validade
- Regra de domínio: `calcularProntidãoParaEdital(edital)` — cruza as categorias exigidas pelo edital com a situação atual das certidões e devolve um placar (apta / pendente / inapta) e a lista de pendências
- Invariante: uma Certidão vencida nunca é considerada válida, independente de qualquer outro campo

### Agregado `Alerta` (contexto Notificação)
- Raiz: `Alerta` (pertence a uma Empresa)
- Atributos: tipo (edital compatível / certidão a vencer / certidão vencida), referência ao Edital ou Certidão de origem, canal de envio, momento de envio
- Invariante: o mesmo evento de origem nunca gera dois Alertas idênticos não confirmados (evita duplicidade de notificação)

## 5. Arquitetura em camadas

```
src/
  domain/            → entidades, objetos de valor, regras de negócio puras.
                        Zero import de Fastify, Prisma, Zod ou qualquer lib externa.
  application/        → casos de uso (um arquivo por caso de uso), orquestra
                        entidades de domínio através de portas (interfaces)
  infrastructure/      → implementação das portas: repositórios Prisma,
                        cliente HTTP do PNCP, cliente da Evolution API
  interfaces/
    http/              → rotas Fastify, schemas Zod de entrada/saída,
                        tradução de erro de domínio para código HTTP
```

Regra de dependência (reforça a constituição): `interfaces` → `application` →
`domain`; `infrastructure` implementa portas declaradas em `domain` e é
injetada de fora para dentro (nunca importada pelo `domain`).

## 6. Fora de escopo desta fundação

- Automação de consulta de certidão em portal com captcha (ver constituição, princípio 7) — entrada é sempre upload manual nesta fase
- Cobertura de todos os 27 estados no MVP — primeira SPEC de feature cobre um segmento (CNAE) e uma região (SC) fixos, por decisão deliberada de escopo
- Autenticação/multiempresa (multi-tenant real) — a fundação assume uma única Empresa por instância nesta fase; multi-tenant é uma SPEC futura, não um requisito da v1

## 7. Backlog de SPECs de feature (a definir uma a uma, nesta ordem)

1. **SPEC-01 — Cadastro de Empresa e Monitoramento**: criar Empresa, configurar segmento e região a monitorar
2. **SPEC-02 — Ingestão de Editais do PNCP**: cliente HTTP contra a API pública do PNCP, mapeamento de payload externo para o agregado `Edital`
3. **SPEC-03 — Compatibilidade de Edital com Monitoramento**: regra que decide se um Edital ingerido é relevante para uma Empresa
4. **SPEC-04 — Upload e Ciclo de Vida de Certidão**: cadastro de Certidão, cálculo de situação (válida / a vencer / vencida) por data
5. **SPEC-05 — Cálculo de Prontidão para um Edital**: cruzamento de categorias exigidas x situação das certidões, com pendências explícitas
6. **SPEC-06 — Geração de Alerta**: eventos de domínio que disparam Alerta (edital compatível, certidão a vencer, certidão vencida)
7. **SPEC-07 — Envio de Alerta via WhatsApp**: integração com Evolution API, formatação de mensagem, tratamento de falha de envio
8. **SPEC-08 — API HTTP de Consulta**: endpoints Fastify para listar editais compatíveis, consultar dossiê de habilitação e histórico de alertas

Cada SPEC acima segue o mesmo formato desta (Problema, Linguagem Ubíqua
adicional se houver termo novo, Critérios de Aceite, Fora de Escopo) e só é
aberta quando a anterior estiver com seus critérios de aceite cumpridos.

## 8. Critérios de aceite desta fundação

- [ ] `constitution.md` revisado e aceito como não-negociável
- [ ] Glossário validado — todo termo usado em código futuro tem que existir aqui primeiro
- [ ] Estrutura de pastas criada vazia (`domain/`, `application/`, `infrastructure/`, `interfaces/http/`) com um teste de arquitetura (dependência) garantindo que `domain` não importa nada de fora
- [ ] `docker-compose.yml` com serviço Postgres sobe e aceita conexão
- [ ] SPEC-01 redigida e aprovada antes de qualquer código de aplicação

## 9. Visão de evolução (fora do MVP — não vira SPEC até o backlog da seção 7 estar concluído)

Registrado aqui para não se perder, mas deliberadamente fora da ordem de
implementação da seção 7. Nenhum item abaixo é aberto como SPEC antes de
SPEC-01 a SPEC-08 estarem com os critérios de aceite cumpridos — evita que a
fundação vire escopo infinito antes de existir uma v1 funcionando.

### 9.1 Evoluções técnicas

**Decisão deliberada de ordem:** o pipeline SPEC-01 a SPEC-08 é
100% determinístico — nenhum LLM, nenhum agente, nenhuma dependência de
IA generativa decide se um edital é compatível ou se um documento está
vencido. Isso é regra de negócio simples (comparação de CNAE, comparação de
data) e um agente aí só adicionaria custo, latência e não-determinismo onde
se quer previsibilidade total. Camada conversacional/agêntica só é aberta
depois do pipeline determinístico estar com todos os critérios de aceite
cumpridos — nunca em paralelo, nunca antes.

- **Servidor MCP sobre o domínio** — expor casos de uso já implementados
  (ex.: `verificarCompatibilidadeDeEdital`, `calcularProntidao`) como
  ferramentas MCP. Pré-requisito de infraestrutura para o item seguinte;
  não introduz agente por si só, só expõe o que já existe por outra porta.
- **Agente conversacional com LangGraph** — construído *sobre* o servidor
  MCP acima, numa camada nova `interfaces/agent/` (nunca dentro de `domain`
  ou `application`). Orquestra pergunta em linguagem natural do usuário
  ("quais editais tenho chance essa semana, considerando o que já venceu?")
  decidindo quais ferramentas/casos de uso chamar e em que ordem — o
  LangGraph decide *quais* consultas fazer, nunca recalcula *o resultado*
  de uma regra de negócio que o domínio já decide.
- **Classificação semântica do edital** — hoje a compatibilidade
  (SPEC-03) é decidida por CNAE; evolução candidata a usar o agente acima
  se a extração exigir múltiplos passos sobre texto de edital não
  padronizado (não é dado como certo que precise de LangGraph — se um
  simples embedding resolver, não se introduz agente só por preferência
  tecnológica)
- **Canais de notificação adicionais** — e-mail e Telegram, além do
  WhatsApp da SPEC-07, reduzindo dependência de um único canal
- **Multiempresa real (multi-tenant)** — hoje a fundação assume uma
  Empresa por instância (ver seção 6); suporte a múltiplas Empresas
  isoladas entre si é pré-requisito para vender a mais de um cliente na
  mesma instância

### 9.2 Evoluções de produto/domínio

- **Contexto de Diligência de Terceiro** — hoje o Tender avalia a própria
  Empresa (autoavaliação de habilitação); um contexto novo poderia avaliar
  a idoneidade de um fornecedor ou parceiro terceiro (cruzando TCU/PNCP),
  complementar ao `DossiêDeHabilitação` já modelado
- **Situação Fiscal Complementar** — situação cadastral do CNPJ e Dívida
  Ativa (PGFN) como dado adicional do dossiê de habilitação, além das
  certidões já previstas (ver discussão de área fiscal)
- **Múltiplos segmentos e regiões por Empresa** — a seção 6 fixa um
  segmento e uma região por decisão de escopo do MVP; evolução natural é
  permitir mais de um `Monitoramento` por Empresa (já previsto no agregado,
  só não priorizado)
- **Categorias de habilitação específicas por setor** — registro em
  conselho de classe, certificação setorial — além das quatro categorias
  genéricas da Lei 14.133/2021 já cobertas pelo `DossiêDeHabilitação`