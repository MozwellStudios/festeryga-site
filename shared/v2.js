/* ======================================================================
   FS: Festeryga motion core (Phase A, Oct 27 2026).
   One scroll engine for every scroll-driven scene, one reveal engine for every entrance,
   shared timing tokens read from CSS (shared/v2.css :root), one reduced-motion switch.
   Scenes keep their own choreography; the engine supplies progress (0..1) and only runs scenes near the viewport.
   ====================================================================== */
var FS = window.FS = (function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = window.getComputedStyle(document.documentElement);
  function tok(name, fallback) {
    var v = css.getPropertyValue(name).trim();
    if (!v) return fallback;
    if (/ms$/.test(v)) return parseFloat(v);
    if (/s$/.test(v)) return parseFloat(v) * 1000;
    return v;
  }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function map(p, a, b) { return clamp((p - a) / (b - a)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function eOut(t) { return 1 - Math.pow(1 - t, 3); }
  function eInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ---- scroll engine ---- */
  var scenes = [], frames = [], resizers = [], ticking = false;
  // mode 'pin': progress through a pinned (sticky) container; 'pass': progress while the element crosses the viewport
  function progress(s, r, vh) {
    if (s.mode === 'pass') return clamp((vh - r.top) / (vh + r.height));
    var total = s.track.offsetHeight - vh;
    return total > 0 ? clamp(-r.top / total) : null;
  }
  function run() {
    ticking = false;
    var vh = window.innerHeight;
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i], r = s.track.getBoundingClientRect();
      if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) continue; // off-screen scenes cost nothing
      var p = progress(s, r, vh);
      if (p !== null) s.fn(p, vh);
    }
    for (var j = 0; j < frames.length; j++) frames[j]();
  }
  function request() { if (!ticking) { ticking = true; window.requestAnimationFrame(run); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () { resizers.forEach(function (f) { f(); }); run(); });

  /* ---- reveal engine ---- */
  var observers = {}, groups = [];
  function observer(threshold, margin) {
    var key = threshold + '|' + margin;
    if (!observers[key]) {
      observers[key] = new IntersectionObserver(function (es, io) {
        es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); e.target._fsReveal(); } });
      }, { threshold: threshold, rootMargin: margin });
    }
    return observers[key];
  }
  function reveal(sel, opt) {
    opt = opt || {};
    var els = document.querySelectorAll(sel);
    if (!els.length) return;
    els.forEach(function (el) {
      var items = opt.items ? el.querySelectorAll(opt.items) : null;
      el._fsReveal = function () {
        if (el._fsDone) return; el._fsDone = true;
        if (items) {
          var step = tok('--m-stagger', 90);
          el.classList.add('is-in');
          items.forEach(function (it, i) { it.style.transitionDelay = (i * step) + 'ms'; });
          window.requestAnimationFrame(function () { el.classList.remove('is-pending'); });
          setTimeout(function () { items.forEach(function (it) { it.style.transitionDelay = ''; }); }, tok('--m-t-reveal', 800) + items.length * step + 200);
        } else {
          el.classList.add('is-in');
        }
      };
      if (reduce || !('IntersectionObserver' in window)) { if (!items) el.classList.add('is-in'); el._fsDone = true; return; }
      if (items) el.classList.add('is-pending');
      observer(opt.threshold || 0.18, opt.margin || '0px').observe(el);
      groups.push(el);
    });
  }
  // keyboard: anything focused inside a pending entrance appears at once
  document.addEventListener('focusin', function (e) {
    for (var i = 0; i < groups.length; i++) if (groups[i].contains(e.target) && groups[i]._fsReveal) groups[i]._fsReveal();
  });

  return {
    reduce: reduce, tok: tok, clamp: clamp, map: map, lerp: lerp, eOut: eOut, eInOut: eInOut,
    mobile: function (px) { return window.matchMedia('(max-width: ' + (px || 760) + 'px)').matches; },
    scene: function (track, fn, mode) { scenes.push({ track: track, fn: fn, mode: mode || 'pin' }); request(); },
    frame: function (fn) { frames.push(fn); request(); },
    resize: function (fn) { resizers.push(fn); },
    request: request, reveal: reveal
  };
})();

