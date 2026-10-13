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
