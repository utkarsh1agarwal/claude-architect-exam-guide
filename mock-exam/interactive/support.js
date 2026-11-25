// "☕ Buy me a coffee" pop-up, shared by the landing page, exam player and study guide.
// Any element with [data-support] opens it; so does a URL ending in #support.
// Settings are filled in by tools/update-footers.mjs from tools/site.config.json.
(function () {
  var SUPPORT = /*support-config*/{"upiId":"utkarsh1agarwal-2@okaxis","payee":"Utkarsh Agarwal","qr":"assets/support/upi-qr.jpg","international":"","repo":"https://github.com/utkarsh1agarwal/claude-architect-exam-guide","linkedin":"https://www.linkedin.com/in/utkarsh-agarwal-ua0235/"}/*end-support-config*/;

  // Resolve asset paths relative to the site root (this file lives in mock-exam/interactive/)
  var me = document.currentScript && document.currentScript.src;
  var root = me ? me.replace(/mock-exam\/interactive\/support\.js.*$/, '') : '';

  function upiLink() {
    return 'upi://pay?pa=' + encodeURIComponent(SUPPORT.upiId) +
      '&pn=' + encodeURIComponent(SUPPORT.payee) +
      '&cu=INR&tn=' + encodeURIComponent('Claude Architect exam guide');
  }

  function build() {
    var d = document.createElement('dialog');
    d.className = 'support-dialog';
    d.setAttribute('aria-labelledby', 'supportTitle');
    d.innerHTML =
      '<button type="button" class="support-close" aria-label="Close">✕</button>' +
      '<h2 id="supportTitle">☕ Buy me a coffee</h2>' +
      '<p class="support-lead">Everything here is free. If it helped you prepare, a small contribution keeps it updated for the next exam version.</p>' +
      '<div class="support-upi">' +
        '<p class="support-label">🇮🇳 Pay with UPI (India)</p>' +
        '<img src="' + root + SUPPORT.qr + '" width="220" height="248" alt="UPI QR code for ' + SUPPORT.payee + '">' +
        '<a class="btn btn-primary support-upi-btn" href="' + upiLink() + '">Open in UPI app</a>' +
        '<p class="support-hint">On your phone? Tap the button to open GPay / PhonePe / Paytm. On a computer, scan the QR code with your phone.</p>' +
        '<div class="support-id"><code>' + SUPPORT.upiId + '</code><button type="button" class="btn support-copy">Copy UPI ID</button></div>' +
      '</div>' +
      (SUPPORT.international
        ? '<p class="support-intl">🌍 Outside India? <a href="' + SUPPORT.international + '" target="_blank" rel="noopener">Support internationally →</a></p>'
        : '<p class="support-intl">🌍 International payment options are coming soon.</p>') +
      '<p class="support-free">No money needed to help: <a href="' + SUPPORT.repo + '" target="_blank" rel="noopener">⭐ star the repo</a> or ' +
        '<a href="' + SUPPORT.linkedin + '" target="_blank" rel="noopener"><svg class="li-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="#fff" d="M7.1 9.6h2.6V18H7.1zM8.4 5.6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11.3 9.6h2.5v1.2h.04c.35-.66 1.2-1.36 2.47-1.36 2.64 0 3.13 1.74 3.13 4V18h-2.6v-4.06c0-.97-.02-2.22-1.35-2.22-1.36 0-1.57 1.06-1.57 2.15V18h-2.6z"/></svg> follow on LinkedIn</a>. Thank you! 🙏</p>';
    document.body.appendChild(d);
    d.querySelector('.support-close').addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); // click on backdrop
    d.querySelector('.support-copy').addEventListener('click', function (e) {
      var btn = e.currentTarget;
      var done = function () { btn.textContent = 'Copied ✓'; setTimeout(function () { btn.textContent = 'Copy UPI ID'; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(SUPPORT.upiId).then(done, done); else done();
    });
    return d;
  }

  var dialog = null;
  function open(e) {
    if (e) e.preventDefault();
    dialog = dialog || build();
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-support]');
    if (t) open(e);
  });
  window.openSupport = open;
  document.addEventListener('DOMContentLoaded', function () {
    if (location.hash === '#support') open();
  });
})();
