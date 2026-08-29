# Banco de questões

O diretório começa sem questões para manter uma fronteira honesta: schema não é acervo.

Cada arquivo JSON contém um array de registros compatíveis com `../schema/question.schema.json`.
Antes de entrar aqui, prova e gabarito oficiais devem ser capturados com checksum; a extração precisa
preservar arquivo e página; e o gabarito deve passar por revisão. Rode `pnpm run validate:enem`.

Questões geradas ou parafraseadas não podem se apresentar como itens oficiais. Quando o produto
adotar itens autorais, eles terão outro schema, licença, autoria e fluxo de revisão.
