import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

const candidateTarballs = {
  '@refarm.dev/ds': {
    path: 'vendor/refarm.dev-ds-0.1.0.tgz',
    sha256: '317978d2d2633190b241b2a5bc6e2bec50fbe123b4ad12929983f4062d7ecbc1',
  },
  '@refarm.dev/quality-contract-v1': {
    path: 'vendor/refarm.dev-quality-contract-v1-0.1.0.tgz',
    sha256: '839a61fad73e2056a67f4d3d39991917a226f92f4538bc47a21aedd65be61574',
  },
};

function digest(path, algorithm, encoding) {
  return createHash(algorithm).update(readFileSync(`${root}/${path}`)).digest(encoding);
}

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

test('mantém bytes do handoff e integridades do lockfile no mesmo candidato', () => {
  const lockfile = readFileSync(`${root}/pnpm-lock.yaml`, 'utf8');

  for (const [packageName, candidate] of Object.entries(candidateTarballs)) {
    assert.equal(digest(candidate.path, 'sha256', 'hex'), candidate.sha256, `${packageName} SHA-256`);
    const lockIntegrity = `sha512-${digest(candidate.path, 'sha512', 'base64')}`;
    assert.match(lockfile, new RegExp(lockIntegrity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('exportador não atravessa a estrutura privada de node_modules', () => {
  const exporter = readFileSync(`${root}/scripts/export_notebooks.mjs`, 'utf8');
  assert.match(exporter, /import\.meta\.resolve\("@refarm\.dev\/ds\/themes\/verde-jardim\.css"\)/);
  assert.doesNotMatch(exporter, /node_modules["'],\s*["']@refarm\.dev["'],\s*["']ds/);
});
