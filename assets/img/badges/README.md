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

### Credly

Two fields, and the more specific one wins:

| Field             | Links to                                            |
| ----------------- | --------------------------------------------------- |
| `credlyBadgeId`   | that one badge: `credly.com/badges/<id>/public_url` |
| `verificationUrl` | anything else — currently the badge wall            |

The Credly rows point at the badge wall
(`https://www.credly.com/users/jaisurya1602`) because the two badge ids
below have not been matched to a credential yet:

```
69cc1a14-97d0-407e-9664-b39e54dd8c92
d05f7344-d3c4-4660-9d21-d1155eca1cb1
```

Open each one at `https://www.credly.com/badges/<id>/public_url`, see which
credential it is, and paste the id into that entry's `credlyBadgeId`. The
chip then links straight to the badge instead of the wall.

## CTF profiles

[`content/ctf.json`](../../../content/ctf.json) holds the TryHackMe and Hack
The Box entries. Put your profile URL in `profileUrl` and the card becomes a
link. Add `{ "value": "...", "label": "..." }` pairs to `stats` for anything
you want shown — a card with no stats shows the platform and focus only,
which is correct until you have numbers worth publishing.
