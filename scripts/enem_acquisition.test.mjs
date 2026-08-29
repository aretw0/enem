import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { captureArtifact } from './acquire_enem_artifacts.mjs';
import { validateAcquisitionRepository } from './validate_enem_acquisitions.mjs';

const PDF_FIXTURE = Buffer.from('%PDF-1.4\nfixture oficial simulada\n%%EOF\n');

function manifest() {
  return {
    schemaVersion: 1,
    collectionId: 'fixture-collection',
    sourcePage: 'https://www.gov.br/inep/fixture',
    accessedAt: '2026-08-29',
    policy: {
      allowedHosts: ['download.inep.gov.br'], mediaTypes: ['application/pdf'], maxBytes: 1024,
      extraCertificate: {
        path: 'config/certificates/fixture.pem',
        sha256Fingerprint: 'a'.repeat(64),
        validUntil: '2030-01-01',
      },
    },
    engine: { package: '@refarm.dev/source-web', version: '0.1.0', primitive: 'downloadAttachment' },
    artifacts: [{
      id: 'fixture-proof', sourceId: 'fixture-source', kind: 'proof', day: 1, booklet: 1,
      color: 'azul', title: 'Fixture', url: 'https://download.inep.gov.br/fixture.pdf', filename: 'fixture.pdf',
    }],
  };
}

test('captura usa a primitiva refarm e produz bytes + recibo verificáveis', async () => {
  const root = mkdtempSync(join(tmpdir(), 'enem-acquisition-'));
  const model = manifest();
  const artifact = model.artifacts[0];
  const captured = await captureArtifact({
    artifact,
    manifest: model,
    repositoryRoot: root,
    capturedAt: '2026-08-29T12:00:00.000Z',
    fetcher: async () => ({ bytes: PDF_FIXTURE, mediaType: 'application/pdf', declaredSize: PDF_FIXTURE.byteLength }),
    observationFor: () => ({
      finalUrl: artifact.url, status: 200, mediaType: 'application/pdf', declaredSize: PDF_FIXTURE.byteLength,
    }),
  });
  assert.deepEqual(readFileSync(captured.outputPath), PDF_FIXTURE);
  assert.equal(captured.receipt.materialized.sha256, 'e93d847647d5012ec25d87bc8ca806bd035ca682b20702f2d655bf2d1c253b79');
  assert.equal(captured.receipt.engine.package, '@refarm.dev/source-web');
  assert.equal(captured.receipt.transport.tlsVerified, true);
});

test('validador recusa artefato fora da allowlist', () => {
  const root = mkdtempSync(join(tmpdir(), 'enem-acquisition-invalid-'));
  const model = manifest();
  model.artifacts[0].url = 'https://example.com/fixture.pdf';
  mkdirSync(join(root, 'data', 'acquisitions'), { recursive: true });
  mkdirSync(join(root, 'config', 'certificates'), { recursive: true });
  writeFileSync(join(root, 'data', 'sources.json'), JSON.stringify([{ id: 'fixture-source' }]));
  writeFileSync(join(root, 'data', 'acquisitions', 'fixture.json'), JSON.stringify(model));
  writeFileSync(join(root, 'config', 'certificates', 'fixture.pem'), 'inválido');
  assert.match(validateAcquisitionRepository(root).errors.join('\n'), /host fora da allowlist/);
});