/* ---- entrances (one engine, per-component thresholds kept from the approved build) ---- */
FS.reveal('.rv', { threshold: 0.18, margin: '0px 0px -6% 0px' });
FS.reveal('.chap', { threshold: 0.25 });
FS.reveal('.cl', { threshold: 0.25 });
FS.reveal('.hg__grid', { items: 'li', threshold: 0.2 });
FS.reveal('.led__list', { items: '.ledr', threshold: 0.15 });
/* Injury hero: the photograph band settles once, just after load. */
(function () {
  var h = document.querySelector('.ijh');
  if (!h) return;
  if (FS.reduce) { h.classList.add('is-in'); return; }
  window.requestAnimationFrame(function () { setTimeout(function () { h.classList.add('is-in'); }, 120); });
})();

/* ---- scroll scenes ---- */

/* V2 ledgers: the row nearest the middle of the screen reads in full. Static (all rows full) under reduced motion. */
(function () {
  var ledgers = document.querySelectorAll('.xr');
  if (!ledgers.length) return;
  if (FS.reduce) { ledgers.forEach(function (l) { l.classList.add('xr--static'); }); return; }
  FS.frame(function () {
    var mid = window.innerHeight * 0.5;
    ledgers.forEach(function (sec) {
      var r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var best = null, bestD = Infinity, rows = sec.querySelectorAll('.xr__row');
      rows.forEach(function (row) { var b = row.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - mid); if (d < bestD) { bestD = d; best = row; } });
      rows.forEach(function (row) { row.classList.toggle('is-on', row === best); });
    });
  });
})();

/* Client story: the frame grows from a card to full screen as the section scrolls. */
(function () {
  if (FS.reduce) return;
  document.querySelectorAll('.story').forEach(function (sec) {
    var scroll = sec.querySelector('.story__scroll'), media = sec.querySelector('.story__media');
    var grade = sec.querySelector('.story__grade'), words = sec.querySelectorAll('.story__word');
    if (!scroll || !media) return;
    sec.classList.add('story--live');
    FS.scene(scroll, function (p, vh) {
      var e = 1 - Math.pow(1 - p, 3), small = window.innerWidth < 760;
      media.style.width = FS.lerp(small ? 250 : 360, window.innerWidth, e).toFixed(0) + 'px';
      media.style.height = FS.lerp(small ? 340 : 460, vh, e).toFixed(0) + 'px';
      if (grade) grade.style.opacity = FS.lerp(1, 0.55, p).toFixed(3);
      var tx = FS.clamp(p / 0.9) * 18;
      words.forEach(function (w, i) { w.style.transform = 'translateX(' + (i % 2 ? '' : '-') + tx.toFixed(1) + 'vw)'; });
    });
  });
})();

