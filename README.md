# Badathala Jaisurya — Portfolio

An interactive, graphics-heavy portfolio built with **zero dependencies**: hand-written HTML, CSS
and vanilla JavaScript. No framework, no build step, no bundler, no trackers, no external fonts —
the whole site is a handful of static files served straight from GitHub Pages.

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
  at 100, plus a chained-technique bonus when several high-severity rules fire together
  (an override *plus* an exfil sink is an actual kill chain).
- **Defensive-intent damping** so legitimate blue-team questions are not punished by the very
  detector built for that audience.
- **Policy layer** mapping the 0–100 score to `ALLOW` / `WARN` / `BLOCK`.

Everything runs client-side. No text typed into the panel ever leaves the browser.

Engine: [`assets/js/scanner.js`](assets/js/scanner.js) — pure, side-effect free, and testable
under Node:

```bash
node -e "global.window={};require('./assets/js/scanner.js');
const g=global.window.ThreatGateway;
Object.entries(g.SAMPLES).forEach(([k,v])=>{
  const r=g.scan(v);
  console.log(k.padEnd(11), String(r.score).padStart(3), r.action);
});"
```

## Other interaction

| Feature | Notes |
| --- | --- |
| Neural-mesh hero canvas | Particle count scales with viewport, DPR capped at 2, pointer repulsion, pauses when off-screen or the tab is hidden, and never starts under `prefers-reduced-motion`. Toggleable from the nav. |
| Command palette | `Ctrl`/`Cmd` + `K` — fuzzy jump to any section, project or contact link, full keyboard navigation. |
| Scroll choreography | `IntersectionObserver`-driven reveals, animated counters, skill bars and the hero precision ring. |
| Project filtering | Filter by AI Security / MLOps / DevSecOps / Product. |
| Skill tabs | Four capability panels with arrow-key roving focus. |
| Pointer response | Cursor glow plus per-card spotlight tracking on fine-pointer devices only. |

## Performance and accessibility

- No frameworks, no external requests — system font stack, inline SVG icons.
- One stylesheet and two small scripts, both `defer`-loaded.
- Canvas work is throttled by `IntersectionObserver` and `visibilitychange`; scroll handlers are
  `requestAnimationFrame`-batched and passive.
- Full `prefers-reduced-motion` path: animation, typing and the canvas all stand down.
- Semantic landmarks, skip link, visible focus rings, ARIA on tabs, the palette dialog and the
  live findings region.
- Responsive from 320px up, with no horizontal overflow.
- `Person` JSON-LD, Open Graph and Twitter card metadata.

## Layout

```
index.html                 single-page portfolio
resume.html                print-styled résumé (screen + @page A4)
assets/
  css/style.css            all styling, custom-property theming
  js/scanner.js            threat-detection engine (framework-free, unit-testable)
  js/main.js               canvas, reveals, palette, tabs, filters, lab wiring
  img/favicon.svg          shield mark
  img/og.svg               social preview card
  Badathala-Jaisurya-Resume.pdf
.github/workflows/pages.yml  GitHub Pages deployment
```

## Running locally

No build step — open `index.html`, or serve the folder:

```bash
python3 -m http.server 8080
# then http://localhost:8080
```

## Deployment

Pushes to `main` publish via [`.github/workflows/pages.yml`](.github/workflows/pages.yml).
Enable it once under **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Contact

- Email — jaisurya524126@gmail.com
- LinkedIn — [badathala-jaisurya](https://www.linkedin.com/in/badathala-jaisurya-7b985a224)
- GitHub — [@jaisurya93945](https://github.com/jaisurya93945)
- CipherAI — [cipherai.in](https://cipherai.in)
