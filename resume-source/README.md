# Résumé source

Drop your Word file here and the site rebuilds itself. **No computer needed** —
GitHub's web interface can upload files from a phone or tablet.

## How to update your résumé

1. Open **[`resume-source/en/`](en/)** on github.com.
2. **Add file → Upload files**, choose your `.docx`, then **Commit changes**.
3. Wait ~2 minutes. The site republishes automatically.

That commit is made through the GitHub web interface, so it lands with a
**Verified** badge — see [../README.md](../README.md#verified-commits).

## What happens to it

`scripts/parse-resume-docx.py` reads the document and pulls out your summary,
skills, roles, projects, certifications, education and achievements. That
content then feeds:

* the live viewer at `resume.html`, in all five regional formats;
* five rendered PDFs in `assets/cv/`, one per market.

You are editing one Word file; the site keeps producing a German *Lebenslauf*,
a UK CV, a US resume and the rest from it.

## Folders

| Folder | Purpose |
| --- | --- |
| `en/` | Your English résumé. This is the one that matters. |
| `de/` | Optional German résumé. Without it the German view keeps German headings and shows the English body — normal for tech roles, but a real German document reads better. |

If several `.docx` files are present the most recently modified one wins, so
old versions can stay as history.

## What the parser expects

It reads the structure Word already saves, so a normal résumé works as-is:

* **Bold, ALL-CAPS lines** are section headings — `PROFESSIONAL SUMMARY`,
  `CORE SKILLS`, `PROFESSIONAL EXPERIENCE`, `KEY PROJECTS`, `CERTIFICATIONS`,
  `EDUCATION`, `ACHIEVEMENTS`.
* **Bold `Label: value` lines** under `CORE SKILLS` become skill rows.
* **Bold role lines** like `Job Title | Company⇥March 2026 – Present` become
  entries; the tab before the date matters.
* **Bulleted list items** attach to the entry above them.

Keep those headings and it will keep working. If a document cannot be read the
deploy **fails loudly** rather than publishing an empty CV, and the previously
published site stays up untouched.
