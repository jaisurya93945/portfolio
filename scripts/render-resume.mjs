/**
 * Render resume.html to one PDF per regional CV format.
 *
 * The viewer at resume.html is the primary experience — it reflows live and
 * its "Save as PDF" always prints exactly what is on screen. These files
 * exist for the cases a live page cannot serve: attaching a CV to an
 * application, or feeding an ATS that wants a document.
 *
 * PDFs are build artefacts, never committed, so they cannot drift from
 * resume.html and the repository stays entirely text.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'assets/cv');
mkdirSync(outDir, { recursive: true });

const REGIONS = [
  { id: 'int', file: 'Badathala-Jaisurya-CV-International.pdf' },
  { id: 'de',  file: 'Badathala-Jaisurya-Lebenslauf.pdf' },
  { id: 'uk',  file: 'Badathala-Jaisurya-CV-UK.pdf' },
  { id: 'us',  file: 'Badathala-Jaisurya-Resume-US.pdf' },
  { id: 'in',  file: 'Badathala-Jaisurya-Resume-India.pdf' }
];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const { id, file } of REGIONS) {
  const url = 'file://' + resolve(root, 'resume.html') + '?region=' + id;
  await page.goto(url, { waitUntil: 'networkidle' });
  // The sheet renders from JS; wait for real content before printing.
  await page.waitForFunction(() => {
    const s = document.querySelector('#sheet');
    return s && s.textContent.trim().length > 1000;
  }, { timeout: 15000 });
  const out = resolve(outDir, file);
  await page.pdf({
    path: out,
    format: 'A4',
    printBackground: true,
    margin: { top: '13mm', bottom: '13mm', left: '14mm', right: '14mm' }
  });
  console.log('wrote ' + file);
}

// Keep the historic path working for anything already linking to it.
await page.goto('file://' + resolve(root, 'resume.html') + '?region=int', { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('#sheet').textContent.trim().length > 1000);
await page.pdf({
  path: resolve(root, 'assets/Badathala-Jaisurya-Resume.pdf'),
  format: 'A4', printBackground: true,
  margin: { top: '13mm', bottom: '13mm', left: '14mm', right: '14mm' }
});
console.log('wrote assets/Badathala-Jaisurya-Resume.pdf (compatibility path)');

await browser.close();
