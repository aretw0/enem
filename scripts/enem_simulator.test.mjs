import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAttempt, selectQuestions } from '../.site/lib/enem-simulator.mjs';

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
