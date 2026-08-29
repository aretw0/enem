# Produto ENEM 2026

## Resultado do produto

O vault reduz a distância entre “quero estudar” e uma sessão produtiva, acumulando os resultados
dessas sessões num sistema auditável. O site é a porta pública; Markdown é a fonte soberana.

## Loop principal

```text
diagnóstico → plano semanal → estudo com recuperação → questões → análise de erro
      ↑                                                        ↓
      └──────────── revisão das métricas e replanejamento ─────┘
```

## Arquitetura de conteúdo

| Objeto           | Onde vive                     | Critério de pronto                             |
| ---------------- | ----------------------------- | ---------------------------------------------- |
| Jornada          | `00 - Entrada/`               | termina numa ação de até 15 minutos            |
| Plano            | `20 - Projetos/`              | meta, prazo, capacidade e revisão definidos    |
| Método           | `40 - Recursos/ENEM/Métodos/` | evidência, procedimento e limite explícitos    |
| Fundamento anual | `40 - Recursos/ENEM/2026/`    | fonte oficial e data de verificação            |
| Questão          | `data/questions/`             | proveniência e gabarito passam no gate         |
| Aquisição        | `data/acquisitions/`          | manifesto, TLS verificado, recibo e SHA-256    |
| Fonte            | `data/sources.json`           | URL, tipo, autoridade e acesso registrados     |
| SDK de domínio   | `packages/enem-domain/`       | pacote puro, empacotável e consumido pelo site |
| Operação         | `99 - Meta e Anexos/`         | não disputa atenção com a jornada do estudante |

## Métricas úteis

- tempo até a primeira sessão registrada;
- questões respondidas e revisadas, por habilidade;
- taxa de acerto nova versus taxa após revisão espaçada;
- distribuição das causas de erro;
- aderência semanal ao plano possível, não ao plano idealizado;
- redações produzidas, corrigidas e reescritas.

Horas estudadas isoladamente não medem aprendizagem. Nota de simulado sem contexto de prova e método
de correção também não deve ser usada como série comparável.

## Roadmap orientado a fatias

| Fatia                     | Estado em 29/08/2026                       | Próxima prova de valor                                        |
| ------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| Fundação e primeiro ciclo | entregue                                   | observar tempo até a primeira sessão                          |
| Banco oficial             | 20 itens: Natureza e Matemática de 2025    | cobrir Linguagens e Humanas com a mesma revisão               |
| Simulados                 | blocos por área ou mistos equilibrados     | classificar habilidades antes de alegar balanço por matriz    |
| Revisão                   | Markdown e fila local de retomada entregues | permitir ao estudante escolher e registrar seus intervalos    |
| Planejamento por curso    | não iniciado                               | schema de pesos com edital, campus, turno e modalidade        |
| Atualização anual         | gate e endpoint 2026 entregues             | snapshot e promoção da edição 2027                            |

## Fora de escopo por enquanto

- estimar nota TRI a partir de quantidade de acertos;
- publicar nota de corte sem instituição, modalidade, chamada e fonte;
- gerar questões “estilo ENEM” sem proveniência e revisão humana;
- prescrever uma rotina universal sem diagnóstico de disponibilidade e desempenho.
