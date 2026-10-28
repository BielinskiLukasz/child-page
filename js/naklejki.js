// Activity "Naklejki": a tray of twelve stickers (64 px each, 96 px once placed) and a big scene (meadow, sea or sky, a random order in which every one comes
// once before any repeats). A sticker dragged from the tray and released on the scene is placed with a pop and then keeps a gentle looping
// motion (every cycle is 1.4 s or longer); the same sticker can be placed many times, up to 20 on the scene. Releasing on the tray (or
// anywhere else) sends it back; a tap on a placed sticker makes it wiggle once; dragging a placed sticker onto the tray removes it. The round
// "new scene" button fades the stickers out and cross-fades to the next background over 0.8 s. Positions are fractions (0..1) of the free
// range of the scene, so rotation and resizing never push a sticker out of view and no resize code is needed (layout is pure CSS).
// Keyboard: Tab to a tray sticker, Enter/Space places it in the centre and moves the focus to it; arrows move a placed sticker, Enter/Space
// wiggles it, Delete/Backspace removes it. One pointer at a time; a second finger is ignored. Motion is CSS only: under reduced motion
// everything is placed and shown, just without the movement.
// Usage metrics: track('interaction', {variant: '<sticker>'}) per placement from the tray; there is no completion.
(function () {
  var SIZE = 96, MAX = 20, FADE_MS = 800, TAP_PX = 6, STEP = 0.05, RETURN_MS = 260;
  var SCENES = ['meadow', 'sea', 'sky'];
  var lastScene = null; // last background shown in this page session (so a new launch starts on a different one)

  // kind -> [Polish label for screen readers, looping motion class, picture]
  var KINDS = [
    ['sun', 'Słońce', 'spin', '<circle cx="32" cy="32" r="13" fill="#ffd54a"/><g stroke="#ffb627" stroke-width="4" stroke-linecap="round"><path d="M32 6v8M32 50v8M6 32h8M50 32h8M13.6 13.6l5.6 5.6M44.8 44.8l5.6 5.6M13.6 50.4l5.6-5.6M44.8 19.2l5.6-5.6"/></g><circle cx="27" cy="30" r="1.8" fill="#8a5a1e"/><circle cx="37" cy="30" r="1.8" fill="#8a5a1e"/><path d="M27 37q5 4 10 0" fill="none" stroke="#8a5a1e" stroke-width="1.8" stroke-linecap="round"/>'],
    ['flower', 'Kwiatek', 'sway', '<path d="M32 30V60" stroke="#5fae5a" stroke-width="4" stroke-linecap="round"/><path d="M32 50q-10-2-12-10q10 0 12 10z" fill="#7cc576"/><g fill="#f7a8c9"><circle cx="32" cy="14" r="8"/><circle cx="46" cy="24" r="8"/><circle cx="18" cy="24" r="8"/><circle cx="24" cy="38" r="8"/><circle cx="40" cy="38" r="8"/></g><circle cx="32" cy="28" r="7" fill="#ffd54a"/>'],
    ['fish', 'Rybka', 'floatx', '<path d="M8 32L2 22V42Z" fill="#ff9f6b" transform="translate(4 0)"/><ellipse cx="34" cy="32" rx="22" ry="14" fill="#ffb072"/><path d="M34 18Q40 10 46 18Z" fill="#ff9f6b"/><circle cx="46" cy="29" r="3" fill="#fff"/><circle cx="47" cy="29" r="1.5" fill="#5b5675"/><path d="M30 24q4 8 0 16M38 25q3 7 0 14" fill="none" stroke="#ff9f6b" stroke-width="2" stroke-linecap="round"/>'],
    ['cloud', 'Chmurka', 'drift', '<path d="M18 46a12 12 0 0 1-1-24a14 14 0 0 1 27-3a11 11 0 0 1 4 27z" fill="#fff" stroke="#c9dcf0" stroke-width="2.5" stroke-linejoin="round"/><circle cx="26" cy="36" r="1.7" fill="#5b5675"/><circle cx="38" cy="36" r="1.7" fill="#5b5675"/><path d="M29 41q3 3 6 0" fill="none" stroke="#5b5675" stroke-width="1.6" stroke-linecap="round"/>'],
    ['bird', 'Ptaszek', 'bob', '<ellipse cx="30" cy="36" rx="20" ry="15" fill="#5fc8e0"/><circle cx="46" cy="26" r="10" fill="#5fc8e0"/><path d="M55 25l8 3l-8 3z" fill="#ffb627"/><circle cx="48" cy="24" r="2" fill="#fff"/><circle cx="48.6" cy="24" r="1" fill="#5b5675"/><path d="M10 34L0 26q10-2 14 4z" fill="#3fb0cc"/><path d="M22 36q8 6 16-2" fill="none" stroke="#3fb0cc" stroke-width="3" stroke-linecap="round"/><path d="M28 50v6M36 50v6" stroke="#ffb627" stroke-width="2.5" stroke-linecap="round"/>'],
    ['house', 'Domek', 'breathe', '<rect x="12" y="30" width="40" height="28" fill="#f7c9a0" stroke="#d89a68" stroke-width="2.5" stroke-linejoin="round"/><path d="M6 32L32 8L58 32Z" fill="#e8605a" stroke="#c0453f" stroke-width="2.5" stroke-linejoin="round"/><rect x="40" y="10" width="7" height="12" fill="#c0453f"/><rect x="27" y="40" width="10" height="18" rx="2" fill="#8d6847"/><rect x="15" y="36" width="9" height="9" fill="#dff1fb" stroke="#d89a68" stroke-width="1.5"/><rect x="40" y="36" width="9" height="9" fill="#dff1fb" stroke="#d89a68" stroke-width="1.5"/>'],
    ['tree', 'Drzewo', 'sway', '<rect x="28" y="36" width="8" height="24" rx="2" fill="#a8683f"/><circle cx="32" cy="22" r="17" fill="#6fbf6a"/><circle cx="20" cy="30" r="11" fill="#7cc576"/><circle cx="44" cy="30" r="11" fill="#7cc576"/><circle cx="26" cy="18" r="3" fill="#ee6a5f"/><circle cx="40" cy="26" r="3" fill="#ee6a5f"/><circle cx="30" cy="30" r="3" fill="#ee6a5f"/>'],
    ['boat', 'Łódka', 'rock', '<path d="M6 40H58L50 56H14Z" fill="#e8605a" stroke="#c0453f" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 8V40" stroke="#8d6847" stroke-width="3" stroke-linecap="round"/><path d="M34 10L54 36H34Z" fill="#fff" stroke="#c9dcf0" stroke-width="2" stroke-linejoin="round"/><path d="M30 18L14 36H30Z" fill="#ffd54a" stroke="#e0b030" stroke-width="2" stroke-linejoin="round"/>'],
    ['star', 'Gwiazdka', 'twinkle', '<path d="M32 4L39 24L60 24L43 37L50 58L32 45L14 58L21 37L4 24L25 24Z" fill="#ffd54a" stroke="#ffb627" stroke-width="3" stroke-linejoin="round"/><circle cx="27" cy="31" r="1.8" fill="#8a5a1e"/><circle cx="37" cy="31" r="1.8" fill="#8a5a1e"/><path d="M28 37q4 3 8 0" fill="none" stroke="#8a5a1e" stroke-width="1.6" stroke-linecap="round"/>'],
    ['butterfly', 'Motylek', 'flutter', '<g fill="#b7a0f0" stroke="#8f7fd1" stroke-width="2" stroke-linejoin="round"><path d="M31 30Q14 6 6 18Q4 30 20 34Z"/><path d="M33 30Q50 6 58 18Q60 30 44 34Z"/></g><g fill="#f7a8c9" stroke="#e07fae" stroke-width="2" stroke-linejoin="round"><path d="M31 34Q14 38 14 50Q20 58 31 40Z"/><path d="M33 34Q50 38 50 50Q44 58 33 40Z"/></g><rect x="29.5" y="22" width="5" height="26" rx="2.5" fill="#5b5675"/><path d="M30 22Q26 12 22 10M34 22Q38 12 42 10" fill="none" stroke="#5b5675" stroke-width="2" stroke-linecap="round"/>'],
    ['heart', 'Serce', 'pulse', '<path d="M32 56C10 40 4 28 4 20a14 14 0 0 1 28-4a14 14 0 0 1 28 4C60 28 54 40 32 56Z" fill="#ee6a8a" stroke="#d04870" stroke-width="3" stroke-linejoin="round"/><path d="M14 20q2-6 8-6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>'],
    ['balloon', 'Balon', 'floaty', '<path d="M32 46Q31 54 34 62" fill="none" stroke="#8f7fd1" stroke-width="2" stroke-linecap="round"/><path d="M32 4C16 4 12 18 14 28C16 38 26 44 32 46C38 44 48 38 50 28C52 18 48 4 32 4Z" fill="#ff7f6e" stroke="#e05a48" stroke-width="2.5" stroke-linejoin="round"/><path d="M28 46h8l-2 5h-4z" fill="#e05a48"/><path d="M22 14q3-5 9-5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>']
  ];
  var BY_KIND = {};
  KINDS.forEach(function (k) { BY_KIND[k[0]] = k; });

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }
  function pic(k) {
    return '<svg class="st-svg" viewBox="-4 -4 72 72" aria-hidden="true" focusable="false">' + BY_KIND[k][3] + '</svg>';
  }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'st';
    var tray = '';
    KINDS.forEach(function (k) {
      tray += '<button type="button" class="st-tb" data-k="' + k[0] + '" aria-label="' + k[1] + '"><span class="st-tbi">' + pic(k[0]) + '</span></button>';
    });
    root.innerHTML =
      '<div class="st-scene"><div class="st-bg st-bga"></div><div class="st-bg st-bgb"></div><div class="st-items"></div></div>' +
      '<div class="st-tray" role="group" aria-label="Naklejki">' + tray + '</div>' +
      '<button type="button" class="st-new" aria-label="Nowa scena"><svg class="st-nsvg" viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
      '<path d="M26 16a10 10 0 1 1-3-7.1" fill="none" stroke="#6b5fb5" stroke-width="3.5" stroke-linecap="round"/><path d="M25 3v8h-8z" fill="#6b5fb5" stroke="#6b5fb5" stroke-width="2" stroke-linejoin="round"/></svg></button>';
    container.appendChild(root);
    var scene = root.querySelector('.st-scene'), bgA = root.querySelector('.st-bga'), bgB = root.querySelector('.st-bgb');
    var layer = root.querySelector('.st-items'), trayEl = root.querySelector('.st-tray'), newBtn = root.querySelector('.st-new');

    var items = [];                  // { kind, fx, fy, el }
    var queue = [], current = null;
    var drag = null;                 // active pointer drag: { pid, kind, item, sx, sy, ox, oy, ghost, from }
    var busy = false, timers = [], alive = true;

    function later(fn, ms) {
      var t = setTimeout(function () { timers.splice(timers.indexOf(t), 1); fn(); }, ms);
      timers.push(t);
    }

    // ---- scenes: shuffled order, each background once before any repeats ----
    function nextScene() {
      if (!queue.length) {
        queue = window.Rand.shuffle(SCENES);
        var edge = current || lastScene;
        if (queue[0] === edge) { queue.push(queue.shift()); }
      }
      return queue.shift();
    }
    current = nextScene();
    lastScene = current;
    bgA.className = 'st-bg st-bga st-' + current;
    bgB.className = 'st-bg st-bgb';

    function newScene() {
      if (busy || drag) { return; }
      busy = true;
      var next = nextScene();
      items.forEach(function (it) { it.el.classList.add('st-out'); });
      bgB.className = 'st-bg st-bgb st-' + next;
      void bgB.offsetWidth;
      bgB.classList.add('st-in');
      later(function () {
        items.forEach(function (it) { if (it.el.parentNode) { it.el.parentNode.removeChild(it.el); } });
        items = [];
        current = next;
        lastScene = next;
        bgA.className = 'st-bg st-bga st-' + next;
        bgB.className = 'st-bg st-bgb';
        busy = false;
        refreshFull();
      }, FADE_MS);
    }

    // ---- placed stickers ----
    function place(el, it) {
      el.style.left = 'calc((100% - ' + SIZE + 'px) * ' + it.fx.toFixed(4) + ')';
      el.style.top = 'calc((100% - ' + SIZE + 'px) * ' + it.fy.toFixed(4) + ')';
    }
    function refreshFull() { trayEl.classList.toggle('st-full', items.length >= MAX); }
    function addItem(kind, fx, fy) {
      var k = BY_KIND[kind];
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'st-item';
      el.setAttribute('aria-label', k[1]);
      el.innerHTML = '<span class="st-a"><span class="st-b"><span class="st-c st-m-' + k[2] + '">' + pic(kind) + '</span></span></span>';
      el.querySelector('.st-c').style.animationDelay = '-' + (Math.random() * 3).toFixed(2) + 's';
      var it = { kind: kind, fx: clamp(fx, 0, 1), fy: clamp(fy, 0, 1), el: el };
      place(el, it);
      layer.appendChild(el);
      items.push(it);
      var a = el.querySelector('.st-a');
      a.classList.add('st-pop');
      later(function () { a.classList.remove('st-pop'); }, 400);   // animationend never fires under reduced motion
      refreshFull();
      return it;
    }
    function removeItem(it) {
      var i = items.indexOf(it);
      if (i >= 0) { items.splice(i, 1); }
      if (it.el.parentNode) { it.el.parentNode.removeChild(it.el); }
      refreshFull();
    }
    function wiggle(it) {
      var b = it.el.querySelector('.st-b');
      b.classList.remove('st-wig');
      void b.offsetWidth;
      b.classList.add('st-wig');
      later(function () { b.classList.remove('st-wig'); }, 550);   // animationend never fires under reduced motion
    }
    function itemOf(el) {
      for (var i = 0; i < items.length; i++) { if (items[i].el === el) { return items[i]; } }
      return null;
    }
    function placeFromTray(kind, fx, fy) {
      if (items.length >= MAX || busy) { return null; }
      var it = addItem(kind, fx, fy);
      report(function (A) { A.track('interaction', { variant: kind }); });
      return it;
    }

    // ---- pointer drag (tray sticker or placed sticker) ----
    function inRect(r, x, y) { return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }
    function makeGhost(kind, x, y) {
      var g = document.createElement('div');
      g.className = 'st-ghost';
      g.innerHTML = pic(kind);
      g.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      root.appendChild(g);
      return g;
    }
    function startDrag(ev) {
      if (drag || busy || ev.button > 0) { return; }
      var t = ev.target.closest ? ev.target.closest('.st-tb, .st-item') : null;
      if (!t || !root.contains(t)) { return; }
      var it = t.classList.contains('st-item') ? itemOf(t) : null;
      if (t.classList.contains('st-item') && !it) { return; }
      var kind = it ? it.kind : t.getAttribute('data-k');
      var r = t.getBoundingClientRect();
      drag = { pid: ev.pointerId, kind: kind, item: it, sx: ev.clientX, sy: ev.clientY, ghost: null, from: r,
        ox: it ? ev.clientX - r.left : SIZE / 2, oy: it ? ev.clientY - r.top : SIZE / 2 };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
    }
    function onMove(ev) {
      if (!drag || ev.pointerId !== drag.pid) { return; }
      if (!drag.ghost) {
        if (Math.abs(ev.clientX - drag.sx) + Math.abs(ev.clientY - drag.sy) < TAP_PX) { return; }
        drag.ghost = makeGhost(drag.kind, ev.clientX - drag.ox, ev.clientY - drag.oy);
        if (drag.item) { drag.item.el.style.visibility = 'hidden'; layer.appendChild(drag.item.el); }
      }
      drag.ghost.style.transform = 'translate(' + (ev.clientX - drag.ox) + 'px,' + (ev.clientY - drag.oy) + 'px)';
      ev.preventDefault();
    }
    function endListeners() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    }
    function flyBack(g, rect, done) {
      g.style.transition = 'transform ' + RETURN_MS + 'ms ease-out';
      g.style.transform = 'translate(' + (rect.left + (rect.width - SIZE) / 2) + 'px,' + (rect.top + (rect.height - SIZE) / 2) + 'px)';
      later(function () {
        if (g.parentNode) { g.parentNode.removeChild(g); }
        if (done) { done(); }
      }, RETURN_MS);
    }
    function onCancel(ev) {
      if (!drag || ev.pointerId !== drag.pid) { return; }
      var d = drag;
      drag = null;
      endListeners();
      if (d.ghost) {
        if (d.ghost.parentNode) { d.ghost.parentNode.removeChild(d.ghost); }
        if (d.item) { d.item.el.style.visibility = ''; }
      }
    }
    function onUp(ev) {
      if (!drag || ev.pointerId !== drag.pid) { return; }
      var d = drag;
      drag = null;
      endListeners();
      if (!d.ghost) {            // a tap
        if (d.item) { wiggle(d.item); }
        return;
      }
      var cx = ev.clientX - d.ox + SIZE / 2, cy = ev.clientY - d.oy + SIZE / 2;
      var sr = scene.getBoundingClientRect(), tr = trayEl.getBoundingClientRect();
      var g = d.ghost;
      var onScene = inRect(sr, cx, cy) && !inRect(tr, cx, cy);
      var fx = clamp((cx - sr.left - SIZE / 2) / Math.max(1, sr.width - SIZE), 0, 1);
      var fy = clamp((cy - sr.top - SIZE / 2) / Math.max(1, sr.height - SIZE), 0, 1);
      if (d.item) {
        if (inRect(tr, cx, cy)) {
          g.parentNode.removeChild(g);
          removeItem(d.item);
        } else if (onScene) {
          g.parentNode.removeChild(g);
          d.item.fx = fx; d.item.fy = fy;
          place(d.item.el, d.item);
          d.item.el.style.visibility = '';
        } else {
          var back = d.item.el.getBoundingClientRect(), item = d.item;
          flyBack(g, back, function () { item.el.style.visibility = ''; });
        }
      } else if (onScene && items.length < MAX) {
        g.parentNode.removeChild(g);
        placeFromTray(d.kind, fx, fy);
      } else {
        flyBack(g, d.from, null);
      }
      ev.preventDefault();
    }

    // ---- keyboard ----
    function onKey(ev) {
      var t = ev.target;
      if (!t || !t.classList) { return; }
      var key = ev.key;
      if (t.classList.contains('st-tb')) {
        if (key === 'Enter' || key === ' ') {
          ev.preventDefault();
          var it = placeFromTray(t.getAttribute('data-k'), 0.5, 0.5);
          if (it) { it.el.focus(); }
        }
      } else if (t.classList.contains('st-item')) {
        var p = itemOf(t);
        if (!p) { return; }
        if (key === 'Enter' || key === ' ') { ev.preventDefault(); wiggle(p); }
        else if (key === 'Delete' || key === 'Backspace') {
          ev.preventDefault();
          removeItem(p);
          var first = trayEl.querySelector('[data-k="' + p.kind + '"]');
          if (first) { first.focus(); }
        } else if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
          ev.preventDefault();
          if (key === 'ArrowLeft') { p.fx = clamp(p.fx - STEP, 0, 1); }
          else if (key === 'ArrowRight') { p.fx = clamp(p.fx + STEP, 0, 1); }
          else if (key === 'ArrowUp') { p.fy = clamp(p.fy - STEP, 0, 1); }
          else { p.fy = clamp(p.fy + STEP, 0, 1); }
          place(p.el, p);
        }
      }
    }

    root.addEventListener('pointerdown', startDrag);
    root.addEventListener('keydown', onKey);
    newBtn.addEventListener('click', newScene);

    return function cleanup() {
      alive = false;
      endListeners();
      root.removeEventListener('pointerdown', startDrag);
      root.removeEventListener('keydown', onKey);
      newBtn.removeEventListener('click', newScene);
      timers.forEach(clearTimeout);
      timers = [];
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  var entry = window.ACTIVITIES.filter(function (a) { return a.id === 'naklejki'; })[0];
  if (entry) { entry.mount = mount; }
})();
