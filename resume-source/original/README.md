# Résumé shown exactly as you made it

Drop **one file** in this folder and the viewer gains an **Original** tab that
shows it verbatim — no parsing, no re-formatting, no regional rewrite.

## How

1. Open this folder on github.com.
2. **Add file → Upload files**, choose your file, **Commit changes**.
3. Two minutes later the site has it.

A phone browser is enough. Because the upload goes through github.com, the
commit also lands with a **Verified** badge.

## What happens to each format

| You upload | Visitor sees |
| --- | --- |
| `.pdf` | The document **exactly as you made it**, embedded in the page. |
| `.docx` | Converted and **shown in the page**; Download still gives the original `.docx`. |
| `.doc`, `.odt`, `.rtf`, `.txt` | Shown in the page if the converter can read it, otherwise Download only. |

Both a PDF and a `.docx` display on the page — you asked for that and it works.
A PDF is still the safer choice if the exact layout matters, because it is
shown byte-for-byte rather than re-rendered.

**How `.docx` is converted.** LibreOffice runs first and keeps the page
layout. If it cannot read the file, a second converter takes over that keeps
the text, headings, bold runs and bullets but not the exact page geometry.
Either way the file you uploaded is what the Download button hands over.

## Notes

- If several files are here, the **most recently committed** one wins. Old
  versions can stay as history.
- The file keeps its own name for the download, so a recruiter saves
  `Badathala Jaisurya CV 2026.pdf`, not `original.pdf`.
- This folder is independent of [`../en/`](../en/). That one feeds the parsed,
  five-region CV; this one is the untouched document. Use either or both — with
  both, the visitor gets the Original tab *and* the regional versions.
- Empty folder = nothing changes. The viewer just shows the parsed versions.
