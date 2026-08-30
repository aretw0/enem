import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

// Prova de consumo dos tarballs do handoff refarm: `vendor/manifest.json` é a fonte única
// (packet, source SHA e SHA-256 por tarball) e este teste garante que bytes, lockfile e
// overrides do workspace continuam apontando para o mesmo candidato.

const root = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(readFileSync(`${root}/vendor/manifest.json`, 'utf8'));
const packages = Object.entries(manifest.packages);

function digest(path, algorithm, encoding) {
  return createHash(algorithm).update(readFileSync(`${root}/${path}`)).digest(encoding);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Leitor mínimo de tar (cabeçalhos de 512 bytes, nome + prefixo ustar) só para achar o
// package.json do tarball sem depender de processo externo.
function readPackageJsonFromTarball(path) {
  const archive = gunzipSync(readFileSync(`${root}/${path}`));
  let offset = 0;
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const prefix = header.toString('utf8', 345, 500).replace(/\0.*$/s, '');
    let name = header.toString('utf8', 0, 100).replace(/\0.*$/s, '');
    if (prefix) name = `${prefix}/${name}`;
    const size = parseInt(header.toString('utf8', 124, 136).replace(/\0.*$/s, '').trim(), 8) || 0;
    if (name === 'package/package.json') {
      return JSON.parse(archive.toString('utf8', offset + 512, offset + 512 + size));
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  throw new Error(`package/package.json não encontrado em ${path}`);
}

test('manifesto do vendor registra packet, source SHA e todos os tarballs presentes', () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.match(manifest.packet, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(manifest.sourceGitSha, /^[0-9a-f]{40}$/);
  assert.ok(packages.length > 0, 'manifesto sem pacotes');

  const vendored = readdirSync(`${root}/vendor`).filter((file) => file.endsWith('.tgz')).sort();
  const declared = packages.map(([, entry]) => entry.tarball).sort();
  assert.deepEqual(vendored, declared, 'todo tarball em vendor/ precisa constar no manifesto');
});

test('cada tarball mantém o SHA-256 do packet e a integridade registrada no lockfile', () => {
  const lockfile = readFileSync(`${root}/pnpm-lock.yaml`, 'utf8');

  for (const [name, entry] of packages) {
    assert.match(entry.sha256, /^[0-9a-f]{64}$/, `${name} sha256 no manifesto`);
    assert.equal(digest(`vendor/${entry.tarball}`, 'sha256', 'hex'), entry.sha256, `${name} SHA-256`);

    const integrity = `sha512-${digest(`vendor/${entry.tarball}`, 'sha512', 'base64')}`;
    const lockEntry = new RegExp(
      `'${escapeRegExp(`${name}@file:vendor/${entry.tarball}`)}':\\n\\s+resolution: \\{integrity: ${escapeRegExp(integrity)},`,
    );
    assert.match(lockfile, lockEntry, `${name} integridade no pnpm-lock.yaml`);
  }
});

test('overrides fixam cada pacote no tarball e fecham as dependências transitivas', () => {
  const workspace = readFileSync(`${root}/pnpm-workspace.yaml`, 'utf8');

  for (const [name, entry] of packages) {
    assert.ok(
      workspace.includes(`"${name}": "file:vendor/${entry.tarball}"`),
      `${name} precisa de override em pnpm-workspace.yaml`,
    );

    const packageJson = readPackageJsonFromTarball(`vendor/${entry.tarball}`);
    assert.equal(packageJson.name, name);
    assert.equal(packageJson.version, entry.version, `${name} versão`);
    assert.deepEqual(packageJson.dependencies ?? {}, entry.dependencies, `${name} dependencies no manifesto`);

    for (const dependency of Object.keys(packageJson.dependencies ?? {})) {
      if (!dependency.startsWith('@refarm.dev/')) continue;
      assert.ok(manifest.packages[dependency], `${name} depende de ${dependency}, que precisa estar vendorizado`);
    }
  }
});
