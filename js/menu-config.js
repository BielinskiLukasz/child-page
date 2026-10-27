// Parent-configurable menu: which activities are enabled and in what order. Stores locally only
// one ordered list of { id, on } (no network, no cookies). UI lives in the Settings pane (behind the gate).
(function () {
  var KEY = 'swa.menu';
  var mem = null; // in-memory copy used when storage is unavailable
  var list = window.ACTIVITIES;

  function defaults() {
    return list.map(function (a) { return { id: a.id, on: !a.defaultOff, fav: false }; });
  }

  // Saved entries for unknown activities are dropped; activities missing from the save are appended enabled.
  function normalize(raw) {
    var out = [], seen = {};
    if (Array.isArray(raw)) {
      raw.forEach(function (e) {
        if (e && typeof e.id === 'string' && !seen[e.id] && list.some(function (a) { return a.id === e.id; })) {
          seen[e.id] = true;
          out.push({ id: e.id, on: e.on !== false, fav: e.fav === true });
        }
      });
    }
    list.forEach(function (a) { if (!seen[a.id]) { out.push({ id: a.id, on: !a.defaultOff, fav: false }); } });
    if (!out.some(function (e) { return e.on; })) { return defaults(); }
    return out;
  }

  function load() {
    var s;
    try { s = localStorage.getItem(KEY); } catch (e) { return mem ? normalize(mem) : defaults(); } // storage unavailable
    if (s === null) { return mem ? normalize(mem) : defaults(); }
    try { return normalize(JSON.parse(s)); } catch (e) { return defaults(); } // corrupt
  }

  function save(cfg) {
    mem = cfg;
    try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* kept in memory */ }
    document.dispatchEvent(new CustomEvent('menuconfig'));
  }

  function nameOf(id) { return list.filter(function (a) { return a.id === id; })[0].name; }
  function get() { return load(); }
  function isEnabled(id) { return load().some(function (e) { return e.id === id && e.on; }); }
  function enabledActivities() {
    return load().filter(function (e) { return e.on; }).map(function (e) {
      return list.filter(function (a) { return a.id === e.id; })[0];
    });
  }
  // Enabled favourites, in saved list order (a disabled favourite keeps its star but is not shown).
  function favouriteActivities() {
    return load().filter(function (e) { return e.on && e.fav; }).map(function (e) {
      return list.filter(function (a) { return a.id === e.id; })[0];
    });
  }
  function setFavourite(id, fav) {
    var cfg = load();
    cfg.forEach(function (e) { if (e.id === id) { e.fav = !!fav; } });
    save(cfg);
  }
  function setEnabled(id, on) {
    var cfg = load();
    if (!on && cfg.filter(function (e) { return e.on; }).length <= 1) { return false; }
    cfg.forEach(function (e) { if (e.id === id) { e.on = on; } });
    save(cfg);
    return true;
  }
  function move(id, dir) {
    var cfg = load();
    var i = cfg.map(function (e) { return e.id; }).indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= cfg.length) { return false; }
    var t = cfg[i]; cfg[i] = cfg[j]; cfg[j] = t;
    save(cfg);
    return true;
  }
  function reset() { save(defaults()); }

  window.MenuConfig = { get: get, isEnabled: isEnabled, enabledActivities: enabledActivities,
    favouriteActivities: favouriteActivities, setFavourite: setFavourite, setEnabled: setEnabled, move: move, reset: reset };

  // ---- Settings UI ----
  var box = document.getElementById('act-list');
  var msg = document.getElementById('act-msg');
  var resetBtn = document.getElementById('act-reset');
  var confirmBox = document.getElementById('act-confirm');
  var yesBtn = document.getElementById('act-confirm-yes');
  var noBtn = document.getElementById('act-confirm-no');
  if (!box) { return; }

  function btn(cls, label, text, disabled, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('aria-label', label);
    b.textContent = text;
    b.disabled = disabled;
    b.addEventListener('click', onClick);
    return b;
  }

  // Re-render; keep keyboard focus on the same control (or its counterpart if that one became disabled).
  function render(focusSel) {
    var cfg = load();
    var enabledCount = cfg.filter(function (e) { return e.on; }).length;
    box.textContent = '';
    cfg.forEach(function (e, i) {
      var name = nameOf(e.id);
      var li = document.createElement('li');
      li.className = 'act-row';
      li.dataset.id = e.id;
      var label = document.createElement('label');
      label.className = 'act-switch';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = e.on;
      cb.disabled = e.on && enabledCount <= 1;
      cb.setAttribute('aria-label', 'Pokaż w menu: ' + name);
      cb.addEventListener('change', function () {
        if (!setEnabled(e.id, cb.checked)) { cb.checked = true; }
        msg.textContent = '';
        render('[data-id="' + e.id + '"] input');
      });
      var span = document.createElement('span');
      span.textContent = name;
      label.appendChild(cb);
      label.appendChild(span);
      li.appendChild(label);
      var star = btn('act-move act-star' + (e.fav ? ' on' : ''), 'Ulubione: ' + name, e.fav ? '★' : '☆', false, function () {
        setFavourite(e.id, !e.fav); msg.textContent = '';
        render('[data-id="' + e.id + '"] .act-star');
      });
      star.setAttribute('aria-pressed', e.fav ? 'true' : 'false');
      li.appendChild(star);
      li.appendChild(btn('act-move act-up', 'Przesuń w górę: ' + name, '▲', i === 0, function () {
        move(e.id, -1); msg.textContent = '';
        render('[data-id="' + e.id + '"] .act-up');
      }));
      li.appendChild(btn('act-move act-down', 'Przesuń w dół: ' + name, '▼', i === cfg.length - 1, function () {
        move(e.id, 1); msg.textContent = '';
        render('[data-id="' + e.id + '"] .act-down');
      }));
      box.appendChild(li);
    });
    if (enabledCount <= 1) { msg.textContent = 'Co najmniej jedna zabawa musi zostać w menu.'; }
    var f = focusSel && box.querySelector(focusSel);
    if (f && !f.disabled) { f.focus(); }
    else if (focusSel) {
      var row = box.querySelector(focusSel.split(' ')[0]);
      var other = row && row.querySelector('.act-move:not(:disabled)');
      if (other) { other.focus(); }
    }
  }

  function hideConfirm() { confirmBox.hidden = true; resetBtn.hidden = false; }
  resetBtn.addEventListener('click', function () {
    resetBtn.hidden = true;
    confirmBox.hidden = false;
    noBtn.focus();
  });
  noBtn.addEventListener('click', function () { hideConfirm(); resetBtn.focus(); });
  yesBtn.addEventListener('click', function () {
    reset();
    hideConfirm();
    render();
    msg.textContent = 'Przywrócono domyślne menu.';
    resetBtn.focus();
  });

  // Called by playtime.js when Settings opens.
  window.MenuConfig.showSettings = function () { hideConfirm(); msg.textContent = ''; render(); };
})();