/* Cinematic hero: same choreography as the homepage opener. */
(function () {
  var sec = document.querySelector('.cx');
  if (!sec || FS.reduce) return;
  var intro = sec.querySelector('.cx__intro'), when = sec.querySelector('.cx__when'), media = sec.querySelector('.cx__media');
  var brand = sec.querySelector('.cx__brand'), grid = sec.querySelector('.cx__grid'), cue = sec.querySelector('.cx__cue');
  if (!intro || !media || !brand) return;
  sec.classList.add('cx--live');
  var map = FS.map, lerp = FS.lerp, eOut = FS.eOut;
  function fade(el, op, y, blur, scale) {
    el.style.opacity = op.toFixed(3);
    el.style.transform = 'translateY(' + y.toFixed(1) + 'px)' + (scale ? ' scale(' + scale.toFixed(3) + ')' : '');
    el.style.filter = blur > 0.05 ? 'blur(' + blur.toFixed(1) + 'px)' : 'none';
    el.style.visibility = op <= 0.01 ? 'hidden' : 'visible';
  }
  FS.scene(sec, function (p, vh) {
    var m = window.innerWidth < 760, insX0 = m ? 8 : 32, insY0 = m ? 26 : 20;
    var iP = map(p, 0, 0.2);
    fade(intro, 1 - iP, -34 * iP, 20 * iP, 1 + 0.16 * iP);
    if (grid) grid.style.opacity = (1 - map(p, 0.06, 0.34)).toFixed(3);
    if (cue) cue.style.opacity = (1 - map(p, 0, 0.12)).toFixed(3);
    var c = FS.eInOut(map(p, 0.05, 0.4));
    var insY = lerp(insY0, 0, c), insX = lerp(insX0, 0, c), rad = lerp(24, 0, c);
    var clip = 'inset(' + insY.toFixed(2) + '% ' + insX.toFixed(2) + '% ' + insY.toFixed(2) + '% ' + insX.toFixed(2) + '% round ' + rad.toFixed(1) + 'px)';
    media.style.clipPath = clip; media.style.webkitClipPath = clip;
    media.style.transform = 'translateY(' + lerp(0.1 * vh, 0, c).toFixed(1) + 'px)';
    media.style.opacity = map(p, 0.03, 0.11).toFixed(3);
    var bStart = 0.48;
    if (when) {
      var wIn = eOut(map(p, 0.4, 0.53)), wOut = map(p, 0.63, 0.73), wOp = wIn * (1 - wOut);
      fade(when, wOp, lerp(46, 0, wIn) + lerp(0, -46, wOut), (wOp > 0.01 && wOp < 0.99) ? lerp(12, 0, wIn) + lerp(0, 12, wOut) : 0);
      bStart = 0.73;
    }
    var bP = eOut(map(p, bStart, bStart + 0.19));
    fade(brand, bP, lerp(34, 0, bP), lerp(10, 0, bP), lerp(0.97, 1, bP));
  });
})();

/* Testimony hero: pinned scroll, cards drift at different speeds (depth), closing card at the end. Desktop only. */
(function () {
  var sec = document.querySelector('.th');
  if (!sec || FS.reduce || FS.mobile(900)) return;
  var intro = sec.querySelector('.th__intro'), bg = sec.querySelector('.th__bg'), cue = sec.querySelector('.th__cue'), close = sec.querySelector('.th__close');
  var a = sec.querySelector('.th__slot--a .th__card'), b = sec.querySelector('.th__slot--b .th__card'), c = sec.querySelector('.th__slot--c .th__card');
  if (!intro || !a || !b || !c || !close) return;
  sec.classList.add('th--live');
  var clamp = FS.clamp;
  function seg(p, a0, a1, v0, v1) { return v0 + (v1 - v0) * clamp((p - a0) / (a1 - a0)); }
  function win(p, k0, k1, k2, k3) { return p < k1 ? clamp((p - k0) / (k1 - k0)) : p < k2 ? 1 : 1 - clamp((p - k2) / (k3 - k2)); }
  function show(el, op) { el.style.opacity = op.toFixed(3); el.style.visibility = op <= 0.01 ? 'hidden' : 'visible'; }
  FS.scene(sec, function (p) {
    show(intro, seg(p, 0, 0.14, 1, 0));
    intro.style.transform = 'translateY(' + seg(p, 0, 0.14, 0, -80).toFixed(1) + 'px) scale(' + seg(p, 0, 0.14, 1, 0.92).toFixed(3) + ')';
    if (cue) cue.style.opacity = seg(p, 0, 0.06, 1, 0).toFixed(3);
    if (bg) { bg.style.transform = 'scale(' + seg(p, 0, 1, 1.08, 1.25).toFixed(3) + ')'; bg.style.opacity = (p < 0.1 ? seg(p, 0, 0.1, 0.35, 0.2) : p < 0.9 ? 0.2 : seg(p, 0.9, 1, 0.2, 0.08)).toFixed(3); }
    a.style.transform = 'translateY(' + seg(p, 0.08, 0.55, 420, -40).toFixed(1) + 'px) rotate(' + seg(p, 0.08, 0.55, -8, -3).toFixed(2) + 'deg)';
    show(a, win(p, 0.08, 0.2, 0.85, 1));
    b.style.transform = 'translateY(' + seg(p, 0.2, 0.8, -320, 60).toFixed(1) + 'px) rotate(' + seg(p, 0.2, 0.8, 6, 2).toFixed(2) + 'deg)';
    show(b, win(p, 0.2, 0.32, 0.88, 1));
    c.style.transform = 'translateY(' + seg(p, 0.32, 0.95, 260, -20).toFixed(1) + 'px) scale(' + seg(p, 0.32, 0.6, 0.9, 1).toFixed(3) + ') rotate(' + seg(p, 0.32, 0.95, -2, 2).toFixed(2) + 'deg)';
    show(c, win(p, 0.32, 0.44, 0.9, 1));
    show(close, seg(p, 0.82, 0.94, 0, 1));
    close.style.transform = 'translateY(' + seg(p, 0.82, 0.94, 40, 0).toFixed(1) + 'px)';
  });
})();

