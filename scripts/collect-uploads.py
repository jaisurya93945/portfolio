#!/usr/bin/env python3
"""
Publish the files Jaisurya uploads by hand: a résumé to show verbatim, and
certificate images.

Two upload folders, both read straight from the repository so a phone and the
GitHub web uploader are enough:

  resume-source/original/   the résumé exactly as it should appear. A PDF is
                            embedded in the viewer and offered for download;
                            any other format is offered for download only,
                            because browsers cannot display it inline.

  assets/img/certs/         certificate images. The file name becomes the
                            caption, so "CEH - EC-Council.png" reads as
                            "CEH - EC-Council". A number prefix orders them
                            and is stripped: "01 CEH.png" sorts first.

Both are optional. With neither present the site keeps the parsed résumé and
the text-only credential list, so a missing upload never breaks a deploy.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import argparse

DOC_TYPES = {'.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
             '.doc': 'application/msword', '.odt': 'application/vnd.oasis.opendocument.text',
             '.rtf': 'application/rtf', '.txt': 'text/plain'}
IMG_TYPES = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
             '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml',
             '.gif': 'image/gif', '.pdf': 'application/pdf'}


def git_time(path):
    """Commit date of *path*; a fresh clone gives every file the same mtime."""
    try:
        out = subprocess.run(['git', 'log', '-1', '--format=%ct', '--', path],
                             capture_output=True, text=True, timeout=20)
        if out.returncode == 0 and out.stdout.strip():
            return int(out.stdout.strip())
    except (OSError, ValueError, subprocess.SubprocessError):
        pass
    return int(os.path.getmtime(path))


def newest(folder, exts):
    if not os.path.isdir(folder):
        return None
    found = []
    for root, dirs, names in os.walk(folder):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for n in names:
            if n.startswith(('.', '~$')):
                continue
            if os.path.splitext(n)[1].lower() in exts:
                found.append(os.path.join(root, n))
    if not found:
        return None
    return sorted(found, key=git_time)[-1]


def caption(filename):
    """Caption from the file name, or none at all.

    '02 CEH - EC-Council.png' -> 'CEH - EC-Council'
    '1.png'                   -> ''   (a bare number is an ordering hint,
                                       not a caption; the image speaks for
                                       itself and an empty strip of text
                                       under it would only look broken)
    """
    stem = os.path.splitext(os.path.basename(filename))[0]
    if re.fullmatch(r'\s*\d+\s*', stem):
        return ''
    stem = re.sub(r'^\s*\d+\s*[-_.)]\s*', '', stem)
    return re.sub(r'[_]+', ' ', stem).strip()


def to_pdf(path, outdir):
    """Convert a document to PDF with LibreOffice. None if it cannot."""
    if not shutil.which('soffice'):
        return None
    out = os.path.join(outdir, os.path.splitext(os.path.basename(path))[0] + '.pdf')
    try:
        r = subprocess.run(['soffice', '--headless', '--norestore',
                            '--convert-to', 'pdf', '--outdir', outdir, path],
                           capture_output=True, text=True, timeout=180)
    except (OSError, subprocess.SubprocessError) as e:
        print('  LibreOffice did not run (%s)' % e)
        return None
    if os.path.exists(out) and os.path.getsize(out) > 0:
        return out
    print('  LibreOffice could not convert it: %s'
          % (r.stderr or r.stdout or 'no output').strip().splitlines()[-1:])
    return None


def to_html(path):
    """Convert .docx to HTML with mammoth. None if it cannot."""
    try:
        import mammoth
    except ImportError:
        print('  mammoth is not installed; skipping the HTML fallback')
        return None
    try:
        with open(path, 'rb') as f:
            return mammoth.convert_to_html(f).value
    except Exception as e:                       # any malformed document
        print('  mammoth could not read it (%s)' % e)
        return None


HTML_SHELL = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s</title>
<style>
 body{margin:0;padding:48px 40px;background:#fff;color:#14151a;
      font:15px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
      max-width:820px;margin-inline:auto}
 p{margin:0 0 9px} strong{font-weight:650}
 ul{margin:6px 0 12px 20px;padding:0} li{margin:3px 0}
 a{color:#0d7d72}
 @media(prefers-color-scheme:dark){body{background:#fff;color:#14151a}}
</style></head><body>
%(body)s
</body></html>"""


