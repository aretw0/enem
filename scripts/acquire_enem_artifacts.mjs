#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { get as httpsGet } from 'node:https';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { rootCertificates } from 'node:tls';
import { fileURLToPath } from 'node:url';
import { downloadAttachment } from '@refarm.dev/source-web';

const DEFAULT_MANIFEST = 'data/acquisitions/enem-2025-regular-national-blue.json';
const USER_AGENT = 'enem-vault/0.0.1 (+https://github.com/aretw0/enem)';

function parseArgs(argv) {
  const options = { manifest: DEFAULT_MANIFEST, artifact: null, force: false };
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '--manifest' || argument === '--artifact') {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} exige um valor`);
      options[argument.slice(2)] = value;
    } else if (argument === '--force') {
      options.force = true;
    } else {
      throw new Error(`argumento desconhecido: ${argument}`);
    }
  }
  return options;
}

function assertAllowedUrl(rawUrl, allowedHosts) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:') throw new Error(`protocolo recusado: ${url.protocol}`);
  if (!allowedHosts.includes(url.hostname)) throw new Error(`host fora da allowlist: ${url.hostname}`);
  return url;
}

function secureGet(url, { allowedHosts, allowedMediaTypes, ca, headers, maxBytes, redirects = 0 }) {
  if (redirects > 5) return Promise.reject(new Error('excesso de redirecionamentos'));
  const target = assertAllowedUrl(url, allowedHosts);
  return new Promise((resolveRequest, rejectRequest) => {
    const request = httpsGet(target, {
      ca,
      family: 4,
      headers,
      rejectUnauthorized: true,
      servername: target.hostname,
    }, (response) => {
      const status = response.statusCode ?? 0;
      const location = response.headers.location;
      if ([301, 302, 303, 307, 308].includes(status) && location) {
        response.resume();
        const redirected = new URL(location, target).href;
        secureGet(redirected, { allowedHosts, allowedMediaTypes, ca, headers, maxBytes, redirects: redirects + 1 })
          .then(resolveRequest, rejectRequest);
        return;
      }
      if (status !== 200) {
        response.resume();
        rejectRequest(new Error(`HTTP ${status} em ${target.href}`));
        return;
      }
      const mediaType = String(response.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
      if (!allowedMediaTypes.includes(mediaType)) {
        response.resume();
        rejectRequest(new Error(`media type recusado: ${mediaType || 'ausente'}`));
        return;
      }
      const declaredSize = Number.parseInt(String(response.headers['content-length'] ?? ''), 10);
      if (Number.isFinite(declaredSize) && declaredSize > maxBytes) {
        response.resume();
        rejectRequest(new Error(`content-length ${declaredSize} excede o limite ${maxBytes}`));
        return;
      }
      const chunks = [];
      let sizeBytes = 0;
      response.on('data', (chunk) => {
        sizeBytes += chunk.byteLength;
        if (sizeBytes > maxBytes) {
          response.destroy(new Error(`corpo excede o limite ${maxBytes}`));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        const bytes = Buffer.concat(chunks);
        if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
          rejectRequest(new Error(`assinatura PDF ausente em ${target.href}`));
          return;
        }
        resolveRequest({
          bytes,
          mediaType,
          declaredSize: Number.isFinite(declaredSize) ? declaredSize : undefined,
          observation: { finalUrl: target.href, status, mediaType, declaredSize: Number.isFinite(declaredSize) ? declaredSize : null },
        });
      });
    });
    request.on('error', rejectRequest);
  });
}

export function createSecureBinaryDriver({ manifest, repositoryRoot = process.cwd() }) {
  const certificatePath = resolve(repositoryRoot, manifest.policy.extraCertificate.path);
  const extraCertificate = readFileSync(certificatePath, 'utf8');
  const observations = new Map();
  const ca = [...rootCertificates, extraCertificate];
  return {
    async fetcher(request) {
      const result = await secureGet(request.url, {
        allowedHosts: manifest.policy.allowedHosts,
        allowedMediaTypes: manifest.policy.mediaTypes,
        ca,
        maxBytes: manifest.policy.maxBytes,
        headers: { Accept: 'application/pdf', 'User-Agent': USER_AGENT, ...request.headers },
      });
      observations.set(request.url, result.observation);
      return { bytes: result.bytes, mediaType: result.mediaType, declaredSize: result.declaredSize };
    },
    observationFor(url) {
      return observations.get(url);
    },
  };
}

export async function captureArtifact({
  artifact,
  manifest,
  fetcher,
  observationFor = () => null,
  repositoryRoot = process.cwd(),
  capturedAt = new Date().toISOString(),
  force = false,
}) {
  const receiptPath = resolve(repositoryRoot, 'data', 'acquisitions', 'receipts', `${artifact.id}.json`);
  if (existsSync(receiptPath) && !force) throw new Error(`recibo já existe para ${artifact.id}; use --force`);

  const result = await downloadAttachment(artifact.url, {
    session: { kind: 'fixture', authenticated: false, principal: 'public:inep' },
    title: artifact.filename,
    fetcher,
    maxBytes: manifest.policy.maxBytes,
    headers: { Accept: 'application/pdf' },
    attributes: { collectionId: manifest.collectionId, artifactId: artifact.id },
  });
  if (result.kind !== 'materialized' || !result.bytes || !result.hash || !result.sizeBytes) {
    throw new Error(`artefato não materializado: ${artifact.id} (${result.skipReason ?? 'sem motivo'})`);
  }

  const localPath = join('.local', 'acquisitions', manifest.collectionId, artifact.filename);
  const outputPath = resolve(repositoryRoot, localPath);
  mkdirSync(dirname(outputPath), { recursive: true });
  const outputTemp = `${outputPath}.${process.pid}.tmp`;
  writeFileSync(outputTemp, result.bytes);
  renameSync(outputTemp, outputPath);

  const observation = observationFor(artifact.url) ?? {
    finalUrl: artifact.url,
    status: 200,
    mediaType: result.mimeType,
    declaredSize: null,
  };
  const receipt = {
    schemaVersion: 1,
    collectionId: manifest.collectionId,
    artifactId: artifact.id,
    sourceId: artifact.sourceId,
    sourceUrl: artifact.url,
    capturedAt,
    transport: {
      scheme: 'https',
      tlsVerified: true,
      extraCertificateFingerprint: manifest.policy.extraCertificate.sha256Fingerprint,
    },
    response: observation,
    materialized: {
      localPath: relative(repositoryRoot, outputPath),
      filename: basename(outputPath),
      sha256: result.hash,
      sizeBytes: result.sizeBytes,
    },
    engine: manifest.engine,
  };
  mkdirSync(dirname(receiptPath), { recursive: true });
  const receiptTemp = `${receiptPath}.${process.pid}.tmp`;
  writeFileSync(receiptTemp, `${JSON.stringify(receipt, null, 2)}\n`);
  renameSync(receiptTemp, receiptPath);
  return { outputPath, receiptPath, receipt };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repositoryRoot = process.cwd();
  const manifestPath = resolve(repositoryRoot, options.manifest);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const selected = options.artifact
    ? manifest.artifacts.filter((artifact) => artifact.id === options.artifact)
    : manifest.artifacts;
  if (!selected.length) throw new Error(`artefato não encontrado: ${options.artifact}`);
  const driver = createSecureBinaryDriver({ manifest, repositoryRoot });
  for (const artifact of selected) {
    const captured = await captureArtifact({
      artifact,
      manifest,
      fetcher: driver.fetcher,
      observationFor: driver.observationFor,
      repositoryRoot,
      force: options.force,
    });
    console.log(`${artifact.id}: ${captured.receipt.materialized.sha256} (${captured.receipt.materialized.sizeBytes} bytes)`);
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
