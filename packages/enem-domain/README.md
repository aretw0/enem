# `@aretw0/enem-domain`

Primitivas puras usadas pelo site e pelos gates do ENEM vault. O pacote não contém questões, não
faz I/O, não estima TRI e não impõe um calendário universal de revisão.

## Exports

- `@aretw0/enem-domain/simulator`: seleção reproduzível por seed, balanceamento entre grupos,
  avaliação com confiança e serialização de uma tentativa para Markdown;
- `@aretw0/enem-domain/annual`: valida edição, prazo de revisão, datas e referências a fontes
  oficiais de um dataset anual.

O repositório raiz é o consumidor de referência. `pnpm test` prova os contratos e o smoke do
simulador prova o uso no navegador. A versão começa em `0.1.0` para permitir handoff ou publicação
sem acoplar clientes à estrutura interna do site Astro.
