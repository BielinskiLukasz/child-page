// Activity "Latawiec": a pastel sky and hill, a small animal holding the kite string, a kite with a ribbon tail of 5 bows
// and 3 clouds. Touching/dragging the sky makes the kite follow the finger on a damped spring (speed capped at 110 board
// units/s, so crossing the 400-unit board takes >= 3.6 s). Lifting the finger lets it drift on and settle into a slow
// figure-eight (period 10 s) within ~4 s. The tail replays the kite's earlier path (bow i lags i*0.22 s) as a wave;
// the string is a sagging curve from the animal's paw to the kite. A cloud the kite touches puffs aside and returns once
// the kite has left; touching the animal makes it wave. Nothing is scored or stored.
// Board = fixed 400x300 coordinate space scaled by k = board width / 400; every point is clamped inside it, so the kite
// is always fully on screen, also after an orientation change. One rAF loop (capped dt, paused when the tab is hidden)
// drives everything, so it works under the global prefers-reduced-motion rule. Only the first pointer steers the kite.
(function () {
  var BW = 400, BH = 300;
  var KX0 = 28, KX1 = 372, KY0 = 36, KY1 = 140;      // kite centre bounds (kite is ~44 x 56 units)
  var VMAX = 110, SK = 6, SD = 4.4;                   // speed cap, spring stiffness, damping
  var HA = 26, HB = 11, HW = 2 * Math.PI / 10, SETTLE = 4;
  var BOWS = 5, LAG = 0.22, MAX_DT = 0.05, WAVE_T = 1.6;
  var AX = 70, AY = 234, AS = 0.9;                    // animal feet position and scale
  var CLOUDS = [[84, 52, 1], [236, 38, 0.85], [334, 92, 1.05]];
  var BOW_COLS = ['#f7a8c9', '#ffd98a', '#a8d8f0', '#c9b8f2', '#9ed8c6'];

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function cloudSvg() {
    return '<circle cx="-18" cy="4" r="12"/><circle cx="0" cy="-4" r="16"/><circle cx="19" cy="3" r="12"/><rect x="-30" y="4" width="60" height="12" rx="6"/>';
  }

  function scene(def) {
    var fur = def.fur;
    var clouds = '';
    CLOUDS.forEach(function (c, i) { clouds += '<g class="lw-cloud" fill="#fff" fill-opacity=".92" transform="translate(' + c[0] + ' ' + c[1] + ')">' + cloudSvg() + '</g>'; });
    var bows = '';
    for (var i = 0; i < BOWS; i++) {
      bows += '<path class="lw-bow" fill="' + BOW_COLS[i] + '" d="M0 0L-9-6L-9 6zM0 0L9-6L9 6z"/>';
    }
    return '<defs><linearGradient id="lw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfeaf8"/><stop offset="1" stop-color="#f3f7e6"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#lw-sky)"/>' +
      '<circle cx="360" cy="30" r="14" fill="#ffe9a8"/>' + clouds +
      '<path d="M0 250Q90 205 200 232T400 225V300H0z" fill="#c8e6b6"/>' +
      '<path d="M0 272Q120 250 240 268T400 262V300H0z" fill="#b3d9a3"/>' +
      '<g fill="#a9d98f"><path d="M300 262q-3-10 0-14M305 262q1-9 5-12M310 262q4-8 9-9"/></g>' +
      '<g class="lw-animal" transform="translate(' + AX + ' ' + AY + ') scale(' + AS + ')">' +
      '<ellipse cx="-9" cy="-3" rx="6" ry="3.5" fill="' + fur + '"/><ellipse cx="9" cy="-3" rx="6" ry="3.5" fill="' + fur + '"/>' +
      '<g transform="translate(0,-36) scale(.85)">' + window.Animals.head(def.id, { body: true }) + '</g>' +
      '<circle cx="-21" cy="-14" r="5" fill="' + fur + '"/><circle class="lw-paw" cx="21" cy="-14" r="5" fill="' + fur + '"/></g>' +
      '<path class="lw-string" d="M0 0" fill="none" stroke="#8f7fd1" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path class="lw-tail" d="M0 0" fill="none" stroke="#8f7fd1" stroke-width="1.6" stroke-linecap="round"/>' + bows +
      '<g class="lw-kite"><path d="M0-28L22-4L0 28L-22-4Z" fill="#f7a8c9"/><path d="M0-28L22-4L0-4Z" fill="#ffd98a"/><path d="M0 28L-22-4L0-4Z" fill="#a8d8f0"/>' +
      '<path d="M0-28V28M-22-4H22" stroke="#fff" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M0-28L22-4L0 28L-22-4Z" fill="none" stroke="#8f7fd1" stroke-width="2" stroke-linejoin="round"/></g>';
  }

  function mount(container) {
    var def = window.Animals.pick(1)[0];       // a new animal on every launch
    var root = document.createElement('div');
    root.className = 'lw';
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', 'Latawiec');
    root.innerHTML = '<div class="lw-board"><svg class="lw-bg" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + scene(def) + '</svg>' +
      '<button type="button" class="lw-an" aria-label="' + def.name + ' – pomachaj"></button>' +
      '<button type="button" class="lw-kb" aria-label="Latawiec – strzałki przesuwają latawiec"></button></div>';
    container.appendChild(root);

    var board = root.querySelector('.lw-board');
    var an = root.querySelector('.lw-an');
    var kb = root.querySelector('.lw-kb');
    var kiteG = root.querySelector('.lw-kite');
    var stringP = root.querySelector('.lw-string');
    var tailP = root.querySelector('.lw-tail');
    var bowEls = root.querySelectorAll('.lw-bow');
    var paw = root.querySelector('.lw-paw');
    var cloudEls = root.querySelectorAll('.lw-cloud');
    var k = 1, rect = null;
    var x = 200, y = 80, vx = 0, vy = 0, tilt = 0;
    var cx = 200, cy = 80, th = 0, tFree = SETTLE;       // hover centre, figure-eight phase, time since release
    var dragging = false, pid = null, tx = 200, ty = 80;
    var time = 0, waveT = 0, hist = [];
    var clouds = CLOUDS.map(function () { return { ox: 0, side: 0, away: false, pulse: 0 }; });
    var raf = 0, last = 0;

    function toUnits(e) {
      rect = board.getBoundingClientRect();
      var s = rect.width / BW || 1;
      return [(e.clientX - rect.left) / s, (e.clientY - rect.top) / s];
    }
    function steer(e) {
      var p = toUnits(e);
      tx = clamp(p[0], KX0, KX1); ty = clamp(p[1], KY0, KY1);
    }
    function onDown(e) {
      if (pid !== null || (e.target.closest && e.target.closest('.lw-an'))) { return; }
      pid = e.pointerId; dragging = true; steer(e);
    }
    function onMove(e) { if (dragging && e.pointerId === pid) { steer(e); } }
    function release() {
      dragging = false; pid = null;
      cx = clamp(x + vx * 0.5, KX0 + HA, KX1 - HA);
      cy = clamp(y + vy * 0.5, KY0 + HB, KY1 - HB);
      tFree = 0;
    }
    function onUp(e) { if (dragging && e.pointerId === pid) { release(); } }
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    an.addEventListener('click', function () { waveT = WAVE_T; start(); });
    kb.addEventListener('keydown', function (e) {
      var dx = e.key === 'ArrowLeft' ? -50 : (e.key === 'ArrowRight' ? 50 : 0);
      var dy = e.key === 'ArrowUp' ? -35 : (e.key === 'ArrowDown' ? 35 : 0);
      if (!dx && !dy) { return; }
      e.preventDefault();
      if (dragging) { return; }
      cx = clamp(cx + dx, KX0 + HA, KX1 - HA); cy = clamp(cy + dy, KY0 + HB, KY1 - HB);
      tFree = 0; start();
    });

    function histAt(t) {
      var i = hist.length - 1;
      if (i < 0) { return [x, y]; }
      while (i > 0 && hist[i].t > t) { i--; }
      var a = hist[i], b = hist[Math.min(i + 1, hist.length - 1)];
      var u = b.t > a.t ? clamp((t - a.t) / (b.t - a.t), 0, 1) : 0;
      return [a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u];
    }

    function frame(now) {
      var dt = Math.min((now - last) / 1000, MAX_DT), i;
      last = now; time += dt;
      var gx, gy;
      if (dragging) { gx = tx; gy = ty; }
      else {
        tFree += dt; th += HW * dt;
        var r = clamp(tFree / SETTLE, 0, 1); r = r * r * (3 - 2 * r);
        gx = cx + r * HA * Math.sin(th); gy = cy + r * HB * Math.sin(2 * th);
      }
      vx += (SK * (gx - x) - SD * vx) * dt;
      vy += (SK * (gy - y) - SD * vy) * dt;
      var sp = Math.sqrt(vx * vx + vy * vy);
      if (sp > VMAX) { vx *= VMAX / sp; vy *= VMAX / sp; }
      x += vx * dt; y += vy * dt;
      if (x < KX0 || x > KX1) { x = clamp(x, KX0, KX1); vx = 0; }
      if (y < KY0 || y > KY1) { y = clamp(y, KY0, KY1); vy = 0; }
      tilt += (clamp(vx * 0.2, -18, 18) + 3 * Math.sin(time * 0.9) - tilt) * (1 - Math.exp(-3 * dt));

      hist.push({ t: time, x: x, y: y });
      while (hist.length > 2 && hist[1].t < time - (BOWS * LAG + 0.5)) { hist.shift(); }

      for (i = 0; i < clouds.length; i++) {
        var c = clouds[i], cb = CLOUDS[i];
        var dx = x - (cb[0] + c.ox), dy = y - cb[1];
        var d = Math.sqrt(dx * dx + dy * dy);
        if (!c.away && d < 46 * cb[2]) { c.away = true; c.side = dx > 0 ? -1 : 1; c.pulse = 1; }
        else if (c.away && Math.abs(x - cb[0]) > 100) { c.away = false; }
        var want = c.away ? c.side * 46 : 0;
        want = clamp(cb[0] + want, 40, 360) - cb[0];
        c.ox += (want - c.ox) * (1 - Math.exp(-1.6 * dt));
        c.pulse = Math.max(0, c.pulse - dt / 1.2);
      }
      if (waveT > 0) { waveT = Math.max(0, waveT - dt); }
      paint();
      raf = requestAnimationFrame(frame);
    }

    function paint() {
      var i;
      kiteG.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + tilt.toFixed(1) + ')');
      var hx = AX - 21 * AS, hy = AY - 14 * AS;
      var mx = (hx + x) / 2, my = (hy + y) / 2 + 20;
      stringP.setAttribute('d', 'M' + hx.toFixed(1) + ' ' + hy.toFixed(1) + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1));
      var pts = [[x, y + 28]], p, h;
      for (i = 1; i <= BOWS; i++) {
        h = histAt(time - i * LAG);
        p = [x + (h[0] - x) + 4 * (i / BOWS) * Math.sin(time * 2.2 - i * 0.9), y + 28 + i * 15 + (h[1] - y)];
        pts.push([clamp(p[0], 8, BW - 8), clamp(p[1], 8, BH - 8)]);
      }
      var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
      for (i = 1; i < pts.length - 1; i++) {
        d += 'Q' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1) + ' ' + ((pts[i][0] + pts[i + 1][0]) / 2).toFixed(1) + ' ' + ((pts[i][1] + pts[i + 1][1]) / 2).toFixed(1);
      }
      d += 'L' + pts[pts.length - 1][0].toFixed(1) + ' ' + pts[pts.length - 1][1].toFixed(1);
      tailP.setAttribute('d', d);
      for (i = 1; i < pts.length; i++) {
        var ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) * 180 / Math.PI + 90;
        bowEls[i - 1].setAttribute('transform', 'translate(' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
      }
      for (i = 0; i < cloudEls.length; i++) {
        var sc = CLOUDS[i][2] * (1 + 0.1 * Math.sin(Math.PI * (1 - clouds[i].pulse)) * (clouds[i].pulse > 0 ? 1 : 0));
        cloudEls[i].setAttribute('transform', 'translate(' + (CLOUDS[i][0] + clouds[i].ox).toFixed(1) + ' ' + CLOUDS[i][1] + ') scale(' + sc.toFixed(3) + ')');
      }
      if (waveT > 0) {
        var u = (WAVE_T - waveT) / WAVE_T, env = Math.sin(Math.PI * Math.min(1, u * 1.15)), ang2 = Math.sin(u * Math.PI * 6);
        paw.setAttribute('cx', (21 + 3 * ang2 * env).toFixed(1)); paw.setAttribute('cy', (-14 - 22 * env).toFixed(1));
      } else { paw.setAttribute('cx', '21'); paw.setAttribute('cy', '-14'); }
      var s = k, bs = Math.max(56, 56 * s);
      kb.style.width = bs + 'px'; kb.style.height = bs + 'px';
      kb.style.transform = 'translate(' + (x * s - bs / 2).toFixed(1) + 'px,' + (y * s - bs / 2).toFixed(1) + 'px)';
    }

    function layout() {
      var w = board.clientWidth || window.innerWidth;
      k = w / BW;
      var bw = Math.max(56, 60 * k), bh = Math.max(56, 64 * k);
      an.style.width = bw.toFixed(1) + 'px'; an.style.height = bh.toFixed(1) + 'px';
      an.style.left = (AX * k - bw / 2).toFixed(1) + 'px';
      an.style.top = (AY * k - bh).toFixed(1) + 'px';
      paint();
    }

    function start() {
      if (raf || document.hidden) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }
    function onResize() { layout(); }

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    layout();
    start();

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'latawiec') { a.mount = mount; } });
})();
