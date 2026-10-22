// Daily playtime limit: timer, hourglass, gradual dimming, "later" screen and the parent-only Settings.
// Stores locally only { limit, used, day } (no network, no cookies). Driven by app.js via window.Playtime.
(function () {
  var KEY = 'swa.playtime';
  var DEFAULT_LIMIT = 20; // minutes
  var DIM_FROM = 0.8;     // dimming starts after 80% of the limit is used
  var MIN_OPACITY = 0.3;  // never fully dark before expiry
  var MAX_TICK = 2000;    // ms; larger gaps (clock jumps, sleep) are not counted

  var stage = document.getElementById('stage');
  var view = document.getElementById('activity-view');
  var state = { limit: DEFAULT_LIMIT, used: 0, day: today() };
  var timer = null;
  var last = 0;
  var onExpire = null;
  var running = false;
  var storageOk = true; // false once a write fails: keep state in memory so the limit still applies
  var mem = null;

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function load() {
    var s = { limit: DEFAULT_LIMIT, used: 0, day: today() };
    if (!storageOk && mem) {
      s.limit = mem.limit;
      if (mem.day === s.day) { s.used = mem.used; }
      return s;
    }
    try {
      var raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && typeof raw === 'object') {
        if (raw.limit === null || (typeof raw.limit === 'number' && raw.limit > 0 && isFinite(raw.limit))) { s.limit = raw.limit; }
        if (typeof raw.used === 'number' && raw.used >= 0 && isFinite(raw.used) && raw.day === s.day) { s.used = raw.used; }
      }
    } catch (e) { /* storage unavailable or corrupt: defaults */ }
    return s;
  }

  function save() {
    mem = { limit: state.limit, used: state.used, day: state.day };
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageOk = true; } catch (e) { storageOk = false; }
  }

  function limitMs() { return state.limit === null ? Infinity : state.limit * 60000; }
  function isExpired() { refresh(); return state.used >= limitMs(); }
  function progress() { return state.limit === null ? 0 : Math.min(1, state.used / limitMs()); }

  // Re-read storage (other tab, new day) so the timer never restarts by accident.
  function refresh() { state = load(); }

  // ---- hourglass ----
  var glass = document.createElement('div');
  glass.className = 'hourglass';
  glass.hidden = true;
  glass.setAttribute('role', 'img');
  glass.setAttribute('aria-label', 'Klepsydra pokazuje, ile czasu zostało');
  glass.innerHTML = '<svg viewBox="0 0 24 32" aria-hidden="true" focusable="false">' +
    '<polygon class="hg-top" fill="#f2c879"/><polygon class="hg-bot" fill="#f2c879"/>' +
    '<path d="M4 3h16M4 29h16M5 3l6.2 13L5 29M19 3l-6.2 13L19 29" fill="none" stroke="#5b5675" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  view.appendChild(glass);
  var topSand = glass.querySelector('.hg-top');
  var botSand = glass.querySelector('.hg-bot');

  function pts(y1, y2, hw1, hw2) {
    return (12 - hw1) + ',' + y1 + ' ' + (12 + hw1) + ',' + y1 + ' ' + (12 + hw2) + ',' + y2 + ' ' + (12 - hw2) + ',' + y2;
  }
  function drawGlass(p) {
    var rem = 1 - p, k = 7.2 / 13;
    var yt = 16 - rem * 13;
    topSand.setAttribute('points', rem <= 0 ? '' : pts(yt, 16, 8 - (yt - 3) * k, 0.8));
    var yb = 29 - p * 13;
    botSand.setAttribute('points', p <= 0 ? '' : pts(yb, 29, 0.8 + (yb - 16) * k, 8));
  }

  function paint() {
    var off = state.limit === null;
    glass.hidden = off;
    var p = progress();
    drawGlass(p);
    // Dimming is set from JS (not CSS animation) so it also works under prefers-reduced-motion.
    var o = 1;
    if (!off && p > DIM_FROM && p < 1) { o = 1 - (1 - MIN_OPACITY) * ((p - DIM_FROM) / (1 - DIM_FROM)); }
    if (fading) { return; } // the fade owns the opacity until it finishes
    // At expiry keep the current dimmed opacity: renderLater() fades from it (setting 1 here made it jump back to full).
    if (p >= 1) { return; }
    stage.style.opacity = String(o);
  }

  // ---- timer ----
  function tick() {
    var now = Date.now();
    var dt = Math.max(0, Math.min(MAX_TICK, now - last));
    last = now;
    var visible = document.visibilityState === 'visible';
    refresh(); // also rolls over to a new day
    if (visible && state.limit !== null) { state.used += dt; }
    save();
    paint();
    if (state.limit !== null && state.used >= limitMs() && onExpire) { onExpire(); }
  }

  function start(cb) {
    stop();
    onExpire = cb;
    running = true;
    refresh();
    last = Date.now();
    paint();
    timer = setInterval(tick, 1000);
  }

  function stop() {
    cancelFade();
    if (timer) { clearInterval(timer); timer = null; }
    running = false;
    onExpire = null;
    glass.hidden = true;
    stage.style.opacity = '';
    stage.style.pointerEvents = '';
  }

  document.addEventListener('visibilitychange', function () {
    last = Date.now();
    if (fading && document.hidden) { finishFade(); } // hidden tab: land in the final state, no replay
  });
  window.addEventListener('storage', function (e) { if (e.key === KEY && running) { refresh(); paint(); } });

  // ---- "later" screen ----
  var OUT_MS = 1600; // dimmed activity fades out
  var IN_MS = 2200;  // moon screen fades in (about 3.8 s in total on expiry)
  var fading = false;
  var raf = 0;
  var fadeDone = null;

  // Opacity is animated from JS (not CSS) so the fade also works under prefers-reduced-motion.
  function fadeTo(from, to, ms, done) {
    var t0 = Date.now();
    function step() {
      var k = Math.min(1, (Date.now() - t0) / ms);
      var e = k * k * (3 - 2 * k); // smoothstep: no sudden start or stop
      stage.style.opacity = String(from + (to - from) * e);
      if (k < 1) { raf = requestAnimationFrame(step); } else { raf = 0; done(); }
    }
    step();
  }
  function cancelFade() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    fading = false;
    fadeDone = null;
  }
  function finishFade() {
    var f = fadeDone;
    cancelFade();
    if (f) { f(); }
  }

  function showMoon(container) {
    container.innerHTML = '<div class="later"><svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<circle cx="32" cy="32" r="30" fill="#b9b3e0"/><path d="M36 12a20 20 0 1 0 16 32A17 17 0 0 1 36 12z" fill="#ffe9a8"/>' +
      '<path d="M22 34q3 3 6 0" fill="none" stroke="#5b5675" stroke-width="2" stroke-linecap="round"/>' +
      '<text x="44" y="22" font-size="8" fill="#fff">z</text></svg>' +
      '<h2>Na dziś już wystarczy.</h2><p>Do zobaczenia!</p></div>';
  }

  // fromActivity: time just ran out, so fade the dimmed activity out first, then the moon in.
  function renderLater(container, fromActivity) {
    cancelFade();
    var cur = parseFloat(stage.style.opacity);
    if (!isFinite(cur)) { cur = 1; }
    var finish = function () {
      cancelFade();
      stage.style.opacity = '1';
      glass.hidden = state.limit === null;
      drawGlass(1);
    };
    if (document.hidden) { showMoon(container); finish(); return; }
    fading = true;
    var swapIn = function () {
      showMoon(container);
      glass.hidden = state.limit === null;
      drawGlass(1);
      fadeDone = finish;
      fadeTo(0, 1, IN_MS, finish);
    };
    if (fromActivity) {
      container.style.pointerEvents = 'none';
      fadeDone = function () { container.style.pointerEvents = ''; swapIn(); finishFade(); };
      fadeTo(cur, 0, OUT_MS, function () { container.style.pointerEvents = ''; swapIn(); });
    } else {
      container.textContent = '';
      stage.style.opacity = '0';
      swapIn();
    }
  }

  // ---- parent area (gate + settings) ----
  var overlay = document.getElementById('parent-overlay');
  var gear = document.getElementById('gear');
  var gatePane = document.getElementById('gate-pane');
  var setPane = document.getElementById('settings-pane');
  var sumEl = document.getElementById('gate-sum');
  var gateIn = document.getElementById('gate-answer');
  var gateMsg = document.getElementById('gate-msg');
  var limitIn = document.getElementById('limit-minutes');
  var noLimit = document.getElementById('no-limit');
  var setMsg = document.getElementById('settings-msg');
  var usedEl = document.getElementById('used-info');
  var answer = 0;

  function newSum() {
    var a = 1 + Math.floor(Math.random() * 9), b = 1 + Math.floor(Math.random() * 9);
    answer = a + b;
    sumEl.textContent = a + ' + ' + b + ' = ?';
    gateIn.value = '';
  }
  function open() {
    overlay.hidden = false;
    gatePane.hidden = false;
    setPane.hidden = true;
    gateMsg.textContent = '';
    newSum();
    gateIn.focus();
  }
  function close() {
    overlay.hidden = true;
    gear.focus();
  }
  function showSettings() {
    refresh();
    gatePane.hidden = true;
    setPane.hidden = false;
    noLimit.checked = state.limit === null;
    limitIn.value = state.limit === null ? '' : String(state.limit);
    limitIn.disabled = noLimit.checked;
    setMsg.textContent = '';
    showUsed();
    if (window.MenuConfig) { window.MenuConfig.showSettings(); }
    (noLimit.checked ? noLimit : limitIn).focus();
  }
  function showUsed() {
    usedEl.textContent = 'Dzisiaj wykorzystano: ' + Math.floor(state.used / 60000) + ' min';
  }

  gear.addEventListener('click', open);
  document.getElementById('gate-close').addEventListener('click', close);
  document.getElementById('settings-close').addEventListener('click', close);
  overlay.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); } });
  document.getElementById('gate-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (gateIn.value.trim() !== '' && Number(gateIn.value) === answer) { showSettings(); return; }
    gateMsg.textContent = 'Spróbuj jeszcze raz.';
    newSum();
    gateIn.focus();
  });
  noLimit.addEventListener('change', function () { limitIn.disabled = noLimit.checked; });
  document.getElementById('settings-form').addEventListener('submit', function (e) {
    e.preventDefault();
    refresh();
    if (noLimit.checked) {
      state.limit = null;
    } else {
      var v = limitIn.value.trim().replace(',', '.');
      var n = v === '' ? NaN : Number(v);
      if (!isFinite(n) || n <= 0 || n > 1440) { setMsg.textContent = 'Wpisz liczbę minut większą od zera.'; limitIn.focus(); return; }
      state.limit = n;
    }
    save();
    setMsg.textContent = 'Zapisano.';
  });
  document.getElementById('reset-timer').addEventListener('click', function () {
    refresh();
    state.used = 0;
    save();
    showUsed();
    setMsg.textContent = 'Czas wyzerowany.';
  });

  window.Playtime = { start: start, stop: stop, isExpired: isExpired, renderLater: renderLater };
})();
