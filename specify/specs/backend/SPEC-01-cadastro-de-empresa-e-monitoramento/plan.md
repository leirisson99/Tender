# Plano Técnico — SPEC-01

Baseado em: `specify/specs/backend/SPEC-01-cadastro-de-empresa-e-monitoramento/spec.md`

## 1. Entidades e objetos de valor (camada `domain`)

| Nome | Tipo (entidade / objeto de valor / agregado) | Atributos | Invariantes que protege |
|---|---|---|---|
| `Cnpj` | objeto de valor | `numero: string` (14 dígitos, sem pontuação) | dígito verificador válido; `Cnpj.criar(bruto: string)` normaliza (remove pontuação) e lança `CnpjInvalidoError` se o dígito verificador falhar |
| `Cnae` | objeto de valor | `codigo: string`, `descricao: string` | `codigo` no formato oficial (`\d{4}-\d\/\d{2}`, ex.: `4120-4/00`); `Cnae.criar(...)` lança `CnaeInvalidoError` caso contrário |
| `Regiao` | objeto de valor | `uf: string` (2 letras), `municipio: string \| null` | `uf` precisa estar entre as 27 siglas de estado + DF; `Regiao.criar(...)` lança `RegiaoInvalidaError` caso contrário |
| `Empresa` | agregado (raiz) | `id: EmpresaId`, `cnpj: Cnpj`, `razaoSocial: string`, `monitoramentos: Monitoramento[]` | `Empresa.criar(cnpj, razaoSocial)` gera `id` novo; `adicionarMonitoramento(segmento, regiao)` lança `MonitoramentoDuplicadoError` se já existir um `Monitoramento` com o mesmo `(segmento.codigo, regiao.uf, regiao.municipio)` |
| `Monitoramento` | entidade filha (dentro de `Empresa`) | `id: MonitoramentoId`, `segmento: Cnae`, `regiao: Regiao`, `ativo: boolean` | só é criado por `Empresa.adicionarMonitoramento`, sempre com `ativo = true`; nunca instanciado fora do agregado |

`EmpresaId` e `MonitoramentoId` são aliases de `string` (UUID), gerados com
`crypto.randomUUID()` — módulo nativo do Node, não pacote externo (ver
seção 7). Nenhum destes importa Prisma, Zod, Fastify ou qualquer lib
externa — ver constituição, princípio 3.

**Erros de domínio novos:** `CnpjInvalidoError`, `CnaeInvalidoError`,
`RegiaoInvalidaError`, `MonitoramentoDuplicadoError` — todos em
`domain/erros/`, sem depender de código HTTP (a tradução para status HTTP
acontece só em `interfaces/http`).

## 2. Casos de uso (camada `application`)

| Caso de uso | Porta(s) que depende | Entrada | Saída | Erros de domínio possíveis |
|---|---|---|---|---|
| `CadastrarEmpresa` | `EmpresaRepositorio` | `{ cnpj: string, razaoSocial: string }` | `Empresa` criada | `CnpjInvalidoError`, `InstanciaJaPossuiEmpresaError` |
| `ConfigurarMonitoramento` | `EmpresaRepositorio` | `{ cnae: { codigo: string, descricao: string }, regiao: { uf: string, municipio?: string } }` | `Monitoramento` criado | `CnaeInvalidoError`, `RegiaoInvalidaError`, `EmpresaNaoEncontradaError`, `MonitoramentoDuplicadoError` |

`CadastrarEmpresa`: chama `repositorio.existeEmpresaCadastrada()` primeiro —
se `true`, lança `InstanciaJaPossuiEmpresaError` sem tentar validar o CNPJ.
Só então constrói `Cnpj` e `Empresa`, e persiste via `repositorio.salvar`.

`ConfigurarMonitoramento`: não recebe `empresaId` (ver decisão na seção 7).
Busca a Empresa via `repositorio.buscarEmpresaUnica()`; se `null`, lança
`EmpresaNaoEncontradaError`. Constrói `Cnae` e `Regiao`, chama
`empresa.adicionarMonitoramento(...)` e persiste a Empresa atualizada via
`repositorio.salvar`.

`InstanciaJaPossuiEmpresaError` e `EmpresaNaoEncontradaError` são erros de
aplicação (dependem de estado de persistência), não de domínio puro —
ficam em `application/erros/`.

## 3. Portas / interfaces de repositório

- `interface EmpresaRepositorio { existeEmpresaCadastrada(): Promise<boolean>; buscarEmpresaUnica(): Promise<Empresa | null>; salvar(empresa: Empresa): Promise<void>; }`

Implementada em `infrastructure/repositorios/EmpresaRepositorioPrisma.ts`.

## 4. Endpoints HTTP (camada `interfaces/http`)

| Método | Rota | Schema Zod de entrada | Schema Zod de saída | Código de sucesso | Códigos de erro |
|---|---|---|---|---|---|
| POST | `/empresa` | `{ cnpj: string, razaoSocial: string }` | `{ id: string, cnpj: string, razaoSocial: string }` | 201 | 400 (Zod / `CnpjInvalidoError`), 409 (`InstanciaJaPossuiEmpresaError`) |
| POST | `/empresa/monitoramentos` | `{ cnae: { codigo: string, descricao: string }, regiao: { uf: string, municipio: string \| undefined } }` | `{ id: string, cnae: {...}, regiao: {...}, ativo: boolean }` | 201 | 400 (Zod / `CnaeInvalidoError` / `RegiaoInvalidaError`), 404 (`EmpresaNaoEncontradaError`), 409 (`MonitoramentoDuplicadoError`) |

