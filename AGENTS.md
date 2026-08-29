# Instruções para agentes — ENEM

Este repositório é um produto educacional e um vault local-first. Preserve a compatibilidade com
Obsidian, Markdown puro, Astro e as primitivas materializadas do vault-seed.

## Regra epistemológica

- Não invente datas, regras, pesos, notas de corte, questões, gabaritos ou alegações pedagógicas.
- Para fatos anuais, prefira fonte oficial (Inep, MEC, instituição) e registre `verified`.
- Para técnicas de estudo, cite artigo, revisão ou instituição responsável e registre limites.
- Diferencie fato da fonte, inferência editorial e exemplo hipotético.
- Uma questão só entra em `data/questions/` com `sourceId`, edição, prova, número e gabarito verificável.

## Jornada do estudante

Toda mudança pública deve melhorar pelo menos uma destas intenções: começar, planejar, estudar,
praticar ou revisar. Uma descrição de técnica sem um próximo passo executável está incompleta.

## Estrutura PARA

- `00 - Entrada/`: recepção e captura ainda não curada.
- `20 - Projetos/`: ciclos com resultado e prazo, como o plano ENEM 2026.
- `30 - Áreas/`: responsabilidades contínuas, como redação e saúde do estudo.
- `40 - Recursos/ENEM/`: conhecimento durável, fontes e métodos.
- `50 - Arquivo/`: material histórico ou fora do ciclo.
- `90 - Modelos/`: inícios rápidos para processos recorrentes.
- `99 - Meta e Anexos/`: operação do vault, nunca conteúdo pedagógico principal.

Use wikilinks `[[nome exato]]` e frontmatter YAML. Notas públicas têm `status: published`; trabalho em
curadoria fica `draft`.

## Ecossistema

Antes de criar infraestrutura, procure uma primitiva em `vault-seed`, `coop-vault` e `refarm`.
Quando faltar, documente a demanda em `docs/ECOSYSTEM-DEMANDS.md`, com contrato esperado e prova do
consumidor. Código local de domínio ENEM é permitido; reimplementar projeção, records, quality,
surface, fonte web ou design system não é.

## Verificação

Rode o menor gate relevante e, antes da entrega, pelo menos:

```bash
pnpm run validate:enem
pnpm test
pnpm run audit:ia
git diff --check
```
