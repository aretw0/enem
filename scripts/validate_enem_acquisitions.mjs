#!/usr/bin/env node
import { X509Certificate } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SHA256 = /^[a-f0-9]{64}$/;
const KINDS = new Set(['proof', 'answer-key']);

function json(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function jsonFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return jsonFiles(path);
    return entry.isFile() && extname(entry.name) === '.json' ? [path] : [];
  });
}

function safeUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function validateAcquisitionRepository(root = process.cwd()) {
  const errors = [];
  const acquisitionRoot = join(root, 'data', 'acquisitions');
  const receiptRoot = join(acquisitionRoot, 'receipts');
  const manifestFiles = jsonFiles(acquisitionRoot).filter((path) => !path.startsWith(`${receiptRoot}/`));
  const sourcesPath = join(root, 'data', 'sources.json');
  const sourceIds = new Set(existsSync(sourcesPath) ? json(sourcesPath).map((source) => source.id) : []);
  const collections = new Map();
  const artifacts = new Map();

  for (const path of manifestFiles) {
    let manifest;
    try {
      manifest = json(path);
    } catch (error) {
      errors.push(`${relative(root, path)}: JSON inválido (${error.message})`);
      continue;
    }
    const label = manifest?.collectionId ?? relative(root, path);
    if (manifest?.schemaVersion !== 1) errors.push(`${label}: schemaVersion deve ser 1`);
    if (!manifest?.collectionId) errors.push(`${label}: collectionId ausente`);
    if (collections.has(manifest?.collectionId)) errors.push(`${label}: collectionId duplicado`);
    if (manifest?.collectionId) collections.set(manifest.collectionId, manifest);
    if (!DATE.test(manifest?.accessedAt ?? '')) errors.push(`${label}: accessedAt inválido`);
    const sourcePage = safeUrl(manifest?.sourcePage);
    if (!sourcePage || sourcePage.protocol !== 'https:') errors.push(`${label}: sourcePage deve usar HTTPS`);

    const allowedHosts = new Set(manifest?.policy?.allowedHosts ?? []);
    const mediaTypes = new Set(manifest?.policy?.mediaTypes ?? []);
    if (!allowedHosts.size) errors.push(`${label}: allowedHosts vazio`);
    if (!mediaTypes.has('application/pdf')) errors.push(`${label}: policy deve aceitar application/pdf`);
    if (!Number.isInteger(manifest?.policy?.maxBytes) || manifest.policy.maxBytes < 1) {
      errors.push(`${label}: maxBytes inválido`);
    }
    if (manifest?.engine?.package !== '@refarm.dev/source-web' ||
        manifest?.engine?.primitive !== 'downloadAttachment' || !manifest?.engine?.version) {
      errors.push(`${label}: engine deve fixar @refarm.dev/source-web/downloadAttachment`);
    }

    const certConfig = manifest?.policy?.extraCertificate;
    const certPath = certConfig?.path ? resolve(root, certConfig.path) : null;
    if (!certPath || !existsSync(certPath)) {
      errors.push(`${label}: certificado adicional não existe`);
    } else {
      try {
        const certificate = new X509Certificate(readFileSync(certPath));
        const fingerprint = certificate.fingerprint256.replaceAll(':', '').toLowerCase();
        if (fingerprint !== certConfig.sha256Fingerprint) errors.push(`${label}: fingerprint da CA diverge`);
        const validUntil = new Date(certificate.validTo).toISOString().slice(0, 10);
        if (validUntil !== certConfig.validUntil) errors.push(`${label}: validade declarada da CA diverge`);
      } catch (error) {
        errors.push(`${label}: certificado inválido (${error.message})`);
      }
    }

    if (!Array.isArray(manifest?.artifacts) || !manifest.artifacts.length) {
      errors.push(`${label}: artifacts deve ser um array não vazio`);
      continue;
    }
    for (const artifact of manifest.artifacts) {
      const artifactLabel = artifact?.id ?? `${label}:artefato-sem-id`;
      if (!artifact?.id) errors.push(`${artifactLabel}: id ausente`);
      if (artifacts.has(artifact?.id)) errors.push(`${artifactLabel}: artifactId duplicado`);
      if (artifact?.id) artifacts.set(artifact.id, { artifact, manifest });
      if (!sourceIds.has(artifact?.sourceId)) errors.push(`${artifactLabel}: sourceId desconhecido`);
      if (!KINDS.has(artifact?.kind)) errors.push(`${artifactLabel}: kind inválido`);
      if (![1, 2].includes(artifact?.day)) errors.push(`${artifactLabel}: day inválido`);
      if (!Number.isInteger(artifact?.booklet) || artifact.booklet < 1) errors.push(`${artifactLabel}: booklet inválido`);
      const url = safeUrl(artifact?.url);
      if (!url || url.protocol !== 'https:') errors.push(`${artifactLabel}: URL deve usar HTTPS`);
      else if (!allowedHosts.has(url.hostname)) errors.push(`${artifactLabel}: host fora da allowlist`);
      if (!artifact?.filename || basename(artifact.filename) !== artifact.filename || !artifact.filename.endsWith('.pdf')) {
        errors.push(`${artifactLabel}: filename PDF inválido`);
      } else if (url && basename(url.pathname) !== artifact.filename) {
        errors.push(`${artifactLabel}: filename diverge da URL`);
      }
    }
  }

  const receiptIds = new Set();
  for (const path of jsonFiles(receiptRoot)) {
    let receipt;
    try {
      receipt = json(path);
    } catch (error) {
      errors.push(`${relative(root, path)}: JSON inválido (${error.message})`);
      continue;
    }
    const label = receipt?.artifactId ?? relative(root, path);
    const registered = artifacts.get(receipt?.artifactId);
    if (!registered) {
      errors.push(`${label}: recibo sem artefato no manifesto`);
      continue;
    }
    if (receiptIds.has(receipt.artifactId)) errors.push(`${label}: recibo duplicado`);
    receiptIds.add(receipt.artifactId);
    if (receipt.schemaVersion !== 1) errors.push(`${label}: schemaVersion do recibo deve ser 1`);
    if (receipt.collectionId !== registered.manifest.collectionId) errors.push(`${label}: collectionId diverge`);
    if (receipt.sourceId !== registered.artifact.sourceId) errors.push(`${label}: sourceId diverge`);
    if (receipt.sourceUrl !== registered.artifact.url) errors.push(`${label}: sourceUrl diverge`);
    if (!ISO_DATE_TIME.test(receipt.capturedAt ?? '')) errors.push(`${label}: capturedAt inválido`);
    if (receipt.transport?.scheme !== 'https' || receipt.transport?.tlsVerified !== true) {
      errors.push(`${label}: transporte não comprova TLS`);
    }
    if (receipt.transport?.extraCertificateFingerprint !==
        registered.manifest.policy.extraCertificate.sha256Fingerprint) {
      errors.push(`${label}: fingerprint de transporte diverge`);
    }
    if (receipt.response?.status !== 200 || !registered.manifest.policy.mediaTypes.includes(receipt.response?.mediaType)) {
      errors.push(`${label}: resposta HTTP/material inválida`);
    }
    if (!SHA256.test(receipt.materialized?.sha256 ?? '')) errors.push(`${label}: SHA-256 inválido`);
    if (!Number.isInteger(receipt.materialized?.sizeBytes) || receipt.materialized.sizeBytes < 1) {
      errors.push(`${label}: sizeBytes inválido`);
    }
    const localPath = receipt.materialized?.localPath ?? '';
    if (isAbsolute(localPath) || localPath.split(/[\\/]/).includes('..') || !localPath.startsWith('.local/acquisitions/')) {
      errors.push(`${label}: localPath deve apontar para o cache local`);
    }
    if (receipt.engine?.package !== registered.manifest.engine.package ||
        receipt.engine?.version !== registered.manifest.engine.version ||
        receipt.engine?.primitive !== registered.manifest.engine.primitive) {
      errors.push(`${label}: engine diverge do manifesto`);
    }
  }

  return { errors, collectionCount: collections.size, artifactCount: artifacts.size, receiptCount: receiptIds.size };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = validateAcquisitionRepository();
  if (result.errors.length) {
    console.error(result.errors.map((error) => `- ${error}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`ENEM acquisitions OK: ${result.collectionCount} coleção, ${result.artifactCount} artefatos, ${result.receiptCount} recibos.`);
  }
}
