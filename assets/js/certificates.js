/* ===========================================================================
   Certificates — data-driven gallery and lightbox.

   Source of truth is content/certificates.json. Adding a certificate means
   dropping the image in assets/img/certs/ and adding one entry; no markup
   changes. Images uploaded without a matching entry are picked up too, from
   the uploads manifest, so the folder alone is enough to get something on
   screen.

   Every path is relative, because the site is served from a project
   subpath (/portfolio/), not a domain root.
   =========================================================================== */
(function (global) {
  'use strict';

  var CATEGORIES = ['Cybersecurity', 'Cloud', 'DevOps', 'AI/ML', 'Networking',
                    'Programming', 'Other'];

  function t(key, fallback) {
    var v = global.I18N && global.I18N.t ? global.I18N.t(key) : key;
    return (v === key || v === undefined) ? fallback : v;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  /* --- data ------------------------------------------------------------- */

  function load() {
    return Promise.all([
      fetch('content/certificates.json', { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch('assets/cv/uploads.json', { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      fetch('content/credly.json', { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (res) {
      var manifest = res[1] || {};
      var list = merge(res[0] || [], manifest.certs || []);
      list = attachBadges(list, manifest.badges || []);
      return { list: attachCredly(list, res[2]), credly: res[2],
               uploaded: manifest.badges || [] };
    });
  }

  /* An uploaded file is matched to an entry by id or by a slug of its title,
     then - for files named 1, 2, 3 - by position in certificates.json.
     Anything left over still gets shown rather than silently dropped. */
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function stem(f) { return String(f).replace(/\.[^.]+$/, ''); }

  function attach(c, u) {
    c.image = 'assets/img/certs/' + u.file;
    c.type = u.type;
  }

  function attachBadges(meta, badges) {
    if (!badges || !badges.length) return meta;
    var byName = {};
    badges.forEach(function (b) { byName[slug(stem(b.file))] = b.file; });
    meta.forEach(function (c) {
      var hit = byName[slug(c.id)] || byName[slug(c.title)];
      if (hit) c.badge = 'assets/img/badges/' + hit;
    });
    return meta;
  }

  /* scripts/sync-badges.py pulls the badge artwork and titles from Credly on
     every build, so a badge earned tomorrow arrives without an edit here. A
     synced badge is matched to a credential by its pinned id first, then by
     title; an unmatched one still shows on the wall. */
  function attachCredly(meta, feed) {
    if (!feed || !feed.badges || !feed.badges.length) return meta;
    feed.badges.forEach(function (b) {
      var hit = null;
      meta.forEach(function (c) {
        if (hit) return;
        if (c.credlyBadgeId && c.credlyBadgeId === b.id) hit = c;
      });
      if (!hit) meta.forEach(function (c) {
        if (hit || !b.title) return;
        if (slug(c.title) === slug(b.title)) hit = c;
      });
      if (!hit) return;
      hit.credlyBadgeId = hit.credlyBadgeId || b.id;
      if (b.image && !hit.badge) hit.badge = b.image;
      if (b.issuedOn && !hit.date) hit.date = b.issuedOn;
      if (b.issuer && !hit.issuer) hit.issuer = b.issuer;
      b.matched = true;
    });
    return meta;
  }

  /* --- the badge wall ---------------------------------------------------
     Artwork at its own aspect ratio, never cropped to a square: the shape a
     badge was issued in is part of it. The band stays hidden until there is
     something real to put in it. */
  /* The two live platform strips are not wall badges — they are the
     figures shown on the CTF cards — so they are never tiled here. */
  var LIVE_STRIP = /^(thm|htb)-live$/;

  /* A filename is a usable title once the issuer prefix and the dashes are
     gone: "thm-advent-of-cyber.png" reads as "Advent of Cyber". */
  function titleFromFile(file) {
    var stem = String(file).replace(/\.[^.]+$/, '').replace(/^(credly|thm|htb)-/, '');
    /* htb-badge-214 is an achievement id, not a name. The sync supplies the
       real name through the feed; if it could not reach the page, "Badge 214"
       is worse than saying plainly what the tile is. */
    if (/^badge-\d+$/.test(stem)) return t('badge.htb', 'Hack The Box achievement');
    var small = /^(of|the|and|in|for|to|a|an|on|with|vs)$/;
    /* Initialisms, so a filename does not turn OWASP into Owasp. */
    var caps = /^(owasp|ctf|thm|htb|nse|aws|gcp|api|sql|xss|xxe|ssrf|osint|siem|soc|iam|ai|ml|ceh|lf)$/;
    /* Course codes: two to four letters then digits — lfc108, lfel1006. */
    var code = /^[a-z]{2,4}\d{2,6}$/;
    /* Compounds a naive capitalise gets wrong. */
    var exact = { devsecops: 'DevSecOps', openssf: 'OpenSSF', kubernetes: 'Kubernetes',
                  javascript: 'JavaScript', github: 'GitHub', gitlab: 'GitLab',
                  postgresql: 'PostgreSQL', nodejs: 'Node.js', tryhackme: 'TryHackMe',
                  hackthebox: 'Hack The Box' };
    return stem.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
      .split(' ')
      .map(function (w, i) {
        if (exact[w]) return exact[w];                    /* "DevSecOps" */
        if (caps.test(w) || code.test(w)) return w.toUpperCase();   /* "OWASP 10", "LFC108" */
        if (i && small.test(w)) return w;                 /* "Advent of Cyber" */
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ')
      /* a slug flattens "1.0" to "1-0", which then reads as two words */
      .replace(/\b(\d+) (\d+)\b/g, '$1.$2');
  }

  function issuerFromFile(file) {
    if (/^credly-/.test(file)) return 'Credly';
    if (/^thm-/.test(file)) return 'TryHackMe';
    if (/^htb-/.test(file)) return 'Hack The Box';
    return '';
  }

  /* A hand-dropped badge still points somewhere useful: the wall it came
     from. Without this the tile renders as a div and loses the card. */
  function homeForFile(file) {
    if (/^thm-/.test(file)) return 'https://tryhackme.com/p/nikki1602?tab=badges';
    if (/^htb-/.test(file)) return 'https://profile.hackthebox.com/profile/01a0908b-02ca-7053-89e6-470823381aa3';
    return 'https://www.credly.com/users/jaisurya1602';
  }

  function renderWall(feed, wrap, grid, uploaded) {
    if (!wrap || !grid) return;
    var items = [], seen = {};
    function add(img, title, issuer, url) {
      if (!img || seen[img]) return;
      seen[img] = 1;
      items.push({ img: img, title: title, issuer: issuer, url: url });
    }
    (feed && feed.badges ? feed.badges : []).forEach(function (b) {
      add(b.image, b.title, b.issuer, b.url);
    });
    /* Certifications are deliberately not a source here. A badge and a
       certification are different things and each has its own section; a
       credential that happens to have badge artwork shows that artwork as
       its own row thumbnail, not as a second tile on the wall. */

    /* Anything dropped into assets/img/badges by hand shows too. That is
       what makes the wall dependable: TryHackMe throttles the build (HTTP
       429 from a shared runner address), so a badge saved from the browser
       is the reliable route, not the fallback. */
    (uploaded || []).forEach(function (u) {
      var stem = String(u.file).replace(/\.[^.]+$/, '');
      if (LIVE_STRIP.test(stem)) return;
      add('assets/img/badges/' + u.file, titleFromFile(u.file),
          issuerFromFile(u.file), homeForFile(u.file));
    });

    if (!items.length) return;

    grid.textContent = '';
    items.forEach(function (it, i) {
      var li = el('li');
      var a = el(it.url ? 'a' : 'div', 'btile');
      if (it.url) { a.href = it.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      a.style.setProperty('--stagger', (i % 8) * 45 + 'ms');
      a.classList.add('cert-enter');

      var im = el('img');
      im.src = it.img; im.loading = 'lazy'; im.decoding = 'async';
      im.alt = it.title ? (it.title + (it.issuer ? ' — ' + it.issuer : '')) : '';
      /* artwork that 404s removes its own tile rather than leaving a
         broken-image glyph on the page */
      im.addEventListener('error', function () {
        li.remove();
        if (!grid.children.length) wrap.hidden = true;
      });
      a.appendChild(im);
      if (it.title) a.appendChild(el('b', '', it.title));
      if (it.issuer) a.appendChild(el('span', '', it.issuer));
      li.appendChild(a);
      grid.appendChild(li);
    });
    wrap.hidden = false;
    var count = document.getElementById('badgeCount');
    if (count) count.textContent = String(grid.children.length);
    var note = document.getElementById('badgeEmpty');
    if (note) note.hidden = true;
  }

  function merge(meta, uploads) {
    var used = {};

    /* 1. by id or title */
    meta.forEach(function (c) {
      if (c.image) return;
      var want = [slug(c.id), slug(c.title)];
      for (var i = 0; i < uploads.length; i++) {
        var u = uploads[i];
        if (used[u.file]) continue;
        if (want.indexOf(slug(stem(u.file))) !== -1 ||
            (u.caption && want.indexOf(slug(u.caption)) !== -1)) {
          attach(c, u); used[u.file] = 1; break;
        }
      }
    });

    /* 2. by position: 1.png is the first entry, 2.png the second. This is the
       naming the upload folder documents, so it must not fall through to the
       leftover branch and create a second, untitled card for the same cert. */
    uploads.forEach(function (u) {
      if (used[u.file]) return;
      if (!/^\d+$/.test(stem(u.file))) return;
      var c = meta[parseInt(stem(u.file), 10) - 1];
      if (c && !c.image) { attach(c, u); used[u.file] = 1; }
    });

    /* 3. whatever is left becomes an entry of its own */
    uploads.forEach(function (u) {
      if (used[u.file]) return;
      meta.push({ id: slug(stem(u.file)) || slug(u.file), title: u.caption || '',
                  issuer: '', date: '', image: 'assets/img/certs/' + u.file,
                  type: u.type, credentialId: '', verificationUrl: '',
                  category: 'Other' });
    });
    return meta;
  }

  /* --- credential list --------------------------------------------------- */

  /* The list and the gallery describe the same six credentials. Rendering both
     from certificates.json means the titles are edited in one place, and the
     markup in index.html stays as the no-JS fallback rather than a second
     copy that drifts. */
  function renderList(list, grid) {
    if (!grid || !list.length) return;
    grid.textContent = '';
    list.forEach(function (c, i) {
      var li = el('li', 'crow' + (c.status === 'in-progress' ? ' prog' : ''));
      li.style.setProperty('--stagger', (i % 6) * 45 + 'ms');
      li.classList.add('cert-enter');

      /* The mark slot is small on purpose. It holds a monogram by default and
         upgrades to badge artwork when a file exists — so the layout never
         depends on an image that has not been uploaded. */
      var m = el('span', 'cmark');
      /* badge artwork first, then the certificate scan, then the monogram.
         Each step degrades to the next, so a row always has something in it
         and never a broken image. */
      var thumb = c.badge || (c.image && !/pdf$/i.test(c.type || c.image) ? c.image : '');
      if (thumb) {
        var bi = el('img');
        bi.src = thumb; bi.loading = 'lazy'; bi.decoding = 'async'; bi.alt = '';
        bi.addEventListener('error', function () {
          m.textContent = mark(c);
          m.classList.remove('has-badge', 'has-shot-img');
        });
        m.appendChild(bi);
        m.classList.add(c.badge ? 'has-badge' : 'has-shot-img');
      } else {
        m.textContent = mark(c);
      }
      m.setAttribute('aria-hidden', 'true');
      li.appendChild(m);

      var main = el('span', 'cmain');
      main.appendChild(el('b', '', c.title || ''));
      if (c.issuer) main.appendChild(el('span', 'cissuer', c.issuer));

      /* Issued, numbered, expiring: the three facts that separate a
         credential from a claim. Each appears only when it is known —
         an empty date is left out rather than printed as a dash. */
      var facts = [];
      if (c.date) facts.push(when(c.date));
      if (c.credentialId) facts.push(c.credentialId);
      if (c.expires) facts.push(t('cert.renews', 'renews') + ' ' + when(c.expires));
      /* The platform belongs on this line rather than in a column of its
         own: it is another fact about the credential, and a column that
         holds one short chip costs the row a third of its width. */
      var meta = el('span', 'cfacts');
      facts.forEach(function (f, i) {
        if (i) meta.appendChild(el('i', 'sep', '\u00b7'));
        meta.appendChild(el('span', '', f));
      });
      if (c.platform) {
        var href = verifyUrl(c), pl;
        if (href) {
          pl = el('a', 'cplat is-link', c.platform);
          pl.href = href; pl.target = '_blank'; pl.rel = 'noopener noreferrer';
          pl.setAttribute('aria-label', t('cert.verify', 'Verify credential') + ' \u2014 ' + c.platform);
        } else {
          pl = el('span', 'cplat', c.platform);
        }
        meta.appendChild(pl);
      }
      if (meta.childNodes.length) main.appendChild(meta);
      li.appendChild(main);

      /* status carries an icon as well as a colour */
      var done = c.status !== 'in-progress';
      var st = el('span', 'cs ' + (done ? 'ok' : 'wip'));
      var ic = el('i', '', done ? '\u2713' : '\u25F7');
      ic.setAttribute('aria-hidden', 'true');
      st.appendChild(ic);
      st.appendChild(el('span', '', done ? t('cert.earned', 'earned') : t('cert.wip', 'in progress')));
      li.appendChild(st);

      if (c.image) {
        li.classList.add('has-shot');
        li.setAttribute('data-index', String(list.indexOf(c)));
        li.tabIndex = 0;
        li.setAttribute('role', 'button');
        li.setAttribute('aria-label', t('cert.view', 'View certificate') + ' — ' + (c.title || ''));
      }
      grid.appendChild(li);
    });
  }

  /* A Credly badge id points at that one badge; without it the link falls back
     to the badge wall, which still verifies the credential. A verificationUrl
     that verifies nothing is never invented here - an empty field means the
     platform renders as a plain label. */
  function verifyUrl(c) {
    if (c.credlyBadgeId) return 'https://www.credly.com/badges/' + c.credlyBadgeId + '/public_url';
    return c.verificationUrl || '';
  }

  function when(iso) {
    if (!iso) return '';
    var d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
    if (isNaN(d.getTime())) return iso;
    try {
      return d.toLocaleDateString(document.documentElement.lang || 'en',
        { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
    } catch (e) { return iso; }
  }

  function mark(c) {
    return c.mark || (c.title || '?').trim().charAt(0).toUpperCase();
  }

  /* --- CTF platforms ---------------------------------------------------
     Same contract as the credentials list: content/ctf.json is the one place
     the handles, figures and profile links are edited, and the markup in
     index.html is the no-JS fallback rather than a second copy. A platform
     without a profileUrl renders as a plain card - never a dead link. */
  function renderCtf(list, host) {
    if (!host || !list.length) return;
    host.textContent = '';
    list.forEach(function (c, i) {
      var link = !!c.profileUrl;
      var card = el(link ? 'a' : 'article', 't c6 ctf' + (link ? ' is-link' : ''));
      if (link) {
        card.href = c.profileUrl;
        card.target = '_blank';
        card.rel = 'noopener noreferrer me';
        card.setAttribute('aria-label', (c.platform || '') + ' \u2014 ' +
          t('ctf.profile', 'view profile'));
      }
      card.style.setProperty('--stagger', i * 60 + 'ms');
      card.classList.add('cert-enter');

      var top = el('div', 'ctf-top');
      var m = el('span', 'cmark', c.mark || (c.platform || '?').charAt(0));
      m.setAttribute('aria-hidden', 'true');
      top.appendChild(m);
      var name = el('b', '', c.platform || '');
      if (c.handle) name.appendChild(el('span', 'ctf-handle', '@' + c.handle));
      top.appendChild(name);
      card.appendChild(top);

      if (c.stats && c.stats.length) {
        var ul = el('ul', 'ctf-stats');
        c.stats.forEach(function (st) {
          var li = el('li');
          li.appendChild(el('b', '', st.value));
          li.appendChild(el('span', '', st.key ? t(st.key, st.label) : st.label));
          ul.appendChild(li);
        });
        card.appendChild(ul);
      }
      if (c.focus) card.appendChild(el('p', '', c.focusKey ? t(c.focusKey, c.focus) : c.focus));

      /* the platform's own badge, rebuilt by scripts/sync-badges.py. If the
         sync has never reached that provider the file is not there, and the
         card drops it rather than showing a broken image. */
      if (c.liveBadge) {
        var im = el('img', 'ctf-live');
        im.src = c.liveBadge; im.loading = 'lazy'; im.decoding = 'async';
        im.alt = c.liveBadgeAlt || ((c.platform || '') + ' badge');
        im.addEventListener('error', function () { im.remove(); });
        card.appendChild(im);
      }
      if (link) {
        var go = el('span', 'ctf-go', t('ctf.profile', 'view profile'));
        go.setAttribute('aria-hidden', 'true');
        card.appendChild(go);
      }
      host.appendChild(card);
    });
  }

  /* --- gallery ---------------------------------------------------------- */

  function build(list, host, countEl, filterHost, empty) {
    var active = 'all';

    function visible() {
      return list.filter(function (c) { return active === 'all' || c.category === active; });
    }

    function tile(c, index) {
      var a = el('a', 'cert-shot');
      a.href = c.image || verifyUrl(c) || '#';
      a.setAttribute('data-index', index);

      if (c.image) {
        if (/pdf$/i.test(c.type || c.image)) {
          var doc = el('span', 'cert-pdf', 'PDF');
          a.appendChild(doc);
        } else {
          var img = el('img');
          img.src = c.image;
          img.loading = 'lazy';
          img.decoding = 'async';
          img.alt = c.title ? (c.title + (c.issuer ? ' — ' + c.issuer : '')) : t('cert.alt', 'Certificate');
          /* A metadata entry whose image is missing must not render a broken
             icon; it falls back to the same panel an entry with no image gets. */
          img.addEventListener('error', function () {
            a.replaceChild(placeholder(c), img);
            a.classList.add('no-image');
          });
          a.appendChild(img);
        }
      } else {
        a.appendChild(placeholder(c));
        a.classList.add('no-image');
      }

      var meta = el('span', 'cert-meta');
      if (c.title) meta.appendChild(el('b', '', c.title));
      var sub = [c.issuer, c.date].filter(Boolean).join(' · ');
      if (sub) meta.appendChild(el('span', '', sub));
      if (c.status === 'in-progress') meta.appendChild(el('i', 'cert-wip', t('cert.wip', 'in progress')));
      if (c.title || sub) a.appendChild(meta);
      return a;
    }

    function placeholder(c) {
      var box = el('span', 'cert-none');
      box.appendChild(el('span', 'cert-none-mark', (c.title || '?').trim().charAt(0).toUpperCase()));
      box.appendChild(el('span', 'cert-none-txt', t('cert.noimage', 'Image not uploaded yet')));
      return box;
    }

    function draw() {
      host.textContent = '';
      var shown = visible();
      shown.forEach(function (c) { host.appendChild(tile(c, list.indexOf(c))); });
      if (countEl) {
        countEl.textContent = shown.length + ' / ' + list.length;
      }
      host.hidden = shown.length === 0;
      if (empty) empty.hidden = shown.length !== 0;
    }

    /* filters, but only for categories that actually have entries */
    if (filterHost) {
      var present = CATEGORIES.filter(function (cat) {
        return list.some(function (c) { return c.category === cat; });
      });
      if (present.length > 1) {
        [['all', t('cert.f.all', 'All')]].concat(present.map(function (c) { return [c, c]; }))
          .forEach(function (pair) {
            var b = el('button', 'cert-filter' + (pair[0] === 'all' ? ' on' : ''), pair[1]);
            b.type = 'button';
            b.setAttribute('aria-pressed', pair[0] === 'all' ? 'true' : 'false');
            b.addEventListener('click', function () {
              active = pair[0];
              filterHost.querySelectorAll('.cert-filter').forEach(function (o) {
                var on = o === b;
                o.classList.toggle('on', on);
                o.setAttribute('aria-pressed', String(on));
              });
              draw();
            });
            filterHost.appendChild(b);
          });
        filterHost.hidden = false;
      }
    }

    draw();
    return { visible: visible };
  }

  /* --- lightbox --------------------------------------------------------- */

  function lightbox(list, getVisible) {
    var box = document.getElementById('certBox');
    if (!box) return function () {};
    var figure = box.querySelector('.cb-figure'),
        title  = box.querySelector('.cb-title'),
        sub    = box.querySelector('.cb-sub'),
        extra  = box.querySelector('.cb-extra'),
        count  = box.querySelector('.cb-count'),
        prev   = box.querySelector('.cb-prev'),
        next   = box.querySelector('.cb-next'),
        close  = box.querySelector('.cb-close');
    var at = 0, seq = [], opener = null;

    function render() {
      var c = seq[at];
      figure.textContent = '';
      if (c.image && /pdf$/i.test(c.type || c.image)) {
        var frame = el('iframe', 'cb-pdf');
        frame.src = c.image; frame.title = c.title || 'Certificate';
        figure.appendChild(frame);
        var open = el('a', 'btn btn-ghost', t('cert.openpdf', 'Open PDF'));
        open.href = c.image; open.target = '_blank'; open.rel = 'noopener noreferrer';
        figure.appendChild(open);
      } else if (c.image) {
        var img = el('img');
        img.src = c.image;
        img.alt = c.title ? (c.title + (c.issuer ? ' — ' + c.issuer : '')) : 'Certificate';
        img.addEventListener('error', function () {
          figure.textContent = '';
          figure.appendChild(el('p', 'cb-none', t('cert.noimage', 'Image not uploaded yet')));
        });
        figure.appendChild(img);
      } else {
        figure.appendChild(el('p', 'cb-none', t('cert.noimage', 'Image not uploaded yet')));
      }

      title.textContent = c.title || t('cert.untitled', 'Certificate');
      sub.textContent = [c.issuer, c.date].filter(Boolean).join(' · ');
      sub.hidden = !sub.textContent;

      extra.textContent = '';
      if (c.credentialId) {
        var row = el('p', 'cb-id');
        row.appendChild(el('span', '', t('cert.credid', 'Credential ID')));
        row.appendChild(el('code', '', c.credentialId));
        var copy = el('button', 'cb-copy', t('cert.copy', 'Copy'));
        copy.type = 'button';
        copy.addEventListener('click', function () {
          if (navigator.clipboard) navigator.clipboard.writeText(c.credentialId);
          copy.textContent = t('cert.copied', 'Copied');
          setTimeout(function () { copy.textContent = t('cert.copy', 'Copy'); }, 1600);
        });
        row.appendChild(copy);
        extra.appendChild(row);
      }
      var vhref = verifyUrl(c);
      if (vhref) {
        var v = el('a', 'btn btn-ghost', t('cert.verify', 'Verify credential'));
        v.href = vhref; v.target = '_blank'; v.rel = 'noopener noreferrer';
        extra.appendChild(v);
      }

      count.textContent = (at + 1) + ' / ' + seq.length;
      prev.disabled = next.disabled = seq.length < 2;
    }

    function step(d) { at = (at + d + seq.length) % seq.length; render(); }

    /* Focus trap: the dialog is modal, so Tab must not escape it. */
    function trap(e) {
      if (e.key !== 'Tab') return;
      var f = box.querySelectorAll('button:not([disabled]),a[href],iframe');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function onKey(e) {
      if (box.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); shut(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else trap(e);
    }

    function shut() {
      box.hidden = true;
      document.documentElement.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (opener && opener.focus) opener.focus();
    }

    function open(index, from) {
      seq = getVisible();
      at = Math.max(0, seq.indexOf(list[index]));
      opener = from || null;
      box.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      render();
      document.addEventListener('keydown', onKey);
      close.focus();
    }

    close.addEventListener('click', shut);
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    box.addEventListener('click', function (e) { if (e.target === box) shut(); });
    return open;
  }

  /* --- wire up ---------------------------------------------------------- */

  function init() {
    var ctfHost = document.getElementById('ctfList');
    if (ctfHost) {
      fetch('content/ctf.json', { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : []; })
        .catch(function () { return []; })
        .then(function (list) { renderCtf(list || [], ctfHost); });
    }

    var grid = document.getElementById('certGrid');
    if (!grid) return;
    var note = document.getElementById('certEmpty');

    load().then(function (res) {
      var list = res.list || [];
      if (!list.length) return;
      renderList(list, grid);
      renderWall(res.credly,
                 document.getElementById('badgeWall'),
                 document.getElementById('badgeGrid'),
                 res.uploaded);

      /* The note starts hidden in the markup: with no JS, or if this fetch
         fails, the inline rows are what is on screen, and "scans appear here
         once uploaded" printed under seven of them reads as a contradiction.
         It is revealed only once we know there is genuinely nothing to show. */
      var shots = list.filter(function (c) { return !!c.image; });
      if (note) note.hidden = shots.length > 0;
      if (!shots.length) return;

      var open = lightbox(list, function () { return shots; });
      grid.addEventListener('click', function (e) {
        var card = e.target.closest('.crow.has-shot');
        if (!card) return;
        e.preventDefault();
        open(Number(card.getAttribute('data-index')), card);
      });
      grid.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var card = e.target.closest('.crow.has-shot');
        if (!card) return;
        e.preventDefault();
        open(Number(card.getAttribute('data-index')), card);
      });
      grid.querySelectorAll('.crow.has-shot').forEach(function (c) {
        c.tabIndex = 0;
        c.setAttribute('role', 'button');
        c.setAttribute('aria-label', t('cert.view', 'View certificate'));
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.Certificates = { init: init };
})(window);
