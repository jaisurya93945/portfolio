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
        .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (res) {
      var manifest = res[1] || {};
      var list = merge(res[0] || [], manifest.certs || []);
      return attachBadges(list, manifest.badges || []);
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
      if (c.badge) {
        var bi = el('img');
        bi.src = c.badge; bi.loading = 'lazy'; bi.decoding = 'async'; bi.alt = '';
        bi.addEventListener('error', function () {
          m.textContent = mark(c); m.classList.remove('has-badge');
        });
        m.appendChild(bi); m.classList.add('has-badge');
      } else {
        m.textContent = mark(c);
      }
      m.setAttribute('aria-hidden', 'true');
      li.appendChild(m);

      var main = el('span', 'cmain');
      main.appendChild(el('b', '', c.title || ''));
      if (c.issuer) main.appendChild(el('span', 'cissuer', c.issuer));
      li.appendChild(main);

      /* A verifiable platform becomes a link; an unverifiable one stays a
         plain label. A "Verify" that verifies nothing is worse than none. */
      if (c.platform) {
        var pl;
        if (c.verificationUrl) {
          pl = el('a', 'cplat is-link', c.platform);
          pl.href = c.verificationUrl; pl.target = '_blank'; pl.rel = 'noopener noreferrer';
          pl.setAttribute('aria-label', t('cert.verify', 'Verify credential') + ' — ' + c.platform);
        } else {
          pl = el('span', 'cplat', c.platform);
        }
        li.appendChild(pl);
      }

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

  function mark(c) {
    return c.mark || (c.title || '?').trim().charAt(0).toUpperCase();
  }

  /* --- gallery ---------------------------------------------------------- */

  function build(list, host, countEl, filterHost, empty) {
    var active = 'all';

    function visible() {
      return list.filter(function (c) { return active === 'all' || c.category === active; });
    }

    function tile(c, index) {
      var a = el('a', 'cert-shot');
      a.href = c.image || (c.verificationUrl || '#');
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
      if (c.verificationUrl) {
        var v = el('a', 'btn btn-ghost', t('cert.verify', 'Verify credential'));
        v.href = c.verificationUrl; v.target = '_blank'; v.rel = 'noopener noreferrer';
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
    var grid = document.getElementById('certGrid');
    if (!grid) return;
    var note = document.getElementById('certEmpty');

    load().then(function (list) {
      if (!list.length) return;
      renderList(list, grid);

      var shots = list.filter(function (c) { return !!c.image; });
      if (note) note.hidden = shots.length > 0;
      if (!shots.length) return;

      var open = lightbox(list, function () { return shots; });
      grid.addEventListener('click', function (e) {
        var card = e.target.closest('.cert-card.has-shot');
        if (!card) return;
        e.preventDefault();
        open(Number(card.getAttribute('data-index')), card);
      });
      grid.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var card = e.target.closest('.cert-card.has-shot');
        if (!card) return;
        e.preventDefault();
        open(Number(card.getAttribute('data-index')), card);
      });
      grid.querySelectorAll('.cert-card.has-shot').forEach(function (c) {
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
