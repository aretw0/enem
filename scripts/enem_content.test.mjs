import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateRepository } from './validate_enem_content.mjs';

function fixture(sourceId = 'official', reviewStatus = 'verified') {
  const root = mkdtempSync(join(tmpdir(), 'enem-content-'));
  mkdirSync(join(root, 'data', 'questions'), { recursive: true });
  mkdirSync(join(root, 'data', 'acquisitions', 'receipts'), { recursive: true });
  const proofHash = 'a'.repeat(64);
  const answerHash = 'b'.repeat(64);
  writeFileSync(join(root, 'data', 'sources.json'), JSON.stringify([{
    id: 'official', title: 'Fonte', type: 'official', authority: 'Inep',
    url: 'https://example.gov.br/prova.pdf', accessed: '2026-08-28', scope: 'fixture',
  }, {
    id: 'official-key', title: 'Gabarito', type: 'official', authority: 'Inep',
    url: 'https://example.gov.br/gabarito.pdf', accessed: '2026-08-28', scope: 'fixture',
  }]));
  writeFileSync(join(root, 'data', 'acquisitions', 'receipts', 'proof.json'), JSON.stringify({
    sourceId: 'official', materialized: { filename: 'prova.pdf', sha256: proofHash },
  }));
  writeFileSync(join(root, 'data', 'acquisitions', 'receipts', 'key.json'), JSON.stringify({
    sourceId: 'official-key', materialized: { filename: 'gabarito.pdf', sha256: answerHash },
  }));
  writeFileSync(join(root, 'data', 'questions', 'fixture.json'), JSON.stringify([{
    id: 'q1', sourceId, answerSourceId: 'official-key', year: 2025, exam: 'regular', item: 1,
    area: 'matematica', answer: 'A', prompt: 'Enunciado?', alternatives: ['a', 'b', 'c', 'd', 'e'],
    provenance: { sourceFile: 'prova.pdf', sourceSha256: proofHash, page: 2,
      answerSourceFile: 'gabarito.pdf', answerSourceSha256: answerHash, answerPage: 1,
      extractedBy: 'fixture', reviewStatus,
      ...(reviewStatus === 'verified' ? { reviewedAt: '2026-08-28', reviewedBy: 'fixture' } : {}) },
  }]));
  return root;
}

test('aceita questão com fonte e proveniência completas', () => {
  assert.deepEqual(validateRepository(fixture()).errors, []);
});

test('guard é disparável: rejeita questão órfã', () => {
  assert.match(validateRepository(fixture('inventada')).errors.join('\n'), /sourceId desconhecido/);
});

test('guard é disparável: rejeita checksum diferente do recibo', () => {
  const root = fixture();
  const path = join(root, 'data', 'questions', 'fixture.json');
  const questions = JSON.parse(readFileSync(path, 'utf8'));
  questions[0].provenance.sourceSha256 = 'c'.repeat(64);
  writeFileSync(path, JSON.stringify(questions));
  assert.match(validateRepository(root).errors.join('\n'), /proveniência da prova diverge do recibo/);
});
