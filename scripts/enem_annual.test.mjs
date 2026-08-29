import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAnnualData } from './validate_enem_annual.mjs';

const model = {
  edition: 2026,
  verified: '2026-08-28',
  reviewDue: '2026-09-28',
  regularApplicationDates: ['2026-11-08', '2026-11-15'],
  officialSourceIds: ['official'],
};
const sourceIds = new Set(['official']);

test('aceita edição corrente ainda dentro do prazo de revisão', () => {
  assert.deepEqual(validateAnnualData(model, { asOf: new Date('2026-08-29T12:00:00Z'), sourceIds }), []);
});

test('falha fechada quando a revisão anual vence', () => {
  assert.match(
    validateAnnualData(model, { asOf: new Date('2026-09-29T12:00:00Z'), sourceIds }).join('\n'),
    /dados anuais vencidos/,
  );
});

test('impede que uma edição anterior pareça atual', () => {
  assert.match(
    validateAnnualData(model, { asOf: new Date('2027-01-02T12:00:00Z'), sourceIds }).join('\n'),
    /não corresponde ao ano corrente 2027/,
  );
});
