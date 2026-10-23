// Activity "Cienie": three grey animal shadows (clearly different silhouettes) on top and the three matching coloured
// animals below in a mixed order. Drag an animal onto its own shadow and it glides in and fills the shadow with its
// colour; anywhere else it floats slowly back. When all three are in, the picture glows ~3 s and ~4 s later a new
// round with a different set of animals fades in (4 sets cycle). Keyboard: select an animal, then a shadow.
// One capped-dt rAF loop (works under prefers-reduced-motion, pauses when hidden, stops when idle); fixed DOM of
// 3 shadows + 3 animals; nothing is stored.
(function () {
  var SHADOW = '#c4c0d4';
  // Shapes use the placeholder @@ for the fill; `eye` is detail drawn only on the coloured animal.
  var ANIMALS = [
    { label: 'królik', color: '#fbd5e3',
      body: '<g fill="@@"><ellipse cx="50" cy="70" rx="24" ry="22"/><circle cx="50" cy="42" r="16"/><ellipse cx="42" cy="16" rx="5" ry="15"/><ellipse cx="58" cy="16" rx="5" ry="15"/><circle cx="76" cy="78" r="6"/></g>',
      eye: '<circle cx="45" cy="40" r="2.6" fill="#5b5675"/><circle cx="55" cy="40" r="2.6" fill="#5b5675"/>' },
    { label: 'słoń', color: '#b9d3ee',
      body: '<g fill="@@"><ellipse cx="46" cy="60" rx="30" ry="22"/><circle cx="76" cy="46" r="16"/><path d="M84 56Q97 62 93 84Q91 89 86 86Q88 70 80 62Z"/><circle cx="64" cy="46" r="10"/><rect x="26" y="74" width="12" height="18" rx="5"/><rect x="52" y="74" width="12" height="18" rx="5"/></g>',
      eye: '<circle cx="80" cy="42" r="2.6" fill="#5b5675"/>' },
    { label: 'ptak', color: '#ffe08a',
      body: '<g fill="@@"><ellipse cx="46" cy="56" rx="24" ry="20"/><circle cx="68" cy="34" r="12"/><path d="M78 31L94 36L78 41Z"/><path d="M24 52L6 42L10 64Z"/><rect x="40" y="72" width="4" height="14"/><rect x="52" y="72" width="4" height="14"/></g>',
      eye: '<circle cx="71" cy="31" r="2.4" fill="#5b5675"/><path d="M36 54q10 12 22 0" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>' },
    { label: 'kotek', color: '#f7c9a0',
      body: '<g fill="@@"><ellipse cx="50" cy="72" rx="22" ry="20"/><circle cx="50" cy="42" r="17"/><path d="M35 32L38 10L51 26ZM65 32L62 10L49 26Z"/><path d="M68 80Q92 78 88 54Q86 49 82 53Q84 68 66 70Z"/></g>',
      eye: '<circle cx="44" cy="42" r="2.6" fill="#5b5675"/><circle cx="56" cy="42" r="2.6" fill="#5b5675"/>' },
    { label: 'rybka', color: '#a8dcd0',
      body: '<g fill="@@"><ellipse cx="46" cy="52" rx="32" ry="21"/><path d="M72 52L95 32V72Z"/><path d="M34 34Q46 14 60 34Z"/></g>',
      eye: '<circle cx="28" cy="48" r="3" fill="#5b5675"/><path d="M48 40q6 12 0 24" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' },
    { label: 'żółw', color: '#bfe6b4',
      body: '<g fill="@@"><path d="M16 68Q16 30 50 30Q84 30 84 68Z"/><circle cx="88" cy="56" r="10"/><rect x="26" y="66" width="14" height="16" rx="6"/><rect x="60" y="66" width="14" height="16" rx="6"/><path d="M16 62L4 69L16 71Z"/></g>',
      eye: '<circle cx="91" cy="53" r="2.4" fill="#5b5675"/><g fill="#fff" fill-opacity=".5"><circle cx="40" cy="52" r="6"/><circle cx="60" cy="48" r="6"/><circle cx="50" cy="64" r="5"/></g>' }
  ];
  // Four different triples (each has three clearly different shapes).
  var SETS = [[0, 1, 2], [3, 4, 5], [1, 3, 4], [2, 5, 0]];
  var GLOW_S = 3000, NEXT_S = 7000, FADE_S = 600;
  var SVGNS = 'viewBox="0 0 100 100" aria-hidden="true" focusable="false"';

  function svgOf(a, shadow) {
    return '<svg ' + SVGNS + '>' + a.body.replace(/@@/g, shadow ? SHADOW : a.color) + (shadow ? '' : a.eye) + '</svg>';
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function rotation() { return Math.random() < 0.5 ? [1, 2, 0] : [2, 0, 1]; } // no animal starts under its own shadow

  function mount(container) {
    container.style.display = 'block';
    var board = document.createElement('div');
    board.className = 'ci';
    board.innerHTML = '<div class="ci-glow"></div><div class="ci-field"></div>';
    container.appendChild(board);
    var field = board.querySelector('.ci-field'), glowEl = board.querySelector('.ci-glow');

    var S = 96, fw = 0, fh = 0, selected = null, setIdx = 0, slots = rotation();
    var raf = 0, last = 0, doneT = -1, doneActive = false, doneGlow = 0, fade = 1, fadeDir = 0;
    var shadows = [], items = [];

    for (var i = 0; i < 3; i++) {
      (function (i) {
        var o = document.createElement('button');
        o.type = 'button'; o.className = 'ci-item ci-shadow';
        field.appendChild(o);
        o.addEventListener('click', function () { onShadow(i); });
        shadows.push({ el: o, x: 0, y: 0 });
      })(i);
    }
    for (var k = 0; k < 3; k++) {
      (function (k) {
        var el = document.createElement('button');
        el.type = 'button'; el.className = 'ci-item ci-animal';
        el.setAttribute('aria-pressed', 'false');
        field.appendChild(el);
        var it = { k: k, el: el, slot: slots[k], x: 0, y: 0, hx: 0, hy: 0, tx: 0, ty: 0, mode: 'idle', pid: null, dx: 0, dy: 0,
          placed: false, glow: 0, fx: 0, fy: 0, gt: 0, gd: 1, gx: 0, gy: 0, a: null };
        items.push(it);
        el.addEventListener('pointerdown', function (e) { down(it, e); });
        el.addEventListener('pointermove', function (e) { move(it, e); });
        el.addEventListener('pointerup', function (e) { up(it, e); });
        el.addEventListener('pointercancel', function (e) { up(it, e); });
        el.addEventListener('lostpointercapture', function (e) { up(it, e); });
        el.addEventListener('click', function (e) { if (e.detail === 0) { select(it); } });
      })(k);
    }
    function loadSet() {
      var set = SETS[setIdx];
      items.forEach(function (it, k) {
        it.a = ANIMALS[set[k]];
        it.el.innerHTML = svgOf(it.a, false);
        it.el.setAttribute('aria-label', it.a.label + ' (Enter lub spacja, potem wybierz cień)');
        shadows[k].el.innerHTML = svgOf(it.a, true);
        shadows[k].el.setAttribute('aria-label', 'Cień: ' + it.a.label);
      });
    }

    function layout() {
      var r = field.getBoundingClientRect();
      fw = r.width; fh = r.height;
      S = Math.max(64, Math.min(140, fw / 3.6, fh * 0.3));
      field.style.setProperty('--ci-s', S + 'px');
      shadows.forEach(function (sh, i) {
        sh.x = fw * (i + 0.5) / 3; sh.y = S / 2 + 4;
        sh.el.style.transform = 'translate(' + (sh.x - S / 2) + 'px,' + (sh.y - S / 2) + 'px)';
      });
      items.forEach(function (it) {
        it.hx = fw * (it.slot + 0.5) / 3; it.hy = Math.max(fh - S / 2 - 4, S * 1.6);
        it.tx = shadows[it.k].x; it.ty = shadows[it.k].y;
        if (it.mode === 'drag') { cancelDrag(it); }
        if (it.mode === 'glide') { glideTo(it, it.placed ? it.tx : it.hx, it.placed ? it.ty : it.hy, true); }
        else if (it.placed) { it.x = it.tx; it.y = it.ty; }
        else { it.x = it.hx; it.y = it.hy; }
        place(it);
      });
    }
    function place(it) { it.el.style.transform = 'translate(' + (it.x - S / 2) + 'px,' + (it.y - S / 2) + 'px)'; }
    function paint(it) {
      var g = it.glow + doneGlow * 0.6;
      it.el.style.filter = g > 0.01 ? 'drop-shadow(0 0 ' + (6 + 14 * g) + 'px ' + it.a.color + ')' : '';
      it.el.style.opacity = String(fade);
      shadows[it.k].el.style.opacity = String(it.placed ? 0.3 * fade : fade);
    }

    function glideTo(it, x, y, quick) {
      var d = Math.hypot(x - it.x, y - it.y);
      it.fx = it.x; it.fy = it.y; it.gx = x; it.gy = y; it.gt = 0;
      it.gd = quick ? 200 : (reduced() ? 300 : Math.min(1400, 700 + d * 0.8));
      it.mode = 'glide';
      it.el.style.zIndex = '2';
      start();
    }
    function sendHome(it) { it.placed = false; glideTo(it, it.hx, it.hy); }
    function snap(it) { it.placed = true; select(null); glideTo(it, it.tx, it.ty); }
    function cancelDrag(it) {
      if (it.pid !== null) { try { it.el.releasePointerCapture(it.pid); } catch (e) { /* already released */ } }
      it.pid = null; it.mode = 'idle'; sendHome(it);
    }
    function down(it, e) {
      if (it.placed || it.pid !== null || fadeDir !== 0 || (e.button !== undefined && e.button > 0)) { return; }
      var r = field.getBoundingClientRect();
      it.pid = e.pointerId; it.mode = 'drag';
      it.dx = it.x - (e.clientX - r.left); it.dy = it.y - (e.clientY - r.top);
      it.el.style.zIndex = '5';
      try { it.el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      e.preventDefault();
    }
    function move(it, e) {
      if (it.mode !== 'drag' || e.pointerId !== it.pid) { return; }
      var r = field.getBoundingClientRect();
      var px = e.clientX - r.left + it.dx, py = e.clientY - r.top + it.dy;
      // Keep the animal centre inside the visible screen so it can never be lost off-screen.
      it.x = Math.max(-r.left + S / 2, Math.min(window.innerWidth - r.left - S / 2, px));
      it.y = Math.max(-r.top + S / 2, Math.min(window.innerHeight - r.top - S / 2, py));
      place(it);
    }
    function up(it, e) {
      if (it.mode !== 'drag' || e.pointerId !== it.pid) { return; }
      try { it.el.releasePointerCapture(it.pid); } catch (err) { /* already released */ }
      it.pid = null; it.mode = 'idle';
      if (Math.hypot(it.x - it.tx, it.y - it.ty) < S * 0.75) { snap(it); } else { sendHome(it); }
    }

    function select(it) {
      selected = selected === it ? null : it;
      if (it && it.placed) { selected = null; }
      items.forEach(function (o) {
        var on = o === selected;
        o.el.setAttribute('aria-pressed', on ? 'true' : 'false');
        o.el.classList.toggle('ci-selected', on);
      });
    }
    function onShadow(i) {
      if (!selected || selected.mode === 'drag' || fadeDir !== 0) { return; }
      var it = selected;
      select(null);
      if (it.k === i) { snap(it); } else { sendHome(it); }
    }
    function nextRound() {
      setIdx = (setIdx + 1) % SETS.length;
      slots = rotation();
      items.forEach(function (it) { it.slot = slots[it.k]; it.placed = false; it.mode = 'idle'; it.glow = 0; it.el.style.zIndex = ''; });
      loadSet();
      layout();
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(now - last, 50); last = now;
      var busy = false;
      items.forEach(function (it) {
        if (it.mode === 'glide') {
          it.gt += dt;
          var k = smooth(it.gt / it.gd);
          it.x = it.fx + (it.gx - it.fx) * k; it.y = it.fy + (it.gy - it.fy) * k;
          place(it);
          if (it.gt >= it.gd) { it.mode = 'idle'; it.x = it.gx; it.y = it.gy; place(it); it.el.style.zIndex = ''; }
          else { busy = true; }
        }
        var tg = it.placed && it.mode === 'idle' ? 1 : 0;
        if (Math.abs(it.glow - tg) > 0.005) { it.glow += (tg - it.glow) * Math.min(1, dt / 250); busy = true; }
        else { it.glow = tg; }
        it.el.tabIndex = it.placed ? -1 : 0;
        it.el.disabled = it.placed;
      });
      var allIn = items.every(function (it) { return it.placed && it.mode === 'idle'; });
      if (allIn && !doneActive && fadeDir === 0) { doneActive = true; doneT = 0; }
      if (doneActive) {
        doneT += dt;
        if (doneT >= NEXT_S) { doneActive = false; doneT = -1; fadeDir = -1; }
        else { busy = true; }
      }
      if (fadeDir !== 0) {
        fade += fadeDir * dt / FADE_S;
        if (fadeDir < 0 && fade <= 0) { fade = 0; nextRound(); fadeDir = 1; }
        else if (fadeDir > 0 && fade >= 1) { fade = 1; fadeDir = 0; }
        busy = true;
      }
      var tgG = doneActive && doneT < GLOW_S ? 1 : 0;
      if (Math.abs(doneGlow - tgG) > 0.005) { doneGlow += (tgG - doneGlow) * Math.min(1, dt / 500); busy = true; }
      else { doneGlow = tgG; }
      glowEl.style.opacity = String(doneGlow);
      items.forEach(paint);
      if (busy) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }
    function onResize() { layout(); start(); }

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    loadSet();
    layout();
    items.forEach(paint);

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (board.parentNode) { board.parentNode.removeChild(board); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'cienie') { a.mount = mount; } });
})();
