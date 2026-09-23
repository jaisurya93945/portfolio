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

| Token | Dark | Contrast vs bg | Light | Contrast vs bg |
| --- | --- | --- | --- | --- |
| `--bg` | `#100c1f` | — | `#fbf8f5` | — |
| `--ink` | `#f4f1ff` | 17.24:1 | `#171029` | 17.37:1 |
| `--ink-2` | `#a9a2c7` | 7.93:1 | `#554c70` | 7.48:1 |
| `--ink-3` | `#7e789b` | 4.59:1 | `#766e8c` | 4.51:1 |
| `--accent` (coral) | `#ff5f45` | 6.37:1 | `#d83219` | 4.52:1 |
| `--accent-2` (lime) | `#c6f84e` | 15.48:1 | `#5d7c0a` | 4.58:1 |
| `--accent-3` (cyan) | `#57e0ff` | 12.35:1 | `#097b9d` | 4.57:1 |
| `--violet` | `#8b6cff` | 5.20:1 | `#6a45f5` | 5.25:1 |

Every one clears WCAG AA 4.5:1 for normal text.

`--on-accent` is the ink used on an accent fill and **inverts between
themes**: white on the dark theme's coral is only 3.01:1, while near-black
is 6.40:1. The light theme's deeper coral is the other way round — white
4.78:1, near-black 4.03:1. So dark uses `#1a0a06`, light uses `#fff`.

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
  back. Verified across all 45 tabbable controls in both themes.
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
