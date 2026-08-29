# Demandas do consumidor ENEM ao ecossistema

Este arquivo evita que necessidades genéricas virem implementações privadas neste repositório.

## Baseline consumido

O checkout foi materializado em 28 de agosto de 2026 pelo gerador
`refarm/generators/vault-seed/generate.mjs`, usando o manifesto v1 e o checkout local de
`vault-seed`. O `inventory.json` mantém a origem arquivo a arquivo.

Já consumimos do payload: Astro/Starlight, publicação, exploração em grafo, Obsidian/Foam, modelos,
auditoria de arquitetura de informação, Lab, RSS, frontmatter e scripts de qualidade.

## Demandas que devem virar release

| Prioridade | Dono | Bloco esperado | Prova que o ENEM fornecerá |
|---|---|---|---|
| P0 | vault-seed | perfil de produto que exclua a documentação operacional da superfície pública | build sem rotas meta e teste de navegação estudantil |
| P0 | refarm | release pública de `source-web` com driver binário HTTP seguro e sessão anônima | prova e gabarito oficiais viram snapshots reproduzíveis sem adaptador de transporte privado |
| P0 | refarm | records para itens de avaliação e relações item→habilidade→fonte | fixture ENEM validada sem extensão privada do envelope |
| P1 | vault-seed | componente de calculadora/formulário acessível no DS Astro | calculadora de média sem CSS/JS duplicado |
| P1 | refarm | fila de revisão derivada de eventos, agnóstica ao algoritmo | erros do estudante geram agenda exportável |
| P1 | refarm | dataset lineage para extração de PDF/OCR com revisão humana | cada questão aponta para página, extrator e revisão |
| P2 | vault-seed | navegação por jornada como profile configurável | intenções do ENEM sem alterar testes internos do template |

## Defeitos observados na materialização

- O `package.json` gerado externaliza `@aretw0/dgk-astro-plugins`, mas o lockfile materializado ainda
  registra `workspace:^`. A versão 0.2.0 baixada do registry declara `./dist/index.js` em `exports`,
  porém o tarball publicado não contém `dist/`; o build do consumidor falhou. Como o payload já traz
  `packages/astro-plugins`, este vault voltou temporariamente a `workspace:^` até uma release íntegra.
- O `pnpm-workspace.yaml` materializado preservava overrides para tarballs `vendor/@refarm.dev`, mas
  o manifesto exclui `vendor/` do payload. A instalação congelada falhou antes que o consumidor
  removesse overrides sem dependentes.
- Testes de desenvolvimento do template com extensão `.mjs` atravessam o boundary e referenciam
  documentos `docs/convergencia-*` corretamente excluídos. O gate padrão deste produto foi limitado
  aos testes ENEM; o conjunto legado segue acessível em `test:vault-seed-payload` como prova do gap.
- O `astro.config.mjs` importa `@astrojs/markdown-remark` diretamente, mas o package template não o
  declara. Além disso, tenta obter `unified` desse pacote, que não exporta esse nome. Com resolução
  estrita do pnpm o config não carrega; o consumidor declarou ambos os pacotes e corrigiu a origem de
  `unified`.
- O fallback opcional de `records-contract-v1` usava `import()` com literal. O Rollup tentou resolver
  o pacote excluído e interrompeu o build antes do `catch`; o consumidor marcou o specifier como
  opcional também para o bundler (`@vite-ignore`).
- O loader de `vault.config.json` resolvia a raiz apenas por `import.meta.url`. Depois do bundle, a
  URL aponta para o chunk em `dist`, a configuração virava `{}` e as pastas públicas ficavam vazias.
  O consumidor passou a preferir o diretório de trabalho quando ele contém o manifesto.

Esses pontos devem ser corrigidos no gerador/manifesto e cobertos por um `pnpm install
--frozen-lockfile` executado sobre o vault gerado, não apenas sobre fixtures mínimas.

## Seam local temporário

A aquisição oficial consome `downloadAttachment` do handoff `@refarm.dev/source-web@0.1.0`: política
de tipo/tamanho e SHA-256 permanecem no refarm. Enquanto não há release no registry, os dois
tarballs estritamente necessários (`source-web` e `source-contract-v1`) são importados do handoff
do `vault-seed`, com versão fixa. O consumidor ainda precisa manter cerca de uma chamada HTTPS
específica porque o pacote injeta `BinaryFetchDriver`, mas não fornece uma implementação HTTP; o
contrato de sessão também só modela `fixture` ou `authenticated`, não uma fonte pública anônima.
O teste de aquisição e os recibos deste vault são a prova de consumo para essas releases.

A calculadora de média ponderada vive em `.site/lib/enem-score.mjs` porque a fórmula e os rótulos são
domínio do produto. O formulário Astro é temporário: quando o DS oferecer a primitiva acessível, o
ENEM deve manter apenas configuração e funções de domínio.

A troca de `VAULT_FOLDERS` por `PUBLISHED_VAULT_FOLDERS` na coleta do site é uma adoção de seam já
exportada pelo vault-seed, não uma nova política local. Ela demonstra a demanda P0 acima.
