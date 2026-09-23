#!/usr/bin/env python3
"""
Turn an uploaded .docx resume into the JSON the site renders from.

Why parse rather than just convert: the site publishes five regional CV
variants from one set of facts. A converted PDF is one fixed layout; parsed
content can be re-shaped per market. So the .docx stays the thing that gets
edited, and this reads it.

The parser leans on structure Word already encodes:
  * bold ALL-CAPS paragraph            -> section heading
  * bold "Label: value"                -> a skills row
  * bold line with tabs and a date      -> a role / project entry
  * list paragraph (numPr)              -> a bullet under the last entry

It is deliberately strict: if the expected sections are missing it exits
non-zero so the deploy fails loudly instead of publishing an empty CV.
"""
import json
import os
import re
import sys
import html
import zipfile
import argparse
import subprocess
import datetime

NS_TAB = re.compile(r'<w:tab[^>]*/>')
TAG = re.compile(r'<[^>]+>')
PARA = re.compile(r'<w:p[ >].*?</w:p>', re.S)

MONTHS = {m: i + 1 for i, m in enumerate(
    ['january', 'february', 'march', 'april', 'may', 'june',
     'july', 'august', 'september', 'october', 'november', 'december'])}
MONTHS.update({m[:3]: i + 1 for i, m in enumerate(
    ['january', 'february', 'march', 'april', 'may', 'june',
     'july', 'august', 'september', 'october', 'november', 'december'])})

HEADINGS = {
    'professional summary': 'summary', 'summary': 'summary', 'profile': 'summary',
    'objective': 'objective',
    'core skills': 'skills', 'skills': 'skills', 'technical skills': 'skills',
    'professional experience': 'experience', 'experience': 'experience',
    'work experience': 'experience', 'employment': 'experience',
    'key projects': 'projects', 'projects': 'projects', 'selected projects': 'projects',
    'certifications': 'certs', 'certificates': 'certs',
    'education': 'education',
    'achievements': 'achievements', 'awards': 'achievements',
    'languages': 'languages',
}


def paragraphs(docx_path):
    with zipfile.ZipFile(docx_path) as z:
        xml = z.read('word/document.xml').decode('utf-8')
    out = []
    for raw in PARA.findall(xml):
        text = html.unescape(TAG.sub('', NS_TAB.sub('\t', raw))).replace('\xa0', ' ')
        out.append({
            'text': text.strip(),
            'raw_text': text,
            'bold': '<w:b/>' in raw or '<w:b ' in raw,
            'bullet': 'numPr' in raw,
        })
    return [p for p in out if p['text']]


def parse_when(text):
    """'March 2026 - Present' -> ('2026-03', None). Unknown shapes return None."""
    t = text.replace('–', '-').replace('—', '-')
    parts = [p.strip() for p in t.split('-')]

    def one(chunk):
        if not chunk:
            return None
        low = chunk.lower()
        if low in ('present', 'current', 'now', 'heute', 'ongoing'):
            return None
        m = re.search(r'([A-Za-z]+)\s+(\d{4})', chunk)
        if m and m.group(1).lower()[:3] in MONTHS:
            return '%s-%02d' % (m.group(2), MONTHS[m.group(1).lower()[:3]])
        m = re.search(r'(\d{1,2})[/.](\d{4})', chunk)
        if m:
            return '%s-%02d' % (m.group(2), int(m.group(1)))
        m = re.search(r'\b(\d{4})\b', chunk)
        if m:
            return '%s-01' % m.group(1)
        return None

    if len(parts) >= 2:
        return one(parts[0]), one(parts[-1])
    single = one(t)
    return single, single


def split_entry(text):
    """'\\tDevOps Engineer | Stackly\\tMarch 2026 - Present' -> parts."""
    cols = [c.strip() for c in text.split('\t') if c.strip()]
    head = cols[0] if cols else text.strip()
    when = cols[-1] if len(cols) > 1 else ''
    if '|' in head:
        title, org = head.split('|', 1)
    else:
        title, org = head, ''
    return title.strip(), org.strip(), when.strip()


def looks_like_heading(p):
    t = p['text']
    if not p['bold'] or p['bullet'] or len(t) > 60:
        return False
    key = t.lower().strip(' :')
    if key in HEADINGS:
        return True
    letters = [c for c in t if c.isalpha()]
    return bool(letters) and all(c.isupper() for c in letters)


