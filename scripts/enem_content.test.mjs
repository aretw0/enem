import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateRepository } from './validate_enem_content.mjs';

function fixture(sourceId = 'official', reviewStatus = 'verified') {
  const root = mkdtempSync(join(tmpdir(), 'enem-content-'));
  mkdirSync(join(root, 'data', 'questions'), { recursive: true });
  writeFileSync(join(root, 'data', 'sources.json'), JSON.stringify([{
    id: 'official', title: 'Fonte', type: 'official', authority: 'Inep',
    url: 'https://example.gov.br/prova.pdf', accessed: '2026-08-28', scope: 'fixture',
  }]));
  writeFileSync(join(root, 'data', 'questions', 'fixture.json'), JSON.stringify([{
    id: 'q1', sourceId, year: 2025, exam: 'regular', item: 1,
    area: 'matematica', answer: 'A',
    provenance: { sourceFile: 'prova.pdf', page: 2, extractedBy: 'fixture', reviewStatus,
      ...(reviewStatus === 'verified' ? { reviewedAt: '2026-08-28' } : {}) },
  }]));
  return root;
}

test('aceita questão com fonte e proveniência completas', () => {
  assert.deepEqual(validateRepository(fixture()).errors, []);
});

test('guard é disparável: rejeita questão órfã', () => {
  assert.match(validateRepository(fixture('inventada')).errors.join('\n'), /sourceId desconhecido/);
});
