/* V2 ledgers: the row nearest the middle of the screen reads in full. Static (all rows full) under reduced motion. */
(function () {
  var ledgers = document.querySelectorAll('.xr');
  if (!ledgers.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ledgers.forEach(function (l) { l.classList.add('xr--static'); });
    return;
  }
  var ticking = false;
  function update() {
    ticking = false;
    var mid = window.innerHeight * 0.5;
    ledgers.forEach(function (sec) {
      var r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var best = null, bestD = Infinity, rows = sec.querySelectorAll('.xr__row');
      rows.forEach(function (row) { var b = row.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - mid); if (d < bestD) { bestD = d; best = row; } });
      rows.forEach(function (row) { row.classList.toggle('is-on', row === best); });
    });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* Client story: the frame grows from a card to full screen as the section scrolls (static under reduced motion). */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.story').forEach(function (sec) {
    if (reduce) return;
    var scroll = sec.querySelector('.story__scroll'), media = sec.querySelector('.story__media');
    var grade = sec.querySelector('.story__grade'), words = sec.querySelectorAll('.story__word');
    if (!scroll || !media) return;
    sec.classList.add('story--live');
    function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    var ticking = false;
    function render() {
      ticking = false;
      var vh = window.innerHeight, total = scroll.offsetHeight - vh;
      if (total <= 0) return;
      var p = clamp(-scroll.getBoundingClientRect().top / total), e = 1 - Math.pow(1 - p, 3);
      var small = window.innerWidth < 760;
      media.style.width = lerp(small ? 250 : 360, window.innerWidth, e).toFixed(0) + 'px';
      media.style.height = lerp(small ? 340 : 460, vh, e).toFixed(0) + 'px';
      if (grade) grade.style.opacity = lerp(1, 0.55, p).toFixed(3);
      var tx = clamp(p / 0.9) * 18;
      words.forEach(function (w, i) { w.style.transform = 'translateX(' + (i % 2 ? '' : '-') + tx.toFixed(1) + 'vw)'; });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(render); } }, { passive: true });
    window.addEventListener('resize', render);
    render();
  });
})();

