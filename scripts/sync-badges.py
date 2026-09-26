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
import json, os, pathlib, time, re, sys, urllib.error, urllib.request

ROOT     = pathlib.Path(__file__).resolve().parent.parent
BADGES   = ROOT / 'assets' / 'img' / 'badges'
CONTENT  = ROOT / 'content'
UA       = 'Mozilla/5.0 (compatible; portfolio-badge-sync/1.0; +https://github.com/jaisurya93945/portfolio)'
TIMEOUT  = 20

CREDLY_USER = 'jaisurya1602'
THM_USER    = 'nikki1602'
HTB_PROFILE = '01a0908b-02ca-7053-89e6-470823381aa3'
# The badge endpoint is keyed by the numeric account id, which the UUID
# profile URL does not carry. Taken from app.hackthebox.com/users/1830127,
# so it is not guessed. HTB_USER_ID overrides it if the account ever moves.
HTB_USER_ID = '1830127'

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


def try_get(url, binary=False, retries=0, pause=4.0):
    """429 means "later", not "no". TryHackMe throttles GitHub's shared
    runner addresses, so a single attempt reports a miss for a service that
    would have answered."""
    for attempt in range(retries + 1):
        out = _try_once(url, binary)
        if out is not None:
            return out
        if 'HTTP 429' not in LAST_ERROR.get(url, '') or attempt == retries:
            break
        time.sleep(pause * (attempt + 1))
    return None


def _try_once(url, binary=False):
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

    seen, titles, out = set(), set(), []
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
        key = slug(rec['title']) or bid
        if key in titles:
            log(False, 'credly: ' + bid,
                'resolved to "%s", which another id already gave — skipped'
                % rec['title'])
            continue
        titles.add(key)
        out.append(rec)
        log(True, 'credly: ' + (rec['title'] or bid), rec['image'] or 'no artwork')

    if len(seen) > len(out):
        log(True, 'credly: %d of %d discovered ids were badges'
            % (len(out), len(seen)),
            'the rest are page ids the profile happens to carry')
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
    """Hack The Box publishes a badge image per numeric account id. Several
    hostnames have served it over the years; try each and say which answered
    rather than assuming the current one is still the current one."""
    num = os.environ.get('HTB_USER_ID', '').strip() or HTB_USER_ID
    if not num:
        log(False, 'hackthebox: numeric account id',
            'unknown — set the HTB_USER_ID repository variable')
        return ''
    tried = []
    for host in ('https://www.hackthebox.com', 'https://app.hackthebox.com',
                 'https://www.hackthebox.eu'):
        url = host + '/badge/image/' + num
        tried.append(url)
        p = save_image(url, 'htb-live')
        if p:
            log(True, 'hackthebox: live badge (id %s)' % num, p)
            return p
    log(False, 'hackthebox: live badge (id %s)' % num, why(tried))
    return ''


def thm_badges():
    """TryHackMe's badges, from whichever public shape is still serving them.

    They have moved this more than once, so try the documented API forms and
    then the profile page's embedded state, and report which answered.

    In practice all four answer HTTP 429: TryHackMe throttles GitHub's shared
    runner addresses. One short retry is kept in case that ever lifts, but
    not more — a longer backoff added seventy seconds to every build and
    never once succeeded. Badges saved by hand into assets/img/badges are
    the route that works, and the wall renders them either way.
    """
    tried, rows = [], []
    for url in ('https://tryhackme.com/api/v2/badges/get?username=' + THM_USER,
                'https://tryhackme.com/api/badges/get/' + THM_USER,
                'https://tryhackme.com/api/v2/public-profile?username=' + THM_USER,
                'https://tryhackme.com/p/' + THM_USER):
        tried.append(url)
        raw = try_get(url, retries=1, pause=3.0)
        if not raw:
            continue
        blobs = []
        try:
            blobs = [json.loads(raw)]
        except ValueError:
            # a page rather than an API: pull the state React was hydrated with
            for m in re.finditer(r'<script[^>]+id="__NEXT_DATA__"[^>]*>(.*?)</script>',
                                 raw, re.S):
                try:
                    blobs.append(json.loads(m.group(1)))
                except ValueError:
                    pass
        for b in blobs:
            rows += harvest_badges(b)
        if rows:
            break
    if not rows:
        log(False, 'tryhackme: badges', why(tried))
    return rows, tried


def harvest_badges(obj, out=None, depth=0):
    """Walk an arbitrary JSON body for things that look like a badge.

    The shape of these responses is not stable, so match on the fields a
    badge must have — a name and a picture — instead of a fixed path.
    """
    if out is None:
        out = []
    if depth > 8:
        return out
    if isinstance(obj, list):
        for v in obj:
            harvest_badges(v, out, depth + 1)
        return out
    if not isinstance(obj, dict):
        return out

    name = obj.get('name') or obj.get('title') or obj.get('badgeName')
    img = (obj.get('imageLink') or obj.get('image') or obj.get('icon')
           or obj.get('badgeImage') or obj.get('imageUrl'))
    if isinstance(img, dict):
        img = img.get('url') or img.get('src')
    if isinstance(name, str) and isinstance(img, str) and name.strip() and img.strip():
        url = img if img.startswith('http') else 'https://assets.tryhackme.com' + \
              ('' if img.startswith('/') else '/') + img
        out.append({'title': name.strip(),
                    'description': (obj.get('description') or '')[:300],
                    'imageUrl': url})
    for v in obj.values():
        harvest_badges(v, out, depth + 1)
    return out


def sync_thm_badges():
    rows, _ = thm_badges()
    if not rows:
        return []
    seen, out = set(), []
    for b in rows:
        key = slug(b['title'])
        if not key or key in seen:
            continue
        seen.add(key)
        path = save_image(b['imageUrl'], 'thm-' + key)
        if not path:
            continue
        out.append({'id': 'thm-' + key, 'title': b['title'], 'issuer': 'TryHackMe',
                    'description': b['description'], 'issuedOn': '', 'image': path,
                    'url': 'https://tryhackme.com/p/' + THM_USER + '?tab=badges'})
        log(True, 'tryhackme badge: ' + b['title'], path)
    return out


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


def merge_feed(extra):
    """Fold badges from a second issuer into the same feed the wall reads,
    so the page has one list to render rather than one per platform."""
    if not extra:
        return
    f = CONTENT / 'credly.json'
    try:
        feed = json.loads(f.read_text())
    except Exception:                                        # noqa: BLE001
        feed = {'profileUrl': 'https://www.credly.com/users/' + CREDLY_USER, 'badges': []}
    have = {b.get('id') for b in feed.get('badges', [])}
    feed['badges'] = feed.get('badges', []) + [b for b in extra if b['id'] not in have]
    f.write_text(json.dumps(feed, indent=2, ensure_ascii=False) + '\n')
    log(True, 'feed: %d badge(s) total' % len(feed['badges']))


def main():
    print('badge sync')
    guard(sync_credly, 'credly', [])
    guard(lambda: merge_feed(sync_thm_badges()), 'tryhackme badges')
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
