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

/* Mobile menu: a menu button beside Contact opens a full-screen sheet built from the page's own nav links,
   so every page (inner pages, home-v2, the original homepage) gets the same menu without duplicate markup. */
(function () {
  var header = document.querySelector('header.nav');
  if (!header) return;
  var right = header.querySelector('.nav__right');
  var bar = header.querySelector('.nav__strip, .nav__links');
  if (!right || !bar) return;

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav__burger';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'navsheet');
  btn.innerHTML = '<span class="nav__burger-lines" aria-hidden="true"></span><span class="nav__burger-label">Menu</span>';
  right.appendChild(btn);

  var sheet = document.createElement('div');
  sheet.className = 'navsheet';
  sheet.id = 'navsheet';
  sheet.hidden = true;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', 'Site menu');

  var brand = header.querySelector('.nav__brand');
  var html = '<div class="navsheet__top"><a class="navsheet__brand" href="' + (brand && brand.getAttribute('href') ? brand.getAttribute('href') : '#top') + '">FESTERYGA LAW</a>' +
             '<button type="button" class="navsheet__close">Close</button></div><nav class="navsheet__nav" aria-label="Site"><ul class="navsheet__list">';
  var subMenu = document.getElementById('navmenu-about');
  Array.prototype.forEach.call(bar.children, function (item) {
    var link = item.matches('a') ? item : item.querySelector('a');
    if (!link) return;
    var cur = link.getAttribute('aria-current') ? ' aria-current="page"' : '';
    var active = link.classList.contains('is-active') ? ' is-active' : '';
    var label = link.textContent.trim();
    label = label.charAt(0) + label.slice(1).toLowerCase(); // classic nav is all caps; the sheet reads in sentence case
    if (label === 'Faq') label = 'FAQ';
    html += '<li><a class="navsheet__link' + active + '" href="' + link.getAttribute('href') + '"' + cur + '>' + label + '</a>';
    if (subMenu && item.classList.contains('nav__group')) {
      var subs = Array.prototype.filter.call(subMenu.querySelectorAll('a'), function (a) {
        return a.getAttribute('href') !== link.getAttribute('href');
      });
      if (subs.length) {
        html += '<ul class="navsheet__sub">';
        subs.forEach(function (a) {
          var name = a.childNodes[0] ? a.childNodes[0].textContent.trim() : a.textContent.trim();
          var sc = a.getAttribute('aria-current') ? ' aria-current="page"' : '';
          html += '<li><a href="' + a.getAttribute('href') + '"' + sc + '>' + name + '</a></li>';
        });
        html += '</ul>';
      }
    }
    html += '</li>';
  });
  html += '</ul></nav><div class="navsheet__foot"><a class="navsheet__phone" href="tel:+17134144042">(713) 414-4042</a>' +
          '<p class="navsheet__note">Free and confidential, in English or Español. Answered 24/7.</p></div>';
  sheet.innerHTML = html;
  document.body.appendChild(sheet);

  var closeBtn = sheet.querySelector('.navsheet__close');
  function focusables() { return sheet.querySelectorAll('a[href], button'); }
  function open() {
    sheet.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('navsheet-open');
    closeBtn.focus();
  }
  function close(refocus) {
    sheet.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('navsheet-open');
    if (refocus) btn.focus();
  }
  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', function () { close(true); });
  sheet.addEventListener('click', function (e) { if (e.target.closest('a[href]')) close(false); });
  document.addEventListener('keydown', function (e) {
    if (sheet.hidden) return;
    if (e.key === 'Escape') { close(true); return; }
    if (e.key === 'Tab') {
      var f = focusables(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // leaving mobile width with the sheet open: close it
  var mq = window.matchMedia(header.classList.contains('nav--classic') ? '(max-width: 1180px)' : '(max-width: 900px)');
  (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function (e) { if (!e.matches && !sheet.hidden) close(false); });
})();
