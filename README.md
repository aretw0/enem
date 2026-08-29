# ENEM 2026 · vault de preparação fundamentada

Um ambiente local-first para transformar diagnóstico em plano, plano em prática e prática em
evidência de aprendizagem. O conteúdo público, o site e as automações vivem no mesmo repositório.

> Fundação materializada pelo gerador oficial do
> [vault-seed](https://github.com/aretw0/vault-seed), mantido no ecossistema do
> [refarm](https://github.com/aretw0/refarm). O inventário da materialização está em
> [`inventory.json`](inventory.json).

## Comece em 15 minutos

1. Abra [`Comece aqui`](00%20-%20Entrada/Comece%20aqui.md) e faça o diagnóstico mínimo.
2. No site, abra `/simulado/`, faça um bloco oficial e baixe o registro Markdown da tentativa.
3. Converta cada erro relevante com o [`Template - Erro de Questão`](90%20-%20Modelos/Template%20-%20Erro%20de%20Questão.md).
4. Acompanhe o ciclo em [`Plano ENEM 2026`](20%20-%20Projetos/Plano%20ENEM%202026.md).
5. Use a calculadora para médias ponderadas e metas, sem confundir o resultado com nota TRI.

## Arquitetura de informação

| Camada   | Pergunta respondida                                    | Pasta                 |
| -------- | ------------------------------------------------------ | --------------------- |
| Entrada  | O que faço agora?                                      | `00 - Entrada/`       |
| Projetos | Qual resultado estou perseguindo neste ciclo?          | `20 - Projetos/`      |
| Áreas    | O que precisa de cuidado contínuo?                     | `30 - Áreas/`         |
| Recursos | O que sei, com qual fonte e validade?                  | `40 - Recursos/ENEM/` |
| Arquivo  | O que saiu do ciclo atual, mas precisa ser preservado? | `50 - Arquivo/`       |
| Modelos  | Como começo um processo sem montar tudo do zero?       | `90 - Modelos/`       |
| Meta     | Como o vault funciona e evolui?                        | `99 - Meta e Anexos/` |

O diretório `content/` da primeira versão foi migrado para PARA. A navegação pública é orientada a
intenções — começar, planejar, estudar, praticar e revisar — e não reproduz a árvore interna.

## Fontes e banco de questões

- Fatos sobre a edição de 2026 partem de fontes oficiais e carregam data de verificação.
- Técnicas de estudo apontam para estudos ou revisões identificáveis; limitações fazem parte da nota.
- Questões entram em `data/questions/` somente com prova e gabarito oficiais capturados, dois
  checksums, páginas, ferramenta de extração e revisão explícita.
- O primeiro lote contém 10 itens verificados de Ciências da Natureza do Caderno 7 Azul de 2025.
- `pnpm run validate:enem` rejeita registros órfãos, checksums divergentes e dados anuais vencidos.
- PDFs brutos ficam no cache local; manifestos e recibos reproduzíveis ficam versionados.

## Blocos de SDK

`packages/enem-domain` é um pacote publicável consumido pelo próprio site. Ele fornece seleção por
seed, avaliação com confiança, exportação de tentativa para Markdown e validação de freshness anual.
Aquisição web, política binária e SHA-256 continuam vindo de `@refarm.dev/source-web`.

## Desenvolvimento

Requer Node.js 22+ e pnpm. Os comandos principais são:

```bash
pnpm install --frozen-lockfile
pnpm run validate:enem
pnpm test
pnpm run site:build
pnpm run site:check:simulator
```

Veja [`docs/PRODUCT.md`](docs/PRODUCT.md) para decisões, métricas e roadmap; e
[`docs/ECOSYSTEM-DEMANDS.md`](docs/ECOSYSTEM-DEMANDS.md) para os blocos que este consumidor exige de
`vault-seed` e `refarm`.
