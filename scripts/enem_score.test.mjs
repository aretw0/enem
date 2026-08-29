import assert from 'node:assert/strict';
import test from 'node:test';
import { requiredScore, weightedAverage } from '../.site/lib/enem-score.mjs';

test('calcula média ponderada', () => {
  assert.equal(weightedAverage([600, 700, 800], [1, 2, 1]), 700);
});

test('isola a nota necessária de uma área', () => {
  assert.equal(requiredScore({ target: 700, scores: [600, 0, 800], weights: [1, 2, 1], missingIndex: 1 }), 700);
});

test('recusa pesos sem contribuição', () => {
  assert.throws(() => weightedAverage([600], [0]), /soma dos pesos/);
});
