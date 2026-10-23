// Activity "Kolorowe Kubeczki": drag six soft balls (2 per colour) into the cup of the same colour. No wrong answers:
// a ball released anywhere else floats slowly back. Colours also differ by pattern (plain / dots / stripes).
// One capped-dt rAF loop (works under prefers-reduced-motion, pauses when the tab is hidden, stops when idle);
// fixed DOM of 3 cups + 6 balls. All state is in memory only.
(function () {
  var COLORS = [
    { id: 'pink', label: 'różowy', color: '#f7a8c9', glow: '#f58fbb', pat: 'plain' },
    { id: 'yellow', label: 'żółty', color: '#ffd98a', glow: '#ffcf66', pat: 'dots' },
    { id: 'blue', label: 'niebieski', color: '#a8d8f0', glow: '#8cc8ea', pat: 'stripes' }
  ];
  var GLOW_S = 2000, RESET_S = 4000;
  var SVGNS = 'viewBox="0 0 100 100" aria-hidden="true" focusable="false"';

  function ballSvg(c) {
    var pat = c.pat === 'dots'
      ? '<g fill="#fff" fill-opacity=".75"><circle cx="38" cy="42" r="5"/><circle cx="62" cy="40" r="5"/><circle cx="50" cy="62" r="5"/></g>'
      : c.pat === 'stripes'
        ? '<g stroke="#fff" stroke-opacity=".75" stroke-width="6" stroke-linecap="round"><path d="M26 40H74M22 58H78"/></g>' : '';
    return '<svg ' + SVGNS + '><circle cx="50" cy="50" r="42" fill="' + c.color + '"/>' + pat +
      '<path d="M26 34a28 28 0 0 1 18-14" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/></svg>';
  }
  function cupSvg(c) {
    var pat = c.pat === 'dots'
      ? '<g fill="#fff" fill-opacity=".75"><circle cx="38" cy="46" r="5"/><circle cx="62" cy="46" r="5"/><circle cx="50" cy="64" r="5"/><circle cx="38" cy="78" r="4"/><circle cx="62" cy="78" r="4"/></g>'
      : c.pat === 'stripes'
        ? '<g stroke="#fff" stroke-opacity=".75" stroke-width="5" stroke-linecap="round"><path d="M38 38V80M50 38V84M62 38V80"/></g>' : '';
    return '<svg ' + SVGNS + '><path d="M14 22H86L76 88Q75 94 69 94H31Q25 94 24 88Z" fill="' + c.color + '" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linejoin="round"/>' +
      '<rect x="10" y="14" width="80" height="12" rx="6" fill="' + c.color + '" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>' + pat + '</svg>';
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function shuffled(n, avoid) {
    var a, same;
    do {
      a = []; for (var i = 0; i < n; i++) { a.push(i); }
      for (var j = n - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var t = a[j]; a[j] = a[k]; a[k] = t; }
      same = avoid && a.every(function (v, idx) { return v === avoid[idx]; });
      // keep neighbours of one colour from always sitting together: ball i has colour i % 3
    } while (same);
    return a;
  }

  function mount(container) {
    container.style.display = 'block';
    var board = document.createElement('div');
    board.className = 'kc';
    board.innerHTML = '<div class="kc-field"></div>';
    container.appendChild(board);
    var field = board.querySelector('.kc-field');

    var B = 80, C = 110, fw = 0, fh = 0, rows = 1, selected = null;
    var raf = 0, last = 0, doneT = -1, doneActive = false, doneGlow = 0;
    var cups = [], items = [];
    var order = shuffled(6);   // order[k] = home slot of ball k

    COLORS.forEach(function (c, i) {
      var el = document.createElement('button');
      el.type = 'button'; el.className = 'kc-cup';
      el.setAttribute('aria-label', 'Kubeczek ' + c.label);
      el.innerHTML = cupSvg(c);
      field.appendChild(el);
      el.addEventListener('click', function () { onCup(cups[i]); });
      cups.push({ c: c, el: el, x: 0, y: 0, count: 0, glow: 0 });
    });
    for (var k = 0; k < 6; k++) {
      (function (k) {
        var cup = cups[k % 3];
        var el = document.createElement('button');
        el.type = 'button'; el.className = 'kc-ball';
        el.setAttribute('aria-label', 'Piłeczka ' + cup.c.label + ' (Enter lub spacja, potem wybierz kubeczek)');
        el.setAttribute('aria-pressed', 'false');
        el.innerHTML = ballSvg(cup.c);
        field.appendChild(el);
        var it = { cup: cup, el: el, slot: order[k], x: 0, y: 0, s: 1, hx: 0, hy: 0, tx: 0, ty: 0, ts: 1, nest: 0,
          mode: 'idle', pid: null, dx: 0, dy: 0, placed: false, fx: 0, fy: 0, fs: 1, gt: 0, gd: 1, gx: 0, gy: 0, gs: 1 };
        items.push(it);
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
      rows = fw / 6 >= 84 ? 1 : 2;
      var per = rows === 1 ? 6 : 3;
      B = Math.max(64, Math.min(120, (fw / per) * 0.86, fh * (rows === 1 ? 0.3 : 0.2)));
      C = Math.max(72, Math.min(fw / 3 * 0.86, fh - rows * (B + 10) - 24, 190));
      field.style.setProperty('--kc-b', B + 'px');
      field.style.setProperty('--kc-c', C + 'px');
      cups.forEach(function (cp, i) {
        cp.x = fw * (i + 0.5) / 3; cp.y = C / 2 + 6;
        cp.el.style.transform = 'translate(' + (cp.x - C / 2) + 'px,' + (cp.y - C / 2) + 'px)';
      });
      var ns = Math.min(1, C * 0.42 / B);
      items.forEach(function (it) {
        var col = it.slot % per, row = Math.floor(it.slot / per);
        it.hx = fw * (col + 0.5) / per;
        it.hy = fh - B / 2 - 6 - (rows - 1 - row) * (B + 8);
        var cp = it.cup;
        it.ts = ns;
        it.tx = cp.x + (it.nest ? 1 : -1) * C * 0.18;
        it.ty = cp.y + C * 0.12;
        if (it.mode === 'drag') { cancelDrag(it); }
        if (it.mode === 'glide') { glideTo(it, it.placed ? it.tx : it.hx, it.placed ? it.ty : it.hy, it.placed ? it.ts : 1, true); }
        else if (it.placed) { it.x = it.tx; it.y = it.ty; it.s = it.ts; }
        else { it.x = it.hx; it.y = it.hy; it.s = 1; }
        place(it);
      });
    }
    function place(it) {
      it.el.style.transform = 'translate(' + (it.x - B / 2) + 'px,' + (it.y - B / 2) + 'px) scale(' + it.s.toFixed(3) + ')';
    }
    function paint() {
      cups.forEach(function (cp) {
        var g = cp.glow;
        cp.el.style.filter = g > 0.01 ? 'drop-shadow(0 0 ' + (6 + 16 * g) + 'px ' + cp.c.glow + ')' : '';
      });
    }

    // Glide: smoothstep from wherever the ball is now; always re-startable.
    function glideTo(it, x, y, s, quick) {
      var d = Math.hypot(x - it.x, y - it.y);
      it.fx = it.x; it.fy = it.y; it.fs = it.s; it.gx = x; it.gy = y; it.gs = s; it.gt = 0;
      it.gd = quick ? 200 : (reduced() ? 300 : Math.min(1600, 800 + d * 0.9));
      it.mode = 'glide';
      it.el.style.zIndex = '2';
      start();
    }
    function sendHome(it) {
      if (it.placed) { it.placed = false; it.cup.count--; }
      glideTo(it, it.hx, it.hy, 1);
    }
    function snap(it) {
      if (!it.placed) {
        var taken = items.some(function (o) { return o !== it && o.placed && o.cup === it.cup && o.nest === 1; });
        it.nest = taken ? 0 : 1; it.cup.count++;
      }
      it.placed = true; select(null);
      it.tx = it.cup.x + (it.nest ? 1 : -1) * C * 0.18;
      glideTo(it, it.tx, it.ty, it.ts);
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
      it.el.style.zIndex = '5';
      try { it.el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      e.preventDefault();
    }
    function move(it, e) {
      if (it.mode !== 'drag' || e.pointerId !== it.pid) { return; }
      var r = field.getBoundingClientRect();
      var px = e.clientX - r.left + it.dx, py = e.clientY - r.top + it.dy;
      // Keep the ball centre inside the visible screen so it can never be lost off-screen.
      it.x = Math.max(-r.left + B / 2, Math.min(window.innerWidth - r.left - B / 2, px));
      it.y = Math.max(-r.top + B / 2, Math.min(window.innerHeight - r.top - B / 2, py));
      place(it);
    }
    function up(it, e) {
      if (it.mode !== 'drag' || e.pointerId !== it.pid) { return; }
      try { it.el.releasePointerCapture(it.pid); } catch (err) { /* already released */ }
      it.pid = null; it.mode = 'idle';
      var cp = it.cup;
      if (Math.abs(it.x - cp.x) < C * 0.5 && Math.abs(it.y - cp.y) < C * 0.5) { snap(it); } else { sendHome(it); }
    }

    function select(it) {
      selected = selected === it ? null : it;
      if (it && it.placed) { selected = null; }
      items.forEach(function (o) {
        var on = o === selected;
        o.el.setAttribute('aria-pressed', on ? 'true' : 'false');
        o.el.classList.toggle('kc-selected', on);
      });
    }
    function onCup(cp) {
      if (!selected || selected.mode === 'drag') { return; }
      var it = selected;
      select(null);
      if (it.cup === cp) { snap(it); } else { sendHome(it); }
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(now - last, 50); last = now;
      var busy = false;
      items.forEach(function (it) {
        if (it.mode === 'glide') {
          it.gt += dt;
          var k = smooth(it.gt / it.gd);
          it.x = it.fx + (it.gx - it.fx) * k; it.y = it.fy + (it.gy - it.fy) * k; it.s = it.fs + (it.gs - it.fs) * k;
          if (it.gt >= it.gd) { it.mode = 'idle'; it.x = it.gx; it.y = it.gy; it.s = it.gs; it.el.style.zIndex = ''; }
          else { busy = true; }
          place(it);
        }
        it.el.tabIndex = it.placed ? -1 : 0;
        it.el.disabled = it.placed;
      });
      // All balls in: cups glow ~2 s, then after ~4 s the balls drift out in a new mixed order.
      var allIn = items.every(function (it) { return it.placed && it.mode === 'idle'; });
      if (allIn && !doneActive) { doneActive = true; doneT = 0; }
      if (doneActive) {
        doneT += dt;
        if (doneT >= RESET_S) {
          doneActive = false; doneT = -1;
          var prev = items.map(function (it) { return it.slot; });
          var neu = shuffled(6, prev);
          items.forEach(function (it, i) { it.slot = neu[i]; });
          layout();
          items.forEach(sendHome);
        } else { busy = true; }
      }
      var tg = doneActive && doneT < GLOW_S ? 1 : 0;
      cups.forEach(function (cp) {
        if (Math.abs(cp.glow - tg) > 0.005) { cp.glow += (tg - cp.glow) * Math.min(1, dt / 400); busy = true; }
        else { cp.glow = tg; }
      });
      paint();
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

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'kubeczki') { a.mount = mount; } });
})();
