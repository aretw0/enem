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

| Objeto | Onde vive | Critério de pronto |
|---|---|---|
| Jornada | `00 - Entrada/` | termina numa ação de até 15 minutos |
| Plano | `20 - Projetos/` | meta, prazo, capacidade e revisão definidos |
| Método | `40 - Recursos/ENEM/Métodos/` | evidência, procedimento e limite explícitos |
| Fundamento anual | `40 - Recursos/ENEM/2026/` | fonte oficial e data de verificação |
| Questão | `data/questions/` | proveniência e gabarito passam no gate |
| Fonte | `data/sources.json` | URL, tipo, autoridade e acesso registrados |
| Operação | `99 - Meta e Anexos/` | não disputa atenção com a jornada do estudante |

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

1. **Fundação e primeiro ciclo:** site, calculadora, onboarding, modelos, fontes e gate de questões.
2. **Banco oficial:** importador reprodutível das provas e gabaritos públicos do Inep.
3. **Simulados:** seleção por matriz, dificuldade observada e histórico, sem fabricar itens.
4. **Revisão:** fila derivada do registro de erros e dos intervalos escolhidos pelo estudante.
5. **Planejamento por curso:** pesos versionados por instituição, campus, turno e processo seletivo.
6. **Atualização anual:** snapshot da edição anterior e promoção da nova configuração após auditoria.

## Fora de escopo por enquanto

- estimar nota TRI a partir de quantidade de acertos;
- publicar nota de corte sem instituição, modalidade, chamada e fonte;
- gerar questões “estilo ENEM” sem proveniência e revisão humana;
- prescrever uma rotina universal sem diagnóstico de disponibilidade e desempenho.
