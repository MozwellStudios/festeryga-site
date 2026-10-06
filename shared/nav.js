/* About dropdown: the chevron button toggles a panel placed under its link.
   Click or tap everywhere, hover on fine pointers, Escape and outside click close it. */
(function () {
  var header = document.querySelector('header.nav');
  if (!header) return;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  header.querySelectorAll('.nav__more').forEach(function (btn) {
    var menu = document.getElementById(btn.getAttribute('aria-controls'));
    if (!menu) return;
    var group = btn.closest('.nav__group') || btn, timer = null;
    function place() {
      var h = header.getBoundingClientRect(), g = group.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(g.left - h.left, h.width - menu.offsetWidth - 8)) + 'px';
    }
    function open() { clearTimeout(timer); menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); place(); }
    function close(refocus) { clearTimeout(timer); menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus(); }
    btn.addEventListener('click', function () { if (menu.hidden) open(); else close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) close(true); });
    document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target) && !group.contains(e.target)) close(); });
    menu.addEventListener('focusout', function (e) { if (e.relatedTarget && !menu.contains(e.relatedTarget) && e.relatedTarget !== btn) close(); });
    if (fine) {
      [group, menu].forEach(function (el) {
        el.addEventListener('mouseenter', open);
        el.addEventListener('mouseleave', function () { timer = setTimeout(close, 180); });
      });
    }
    window.addEventListener('resize', function () { if (!menu.hidden) place(); });
    var strip = btn.closest('.nav__strip');
    if (strip) strip.addEventListener('scroll', function () { if (!menu.hidden) place(); }, { passive: true });
  });
})();
