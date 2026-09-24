# Design system — Badathala Jaisurya portfolio

Source of truth for visual decisions. Generated with the `ui-ux-pro-max`
skill, then corrected where its recommendations did not fit this product.
Every colour figure below was measured, not estimated.

## What the skill recommended, and what was kept

| Element | Skill output | Decision |
| --- | --- | --- |
| Style | Dark Mode (OLED) | **Kept** — matches the product and the brief |
| Pattern (run 1) | FAQ/Documentation Landing | **Rejected** — misrouted; this is not a docs site |
| Pattern (run 2) | Scroll-Triggered Storytelling | **Partly kept** — the "distinct colour per section, building intensity" idea; not the scroll-scrub narrative, which fights a 30-second recruiter scan |
| Style (run 2) | Brutalism | **Rejected** — "raw, unpolished, anti-design" is the opposite of the brief |
| Typography | Inter/Inter, then Lexend Mega, Bebas Neue | **Rejected** — marketing-loud. Bricolage Grotesque + Inter is the right register |
| Motion | Stagger List, `back.out(1.4)` | **Adapted** — staggered rise on reveal, in CSS rather than GSAP (no dependency) |
| Colours | Slate + green | **Rejected** — generic. Indigo base with coral/lime/cyan instead |

The skill states its results are recommendations, not instructions. These
overrides follow that.

## Colour

Base is deep indigo rather than neutral near-black, so the dark has a
temperature of its own.

Contrast below is measured against the **worst surface the token actually
lands on** — `--bg`, `--s1` and `--s2` — not against `--bg` alone. An earlier
revision of this table measured `--bg` only, and every token in it passed
while `--ink-3` was really scoring 4.07:1 on the cards it mostly sits on. A
palette is only as good as its worst pairing.

| Token | Dark | Worst surface | Light | Worst surface |
| --- | --- | --- | --- | --- |
| `--bg` | `#100c1f` | — | `#fbf8f5` | — |
| `--ink` | `#f4f1ff` | 15.23:1 | `#171029` | 16.19:1 |
| `--ink-2` | `#a9a2c7` | 7.00:1 | `#554c70` | 6.97:1 |
| `--ink-3` | `#8781a2` | 4.59:1 | `#706885` | 4.62:1 |
| `--accent` (coral) | `#ff5f45` | 5.63:1 | `#bc2b16` | 5.29:1 |
| `--accent-2` (lime) | `#c6f84e` | 13.67:1 | `#58760a` | 4.61:1 |
| `--accent-3` (cyan) | `#57e0ff` | 10.90:1 | `#097596` | 4.63:1 |
| `--violet` | `#8b6cff` | 4.59:1 | `#6a45f5` | 4.89:1 |
| `--good` | `#c6f84e` | 13.67:1 | `#4d7808` | 4.62:1 |
| `--warn` | `#ffd23f` | 11.74:1 | `#845b00` | 5.32:1 |
| `--serious` | `#ff9a3d` | 8.29:1 | `#aa550d` | 4.61:1 |
| `--critical` | `#ff5f45` | 5.63:1 | `#cb3131` | 4.60:1 |

Every one clears WCAG AA 4.5:1 for normal text on every surface, so no
token is a trap for a component written later.

`--on-accent` is the ink used on an accent fill and **inverts between
themes**: white on the dark theme's coral is only 3.01:1, while near-black
is 6.40:1. The light theme's deeper coral is the other way round — white
6.01:1, near-black 3.21:1. So dark uses `#1a0a06`, light uses `#fff`. Every
accent fill on the page reads this token; none hard-codes `#fff`.

## Type

- **Display** — Bricolage Grotesque, 600–800, `letter-spacing:-.045em`,
  `line-height:.88`. Used for the name (up to 128px) and all headings.
- **Body** — Inter, 400–600. Legibility beats character here.
- **Mono** — JetBrains Mono, for labels, figures and code.
- **Floor** — no text below 12px, including mono labels. The depth switch
  was 9.9px and was raised.

All three are self-hosted variable fonts, latin + latin-ext, so no visitor
IP reaches a third-party CDN.

## Motion

- Reveals rise 18px and fade over 600ms, staggered 60ms by `data-d`.
- The background colour field drifts on a 34–47s loop.
- **Gradients, never `filter: blur()`.** A blurred layer re-rasterises
  whenever it moves: measured at 133ms per frame full-screen, and still
  50ms once split into layers. A radial gradient is already soft, so
  moving it is a pure composite — 16.7ms median and p95, zero dropped
  frames, at 1× and 4× CPU throttle.
- `prefers-reduced-motion` stops the field and renders every reveal in its
  final state.

## Interaction

- Focus ring on every operable control: 2px `--accent-3`, 3px offset.
  Three controls had explicitly cleared their outline and were given one
  back. Verified by real Tab traversal in both themes — `element.focus()`
  does not set `:focus-visible` in Chromium, so a script that focuses
  programmatically reports a missing ring on every control and tells you
  nothing.
- No rule animates `outline`. Twelve controls carried a bare
  `transition:<time>`, which is `transition-property:all`, so the ring grew
  in from 0 over 180–220ms instead of appearing — and `font-weight`
  interpolated to fractional values on the active tab. Every transition
  now names the properties it animates.
- Every control is at least 24×24px (WCAG 2.2 Target Size). Three inline
  links were 16–19px and were padded.
- Adjacent targets keep an 8px gap.
- The cursor is drawn natively via the `cursor` property, not by script —
  a scripted cursor is always a frame behind. Hidden on touch devices.

## Anti-patterns, from this project's own history

- No boxes-in-boxes. A bordered card inside a bordered card is what read
  as clutter.
- No two-line display headline per section. Six of them in a row is six
  manifestos.
- No emoji as icons. SVG only.
- No persisting a reading-depth choice to `localStorage` — it left people
  on a shortened page with no memory of choosing it.