/* Scroll banners: each word blurs in as the section scrolls, then the line and action. Static on phones / reduced motion. */
(function () {
  if (FS.reduce || FS.mobile(760)) return;
  document.querySelectorAll('.sbn').forEach(function (sec) {
    var words = sec.querySelectorAll('.sbn__w'), after = sec.querySelector('.sbn__after'), bg = sec.querySelector('.sbn__bg');
    sec.classList.add('sbn--live');
    FS.scene(sec, function (p) {
      words.forEach(function (w, i) {
        var t = FS.clamp((p - 0.08 - i * 0.18) / 0.2), e = 1 - Math.pow(1 - t, 3);
        w.style.opacity = e.toFixed(3);
        w.style.filter = e < 0.99 ? 'blur(' + (16 * (1 - e)).toFixed(1) + 'px)' : 'none';
        w.style.transform = 'translateY(' + (30 * (1 - e)).toFixed(1) + 'px)';
      });
      if (after) {
        var a = FS.clamp((p - 0.62) / 0.2), ea = 1 - Math.pow(1 - a, 3);
        after.style.opacity = ea.toFixed(3);
        after.style.transform = 'translateY(' + (24 * (1 - ea)).toFixed(1) + 'px)';
        after.style.visibility = ea <= 0.01 ? 'hidden' : 'visible';
      }
      if (bg) bg.style.transform = 'scale(' + (1.12 - 0.12 * p).toFixed(3) + ')';
    });
  });
})();

/* ---- interaction (pointer / keyboard driven; timing from tokens) ---- */

