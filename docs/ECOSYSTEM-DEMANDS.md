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
| P0 | refarm | release pública de `@refarm.dev/quality-contract-v1` + `@refarm.dev/ds` | instalação congelada, export público do tema, notebooks e 64 jornadas responsivas sobre os tarballs candidatos |
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
- O exportador de notebooks materializado lê diretamente
  `node_modules/@refarm.dev/ds/src/themes/verde-jardim.css`, mas o payload não inclui esse pacote nem
  declara o handoff correspondente. `site:responsive` para antes do browser em um clone instalado;
  temas consumidos pelo exportador precisam vir no payload ou por uma release declarada. O ENEM
  corrigiu o consumo para o export público `@refarm.dev/ds/themes/verde-jardim.css` e mantém o
  tarball candidato apenas até a primeira publicação pública.

Esses pontos devem ser corrigidos no gerador/manifesto e cobertos por um `pnpm install
--frozen-lockfile` executado sobre o vault gerado, não apenas sobre fixtures mínimas.

## Prova de release puxada pelo ENEM — 29 de agosto de 2026

O ENEM consumiu o handoff `consumer-ready` produzido pelo Refarm no source SHA
`e2f8968c87b254543003dfec195754b438e018bd`, limitado à unidade mínima necessária:

- `@refarm.dev/quality-contract-v1@0.1.0`, SHA-256
  `c6738cb03d8c59facc54b2fd8d66649356f2ab5d7fa4bc12391f3debe6de2d48`;
- `@refarm.dev/ds@0.1.0`, SHA-256
  `0bbce56d5da5efe310543b88f84941c48d05ae733395ee29de191b4ded6eddaf`.

As provas executadas foram: verificação do manifesto e das cópias pelo próprio Refarm, instalação
pnpm com lockfile congelado, resolução do subpath público do tema, testes ENEM, validação de
conteúdo/proveniência, auditoria de IA e `site:responsive` em 16 páginas por quatro viewports com
hidratação externa verificada. No Refarm, os dois pacotes também passaram lint, type-check, 128
testes, build, publish dry-run e um consumidor temporário `pack → install → import`.

A unidade DS + quality está fechada e o plano de first publish resolve os dois pacotes na ordem
correta. A seleção completa `consumer-ready`, porém, deve continuar bloqueada: `health` ainda exige
`config`, e `vault-contract-v1` ainda exige `plugin-manifest`, `std` e `node-contract-v1`, quatro
pacotes ausentes da unidade pública. O gate do Refarm agora acusa esse fechamento antes de permitir
que o dry-run seja confundido com uma release instalável.

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
