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