Rotas no singular (`/empresa`, não `/empresas`) — ver decisão na seção 7.

## 5. Alterações no schema Prisma

```prisma
model Empresa {
  id             String          @id @default(uuid())
  cnpj           String          @unique
  razaoSocial    String
  monitoramentos Monitoramento[]
}

model Monitoramento {
  id                String  @id @default(uuid())
  empresaId         String
  empresa           Empresa @relation(fields: [empresaId], references: [id])
  segmentoCodigo    String
  segmentoDescricao String
  uf                String
  municipio         String?
  ativo             Boolean @default(true)

  @@unique([empresaId, segmentoCodigo, uf, municipio])
}
```

Migração: `criar_empresa_e_monitoramento`

`@@unique` é defesa em profundidade, não a fonte de verdade da invariante
de duplicidade — ver risco na seção 7 (Postgres não bloqueia duas linhas
com `municipio = null` no mesmo índice único).

## 6. Estratégia de teste específica desta feature

- **Domínio** (sem I/O):
  - `Cnpj.criar` aceita 14 dígitos com dígito verificador correto; rejeita dígito verificador inválido (cenário 2 da SPEC).
  - `Cnae.criar` aceita formato oficial; rejeita formato inválido (cenário 6).
  - `Regiao.criar` aceita UF válida (27 estados + DF); rejeita UF inválida (cenário 7).
  - `Empresa.criar` gera Empresa com `monitoramentos: []` (cenário 1).
  - `Empresa.adicionarMonitoramento` adiciona quando não há duplicata (cenário 4); lança `MonitoramentoDuplicadoError` quando já existe o mesmo `(codigo, uf, municipio)`, mesmo com `descricao` diferente (cenário 5).
- **Aplicação** (caso de uso x `EmpresaRepositorio` fake em memória):
  - `CadastrarEmpresa` com repositório vazio → sucesso, chama `salvar` (cenário 1).
  - `CadastrarEmpresa` com CNPJ inválido → lança `CnpjInvalidoError`, nunca chama `salvar` (cenário 2).
  - `CadastrarEmpresa` com `existeEmpresaCadastrada() = true` → lança `InstanciaJaPossuiEmpresaError`, nunca chama `salvar` (cenário 3).
  - `ConfigurarMonitoramento` com Empresa existente sem o par (CNAE, região) → sucesso (cenário 4).
  - `ConfigurarMonitoramento` com Empresa existente já com o par → lança `MonitoramentoDuplicadoError` (cenário 5).
  - `ConfigurarMonitoramento` com `buscarEmpresaUnica() = null` → lança `EmpresaNaoEncontradaError`.
- **Infraestrutura** (Postgres real via `docker-compose.yml`):
  - `EmpresaRepositorioPrisma.salvar` + `buscarEmpresaUnica` round-trip preserva `cnpj`, `razaoSocial` e a lista de `monitoramentos`.
  - `existeEmpresaCadastrada` retorna `true` depois de uma Empresa salva.
  - Confirma que o `@@unique` do Prisma NÃO impede duas linhas com `municipio = null` e mesmo `(empresaId, segmentoCodigo, uf)` — documenta a limitação testando que só a checagem em `application`/`domain` barra esse caso.
- **HTTP** (`app.inject`):
  - `POST /empresa`: 201 no caminho feliz; 400 com CNPJ inválido; 409 na segunda tentativa de cadastro.
  - `POST /empresa/monitoramentos`: 201 no caminho feliz; 400 com CNAE ou UF inválidos; 404 sem Empresa cadastrada; 409 em Monitoramento duplicado.

## 7. Decisões e riscos

| Decisão | Alternativa considerada | Por que esta opção venceu |
|---|---|---|
| `ConfigurarMonitoramento` não recebe `empresaId` — opera sempre sobre a única Empresa da instância | Receber `empresaId` explícito no caso de uso e na rota | Reflete a restrição de single-tenant já assumida (SPEC-00, seção 6); quando multi-tenant chegar (SPEC-00, seção 9.1) o caso de uso precisará ganhar o parâmetro — dívida aceita e documentada aqui, não escondida |
| Geração de `EmpresaId`/`MonitoramentoId` com `crypto.randomUUID()` direto no `domain` | Injetar gerador de ID via porta (`GeradorDeId`) | `crypto` é módulo nativo do runtime Node, não pacote externo instalado via npm — não fere o princípio 3 (domínio isolado); criar uma porta só para isso seria complexidade sem benefício nesta escala |
| Invariante de duplicidade de `Monitoramento` garantida em `Empresa.adicionarMonitoramento` (domínio), com `@@unique` do Prisma como reforço | Confiar apenas no índice único do banco | Postgres trata `NULL` como valor distinto em índice único — dois `Monitoramento` com `municipio = null` e mesmo `(codigo, uf)` não seriam barrados só pelo banco; o domínio precisa ser a fonte de verdade da regra |
| Rotas HTTP no singular (`/empresa`, `/empresa/monitoramentos`) | Plural (`/empresas`) | Só existe uma Empresa por instância nesta fase (SPEC-00, seção 6) — plural sugeriria uma coleção que não existe |

## 8. Definição de pronto (Definition of Done)

- [ ] Todos os critérios de aceite da SPEC-01 cobertos por teste
- [ ] `npm run typecheck` sem erro
- [ ] `npm run test` verde
- [ ] Nenhum import de `infrastructure`/framework dentro de `domain` (regra de dependência da constituição)
