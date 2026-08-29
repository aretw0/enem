function seedHash(seed) {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = seedHash(seed) || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function selectQuestions(questions, { seed, size }) {
  if (!Array.isArray(questions)) throw new TypeError('questions deve ser um array');
  if (!Number.isInteger(size) || size < 1) throw new RangeError('size deve ser um inteiro positivo');
  const random = seededRandom(seed);
  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled.slice(0, Math.min(size, shuffled.length));
}

export function selectBalancedQuestions(questions, { seed, size, groupBy = 'area' }) {
  if (!Array.isArray(questions)) throw new TypeError('questions deve ser um array');
  if (!Number.isInteger(size) || size < 1) throw new RangeError('size deve ser um inteiro positivo');
  const readGroup = typeof groupBy === 'function' ? groupBy : (question) => question?.[groupBy];
  const groups = new Map();
  for (const question of questions) {
    const group = readGroup(question);
    if (group === undefined || group === null || group === '') {
      throw new TypeError('toda questão deve pertencer a um grupo');
    }
    const key = String(group);
    groups.set(key, [...(groups.get(key) ?? []), question]);
  }

  const orderedGroups = selectQuestions(
    [...groups.entries()].sort(([first], [second]) => first.localeCompare(second)),
    { seed: `${seed}:grupos`, size: groups.size },
  ).map(([group, items]) => ({
    group,
    items: selectQuestions(items, { seed: `${seed}:${group}`, size: items.length }),
    cursor: 0,
  }));

  const selected = [];
  const limit = Math.min(size, questions.length);
  while (selected.length < limit) {
    let advanced = false;
    for (const group of orderedGroups) {
      if (selected.length === limit) break;
      if (group.cursor < group.items.length) {
        selected.push(group.items[group.cursor]);
        group.cursor++;
        advanced = true;
      }
    }
    if (!advanced) break;
  }
  return selected;
}

export function evaluateAttempt(questions, responses) {
  const items = questions.map((question) => {
    const response = responses?.[question.id] ?? {};
    const selected = response.answer ?? null;
    const confidence = ['low', 'medium', 'high'].includes(response.confidence) ? response.confidence : null;
    const correct = selected === question.answer;
    return {
      id: question.id,
      item: question.item,
      selected,
      answer: question.answer,
      confidence,
      correct,
      unanswered: selected === null,
      fragile: correct && confidence === 'low',
    };
  });
  return {
    items,
    total: items.length,
    correct: items.filter((item) => item.correct).length,
    incorrect: items.filter((item) => !item.correct && !item.unanswered).length,
    unanswered: items.filter((item) => item.unanswered).length,
    fragile: items.filter((item) => item.fragile).length,
  };
}

function reviewReason(item) {
  if (item.unanswered) return 'em branco';
  if (!item.correct) return 'erro';
  if (item.fragile) return 'acerto de baixa confiança';
  return null;
}

export function updateReviewQueue(queue, attempt, questions, { at }) {
  if (!Array.isArray(queue) || !Array.isArray(attempt?.items) || !Array.isArray(questions)) {
    throw new TypeError('fila, tentativa e questões devem ser válidas');
  }
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const next = new Map(queue.map((entry) => [entry.id, entry]));
  for (const item of attempt.items) {
    const reason = reviewReason(item);
    if (!reason) {
      next.delete(item.id);
      continue;
    }
    const question = questionById.get(item.id) ?? {};
    const previous = next.get(item.id);
    next.set(item.id, {
      id: item.id,
      item: item.item,
      area: question.area ?? previous?.area ?? null,
      reason,
      sourceUrl: question.sourceUrl ?? previous?.sourceUrl ?? null,
      sourcePage: question.sourcePage ?? previous?.sourcePage ?? null,
      flaggedAt: previous?.flaggedAt ?? at,
      lastAttemptAt: at,
      attemptCount: (previous?.attemptCount ?? 0) + 1,
    });
  }
  return [...next.values()].sort((first, second) =>
    String(second.lastAttemptAt).localeCompare(String(first.lastAttemptAt)) || first.item - second.item);
}

function markdownCell(value) {
  return String(value ?? '—').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function statusFor(item) {
  if (item.unanswered) return 'em branco';
  if (!item.correct) return 'erro';
  if (item.fragile) return 'acerto frágil';
  return 'acerto';
}

const CONFIDENCE_LABELS = { low: 'baixa', medium: 'média', high: 'alta' };

export function attemptToMarkdown({ attempt, questions, seed, date, elapsedMinutes }) {
  if (!attempt?.items || !Array.isArray(questions)) throw new TypeError('tentativa inválida');
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const focus = attempt.items.filter((item) => !item.correct || item.fragile);
  const safeSeed = String(seed).replaceAll('\n', ' ').replaceAll(':', '-');
  const lines = [
    '---',
    `title: Sessão ENEM — ${date} — ${safeSeed}`,
    `created: "${date}"`,
    'tags:',
    '  - enem/sessao',
    '  - enem/questoes',
    'status: draft',
    'category: workflow',
    'audience: pessoal',
    '---',
    '',
    `# Sessão ENEM — ${date}`,
    '',
    `- Bloco reproduzível: \`${safeSeed}\``,
    `- Tempo nesta tela: ${elapsedMinutes} min`,
    `- Resultado bruto: ${attempt.correct}/${attempt.total}`,
    `- Erros: ${attempt.incorrect}; em branco: ${attempt.unanswered}; acertos frágeis: ${attempt.fragile}`,
    '- Condições e interrupções:',
    '',
    '## Respostas',
    '',
    '| Questão | Minha resposta | Gabarito | Confiança | Estado | Fonte |',
    '|---:|:---:|:---:|---|---|---|',
    ...attempt.items.map((item) => {
      const question = questionById.get(item.id) ?? {};
      const source = question.sourceUrl
        ? `[PDF p. ${question.sourcePage}](${question.sourceUrl})`
        : `${question.sourceFile ?? 'fonte não informada'} p. ${question.sourcePage ?? '—'}`;
      return `| ${markdownCell(item.item)} | ${markdownCell(item.selected)} | ${markdownCell(item.answer)} | ${markdownCell(CONFIDENCE_LABELS[item.confidence] ?? 'não informada')} | ${markdownCell(statusFor(item))} | ${markdownCell(source)} |`;
    }),
    '',
    '## Foco da correção',
    '',
    ...(focus.length
      ? focus.flatMap((item) => [
          `### Questão ${item.item} — ${statusFor(item)}`,
          '',
          '- Causa principal:',
          '- Primeira decisão incorreta ou raciocínio frágil:',
          '- Correção em minhas palavras:',
          '- Nova tentativa sem consulta:',
          '- Questão análoga:',
          '- Próxima recuperação:',
          '',
        ])
      : ['Nenhum erro ou acerto de baixa confiança neste bloco.', '']),
    '## Próxima ação',
    '',
    '- [ ] Corrigir com fonte confiável',
    '- [ ] Refazer sem consulta',
    '- [ ] Agendar uma questão análoga',
    '',
  ];
  return lines.join('\n');
}
