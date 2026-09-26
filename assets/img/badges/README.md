# Badge images

## These mostly fill themselves now

`scripts/sync-badges.py` runs on every deploy and again on a daily schedule.
It pulls, from the issuers' own public endpoints and with no credentials:

| Source | What it fetches | Where it lands |
| ------ | --------------- | -------------- |
| Credly | every badge on the public profile — name, issuer, date, artwork | `content/credly.json` + `credly-*.png` here |
| TryHackMe | the live badge, which carries the level, rank, points and rooms | `thm-live.png` here |
| Hack The Box | the live badge, **once `HTB_USER_ID` is set** (see below) | `htb-live.png` here |

So a badge earned on Credly tomorrow appears on the site within a day,
with no edit. Every fetch is best-effort: a provider that is down leaves
the committed file in place and the build still succeeds. The Actions log
lists what answered.

**Hack The Box** is keyed by the numeric account id rather than the UUID in
the shareable profile URL. It is `1830127`, taken from
`app.hackthebox.com/users/1830127`, and it is in `scripts/sync-badges.py`
— nothing to configure. Set the `HTB_USER_ID` repository variable only if
the account id ever changes; it overrides the built-in value.

### TryHackMe badges must be saved by hand

Every TryHackMe host refuses the build. Measured against CI, not assumed:

| Host | Answer |
| ---- | ------ |
| `tryhackme.com` (API and share pages) | HTTP 429 |
| `assets.tryhackme.com` (artwork) | unreachable |
| `tryhackme-badges.s3.amazonaws.com` | 403 for badge keys |

The one exception is the profile strip at
`tryhackme-badges.s3.amazonaws.com/nikki1602.png`, which is why the level,
rank, points and room count still update themselves. The individual badges
do not, and no amount of retrying changes that.

**Save them instead — about two minutes.** On
[your badges tab](https://tryhackme.com/p/nikki1602?tab=badges), right-click
each badge and Save image. Then **Add file → Upload files** into this
folder, named `thm-` plus the slug from the badge's own share link:

| Badge | File to upload | Shows as |
| ----- | -------------- | -------- |
| Hash Cracker | `thm-hash-cracker.png` | Hash Cracker |
| Terminaled | `thm-terminaled.png` | Terminaled |
| OWASP 10 | `thm-owasp-10.png` | OWASP 10 |
| Mr Robot | `thm-mr-robot.png` | Mr Robot |

The file name becomes the title, the tile is labelled TryHackMe and links
back to your badges tab. Anything dropped here shows on the wall whether or
not a provider answered — that is what makes this route the dependable one.

## Adding artwork by hand

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