def parse(docx_path):
    paras = paragraphs(docx_path)
    if not paras:
        sys.exit('error: %s contains no readable paragraphs' % docx_path)

    doc = {'name': paras[0]['text'], 'contactLines': [], 'sections': {}}

    section = None
    i = 1
    while i < len(paras) and not looks_like_heading(paras[i]):
        doc['contactLines'].append(paras[i]['text'])
        i += 1

    buckets = {}
    for p in paras[i:]:
        if looks_like_heading(p):
            section = HEADINGS.get(p['text'].lower().strip(' :'), p['text'].lower().strip(' :'))
            buckets.setdefault(section, [])
            continue
        if section:
            buckets[section].append(p)

    def entries(items):
        out = []
        for p in items:
            if p['bullet'] and out:
                out[-1]['bullets'].append(p['text'])
            elif p['bullet']:
                out.append({'title': '', 'org': '', 'when': '', 'bullets': [p['text']]})
            else:
                title, org, when = split_entry(p['raw_text'])
                out.append({'title': title, 'org': org, 'when': when, 'bullets': []})
        return out

    result = {
        'name': doc['name'],
        'contact': parse_contact(doc['contactLines']),
        'summary': ' '.join(p['text'] for p in buckets.get('summary', [])),
        'skills': [], 'experience': [], 'projects': [],
        'certs': [], 'education': [], 'achievements': [], 'languages': '',
    }

    for p in buckets.get('skills', []):
        if ':' in p['text']:
            label, value = p['text'].split(':', 1)
            result['skills'].append({'label': label.strip(), 'value': value.strip()})
        elif result['skills']:
            result['skills'][-1]['value'] += ' ' + p['text']

    for e in entries(buckets.get('experience', [])):
        frm, to = parse_when(e['when'])
        result['experience'].append({'role': e['title'], 'org': e['org'],
                                     'from': frm, 'to': to, 'whenRaw': e['when'],
                                     'bullets': e['bullets']})

    for e in entries(buckets.get('projects', [])):
        result['projects'].append({'name': e['title'], 'stack': e['org'],
                                   'bullets': e['bullets']})

    for p in buckets.get('certs', []):
        for chunk in re.split(r'\s*[•·]\s*', p['text']):
            if chunk.strip():
                result['certs'].append(chunk.strip())

    for e in entries(buckets.get('education', [])):
        frm, to = parse_when(e['when'])
        result['education'].append({'degree': e['title'], 'org': e['org'],
                                    'from': frm, 'to': to, 'whenRaw': e['when']})

    for p in buckets.get('achievements', []):
        low = p['text'].lower()
        if low.startswith('languages'):
            result['languages'] = p['text'].split(':', 1)[-1].strip()
            continue
        for chunk in re.split(r'\s*[•·]\s*', p['text']):
            if chunk.strip():
                result['achievements'].append(chunk.strip())

    for p in buckets.get('languages', []):
        result['languages'] = p['text'].split(':', 1)[-1].strip()

    return result


def parse_contact(lines):
    blob = '  '.join(lines)
    def find(pat):
        m = re.search(pat, blob, re.I)
        return m.group(0).strip() if m else ''
    return {
        'raw': lines,
        'email': find(r'[\w.+-]+@[\w-]+\.[a-z]{2,}'),
        'phone': find(r'\+?\d[\d\s()-]{7,}\d'),
        # The uploaded .docx still carries an older vanity URL; the site
        # publishes the current one regardless of what the document says.
        'linkedin': 'linkedin.com/in/badathala-jaisurya'
                    if find(r'linkedin\.com/in/[\w-]+') else '',
        'github': find(r'github\.com/[\w-]+'),
        'site': find(r'[\w.-]+\.github\.io[\w/-]*'),
        'location': (lines[0].split('|')[0].strip() if lines else ''),
    }


def git_time(path):
    """Seconds since the epoch of the commit that last touched *path*.

    A fresh ``git clone`` stamps every working-tree file with the checkout
    time, so ``os.path.getmtime`` cannot tell an old resume from the one that
    was just uploaded. The commit date can, and it is what the person
    uploading actually means by "the latest one". Falls back to mtime outside
    a repository.
    """
    try:
        out = subprocess.run(
            ['git', 'log', '-1', '--format=%ct', '--', path],
            capture_output=True, text=True, timeout=20)
        if out.returncode == 0 and out.stdout.strip():
            return int(out.stdout.strip())
    except (OSError, ValueError, subprocess.SubprocessError):
        pass
    return int(os.path.getmtime(path))


