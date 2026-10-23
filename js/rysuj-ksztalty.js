// Activity "Rysuj Kształty": trace a dotted guide (line, circle, zigzag, cross, wave, spiral) with a finger. A soft thick
// line in calm, gently changing colours appears along the guide only; movement farther than ~40 px from the guide or
// against its direction simply does not extend the line. Lift and touch near the end of the line to continue.
// When the whole guide is traced it glows ~3 s, then ~4 s later the canvas fades to the next shape.
// Progress is stored as arc length in unit-square coordinates, so resize/rotation redraws it relative to the guide.
// Keyboard: arrows / Enter / Space move the pen forward along the guide. Drawing happens straight in the pointer
// handlers; a small capped-dt rAF loop only runs the glow/fade phases (works under prefers-reduced-motion).
(function () {
  var NEAR_PX = 40, START_PX = 52, MAX_JUMP = 0.35, STEP = 0.03;
  var GLOW_S = 3, NEXT_AT_S = 7, FADE_S = 0.8;
  var PALETTE = [[247, 168, 201], [255, 217, 138], [191, 230, 180], [168, 216, 240], [201, 184, 242]];

  function circle() {
    var p = [];
    for (var i = 0; i <= 72; i++) { var a = -Math.PI / 2 + i / 72 * Math.PI * 2; p.push([0.5 + 0.38 * Math.cos(a), 0.5 + 0.38 * Math.sin(a)]); }
    return [p];
  }
  function wave() {
    var p = [];
    for (var i = 0; i <= 60; i++) { var x = 0.08 + 0.84 * i / 60; p.push([x, 0.5 + 0.2 * Math.sin(2 * Math.PI * 2 * (x - 0.08) / 0.84)]); }
    return [p];
  }
  function spiral() {
    var p = [];
    for (var i = 0; i <= 140; i++) { var t = i / 140, a = -Math.PI / 2 + t * Math.PI * 2 * 2.5, r = 0.05 + 0.35 * t; p.push([0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)]); }
    return [p];
  }
  var SHAPES = [
    { label: 'linia', strokes: [[[0.1, 0.5], [0.9, 0.5]]] },
    { label: 'kółko', strokes: circle() },
    { label: 'zygzak', strokes: [[[0.1, 0.72], [0.26, 0.28], [0.42, 0.72], [0.58, 0.28], [0.74, 0.72], [0.9, 0.28]]] },
    { label: 'krzyżyk', strokes: [[[0.5, 0.1], [0.5, 0.9]], [[0.1, 0.5], [0.9, 0.5]]] },
    { label: 'fala', strokes: wave() },
    { label: 'spirala', strokes: spiral() }
  ];

  // Precompute cumulative arc lengths (unit coords) for each stroke of a shape.
  function prepare(shape) {
    var total = 0;
    var strokes = shape.strokes.map(function (pts) {
      var cum = [0];
      for (var i = 1; i < pts.length; i++) { cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); }
      var s = { pts: pts, cum: cum, len: cum[cum.length - 1], before: total };
      total += s.len;
      return s;
    });
    return { label: shape.label, strokes: strokes, total: total };
  }
  function pointAt(st, s) {
    var c = st.cum, i = 1;
    while (i < c.length - 1 && c[i] < s) { i++; }
    var t = (s - c[i - 1]) / ((c[i] - c[i - 1]) || 1);
    return [st.pts[i - 1][0] + (st.pts[i][0] - st.pts[i - 1][0]) * t, st.pts[i - 1][1] + (st.pts[i][1] - st.pts[i - 1][1]) * t];
  }
  function colorAt(g) {
    var x = Math.max(0, Math.min(1, g)) * (PALETTE.length - 1), i = Math.min(PALETTE.length - 2, Math.floor(x)), f = x - i;
    var a = PALETTE[i], b = PALETTE[i + 1];
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * f) + ',' + Math.round(a[1] + (b[1] - a[1]) * f) + ',' + Math.round(a[2] + (b[2] - a[2]) * f) + ')';
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'rk';
    root.innerHTML = '<div class="rk-field"><div class="rk-board" tabindex="0" role="application" aria-label="Rysowanie po kropkach. Strzałki, Enter lub spacja prowadzą pisak wzdłuż linii.">' +
      '<svg class="rk-guide" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true" focusable="false"></svg>' +
      '<canvas class="rk-canvas"></canvas><div class="rk-pen"></div></div></div>';
    container.appendChild(root);
    var field = root.querySelector('.rk-field'), board = root.querySelector('.rk-board'), guide = root.querySelector('.rk-guide'),
      canvas = root.querySelector('.rk-canvas'), pen = root.querySelector('.rk-pen');
    var ctx = canvas.getContext('2d');
    var NS = 'http://www.w3.org/2000/svg';

    var idx = 0, shape = null, cur = 0, s = 0, B = 300, dpr = 1;
    var drawing = null, lastQ = null, phase = 'play', phaseT = 0, glow = 0, op = 1, raf = 0, last = 0;

    function buildGuide() {
      while (guide.firstChild) { guide.removeChild(guide.firstChild); }
      shape.strokes.forEach(function (st) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', 'M' + st.pts.map(function (q) { return q[0] + ' ' + q[1]; }).join('L'));
        p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#a99cc4'); p.setAttribute('stroke-width', '0.012');
        p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-dasharray', '0.001 0.028'); p.setAttribute('vector-effect', 'none');
        guide.appendChild(p);
      });
    }
    function load(i) {
      idx = (i + SHAPES.length) % SHAPES.length;
      shape = prepare(SHAPES[idx]);
      cur = 0; s = 0; drawing = null; phase = 'play'; phaseT = 0; glow = 0;
      board.setAttribute('aria-label', 'Rysowanie po kropkach: ' + shape.label + '. Strzałki, Enter lub spacja prowadzą pisak wzdłuż linii.');
      buildGuide();
      redraw();
    }

    function strokeSeg(a, b, g) {
      ctx.strokeStyle = colorAt(g);
      ctx.beginPath(); ctx.moveTo(a[0] * B, a[1] * B); ctx.lineTo(b[0] * B, b[1] * B); ctx.stroke();
    }
    function drawRange(st, from, to) {
      var step = 5 / B, p0 = pointAt(st, from), x = from;
      while (x < to) {
        var nx = Math.min(to, x + step), p1 = pointAt(st, nx);
        strokeSeg(p0, p1, (st.before + (x + nx) / 2) / shape.total);
        p0 = p1; x = nx;
      }
    }
    function redraw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, B, B);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(14, B * 0.05);
      shape.strokes.forEach(function (st, k) {
        if (k < cur) { drawRange(st, 0, st.len); } else if (k === cur && s > 0) { drawRange(st, 0, s); }
      });
      paintPen();
    }
    function paintPen() {
      if (cur >= shape.strokes.length) { pen.style.display = 'none'; return; }
      var st = shape.strokes[cur], p = pointAt(st, s);
      pen.style.display = 'block';
      pen.style.left = (p[0] * 100) + '%'; pen.style.top = (p[1] * 100) + '%';
      pen.classList.toggle('rk-start', s === 0);
      if (s === 0) {   // arrow shows the direction of travel at the start
        var q = pointAt(st, Math.min(st.len, 0.04)), ang = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
        pen.style.setProperty('--rk-ang', ang.toFixed(1) + 'deg');
      }
    }

    // Move the pen forward to the nearest guide point ahead (within reach and within ~40 px of the finger).
    function advanceTo(q) {
      if (phase !== 'play' || cur >= shape.strokes.length) { return false; }
      var st = shape.strokes[cur], hi = Math.min(st.len, s + MAX_JUMP * shape.total);
      var best = -1, bd = NEAR_PX / B + 1;
      for (var i = 1; i < st.pts.length; i++) {
        if (st.cum[i] < s) { continue; }
        if (st.cum[i - 1] > hi) { break; }
        var a = st.pts[i - 1], b = st.pts[i], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1;
        var t = Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / l2));
        var d = Math.hypot(q[0] - (a[0] + dx * t), q[1] - (a[1] + dy * t));
        var arc = st.cum[i - 1] + (st.cum[i] - st.cum[i - 1]) * t;
        if (d * B <= NEAR_PX && arc > s && arc <= hi && d < bd) { bd = d; best = arc; }
      }
      if (best < 0) { return false; }
      var from = s;
      s = best;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(14, B * 0.05);
      drawRange(st, from, s);
      if (s >= st.len - 0.002) { s = st.len; cur++; if (cur < shape.strokes.length) { s = 0; } else { complete(); } }
      paintPen();
      return true;
    }
    function complete() { phase = 'done'; phaseT = 0; start(); }

    function toUnit(e) {
      var r = board.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    }
    board.addEventListener('pointerdown', function (e) {
      if (drawing !== null || phase !== 'play' || cur >= shape.strokes.length) { return; }
      var q = toUnit(e), p = pointAt(shape.strokes[cur], s);
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) * B > START_PX) { return; }   // must touch near the start / end of the line
      drawing = e.pointerId; lastQ = q;
      try { board.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      e.preventDefault();
    });
    board.addEventListener('pointermove', function (e) {
      if (e.pointerId !== drawing) { return; }
      // A fast drag can jump far between events: walk the finger's path in ~8 px steps so the line follows it fully
      // wherever the finger really stayed near the guide.
      var q = toUnit(e), n = Math.max(1, Math.ceil(Math.hypot(q[0] - lastQ[0], q[1] - lastQ[1]) * B / 8));
      for (var k = 1; k <= n; k++) { advanceTo([lastQ[0] + (q[0] - lastQ[0]) * k / n, lastQ[1] + (q[1] - lastQ[1]) * k / n]); }
      lastQ = q;
    });
    function up(e) { if (e.pointerId === drawing) { drawing = null; lastQ = null; } }
    board.addEventListener('pointerup', up);
    board.addEventListener('pointercancel', up);
    board.addEventListener('lostpointercapture', up);
    board.addEventListener('keydown', function (e) {
      if (['ArrowRight', 'ArrowDown', 'Enter', ' '].indexOf(e.key) < 0) { return; }
      e.preventDefault();
      if (phase !== 'play' || cur >= shape.strokes.length) { return; }
      var st = shape.strokes[cur];
      advanceTo(pointAt(st, Math.min(st.len, s + STEP * shape.total)));
    });

    function frame(now) {
      raf = 0;
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      var busy = false;
      if (phase === 'done') {
        phaseT += dt; busy = true;
        glow = phaseT < GLOW_S ? Math.min(1, phaseT / 0.5) : Math.max(0, 1 - (phaseT - GLOW_S) / 0.5);
        if (phaseT >= NEXT_AT_S) { phase = 'out'; phaseT = 0; glow = 0; }
      } else if (phase === 'out') {
        phaseT += dt; busy = true; op = 1 - smooth(phaseT / FADE_S);
        if (phaseT >= FADE_S) { op = 0; load(idx + 1); phase = 'in'; phaseT = 0; }
      } else if (phase === 'in') {
        phaseT += dt; busy = true; op = smooth(phaseT / FADE_S);
        if (phaseT >= FADE_S) { op = 1; phase = 'play'; busy = false; }
      }
      board.style.opacity = op.toFixed(3);
      board.style.filter = glow > 0.01 ? 'drop-shadow(0 0 ' + (6 + 18 * glow) + 'px #ffe08a)' : '';
      if (busy && !document.hidden) { raf = requestAnimationFrame(frame); }
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
      B = Math.max(160, Math.min(r.width, r.height, 720));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      board.style.width = board.style.height = B + 'px';
      canvas.width = Math.round(B * dpr); canvas.height = Math.round(B * dpr);
      canvas.style.width = canvas.style.height = B + 'px';
      redraw();
    }
    function onResize() { layout(); }

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    load(0);
    layout();

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'rysuj-ksztalty') { a.mount = mount; } });
})();