/* Video dialog: any [data-vimeo] trigger plays that video in a native dialog; Escape or Close stops it. */
(function () {
  var triggers = document.querySelectorAll('[data-vimeo]:not(.vcard)');
  if (!triggers.length) return;
  var dlg = document.createElement('dialog');
  if (typeof dlg.showModal !== 'function') return;
  dlg.className = 'vd';
  dlg.setAttribute('aria-label', 'Video');
  dlg.innerHTML = '<button class="vd__close" type="button">Close <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="vd__frame"><iframe title="Video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>';
  document.body.appendChild(dlg);
  var frame = dlg.querySelector('iframe'), opener = null;
  triggers.forEach(function (t) {
    t.addEventListener('click', function (e) {
      e.preventDefault(); opener = t;
      frame.title = t.getAttribute('data-title') || 'Video';
      frame.src = 'https://player.vimeo.com/video/' + t.getAttribute('data-vimeo') + '?autoplay=1&title=0&byline=0&portrait=0&dnt=1';
      dlg.showModal(); dlg.querySelector('.vd__close').focus();
    });
  });
  dlg.querySelector('.vd__close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function () { frame.src = ''; if (opener) opener.focus(); });
})();

/* Case selector: hovering or focusing a type swaps the background photo and the detail panel. Clicking navigates. */
(function () {
  document.querySelectorAll('.sel').forEach(function (sel) {
    var items = sel.querySelectorAll('.sel__item'), bgs = sel.querySelectorAll('.sel__bg');
    var t = sel.querySelector('.sel__t'), d = sel.querySelector('.sel__d'), go = sel.querySelector('.sel__go'), fade = sel.querySelector('.sel__fade');
    if (!items.length || !t) return;
    var cur = null, timer = null;
    function show(it) {
      if (it === cur) return;
      cur = it;
      items.forEach(function (x) { x.classList.toggle('is-on', x === it); });
      bgs.forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-k') === it.getAttribute('data-k')); });
      clearTimeout(timer);
      fade.classList.add('is-swap');
      timer = setTimeout(function () {
        t.textContent = it.getAttribute('data-stmt') || it.querySelector('.sel__name').textContent;
        var lab = sel.querySelector('.sel__lab'); if (lab) lab.textContent = (it.querySelector('.sel__num') ? it.querySelector('.sel__num').textContent + ' / ' : '') + it.querySelector('.sel__name').textContent;
        d.textContent = it.querySelector('.sel__desc').textContent;
        go.href = it.href;
        go.firstChild.nodeValue = it.getAttribute('data-go') || go.firstChild.nodeValue;
        fade.classList.remove('is-swap');
      }, 180);
    }
    items.forEach(function (it) {
      it.addEventListener('mouseenter', function () { show(it); });
      it.addEventListener('focus', function () { show(it); });
    });
  });
})();

/* Load more: reveal the next batch of hidden tiles and move focus to the first new one. */
(function () {
  document.querySelectorAll('[data-more]').forEach(function (btn) {
    var list = document.getElementById(btn.getAttribute('aria-controls'));
    if (!list) return;
    var step = parseInt(btn.getAttribute('data-more'), 10) || 3;
    btn.addEventListener('click', function () {
      var hidden = list.querySelectorAll('li[hidden]');
      for (var i = 0; i < Math.min(step, hidden.length); i++) hidden[i].hidden = false;
      var first = hidden[0] && hidden[0].querySelector('a, button, h3');
      if (first) { if (!first.matches('a, button')) first.setAttribute('tabindex', '-1'); first.focus(); }
      if (!list.querySelector('li[hidden]')) btn.parentNode.hidden = true;
    });
  });
})();

/* Common questions: a link to #question opens that answer and brings it into view. */
(function () {
  function openHash() {
    if (!location.hash) return;
    var el = document.getElementById(location.hash.slice(1));
    if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView({ block: 'start' }); }
  }
  window.addEventListener('hashchange', openHash);
  openHash();
})();

/* Background videos: load the muted Vimeo loop on larger screens (poster only on phones and under reduced motion),
   add a pause button, and pause while off-screen. */
(function () {
  var vids = document.querySelectorAll('.vbg[data-vim]');
  if (!vids.length || FS.reduce || FS.mobile(760)) return;
  function post(frame, method) { try { frame.contentWindow.postMessage(JSON.stringify({ method: method }), 'https://player.vimeo.com'); } catch (e) {} }
  vids.forEach(function (v) {
    var frame = v.querySelector('iframe');
    if (!frame) return;
    frame.src = 'https://player.vimeo.com/video/' + v.getAttribute('data-vim') + '?background=1&autopause=0&muted=1&loop=1&dnt=1';
    var host = v.parentElement;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'vbg__pause'; btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Pause background video');
    host.appendChild(btn);
    var userPaused = false, onScreen = true;
    function sync() { post(frame, userPaused || !onScreen ? 'pause' : 'play'); }
    btn.addEventListener('click', function () {
      userPaused = !userPaused;
      btn.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      btn.setAttribute('aria-label', userPaused ? 'Play background video' : 'Pause background video');
      sync();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { onScreen = e.isIntersecting; sync(); }); }, { threshold: 0 }).observe(v);
    }
    frame.addEventListener('load', sync);
  });
})();

/* Marquee: pause button (moving content must be stoppable). */
(function () {
  document.querySelectorAll('.mq').forEach(function (mq) {
    var b = mq.querySelector('.mq__pause');
    if (!b) return;
    b.addEventListener('click', function () {
      var on = mq.classList.toggle('is-paused');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? 'Play the moving list' : 'Pause the moving list');
    });
  });
})();

/* "On this page" guide: marks the section being read. */
(function () {
  var toc = document.querySelector('.toc');
  if (!toc || !('IntersectionObserver' in window)) return;
  var links = toc.querySelectorAll('a[href^="#"]'), map = {};
  links.forEach(function (a) { var s = document.getElementById(a.getAttribute('href').slice(1)); if (s) map[s.id] = a; });
  function set(id) { links.forEach(function (a) { if (a === map[id]) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) set(e.target.id); });
  }, { rootMargin: '-35% 0px -55% 0px' });
  Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  if (links[0]) links[0].setAttribute('aria-current', 'true');
})();

