/* =========================================================
   i18n — English lives in the HTML (source of truth and the
   no-JS fallback). Other locales are small JSON files fetched
   on demand and cached, so a visitor only ever downloads the
   one language they read.
   ========================================================= */
(function (global) {
  'use strict';

  var LOCALES = [
    { code: 'en', name: 'English',    region: 'UK · Ireland · India' },
    { code: 'de', name: 'Deutsch',    region: 'Deutschland · Österreich · Luxemburg' },
    { code: 'fr', name: 'Français',   region: 'France · Belgique · Luxembourg' },
    { code: 'nl', name: 'Nederlands', region: 'Nederland · België' },
    { code: 'es', name: 'Español',    region: 'España' },
    { code: 'it', name: 'Italiano',   region: 'Italia' },
    { code: 'pt', name: 'Português',  region: 'Portugal' },
    { code: 'pl', name: 'Polski',     region: 'Polska' },
    { code: 'hi', name: 'हिन्दी',      region: 'भारत' },
    { code: 'ta', name: 'தமிழ்',       region: 'இந்தியா' },
    { code: 'te', name: 'తెలుగు',      region: 'భారతదేశం' }
  ];

  var cache = {};   // code -> dictionary
  var base  = null; // the English strings scraped from the DOM
  var current = 'en';

  function nodes() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-i18n],[data-i18n-attr]'));
  }

  /* Snapshot the English copy once, before anything is swapped. */
  function snapshot() {
    if (base) return;
    base = {};
    nodes().forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (k) base[k] = el.innerHTML;
      var spec = el.getAttribute('data-i18n-attr');
      if (spec) {
        spec.split(',').forEach(function (pair) {
          var bits = pair.split(':');
          if (bits.length !== 2) return;
          base['@' + bits[0].trim() + '|' + bits[1].trim()] = el.getAttribute(bits[0].trim()) || '';
        });
      }
    });
  }

  function apply(dict) {
    nodes().forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (k) {
        var v = dict[k];
        if (v === undefined) v = base[k];
        if (v !== undefined) el.innerHTML = v;
      }
      var spec = el.getAttribute('data-i18n-attr');
      if (spec) {
        spec.split(',').forEach(function (pair) {
          var bits = pair.split(':');
          if (bits.length !== 2) return;
          var attr = bits[0].trim(), key = bits[1].trim();
          var val = dict[key];
          if (val === undefined) val = base['@' + attr + '|' + key];
          if (val !== undefined) el.setAttribute(attr, val);
        });
      }
    });
  }

  function meta(code) {
    for (var i = 0; i < LOCALES.length; i++) if (LOCALES[i].code === code) return LOCALES[i];
    return LOCALES[0];
  }

  function load(code) {
    if (code === 'en') return Promise.resolve({});
    if (cache[code]) return Promise.resolve(cache[code]);
    return fetch('assets/i18n/' + code + '.json', { cache: 'force-cache' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (d) { cache[code] = d; return d; })
      .catch(function () { return {}; }); // fall back to English, never break the page
  }

  function set(code, opts) {
    opts = opts || {};
    snapshot();
    var m = meta(code);
    code = m.code;
    return load(code).then(function (dict) {
      function commit() {
        apply(dict);
        current = code;
        document.documentElement.setAttribute('lang', code);
        document.documentElement.setAttribute('data-lang', code);
        try { if (!opts.silent) localStorage.setItem('lang', code); } catch (e) {}
        document.dispatchEvent(new CustomEvent('i18n:change', { detail: { code: code, dict: dict } }));
        return code;
      }
      /* With defer, the caller decides when the swap lands — so a view
         transition can wrap a finished change instead of a half-applied one. */
      return opts.defer ? commit : commit();
    });
  }

  function detect() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q && meta(q).code === q) return q;
      var stored = localStorage.getItem('lang');
      if (stored && meta(stored).code === stored) return stored;
      var navs = navigator.languages || [navigator.language || 'en'];
      for (var i = 0; i < navs.length; i++) {
        var c = String(navs[i]).toLowerCase().split('-')[0];
        if (meta(c).code === c) return c;
      }
    } catch (e) {}
    return 'en';
  }

  global.I18N = {
    LOCALES: LOCALES,
    set: set,
    detect: detect,
    get: function () { return current; },
    t: function (key) {
      var d = cache[current] || {};
      return d[key] !== undefined ? d[key] : (base && base[key] !== undefined ? base[key] : key);
    }
  };
})(window);
