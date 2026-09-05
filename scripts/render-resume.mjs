/**
 * Render resume.html to assets/Badathala-Jaisurya-Resume.pdf.
 *
 * The PDF is a build artefact, not source: keeping it out of git means it
 * can never drift from resume.html, and it keeps the repository entirely
 * text, so every commit can be created (and signed) through the GitHub API.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'assets/Badathala-Jaisurya-Resume.pdf');

mkdirSync(resolve(root, 'assets'), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + resolve(root, 'resume.html'), { waitUntil: 'networkidle' });
await page.pdf({
  path: out,
  format: 'A4',
  printBackground: true,
  margin: { top: '13mm', bottom: '13mm', left: '14mm', right: '14mm' }
});
await browser.close();
console.log('wrote ' + out);
