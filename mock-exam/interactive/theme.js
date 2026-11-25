// Theme: light by default; dark only when the visitor turns it on.
// Loaded in <head> (not deferred) so the saved theme applies before first paint.
(function () {
  var KEY = 'ccaTheme';
  var root = document.documentElement;

  function saved() {
    try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch (e) { return 'light'; }
  }
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var btn = document.getElementById('themeToggle');
    if (btn) {
      var dark = theme === 'dark';
      btn.textContent = dark ? '\u2600\uFE0F' : '\uD83C\uDF19';
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.title = btn.getAttribute('aria-label');
    }
  }

  apply(saved());

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'themeToggle';
    btn.className = 'theme-toggle';
    document.body.appendChild(btn);
    apply(root.getAttribute('data-theme'));
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, next); } catch (e) { /* private mode: still toggles for this page */ }
      apply(next);
    });
  });
})();
