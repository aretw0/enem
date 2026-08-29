#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAnnualData } from '@aretw0/enem-domain/annual';

export function validateAnnualRepository(root = process.cwd(), asOf = new Date()) {
  const model = JSON.parse(readFileSync(join(root, 'data', 'enem-2026.json'), 'utf8'));
  const sources = JSON.parse(readFileSync(join(root, 'data', 'sources.json'), 'utf8'));
  return validateAnnualData(model, { asOf, sourceIds: new Set(sources.map((source) => source.id)) });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const errors = validateAnnualRepository();
  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log('ENEM annual data OK: edição corrente, fontes conhecidas e revisão dentro do prazo.');
  }
}
