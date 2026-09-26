#!/usr/bin/env python3
"""
Pull the badges and platform stats that their own providers publish, so the
credentials section keeps itself current instead of being hand-edited.

Everything here is best-effort. A provider that is down, rate-limited or has
changed its endpoint must never fail the build: the last good file stays in
the repository and the site serves that. The script prints a report of what
it could and could not reach, so a silent staleness is still visible in the
Actions log.

No credentials, no tokens, no scraping behind a login — only the public
endpoints these platforms publish for exactly this purpose.
"""
import json, os, pathlib, re, sys, urllib.error, urllib.request

ROOT     = pathlib.Path(__file__).resolve().parent.parent
BADGES   = ROOT / 'assets' / 'img' / 'badges'
CONTENT  = ROOT / 'content'
UA       = 'Mozilla/5.0 (compatible; portfolio-badge-sync/1.0; +https://github.com/jaisurya93945/portfolio)'
TIMEOUT  = 20

CREDLY_USER = 'jaisurya1602'
THM_USER    = 'nikki1602'
HTB_PROFILE = '01a0908b-02ca-7053-89e6-470823381aa3'

# Badge ids pasted from the Credly embed snippets. Discovery below may find
# more; these are the floor, so a discovery failure still resolves these two.
CREDLY_SEED = [
    '69cc1a14-97d0-407e-9664-b39e54dd8c92',
    'd05f7344-d3c4-4660-9d21-d1155eca1cb1',
]

report = []


def log(ok, what, detail=''):
    report.append(('ok  ' if ok else 'MISS', what, detail))
    print(('  ok   ' if ok else '  MISS ') + what + (('  — ' + detail) if detail else ''))


def get(url, binary=False):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        if r.status != 200:
            raise urllib.error.HTTPError(url, r.status, 'not 200', r.headers, None)
        return r.read() if binary else r.read().decode('utf-8', 'replace')


LAST_ERROR = {}


def try_get(url, binary=False):
    """Never raises. The reason is kept, because a silent miss is a miss you
    cannot fix: 403 from a datacentre IP, 404 from a renamed endpoint and a
    timeout all look identical otherwise."""
    try:
        return get(url, binary)
    except urllib.error.HTTPError as e:
        LAST_ERROR[url] = 'HTTP %s' % e.code
    except urllib.error.URLError as e:
        LAST_ERROR[url] = 'no route (%s)' % (getattr(e, 'reason', e),)
    except Exception as e:                                   # noqa: BLE001
        LAST_ERROR[url] = type(e).__name__ + ': ' + str(e)[:90]
    return None


def why(urls):
    return '; '.join(u.split('//')[-1].split('/')[0] + ' ' + LAST_ERROR.get(u, 'no data')
                     for u in urls)


def slug(s):
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', str(s).lower())).strip('-')


def save_image(url, stem):
    """Download a badge image, keeping whatever extension it really is."""
    data = try_get(url, binary=True)
    if not data or len(data) < 200:
        return ''
    ext = '.png'
    if data[:4] == b'\xff\xd8\xff\xe0' or data[:3] == b'\xff\xd8\xff':
        ext = '.jpg'
    elif data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        ext = '.webp'
    elif data.lstrip()[:5].lower() == b'<svg ' or b'<svg' in data[:300].lower():
        ext = '.svg'
    elif data[:8] != b'\x89PNG\r\n\x1a\n':
        return ''                                            # not an image we trust
    BADGES.mkdir(parents=True, exist_ok=True)
    (BADGES / (stem + ext)).write_bytes(data)
    return 'assets/img/badges/' + stem + ext


