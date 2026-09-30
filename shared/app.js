(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var rev = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    rev.forEach(function (e) { e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    rev.forEach(function (e) { io.observe(e); });
  }

  /* clickable rows / cards navigate to their data-href (routes may 404 pre-launch) */
  document.querySelectorAll('[data-href]').forEach(function (el) {
    el.addEventListener('click', function () {
      var h = el.getAttribute('data-href');
      if (h) window.location.href = h;
    });
  });
})();