/* Cutout word: the photograph drifts inside the letters as the band passes (static under reduced motion). */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var words = document.querySelectorAll('.cut__word');
  if (!words.length) return;
  var ticking = false;
  function render() {
    ticking = false;
    words.forEach(function (w) {
      var r = w.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      var p = Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1);
      w.style.backgroundPosition = '50% ' + (10 + p * 50).toFixed(1) + '%';
    });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(render); } }, { passive: true });
  render();
})();

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
        t.textContent = it.querySelector('.sel__name').textContent;
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
  if (!vids.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(max-width: 760px)').matches) return;
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

/* Cinematic hero: same choreography as the homepage opener. */
(function () {
  var sec = document.querySelector('.cx');
  if (!sec || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var intro = sec.querySelector('.cx__intro'), when = sec.querySelector('.cx__when'), media = sec.querySelector('.cx__media');
  var brand = sec.querySelector('.cx__brand'), grid = sec.querySelector('.cx__grid'), cue = sec.querySelector('.cx__cue');
  if (!intro || !media || !brand) return;
  sec.classList.add('cx--live');
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function map(p, a, b) { return clamp((p - a) / (b - a)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function eOut(t) { return 1 - Math.pow(1 - t, 3); }
  function eInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  var vh, insX0, insY0;
  function sizes() { vh = window.innerHeight; var m = window.innerWidth < 760; insX0 = m ? 8 : 32; insY0 = m ? 26 : 20; }
  sizes();
  function fade(el, op, y, blur, scale) {
    el.style.opacity = op.toFixed(3);
    el.style.transform = 'translateY(' + y.toFixed(1) + 'px)' + (scale ? ' scale(' + scale.toFixed(3) + ')' : '');
    el.style.filter = blur > 0.05 ? 'blur(' + blur.toFixed(1) + 'px)' : 'none';
    el.style.visibility = op <= 0.01 ? 'hidden' : 'visible';
  }
  var ticking = false;
  function render() {
    ticking = false;
    var total = sec.offsetHeight - vh;
    if (total <= 0) return;
    var p = clamp(-sec.getBoundingClientRect().top / total);
    var iP = map(p, 0, 0.2);
    fade(intro, 1 - iP, -34 * iP, 20 * iP, 1 + 0.16 * iP);
    if (grid) grid.style.opacity = (1 - map(p, 0.06, 0.34)).toFixed(3);
    if (cue) cue.style.opacity = (1 - map(p, 0, 0.12)).toFixed(3);
    var c = eInOut(map(p, 0.05, 0.4));
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
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(render); } }, { passive: true });
  window.addEventListener('resize', function () { sizes(); render(); });
  render();
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

/* Testimony hero: pinned scroll, cards drift at different speeds (depth), closing card at the end. Desktop only. */
(function () {
  var sec = document.querySelector('.th');
  if (!sec || window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(max-width: 900px)').matches) return;
  var intro = sec.querySelector('.th__intro'), bg = sec.querySelector('.th__bg'), cue = sec.querySelector('.th__cue'), close = sec.querySelector('.th__close');
  var a = sec.querySelector('.th__slot--a .th__card'), b = sec.querySelector('.th__slot--b .th__card'), c = sec.querySelector('.th__slot--c .th__card');
  if (!intro || !a || !b || !c || !close) return;
  sec.classList.add('th--live');
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(p, a0, a1, v0, v1) { return v0 + (v1 - v0) * clamp((p - a0) / (a1 - a0)); }
  function win(p, k0, k1, k2, k3) { return p < k1 ? clamp((p - k0) / (k1 - k0)) : p < k2 ? 1 : 1 - clamp((p - k2) / (k3 - k2)); }
  function show(el, op) { el.style.opacity = op.toFixed(3); el.style.visibility = op <= 0.01 ? 'hidden' : 'visible'; }
  var ticking = false;
  function render() {
    ticking = false;
    var total = sec.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    var p = clamp(-sec.getBoundingClientRect().top / total);
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
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(render); } }, { passive: true });
  window.addEventListener('resize', render);
  render();
})();

/* Honors grid: stagger the cells in once when the grid reaches the viewport. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  document.querySelectorAll('.hg__grid').forEach(function (g) {
    g.classList.add('is-pending');
    new IntersectionObserver(function (es, io) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.disconnect();
        g.classList.add('is-in');
        g.querySelectorAll('li').forEach(function (li, i) { li.style.transitionDelay = (i * 70) + 'ms'; });
        requestAnimationFrame(function () { g.classList.remove('is-pending'); });
        setTimeout(function () { g.querySelectorAll('li').forEach(function (li) { li.style.transitionDelay = ''; }); }, 1400);
      });
    }, { threshold: 0.2 }).observe(g);
  });
})();

/* Scroll banner: each word blurs in as the section scrolls, then the call to action. Static on phones / reduced motion. */
(function () {
  var sec = document.querySelector('.sbn');
  if (!sec || window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(max-width: 760px)').matches) return;
  var words = sec.querySelectorAll('.sbn__w'), after = sec.querySelector('.sbn__after'), bg = sec.querySelector('.sbn__bg');
  sec.classList.add('sbn--live');
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  var ticking = false;
  function render() {
    ticking = false;
    var total = sec.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    var p = clamp(-sec.getBoundingClientRect().top / total);
    words.forEach(function (w, i) {
      var t = clamp((p - 0.08 - i * 0.18) / 0.2), e = 1 - Math.pow(1 - t, 3);
      w.style.opacity = e.toFixed(3);
      w.style.filter = e < 0.99 ? 'blur(' + (16 * (1 - e)).toFixed(1) + 'px)' : 'none';
      w.style.transform = 'translateY(' + (30 * (1 - e)).toFixed(1) + 'px)';
    });
    var a = clamp((p - 0.62) / 0.2), ea = 1 - Math.pow(1 - a, 3);
    after.style.opacity = ea.toFixed(3);
    after.style.transform = 'translateY(' + (24 * (1 - ea)).toFixed(1) + 'px)';
    after.style.visibility = ea <= 0.01 ? 'hidden' : 'visible';
    if (bg) bg.style.transform = 'scale(' + (1.12 - 0.12 * p).toFixed(3) + ')';
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(render); } }, { passive: true });
  window.addEventListener('resize', render);
  render();
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

/* Closing: the line arrives word by word, once, when the section comes into view. */
(function () {
  var cl = document.querySelector('.cl');
  if (!cl) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { cl.classList.add('is-in'); return; }
  new IntersectionObserver(function (es, io) {
    es.forEach(function (e) { if (e.isIntersecting) { cl.classList.add('is-in'); io.disconnect(); } });
  }, { threshold: 0.25 }).observe(cl);
})();

/* Ledger: rows arrive in sequence once. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  document.querySelectorAll('.led__list').forEach(function (l) {
    l.classList.add('is-pending');
    new IntersectionObserver(function (es, io) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.disconnect();
        l.classList.add('is-in');
        l.querySelectorAll('.ledr').forEach(function (r, i) { r.style.transitionDelay = (i * 90) + 'ms'; });
        requestAnimationFrame(function () { l.classList.remove('is-pending'); });
        setTimeout(function () { l.querySelectorAll('.ledr').forEach(function (r) { r.style.transitionDelay = ''; }); }, 1600);
      });
    }, { threshold: 0.15 }).observe(l);
  });
})();

/* Accordions: animate open/close height on native details (keyboard and screen readers keep native behaviour). */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !Element.prototype.animate) return;
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
        d._anim = d.animate({ height: [start + 'px', end + 'px'] }, { duration: 260, easing: 'cubic-bezier(.33,0,.18,1)' });
        d._anim.onfinish = function () { d.open = false; d.classList.remove('is-anim'); d._anim = null; };
      } else {
        d.open = true;
        end = d.offsetHeight;
        d._anim = d.animate({ height: [start + 'px', end + 'px'] }, { duration: 360, easing: 'cubic-bezier(.33,0,.18,1)' });
        d._anim.onfinish = function () { d.classList.remove('is-anim'); d._anim = null; };
      }
    });
  });
})();

/* Chapters: the photograph settles once the chapter comes into view. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { threshold: 0.25 });
  document.querySelectorAll('.chap').forEach(function (c) { io.observe(c); });
})();
/* Injury hero: the photograph band settles once. */
(function () {
  var h = document.querySelector('.ijh');
  if (!h || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { if (h) h.classList.add('is-in'); return; }
  requestAnimationFrame(function () { setTimeout(function () { h.classList.add('is-in'); }, 120); });
})();

/* Docket: a photo of the hovered case type follows the cursor (fine pointers only). */
(function () {
  var list = document.querySelector('.dk__list');
  if (!list || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
