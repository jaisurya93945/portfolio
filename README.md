# Badathala Jaisurya — Portfolio

An interactive, editorial portfolio built with **zero JS dependencies**: hand-written HTML, CSS and
vanilla JavaScript. No framework, no build step, no bundler, no analytics. Available in **11 languages**.

**Live:** https://jaisurya93945.github.io/portfolio/

Positioning: AI Security · DevSecOps · MLOps · Cloud Security.

---

## The interactive centrepiece: a browser-side AI Threat Gateway

The `#lab` section runs a miniature of the detection engine behind
[SentinelCore](https://github.com/jaisurya93945/sentinelcore) and
[AegisAI](https://github.com/jaisurya93945/aegis-ai). Paste any prompt, tool description or
document chunk and it returns a transparent verdict.

- **17 deterministic rules** covering instruction override, system-prompt extraction,
  jailbreak/persona hijack, encoded payloads, decode-and-execute directives, invisible and
  bidirectional Unicode, homoglyph substitution, unauthorised tool invocation, MCP
  tool-description poisoning, sensitive-path access, data exfiltration, credential material,
  PII, destructive intent, phishing, and delimiter/role spoofing.
- **Weighted evidence fusion** with a saturating curve, so no single weak signal pins the score
  at 100, plus a chained-technique bonus when several high-severity rules fire together.
- **Defensive-intent damping** so legitimate blue-team questions are not punished by the very
  detector built for that audience.
- **Policy layer** mapping the 0–100 score to `ALLOW` / `WARN` / `BLOCK`.

Everything runs client-side. No text typed into the panel ever leaves the browser.

Engine: [`assets/js/scanner.js`](assets/js/scanner.js) — pure, side-effect free, testable under Node:

```bash
node -e "global.window={};require('./assets/js/scanner.js');
const g=global.window.ThreatGateway;
Object.entries(g.SAMPLES).forEach(([k,v])=>{
  const r=g.scan(v);
  console.log(k.padEnd(11), String(r.score).padStart(3), r.action);
});"
```

## Languages

Eleven locales, chosen for the target markets — UK, Ireland, Germany, Luxembourg, France,
Belgium, the Netherlands, Spain, Italy, Portugal, Poland and India:

| | | |
| --- | --- | --- |
| English `en` | Deutsch `de` | Français `fr` |
| Nederlands `nl` | Español `es` | Italiano `it` |
| Português `pt` | Polski `pl` | हिन्दी `hi` |
| தமிழ் `ta` | తెలుగు `te` | |

**How it works.** English lives in the HTML itself, so it is both the source of truth and the
no-JavaScript fallback. Every other locale is a small JSON file in
[`assets/i18n/`](assets/i18n/) fetched **on demand** — a visitor downloads only the one language
they read (~12 KB), never all eleven. A failed fetch silently falls back to English rather than
breaking the page.

Language is resolved in this order: `?lang=xx` query parameter → `localStorage` → the browser's
`navigator.languages` → English. The choice is applied before first paint by a tiny inline
script, so there is no flash of the wrong language, and `<html lang>` is kept in sync for screen
readers. Each locale has a `hreflang` alternate for search engines.

To add a locale: copy any file in `assets/i18n/`, translate the values, and add one entry to
`LOCALES` in [`assets/js/i18n.js`](assets/js/i18n.js). Key coverage is easy to verify — every
file must carry exactly the keys used by `data-i18n` / `data-i18n-attr` in `index.html`.

## Interaction

| Feature | Notes |
| --- | --- |
| Dot-matrix hero canvas | A breathing field that ripples under the pointer. `O(n)` per frame — no pairwise link loop — with DPR capped at 2, and it pauses when off-screen or the tab is hidden. |
| Preloader curtain | Counter to 100, then the panel slides away. Runs once per session (`sessionStorage`), never under reduced motion. |
| Line-mask headings | Each headline line sits in its own `overflow:hidden` box and slides up on reveal, staggered. Re-wrapped automatically after a language swap. |
| Command palette | `Ctrl`/`Cmd` + `K` — jump to any section, project or contact link. Labels follow the active language. |
| Light + dark themes | Full token swap, remembered in `localStorage`, defaulting to the OS preference and applied before first paint. |
| Magnetic buttons + custom cursor | Fine-pointer devices only; the cursor stays parked until the pointer actually moves. |
| Project list | Editorial numbered rows with a pointer-tracked spotlight, filterable by discipline. |
| Skill tabs | Four capability panels with arrow-key roving focus. |

## Performance and accessibility

- No JS frameworks. One stylesheet, three small deferred scripts.
- One external request: the Google Fonts stylesheet for Space Grotesk + Inter. Everything else —
  icons, artwork, logic — is inline or local. The font stack falls back to system faces cleanly.
- Canvas work is gated by `IntersectionObserver` and `visibilitychange`; scroll handlers are
  `requestAnimationFrame`-batched and passive.
- Full `prefers-reduced-motion` path: preloader, canvas, typing, marquee and reveals all stand down.
- Semantic landmarks, skip link, visible focus rings, ARIA on tabs, the palette dialog, the
  language listbox and the live findings region.
- Responsive from 320px up, with no horizontal overflow.
- `Person` JSON-LD, Open Graph, Twitter card and per-locale `hreflang` metadata.

### A note on Google Fonts and GDPR

The two webfonts load from `fonts.googleapis.com`, which means the visitor's IP reaches Google.
German courts have found this actionable without consent, and Germany is a target market here.
To remove the dependency entirely, download the two families, drop the `.woff2` files into
`assets/fonts/`, replace the `<link rel="stylesheet" href="https://fonts.googleapis.com/...">`
in `index.html` with local `@font-face` rules, and the site becomes fully self-contained.

## Layout

```
index.html                 single-page portfolio
resume.html                print-styled résumé (screen + @page A4)
assets/
  css/style.css            design tokens, both themes, all components
  js/i18n.js               locale loader, detection, DOM swapping
  js/scanner.js            threat-detection engine (framework-free, unit-testable)
  js/main.js               canvas, reveals, palette, tabs, filters, theme, lab wiring
  i18n/*.json              10 translated locales (English lives in index.html)
  img/favicon.svg          shield mark
  img/og.svg               social preview card
scripts/render-resume.mjs    renders resume.html to PDF at deploy time
.github/workflows/pages.yml  GitHub Pages deployment
```

The résumé PDF is **not** committed — it is rendered from `resume.html` by the deploy workflow
and shipped with the Pages artefact. Keeping it out of git means it can never drift from the HTML
it comes from, and leaves the repository entirely text. To produce it locally:

```bash
npm install --no-save playwright && npx playwright install chromium
node scripts/render-resume.mjs
```

## Running locally

No build step. The i18n files are fetched over HTTP, so serve the folder rather than opening the
file directly:

```bash
python3 -m http.server 8080
# then http://localhost:8080
```

## Deployment

Pushes to `main` publish via [`.github/workflows/pages.yml`](.github/workflows/pages.yml), which
gates the deploy on a detector regression check plus a locale key-coverage check, then renders the
résumé PDF before publishing.

Two one-time steps are needed before the site goes live:

1. **Create a `main` branch.** The workflow triggers on pushes to `main`; until that branch exists
   nothing is ever published.
2. **Enable the source.** Settings → Pages → Build and deployment → Source: **GitHub Actions**.

## Contact

- Email — jaisurya524126@gmail.com
- LinkedIn — [badathala-jaisurya](https://www.linkedin.com/in/badathala-jaisurya-7b985a224)
- GitHub — [@jaisurya93945](https://github.com/jaisurya93945)
- CipherAI — [cipherai.in](https://cipherai.in)
