/* Festeryga Law · shared cinematic behaviors (depth-pass pages).
   fade-on-scroll, hero + big-number parallax, Vimeo backdrop loaders.
   All motion gated behind prefers-reduced-motion. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* fade-on-scroll */
  var faders = document.querySelectorAll('.fade-on-scroll');
  if (reduce || !('IntersectionObserver' in window)) {
    faders.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    faders.forEach(function (el) { io.observe(el); });
  }

  if (reduce) return;

  /* subtle parallax on marked slow elements only (no hero-title parallax:
     a bottom-anchored title slides off the fold and into the credits). */
  var slows = document.querySelectorAll('[data-parallax-slow]');
  if (!slows.length) return;
  var vh = window.innerHeight, ticking = false;
  window.addEventListener('resize', function () { vh = window.innerHeight; });
  function onScroll() {
    slows.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var mid = r.top + r.height / 2 - vh / 2;
      el.style.transform = 'translateY(' + (mid * -0.05) + 'px)';
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
})();
