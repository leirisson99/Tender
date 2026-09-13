# SPEC-01 — Cadastro de Empresa e Monitoramento

Status: rascunho
Depende de: SPEC-00 — Domínio e Arquitetura, SPEC-dominio — Modelo de Domínio

## 1. Problema

A Empresa precisa existir no sistema e declarar quais segmentos (CNAE) e
regiões quer acompanhar antes que qualquer Edital possa ser avaliado como
compatível com ela.

## 2. Linguagem ubíqua adicional

nenhum termo novo — usa o glossário da SPEC-00 (`Empresa`, `Segmento`,
`Monitoramento`) e o detalhamento de atributos/tipos já formalizado em
`SPEC-dominio/spec-dominio.md`, seção 1 (`Cnpj`, `Cnae`, `Regiao`) e
seção 3 (`Empresa`, `Monitoramento`).

## 3. Comportamento esperado

- Dado que nenhuma Empresa está cadastrada, quando o usuário cadastra uma
  Empresa com CNPJ válido (14 dígitos, dígito verificador correto) e razão
  social, então a Empresa é criada.
- Dado um CNPJ com dígito verificador inválido, quando o usuário tenta
  cadastrar a Empresa, então o cadastro é rejeitado com erro de validação,
  e nenhuma Empresa é criada.
- Dado que já existe uma Empresa cadastrada, quando o usuário tenta
  cadastrar uma segunda Empresa, então o cadastro é rejeitado — esta fase
  assume uma única Empresa por instância (SPEC-00, seção 6).
- Dado uma Empresa já cadastrada, quando o usuário configura um
  Monitoramento com um segmento (`Cnae`: código + descrição) e uma região
  (`Regiao`: UF obrigatória, município opcional) que a Empresa ainda não
  monitora, então o Monitoramento é adicionado à Empresa, ativo por padrão.
- Dado uma Empresa que já monitora um par (código de CNAE, UF, município),
  quando o usuário tenta configurar um Monitoramento para o mesmo par,
  então a operação é rejeitada — invariante do agregado `Empresa`
  (SPEC-00, seção 4; SPEC-dominio, seção 3). A comparação de duplicidade
  usa o código do CNAE e a UF/município, nunca o texto da descrição.
- Dado um código de CNAE fora do formato oficial (ex.: `4120-4/00`), quando
  o usuário tenta configurar um Monitoramento, então a operação é rejeitada
  com erro de validação, e nenhum Monitoramento é adicionado.
- Dado uma UF que não corresponde a nenhum dos 27 estados brasileiros mais o
  Distrito Federal, quando o usuário tenta configurar um Monitoramento,
  então a operação é rejeitada com erro de validação.

## 4. Critérios de aceite

- [ ] Empresa pode ser criada informando CNPJ (`Cnpj`) e razão social; CNPJ
      com dígito verificador inválido é rejeitado antes de qualquer
      persistência.
- [ ] No máximo uma Empresa existe na instância — uma segunda tentativa de
      cadastro é rejeitada com erro de domínio explícito (não um erro
      genérico de "já existe").
- [ ] Monitoramento (`Cnae` + `Regiao`) pode ser adicionado a uma Empresa
      existente, criado com `ativo = true`.
- [ ] Monitoramento cujo par (código do CNAE, UF, município) já existe na
      mesma Empresa é rejeitado (invariante de não-duplicidade) —
      diferença apenas na descrição do CNAE não conta como Monitoramento
      distinto.
- [ ] Código de CNAE fora do formato oficial e UF fora da lista de estados
      brasileiros válidos são rejeitados na configuração do Monitoramento.
- [ ] Cobertura de teste cumpre a estratégia da constituição (domínio
      unitário puro, aplicação com repositório em memória, infraestrutura
      com integração real, HTTP via `app.inject`).

## 5. Fora de escopo

- Autenticação e autorização de usuário — a fundação (SPEC-00, seção 6) não
  exige isso nesta fase.
- Edição, remoção ou pausa (`ativo = false`) de Empresa ou de Monitoramento
  já cadastrados — esta SPEC cobre apenas criação; `ativo` nasce sempre
  `true`.
- Ingestão real de Edital do PNCP e cálculo de compatibilidade — isso é
  SPEC-02 e SPEC-03; aqui o Monitoramento só é armazenado, não consumido.
- Restringir o cadastro a um único CNAE ou a uma única UF fixa — o modelo
  de domínio (SPEC-dominio, seção 3) trata `Cnae` e `Regiao` como valores
  livres informados pelo usuário; qualquer recorte de escopo (ex.: só UF
  "SC") é filtro da fonte externa na SPEC-02, não uma restrição deste
  cadastro.
- Múltiplas Empresas isoladas entre si (multi-tenant real) — fora de escopo
  do MVP (SPEC-00, seção 9.1).
- Definição de quais endpoints HTTP existem e seu formato de request/response
  — fica para o `/plan` desta SPEC.

## 6. Dúvidas em aberto

nenhuma — as três dúvidas da versão anterior desta SPEC (campos mínimos de
Empresa, alcance da restrição de segmento/região fixos, formato de
"região") foram respondidas por `SPEC-dominio/spec-dominio.md`, seções 1 e
3, e incorporadas às seções 3, 4 e 5 acima.
