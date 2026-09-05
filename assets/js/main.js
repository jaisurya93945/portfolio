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
     1. Preloader — a curtain, not a spinner. Once per session.
     --------------------------------------------------------- */
  var preloadDone = new Promise(function (resolve) {
    var el = $('#preload'), num = $('#preloadNum'), bar = $('#preloadBar');
    var seen = false;
    try { seen = sessionStorage.getItem('seen') === '1'; } catch (e) {}

    if (!el || reduce || seen) {
      if (el) el.remove();
      return resolve();
    }
    try { sessionStorage.setItem('seen', '1'); } catch (e) {}

    var t0 = performance.now(), dur = 1250;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = Math.round(eased * 100);
      num.textContent = v < 10 ? '0' + v : String(v);
      bar.style.width = (eased * 100) + '%';
      if (p < 1) requestAnimationFrame(step);
      else setTimeout(function () {
        el.classList.add('done');
        resolve();
        setTimeout(function () { el.remove(); }, 1100);
      }, 180);
    })(t0);
  });

  /* ---------------------------------------------------------
     2. Dot-matrix hero canvas
     O(n) per frame — no pairwise link loop. Pointer creates a
     ripple of scale and colour. Pauses off-screen and hidden.
     --------------------------------------------------------- */
  (function matrix() {
    var cvs = $('#matrix');
    if (!cvs || !cvs.getContext || reduce) return;
    var ctx = cvs.getContext('2d', { alpha: true });
    var w = 0, h = 0, dpr = 1, cols = 0, rows = 0, gap = 30;
    var raf = null, running = false, visible = true, t = 0;
    var px = -9999, py = -9999;
    var base = 'rgba(255,255,255,.3)', hot = 'rgba(45,212,191,.95)';

    function readColors() {
      var cs = getComputedStyle(document.documentElement);
      base = (cs.getPropertyValue('--dot') || base).trim();
      hot  = (cs.getPropertyValue('--dot-hot') || hot).trim();
    }

    function size() {
      var r = cvs.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cvs.width = Math.floor(w * dpr);
      cvs.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = w < 640 ? 34 : 30;
      cols = Math.ceil(w / gap) + 1;
      rows = Math.ceil(h / gap) + 1;
    }

    function frame() {
      if (!running) return;
      t += 0.006;
      ctx.clearRect(0, 0, w, h);
      var R = 190, R2 = R * R;

      for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
          var x = i * gap, y = j * gap;
          // slow standing wave so the field breathes
          var wave = Math.sin(x * 0.008 + t * 2) * Math.cos(y * 0.01 - t * 1.4);
          var r = 0.7 + wave * 0.45;
          var a = 0.45 + wave * 0.3;
          var color = base;

          var dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            var prox = 1 - Math.sqrt(d2) / R;
            r += prox * 2.1;
            a = Math.min(1, a + prox * 0.9);
            if (prox > 0.42) color = hot;
          }
          if (r <= 0.1) continue;
          ctx.globalAlpha = a;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 6.2832);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    function start() { if (running || !visible) return; running = true; raf = requestAnimationFrame(frame); }
    function stop()  { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    readColors(); size(); start();

    var rt;
    addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { size(); }, 180);
    }, { passive: true });

    addEventListener('pointermove', function (e) {
      var r = cvs.getBoundingClientRect();
      if (e.clientY > r.bottom) { px = py = -9999; return; }
      px = e.clientX - r.left; py = e.clientY - r.top;
    }, { passive: true });
    addEventListener('pointerleave', function () { px = py = -9999; });

    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        visible ? start() : stop();
      }, { threshold: 0 }).observe(cvs);
    }
    var tb = $('#themeToggle');
    if (tb) tb.addEventListener('click', function () { setTimeout(readColors, 60); });
  })();

  /* ---------------------------------------------------------
     3. Line-mask heading reveal
     Wrap each line's text in an inner span that starts pushed
     below its own overflow-hidden box, then slides up.
     --------------------------------------------------------- */
  function prepareSplit(root) {
    $$('[data-split]', root || document).forEach(function (h) {
      if (h.classList.contains('ready')) return;
      $$('.l', h).forEach(function (line, i) {
        if ($('.inner', line)) return;
        var inner = document.createElement('span');
        inner.className = 'inner';
        while (line.firstChild) inner.appendChild(line.firstChild);
        line.appendChild(inner);
        inner.style.setProperty('--sd', (i * 0.09) + 's');
      });
      h.classList.add('ready');
    });
  }
  prepareSplit();
  /* re-wrap after a language swap replaces innerHTML */
  document.addEventListener('i18n:change', function () {
    $$('[data-split]').forEach(function (h) {
      var wasIn = h.classList.contains('in');
      h.classList.remove('ready');
      prepareSplit(h.parentNode);
      if (wasIn) h.classList.add('in');
    });
  });

  /* ---------------------------------------------------------
     4. Reveal / counters / bars
     --------------------------------------------------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = pre + target.toFixed(dec) + suf; return; }
    var dur = 1500, t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (target * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = pre + target.toFixed(dec) + suf;
    })(t0);
  }

  function fillBars(scope) {
    $$('.bar', scope).forEach(function (b, i) {
      setTimeout(function () {
        b.style.setProperty('--w', b.getAttribute('data-v') + '%');
        b.classList.add('on');
      }, i * 85);
    });
  }

  function activate(el) {
    el.classList.add('in');
    var eb = el.matches('.eyebrow') ? el : $('.eyebrow', el);
    if (eb) eb.classList.add('in');
    $$('[data-count]', el).forEach(animateCount);
    if (el.hasAttribute('data-count')) animateCount(el);
    fillBars(el);
    var ring = $('#ringFg', el);
    if (ring) ring.style.strokeDashoffset = String(327 - 327 * 0.968);
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      activate(e.target);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }) : null;

  var watched = $$('[data-anim], [data-split], .hero-card, .stat, .achieve, .bars');
  preloadDone.then(function () {
    watched.forEach(function (el) { io ? io.observe(el) : activate(el); });
  });

  /* ---------------------------------------------------------
     5. Nav: sticky, progress, active link, burger
     --------------------------------------------------------- */
  var nav = $('#nav'), bar = $('#progressBar'), toTop = $('#toTop');
  var rail = $('#rail'), railLinks = $$('.rail a');
  var marquee = $('.marquee'), lastY = 0, vel = 0;
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

    /* Marquee leans into the scroll: speed and skew follow velocity. */
    if (marquee) {
      var dy = y - lastY;
      lastY = y;
      vel += (dy - vel) * 0.2;
      var clamped = Math.max(-40, Math.min(40, vel));
      marquee.style.setProperty('--mq-skew', (clamped * 0.035).toFixed(2) + 'deg');
      marquee.style.setProperty('--mq-rate', (1 + Math.min(2.2, Math.abs(clamped) / 26)).toFixed(2));
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
     6. Cursor, magnets, card spotlight — fine pointers only
     --------------------------------------------------------- */
  if (fine && !reduce) {
    document.body.classList.add('pointer-fine');
    var cur = $('#cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, craf;

    addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!document.body.classList.contains('cursor-live')) {
        rx = mx; ry = my;
        document.body.classList.add('cursor-live');
      }
      if (dot) dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      if (!craf) craf = requestAnimationFrame(function loop() {
        rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
        if (ring) ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
        if (Math.abs(mx - rx) > 0.4 || Math.abs(my - ry) > 0.4) craf = requestAnimationFrame(loop);
        else craf = null;
      });
    }, { passive: true });

    $$('a, button, .magnet, textarea, input').forEach(function (el) {
      el.addEventListener('pointerenter', function () { document.body.classList.add('cursor-hot'); });
      el.addEventListener('pointerleave', function () { document.body.classList.remove('cursor-hot'); });
    });

    /* magnetic pull on small interactive targets */
    $$('.magnet').forEach(function (el) {
      var strength = 0.28;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + dx * strength + 'px,' + dy * strength + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  if (fine) {
    $$('.fcard, .pcard').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      }, { passive: true });
    });
  }

  /* ---------------------------------------------------------
     7. Marquee (built in JS so it stays in sync with language)
     --------------------------------------------------------- */
  (function marquee() {
    var track = $('#marqueeTrack');
    if (!track) return;
    var words = ['Prompt Injection Defence', 'LLM Gateways', 'MCP Tool Poisoning', 'DevSecOps',
                 'Kubernetes Hardening', 'Detection Engineering', 'MLOps', 'AWS & GCP',
                 'Threat Modelling', 'Red Teaming LLMs'];
    var html = words.map(function (w) { return '<span>' + w + '</span><i>◆</i>'; }).join('');
    track.innerHTML = html + html;   /* duplicated for a seamless -50% loop */
  })();

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
      if (on) fillBars(panel);
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

    var scoreEl = $('#riskScore'), arc = $('#gaugeArc'), badge = $('#verdictBadge');
    var vText = $('#verdictText'), vBox = $('#verdict'), list = $('#findings'), conf = $('#confLine');
    var ARC = 182, last = null;

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
      arc.style.strokeDashoffset = String(ARC - ARC * (res.score / 100));
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
      if (res.empty) return;

      if (!res.findings.length) {
        var ok = document.createElement('div');
        ok.className = 'finding clean';
        var s = document.createElement('span'); s.className = 'sev'; s.style.background = 'currentColor';
        var box = document.createElement('div');
        var t = document.createElement('h5'); t.textContent = 'No detections';
        var p = document.createElement('p');
        p.textContent = 'payload passed all ' + window.ThreatGateway.RULES.length + ' deterministic checks';
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
    }

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
    var roles = ['AI Security Engineer', 'DevSecOps Engineer', 'MLOps & Cloud Security',
                 'LLM Red Teamer', 'DevOps Engineer @ Stackly'];
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
        { t: 'AegisAI',      h: 'https://github.com/jaisurya93945/aegis-ai', k: 'project' },
        { t: 'NeuroGenesis', h: 'https://github.com/jaisurya93945/NeuroGenesis', k: 'project' },
        { t: 'AI Security Guide', h: 'https://github.com/jaisurya93945/ai-security-guide', k: 'project' },
        { t: 'CipherAI Security Case Study', h: 'https://github.com/jaisurya93945/cipherai-security-case-study', k: 'project' },
        { t: 'CipherAI — cipherai.in', h: 'https://cipherai.in', k: 'link' },
        { t: 'GitHub — jaisurya93945', h: 'https://github.com/jaisurya93945', k: 'link' },
        { t: 'LinkedIn', h: 'https://www.linkedin.com/in/badathala-jaisurya-7b985a224', k: 'link' },
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

  var y = $('#year');
  if (y) y.textContent = String(new Date().getFullYear());

})();
