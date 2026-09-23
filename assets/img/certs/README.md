# Certificate images

Certificates are now **data-driven**. The metadata lives in
[`content/certificates.json`](../../../content/certificates.json); the image
files live here. Both are optional — an entry with no image still appears,
showing a placeholder rather than a broken picture.

## Adding one

1. Put the image here. Name it after the entry's `id`, e.g. `ceh.png` for
   the entry whose `"id": "ceh"`. It is matched automatically.
2. Fill in that entry in `content/certificates.json`.

```json
{
  "id": "ceh",
  "title": "Certified Ethical Hacker",
  "issuer": "EC-Council",
  "date": "2026",
  "image": "",
  "credentialId": "",
  "verificationUrl": "",
  "category": "Cybersecurity"
}
```

- `image` can stay empty — a file named after the `id` is picked up on its own.
  Set it explicitly only to point somewhere else.
- `credentialId` shows with a copy button when filled.
- `verificationUrl` becomes a **Verify credential** link when filled.
- `category` drives the filter row: `Cybersecurity`, `Cloud`, `DevOps`,
  `AI/ML`, `Networking`, `Programming`, `Other`. Filters only appear for
  categories that actually have entries.
- `"status": "in-progress"` marks one as not yet earned.

**Leave `credentialId` and `verificationUrl` empty unless you have the real
values.** They are shown to visitors as verification, so a placeholder there
would be a false claim.

## Where the name on the site comes from

The `title` and `issuer` fields in `content/certificates.json` — that is the
one place to edit them.

An image dropped here with **no** matching entry still shows up, captioned
from its file name (`1.png` → no caption; `CEH - EC-Council.png` → that
caption). Useful for a quick upload, but an entry gives you the issuer, date
and verification link.

## Formats

`.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`, `.svg`, `.gif` render as images.
A `.pdf` opens in the lightbox with an **Open PDF** button.

Images are never cropped (`object-fit: contain`) and are lazy-loaded.
