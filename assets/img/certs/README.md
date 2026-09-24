# Certificate images

Certificates are now **data-driven**. The metadata lives in
[`content/certificates.json`](../../../content/certificates.json); the image
files live here. Both are optional — an entry with no image still appears,
showing a placeholder rather than a broken picture.

## Adding one

Put the image here, then fill in its entry in `content/certificates.json`.
Two naming schemes are matched automatically:

- **By number** — `1.png` is the first entry in `certificates.json`, `2.png`
  the second, and so on. Simplest if you are uploading a batch.
- **By id** — `ceh.png` matches the entry whose `"id": "ceh"`. Order-proof,
  so it survives reordering the file.

Either way the image is attached to that entry; it never creates a second,
untitled card for the same certificate.

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

An image dropped here that matches **no** entry — a name that is neither an
`id` nor a position that exists — still shows up, captioned from its file
name (`CEH - EC-Council.png` → that caption). Useful for a quick upload, but
an entry gives you the issuer, date and verification link.

## Formats

`.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`, `.svg`, `.gif` render as images.
A `.pdf` opens in the lightbox with an **Open PDF** button.

Images are never cropped (`object-fit: contain`) and are lazy-loaded.
