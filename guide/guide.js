// Study guide reader: mobile menu + "On this page" highlighting.
(function () {
  var btn = document.querySelector('.guide-menu-btn');
  var side = document.getElementById('guideSidebar');
  if (btn && side) {
    btn.addEventListener('click', function () {
      var open = side.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      if (open) side.scrollIntoView({ block: 'start' });
    });
  }
  var links = Array.prototype.slice.call(document.querySelectorAll('.guide-toc a'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.classList.remove('toc-active'); });
      var a = byId[e.target.id];
      if (a) a.classList.add('toc-active');
    });
  }, { rootMargin: '-80px 0px -70% 0px' });
  Object.keys(byId).forEach(function (id) {
    var h = document.getElementById(id);
    if (h) obs.observe(h);
  });
})();
