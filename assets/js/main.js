/* =========================================================
   main.js — interactions
   No frameworks. Everything degrades gracefully.
   ========================================================= */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Neural-mesh hero canvas
     Particle count scales with viewport, DPR is capped at 2,
     the loop pauses when the hero scrolls away or the tab
     is hidden, and it never starts under reduced motion.
     --------------------------------------------------------- */
  var Mesh = (function () {
    var cvs = $('#mesh'), ctx, nodes = [], raf = null, w = 0, h = 0, dpr = 1;
    var pointer = { x: -9999, y: -9999, active: false };
    var running = false, visible = true, enabled = !reduceMotion;

    function size() {
      if (!cvs) return;
      var r = cvs.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cvs.width = Math.floor(w * dpr);
      cvs.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      var target = Math.round(Math.min(88, Math.max(26, (w * h) / 16000)));
      nodes = [];
      for (var i = 0; i < target; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.24,
          vy: (Math.random() - 0.5) * 0.24,
          r: Math.random() * 1.6 + 0.7
        });
      }
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var link = Math.min(150, w * 0.14), i, j, a, b;

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
        if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;

        if (pointer.active) {
          var pdx = a.x - pointer.x, pdy = a.y - pointer.y;
          var pd2 = pdx * pdx + pdy * pdy;
          if (pd2 < 26000 && pd2 > 1) {
            var f = (1 - pd2 / 26000) * 0.5, pd = Math.sqrt(pd2);
            a.x += (pdx / pd) * f; a.y += (pdy / pd) * f;
          }
        }
      }

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < link * link) {
            var alpha = (1 - Math.sqrt(d2) / link) * 0.3;
            ctx.strokeStyle = 'rgba(120,190,255,' + alpha.toFixed(3) + ')';
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        var near = pointer.active &&
          (a.x - pointer.x) * (a.x - pointer.x) + (a.y - pointer.y) * (a.y - pointer.y) < 22000;
        ctx.fillStyle = near ? 'rgba(139,92,246,.85)' : 'rgba(34,211,238,.55)';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!enabled || !visible || running || !cvs) return; running = true; raf = requestAnimationFrame(frame); }
    function stop()  { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    function init() {
      if (!cvs || !cvs.getContext) return;
      ctx = cvs.getContext('2d', { alpha: true });
      size(); seed();
      if (!enabled) { ctx.clearRect(0, 0, w, h); return; }
      start();

      var rt;
      addEventListener('resize', function () {
        clearTimeout(rt);
        rt = setTimeout(function () { size(); seed(); }, 180);
      }, { passive: true });

      addEventListener('pointermove', function (e) {
        var r = cvs.getBoundingClientRect();
        pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
        pointer.active = e.clientY < r.bottom;
      }, { passive: true });
      addEventListener('pointerleave', function () { pointer.active = false; });

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
      });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          visible = es[0].isIntersecting;
          if (visible) start(); else stop();
        }, { threshold: 0 }).observe(cvs);
      }
    }

    return {
      init: init,
      toggle: function () {
        enabled = !enabled;
        if (enabled) { size(); seed(); start(); } else { stop(); ctx && ctx.clearRect(0, 0, w, h); }
        return enabled;
      },
      isOn: function () { return enabled; }
    };
  })();
  Mesh.init();

  var motionBtn = $('#motionToggle');
  if (motionBtn) {
    motionBtn.setAttribute('aria-pressed', String(!Mesh.isOn()));
    motionBtn.addEventListener('click', function () {
      var on = Mesh.toggle();
      motionBtn.setAttribute('aria-pressed', String(!on));
      toast(on ? 'Background animation on' : 'Background animation paused');
    });
  }

  /* ---------------------------------------------------------
     2. Typed role line
     --------------------------------------------------------- */
  (function typer() {
    var el = $('#typed');
    if (!el) return;
    var roles = [
      'AI Security Engineer',
      'DevSecOps Engineer',
      'MLOps & Cloud Security',
      'LLM Red Teamer',
      'DevOps Engineer @ Stackly'
    ];
    if (reduceMotion) { el.textContent = roles[0]; return; }

    var r = 0, c = 0, deleting = false;
    (function tick() {
      var word = roles[r];
      c += deleting ? -1 : 1;
      el.textContent = word.slice(0, c);
      var wait = deleting ? 34 : 62;
      if (!deleting && c === word.length) { deleting = true; wait = 1700; }
      else if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; wait = 260; }
      setTimeout(tick, wait);
    })();
  })();

  /* ---------------------------------------------------------
     3. Reveal on scroll + counters + skill bars + ring
     --------------------------------------------------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = pre + target.toFixed(dec) + suf; return; }

    var dur = 1400, t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (target * eased).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = pre + target.toFixed(dec) + suf;
    })(t0);
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in');

      $$('[data-count]', el).forEach(animateCount);
      if (el.hasAttribute('data-count')) animateCount(el);

      $$('.bar', el).forEach(function (b, i) {
        var v = b.getAttribute('data-v');
        setTimeout(function () { b.style.setProperty('--w', v + '%'); b.classList.add('on'); }, i * 90);
      });

      var ring = $('#ringFg', el);
      if (ring) ring.style.strokeDashoffset = String(327 - 327 * 0.968);

      obs.unobserve(el);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' }) : null;

  function observe(el) {
    if (io) io.observe(el);
    else {
      el.classList.add('in');
      $$('[data-count]', el).forEach(animateCount);
      $$('.bar', el).forEach(function (b) { b.style.setProperty('--w', b.getAttribute('data-v') + '%'); b.classList.add('on'); });
    }
  }
  $$('.reveal').forEach(observe);
  $$('.hero-stats .stat').forEach(observe);
  $$('.achieve').forEach(observe);

  /* skill bars inside inactive tabs animate when their tab opens */
  function fillBars(panel) {
    $$('.bar', panel).forEach(function (b, i) {
      setTimeout(function () { b.style.setProperty('--w', b.getAttribute('data-v') + '%'); b.classList.add('on'); }, i * 80);
    });
  }

  /* ---------------------------------------------------------
     4. Nav: sticky state, scroll progress, active link, burger
     --------------------------------------------------------- */
  var nav = $('#nav'), bar = $('#progressBar'), toTop = $('#toTop');
  var sections = $$('main section[id]');
  var navLinks = $$('.nav-links a');
  var ticking = false;

  function onScroll() {
    var y = scrollY;
    var max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('stuck', y > 12);
    if (toTop) toTop.hidden = y < 600;

    var current = '';
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= 120) current = sections[i].id;
    }
    navLinks.forEach(function (a) {
      a.classList.toggle('current', a.getAttribute('href') === '#' + current);
    });
    ticking = false;
  }
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (toTop) toTop.addEventListener('click', function () {
    scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
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
     5. Pointer glow + card tilt / spotlight
     --------------------------------------------------------- */
  var glow = $('#cursorGlow');
  if (glow && matchMedia('(pointer:fine)').matches && !reduceMotion) {
    document.body.classList.add('has-pointer');
    var gx = 0, gy = 0, cx = 0, cy = 0, gRaf;
    addEventListener('pointermove', function (e) {
      gx = e.clientX; gy = e.clientY;
      if (!gRaf) gRaf = requestAnimationFrame(function loop() {
        cx += (gx - cx) * 0.14; cy += (gy - cy) * 0.14;
        glow.style.transform = 'translate3d(' + (cx - 230) + 'px,' + (cy - 230) + 'px,0)';
        if (Math.abs(gx - cx) > 0.5 || Math.abs(gy - cy) > 0.5) gRaf = requestAnimationFrame(loop);
        else gRaf = null;
      });
    }, { passive: true });
  }

  if (matchMedia('(pointer:fine)').matches) {
    $$('.tilt, .pcard, .fcard').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      }, { passive: true });
    });
  }

  /* ---------------------------------------------------------
     6. Skill tabs
     --------------------------------------------------------- */
  var tabs = $$('.tab');
  tabs.forEach(function (tab, idx) {
    tab.addEventListener('click', function () { activate(idx); });
    tab.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var next = (idx + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      activate(next); tabs[next].focus();
    });
  });
  function activate(idx) {
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
     7. Project filters
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
     8. Live threat scanner
     --------------------------------------------------------- */
  (function lab() {
    var probe = $('#probe');
    if (!probe || !window.ThreatGateway) return;

    var scoreEl = $('#riskScore'), arc = $('#gaugeArc'), badge = $('#verdictBadge');
    var vText = $('#verdictText'), vBox = $('#verdict'), list = $('#findings'), conf = $('#confLine');
    var ARC = 182;

    var COPY = {
      allow: 'No blocking signals. Request forwarded to the model with standard logging.',
      warn:  'Suspicious signals present. Request is sanitised, flagged for review and rate-limited.',
      block: 'Policy violation. Request rejected at the gateway — it never reaches the model.'
    };

    function render(res) {
      var pct = res.score / 100;
      scoreEl.textContent = res.score;
      arc.style.strokeDashoffset = String(ARC - ARC * pct);
      vBox.setAttribute('data-level', res.action);
      badge.textContent = res.action.toUpperCase();
      vText.textContent = res.empty
        ? 'Waiting for input…'
        : COPY[res.action] + (res.defensive ? ' Defensive-intent framing detected — score damped.' : '');
      conf.textContent = 'signals: ' + res.findings.length +
        ' · rules: ' + window.ThreatGateway.RULES.length +
        ' · latency: ' + res.latency.toFixed(2) + ' ms';

      list.textContent = '';
      if (res.empty) return;

      if (!res.findings.length) {
        var ok = document.createElement('div');
        ok.className = 'finding clean';
        ok.innerHTML = '<span class="sev" style="background:#34d399"></span>' +
          '<div><h5>No detections</h5><p>payload passed all ' +
          window.ThreatGateway.RULES.length + ' deterministic checks</p></div>';
        list.appendChild(ok);
        return;
      }

      res.findings.forEach(function (f) {
        var row = document.createElement('div');
        row.className = 'finding ' + f.sev;
        var dot = document.createElement('span'); dot.className = 'sev';
        var mid = document.createElement('div');
        var h = document.createElement('h5'); h.textContent = f.label;
        var p = document.createElement('p'); p.textContent = f.evidence;
        var note = document.createElement('p');
        note.textContent = f.note;
        note.style.fontFamily = 'inherit';
        note.style.opacity = '.75';
        mid.appendChild(h); mid.appendChild(p); mid.appendChild(note);
        var w = document.createElement('span'); w.className = 'w'; w.textContent = '+' + f.weight;
        row.appendChild(dot); row.appendChild(mid); row.appendChild(w);
        list.appendChild(row);
      });
    }

    var t;
    function run() { clearTimeout(t); t = setTimeout(function () { render(window.ThreatGateway.scan(probe.value)); }, 130); }
    probe.addEventListener('input', run);

    $$('[data-sample]').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-sample');
        probe.value = window.ThreatGateway.SAMPLES[key] || '';
        render(window.ThreatGateway.scan(probe.value));
        probe.focus();
      });
    });

    /* first paint once the panel scrolls into view */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es, obs) {
        if (!es[0].isIntersecting) return;
        render(window.ThreatGateway.scan(probe.value));
        obs.disconnect();
      }, { threshold: 0.25 }).observe(probe);
    } else {
      render(window.ThreatGateway.scan(probe.value));
    }
  })();

  /* ---------------------------------------------------------
     9. Command palette
     --------------------------------------------------------- */
  (function palette() {
    var box = $('#palette'), input = $('#paletteInput'), list = $('#paletteList');
    if (!box) return;

    var ITEMS = [
      { t: 'Focus areas',            h: '#focus',      k: 'section' },
      { t: 'Live threat scanner',    h: '#lab',        k: 'demo' },
      { t: 'Capability matrix',      h: '#skills',     k: 'section' },
      { t: 'Experience timeline',    h: '#experience', k: 'section' },
      { t: 'Projects',               h: '#projects',   k: 'section' },
      { t: 'Certifications',         h: '#certs',      k: 'section' },
      { t: 'Contact',                h: '#contact',    k: 'section' },
      { t: 'SentinelCore — AI threat gateway', h: 'https://github.com/jaisurya93945/sentinelcore', k: 'project' },
      { t: 'AegisAI — LLM threat detection',   h: 'https://github.com/jaisurya93945/aegis-ai', k: 'project' },
      { t: 'NeuroGenesis — reasoning verification', h: 'https://github.com/jaisurya93945/NeuroGenesis', k: 'project' },
      { t: 'AI Security Guide',      h: 'https://github.com/jaisurya93945/ai-security-guide', k: 'project' },
      { t: 'CipherAI security case study', h: 'https://github.com/jaisurya93945/cipherai-security-case-study', k: 'project' },
      { t: 'CipherAI — live platform', h: 'https://cipherai.in', k: 'link' },
      { t: 'GitHub — jaisurya93945', h: 'https://github.com/jaisurya93945', k: 'link' },
      { t: 'LinkedIn',               h: 'https://www.linkedin.com/in/badathala-jaisurya-7b985a224', k: 'link' },
      { t: 'Email jaisurya524126@gmail.com', h: 'mailto:jaisurya524126@gmail.com', k: 'action' },
      { t: 'Call +91 81435 16981',   h: 'tel:+918143516981', k: 'action' }
    ];

    var sel = 0, shown = ITEMS.slice();

    function draw() {
      list.textContent = '';
      if (!shown.length) {
        var e = document.createElement('li');
        e.className = 'empty'; e.textContent = 'No matches';
        list.appendChild(e); return;
      }
      shown.forEach(function (it, i) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(i === sel));
        var span = document.createElement('span'); span.textContent = it.t;
        var kk = document.createElement('span'); kk.className = 'pk'; kk.textContent = it.k;
        li.appendChild(span); li.appendChild(kk);
        li.addEventListener('click', function () { go(it); });
        list.appendChild(li);
      });
    }

    function go(it) {
      close();
      if (it.h.charAt(0) === '#') {
        var target = document.querySelector(it.h);
        if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      } else if (/^(mailto|tel):/.test(it.h)) {
        location.href = it.h;
      } else {
        window.open(it.h, '_blank', 'noopener');
      }
    }

    function open() {
      box.hidden = false; input.value = ''; sel = 0; shown = ITEMS.slice(); draw();
      input.focus();
      document.body.style.overflow = 'hidden';
    }
    function close() { box.hidden = true; document.body.style.overflow = ''; }

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      shown = q ? ITEMS.filter(function (i) { return (i.t + ' ' + i.k).toLowerCase().indexOf(q) !== -1; }) : ITEMS.slice();
      sel = 0; draw();
    });

    addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); box.hidden ? open() : close(); return; }
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
     10. Copy email + toast + year
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
      setTimeout(function () { toastEl.hidden = true; }, 260);
    }, 2100);
  }

  var copyBtn = $('#copyMail');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var val = copyBtn.getAttribute('data-copy');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(val).then(function () { toast('Email copied to clipboard'); },
        function () { toast(val); });
    } else { toast(val); }
  });

  var y = $('#year');
  if (y) y.textContent = String(new Date().getFullYear());

})();
