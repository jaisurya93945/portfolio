/* =========================================================
   main.js — interactions
   No frameworks. Everything degrades gracefully.
   ========================================================= */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine   = matchMedia('(pointer:fine)').matches;

  /* ---------------------------------------------------------
     0. Theme
     --------------------------------------------------------- */
  /* Cross-fade whole-page swaps where the browser supports it. */
  function transition(fn) {
    if (reduce || !document.startViewTransition) { fn(); return Promise.resolve(); }
    return document.startViewTransition(fn).finished.catch(function () {});
  }
  window.__pageTransition = transition;

  (function theme() {
    var btn = $('#themeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      transition(function () {
        var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
        var m = document.querySelector('meta[name="theme-color"]');
        if (m) m.setAttribute('content', next === 'light' ? '#f4f2ed' : '#08080a');
      });
    });
  })();

  /* ---------------------------------------------------------
     4. Reveal / counters / bars
     --------------------------------------------------------- */
  function activate(el) {
    el.classList.add('in');
    var eb = el.matches('.eyebrow') ? el : $('.eyebrow', el);
    if (eb) eb.classList.add('in');
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      activate(e.target);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }) : null;

  var watched = $$('[data-anim], [data-split], .hero-card, .stat, .achieve, .bars');
  watched.forEach(function (el) { io ? io.observe(el) : activate(el); });

  /* Safety net: if the observer never fires - a stale layout, a bfcache
     restore, a browser that throttles it - nothing may stay invisible.
     Reveal anything still hidden once the page has settled. */
  window.addEventListener('load', function () {
    setTimeout(function () {
      watched.forEach(function (el) {
        if (el.classList.contains('in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) activate(el);
      });
    }, 1200);
  });
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    watched.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) activate(el);
    });
  });

  /* ---------------------------------------------------------
     5. Nav: sticky, progress, active link, burger
     --------------------------------------------------------- */
  var nav = $('#nav'), bar = $('#progressBar'), toTop = $('#toTop');
  var rail = $('#rail'), railLinks = $$('.rail a');
  var sections = $$('main section[id]');
  var navLinks = $$('.nav-links a');
  var ticking = false;

  function onScroll() {
    var y = scrollY;
    var max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('stuck', y > 12);
    if (toTop) toTop.hidden = y < 640;

    var cur = '';
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= 130) cur = sections[i].id;
    }
    navLinks.forEach(function (a) { a.classList.toggle('current', a.getAttribute('href') === '#' + cur); });
    if (rail) {
      rail.classList.toggle('on', y > innerHeight * 0.65);
      railLinks.forEach(function (a) { a.classList.toggle('current', a.getAttribute('href') === '#' + cur); });
    }

    ticking = false;
  }
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (toTop) toTop.addEventListener('click', function () {
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  var burger = $('#burger'), mobile = $('#mobileMenu');
  if (burger && mobile) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      mobile.hidden = open;
    });
    $$('a', mobile).forEach(function (a) {
      a.addEventListener('click', function () {
        burger.setAttribute('aria-expanded', 'false');
        mobile.hidden = true;
      });
    });
  }

  /* ---------------------------------------------------------
     8. Skill tabs
     --------------------------------------------------------- */
  var tabs = $$('.tab');
  tabs.forEach(function (tab, idx) {
    tab.addEventListener('click', function () { selectTab(idx); });
    tab.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var n = (idx + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      selectTab(n); tabs[n].focus();
    });
  });
  function selectTab(idx) {
    tabs.forEach(function (t, i) {
      var on = i === idx;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (!panel) return;
      panel.hidden = !on;
      panel.classList.toggle('active', on);
    });
  }

  /* ---------------------------------------------------------
     9. Project filters
     --------------------------------------------------------- */
  $$('.filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.filter').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var f = btn.getAttribute('data-filter');
      $$('.pcard').forEach(function (card) {
        var show = f === 'all' || (card.getAttribute('data-cat') || '').indexOf(f) !== -1;
        card.classList.toggle('hide', !show);
      });
    });
  });

  /* ---------------------------------------------------------
     10. Live threat scanner
     --------------------------------------------------------- */
  (function lab() {
    var probe = $('#probe');
    if (!probe || !window.ThreatGateway) return;

    var scoreEl = $('#riskScore'), badge = $('#verdictBadge');
    var vText = $('#verdictText'), vBox = $('#verdict'), list = $('#findings'), conf = $('#confLine');
    var last = null;

    function copy(action) {
      var d = { allow: 'lab.v.allow', warn: 'lab.v.warn', block: 'lab.v.block' }[action];
      var fallback = {
        allow: 'No blocking signals. Request forwarded to the model with standard logging.',
        warn:  'Suspicious signals present. Request is sanitised, flagged for review and rate-limited.',
        block: 'Policy violation. Request rejected at the gateway — it never reaches the model.'
      }[action];
      var t = window.I18N ? window.I18N.t(d) : d;
      return (t === d) ? fallback : t;
    }

    function render(res) {
      last = res;
      scoreEl.textContent = res.score;
      vBox.setAttribute('data-level', res.action);
      badge.textContent = res.action.toUpperCase();
      var damp = '';
      if (res.defensive) {
        var dk = window.I18N ? window.I18N.t('lab.v.damp') : 'lab.v.damp';
        damp = (dk === 'lab.v.damp') ? ' Defensive-intent framing detected — score damped.' : dk;
      }
      vText.textContent = res.empty
        ? (window.I18N ? window.I18N.t('lab.waiting') : 'Waiting for input…')
        : copy(res.action) + damp;
      conf.textContent = 'signals: ' + res.findings.length +
        ' · rules: ' + window.ThreatGateway.RULES.length +
        ' · latency: ' + res.latency.toFixed(2) + ' ms';

      list.textContent = '';
      list.classList.remove('more');
      if (res.empty) return;

      if (!res.findings.length) {
        var ok = document.createElement('div');
        ok.className = 'finding clean';
        var s = document.createElement('span'); s.className = 'sev'; s.style.background = 'currentColor';
        var box = document.createElement('div');
        var tr = function (k, f) {
          var v = window.I18N ? window.I18N.t(k) : k;
          return (v === k || v === undefined) ? f : v;
        };
        var t = document.createElement('h5');
        t.textContent = tr('lab.clean.title', 'No detections');
        var p = document.createElement('p');
        p.textContent = tr('lab.clean.sub', 'payload passed all {n} deterministic checks')
          .replace('{n}', window.ThreatGateway.RULES.length);
        box.appendChild(t); box.appendChild(p);
        ok.appendChild(s); ok.appendChild(box);
        list.appendChild(ok);
        return;
      }

      res.findings.forEach(function (f) {
        var row = document.createElement('div');
        row.className = 'finding ' + f.sev;
        var dot = document.createElement('span'); dot.className = 'sev';
        var mid = document.createElement('div');
        var h = document.createElement('h5'); h.textContent = f.label;
        var ev = document.createElement('p'); ev.textContent = f.evidence;
        var note = document.createElement('p'); note.className = 'note'; note.textContent = f.note;
        mid.appendChild(h); mid.appendChild(ev); mid.appendChild(note);
        var w = document.createElement('span'); w.className = 'w'; w.textContent = '+' + f.weight;
        row.appendChild(dot); row.appendChild(mid); row.appendChild(w);
        list.appendChild(row);
      });
      markOverflow();
    }

    /* Fade the last row only while the list can still be scrolled, so a
       clipped finding reads as "more below" instead of as a broken card. */
    function markOverflow() {
      var more = list.scrollHeight - list.clientHeight - list.scrollTop > 4;
      list.classList.toggle('more', more);
    }
    list.addEventListener('scroll', markOverflow, { passive: true });
    window.addEventListener('resize', markOverflow);

    var t;
    probe.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { render(window.ThreatGateway.scan(probe.value)); }, 130);
    });

    $$('[data-sample]').forEach(function (b) {
      b.addEventListener('click', function () {
        probe.value = window.ThreatGateway.SAMPLES[b.getAttribute('data-sample')] || '';
        render(window.ThreatGateway.scan(probe.value));
        probe.focus();
      });
    });

    document.addEventListener('i18n:change', function () { if (last) render(last); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es, obs) {
        if (!es[0].isIntersecting) return;
        render(window.ThreatGateway.scan(probe.value));
        obs.disconnect();
      }, { threshold: 0.2 }).observe(probe);
    } else {
      render(window.ThreatGateway.scan(probe.value));
    }
  })();

  /* ---------------------------------------------------------
     11. Language switcher
     --------------------------------------------------------- */
  (function lang() {
    if (!window.I18N) return;
    var wrap = $('#langWrap'), btn = $('#langBtn'), menu = $('#langMenu'), code = $('#langCode');
    if (!btn || !menu) return;

    window.I18N.LOCALES.forEach(function (l) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('tabindex', '0');
      li.dataset.code = l.code;
      var n = document.createElement('span'); n.textContent = l.name;
      var c = document.createElement('span'); c.className = 'lc'; c.textContent = l.code.toUpperCase();
      li.appendChild(n); li.appendChild(c);
      li.title = l.region;
      function pick() { choose(l.code); }
      li.addEventListener('click', pick);
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });
      menu.appendChild(li);
    });

    function mark(active) {
      $$('li', menu).forEach(function (li) {
        li.setAttribute('aria-selected', String(li.dataset.code === active));
      });
      code.textContent = active.toUpperCase();
    }

    function open()  { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
    function close() { menu.hidden = true;  btn.setAttribute('aria-expanded', 'false'); }

    function choose(c) {
      close();
      var run = window.__pageTransition || function (f) { f(); return Promise.resolve(); };
      /* Fetch first, then swap inside the transition so the cross-fade
         covers a completed change rather than a half-applied one. */
      window.I18N.set(c, { defer: true }).then(function (apply) {
        run(function () { apply(); mark(c); });
      });
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.hidden ? open() : close();
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    var initial = window.I18N.detect();
    mark(initial);
    if (initial !== 'en') window.I18N.set(initial, { silent: true });
  })();

  /* ---------------------------------------------------------
     12. Typed role line — re-typed on language change
     --------------------------------------------------------- */
  (function typer() {
    var el = $('#typed');
    if (!el) return;
    var roles = ['AI Security Engineer', 'AI Safety & Security Researcher',
                 'DevSecOps Engineer', 'MLOps & Cloud Security', 'LLM Red Teamer'];
    if (reduce) { el.textContent = roles[0]; return; }
    var r = 0, c = 0, del = false;
    (function tick() {
      var word = roles[r];
      c += del ? -1 : 1;
      el.textContent = word.slice(0, c);
      var wait = del ? 32 : 60;
      if (!del && c === word.length) { del = true; wait = 1750; }
      else if (del && c === 0) { del = false; r = (r + 1) % roles.length; wait = 250; }
      setTimeout(tick, wait);
    })();
  })();

  /* ---------------------------------------------------------
     13. Command palette
     --------------------------------------------------------- */
  (function palette() {
    var box = $('#palette'), input = $('#paletteInput'), list = $('#paletteList');
    if (!box) return;

    function items() {
      var t = function (k, f) { return window.I18N ? (window.I18N.t(k) || f) : f; };
      return [
        { t: t('nav.focus', 'Focus'),           h: '#focus',      k: 'section' },
        { t: t('nav.lab', 'Live Lab'),          h: '#lab',        k: 'demo' },
        { t: t('nav.skills', 'Skills'),         h: '#skills',     k: 'section' },
        { t: t('nav.experience', 'Experience'), h: '#experience', k: 'section' },
        { t: t('nav.projects', 'Work'),         h: '#projects',   k: 'section' },
        { t: t('nav.certs', 'Credentials'),     h: '#certs',      k: 'section' },
        { t: t('nav.contact', 'Contact'),       h: '#contact',    k: 'section' },
        { t: 'SentinelCore', h: 'https://github.com/jaisurya93945/sentinelcore', k: 'project' },
        { t: 'IdenSec',      h: 'https://github.com/jaisurya93945/idensec',  k: 'project' },
        { t: 'NeuroGenesis', h: 'https://github.com/jaisurya93945/NeuroGenesis', k: 'project' },
        { t: 'AI Security Guide', h: 'https://github.com/jaisurya93945/ai-security-guide', k: 'project' },
        { t: 'CipherAI Security Case Study', h: 'https://github.com/jaisurya93945/cipherai-security-case-study', k: 'project' },
        { t: 'CipherAI — cipherai.in', h: 'https://cipherai.in', k: 'link' },
        { t: 'GitHub — jaisurya93945', h: 'https://github.com/jaisurya93945', k: 'link' },
        { t: 'LinkedIn', h: 'https://www.linkedin.com/in/badathala-jaisurya/', k: 'link' },
        { t: t('hero.cta3', 'Résumé') + ' — Europe / International', h: 'resume.html?region=int', k: 'cv' },
        { t: t('hero.cta3', 'Résumé') + ' — Deutschland (Lebenslauf)', h: 'resume.html?region=de', k: 'cv' },
        { t: t('hero.cta3', 'Résumé') + ' — UK & Ireland', h: 'resume.html?region=uk', k: 'cv' },
        { t: t('hero.cta3', 'Résumé') + ' — United States', h: 'resume.html?region=us', k: 'cv' },
        { t: t('hero.cta3', 'Résumé') + ' — India', h: 'resume.html?region=in', k: 'cv' },
        { t: 'jaisurya524126@gmail.com', h: 'mailto:jaisurya524126@gmail.com', k: 'email' },
        { t: '+91 81435 16981', h: 'tel:+918143516981', k: 'phone' }
      ];
    }

    var all = items(), shown = all.slice(), sel = 0;
    document.addEventListener('i18n:change', function () { all = items(); });

    function draw() {
      list.textContent = '';
      if (!shown.length) {
        var e = document.createElement('li');
        e.className = 'empty'; e.textContent = '—';
        list.appendChild(e); return;
      }
      shown.forEach(function (it, i) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(i === sel));
        var s = document.createElement('span'); s.textContent = it.t;
        var k = document.createElement('span'); k.className = 'pk'; k.textContent = it.k;
        li.appendChild(s); li.appendChild(k);
        li.addEventListener('click', function () { go(it); });
        list.appendChild(li);
      });
    }

    function go(it) {
      close();
      if (/\.html/.test(it.h)) { location.href = it.h; return; }
      if (it.h.charAt(0) === '#') {
        var target = document.querySelector(it.h);
        if (target) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      } else if (/^(mailto|tel):/.test(it.h)) location.href = it.h;
      else window.open(it.h, '_blank', 'noopener');
    }

    function open() {
      all = items(); shown = all.slice(); sel = 0;
      box.hidden = false; input.value = ''; draw(); input.focus();
      document.body.style.overflow = 'hidden';
    }
    function close() { box.hidden = true; document.body.style.overflow = ''; }

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      shown = q ? all.filter(function (i) { return (i.t + ' ' + i.k).toLowerCase().indexOf(q) !== -1; }) : all.slice();
      sel = 0; draw();
    });

    addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); box.hidden ? open() : close(); return;
      }
      if (box.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(shown.length, 1); draw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(shown.length, 1); draw(); }
      else if (e.key === 'Enter' && shown[sel]) { e.preventDefault(); go(shown[sel]); }
    });

    var opener = $('#paletteOpen');
    if (opener) opener.addEventListener('click', open);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
  })();

  /* ---------------------------------------------------------
     14. Copy email, toast, year
     --------------------------------------------------------- */
  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(function () { toastEl.classList.add('show'); });
    clearTimeout(toastT);
    toastT = setTimeout(function () {
      toastEl.classList.remove('show');
      setTimeout(function () { toastEl.hidden = true; }, 300);
    }, 2200);
  }

  var copyBtn = $('#copyMail');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var val = copyBtn.getAttribute('data-copy');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(val).then(function () { toast(val); }, function () { toast(val); });
    } else toast(val);
  });

  /* ---------------------------------------------------------
     15. Chart hover layer (per-mark tooltip, SVG bar figure)
     --------------------------------------------------------- */
  (function () {
    var figs = document.querySelectorAll('svg.fig');
    if (!figs.length) return;

    var tip = document.createElement('div');
    tip.className = 'fig-tip';
    tip.setAttribute('role', 'status');
    tip.setAttribute('aria-live', 'polite');
    document.body.appendChild(tip);

    var current = null;

    var EN = {
      'res.fig.unit1': 'surviving map',
      'res.fig.unitN': 'surviving maps',
      'res.fig.leg1': 'uniquely identifiable'
    };

    function t(key) {
      var v = (window.I18N && window.I18N.t) ? window.I18N.t(key) : key;
      return (v === key || v === undefined) ? (EN[key] || key) : v;
    }

    function label(bar) {
      var w = bar.getAttribute('data-w');
      var v = bar.getAttribute('data-v');
      var unit = t(v === '1' ? 'res.fig.unit1' : 'res.fig.unitN');
      var tail = bar.getAttribute('data-ident') === 'true' ? ' · ' + t('res.fig.leg1') : '';
      return 'w=' + w + '  |RS| = ' + v + ' ' + unit + tail;
    }

    function place(bar) {
      var r = bar.getBoundingClientRect();
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var x = r.left + r.width / 2 - tw / 2;
      var yy = r.top - th - 8;
      if (yy < 6) yy = r.bottom + 8;
      x = Math.max(8, Math.min(x, window.innerWidth - tw - 8));
      tip.style.left = Math.round(x) + 'px';
      tip.style.top = Math.round(yy) + 'px';
    }

    function show(bar) {
      if (current === bar) return;
      hide();
      current = bar;
      bar.classList.add('on');
      tip.textContent = label(bar);
      tip.classList.add('on');
      place(bar);
    }

    function hide() {
      if (current) current.classList.remove('on');
      current = null;
      tip.classList.remove('on');
    }

    Array.prototype.forEach.call(figs, function (fig) {
      var bars = fig.querySelectorAll('.bar');
      Array.prototype.forEach.call(bars, function (bar, i) {
        bar.setAttribute('tabindex', '0');
        bar.setAttribute('role', 'img');
        bar.setAttribute('aria-label', label(bar));
        bar.addEventListener('mouseenter', function () { show(bar); });
        bar.addEventListener('focus', function () { show(bar); });
        bar.addEventListener('blur', hide);
        bar.addEventListener('keydown', function (e) {
          var next = null;
          if (e.key === 'ArrowRight') next = bars[i + 1];
          else if (e.key === 'ArrowLeft') next = bars[i - 1];
          else if (e.key === 'Escape') { hide(); bar.blur(); return; }
          if (next) { e.preventDefault(); next.focus(); }
        });
      });
      fig.addEventListener('mouseleave', hide);
    });

    window.addEventListener('scroll', function () { if (current) place(current); }, { passive: true });
    window.addEventListener('resize', hide);
    document.addEventListener('i18n:change', function () {
      Array.prototype.forEach.call(document.querySelectorAll('svg.fig .bar'), function (bar) {
        bar.setAttribute('aria-label', label(bar));
      });
      if (current) tip.textContent = label(current);
    });
  })();

  /* ---------------------------------------------------------
     16. Reading depth: quick scan vs the full page
     --------------------------------------------------------- */
  (function () {
    var btn = $('#depthToggle');
    if (!btn) return;
    var root = document.documentElement;

    function apply(mode, persist) {
      if (mode === 'quick') root.setAttribute('data-depth', 'quick');
      else root.removeAttribute('data-depth');
      btn.setAttribute('aria-pressed', mode === 'quick' ? 'true' : 'false');
      if (persist) { try { sessionStorage.setItem('depth', mode); } catch (e) {} }
    }

    /* Full is the default and stays the default. An earlier build persisted
       the choice under 'depth', which left people on Quick with no memory of
       choosing it and sections apparently missing; that key is ignored and
       cleared. The preference is only restored inside one browsing session. */
    try { localStorage.removeItem('depth'); } catch (e) {}
    var saved;
    try { saved = sessionStorage.getItem('depth'); } catch (e) {}
    if (saved === 'quick') apply('quick', false);

    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-depth') === 'quick' ? 'full' : 'quick';
      transition(function () { apply(next, true); });
      /* Anything revealed by switching back to full has to be activated, or
         it stays at opacity 0 with its observer already spent. */
      if (next === 'full') {
        $$('[data-deep] [data-anim], [data-deep]').forEach(function (el) {
          if (el.hasAttribute('data-anim')) activate(el);
        });
      }
    });
  })();

  /* ---------------------------------------------------------
     17. Certificate images, uploaded by hand
     --------------------------------------------------------- */
  (function () {
    var host = $('#certShots');
    if (!host) return;
    var empty = $('#certEmpty');

    fetch('assets/cv/uploads.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (up) {
        var certs = up && up.certs;
        if (!certs || !certs.length) return;

        certs.forEach(function (c) {
          var src = 'assets/img/certs/' + encodeURIComponent(c.file);
          var a = document.createElement('a');
          a.href = src; a.target = '_blank'; a.rel = 'noopener noreferrer';
          a.className = 'cert-shot';
          if (c.type === 'application/pdf') {
            var box = document.createElement('span');
            box.className = 'cert-pdf'; box.textContent = 'PDF';
            a.appendChild(box);
            a.setAttribute('aria-label', (c.caption || 'Certificate') + ' (PDF)');
          } else {
            var img = document.createElement('img');
            img.src = src; img.loading = 'lazy'; img.decoding = 'async';
            /* A caption-less certificate still needs an accessible name, and
               the file name is the only thing that carries one. */
            img.alt = c.caption || 'Certificate';
            a.appendChild(img);
          }
          if (c.caption) {
            var cap = document.createElement('span');
            cap.className = 'cert-cap'; cap.textContent = c.caption;
            a.appendChild(cap);
          }
          host.appendChild(a);
        });

        host.hidden = false;
        if (empty) empty.hidden = true;
      })
      .catch(function () { /* uploads are optional */ });
  })();

  var y = $('#year');
  if (y) y.textContent = String(new Date().getFullYear());

})();