def collect_resume(src, outdir):
    path = newest(src, set(DOC_TYPES))
    if not path:
        print('no résumé upload in %s — the viewer keeps the parsed version' % src)
        return None
    ext = os.path.splitext(path)[1].lower()
    os.makedirs(outdir, exist_ok=True)

    # Clear what a previous upload left behind, or switching from a PDF to a
    # .docx would leave the old PDF sitting there to be served.
    import glob as _glob
    for stale in _glob.glob(os.path.join(outdir, 'original*')):
        os.remove(stale)

    # The original always ships, so Download hands over the real file.
    dest = os.path.join(outdir, 'original' + ext)
    shutil.copy2(path, dest)
    info = {'file': os.path.basename(dest), 'name': os.path.basename(path),
            'type': DOC_TYPES[ext], 'inline': ext == '.pdf',
            'view': os.path.basename(dest) if ext == '.pdf' else None,
            'viewType': 'pdf' if ext == '.pdf' else None,
            'bytes': os.path.getsize(dest)}

    # Anything that is not already a PDF gets rendered so it can be shown in
    # place rather than only downloaded: LibreOffice first, because it keeps
    # the layout, then mammoth, which keeps the content.
    if ext != '.pdf':
        print('rendering %s so it can be displayed in place' % os.path.basename(path))
        pdf = to_pdf(path, outdir)
        if pdf:
            view = os.path.join(outdir, 'original-view.pdf')
            shutil.move(pdf, view)
            info.update(inline=True, view=os.path.basename(view), viewType='pdf')
            print('  LibreOffice produced a PDF (%.0f KB)' % (os.path.getsize(view) / 1024))
        elif ext == '.docx':
            body = to_html(path)
            if body:
                view = os.path.join(outdir, 'original-view.html')
                with open(view, 'w', encoding='utf-8') as f:
                    f.write(HTML_SHELL % {'title': os.path.basename(path), 'body': body})
                info.update(inline=True, view=os.path.basename(view), viewType='html')
                print('  mammoth produced HTML (%.0f KB)' % (os.path.getsize(view) / 1024))

    print('résumé: %s -> %s (%.0f KB, %s)'
          % (os.path.basename(path), info['file'], info['bytes'] / 1024,
             'shown in place as ' + info['viewType'] if info['inline'] else 'download only'))
    return info


def collect_certs(src):
    if not os.path.isdir(src):
        return []
    def order(name):
        """Sort 1, 2, 10 rather than 1, 10, 2."""
        stem = os.path.splitext(name)[0]
        m = re.match(r'\s*(\d+)', stem)
        return (0, int(m.group(1)), stem) if m else (1, 0, stem.lower())

    files = sorted((n for n in os.listdir(src)
                    if not n.startswith('.')
                    and os.path.splitext(n)[1].lower() in IMG_TYPES),
                   key=order)
    certs = [{'file': n, 'caption': caption(n), 'type': IMG_TYPES[os.path.splitext(n)[1].lower()]}
             for n in files]
    for i, c in enumerate(certs, 1):
        print('cert %2d: %-40s -> %s'
              % (i, c['file'], ('"%s"' % c['caption']) if c['caption'] else '(no caption)'))
    if not certs:
        print('no certificate images in %s — the text list is used' % src)
    return certs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--resume-src', default='resume-source/original')
    ap.add_argument('--certs-src', default='assets/img/certs')
    ap.add_argument('--badges-src', default='assets/img/badges')
    ap.add_argument('--outdir', default='assets/cv')
    ap.add_argument('--out', default='assets/cv/uploads.json')
    args = ap.parse_args()

    payload = {'resume': collect_resume(args.resume_src, args.outdir),
               'certs': collect_certs(args.certs_src),
               'badges': collect_certs(args.badges_src)}
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
    print('wrote ' + args.out)

    dest = os.environ.get('GITHUB_STEP_SUMMARY')
    if dest:
        with open(dest, 'a', encoding='utf-8') as f:
            f.write('\n## Uploads\n\n')
            r = payload['resume']
            f.write('**Résumé:** %s\n\n' % (
                '`%s` (%.0f KB) — %s' % (r['name'], r['bytes'] / 1024,
                    'shown inline and downloadable' if r['inline'] else 'download only')
                if r else 'none uploaded; the parsed version is used'))
            f.write('**Certificate images:** %d\n' % len(payload['certs']))
            for c in payload['certs']:
                f.write('- %s\n' % c['caption'])
    return 0


if __name__ == '__main__':
    sys.exit(main())