/* Accordions: animate open/close height on native details (keyboard and screen readers keep native behaviour).
   Open on --m-t-base with the state curve; close at 70% of that (exits are quicker than entrances). */
(function () {
  if (FS.reduce || !Element.prototype.animate) return;
  var dur = FS.tok('--m-t-base', 450), ease = FS.tok('--m-ease-state', 'cubic-bezier(.33,0,.18,1)');
  document.querySelectorAll('.faqx details, .pbq details').forEach(function (d) {
    var s = d.querySelector('summary');
    if (!s) return;
    s.addEventListener('click', function (e) {
      e.preventDefault();
      if (d._anim) d._anim.cancel();
      var start = d.offsetHeight, end;
      d.classList.add('is-anim');
      if (d.open) {
        end = s.offsetHeight;
        d._anim = d.animate({ height: [start + 'px', end + 'px'] }, { duration: dur * 0.7, easing: ease });
        d._anim.onfinish = function () { d.open = false; d.classList.remove('is-anim'); d._anim = null; };
      } else {
        d.open = true;
        end = d.offsetHeight;
        d._anim = d.animate({ height: [start + 'px', end + 'px'] }, { duration: dur, easing: ease });
        d._anim.onfinish = function () { d.classList.remove('is-anim'); d._anim = null; };
      }
    });
  });
})();

/* Docket: a photo of the hovered case type follows the cursor (fine pointers only). */
(function () {
  var list = document.querySelector('.dk__list');
  if (!list || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || FS.reduce) return;
  var peek = document.createElement('div'); peek.className = 'dk__peek'; peek.setAttribute('aria-hidden', 'true');
  var imgs = {};
  list.querySelectorAll('.dk__row a[data-img]').forEach(function (a) {
    var src = a.getAttribute('data-img');
    if (!imgs[src]) { var im = document.createElement('img'); im.src = src; im.alt = ''; peek.appendChild(im); imgs[src] = im; }
  });
  document.body.appendChild(peek);
  var x = 0, y = 0, cx = 0, cy = 0, raf = null, on = false;
  function loop() { cx += (x - cx) * 0.16; cy += (y - cy) * 0.16; peek.style.transform = 'translate3d(' + (cx - peek.offsetWidth / 2 + 260).toFixed(1) + 'px,' + (cy - peek.offsetHeight / 2).toFixed(1) + 'px,0)'; raf = on ? requestAnimationFrame(loop) : null; }
  list.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; if (!raf) { cx = x; cy = y; raf = requestAnimationFrame(loop); } });
  list.querySelectorAll('.dk__row a[data-img]').forEach(function (a) {
    a.addEventListener('mouseenter', function () { on = true; peek.classList.add('is-on'); Object.keys(imgs).forEach(function (k) { imgs[k].classList.toggle('is-on', k === a.getAttribute('data-img')); }); if (!raf) raf = requestAnimationFrame(loop); });
  });
  list.addEventListener('mouseleave', function () { on = false; peek.classList.remove('is-on'); });
})();

/* Coverage plot: the city list and the plot highlight each other. */
(function () {
  var geo = document.querySelector('.geo');
  if (!geo) return;
  function set(id) {
    geo.classList.toggle('has-on', !!id);
    geo.querySelectorAll('[data-city]').forEach(function (el) { el.classList.toggle('is-on', el.getAttribute('data-city') === id); });
  }
  geo.querySelectorAll('.geo__item[data-city]').forEach(function (it) {
    it.addEventListener('mouseenter', function () { set(it.getAttribute('data-city')); });
    it.addEventListener('focusin', function () { set(it.getAttribute('data-city')); });
  });
  geo.querySelector('.geo__list').addEventListener('mouseleave', function () { set(null); });
  geo.querySelector('.geo__list').addEventListener('focusout', function (e) { if (!geo.querySelector('.geo__list').contains(e.relatedTarget)) set(null); });
})();
