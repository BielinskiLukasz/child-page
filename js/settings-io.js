// Parent-only backup of settings (menu order, enabled, favourites, daily limit) inside the gated Settings.
// Export is a small JSON file or copied text; import validates everything first and applies only after confirmation.
// Nothing leaves the device (no network) and nothing here is reported to Analytics.
(function () {
  var exportBtn = document.getElementById('bak-export');
  if (!exportBtn || !window.MenuConfig || !window.Playtime) { return; }
  var FORMAT = 'swa-settings';
  var VERSION = 1;
  var MAX_BYTES = 100 * 1024;
  var copyBtn = document.getElementById('bak-copy');
  var importBtn = document.getElementById('bak-import');
  var box = document.getElementById('bak-box');
  var fileBtn = document.getElementById('bak-file-btn');
  var fileIn = document.getElementById('bak-file');
  var text = document.getElementById('bak-text');
  var applyBtn = document.getElementById('bak-apply');
  var confirmBox = document.getElementById('bak-confirm');
  var yesBtn = document.getElementById('bak-confirm-yes');
  var noBtn = document.getElementById('bak-confirm-no');
  var msg = document.getElementById('bak-msg');
  var pending = null;
  var ERR = 'Nieprawidłowy plik ustawień. Nic nie zostało zmienione.';

  function build() {
    return {
      format: FORMAT,
      version: VERSION,
      activities: window.MenuConfig.get().map(function (e) { return { id: e.id, on: e.on, fav: e.fav }; }),
      limit: window.Playtime.getLimit()
    };
  }
  function json() { return JSON.stringify(build(), null, 2); }

  // Returns { cfg, limit } (limit undefined = keep the current one) or null when the input is not usable.
  function parse(str) {
    if (typeof str !== 'string' || str.length > MAX_BYTES) { return null; }
    var o;
    try { o = JSON.parse(str); } catch (e) { return null; }
    if (!o || typeof o !== 'object' || o.format !== FORMAT || typeof o.version !== 'number' || !(o.version >= 1)) { return null; }
    var cfg = window.MenuConfig.fromImport(o.activities);
    if (!cfg) { return null; }
    var limit;
    if (o.limit === null || (typeof o.limit === 'number' && isFinite(o.limit) && o.limit > 0 && o.limit <= 1440)) { limit = o.limit; }
    return { cfg: cfg, limit: limit };
  }

  function hideConfirm() { confirmBox.hidden = true; pending = null; }
  function submit(str) {
    hideConfirm();
    var r = parse(str);
    if (!r) { msg.textContent = ERR; return; }
    pending = r;
    msg.textContent = '';
    confirmBox.hidden = false;
    noBtn.focus();
  }

  exportBtn.addEventListener('click', function () {
    try {
      var blob = new Blob([json()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'ustawienia-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      msg.textContent = 'Plik zapisany.';
    } catch (e) { msg.textContent = 'Nie udało się zapisać pliku. Spróbuj skopiować ustawienia.'; }
  });
  copyBtn.addEventListener('click', function () {
    function fallback() {
      var t = document.createElement('textarea');
      t.value = json(); t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(t);
      msg.textContent = ok ? 'Skopiowano.' : 'Nie udało się skopiować. Użyj zapisu do pliku.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json()).then(function () { msg.textContent = 'Skopiowano.'; }, fallback);
    } else { fallback(); }
  });
  importBtn.addEventListener('click', function () {
    box.hidden = !box.hidden;
    importBtn.setAttribute('aria-expanded', box.hidden ? 'false' : 'true');
    hideConfirm();
    msg.textContent = '';
    if (!box.hidden) { text.focus(); }
  });
  fileBtn.addEventListener('click', function () { fileIn.click(); });
  fileIn.addEventListener('change', function () {
    var f = fileIn.files && fileIn.files[0];
    fileIn.value = '';
    if (!f) { return; }
    if (f.size > MAX_BYTES) { hideConfirm(); msg.textContent = ERR; return; }
    var rd = new FileReader();
    rd.onload = function () { submit(String(rd.result)); };
    rd.onerror = function () { hideConfirm(); msg.textContent = ERR; };
    rd.readAsText(f);
  });
  applyBtn.addEventListener('click', function () { submit(text.value); });
  noBtn.addEventListener('click', function () { hideConfirm(); msg.textContent = 'Anulowano. Nic nie zostało zmienione.'; importBtn.focus(); });
  yesBtn.addEventListener('click', function () {
    var r = pending;
    hideConfirm();
    if (!r) { return; }
    window.MenuConfig.replace(r.cfg);
    if (r.limit !== undefined) { window.Playtime.setLimit(r.limit); }
    text.value = '';
    box.hidden = true;
    importBtn.setAttribute('aria-expanded', 'false');
    window.MenuConfig.showSettings(); // refresh the list in Settings (the menu follows the 'menuconfig' event)
    var ln = document.getElementById('limit-minutes'), nl = document.getElementById('no-limit');
    var lim = window.Playtime.getLimit();
    nl.checked = lim === null; ln.value = lim === null ? '' : String(lim); ln.disabled = lim === null;
    msg.textContent = 'Ustawienia wczytane.';
    importBtn.focus();
  });

  window.SettingsIO = { build: build, parse: parse };
})();