def find_docx(folder):
    """Every .docx anywhere under *folder*, newest upload last.

    Searched recursively so a file dropped into a subfolder - or uploaded
    through the GitHub web UI, which happily creates one - is still found.
    """
    if not os.path.isdir(folder):
        return []
    found = []
    for root, dirs, names in os.walk(folder):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for n in names:
            if n.lower().endswith('.docx') and not n.startswith('~$'):
                found.append(os.path.join(root, n))
    return sorted(found, key=git_time)


def newest_docx(folder):
    files = find_docx(folder)
    return files[-1] if files else None


HEADING_HELP = {
    'summary': 'PROFESSIONAL SUMMARY (or SUMMARY / PROFILE)',
    'experience': 'PROFESSIONAL EXPERIENCE (or EXPERIENCE / WORK EXPERIENCE)',
}


def summarise(payload, args):
    """Write a run report to the GitHub Actions job summary.

    Uploading a resume is a blind action: you commit a .docx and hope the
    parser understood it. This puts what was actually read on the run page,
    so a heading that stopped matching is visible immediately rather than
    after the wrong CV is already live.
    """
    dest = os.environ.get('GITHUB_STEP_SUMMARY')
    if not dest:
        return
    out = ['## Resume build\n']
    for lang, data in sorted(payload.items()):
        out.append('### `%s` — %s\n' % (lang, data['sourceFile']))
        out.append('| Section | Parsed |')
        out.append('| --- | --- |')
        out.append('| Summary | %d words |' % len(data.get('summary', '').split()))
        for key, label in (('experience', 'Roles'), ('projects', 'Projects'),
                           ('skills', 'Skill rows'), ('certs', 'Certifications'),
                           ('education', 'Education'), ('achievements', 'Achievements')):
            out.append('| %s | %d |' % (label, len(data.get(key) or [])))
        bullets = sum(len(e.get('bullets') or []) for e in data.get('experience') or [])
        out.append('| Bullets under roles | %d |' % bullets)
        out.append('')
        roles = data.get('experience') or []
        if roles:
            top = roles[0]
            out.append('**Most recent role read:** %s, %s — %s'
                       % (top.get('role') or '?', top.get('org') or '?',
                          top.get('whenRaw') or '?'))
            out.append('')
        contact = data.get('contact') or {}
        found = [k for k in ('email', 'phone', 'linkedin', 'github') if contact.get(k)]
        out.append('**Contact picked up:** %s' % (', '.join(found) if found else 'none'))
        out.append('')
    out.append('Built from `%s`. Edit the Word file and the site rebuilds itself.'
               % args.source)
    with open(dest, 'a', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', default='resume-source')
    ap.add_argument('--out', default='assets/cv/resume-data.json')
    args = ap.parse_args()

    payload = {}
    for lang in ('en', 'de'):
        path = newest_docx(os.path.join(args.source, lang)) or (
            newest_docx(args.source) if lang == 'en' else None)
        if not path:
            continue
        data = parse(path)
        missing = [k for k in ('summary', 'experience') if not data.get(k)]
        if missing:
            got = sorted(set(k for k in HEADINGS.values() if data.get(k)))
            sys.exit(
                'error: read %s but could not find %s.\n'
                '  expected heading(s): %s\n'
                '  headings it did find: %s\n'
                '  A heading must be its own paragraph, bold and ALL CAPS.\n'
                '  Nothing was published; the live site is unchanged.'
                % (os.path.relpath(path), ' and '.join(missing),
                   '; '.join(HEADING_HELP[m] for m in missing),
                   ', '.join(got) or 'none'))
        data['sourceFile'] = os.path.basename(path)
        data['sourcePath'] = os.path.relpath(path)
        data['updated'] = datetime.datetime.fromtimestamp(
            git_time(path), datetime.timezone.utc).strftime('%Y-%m-%d')
        payload[lang] = data
        print('parsed %-3s %-34s %d roles, %d projects, %d skills, updated %s'
              % (lang, os.path.basename(path), len(data['experience']),
                 len(data['projects']), len(data['skills']), data['updated']))

    if not payload:
        print('no .docx found under %s — the site keeps its built-in resume content'
              % args.source)
        return 0

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
    print('wrote ' + args.out)
    summarise(payload, args)
    return 0


if __name__ == '__main__':
    sys.exit(main())
