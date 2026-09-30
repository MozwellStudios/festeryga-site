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

  /* Vimeo backdrop loops: .vcover[data-vim], desktop + motion only */
  if (window.matchMedia('(min-width: 1000px)').matches) {
    document.querySelectorAll('.vcover[data-vim]').forEach(function (v) {
      var f = v.querySelector('iframe');
      if (f && !f.src) {
        f.src = 'https://player.vimeo.com/video/' + v.getAttribute('data-vim') + '?background=1&autopause=0&muted=1&loop=1&dnt=1';
      }
    });
  }

  /* parallax: hero title (0.6x) + slow elements (subtle) */
  var hero = document.querySelector('[data-parallax-hero]');
  var slows = document.querySelectorAll('[data-parallax-slow]');
  var vh = window.innerHeight, ticking = false;
  window.addEventListener('resize', function () { vh = window.innerHeight; });
  function onScroll() {
    var y = window.pageYOffset;
    if (hero && y < vh) { hero.style.transform = 'translateY(' + (y * 0.4) + 'px)'; }
    slows.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var mid = r.top + r.height / 2 - vh / 2;
      el.style.transform = 'translateY(' + (mid * -0.06) + 'px)';
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
})();
