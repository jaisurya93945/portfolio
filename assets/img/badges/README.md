# Badge images

Drop badge artwork here — the PNG or SVG a platform gives you (Credly,
Google Cloud Skills Boost, Microsoft Learn, and so on).

## Naming

Name the file after the credential's `id` in
[`content/certificates.json`](../../../content/certificates.json):

| Credential id           | File to drop here        |
| ----------------------- | ------------------------ |
| `ceh`                   | `ceh.png`                |
| `lf-devsecops`          | `lf-devsecops.png`       |
| `lf-linux-essentials`   | `lf-linux-essentials.png`|
| `gcp-foundations`       | `gcp-foundations.png`    |
| `python-ai`             | `python-ai.png`          |
| `comptia-sec-net`       | `comptia-sec-net.png`    |

The badge replaces the monogram in that credential's row. Nothing else
changes, and a credential with no badge still reads correctly — the monogram
stays.

Square artwork works best; anything is contained, never cropped.
`.png`, `.svg`, `.webp`, `.jpg` and `.avif` are all fine.

## Verification links

`platform` in `certificates.json` names where the badge lives ("Credly",
"Google Cloud", …) and shows as a small chip. `verificationUrl` turns that
chip into a link. **Leave it empty until you have the real URL** — an
unverifiable "Verify" link is worse than none.

## CTF profiles

[`content/ctf.json`](../../../content/ctf.json) holds the TryHackMe and Hack
The Box entries. Put your profile URL in `profileUrl` and the card becomes a
link. Add `{ "value": "...", "label": "..." }` pairs to `stats` for anything
you want shown — a card with no stats shows the platform and focus only,
which is correct until you have numbers worth publishing.
