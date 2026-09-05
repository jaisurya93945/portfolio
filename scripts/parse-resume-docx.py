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
        'linkedin': find(r'linkedin\.com/in/[\w-]+'),
        'github': find(r'github\.com/[\w-]+'),
        'site': find(r'[\w.-]+\.github\.io[\w/-]*'),
        'location': (lines[0].split('|')[0].strip() if lines else ''),
    }


def newest_docx(folder):
    if not os.path.isdir(folder):
        return None
    files = [os.path.join(folder, f) for f in os.listdir(folder)
             if f.lower().endswith('.docx') and not f.startswith('~$')]
    if not files:
        return None
    return max(files, key=os.path.getmtime)


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
            sys.exit('error: %s parsed but missing %s — check the headings in the document'
                     % (os.path.basename(path), ', '.join(missing)))
        data['sourceFile'] = os.path.basename(path)
        payload[lang] = data
        print('parsed %-8s %s  (%d roles, %d projects, %d skills)'
              % (lang, os.path.basename(path), len(data['experience']),
                 len(data['projects']), len(data['skills'])))

    if not payload:
        print('no .docx found under %s — the site keeps its built-in resume content'
              % args.source)
        return 0

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
    print('wrote ' + args.out)
    return 0


if __name__ == '__main__':
    sys.exit(main())
