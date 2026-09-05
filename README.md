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

## Résumé: one document, five conventions

A CV is not one document. Germany expects a *Lebenslauf* with a **Persönliche Daten** block and
`MM/YYYY` dates; the UK expects a two-page CV opening with a personal statement and closing with
references; the US expects a one-to-two-page resume with **no** photo and no personal details,
because hiring convention treats them as a discrimination risk. Same facts, different shape.

[`resume.html`](resume.html) is a live viewer, not a download. Pick a region and the document
re-renders: section order, headings, date format, the personal block, the photo option, and the
German signature line all follow that market's convention. Content lives once in
[`assets/js/resume.js`](assets/js/resume.js); each region decides what is shown and what it is
called.

| Region | Document | Personal block | Photo | Dates | Notes |
| --- | --- | --- | --- | --- | --- |
| Europe / International | Curriculum Vitae | — | — | `Mar 2026` | Neutral across most EU markets |
| Deutschland · Österreich · Schweiz | Lebenslauf | ✓ | optional | `03/2026` | Full German text, signature line |
| UK & Ireland | Curriculum Vitae | — | — | `Mar 2026` | Personal statement, references on request |
| United States | Resume | — | — | `03/2026` | Condensed to two pages, no personal data |
| India | Resume | ✓ | — | `Mar 2026` | Fuller detail, certifications prominent |

The German variant is fully translated, and the viewer offers an English toggle for
international teams hiring in Germany. **Save as PDF** prints exactly what is on screen; **Download**
serves a pre-rendered file for attaching to applications or feeding an ATS. Region is remembered
and shareable via `?region=de`.

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
| Section rail | A fixed 01–07 index that tracks scroll position and expands the active label. |
| View Transitions | Theme and language swaps cross-fade the whole page where the browser supports it; the language swap fetches first and applies inside the transition, so the fade covers a finished change. |
| Scroll-reactive marquee | Skew and speed follow scroll velocity. |
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
  js/resume.js             résumé content + per-region rules
scripts/render-resume.mjs    renders one PDF per region at deploy time
scripts/setup-signing.sh     one-time setup for verified commits
scripts/parse-resume-docx.py resume-source/*.docx -> structured content
scripts/commit-verified.py   commits via GitHub's signing API (Verified)
scripts/report-signature.py  prints the signature status of that commit
resume-source/en|de/         drop a .docx here to update the résumé
.github/workflows/pages.yml  GitHub Pages deployment
```

The résumé PDFs are **not** committed — the deploy workflow renders one per region from
`resume.html` into `assets/cv/`. Keeping them out of git means they can never drift from the HTML
they come from, and leaves the repository entirely text. To produce them locally:

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

The workflow triggers on `main` *and* on `claude/**`, so whichever of those is the default branch
will publish. If the site ever looks out of date, it is almost always because the workflow never
fired and Pages is still serving an earlier publish.

## Updating the résumé (no computer required)

The résumé is edited as a Word file and everything downstream regenerates.

1. Open **[`resume-source/en/`](resume-source/en/)** on github.com — a phone browser is fine.
2. **Add file → Upload files**, pick your `.docx`, **Commit changes**.
3. Two minutes later the site has republished.

[`scripts/parse-resume-docx.py`](scripts/parse-resume-docx.py) reads the structure Word already
saves — bold ALL-CAPS section headings, bold `Label: value` skill rows, bold tab-delimited role
lines, list bullets — and emits the structured content the viewer and all five regional PDFs are
built from. One Word file in, a German *Lebenslauf* and a US resume out.

Drop a German `.docx` into `resume-source/de/` and the Lebenslauf uses it. Without one, the German
view keeps German headings and an English body — normal for tech roles in Germany, and the viewer
labels it so nothing is misleading. If a document cannot be parsed the deploy fails loudly and the
site that is already published stays up.

## Verified commits

A **Verified** badge means GitHub checked a signature made by a key that belongs to you — so only
you can produce one. No bot, CI job or API token can sign on your behalf without becoming a key
you do not control, which is the opposite of what you want on a security repository.

A **Verified** badge means GitHub checked a cryptographic signature made by a key belonging to the
author. That is why no tool can produce one on your behalf — it would have to hold a key you do not
control. Commits pushed over plain git come back `"verified": false, "reason": "unsigned"`, which is
expected rather than a misconfiguration.

There are exactly two ways to get the badge, and **both work from a phone**.

### 1. Commit through github.com — zero setup

Every commit made through the web interface — the file editor, **Add file → Upload files**, merging
a pull request — is built and signed by GitHub as it is created. It lands **Verified**, authored by
you. This is why the résumé workflow above is deliberately built around web uploads: your routine
work produces verified commits for free.

### 2. Let a workflow commit for you — verified *and* authored by you

GitHub's GraphQL `createCommitOnBranch` mutation signs commits server-side. Measured on this
repository:

```
committer : GitHub <noreply@github.com>
VERIFIED  : true      reason: valid
```

The **Publish verified commit** workflow uses it. Authorship follows the token:

| Token | Author | Verified |
| --- | --- | --- |
| `GITHUB_TOKEN` (default) | `github-actions[bot]` | ✓ |
| `RESUME_PAT` secret | **you** | ✓ |

To author as yourself — all in the browser, about two minutes:

1. **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new**
   ([direct link](https://github.com/settings/personal-access-tokens/new)).
2. Repository access: **Only select repositories** → this repo.
   Permissions: **Contents → Read and write**. Generate, and copy the token.
3. In this repo: **Settings → Secrets and variables → Actions → New repository secret**,
   named `RESUME_PAT`, paste the token.

From then on, **Actions → Publish verified commit → Run workflow** produces commits authored by you
with a Verified badge, from any device.

**On a machine**, [`scripts/setup-signing.sh`](scripts/setup-signing.sh) does the setup in one run:
creates an SSH key, points git at it, enables signing, prints the public key to register on GitHub
as a **Signing Key** (a separate entry from an authentication key — this is the step most people
miss), and shows the command to re-sign existing commits.

```bash
bash scripts/setup-signing.sh
```

### Publishing to main

`main` carries the site as a single commit built and signed by GitHub:

```
commit    : 9def47040d94   Publish portfolio site
committer : GitHub <noreply@github.com>
VERIFIED  : true      reason: valid
```

**Actions → Publish site to main (verified) → Run workflow** republishes it the same way.

Two GitHub behaviours shape this and are worth knowing rather than rediscovering:

* A commit created with `GITHUB_TOKEN` does not start workflows — loop prevention. The workflow
  therefore asks Pages to deploy explicitly once the commit exists.
* The `github-pages` environment only accepts deployments from the repository's **default branch**.
  Until `main` is the default (Settings → General → Default branch), a deploy from it is rejected
  before any step runs — a job that fails in about two seconds with no logs. That is the signature
  of this, not a build error.

### Commits already in this branch

Commits that were pushed over git cannot be signed retroactively by anyone but you — a signature has
to be made with your key, over that exact commit. They stay unverified. Everything published through
either route above is verified from here on.

## Contact

- Email — jaisurya524126@gmail.com
- LinkedIn — [badathala-jaisurya](https://www.linkedin.com/in/badathala-jaisurya-7b985a224)
- GitHub — [@jaisurya93945](https://github.com/jaisurya93945)
- CipherAI — [cipherai.in](https://cipherai.in)
