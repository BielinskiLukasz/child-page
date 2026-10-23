// Activity "Puzzle": a simple picture is cut into 4 big pieces (2x2) scattered below (or beside) an outline.
// Drag a piece near its place and it glides in. No wrong answers: a piece released elsewhere drifts back to the tray.
// When the picture is complete it glows ~3 s, then after ~4 s more it cross-fades to the next of 3 pictures.
// One capped-dt rAF loop (works under prefers-reduced-motion, pauses when hidden, stops when idle); fixed DOM of
// 4 slots + 4 pieces; nothing is stored.
(function () {
  var GLOW_S = 3000, NEXT_S = 7000, FADE_S = 700;
  var SVGNS = 'focusable="false" aria-hidden="true"';
  // Pictures are drawn on a 200x200 canvas; piece (c, r) shows the quarter starting at (c*100, r*100).
  var PICTURES = [
    '<rect width="200" height="200" fill="#cfeaf7"/><circle cx="160" cy="40" r="22" fill="#ffe08a"/>' +
    '<ellipse cx="100" cy="205" rx="130" ry="50" fill="#b9e0a8"/><rect x="58" y="92" width="84" height="72" rx="6" fill="#f6dcc8"/>' +
    '<path d="M48 98L100 50l52 48z" fill="#c9a0c0" stroke="#c9a0c0" stroke-width="8" stroke-linejoin="round"/>' +
    '<rect x="86" y="120" width="28" height="44" rx="14" fill="#b99a86"/><rect x="66" y="108" width="16" height="16" rx="3" fill="#ffe9a8"/>' +
    '<rect x="118" y="108" width="16" height="16" rx="3" fill="#ffe9a8"/>',
    '<rect width="200" height="200" fill="#bfe3f2"/><ellipse cx="100" cy="215" rx="140" ry="30" fill="#f3e3b8"/>' +
    '<ellipse cx="96" cy="100" rx="52" ry="34" fill="#ffb7a5"/><path d="M142 100l34-26v52z" fill="#ffb7a5"/>' +
    '<circle cx="74" cy="92" r="6" fill="#5b5675"/><path d="M60 110q10 8 20 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="40" cy="50" r="8" fill="#fff" fill-opacity=".7"/><circle cx="58" cy="30" r="5" fill="#fff" fill-opacity=".7"/>' +
    '<path d="M30 200q-10-30 0-50M166 200q10-34 0-56" fill="none" stroke="#7fbf8f" stroke-width="8" stroke-linecap="round"/>',
    '<rect width="200" height="200" fill="#eaf5df"/><ellipse cx="100" cy="212" rx="140" ry="36" fill="#b9e0a8"/>' +
    '<path d="M100 190V104" stroke="#7fbf8f" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M100 160q-34-6-36-34 30 2 36 34zM100 150q34-6 36-34-30 2-36 34z" fill="#9fd4a8"/>' +
    '<g fill="#f7a8c9"><circle cx="100" cy="62" r="22"/><circle cx="76" cy="84" r="22"/>' +
    '<circle cx="124" cy="84" r="22"/><circle cx="82" cy="58" r="22"/><circle cx="118" cy="58" r="22"/></g>' +
    '<circle cx="100" cy="76" r="16" fill="#ffe9a8"/><circle cx="30" cy="34" r="14" fill="#ffe08a"/>'
  ];
  // Piece corner radii: only the outer corner of the whole picture is rounded, so placed pieces look connected.
  var RADII = ['22px 0 0 0', '0 22px 0 0', '0 0 0 22px', '0 0 22px 0'];

  function pieceSvg(pic, i) {
    var c = i % 2, r = Math.floor(i / 2);
    return '<svg viewBox="' + (c * 100) + ' ' + (r * 100) + ' 100 100" preserveAspectRatio="none" ' + SVGNS + '>' + PICTURES[pic] + '</svg>';
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  // Random assignment of tray cells where no piece starts at the cell matching its own index.
  function derange() {
    var a;
    do {
      a = [0, 1, 2, 3];
      for (var j = 3; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var t = a[j]; a[j] = a[k]; a[k] = t; }
    } while (a.some(function (v, i) { return v === i; }));
    return a;
  }

  function mount(container) {
    container.style.display = 'block';
    var board = document.createElement('div');
    board.className = 'pz';
    board.innerHTML = '<div class="pz-field"><div class="pz-frame"></div></div>';
    container.appendChild(board);
    var field = board.querySelector('.pz-field'), frame = board.querySelector('.pz-frame');

    var P = 100, fw = 0, fh = 0, portrait = true, fx = 0, fy = 0, selected = null;
    var pic = 0, raf = 0, last = 0, doneT = -1, doneActive = false, glow = 0;
    var fade = 1, fadeDir = 0; // fadeDir: -1 out, +1 in, 0 steady
    var slots = [], pieces = [];
    var cells = derange();

    for (var i = 0; i < 4; i++) {
      (function (i) {
        var s = document.createElement('button');
        s.type = 'button'; s.className = 'pz-slot';
        s.setAttribute('aria-label', 'Miejsce ' + (i + 1));
        field.appendChild(s);
        s.addEventListener('click', function () { onSlot(i); });
        slots.push(s);
      })(i);
    }
    for (var k = 0; k < 4; k++) {
      (function (k) {
        var el = document.createElement('button');
        el.type = 'button'; el.className = 'pz-piece';
        el.setAttribute('aria-label', 'Kawałek obrazka ' + (k + 1) + ' (Enter lub spacja, potem wybierz miejsce)');
        el.setAttribute('aria-pressed', 'false');
        el.style.borderRadius = RADII[k];
        el.innerHTML = pieceSvg(pic, k);
        field.appendChild(el);
        var it = { i: k, el: el, cell: cells[k], x: 0, y: 0, hx: 0, hy: 0, tx: 0, ty: 0, mode: 'idle', pid: null, dx: 0, dy: 0,
          placed: false, fx: 0, fy: 0, gt: 0, gd: 1, gx: 0, gy: 0 };
        pieces.push(it);
        el.addEventListener('pointerdown', function (e) { down(it, e); });
        el.addEventListener('pointermove', function (e) { move(it, e); });
        el.addEventListener('pointerup', function (e) { up(it, e); });
        el.addEventListener('pointercancel', function (e) { up(it, e); });
        el.addEventListener('lostpointercapture', function (e) { up(it, e); });
        el.addEventListener('click', function (e) { if (e.detail === 0) { select(it); } });
      })(k);
    }

    function layout() {
      var r = field.getBoundingClientRect();
      fw = r.width; fh = r.height;
      portrait = fh >= fw;
      var gap;
      if (portrait) {
        P = Math.max(80, Math.min(170, fw / 2 * 0.94, (fh - 16) / 4));
        gap = Math.min(16, Math.max(6, fh - 4 * P));
        fx = (fw - 2 * P) / 2; fy = Math.max(0, (fh - 4 * P - gap) / 2);
      } else {
        P = Math.max(80, Math.min(170, fh / 2 * 0.94, (fw - 24) / 4));
        gap = Math.min(40, Math.max(12, fw - 4 * P));
        fx = Math.max(0, (fw - 4 * P - gap) / 2); fy = (fh - 2 * P) / 2;
      }
      var tx0 = portrait ? fx : fx + 2 * P + gap, ty0 = portrait ? fy + 2 * P + gap : fy;
      field.style.setProperty('--pz-p', P + 'px');
      frame.style.transform = 'translate(' + fx + 'px,' + fy + 'px)';
      slots.forEach(function (s, i) {
        s.style.transform = 'translate(' + (fx + (i % 2) * P) + 'px,' + (fy + Math.floor(i / 2) * P) + 'px)';
      });
      pieces.forEach(function (it) {
        it.tx = fx + (it.i % 2 + 0.5) * P; it.ty = fy + (Math.floor(it.i / 2) + 0.5) * P;
        it.hx = tx0 + (it.cell % 2 + 0.5) * P; it.hy = ty0 + (Math.floor(it.cell / 2) + 0.5) * P;
        if (it.mode === 'drag') { cancelDrag(it); }
        if (it.mode === 'glide') { glideTo(it, it.placed ? it.tx : it.hx, it.placed ? it.ty : it.hy, true); }
        else if (it.placed) { it.x = it.tx; it.y = it.ty; }
        else { it.x = it.hx; it.y = it.hy; }
        place(it);
      });
    }
    function place(it) { it.el.style.transform = 'translate(' + (it.x - P / 2) + 'px,' + (it.y - P / 2) + 'px)'; }
    function paint() {
      frame.style.opacity = String(fade);
      pieces.forEach(function (it) {
        it.el.style.opacity = String(fade);
        it.el.style.filter = glow > 0.01 && it.placed ? 'drop-shadow(0 0 ' + (6 + 14 * glow) + 'px #ffe08a)' : '';
      });
    }

    function glideTo(it, x, y, quick) {
      var d = Math.hypot(x - it.x, y - it.y);
      it.fx = it.x; it.fy = it.y; it.gx = x; it.gy = y; it.gt = 0;
      it.gd = quick ? 200 : (reduced() ? 300 : Math.min(1500, 700 + d * 0.8));
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
      // Keep the piece centre inside the visible screen so it can never be lost off-screen.
      it.x = Math.max(-r.left + P / 2, Math.min(window.innerWidth - r.left - P / 2, px));
      it.y = Math.max(-r.top + P / 2, Math.min(window.innerHeight - r.top - P / 2, py));
      place(it);
    }
    function up(it, e) {
      if (it.mode !== 'drag' || e.pointerId !== it.pid) { return; }
      try { it.el.releasePointerCapture(it.pid); } catch (err) { /* already released */ }
      it.pid = null; it.mode = 'idle';
      if (Math.hypot(it.x - it.tx, it.y - it.ty) < P * 0.5) { snap(it); } else { sendHome(it); }
    }

    function select(it) {
      selected = selected === it ? null : it;
      if (it && it.placed) { selected = null; }
      pieces.forEach(function (o) {
        var on = o === selected;
        o.el.setAttribute('aria-pressed', on ? 'true' : 'false');
        o.el.classList.toggle('pz-selected', on);
      });
    }
    function onSlot(i) {
      if (!selected || selected.mode === 'drag' || fadeDir !== 0) { return; }
      var it = selected;
      select(null);
      if (it.i === i) { snap(it); } else { sendHome(it); }
    }
    function nextPicture() {
      pic = (pic + 1) % PICTURES.length;
      cells = derange();
      pieces.forEach(function (it) {
        it.cell = cells[it.i]; it.placed = false; it.mode = 'idle'; it.el.style.zIndex = '';
        it.el.innerHTML = pieceSvg(pic, it.i);
      });
      layout();
    }

    function frame_(now) {
      raf = 0;
      var dt = Math.min(now - last, 50); last = now;
      var busy = false;
      pieces.forEach(function (it) {
        if (it.mode === 'glide') {
          it.gt += dt;
          var k = smooth(it.gt / it.gd);
          it.x = it.fx + (it.gx - it.fx) * k; it.y = it.fy + (it.gy - it.fy) * k;
          if (it.gt >= it.gd) { it.mode = 'idle'; it.x = it.gx; it.y = it.gy; it.el.style.zIndex = ''; }
          else { busy = true; }
          place(it);
        }
        it.el.tabIndex = it.placed ? -1 : 0;
        it.el.disabled = it.placed;
      });
      var allIn = pieces.every(function (it) { return it.placed && it.mode === 'idle'; });
      if (allIn && !doneActive && fadeDir === 0) { doneActive = true; doneT = 0; }
      if (doneActive) {
        doneT += dt;
        if (doneT >= NEXT_S) { doneActive = false; doneT = -1; fadeDir = -1; }
        else { busy = true; }
      }
      if (fadeDir !== 0) {
        fade += fadeDir * dt / FADE_S;
        if (fadeDir < 0 && fade <= 0) { fade = 0; nextPicture(); fadeDir = 1; }
        else if (fadeDir > 0 && fade >= 1) { fade = 1; fadeDir = 0; }
        busy = true;
      }
      var tg = doneActive && doneT < GLOW_S ? 1 : 0;
      if (Math.abs(glow - tg) > 0.005) { glow += (tg - glow) * Math.min(1, dt / 400); busy = true; }
      else { glow = tg; }
      paint();
      if (busy) { raf = requestAnimationFrame(frame_); }
    }
    function start() {
      if (raf || document.hidden) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame_);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }
    function onResize() { layout(); start(); }

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    layout();
    paint();

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (board.parentNode) { board.parentNode.removeChild(board); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'puzzle') { a.mount = mount; } });
})();
