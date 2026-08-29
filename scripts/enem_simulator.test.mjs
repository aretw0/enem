import assert from 'node:assert/strict';
import test from 'node:test';
import {
  attemptToMarkdown,
  evaluateAttempt,
  selectBalancedQuestions,
  selectQuestions,
} from '@aretw0/enem-domain/simulator';

const questions = Array.from({ length: 10 }, (_, index) => ({
  id: `q${index + 1}`,
  item: index + 1,
  answer: index % 2 ? 'B' : 'A',
}));

test('seleção é reproduzível pela seed e não altera o banco', () => {
  const first = selectQuestions(questions, { seed: 'bloco-1', size: 5 });
  const repeated = selectQuestions(questions, { seed: 'bloco-1', size: 5 });
  assert.deepEqual(first, repeated);
  assert.equal(new Set(first.map((question) => question.id)).size, 5);
  assert.deepEqual(questions.map((question) => question.id), Array.from({ length: 10 }, (_, index) => `q${index + 1}`));
});

test('seleção balanceada intercala os grupos disponíveis de forma reproduzível', () => {
  const grouped = Array.from({ length: 20 }, (_, index) => ({
    id: `grouped-${index}`,
    area: index < 10 ? 'natureza' : 'matematica',
  }));
  const first = selectBalancedQuestions(grouped, { seed: 'misto-1', size: 5 });
  const repeated = selectBalancedQuestions(grouped, { seed: 'misto-1', size: 5 });
  const counts = Object.groupBy(first, (question) => question.area);
  assert.deepEqual(first, repeated);
  assert.deepEqual(
    Object.values(counts).map((group) => group.length).sort(),
    [2, 3],
  );
  assert.notEqual(first[0].area, first[1].area);
});

test('seleção balanceada reaproveita vagas quando um grupo se esgota', () => {
  const grouped = [
    { id: 'natureza-1', area: 'natureza' },
    ...Array.from({ length: 5 }, (_, index) => ({ id: `matematica-${index}`, area: 'matematica' })),
  ];
  const selected = selectBalancedQuestions(grouped, { seed: 'misto-curto', size: 5 });
  assert.equal(selected.length, 5);
  assert.equal(new Set(selected.map((question) => question.id)).size, 5);
  assert.equal(selected.filter((question) => question.area === 'natureza').length, 1);
});

test('avalia erro, omissão e acerto de baixa confiança separadamente', () => {
  const result = evaluateAttempt(questions.slice(0, 3), {
    q1: { answer: 'A', confidence: 'low' },
    q2: { answer: 'A', confidence: 'high' },
  });
  assert.deepEqual(
    { total: result.total, correct: result.correct, incorrect: result.incorrect, unanswered: result.unanswered, fragile: result.fragile },
    { total: 3, correct: 1, incorrect: 1, unanswered: 1, fragile: 1 },
  );
});

test('exporta registro Markdown com resultado, confiança e fonte', () => {
  const selected = [{
    id: 'q1', item: 92, answer: 'D', sourceUrl: 'https://download.inep.gov.br/prova.pdf', sourcePage: 2,
  }];
  const attempt = evaluateAttempt(selected, { q1: { answer: 'A', confidence: 'low' } });
  const markdown = attemptToMarkdown({
    attempt, questions: selected, seed: 'bloco-1', date: '2026-08-29', elapsedMinutes: 12,
  });
  assert.match(markdown, /Resultado bruto: 0\/1/);
  assert.match(markdown, /\| 92 \| A \| D \| baixa \| erro \| \[PDF p\. 2\]/);
  assert.match(markdown, /Primeira decisão incorreta ou raciocínio frágil/);
});
