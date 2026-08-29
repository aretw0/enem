import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const dist = resolve('dist');
const types = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

async function fileFor(url) {
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname).replace(/^\/+/, '');
  const candidates = pathname
    ? [join(dist, pathname), join(dist, pathname, 'index.html')]
    : [join(dist, 'index.html')];
  for (const candidate of candidates) {
    if (!candidate.startsWith(dist)) continue;
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {}
  }
  return null;
}

const server = createServer(async (request, response) => {
  const path = await fileFor(request.url ?? '/');
  if (!path) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': types.get(extname(path)) ?? 'application/octet-stream' });
  response.end(await readFile(path));
});

await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const address = server.address();
const browser = await chromium.launch();
const errors = [];

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', (error) => errors.push(`${viewport.width}px: ${error.message}`));
    const response = await page.goto(`http://127.0.0.1:${address.port}/simulado/?area=mixed&seed=browser-smoke&size=5`);
    if (!response?.ok()) errors.push(`${viewport.width}px: HTTP ${response?.status()}`);
    await page.locator('[data-simulator-setup] button[type="submit"]').click();
    const questions = page.locator('.enem-question');
    if (await questions.count() !== 5) errors.push(`${viewport.width}px: bloco não contém 5 questões`);
    const legends = await questions.locator('legend').allTextContents();
    const groupCounts = [
      legends.filter((text) => text.includes('Ciências da Natureza')).length,
      legends.filter((text) => text.includes('Matemática')).length,
    ].sort();
    if (groupCounts[0] !== 2 || groupCounts[1] !== 3) {
      errors.push(`${viewport.width}px: bloco misto não ficou equilibrado (${groupCounts.join('/')})`);
    }
    for (let index = 0; index < await questions.count(); index++) {
      await questions.nth(index).locator('input[type="radio"]').first().check();
      await questions.nth(index).locator('select').selectOption('low');
    }
    await page.locator('[data-question-form] > button[type="submit"]').click();
    if (!await page.locator('[data-simulator-result]').isVisible()) errors.push(`${viewport.width}px: resultado oculto`);
    if (await page.locator('[data-result-metrics] > div').count() !== 5) errors.push(`${viewport.width}px: métricas incompletas`);
    if (!await page.locator('[data-download-session]').isEnabled()) {
      errors.push(`${viewport.width}px: exportação Markdown indisponível`);
    } else {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-download-session]').click();
      const download = await downloadPromise;
      if (!download.suggestedFilename().endsWith('.md')) errors.push(`${viewport.width}px: download não gerou Markdown`);
      await download.delete();
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 2) errors.push(`${viewport.width}px: overflow horizontal de ${overflow}px`);
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log('Simulator browser smoke passed: seeded selection, answers, confidence and feedback at 390px/1440px.');