# --------------------------------------------------------------------------
# Credly — the Open Badges assertion endpoint is public per badge, and the
# profile feed lists every badge the account has earned.
# --------------------------------------------------------------------------
def credly_from_page(badge_id, tried):
    """The public badge page carries Open Graph tags, which is the most
    stable public description of a badge: a title and the artwork."""
    url = 'https://www.credly.com/badges/' + badge_id + '/public_url'
    tried.append(url)
    html = try_get(url)
    if not html:
        return None
    def og(prop):
        m = re.search(r'<meta[^>]+property=["\']og:%s["\'][^>]+content=["\']([^"\']+)' % prop, html) or \
            re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:%s["\']' % prop, html)
        return m.group(1) if m else ''
    title = (og('title') or '').split(' was issued')[0].strip()
    img = og('image')
    if not title and not img:
        return None
    return {'id': badge_id, 'title': title, 'issuer': '', 'description': '',
            'issuedOn': '', 'imageUrl': img,
            'url': 'https://www.credly.com/badges/' + badge_id + '/public_url'}


def node(value, tried=None):
    """Open Badges lets any nested object be either embedded or a URI that
    points at it. Credly returns `badge` and `issuer` as URIs, so follow one
    hop when we are handed a string."""
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value.startswith('http'):
        if tried is not None:
            tried.append(value)
        raw = try_get(value)
        if raw:
            try:
                d = json.loads(raw)
                if isinstance(d, dict):
                    return d
            except ValueError:
                pass
    return {}


def image_of(value):
    """`image` is a URL, or an object carrying one under id/url."""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return value.get('id') or value.get('url') or ''
    return ''


def credly_assertion(badge_id, tried):
    for url in ('https://api.credly.com/v1/obi/v2/badge_assertions/' + badge_id,
                'https://api.credly.com/v1/obi/v2/badge_assertions/' + badge_id + '.json',
                'https://www.credly.com/api/v1/obi/v2/badge_assertions/' + badge_id):
        tried.append(url)
        raw = try_get(url)
        if not raw:
            continue
        try:
            d = json.loads(raw)
        except ValueError:
            continue
        if not isinstance(d, dict):
            continue
        b = node(d.get('badge'), tried)
        iss = node(b.get('issuer'), tried)
        title = b.get('name') or ''
        img = image_of(b.get('image')) or image_of(d.get('image'))
        if not title and not img:
            continue
        return {
            'id': badge_id,
            'title': title,
            'issuer': iss.get('name') or '',
            'description': (b.get('description') or '')[:400],
            'issuedOn': (d.get('issuedOn') or '')[:10],
            'imageUrl': img,
            'url': 'https://www.credly.com/badges/' + badge_id + '/public_url',
        }
    return credly_from_page(badge_id, tried)


def credly_discover(tried):
    """Every badge on the public profile, so a new one appears on its own."""
    ids = []
    for url in ('https://www.credly.com/users/%s/badges.json' % CREDLY_USER,
                'https://api.credly.com/v1/users/%s/badges' % CREDLY_USER,
                'https://www.credly.com/users/%s/badges?sort=-state_updated_at' % CREDLY_USER,
                'https://www.credly.com/users/%s' % CREDLY_USER):
        tried.append(url)
        raw = try_get(url)
        if not raw:
            continue
        try:
            d = json.loads(raw)
            rows = d.get('data') if isinstance(d, dict) else d
            for row in rows or []:
                if isinstance(row, dict) and row.get('id'):
                    ids.append(row['id'])
        except ValueError:
            ids += re.findall(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', raw)
        if ids:
            break
    return ids


def sync_credly():
    tried = []
    found = credly_discover(tried)
    log(bool(found), 'credly: discover badges on the public profile',
        ('%d found' % len(set(found))) if found else why(tried))

    seen, out = set(), []
    for bid in list(dict.fromkeys(found + CREDLY_SEED)):
        if bid in seen:
            continue
        seen.add(bid)
        bt = []
        try:
            rec = credly_assertion(bid, bt)
        except Exception as e:                               # noqa: BLE001
            log(False, 'credly: ' + bid, 'parse failed — ' + type(e).__name__ + ': ' + str(e)[:80])
            continue
        if not rec:
            log(False, 'credly: ' + bid, why(bt))
            continue
        stem = 'credly-' + (slug(rec['title']) or bid[:8])
        rec['image'] = save_image(rec['imageUrl'], stem) if rec['imageUrl'] else ''
        rec.pop('imageUrl', None)
        out.append(rec)
        log(True, 'credly: ' + (rec['title'] or bid), rec['image'] or 'no artwork')

    if out:
        CONTENT.mkdir(parents=True, exist_ok=True)
        (CONTENT / 'credly.json').write_text(
            json.dumps({'profileUrl': 'https://www.credly.com/users/' + CREDLY_USER,
                        'badges': out}, indent=2, ensure_ascii=False) + '\n')
    return out


# --------------------------------------------------------------------------
# TryHackMe — publishes a badge PNG that regenerates with the account, so the
# level, rank, points and room count are always whatever they are today.
# --------------------------------------------------------------------------
def sync_thm():
    u = 'https://tryhackme-badges.s3.amazonaws.com/%s.png' % THM_USER
    p = save_image(u, 'thm-live')
    log(bool(p), 'tryhackme: live badge', p or why([u]))
    return p


# --------------------------------------------------------------------------
# Hack The Box — the badge image is keyed by the numeric account id, which the
# UUID profile URL does not carry. Resolve it from the public profile if we
# can; otherwise say so rather than guessing an id.
# --------------------------------------------------------------------------
def sync_htb():
    num = os.environ.get('HTB_USER_ID', '').strip()
    if not num:
        html = try_get('https://app.hackthebox.com/profile/' + HTB_PROFILE) or \
               try_get('https://profile.hackthebox.com/profile/' + HTB_PROFILE) or ''
        m = re.search(r'/badge/image/(\d+)', html) or re.search(r'"user_id"\s*:\s*(\d+)', html)
        num = m.group(1) if m else ''
    if not num:
        log(False, 'hackthebox: resolve the numeric account id',
            'profile is client-rendered; set the HTB_USER_ID repository variable')
        return ''
    p = save_image('https://www.hackthebox.com/badge/image/' + num, 'htb-live')
    log(bool(p), 'hackthebox: live badge (id %s)' % num, p or 'badge endpoint unreachable')
    return p


def write_live_badges(paths):
    """Record only the badge files that exist, so the page never requests one
    that a provider has not given us yet."""
    f = CONTENT / 'ctf.json'
    try:
        rows = json.loads(f.read_text())
    except Exception:                                        # noqa: BLE001
        return
    changed = False
    for row in rows:
        want = paths.get(row.get('id'), None)
        if want is None:
            continue
        if row.get('liveBadge', '') != want:
            row['liveBadge'] = want
            changed = True
    if changed:
        f.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + '\n')
        log(True, 'ctf.json: live badge paths updated')


def guard(fn, label, default=''):
    """One provider's surprise must not cost the others their sync."""
    try:
        return fn()
    except Exception as e:                                   # noqa: BLE001
        log(False, label, 'crashed — ' + type(e).__name__ + ': ' + str(e)[:100])
        return default


def main():
    print('badge sync')
    guard(sync_credly, 'credly', [])
    thm = guard(sync_thm, 'tryhackme')
    htb = guard(sync_htb, 'hackthebox')
    guard(lambda: write_live_badges({'tryhackme': thm, 'hackthebox': htb}),
          'ctf.json: live badge paths')
    missed = [r for r in report if r[0] != 'ok  ']
    print('\n%d reached, %d missed — misses keep the committed files, they never fail the build'
          % (len(report) - len(missed), len(missed)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
