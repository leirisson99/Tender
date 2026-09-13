# Plano Técnico — SPEC-{NUMERO}

Baseado em: `specify/specs/backend/SPEC-{NUMERO}-{slug}/spec.md`

## 1. Entidades e objetos de valor (camada `domain`)

| Nome | Tipo (entidade / objeto de valor / agregado) | Atributos | Invariantes que protege |
|---|---|---|---|
| | | | |

{Nenhum destes importa Prisma, Zod, Fastify ou qualquer lib externa — ver
constituição, princípio 3.}

## 2. Casos de uso (camada `application`)

| Caso de uso | Porta(s) que depende | Entrada | Saída | Erros de domínio possíveis |
|---|---|---|---|---|
| | | | | |

## 3. Portas / interfaces de repositório

{Definidas no `domain`, implementadas no `infrastructure`. Uma linha por porta.}

- `interface {Nome}Repositorio { ... }`

## 4. Endpoints HTTP (camada `interfaces/http`)

| Método | Rota | Schema Zod de entrada | Schema Zod de saída | Código de sucesso | Códigos de erro |
|---|---|---|---|---|---|
| | | | | | |

## 5. Alterações no schema Prisma

```prisma
// descrever apenas o novo model ou campo — não colar o schema inteiro
```

Migração: `{nome da migration a ser gerada}`

## 6. Estratégia de teste específica desta feature

- Domínio: {o que é testado sem I/O}
- Aplicação: {caso de uso x repositório fake}
- Infraestrutura: {teste de integração necessário, com Postgres real via Docker}
- HTTP: {cenários de `app.inject` — sucesso e cada erro mapeado}

## 7. Decisões e riscos

| Decisão | Alternativa considerada | Por que esta opção venceu |
|---|---|---|
| | | |

## 8. Definição de pronto (Definition of Done)

- [ ] Todos os critérios de aceite da SPEC-{NUMERO} cobertos por teste
- [ ] `npm run typecheck` sem erro
- [ ] `npm run test` verde
- [ ] Nenhum import de `infrastructure`/framework dentro de `domain` (regra de dependência da constituição)