// Activity "Koparka na Budowie": the child drives a toy excavator along a building site that is two screens wide
// (finger drag/hold = drive toward the touch, arrows on the keyboard) and digs with a tap on the excavator, the 'dig' button or Space.
// The whole machine moves (unlike Koparka, which only moves the arm). 3 dig spots (cones) turn into holes, 3 sand piles grow, 3 small
// hills slow the machine and tilt it (max 10 degrees). After 3 holes a flower grows from each, then the spots move after 6 s.
// All motion runs in one rAF loop (capped dt, paused while hidden, stopped when idle) and every end state is set from JS,
// so it behaves the same under the global prefers-reduced-motion rule.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var SPEED = 0.35;            // max speed, screen widths per second
  var FOLLOW = 2.5;            // speed gain toward the touch point (1/s)
  var ACCEL = 8, STOP_RATE = 12; // speed smoothing (1/s); stop rate 12 leaves 0.25% after 0.5 s
  var FLIP_RATE = 6;           // facing turn (1/s)
  var DIG_S = 1.2, HOLE_S = 1, MOUND_S = 0.5, FLOWER_S = 0.8, RESET_S = 6, CONE_S = 0.4;
  var HOLES = 3, MAX_MOUNDS = 8, TILT_MAX = 10, BUMP_SLOW = 0.3;
  var MAX_DT = 0.05;
  var BUMPS = [0.3, 0.64, 0.92];       // hill centres (fractions of the site)
  var PILES = [0.17, 0.5, 0.84];       // initial sand piles
  var SLOTS = [0.08, 0.26, 0.42, 0.6, 0.74, 0.93]; // possible dig spot positions
  var REACH = 104;             // bucket reach in excavator units (100 units = machine width)
  // arm keyframes: [time 0..1, boom angle, stick angle (relative), bucket angle (relative)] in degrees, counter-clockwise up
  var KEYS = [[0, 35, -80, -30], [0.28, 5, -50, -10], [0.42, 5, -50, -65], [0.62, 50, -45, -70], [0.82, 50, -20, 15], [1, 35, -80, -30]];
  var PX = 12, PY = -40, L1 = 54, L2 = 42;
  var BUCKET = [[0, -6], [14, -8], [19, 3], [9, 10], [0, 6]];
  var FLOWER_COLORS = ['#f7a8c9', '#ffd98a', '#c9b8f0'];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag), k;
    for (k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) { n.setAttribute(k, attrs[k]); } }
    if (parent) { parent.appendChild(n); }
    return n;
  }

  // arm pose at dig progress p (0..1): angles interpolated with smoothstep between keyframes
  function armAngles(p) {
    var i = 1;
    while (i < KEYS.length - 1 && p > KEYS[i][0]) { i++; }
    var a = KEYS[i - 1], b = KEYS[i], u = ease((p - a[0]) / (b[0] - a[0]));
    return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u];
  }
  // forward kinematics in excavator units (y grows downward, ground = 0)
  function armPoints(ang) {
    var r = Math.PI / 180, A1 = ang[0] * r, A2 = (ang[0] + ang[1]) * r, A3 = (ang[0] + ang[1] + ang[2]) * r;
    var p1 = [PX + L1 * Math.cos(A1), PY - L1 * Math.sin(A1)];
    var p2 = [p1[0] + L2 * Math.cos(A2), p1[1] - L2 * Math.sin(A2)];
    var c = Math.cos(A3), s = Math.sin(A3);
    var bk = BUCKET.map(function (q) { return [p2[0] + q[0] * c + q[1] * s, p2[1] - q[0] * s + q[1] * c]; });
    return { p0: [PX, PY], p1: p1, p2: p2, bucket: bk };
  }

  function mount(container) {
    var scene = document.createElement('div');
    scene.className = 'ej';
    scene.setAttribute('role', 'group');
    scene.setAttribute('aria-label', 'Koparka na Budowie. Strzałki jeżdżą koparką, spacja kopie.');
    var svg = el('svg', { 'aria-hidden': 'true', focusable: 'false', 'class': 'ej-svg' });
    var hit = document.createElement('div');
    hit.className = 'ej-hit';
    hit.setAttribute('role', 'button');
    hit.setAttribute('tabindex', '0');
    hit.setAttribute('aria-label', 'Koparka – kopie dziurę');
    var digBtn = document.createElement('button');
    digBtn.type = 'button';
    digBtn.className = 'ej-dig';
    digBtn.setAttribute('aria-label', 'Kop');
    digBtn.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M8 30h24" stroke="#7a5a3c" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M12 8l10 14" stroke="#7a748f" stroke-width="4" stroke-linecap="round"/><path d="M18 20l12 6-4 5-12-5z" fill="#8d89a3"/></svg>';
    scene.appendChild(svg);
    scene.appendChild(hit);
    scene.appendChild(digBtn);
    container.appendChild(scene);

    var W = 0, H = 0, WW = 0, gy = 0, ew = 0, s = 1, hh = 0, bw = 0;
    var x = 0, v = 0, face = 1, faceT = 1, tx = null, cam = 0, tilt = 0, tiltT = 0;
    var dig = -1, digInfo = null;
    var keys = { left: false, right: false };
    var spots = [], mounds = [], resetT = -1, flowerT = -1, prevSlots = '';
    var N = {};           // svg node references, rebuilt by build()
    var raf = 0, last = 0, drivePtr = null;

    function ground(px) {
      var h = 0, i, d;
      for (i = 0; i < BUMPS.length; i++) {
        d = Math.abs(px - BUMPS[i] * WW);
        if (d < bw) { h += hh * 0.5 * (1 + Math.cos(Math.PI * d / bw)); }
      }
      return h;
    }
    function groundY(px) { return gy - ground(px); }

    function pickSpots() {
      var tries = 0, idx, key, i;
      do {
        idx = [];
        while (idx.length < HOLES) {
          i = Math.floor(Math.random() * SLOTS.length);
          if (idx.indexOf(i) < 0) { idx.push(i); }
        }
        idx.sort();
        key = idx.join(',');
        tries++;
      } while (key === prevSlots && tries < 20);
      prevSlots = key;
      return idx.map(function (j) { return clamp(SLOTS[j] + (Math.random() - 0.5) * 0.03, 0.05, 0.95); });
    }
    function newSpots() {
      var pos = pickSpots();
      spots = pos.map(function (f) { return { f: f, state: 'cone', cone: 0, hole: 0, holeDelay: 0, mf: f, mound: 0, mDelay: 0, flower: 0, color: 0 }; });
      spots.forEach(function (sp, i) { sp.color = i % FLOWER_COLORS.length; });
      resetT = -1; flowerT = -1;
    }
    function initMounds() {
      mounds = PILES.map(function (f) { return { f: f, size: 1, sizeT: 1, grow: 1, delay: 0, fixed: true }; });
    }

    function moundPath() { return 'M-50 0Q-22 -56 0 -56Q22 -56 50 0Z'; }

    function build() {
      var step = 6, n = Math.ceil(WW / step), i, d = '', top = '';
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      // far layer (parallax): sun, clouds, hills
      N.far = el('g', {}, svg);
      el('circle', { cx: W * 0.84, cy: H * 0.14, r: Math.max(18, Math.min(W, H) * 0.06), fill: '#fff1bd' }, N.far);
      [[0.15, 0.1, 1], [0.6, 0.18, 0.8], [1.05, 0.09, 1.1], [1.3, 0.2, 0.9]].forEach(function (c) {
        var g = el('g', { transform: 'translate(' + (c[0] * W) + ' ' + (c[1] * H) + ') scale(' + (c[2] * Math.max(0.6, W / 700)) + ')' }, N.far);
        el('ellipse', { cx: 0, cy: 0, rx: 34, ry: 12, fill: '#fff', opacity: '.85' }, g);
        el('ellipse', { cx: 18, cy: -8, rx: 20, ry: 11, fill: '#fff', opacity: '.85' }, g);
      });
      var far = 'M0 ' + H, fx;
      for (fx = 0; fx <= W * 1.5; fx += 12) { far += ' L' + fx + ' ' + (gy - H * 0.1 - Math.sin(fx / (W * 0.18) + 1) * H * 0.04 - Math.sin(fx / (W * 0.07)) * H * 0.012).toFixed(1); }
      far += ' L' + (W * 1.5) + ' ' + H + 'Z';
      el('path', { d: far, fill: '#b9dcc0' }, N.far);
      // world layer
      N.world = el('g', {}, svg);
      for (i = 0; i <= n; i++) { top += (i ? ' L' : 'M') + (i * step) + ' ' + groundY(i * step).toFixed(1); }
      d = top + ' L' + WW + ' ' + H + ' L0 ' + H + 'Z';
      el('path', { d: d, fill: '#cfa97b' }, N.world);
      el('path', { d: top, fill: 'none', stroke: '#a8d9a0', 'stroke-width': Math.max(6, ew * 0.1), 'stroke-linejoin': 'round' }, N.world);
      for (i = 0; i < 14; i++) { // pebbles
        var pxp = (i + 0.5) / 14 * WW, pyp = gy + (H - gy) * (0.25 + 0.5 * ((i * 37) % 10) / 10);
        el('ellipse', { cx: pxp.toFixed(1), cy: pyp.toFixed(1), rx: 4 + (i % 3) * 2, ry: 2.5 + (i % 2), fill: '#b98e60' }, N.world);
      }
      // spots: spoil mound, hole, cone, flower
      N.spots = spots.map(function () {
        var g = el('g', {}, N.world);
        var mp = el('path', { d: moundPath(), fill: '#ecd28f', stroke: '#d3b56c', 'stroke-width': 2 }, g);
        var hole = el('g', {}, g);
        el('ellipse', { cx: 0, cy: 0, rx: 50, ry: 11, fill: '#8a6a47' }, hole);
        el('ellipse', { cx: 0, cy: 3, rx: 40, ry: 8, fill: '#5a4129' }, hole);
        var cone = el('g', {}, g);
        el('path', { d: 'M-14 0L-5 -30h10l9 30z', fill: '#f2994a' }, cone);
        el('path', { d: 'M-9 -16h18l-2 -8h-14z', fill: '#fff' }, cone);
        el('rect', { x: -18, y: -3, width: 36, height: 5, rx: 2, fill: '#e07f33' }, cone);
        var fl = el('g', {}, g);
        el('circle', { cx: 0, cy: -60, r: 36, fill: '#fff7c2', opacity: '.55' }, fl);
        el('path', { d: 'M0 0V-52', stroke: '#6fb878', 'stroke-width': 6, 'stroke-linecap': 'round' }, fl);
        el('ellipse', { cx: -12, cy: -22, rx: 12, ry: 5, fill: '#8fd08a', transform: 'rotate(-25 -12 -22)' }, fl);
        var head = el('g', {}, fl), k;
        for (k = 0; k < 5; k++) {
          el('circle', { cx: (Math.cos(k * 1.2566) * 13).toFixed(1), cy: (-58 + Math.sin(k * 1.2566) * 13).toFixed(1), r: 9, 'class': 'ej-pet' }, head);
        }
        el('circle', { cx: 0, cy: -58, r: 7, fill: '#ffe08a' }, head);
        return { g: g, mp: mp, hole: hole, cone: cone, fl: fl, pet: [].slice.call(head.querySelectorAll ? head.querySelectorAll('.ej-pet') : []) };
      });
      // sand piles and free mounds (pool)
      N.mounds = [];
      for (i = 0; i < PILES.length + MAX_MOUNDS; i++) {
        N.mounds.push(el('path', { d: moundPath(), fill: '#ecd28f', stroke: '#d3b56c', 'stroke-width': 2 }, N.world));
      }
      // excavator
      N.ex = el('g', {}, N.world);
      var ex = N.ex;
      el('rect', { x: -44, y: -16, width: 88, height: 16, rx: 8, fill: '#5b5675' }, ex);
      [-30, 0, 30].forEach(function (cx) { el('circle', { cx: cx, cy: -8, r: 5.5, fill: '#cfc9e6' }, ex); });
      el('rect', { x: -36, y: -26, width: 72, height: 12, rx: 4, fill: '#e6a23c' }, ex);
      el('rect', { x: -42, y: -46, width: 12, height: 20, rx: 4, fill: '#8d89a3' }, ex);
      el('rect', { x: -34, y: -54, width: 52, height: 30, rx: 7, fill: '#f4c24e' }, ex);
      el('rect', { x: -26, y: -49, width: 26, height: 20, rx: 4, fill: '#cfeaf8' }, ex);
      N.boom = el('line', { stroke: '#f0b64a', 'stroke-width': 10, 'stroke-linecap': 'round' }, ex);
      N.stick = el('line', { stroke: '#e6a23c', 'stroke-width': 8, 'stroke-linecap': 'round' }, ex);
      N.bucket = el('path', { fill: '#8d89a3', stroke: '#6b6585', 'stroke-width': 2, 'stroke-linejoin': 'round' }, ex);
      el('circle', { cx: PX, cy: PY, r: 5.5, fill: '#6b6585' }, ex);
      N.load = el('circle', { r: 5, fill: '#ecd28f', opacity: '0' }, ex);
      N.blob = el('circle', { r: 6, fill: '#ecd28f', opacity: '0' }, N.world);
    }

    function layout() {
      var oldWW = WW;
      W = scene.clientWidth || window.innerWidth;
      H = scene.clientHeight || window.innerHeight;
      WW = W * 2;
      gy = H * 0.72;
      ew = clamp(Math.min(W * 0.26, H * 0.4), 72, 280);
      s = ew / 100;
      hh = Math.min(H * 0.06, W * 0.04);
      bw = hh * 6;
      if (oldWW > 0) { x = x / oldWW * WW; cam = cam / oldWW * WW; } else { x = W * 0.3; }
      build();
      paint();
      wake();
    }

    function hitDig() {
      var sgn = faceT >= 0 ? 1 : -1;
      var px = x + sgn * REACH * s;
      return { sgn: sgn, px: px, drop: px + sgn * ew * 0.32 };
    }

    function startDig() {
      if (dig >= 0) { return; }
      var info = hitDig(), i, best = null, bd = ew * 0.45, d, sp, m, mm, kind = 'pile';
      for (i = 0; i < spots.length; i++) {
        sp = spots[i];
        d = Math.abs(info.px - sp.f * WW);
        if (sp.state === 'cone' && d < bd) { best = sp; bd = d; }
      }
      dig = 0; digInfo = info; // the machine pauses while digging; a held touch keeps its target
      if (best) {
        best.state = 'hole'; best.hole = 0; best.holeDelay = KEYS[1][0] * DIG_S;
        best.mf = clamp(info.drop, ew * 0.2, WW - ew * 0.2) / WW; best.mound = 0; best.mDelay = KEYS[4][0] * DIG_S;
        kind = 'hole';
      } else {
        mm = null;
        for (i = 0; i < mounds.length; i++) { if (Math.abs(info.drop - mounds[i].f * WW) < ew * 0.5) { mm = mounds[i]; break; } }
        if (mm) {
          mm.sizeT = Math.min(1.5, mm.sizeT + 0.15);
        } else {
          m = { f: clamp(info.drop, ew * 0.3, WW - ew * 0.3) / WW, size: 0.5, sizeT: 0.5, grow: 0, delay: KEYS[4][0] * DIG_S, fixed: false };
          var free = mounds.filter(function (q) { return !q.fixed; });
          if (free.length >= MAX_MOUNDS) { mounds.splice(mounds.indexOf(free[0]), 1); }
          mounds.push(m);
        }
      }
      report(function (A) { A.track('interaction', { variant: kind === 'hole' ? 'hole' : 'dig' }); });
      wake();
    }

    function allHoles() {
      var i;
      for (i = 0; i < spots.length; i++) { if (spots[i].state !== 'hole' || spots[i].hole < 1) { return false; } }
      return spots.length > 0;
    }

    function step(dt) {
      var vmax = SPEED * W, vd = 0, dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), i, sp, m;
      if (dig < 0) {
        if (dir) { vd = dir * vmax; }
        else if (tx !== null && Math.abs(tx - x) > 2) { vd = clamp((tx - x) * FOLLOW, -vmax, vmax); }
      }
      vd *= 1 - BUMP_SLOW * clamp(ground(x) / hh, 0, 1);
      v += (vd - v) * (1 - Math.exp(-(vd === 0 ? STOP_RATE : ACCEL) * dt));
      if (vd === 0 && Math.abs(v) < vmax * 0.01) { v = 0; }
      x += v * dt;
      var lo = ew * 0.55, hi = WW - ew * 0.55;
      if (x < lo) { x = lo; if (v < 0) { v = 0; } }
      if (x > hi) { x = hi; if (v > 0) { v = 0; } }
      if (dig < 0 && Math.abs(v) > vmax * 0.02) { faceT = v > 0 ? 1 : -1; }
      face += clamp(faceT - face, -FLIP_RATE * dt, FLIP_RATE * dt);

      var camT = clamp(x - W / 2, 0, WW - W);
      cam += (camT - cam) * (1 - Math.exp(-6 * dt));
      if (Math.abs(camT - cam) < 0.3) { cam = camT; }

      var d = ew * 0.3, tt = Math.atan2(groundY(x + d) - groundY(x - d), 2 * d) * 57.2958;
      tiltT = clamp(tt, -TILT_MAX, TILT_MAX);
      tilt += (tiltT - tilt) * (1 - Math.exp(-10 * dt));
      if (Math.abs(tiltT - tilt) < 0.02) { tilt = tiltT; }

      if (dig >= 0) { dig += dt; if (dig >= DIG_S) { dig = -1; digInfo = null; } }

      for (i = 0; i < spots.length; i++) {
        sp = spots[i];
        if (sp.cone < 1) { sp.cone = Math.min(1, sp.cone + dt / CONE_S); }
        if (sp.state === 'hole') {
          if (sp.holeDelay > 0) { sp.holeDelay -= dt; } else if (sp.hole < 1) { sp.hole = Math.min(1, sp.hole + dt / HOLE_S); }
          if (sp.mDelay > 0) { sp.mDelay -= dt; } else if (sp.mound < 1) { sp.mound = Math.min(1, sp.mound + dt / MOUND_S); }
          if (flowerT >= 0 && sp.flower < 1) { sp.flower = Math.min(1, sp.flower + dt / FLOWER_S); }
        }
      }
      for (i = 0; i < mounds.length; i++) {
        m = mounds[i];
        if (m.delay > 0) { m.delay -= dt; } else if (m.grow < 1) { m.grow = Math.min(1, m.grow + dt / MOUND_S); }
        if (m.size !== m.sizeT) { m.size += clamp(m.sizeT - m.size, -dt * 0.6, dt * 0.6); if (Math.abs(m.size - m.sizeT) < 0.002) { m.size = m.sizeT; } }
      }
      if (flowerT < 0 && resetT < 0 && allHoles()) {
        flowerT = 0; resetT = 0;
        report(function (A) { A.complete(); });
      }
      if (resetT >= 0) {
        resetT += dt;
        if (resetT >= RESET_S) { newSpots(); build(); }
      }
    }

    function active() {
      if (dig >= 0 || tx !== null || keys.left || keys.right || v !== 0 || face !== faceT || resetT >= 0) { return true; }
      var i;
      var camT = clamp(x - W / 2, 0, WW - W);
      if (cam !== camT || tilt !== tiltT) { return true; }
      for (i = 0; i < spots.length; i++) {
        if (spots[i].cone < 1 || (spots[i].state === 'hole' && (spots[i].hole < 1 || spots[i].mound < 1 || spots[i].holeDelay > 0 || spots[i].mDelay > 0))) { return true; }
      }
      for (i = 0; i < mounds.length; i++) { if (mounds[i].grow < 1 || mounds[i].delay > 0 || mounds[i].size !== mounds[i].sizeT) { return true; } }
      return false;
    }

    function moundT(node, f, size, grow) {
      var px = f * WW;
      node.setAttribute('transform', 'translate(' + px.toFixed(1) + ' ' + (groundY(px) + 2).toFixed(1) + ') scale(' +
        (ew * 0.007 * size * (0.4 + 0.6 * ease(grow))).toFixed(3) + ' ' + (ew * 0.0075 * size * ease(grow)).toFixed(3) + ')');
      node.setAttribute('opacity', grow > 0 ? '1' : '0');
    }

    function paint() {
      if (!N.ex) { return; }
      var i, sp, nodes, px, gyp, ang, a, p;
      N.world.setAttribute('transform', 'translate(' + (-cam).toFixed(1) + ' 0)');
      N.far.setAttribute('transform', 'translate(' + (-cam * 0.5).toFixed(1) + ' 0)');
      for (i = 0; i < spots.length; i++) {
        sp = spots[i]; nodes = N.spots[i]; px = sp.f * WW; gyp = groundY(px);
        nodes.g.setAttribute('transform', 'translate(' + px.toFixed(1) + ' ' + gyp.toFixed(1) + ') scale(' + (ew / 100).toFixed(3) + ')');
        var coneOn = sp.state === 'cone';
        nodes.cone.setAttribute('transform', 'scale(' + ease(sp.cone).toFixed(3) + ')');
        nodes.cone.setAttribute('opacity', coneOn ? '1' : '0');
        var hg = ease(sp.hole);
        nodes.hole.setAttribute('transform', 'scale(' + hg.toFixed(3) + ')');
        nodes.hole.setAttribute('opacity', sp.state === 'hole' && sp.hole > 0 ? '1' : '0');
        // spoil mound lands beside the hole: positioned in the spot's local frame (units)
        var mx = (sp.mf * WW - px) / (ew / 100), my = groundY(sp.mf * WW) - gyp;
        nodes.mp.setAttribute('transform', 'translate(' + mx.toFixed(1) + ' ' + (my / (ew / 100) + 2).toFixed(1) + ') scale(' +
          (0.7 * (0.4 + 0.6 * ease(sp.mound)) * 0.6).toFixed(3) + ' ' + (0.7 * ease(sp.mound) * 0.6).toFixed(3) + ')');
        nodes.mp.setAttribute('opacity', sp.state === 'hole' && sp.mound > 0 ? '1' : '0');
        var fg = ease(sp.flower);
        nodes.fl.setAttribute('transform', 'scale(' + fg.toFixed(3) + ')');
        nodes.fl.setAttribute('opacity', sp.flower > 0 ? '1' : '0');
        nodes.pet.forEach(function (c) { c.setAttribute('fill', FLOWER_COLORS[sp.color]); });
      }
      for (i = 0; i < N.mounds.length; i++) {
        if (i < mounds.length) { moundT(N.mounds[i], mounds[i].f, mounds[i].size, mounds[i].grow); } else { N.mounds[i].setAttribute('opacity', '0'); }
      }
      // excavator
      gyp = groundY(x);
      N.ex.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + gyp.toFixed(1) + ') rotate(' + tilt.toFixed(2) + ') scale(' + (face * s).toFixed(3) + ' ' + s.toFixed(3) + ')');
      ang = armAngles(dig >= 0 ? dig / DIG_S : 0);
      a = armPoints(ang);
      N.boom.setAttribute('x1', a.p0[0]); N.boom.setAttribute('y1', a.p0[1]); N.boom.setAttribute('x2', a.p1[0].toFixed(2)); N.boom.setAttribute('y2', a.p1[1].toFixed(2));
      N.stick.setAttribute('x1', a.p1[0].toFixed(2)); N.stick.setAttribute('y1', a.p1[1].toFixed(2)); N.stick.setAttribute('x2', a.p2[0].toFixed(2)); N.stick.setAttribute('y2', a.p2[1].toFixed(2));
      N.bucket.setAttribute('d', 'M' + a.bucket.map(function (q) { return q[0].toFixed(2) + ' ' + q[1].toFixed(2); }).join('L') + 'Z');
      p = dig >= 0 ? dig / DIG_S : 0;
      var cx = (a.bucket[0][0] + a.bucket[2][0] + a.bucket[3][0]) / 3, cy = (a.bucket[0][1] + a.bucket[2][1] + a.bucket[3][1]) / 3;
      N.load.setAttribute('cx', cx.toFixed(2)); N.load.setAttribute('cy', cy.toFixed(2));
      N.load.setAttribute('opacity', p >= KEYS[2][0] && p < KEYS[4][0] ? '1' : '0');
      // falling sand from the tipped bucket to the drop point
      if (digInfo && p >= KEYS[4][0]) {
        var u = clamp((p - KEYS[4][0]) / (1 - KEYS[4][0]), 0, 1);
        var sx = x + face * a.bucket[2][0] * s, sy = gyp + a.bucket[2][1] * s;
        var ex2 = digInfo.drop, ey = groundY(ex2);
        N.blob.setAttribute('cx', (sx + (ex2 - sx) * u).toFixed(1));
        N.blob.setAttribute('cy', (sy + (ey - sy) * u * u).toFixed(1));
        N.blob.setAttribute('r', (ew * 0.05).toFixed(1));
        N.blob.setAttribute('opacity', u < 1 ? '1' : '0');
      } else { N.blob.setAttribute('opacity', '0'); }
      // keyboard / tap target follows the machine
      var hw = Math.max(56, ew * 1.1), hht = Math.max(56, ew * 0.75);
      hit.style.width = hw + 'px'; hit.style.height = hht + 'px';
      hit.style.transform = 'translate(' + (x - cam - hw / 2).toFixed(1) + 'px,' + (gyp - hht).toFixed(1) + 'px)';
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
      last = now;
      step(dt);
      paint();
      if (!document.hidden && active()) { raf = requestAnimationFrame(frame); }
    }
    function wake() {
      if (raf || document.hidden || !W) { return; }
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { wake(); }
    }

    // input
    function worldX(e) {
      var r = scene.getBoundingClientRect();
      return e.clientX - r.left + cam;
    }
    function onDown(e) {
      if (e.target && e.target.closest && e.target.closest('.ej-hit, .ej-dig')) { return; }
      if (drivePtr !== null) { return; }
      e.preventDefault();
      drivePtr = e.pointerId;
      try { scene.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers */ }
      tx = worldX(e);
      report(function (A) { A.track('interaction', { variant: 'drive' }); });
      wake();
    }
    function onMove(e) {
      if (e.pointerId !== drivePtr) { return; }
      tx = worldX(e);
      wake();
    }
    function onUp(e) {
      if (e.pointerId !== drivePtr) { return; }
      drivePtr = null; tx = null;
      wake();
    }
    scene.addEventListener('pointerdown', onDown);
    scene.addEventListener('pointermove', onMove);
    scene.addEventListener('pointerup', onUp);
    scene.addEventListener('pointercancel', onUp);
    var onDigDown = function (e) { e.preventDefault(); e.stopPropagation(); startDig(); };
    var onDigClick = function (e) { if (e.detail === 0) { startDig(); } };
    var onHitKey = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); startDig(); } };
    hit.addEventListener('pointerdown', onDigDown);
    digBtn.addEventListener('pointerdown', onDigDown);
    digBtn.addEventListener('click', onDigClick);
    hit.addEventListener('keydown', onHitKey);

    function onKeyDown(e) {
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'ArrowRight') {
        e.preventDefault();
        var was = keys.left || keys.right;
        keys[k === 'ArrowLeft' ? 'left' : 'right'] = true;
        if (!was && !e.repeat) { report(function (A) { A.track('interaction', { variant: 'drive' }); }); }
        wake();
      } else if ((k === ' ' || k === 'Enter') && !(e.target && e.target.closest && e.target.closest('button, [role="button"]'))) {
        e.preventDefault();
        if (!e.repeat) { startDig(); }
      }
    }
    function onKeyUp(e) {
      if (e.key === 'ArrowLeft') { keys.left = false; wake(); } else if (e.key === 'ArrowRight') { keys.right = false; wake(); }
    }
    function onBlur() { keys.left = false; keys.right = false; }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', layout);
    document.addEventListener('visibilitychange', onVis);

    newSpots();
    initMounds();
    layout();

    return function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      scene.removeEventListener('pointerdown', onDown);
      scene.removeEventListener('pointermove', onMove);
      scene.removeEventListener('pointerup', onUp);
      scene.removeEventListener('pointercancel', onUp);
      hit.removeEventListener('pointerdown', onDigDown);
      digBtn.removeEventListener('pointerdown', onDigDown);
      digBtn.removeEventListener('click', onDigClick);
      hit.removeEventListener('keydown', onHitKey);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', layout);
      window.removeEventListener('orientationchange', layout);
      document.removeEventListener('visibilitychange', onVis);
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'koparka-jezdna') { a.mount = mount; } });
})();
