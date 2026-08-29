#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_SOURCE_FIELDS = ['id', 'title', 'type', 'authority', 'url', 'accessed', 'scope'];
const REQUIRED_QUESTION_FIELDS = [
  'id', 'sourceId', 'answerSourceId', 'year', 'exam', 'item', 'area', 'answer', 'prompt', 'alternatives', 'provenance',
];
const AREAS = new Set(['linguagens', 'humanas', 'natureza', 'matematica']);
const ANSWERS = new Set(['A', 'B', 'C', 'D', 'E', 'anulada']);

function json(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function listJsonFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return listJsonFiles(path);
    return entry.isFile() && extname(entry.name) === '.json' ? [path] : [];
  });
}

export function validateRepository(root = process.cwd()) {
  const errors = [];
  const sourcesPath = join(root, 'data', 'sources.json');
  if (!existsSync(sourcesPath)) return { errors: ['data/sources.json não existe'], sourceCount: 0, questionCount: 0 };

  const sources = json(sourcesPath);
  if (!Array.isArray(sources)) return { errors: ['data/sources.json deve conter um array'], sourceCount: 0, questionCount: 0 };

  const ids = new Set();
  for (const [index, source] of sources.entries()) {
    for (const field of REQUIRED_SOURCE_FIELDS) {
      if (!source?.[field]) errors.push(`fonte[${index}] sem ${field}`);
    }
    if (source?.id && ids.has(source.id)) errors.push(`sourceId duplicado: ${source.id}`);
    if (source?.id) ids.add(source.id);
    if (source?.url && !/^https:\/\//.test(source.url)) errors.push(`fonte ${source.id ?? index} deve usar URL HTTPS`);
    if (source?.accessed && !/^\d{4}-\d{2}-\d{2}$/.test(source.accessed)) errors.push(`fonte ${source.id ?? index} tem accessed inválido`);
  }

  const receiptsBySourceId = new Map();
  for (const file of listJsonFiles(join(root, 'data', 'acquisitions', 'receipts'))) {
    const receipt = json(file);
    if (receipt?.sourceId) receiptsBySourceId.set(receipt.sourceId, receipt);
  }

  let questionCount = 0;
  const questionIds = new Set();
  for (const file of listJsonFiles(join(root, 'data', 'questions'))) {
    const questions = json(file);
    if (!Array.isArray(questions)) {
      errors.push(`${file}: deve conter um array`);
      continue;
    }
    for (const [index, question] of questions.entries()) {
      questionCount++;
      const label = question?.id ?? `${file}[${index}]`;
      for (const field of REQUIRED_QUESTION_FIELDS) {
        if (question?.[field] === undefined || question?.[field] === null || question?.[field] === '') {
          errors.push(`${label}: sem ${field}`);
        }
      }
      if (question?.id && questionIds.has(question.id)) errors.push(`questionId duplicado: ${question.id}`);
      if (question?.id) questionIds.add(question.id);
      if (question?.sourceId && !ids.has(question.sourceId)) errors.push(`${label}: sourceId desconhecido ${question.sourceId}`);
      if (question?.answerSourceId && !ids.has(question.answerSourceId)) {
        errors.push(`${label}: answerSourceId desconhecido ${question.answerSourceId}`);
      }
      if (question?.sourceId && question.sourceId === question.answerSourceId) {
        errors.push(`${label}: prova e gabarito devem ter fontes distintas`);
      }
      if (question?.area && !AREAS.has(question.area)) errors.push(`${label}: área inválida ${question.area}`);
      if (question?.answer && !ANSWERS.has(question.answer)) errors.push(`${label}: gabarito inválido ${question.answer}`);
      if (!Number.isInteger(question?.item) || question.item < 1 || question.item > 180) errors.push(`${label}: item inválido`);
      if (typeof question?.prompt !== 'string' || !question.prompt.trim()) errors.push(`${label}: prompt vazio`);
      if (!Array.isArray(question?.alternatives) || question.alternatives.length !== 5 ||
          question.alternatives.some((alternative) => typeof alternative !== 'string' || !alternative.trim())) {
        errors.push(`${label}: deve haver cinco alternativas não vazias`);
      }
      if (!question?.provenance?.sourceFile) errors.push(`${label}: provenance.sourceFile ausente`);
      if (!/^[a-f0-9]{64}$/.test(question?.provenance?.sourceSha256 ?? '')) errors.push(`${label}: sourceSha256 inválido`);
      if (!Number.isInteger(question?.provenance?.page) || question.provenance.page < 1) errors.push(`${label}: provenance.page inválida`);
      if (!question?.provenance?.answerSourceFile) errors.push(`${label}: answerSourceFile ausente`);
      if (!/^[a-f0-9]{64}$/.test(question?.provenance?.answerSourceSha256 ?? '')) errors.push(`${label}: answerSourceSha256 inválido`);
      if (!Number.isInteger(question?.provenance?.answerPage) || question.provenance.answerPage < 1) {
        errors.push(`${label}: answerPage inválida`);
      }
      if (!['pending', 'verified'].includes(question?.provenance?.reviewStatus)) errors.push(`${label}: reviewStatus inválido`);
      if (question?.provenance?.reviewStatus === 'verified' &&
          (!question.provenance.reviewedAt || !question.provenance.reviewedBy)) {
        errors.push(`${label}: verificada sem reviewedAt/reviewedBy`);
      }

      const proofReceipt = receiptsBySourceId.get(question?.sourceId);
      const answerReceipt = receiptsBySourceId.get(question?.answerSourceId);
      if (!proofReceipt) errors.push(`${label}: prova sem recibo de aquisição`);
      if (!answerReceipt) errors.push(`${label}: gabarito sem recibo de aquisição`);
      if (proofReceipt && (proofReceipt.materialized?.sha256 !== question?.provenance?.sourceSha256 ||
          proofReceipt.materialized?.filename !== question?.provenance?.sourceFile)) {
        errors.push(`${label}: proveniência da prova diverge do recibo`);
      }
      if (answerReceipt && (answerReceipt.materialized?.sha256 !== question?.provenance?.answerSourceSha256 ||
          answerReceipt.materialized?.filename !== question?.provenance?.answerSourceFile)) {
        errors.push(`${label}: proveniência do gabarito diverge do recibo`);
      }
    }
  }

  return { errors, sourceCount: sources.length, questionCount };
}

const invokedPath = process.argv[1] ? fileURLToPath(new URL(`file://${process.argv[1]}`)) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = validateRepository();
  if (result.errors.length) {
    console.error(result.errors.map((error) => `- ${error}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`ENEM content OK: ${result.sourceCount} fontes, ${result.questionCount} questões com proveniência.`);
  }
}
