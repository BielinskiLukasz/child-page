// Activity "Myjnia": a muddy vehicle (car, bus, elephant) in a car wash. Dragging a finger over it scrubs the mud away
// (a persistent mud mask on a canvas in logical coordinates, so resize/rotation keeps the cleaned areas) and releases a
// few soap bubbles from a bounded pool. At ~90% clean the rest of the mud fades, the vehicle glows ~3 s, a few extra
// bubbles float up and ~4 s later a new muddy vehicle fades in. Keyboard: arrow keys move the brush, Enter/Space
// advance it along a zig-zag path. One capped-dt rAF loop (pauses while hidden, stops when idle); nothing is stored.
(function () {
  var LW = 480, LH = 288;            // logical size of the mud mask (the vehicle box is 5:3)
  var VB = 200;                      // vehicle drawings use a 200x120 viewBox
  var MAX_BUBBLES = 28, BUBBLE_S = 1.8, SPAWN_GAP_S = 0.09;
  var DONE_AT = 0.9, FADE_MUD_S = 1.2, GLOW_S = 3, NEXT_AT_S = 7, SWAP_S = 0.7;

  function circ(cx, cy, r) { return 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0Z'; }
  function rrect(x, y, w, h, r) {
    return 'M' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + 'V' + (y + h - r) +
      'Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w - r) + ' ' + (y + h) + 'H' + (x + r) + 'Q' + x + ' ' + (y + h) + ' ' + x + ' ' + (y + h - r) +
      'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Z';
  }
  // Each vehicle: list of { d: path, fill }. The same shapes make the clean drawing and the mud silhouette.
  var VEHICLES = [
    { label: 'samochód', shapes: [
      { d: 'M14 84Q14 58 44 54L62 34Q68 28 80 28H124Q134 28 142 36L158 54Q188 58 188 84V92H14Z', fill: '#f7a8c9' },
      { d: 'M70 36H98V54H60ZM104 36H126L142 54H104Z', fill: '#dff1fb' },
      { d: circ(58, 94, 17), fill: '#8a84a8' }, { d: circ(148, 94, 17), fill: '#8a84a8' },
      { d: circ(58, 94, 7), fill: '#d9d4ec' }, { d: circ(148, 94, 7), fill: '#d9d4ec' },
      { d: 'M176 70h10v10h-10z', fill: '#fff0a8' }] },
    { label: 'autobus', shapes: [
      { d: rrect(10, 22, 180, 72, 16), fill: '#ffd98a' },
      { d: rrect(22, 34, 26, 24, 5) + rrect(54, 34, 26, 24, 5) + rrect(86, 34, 26, 24, 5) + rrect(118, 34, 26, 24, 5), fill: '#dff1fb' },
      { d: rrect(152, 34, 28, 48, 6), fill: '#fbe7c8' },
      { d: circ(48, 96, 16), fill: '#8a84a8' }, { d: circ(150, 96, 16), fill: '#8a84a8' },
      { d: circ(48, 96, 6), fill: '#d9d4ec' }, { d: circ(150, 96, 6), fill: '#d9d4ec' }] },
    { label: 'słoń', shapes: [
      { d: 'M46 52Q46 28 96 28Q148 28 150 56Q152 84 146 92H50Q44 84 46 52Z', fill: '#c9d6e8' },
      { d: circ(148, 50, 26), fill: '#c9d6e8' },
      { d: 'M170 56Q190 60 186 84Q184 98 172 96Q180 84 168 74Z', fill: '#c9d6e8' },
      { d: circ(128, 44, 18), fill: '#b4c4dc' },
      { d: rrect(54, 80, 22, 32, 8) + rrect(112, 80, 22, 32, 8), fill: '#b4c4dc' },
      { d: circ(156, 44, 3.5), fill: '#5b5675' }] }
  ];

  function svgFor(v) {
    var s = '<svg viewBox="0 0 200 120" aria-hidden="true" focusable="false">' +
      '<ellipse cx="100" cy="110" rx="86" ry="6" fill="#000" fill-opacity=".08"/>';
    v.shapes.forEach(function (sh) { s += '<path d="' + sh.d + '" fill="' + sh.fill + '"/>'; });
    return s + '<path d="M30 70Q34 56 52 54" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/></svg>';
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  function mount(container) {
    container.style.display = 'block';
    var board = document.createElement('div');
    board.className = 'mj';
    board.innerHTML = '<div class="mj-field"><div class="mj-foam mj-f1"></div><div class="mj-foam mj-f2"></div><div class="mj-foam mj-f3"></div>' +
      '<div class="mj-box" tabindex="0" role="application" aria-label="Brudny pojazd. Strzałki przesuwają szczotkę, Enter lub spacja szoruje dalej.">' +
      '<div class="mj-clean"></div><canvas class="mj-mud" width="' + LW + '" height="' + LH + '"></canvas>' +
      '<div class="mj-brush"></div><div class="mj-bubbles"></div></div></div>';
    container.appendChild(board);
    var field = board.querySelector('.mj-field'), box = board.querySelector('.mj-box'), clean = board.querySelector('.mj-clean'),
      mud = board.querySelector('.mj-mud'), brushEl = board.querySelector('.mj-brush'), bubWrap = board.querySelector('.mj-bubbles');
    var ctx = mud.getContext('2d');
    var small = document.createElement('canvas');
    small.width = 48; small.height = 29;
    var sctx = small.getContext('2d', { willReadFrequently: true });

    var bubbles = [];
    for (var b = 0; b < MAX_BUBBLES; b++) {
      var bn = document.createElement('div');
      bn.className = 'mj-bub';
      bn.style.display = 'none';
      bubWrap.appendChild(bn);
      bubbles.push({ node: bn, age: -1, x: 0, y: 0, r: 0, dx: 0 });
    }

    var vi = 0, baseline = 1, boxW = 300, brushLogical = 40;
    var phase = 'play', phaseT = 0, mudOp = 1, glow = 0, boxOp = 1, swapDir = 0;
    var pointers = {}, lastSpawn = 0, dirty = false, checkT = 0, kx = 0.15, ky = 0.35, kdir = 1, raf = 0, last = 0, clock = 0;

    function remaining() {
      sctx.clearRect(0, 0, 48, 29);
      sctx.drawImage(mud, 0, 0, 48, 29);
      var d = sctx.getImageData(0, 0, 48, 29).data, s = 0;
      for (var i = 3; i < d.length; i += 4) { s += d[i]; }
      return s;
    }
    function drawMud() {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, LW, LH);
      var k = LW / VB;
      ctx.save();
      ctx.scale(k, k);
      ctx.fillStyle = '#b99a7a';
      VEHICLES[vi].shapes.forEach(function (sh) { ctx.fill(new Path2D(sh.d)); });
      ctx.restore();
      // darker blotches only where the mud is
      ctx.globalCompositeOperation = 'source-atop';
      for (var i = 0; i < 46; i++) {
        ctx.fillStyle = Math.random() < 0.5 ? 'rgba(140,105,72,.32)' : 'rgba(210,180,140,.3)';
        ctx.beginPath();
        ctx.arc(Math.random() * LW, Math.random() * LH, 8 + Math.random() * 26, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      baseline = Math.max(1, remaining());
    }
    function setVehicle(i) {
      vi = i;
      clean.innerHTML = svgFor(VEHICLES[vi]);
      box.setAttribute('aria-label', 'Brudny pojazd: ' + VEHICLES[vi].label + '. Strzałki przesuwają szczotkę, Enter lub spacja szoruje dalej.');
      drawMud();
      mudOp = 1; mud.style.opacity = '1';
      glow = 0; phase = 'play'; phaseT = 0; kx = 0.15; ky = 0.35; kdir = 1;
    }

    function erase(x0, y0, x1, y1) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = brushLogical;
      ctx.strokeStyle = '#000';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      dirty = true;
    }
    function toLogical(e) {
      var r = box.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width * LW, (e.clientY - r.top) / r.height * LH];
    }
    function spawnBubble(lx, ly) {
      for (var k = 0; k < bubbles.length; k++) {
        var bb = bubbles[k];
        if (bb.age >= 0) { continue; }
        bb.age = 0; bb.x = lx / LW; bb.y = ly / LH; bb.r = 0.02 + Math.random() * 0.025; bb.dx = (Math.random() - 0.5) * 0.04;
        bb.node.style.display = '';
        bb.node.style.width = bb.node.style.height = (bb.r * 200) + '%';
        return;
      }
    }
    function maybeSpawn(lx, ly) {
      if (clock - lastSpawn < SPAWN_GAP_S) { return; }
      lastSpawn = clock;
      spawnBubble(lx + (Math.random() - 0.5) * 30, ly + (Math.random() - 0.5) * 20);
    }

    function down(e) {
      if (phase !== 'play' && phase !== 'done') { return; }
      var p = toLogical(e);
      pointers[e.pointerId] = p;
      try { box.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      erase(p[0], p[1], p[0], p[1]);
      maybeSpawn(p[0], p[1]);
      e.preventDefault();
      start();
    }
    function move(e) {
      var prev = pointers[e.pointerId];
      if (!prev || phase === 'swap') { return; }
      var p = toLogical(e);
      erase(prev[0], prev[1], p[0], p[1]);
      maybeSpawn(p[0], p[1]);
      pointers[e.pointerId] = p;
      start();
    }
    function up(e) { delete pointers[e.pointerId]; }

    function brushTo(nx, ny) {
      var x0 = kx * LW, y0 = ky * LH;
      kx = Math.max(0.04, Math.min(0.96, nx)); ky = Math.max(0.06, Math.min(0.94, ny));
      if (phase === 'swap') { return; }
      erase(x0, y0, kx * LW, ky * LH);
      maybeSpawn(kx * LW, ky * LH);
      brushEl.style.left = (kx * 100) + '%'; brushEl.style.top = (ky * 100) + '%';
      start();
    }
    function onKey(e) {
      var step = 0.07, handled = true;
      if (e.key === 'ArrowLeft') { brushTo(kx - step, ky); }
      else if (e.key === 'ArrowRight') { brushTo(kx + step, ky); }
      else if (e.key === 'ArrowUp') { brushTo(kx, ky - step); }
      else if (e.key === 'ArrowDown') { brushTo(kx, ky + step); }
      else if (e.key === 'Enter' || e.key === ' ') {
        // zig-zag across the vehicle in steps
        var nx = kx + kdir * step;
        if (nx > 0.96 || nx < 0.04) { kdir = -kdir; brushTo(kx, ky + 0.12 > 0.94 ? 0.06 : ky + 0.12); }
        else { brushTo(nx, ky); }
      } else { handled = false; }
      if (handled) { e.preventDefault(); }
    }
    function onFocus() { brushEl.style.display = 'block'; brushEl.style.left = (kx * 100) + '%'; brushEl.style.top = (ky * 100) + '%'; }
    function onBlur() { brushEl.style.display = 'none'; }

    function paintBubbles() {
      bubbles.forEach(function (bb) {
        if (bb.age < 0) { return; }
        var u = bb.age / BUBBLE_S;
        bb.node.style.left = ((bb.x + bb.dx * u) * 100).toFixed(2) + '%';
        bb.node.style.top = ((bb.y - 0.18 * smooth(u)) * 100).toFixed(2) + '%';
        bb.node.style.opacity = (0.8 * (1 - u * u)).toFixed(3);
      });
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min((now - last) / 1000, 0.05); last = now; clock += dt;
      var busy = false;
      bubbles.forEach(function (bb) {
        if (bb.age < 0) { return; }
        bb.age += dt;
        if (bb.age >= BUBBLE_S) { bb.age = -1; bb.node.style.display = 'none'; } else { busy = true; }
      });
      paintBubbles();
      if (dirty && phase === 'play') {
        checkT += dt;
        if (checkT >= 0.12) {
          checkT = 0; dirty = false;
          if (remaining() / baseline <= 1 - DONE_AT) {
            phase = 'done'; phaseT = 0;
            for (var i = 0; i < 6; i++) { spawnBubble(LW * (0.2 + 0.12 * i), LH * (0.3 + 0.3 * Math.random())); }
          }
        } else { busy = true; }
      }
      if (phase === 'done') {
        phaseT += dt; busy = true;
        mudOp = reduced() ? 0 : Math.max(0, 1 - phaseT / FADE_MUD_S);
        mud.style.opacity = mudOp.toFixed(3);
        glow = phaseT < GLOW_S ? Math.min(1, phaseT / 0.5) : Math.max(0, 1 - (phaseT - GLOW_S) / 0.5);
        box.style.filter = glow > 0.01 ? 'drop-shadow(0 0 ' + (6 + 16 * glow) + 'px #ffe08a)' : '';
        if (phaseT >= NEXT_AT_S) { phase = 'swap'; phaseT = 0; swapDir = -1; pointers = {}; }
      } else if (phase === 'swap') {
        phaseT += dt; busy = true;
        boxOp += swapDir * dt / SWAP_S;
        if (swapDir < 0 && boxOp <= 0) { boxOp = 0; setVehicle((vi + 1) % VEHICLES.length); phase = 'swap'; swapDir = 1; // (setVehicle resets the phase)
          box.style.filter = ''; }
        else if (swapDir > 0 && boxOp >= 1) { boxOp = 1; phase = 'play'; swapDir = 0; }
        box.style.opacity = boxOp.toFixed(3);
      }
      if (busy) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }

    function layout() {
      var r = field.getBoundingClientRect();
      boxW = Math.max(120, Math.min(r.width * 0.96, r.height * 0.9 * 5 / 3, 680));
      box.style.width = boxW + 'px'; box.style.height = (boxW * 3 / 5) + 'px';
      brushLogical = Math.max(44, boxW * 0.11) / boxW * LW;   // brush at least 44 CSS px wide
    }
    function onResize() { layout(); }

    box.addEventListener('pointerdown', down);
    box.addEventListener('pointermove', move);
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', up);
    box.addEventListener('lostpointercapture', up);
    box.addEventListener('keydown', onKey);
    box.addEventListener('focus', onFocus);
    box.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    layout();
    setVehicle(0);

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (board.parentNode) { board.parentNode.removeChild(board); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'myjnia') { a.mount = mount; } });
})();
