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
    """'02 CEH - EC-Council.png' -> 'CEH - EC-Council'."""
    stem = os.path.splitext(os.path.basename(filename))[0]
    stem = re.sub(r'^\s*\d+\s*[-_.)]?\s*', '', stem)
    return re.sub(r'[_]+', ' ', stem).strip()


def collect_resume(src, outdir):
    path = newest(src, set(DOC_TYPES))
    if not path:
        print('no résumé upload in %s — the viewer keeps the parsed version' % src)
        return None
    ext = os.path.splitext(path)[1].lower()
    dest = os.path.join(outdir, 'original' + ext)
    os.makedirs(outdir, exist_ok=True)
    shutil.copy2(path, dest)
    info = {'file': os.path.basename(dest), 'name': os.path.basename(path),
            'type': DOC_TYPES[ext], 'inline': ext == '.pdf',
            'bytes': os.path.getsize(dest)}
    print('résumé: %s -> %s (%.0f KB, %s)'
          % (os.path.basename(path), info['file'], info['bytes'] / 1024,
             'embedded' if info['inline'] else 'download only'))
    return info


def collect_certs(src):
    if not os.path.isdir(src):
        return []
    files = sorted(n for n in os.listdir(src)
                   if not n.startswith('.')
                   and os.path.splitext(n)[1].lower() in IMG_TYPES)
    certs = [{'file': n, 'caption': caption(n), 'type': IMG_TYPES[os.path.splitext(n)[1].lower()]}
             for n in files]
    for c in certs:
        print('cert image: %-40s -> "%s"' % (c['file'], c['caption']))
    if not certs:
        print('no certificate images in %s — the text list is used' % src)
    return certs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--resume-src', default='resume-source/original')
    ap.add_argument('--certs-src', default='assets/img/certs')
    ap.add_argument('--outdir', default='assets/cv')
    ap.add_argument('--out', default='assets/cv/uploads.json')
    args = ap.parse_args()

    payload = {'resume': collect_resume(args.resume_src, args.outdir),
               'certs': collect_certs(args.certs_src)}
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
