import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

test('consome o tema pelo export público do candidato @refarm.dev/ds', () => {
  const packageJson = JSON.parse(readFileSync(`${root}/package.json`, 'utf8'));
  assert.equal(packageJson.dependencies['@refarm.dev/ds'], 'file:vendor/refarm.dev-ds-0.1.0.tgz');
  const workspace = readFileSync(`${root}/pnpm-workspace.yaml`, 'utf8');
  assert.match(
    workspace,
    /"@refarm\.dev\/quality-contract-v1": "file:vendor\/refarm\.dev-quality-contract-v1-0\.1\.0\.tgz"/,
  );

  const themePath = fileURLToPath(import.meta.resolve('@refarm.dev/ds/themes/verde-jardim.css'));
  const theme = readFileSync(themePath, 'utf8');
  assert.match(themePath, /@refarm\.dev[/+]ds/);
  assert.match(theme, /data-refarm-theme="verde-jardim"/);
  assert.match(theme, /--primary:/);
});

test('exportador não atravessa a estrutura privada de node_modules', () => {
  const exporter = readFileSync(`${root}/scripts/export_notebooks.mjs`, 'utf8');
  assert.match(exporter, /import\.meta\.resolve\("@refarm\.dev\/ds\/themes\/verde-jardim\.css"\)/);
  assert.doesNotMatch(exporter, /node_modules["'],\s*["']@refarm\.dev["'],\s*["']ds/);
});
