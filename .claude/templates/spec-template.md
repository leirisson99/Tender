# SPEC-{NUMERO} — {NOME DA FEATURE}

Status: rascunho | aprovada | implementada
Depende de: {SPEC anterior, se houver}

## 1. Problema

{Uma ou duas frases: qual dor esta feature resolve, para quem, sem mencionar
como será implementada. Se não couber em duas frases, o escopo está grande
demais — divida em mais de uma SPEC.}

## 2. Linguagem ubíqua adicional

{Só preencha se esta feature introduzir termo novo que ainda não está no
glossário da SPEC-00. Formato: | Termo | Significado |. Se nenhum termo novo,
escreva "nenhum termo novo — usa apenas o glossário da SPEC-00".}

## 3. Comportamento esperado

{Descreva em cenários, não em código. Formato sugerido — Dado / Quando /
Então — um cenário por regra de negócio relevante. Cada cenário aqui deve
virar pelo menos um teste no plano técnico.}

- Dado {contexto}, quando {ação}, então {resultado esperado}
- Dado {contexto alternativo/erro}, quando {ação}, então {resultado esperado}

## 4. Critérios de aceite

- [ ] {critério verificável — testável objetivamente, não "funciona bem"}
- [ ] {critério verificável}
- [ ] Cobertura de teste cumpre a estratégia da constituição (domínio unitário
      puro, aplicação com repositório em memória, infraestrutura com
      integração real, HTTP via `app.inject`)

## 5. Fora de escopo

- {o que esta feature explicitamente não faz — para não crescer durante a implementação}

## 6. Dúvidas em aberto

{Perguntas que precisam de decisão antes do plano técnico ser escrito. Uma
SPEC pode ser aprovada com dúvida em aberto marcada como "assumido: X" desde
que a suposição fique registrada aqui.}