// Activity "Wieża z Klocków": six soft blocks wait at the bottom (portrait) or the side (landscape); drag them onto
// the tower base in any order. A block released over the tower column glides down and settles on top; the tower sways
// very slightly for ~1 s. The tower can never fall. A block released elsewhere drifts back and can be picked up again.
// When all six are stacked the top glows ~3 s, then at ~7 s the blocks drift back to their starting places.
// One capped-dt rAF loop (works under prefers-reduced-motion, pauses when hidden, stops when idle); fixed DOM of
// 6 blocks + 1 tower button + base; nothing is stored.
(function () {
  // w/h are in block units; shape: 'rect' or 'roof'. The smallest block is 0.8 units, so U is floored at 70 px to keep every block >= 56 px.
  var BLOCKS = [
    { label: 'różowy kwadrat', color: '#f7a8c9', w: 1, h: 1, shape: 'rect' },
    { label: 'niebieski prostokąt', color: '#a8d8f0', w: 1.6, h: 0.8, shape: 'rect' },
    { label: 'żółty kwadrat', color: '#ffd98a', w: 0.9, h: 0.9, shape: 'rect' },
    { label: 'zielony prostokąt', color: '#bfe6b4', w: 1.3, h: 0.8, shape: 'rect' },
    { label: 'fioletowy kwadrat', color: '#c9b8f2', w: 0.8, h: 0.8, shape: 'rect' },
    { label: 'pomarańczowy daszek', color: '#ffc9a0', w: 1.1, h: 0.8, shape: 'roof' }
  ];
  var GLOW_S = 3000, RESET_S = 7000, SWAY_S = 1.2, SWAY_DEG = 2;

  function blockSvg(b) {
    var shape = b.shape === 'roof'
      ? '<path d="M6 94L50 8l44 86z" fill="' + b.color + '" stroke="' + b.color + '" stroke-width="8" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>'
      : '<rect x="3" y="3" width="94" height="94" rx="14" fill="' + b.color + '"/>';
    var shine = b.shape === 'roof' ? '' : '<path d="M14 30a22 22 0 0 1 14-14" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + shape + shine + '</svg>';
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  function mount(container) {
    container.style.display = 'block';
    var board = document.createElement('div');
    board.className = 'wk';
    board.innerHTML = '<div class="wk-field"><div class="wk-base"></div></div>';
    container.appendChild(board);
    var field = board.querySelector('.wk-field'), baseEl = board.querySelector('.wk-base');

    var fw = 0, fh = 0, U = 60, Ut = 50, sc = 1, bx = 0, by = 0, tw = 100, selected = null;
    var raf = 0, last = 0, doneT = -1, doneActive = false, glow = 0, swayT = 99;
    var stack = [], items = [];

    var tower = document.createElement('button');
    tower.type = 'button'; tower.className = 'wk-tower';
    tower.setAttribute('aria-label', 'Wieża');
    field.appendChild(tower);
    tower.addEventListener('click', function () { onTower(); });

    BLOCKS.forEach(function (b, i) {
      var el = document.createElement('button');
      el.type = 'button'; el.className = 'wk-block';
      el.setAttribute('aria-label', 'Klocek: ' + b.label + ' (Enter lub spacja, potem wybierz wieżę)');
      el.setAttribute('aria-pressed', 'false');
      el.innerHTML = blockSvg(b);
      field.appendChild(el);
      var it = { b: b, i: i, el: el, W: 0, H: 0, x: 0, y: 0, hx: 0, hy: 0, tx: 0, ty: 0, mode: 'idle', pid: null, dx: 0, dy: 0,
        placed: false, s: 1, fs: 1, gs: 1, fx: 0, fy: 0, gt: 0, gd: 1, gx: 0, gy: 0 };
      items.push(it);
      el.addEventListener('pointerdown', function (e) { down(it, e); });
      el.addEventListener('pointermove', function (e) { move(it, e); });
      el.addEventListener('pointerup', function (e) { up(it, e); });
      el.addEventListener('pointercancel', function (e) { up(it, e); });
      el.addEventListener('lostpointercapture', function (e) { up(it, e); });
      el.addEventListener('click', function (e) { if (e.detail === 0) { select(it); } });
    });

    function stackTargets() {
      var top = by;
      stack.forEach(function (it) {
        var h = it.b.h * Ut;
        it.tx = bx; it.ty = top - h / 2;
        top -= h;
      });
      return top;
    }
    function layout() {
      var r = field.getBoundingClientRect();
      fw = r.width; fh = r.height;
      var portrait = fh >= fw, rows = 2, cols = 3;
      var wx0, wy0, ww, wh, tx0, tw0, th0;
      if (portrait) {
        ww = fw; wx0 = 0;
        U = Math.max(70, Math.min(84, ww / cols / 1.7, fh * 0.13));
        wh = rows * U * 1.2; wy0 = fh - wh;
        tx0 = 0; tw0 = fw; th0 = Math.max(0, wy0 - 8);
      } else {
        ww = fw / 2; wx0 = fw / 2;
        U = Math.max(70, Math.min(84, ww / cols / 1.7, fh / rows / 1.2));
        wh = rows * U * 1.2; wy0 = (fh - wh) / 2;
        tx0 = 0; tw0 = fw / 2; th0 = fh;
      }
      var baseH = 12;
      var totalU = BLOCKS.reduce(function (s, b) { return s + b.h; }, 0);
      Ut = Math.min(U * 1.25, (th0 - baseH - 4) / totalU);
      sc = Ut / U;
      bx = tx0 + tw0 / 2; by = th0 - baseH - 2;
      tw = Math.max(2.2 * Ut, 80);
      baseEl.style.width = tw + 'px'; baseEl.style.height = baseH + 'px';
      baseEl.style.transform = 'translate(' + (bx - tw / 2) + 'px,' + (by + 2) + 'px)';
      tower.style.width = (tw * 1.2) + 'px'; tower.style.height = th0 + 'px';
      tower.style.transform = 'translate(' + (bx - tw * 0.6) + 'px,0)';
      stackTargets();
      items.forEach(function (it, i) {
        it.W = it.b.w * U; it.H = it.b.h * U;
        it.el.style.width = it.W + 'px'; it.el.style.height = it.H + 'px';
        var col = i % cols, row = Math.floor(i / cols);
        it.hx = wx0 + ww * (col + 0.5) / cols; it.hy = wy0 + wh * (row + 0.5) / rows;
        if (it.mode === 'drag') { cancelDrag(it); }
        if (it.mode === 'glide') { glideTo(it, it.placed ? it.tx : it.hx, it.placed ? it.ty : it.hy, true); }
        else if (it.placed) { it.x = it.tx; it.y = it.ty; it.s = sc; }
        else { it.x = it.hx; it.y = it.hy; it.s = 1; }
        place(it);
      });
    }
    function place(it) {
      var s = it.s, x = it.x, y = it.y, ang = 0;
      // the tower sways rigidly about its base for a moment after a block settles
      if (it.placed && it.mode === 'idle' && swayT < SWAY_S && !reduced()) {
        ang = SWAY_DEG * Math.exp(-swayT / 0.45) * Math.sin(swayT * 2 * Math.PI / 0.8);
        var rad = ang * Math.PI / 180, dx = x - bx, dy = y - by;
        x = bx + dx * Math.cos(rad) - dy * Math.sin(rad);
        y = by + dx * Math.sin(rad) + dy * Math.cos(rad);
      }
      it.el.style.transform = 'translate(' + (x - it.W / 2) + 'px,' + (y - it.H / 2) + 'px) rotate(' + ang.toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
    }
    function paintGlow() {
      var topIt = stack.length === BLOCKS.length ? stack[stack.length - 1] : null;
      items.forEach(function (it) {
        it.el.style.filter = it === topIt && glow > 0.01 ? 'drop-shadow(0 0 ' + (6 + 16 * glow) + 'px #ffe08a)' : '';
      });
    }

    function glideTo(it, x, y, quick) {
      var d = Math.hypot(x - it.x, y - it.y);
      it.fx = it.x; it.fy = it.y; it.fs = it.s; it.gs = it.placed ? sc : 1; it.gx = x; it.gy = y; it.gt = 0;
      it.gd = quick ? 200 : (reduced() ? 300 : Math.min(1500, 700 + d * 0.8));
      it.mode = 'glide';
      it.el.style.zIndex = '3';
      start();
    }
    function sendHome(it) {
      it.placed = false;
      glideTo(it, it.hx, it.hy);
    }
    function snap(it) {
      select(null);
      if (it.placed || stack.indexOf(it) >= 0) { return; }
      stack.push(it);
      it.placed = true;
      stackTargets();
      glideTo(it, it.tx, it.ty);
    }
    function cancelDrag(it) {
      if (it.pid !== null) { try { it.el.releasePointerCapture(it.pid); } catch (e) { /* already released */ } }
      it.pid = null; it.mode = 'idle'; sendHome(it);
    }
    function down(it, e) {
      if (it.placed || it.pid !== null || (e.button !== undefined && e.button > 0)) { return; }
      var r = field.getBoundingClientRect();
      it.pid = e.pointerId; it.mode = 'drag'; it.s = 1;
      it.dx = it.x - (e.clientX - r.left); it.dy = it.y - (e.clientY - r.top);
      it.el.style.zIndex = '6';
      try { it.el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      place(it);
      e.preventDefault();
    }
    function move(it, e) {
      if (it.mode !== 'drag' || e.pointerId !== it.pid) { return; }
      var r = field.getBoundingClientRect();
      var px = e.clientX - r.left + it.dx, py = e.clientY - r.top + it.dy;
      // Keep the block centre inside the visible screen so it can never be lost off-screen.
      it.x = Math.max(-r.left + it.W / 2, Math.min(window.innerWidth - r.left - it.W / 2, px));
      it.y = Math.max(-r.top + it.H / 2, Math.min(window.innerHeight - r.top - it.H / 2, py));
      place(it);
    }
    function up(it, e) {
      if (it.mode !== 'drag' || e.pointerId !== it.pid) { return; }
      try { it.el.releasePointerCapture(it.pid); } catch (err) { /* already released */ }
      it.pid = null; it.mode = 'idle';
      // Over or near the tower column (and above its base) -> settle on top; otherwise drift back.
      if (Math.abs(it.x - bx) < Math.max(1.8 * Ut, tw * 0.7) && it.y < by + 2) { snap(it); } else { sendHome(it); }
    }

    function select(it) {
      selected = selected === it ? null : it;
      if (it && it.placed) { selected = null; }
      items.forEach(function (o) {
        var on = o === selected;
        o.el.setAttribute('aria-pressed', on ? 'true' : 'false');
        o.el.classList.toggle('wk-selected', on);
      });
    }
    function onTower() {
      if (!selected || selected.mode === 'drag') { return; }
      var it = selected;
      select(null);
      snap(it);
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(now - last, 50); last = now;
      var busy = false;
      if (swayT < SWAY_S) { swayT += dt / 1000; busy = true; }
      items.forEach(function (it) {
        if (it.mode === 'glide') {
          it.gt += dt;
          var k = smooth(it.gt / it.gd);
          it.x = it.fx + (it.gx - it.fx) * k; it.y = it.fy + (it.gy - it.fy) * k; it.s = it.fs + (it.gs - it.fs) * k;
          if (it.gt >= it.gd) {
            it.mode = 'idle'; it.x = it.gx; it.y = it.gy; it.s = it.gs; it.el.style.zIndex = '';
            if (it.placed) { swayT = 0; busy = true; }
          } else { busy = true; }
        }
        place(it);
        it.el.tabIndex = it.placed ? -1 : 0;
        it.el.disabled = it.placed;
      });
      var allIn = stack.length === BLOCKS.length && items.every(function (it) { return it.mode === 'idle'; });
      if (allIn && !doneActive) { doneActive = true; doneT = 0; }
      if (doneActive) {
        doneT += dt;
        if (doneT >= RESET_S) {
          doneActive = false; doneT = -1;
          stack = [];
          items.forEach(sendHome);
        } else { busy = true; }
      }
      var tg = doneActive && doneT < GLOW_S ? 1 : 0;
      if (Math.abs(glow - tg) > 0.005) { glow += (tg - glow) * Math.min(1, dt / 400); busy = true; }
      else { glow = tg; }
      paintGlow();
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
    layout();

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (board.parentNode) { board.parentNode.removeChild(board); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'wieza') { a.mount = mount; } });
})();
