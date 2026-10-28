/* PROTOTYPE 2 (Oct 27, 2026) · Glass navigation. The nav is glass only while photograph alone is behind it: it turns solid the
   moment the hero's first line of text reaches it (measured: cream headline under 0.55 glass drops links to 3.7:1), and stays
   solid over every section after the hero. Scrolling back to the top returns it to glass.
   Uses the shared FS frame loop from shared/v2.js; measures the real nav height so the hero offset is exact. */
(function () {
  var nav = document.querySelector('.nav'); if (!nav) return;
  var hero = document.querySelector('main > section'); if (!hero) return;
  document.body.classList.add('has-glass-nav'); nav.classList.add('nav--glass');
  var root = document.documentElement;
  var lead = hero.querySelector('.wrap > *') || hero;  /* first text in the hero (the breadcrumb on practice pages) */
  function measure() { root.style.setProperty('--nav-h', nav.offsetHeight + 'px'); }
  function set() { nav.classList.toggle('is-solid', lead.getBoundingClientRect().top < nav.offsetHeight + 24); }
  measure(); set();
  window.addEventListener('resize', measure, { passive: true });
  if (window.FS && FS.frame) FS.frame(set); else window.addEventListener('scroll', set, { passive: true });
})();
