# Badathala Jaisurya — Portfolio

An interactive, editorial portfolio built with **zero JS dependencies**: hand-written HTML, CSS and
vanilla JavaScript. No framework, no build step, no bundler, no analytics. Available in **11 languages**.

**Live:** https://jaisurya93945.github.io/portfolio/

Positioning: AI Security · DevSecOps · MLOps · Cloud Security.

---

## The interactive centrepiece: a browser-side AI Threat Gateway

The `#lab` section runs a miniature of the detection engine behind
[SentinelCore](https://github.com/jaisurya93945/sentinelcore). Paste any prompt,
tool description or document chunk and it returns a transparent verdict.

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
| Live threat gateway | Paste a prompt and get a scored verdict with the rules that fired, their evidence and their weights. Seven one-click sample payloads. Runs entirely in the browser. |
| Command palette | `Ctrl`/`Cmd` + `K` — jump to any section, project or contact link. Labels follow the active language. |
| Light + dark themes | Full token swap, remembered in `localStorage`, defaulting to the OS preference and applied before first paint. |
| Identifiability chart | Hover or focus any bar for its exact value; arrow keys walk the series, and a table view carries the same numbers for screen readers and print. |
| Project list | Numbered datasheet rows — metrics in a spec column, stack tags beneath — filterable by discipline. |
| Section rail | A fixed 01–08 index that tracks scroll position and expands the active label. |
| View Transitions | Theme and language swaps cross-fade the whole page where the browser supports it; the language swap fetches first and applies inside the transition, so the fade covers a finished change. |
| Skill tabs | Four capability panels with arrow-key roving focus, in a strip that scrolls when it has to. |

## Performance and accessibility

- No JS frameworks. One stylesheet, three small deferred scripts.
- **Zero third-party requests.** Fonts, icons, artwork and logic are all served from this
  origin, so loading a page contacts nobody but GitHub Pages.
- Scroll handlers are `requestAnimationFrame`-batched and passive; observers do the reveal work.
- Full `prefers-reduced-motion` path: typing and reveals stand down.
- Scroll reveal is gated on a class the page sets itself, so a browser without JavaScript — or
  a crawler that never runs it — still sees every section rather than a blank page.
- Semantic landmarks, skip link, visible focus rings, ARIA on tabs, the palette dialog, the
  language listbox and the live findings region. Chart bars are focusable and arrow-navigable,
  and every chart carries a table view.
- Responsive from 320px up, with no horizontal overflow.
- `Person` JSON-LD, Open Graph, Twitter card and per-locale `hreflang` metadata.

### Fonts are self-hosted, and why

Loading a webfont from `fonts.googleapis.com` sends the visitor's IP address to Google on every
page view. The Munich regional court held that to be a GDPR violation where the visitor has not
consented (LG München I, 20 Jan 2022, 3 O 17493/20), and Germany is a target market here.

So Inter and JetBrains Mono are served from `assets/fonts/` instead, declared in
`assets/css/fonts.css`. Both are variable fonts under the SIL Open Font License 1.1, subset to
`latin` and `latin-ext`: 172 KB in total, of which a typical visitor fetches 78 KB, and one file
per family covers every weight. The two faces used above the fold are preloaded.

To add or update a family, edit `FAMILIES` in
[`scripts/fetch-fonts.py`](scripts/fetch-fonts.py) and run it — it downloads the files and
regenerates `fonts.css`. It is the only thing here that ever talks to Google, it runs by hand
rather than in the build, and its output is committed.

## Layout

```
index.html                 single-page portfolio
resume.html                print-styled résumé (screen + @page A4)
assets/
  css/style.css            design tokens, both themes, all components
  css/fonts.css            @font-face for the self-hosted families
  fonts/*.woff2            Inter + JetBrains Mono, variable, latin & latin-ext
  js/i18n.js               locale loader, detection, DOM swapping
  js/scanner.js            threat-detection engine (framework-free, unit-testable)
  js/main.js               reveals, palette, tabs, filters, theme, charts, lab wiring
  i18n/*.json              10 translated locales (English lives in index.html)
  img/favicon.svg          shield mark
  img/og.svg               social preview card
  js/resume.js             résumé content + per-region rules
scripts/fetch-fonts.py       downloads the webfonts and writes fonts.css
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

`main` is the only branch and the deploy source is **GitHub Actions** (Settings → Pages → Build and
deployment). Checkout is deliberately full-depth: the résumé parser picks the newest `.docx` by the
date of the commit that added it, and a shallow clone collapses every file onto one commit.

If the site ever looks out of date, it is almost always because the workflow never fired — check
**Actions** before suspecting the build.

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

## Adding a certificate or a badge

Two different things, two different places, and they are kept apart on purpose.

* A **badge** is artwork an issuer mints — Credly, TryHackMe, Hack The Box. It belongs in
  **07 Badges** and arrives on its own.
* A **certification** is something you sat and passed. It belongs in **06 Certifications** and
  is listed by hand.

Earning a Credly badge does **not** add a row to the certifications list. If one of them is
also a certification you want listed — Fortinet NSE 1, for instance — add it yourself with the
JSON block below. A credential that has badge artwork shows that artwork as its own row
thumbnail; it does not appear twice.

Nothing here needs a computer — every step is a file upload on github.com.

### A badge — nothing to do

Badges look after themselves. On every deploy, and again every morning, the site fetches them
from the issuer:

| Where you earn it | What arrives |
| --- | --- |
| **Credly** (Linux Foundation, Fortinet, Cisco, CompTIA, AWS…) | artwork, title, issuer, issue date |
| **TryHackMe** | the live level / rank / points / rooms strip (individual badges are rate-limited — see below) |
| **Hack The Box** | the live badge for account `1830127` |

Earn a badge today and it is on the site by tomorrow morning. If you want it sooner, open
**Actions → Publish verified commit → Run workflow**.

**One exception.** Every TryHackMe host refuses the build — the application
with HTTP 429 and the asset host outright — so their individual badges have to
be saved by hand. Right-click each badge on
[your badges tab](https://tryhackme.com/p/nikki1602?tab=badges), save it, and
upload it to `assets/img/badges/` named `thm-<slug>.png`, taking the slug from
the badge's own share link: `thm-hash-cracker.png`, `thm-terminaled.png`,
`thm-owasp-10.png`, `thm-mr-robot.png`. The file name becomes the title.
Anything dropped in that folder appears on the wall regardless of what the
providers answered. Only the level/rank/points strip updates itself.

### A certificate — one file, optionally one entry

**Step 1 — upload the scan.** Go to [`assets/img/certs/`](assets/img/certs/) on github.com and
press **Add file → Upload files**. Name it by number: `2.jpeg`, `3.jpeg`, `4.png`… (`1.jpeg` is
the CEH one already there). PDF works too.

That is genuinely all that is required. An uploaded file with no entry still appears — it is
matched to the certificate list by position, so `2.jpeg` attaches to the second certificate.

**Step 2 — only if you want to add a *new* certificate,** not just a scan of one already listed:
edit [`content/certificates.json`](content/certificates.json) on github.com (pencil icon) and
copy one of the blocks:

```json
{
  "id": "aws-saa",
  "title": "AWS Certified Solutions Architect – Associate",
  "mark": "AWS",
  "issuer": "Amazon Web Services",
  "platform": "Credly",
  "date": "2026-03-14",
  "credentialId": "ABC123",
  "verificationUrl": "https://www.credly.com/users/jaisurya1602",
  "category": "Cloud",
  "image": "",
  "credlyBadgeId": ""
}
```

Only `id`, `title` and `issuer` are required. Everything else can stay `""` and simply will not
print — an empty `date` shows no date rather than a blank dash.

| Field | What it does |
| --- | --- |
| `mark` | the two or three letters shown when there is no artwork yet |
| `platform` | the small chip on the right — becomes a link when `verificationUrl` is set |
| `date` / `expires` | printed under the title as "14 Mar 2026 · renews …" |
| `credentialId` | printed too, and copyable from the enlarged view |
| `status` | set to `"in-progress"` for something you are still studying for |
| `category` | one of Cybersecurity, Cloud, DevOps, AI/ML, Networking, Programming, Other |

**Title it exactly as the issuer does.** If the certificate also has a Credly badge, matching the
title is what pairs the two — the artwork, issue date and badge link then attach themselves.

### Where each thing shows up

* **Certifications (06)** — the list, with the scan as a thumbnail; click a row to see the full
  certificate.
* **Badges (07)** — the artwork wall and the CTF platform cards.

## Verified commits

A **Verified** badge means GitHub checked a cryptographic signature made by a key belonging to the
author. That is why no tool can produce one on your behalf — it would have to hold a key you do not
control. Commits pushed over plain git come back `"verified": false, "reason": "unsigned"`, which is
expected rather than a misconfiguration.

There are exactly two ways to get the badge, and **both work from a phone**.

> **Never paste a private signing key anywhere — not into a chat, an issue, or a file in this
> repository.** A private key is compromised the moment it leaves your machine and has to be
> rotated. Only the **public** half is ever registered on GitHub, and neither route below needs
> the private half to leave your device.

Measured from this cloud session on 2026-09-26, so the limits are first-hand rather than assumed:

| Route | Result |
| --- | --- |
| `git push` over HTTPS | `verified: false, reason: unsigned` |
| MCP `create_or_update_file` | commit created, `verified: false, reason: unsigned` |
| REST `PUT /contents/...` direct | `403 — write access to this GitHub API path is not permitted through this proxy` |
| GraphQL `createCommitOnBranch` | `403 — GitHub GraphQL is not available from Claude Code sessions` |

So an agent working from here cannot produce a Verified commit, and the honest fix is not to give
it a key — it is to let GitHub or your own machine do the signing, as below.

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

That workflow also runs on a daily schedule (06:12 UTC) and commits whatever the badge sync brought
back from Credly, TryHackMe and Hack The Box. So the credential artwork arrives in the repository
under a Verified commit with your name on it, and the site keeps working even when a provider is
down, because the files are committed rather than only built.

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
to be made with your key, over that exact commit. They stay unverified.

`RESUME_PAT` is configured, so the workflow route does produce commits authored by you and carrying
the badge — for example `chore: rebuild resume content from uploaded .docx`, whose committer reads
`GitHub <noreply@github.com>` with `VERIFIED: true`.

### Why site commits are not verified, and what it would take

Two rules this repository follows pull against each other, so it is worth stating the trade rather
than rediscovering it:

1. **Only `main` exists.** No feature branches; `prune-branches.yml` enforces it.
2. **Verified badges** require GitHub to build the commit, through the GraphQL
   `createCommitOnBranch` mutation. There is no other route without holding a signing key.

The mutation runs inside Actions, and Actions can only commit content that is already in the
repository. Getting site changes there in the first place means a plain `git push` — which is the
unverified commit. `seed-main.yml` resolves this by publishing *from a source branch* onto `main`,
which is precisely the branch rule (1) forbids. Running it with `source: main` would only add a
commit with an empty diff on top of content already published, so it is not done.

The result: résumé and certificate content published by the workflows is verified; site code pushed
from a development session is authored correctly but unverified. To change that, relax rule (1) and
let a working branch exist — `seed-main.yml` is already written for exactly that flow.

Note also that GraphQL is unreachable from some sandboxed development environments (the API answers
`403` with an explanation), so `commit-verified.py` is an Actions-only tool there even when a token
with `contents:write` is present.

## Contact

- Email — jaisurya524126@gmail.com
- LinkedIn — [badathala-jaisurya](https://www.linkedin.com/in/badathala-jaisurya/)
- GitHub — [@jaisurya93945](https://github.com/jaisurya93945)
- CipherAI — [cipherai.in](https://cipherai.in)
