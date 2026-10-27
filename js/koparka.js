// Activity "Koparka": a yellow excavator (base, boom, arm and bucket = 3 joints) stands beside a sand pile and a dump truck. The child drags a
// finger anywhere: the bucket follows it smoothly (damped, capped at 60% of the screen width per second) and a two-link inverse kinematics
// solution bends the boom and arm so the pieces always stay connected; the bucket can never leave the reachable working area. Dragging the
// bucket through the sand fills it (the pile visibly sinks); letting go over the truck bed moves the bucket above the bed, tips it and the sand
// falls in. After 3 scoops the truck wobbles and drives off and an empty one drives in (4 s) while the pile refills. A release anywhere else
// simply lowers the bucket to rest. Keyboard: Tab to the bucket, arrows move it, Enter/Space scoops (over the sand) or tips (over the truck).
// One capped-dt rAF loop (every final state is set from JS, never only in a CSS keyframe), paused while hidden and stopped when idle.
// Nothing is scored or stored. Usage metrics: track('interaction', {variant: 'scoop' | 'tip'}); complete() when a truck is full;
// the activity stays open-ended (a new truck drives in by itself).
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var SPEED = 0.6;                 // max bucket speed, screen widths per second
  var FOLLOW = 9;                  // damping rate (1/s)
  var DIG_LEN = 0.17;              // path length through the sand that fills the bucket (scene widths)
  var SCOOP_DROP = 0.12, SCOOPS_PER_TRUCK = 3, KEY_SCOOP_S = 0.6, KEY_ACTIVE_S = 1.5;
  var POUR_S = 0.9, BACK_S = 0.35, GOTO_MAX_S = 1.4, LOAD_S = 0.4;
  var WOBBLE_S = 0.6, OUT_S = 1.3, GAP_S = 0.3, IN_S = 1.5, SETTLE_S = 0.3, REFILL_S = 3.6;
  var BUCKET_EMPTY = 25, BUCKET_DIG = 12, BUCKET_CARRY = -50, BUCKET_POUR = 115;
  var TRUCK_COLORS = ['#e8605a', '#4f9fd8', '#f0b64a'];
  var NPART = 16;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag), k;
    for (k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) { n.setAttribute(k, attrs[k]); } }
    if (parent) { parent.appendChild(n); }
    return n;
  }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'kg';
    var svg = el('svg', { 'class': 'kg-svg', 'aria-hidden': 'true', preserveAspectRatio: 'none' }, root);
    var gSky = el('g', {}, svg), gPile = el('g', {}, svg), gTruck = el('g', {}, svg), gMach = el('g', {}, svg), gPart = el('g', {}, svg);
    var focusBtn = document.createElement('button');
    focusBtn.type = 'button'; focusBtn.className = 'kg-bucket';
    focusBtn.setAttribute('aria-label', 'Koparka. Strzałki ruszają łyżką, Enter lub spacja nabiera piasek albo wysypuje go na ciężarówkę.');
    root.appendChild(focusBtn);
    container.appendChild(root);

    // ---- scene nodes (geometry is filled in layout) ----------------------------------------------------------
    var skyRect = el('rect', { fill: '#cfeaf8' }, gSky), sunC = el('circle', { fill: '#ffe27a' }, gSky);
    var cloud1 = el('ellipse', { fill: '#fff' }, gSky), cloud2 = el('ellipse', { fill: '#fff' }, gSky);
    var groundR = el('rect', { fill: '#cfa97b' }, gSky), grassR = el('rect', { fill: '#a9d98f' }, gSky);
    var pileBack = el('path', { fill: '#e6c98a' }, gPile), pileDots = el('path', { fill: '#d3b273' }, gPile);
    var truck = el('g', {}, gTruck), truckSand = null, truckBody = null, truckGlow = null;
    var mach = { body: null, boomO: el('line', { stroke: '#b97b14', 'stroke-linecap': 'round' }, gMach), boom: el('line', { stroke: '#f4b942', 'stroke-linecap': 'round' }, gMach),
      armO: el('line', { stroke: '#b97b14', 'stroke-linecap': 'round' }, gMach), arm: el('line', { stroke: '#f9cf6a', 'stroke-linecap': 'round' }, gMach),
      jP: el('circle', { fill: '#5b5675' }, gMach), jE: el('circle', { fill: '#5b5675' }, gMach), bucket: el('g', {}, gMach) };
    var bucketCup = el('path', { fill: '#8d8aa3', stroke: '#5b5675', 'stroke-linejoin': 'round' }, mach.bucket);
    var bucketTeeth = el('path', { fill: '#5b5675' }, mach.bucket);
    var bucketSandG = el('g', {}, mach.bucket), bucketSand = el('path', { fill: '#e6c98a', stroke: '#d3b273' }, bucketSandG);
    var jT = el('circle', { fill: '#5b5675' }, mach.bucket);
    var parts = [];
    for (var pi = 0; pi < NPART; pi++) { parts.push({ n: el('circle', { fill: '#e6c98a', visibility: 'hidden' }, gPart), x: 0, y: 0, vx: 0, vy: 0, life: 0 }); }

    // ---- state ----------------------------------------------------------------------------------------------
    var W = 320, H = 568, s = 320, ox = 0, gy = 400, b = 35, L1 = 115, L2 = 96, rmin = 45, rmax = 190;
    var P = { x: 0, y: 0 }, T = { x: 0, y: 0 }, G = { x: 0, y: 0 }, rest = { x: 0, y: 0 };
    var pile = { x: 0, w: 100, h: 45 }, tr = { x: 0, drop: { x: 0, y: 0 }, region: null, bedFloor: 0, bedCx: 0 };
    var ang = { boom: 0, arm: 0, bucket: BUCKET_EMPTY }, E = { x: 0, y: 0 }, wrist = { x: 0, y: 0 };
    var st = { dig: 0, filled: false, pileBase: 1, pileLevel: 1, tipPhase: '', tipT: 0, scoops: 0, load: 0, loadShown: 0, sandK: 0,
      truck: 'wait', truckT: 0, truckOff: 0, truckWob: 0, colorI: 0, userT: 0, lastInput: 'pointer', keyScoop: false };
    var alive = true, raf = 0, last = 0, down = null, spawnT = 0, tPrev = { x: 0, y: 0 };

    // ---- geometry -------------------------------------------------------------------------------------------
    function buildTruck() {
      var u = s, wr = 0.032 * u;
      truck.innerHTML = '';
      truckBody = el('g', {}, truck);
      el('rect', { x: -0.14 * u, y: -0.084 * u, width: 0.28 * u, height: 0.034 * u, rx: 0.008 * u, fill: '#6f6a8a' }, truckBody);
      var cab = el('path', { d: 'M' + (0.035 * u) + ' ' + (-0.084 * u) + 'V' + (-0.15 * u) + 'H' + (0.09 * u) + 'L' + (0.14 * u) + ' ' + (-0.1 * u) + 'V' + (-0.084 * u) + 'Z', fill: TRUCK_COLORS[st.colorI] }, truckBody);
      cab.setAttribute('class', 'kg-cab');
      el('path', { d: 'M' + (0.05 * u) + ' ' + (-0.138 * u) + 'H' + (0.088 * u) + 'L' + (0.118 * u) + ' ' + (-0.105 * u) + 'H' + (0.05 * u) + 'Z', fill: '#dff1fb' }, truckBody);
      el('rect', { x: -0.132 * u, y: -0.132 * u, width: 0.144 * u, height: 0.048 * u, fill: '#8a8099' }, truckBody);
      truckSand = el('path', { fill: '#e6c98a', stroke: '#d3b273', 'stroke-width': 1 }, truckBody);
      el('path', { d: 'M' + (-0.14 * u) + ' ' + (-0.084 * u) + 'V' + (-0.138 * u) + 'H' + (0.02 * u) + 'V' + (-0.084 * u), fill: 'none', stroke: TRUCK_COLORS[st.colorI], 'stroke-width': 0.012 * u, 'stroke-linejoin': 'round' }, truckBody).setAttribute('class', 'kg-bedframe');
      [-0.08, 0.085].forEach(function (cx) {
        el('circle', { cx: cx * u, cy: -wr, r: wr, fill: '#4b4766' }, truckBody);
        el('circle', { cx: cx * u, cy: -wr, r: wr * 0.45, fill: '#c9c4dc' }, truckBody);
      });
      truckGlow = el('rect', { x: -0.15 * u, y: -0.15 * u, width: 0.18 * u, height: 0.08 * u, rx: 0.012 * u, fill: 'none', stroke: '#fff', 'stroke-width': 0.012 * u, opacity: 0 }, truckBody);
      applyTruckColor();
    }
    function applyTruckColor() {
      var c = TRUCK_COLORS[st.colorI % TRUCK_COLORS.length];
      var cab = truck.querySelector('.kg-cab'), fr = truck.querySelector('.kg-bedframe');
      if (cab) { cab.setAttribute('fill', c); }
      if (fr) { fr.setAttribute('stroke', c); }
    }
    function buildMachine() {
      var u = s;
      if (mach.body) { gMach.removeChild(mach.body); }
      var g = el('g', {});
      el('rect', { x: ox + 0.03 * u, y: gy - 0.05 * u, width: 0.25 * u, height: 0.05 * u, rx: 0.025 * u, fill: '#4b4766' }, g);
      el('rect', { x: ox + 0.045 * u, y: gy - 0.04 * u, width: 0.22 * u, height: 0.03 * u, rx: 0.015 * u, fill: '#6f6a8a' }, g);
      [0.07, 0.115, 0.16, 0.205, 0.25].forEach(function (cx) { el('circle', { cx: ox + cx * u, cy: gy - 0.025 * u, r: 0.012 * u, fill: '#c9c4dc' }, g); });
      el('rect', { x: ox + 0.05 * u, y: gy - 0.15 * u, width: 0.2 * u, height: 0.105 * u, rx: 0.02 * u, fill: '#f4b942' }, g);
      el('rect', { x: ox + 0.035 * u, y: gy - 0.12 * u, width: 0.04 * u, height: 0.07 * u, rx: 0.012 * u, fill: '#c98a1f' }, g);
      el('rect', { x: ox + 0.12 * u, y: gy - 0.138 * u, width: 0.09 * u, height: 0.058 * u, rx: 0.01 * u, fill: '#dff1fb', stroke: '#c98a1f', 'stroke-width': 0.006 * u }, g);
      gMach.insertBefore(g, gMach.firstChild);
      mach.body = g;
      var jr = 0.026 * u;
      mach.jP.setAttribute('r', jr); mach.jE.setAttribute('r', jr * 0.85); jT.setAttribute('r', jr * 0.7);
      mach.boomO.setAttribute('stroke-width', 0.064 * u); mach.boom.setAttribute('stroke-width', 0.048 * u);
      mach.armO.setAttribute('stroke-width', 0.048 * u); mach.arm.setAttribute('stroke-width', 0.034 * u);
      bucketCup.setAttribute('d', pathB([[-0.55, -0.5], [-0.7, 0.2], [-0.35, 0.5], [0.5, 0.5], [0.6, -0.35]], true));
      bucketCup.setAttribute('stroke-width', 0.008 * u);
      bucketTeeth.setAttribute('d', pathB([[0.42, 0.5], [0.52, 0.5], [0.5, 0.64], [0.45, 0.58]].concat([[0.31, 0.5], [0.39, 0.5], [0.36, 0.62]]), true));
      bucketSand.setAttribute('d', pathB([[0.42, 0.48], [0.46, -0.28], [0.62, -0.5], [0.95, -0.25], [1.0, 0.15], [0.62, 0.5]], true));
      bucketSand.setAttribute('stroke-width', 0.006 * u);
      bucketSandG.setAttribute('data-ox', '0.5');
    }
    function pathB(pts, close) {
      var d = '', i;
      for (i = 0; i < pts.length; i++) { d += (i ? 'L' : 'M') + (pts[i][0] * b).toFixed(2) + ' ' + (pts[i][1] * b).toFixed(2); }
      return d + (close ? 'Z' : '');
    }
    function layout() {
      var r = root.getBoundingClientRect();
      W = Math.max(280, r.width); H = Math.max(240, r.height);
      s = Math.min(W, H * 1.4); ox = (W - s) / 2;
      gy = Math.min(H * 0.76, H * 0.5 + s * 0.45);
      b = 0.11 * s; L1 = 0.36 * s; L2 = 0.3 * s; rmin = 0.14 * s; rmax = (L1 + L2) * 0.97;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      skyRect.setAttribute('width', W); skyRect.setAttribute('height', H);
      sunC.setAttribute('cx', W * 0.86); sunC.setAttribute('cy', Math.max(70, gy * 0.2)); sunC.setAttribute('r', Math.max(16, s * 0.05));
      cloud1.setAttribute('cx', W * 0.2); cloud1.setAttribute('cy', Math.max(72, gy * 0.18)); cloud1.setAttribute('rx', s * 0.1); cloud1.setAttribute('ry', s * 0.035);
      cloud2.setAttribute('cx', W * 0.55); cloud2.setAttribute('cy', Math.max(96, gy * 0.26)); cloud2.setAttribute('rx', s * 0.07); cloud2.setAttribute('ry', s * 0.026);
      groundR.setAttribute('x', 0); groundR.setAttribute('y', gy); groundR.setAttribute('width', W); groundR.setAttribute('height', H - gy + 2);
      grassR.setAttribute('x', 0); grassR.setAttribute('y', gy); grassR.setAttribute('width', W); grassR.setAttribute('height', Math.max(4, s * 0.012));
      P.x = ox + 0.19 * s; P.y = gy - 0.14 * s;
      rest.x = ox + 0.32 * s; rest.y = gy - 0.06 * s;
      pile.x = ox + 0.47 * s; pile.w = 0.3 * s; pile.h = 0.14 * s;
      tr.x = ox + 0.8 * s; tr.bedCx = tr.x - 0.06 * s; tr.bedFloor = gy - 0.084 * s;
      tr.drop.x = tr.bedCx; tr.drop.y = gy - 0.138 * s - 0.1 * s;
      tr.region = { l: tr.x - 0.14 * s - 0.1 * s, r: tr.x + 0.02 * s + 0.1 * s, t: gy - 0.138 * s - 0.4 * s, b: gy };
      var pr = Math.max(2, s * 0.012);
      parts.forEach(function (p) { p.n.setAttribute('r', pr); });
      buildTruck(); buildMachine();
      if (!T.x && !T.y) { T.x = rest.x; T.y = rest.y; G.x = rest.x; G.y = rest.y; tPrev.x = T.x; tPrev.y = T.y; }
      clampPt(T); clampPt(G);
      render();
    }
    // keep a point inside the working area: scene box, above the ground, in front of the base and within reach of the boom foot
    function clampPt(p) {
      var minX = P.x + 0.1 * s, maxX = ox + 0.985 * s, minY = Math.max(0.08 * H, 0) + b * 0.5, maxY = gy - 0.04 * s, i, dx, dy, d;
      for (i = 0; i < 3; i++) {
        p.x = clamp(p.x, minX, maxX); p.y = clamp(p.y, minY, maxY);
        dx = p.x - P.x; dy = p.y - P.y; d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d > rmax) { p.x = P.x + dx / d * rmax; p.y = P.y + dy / d * rmax; }
        else if (d < rmin) { p.x = P.x + dx / d * rmin; p.y = P.y + dy / d * rmin; }
      }
      p.x = clamp(p.x, minX, maxX); p.y = clamp(p.y, minY, maxY);
      return p;
    }
    function inPile(p) {
      var u = (p.x - pile.x) / (pile.w / 2);
      if (u < -1 || u > 1) { return false; }
      return p.y > gy - pile.h * st.pileLevel * (1 - u * u);
    }
    function overTruck(p) { var r = tr.region; return st.truck === 'wait' && p.x >= r.l && p.x <= r.r && p.y >= r.t && p.y <= r.b; }

    // ---- kinematics -----------------------------------------------------------------------------------------
    function solve() {
      var dx = T.x - P.x, dy = T.y - P.y, d = clamp(Math.sqrt(dx * dx + dy * dy), Math.abs(L1 - L2) + 1, L1 + L2 - 1);
      var a = Math.atan2(dy, dx);
      var al = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
      ang.boom = a - al;                                        // elbow up (y grows downwards)
      E.x = P.x + L1 * Math.cos(ang.boom); E.y = P.y + L1 * Math.sin(ang.boom);
      var ea = Math.atan2(T.y - E.y, T.x - E.x);
      wrist.x = E.x + L2 * Math.cos(ea); wrist.y = E.y + L2 * Math.sin(ea);   // always joined to the elbow
    }
    function lipPoint() {
      var a = ang.bucket * Math.PI / 180, lx = 0.55 * b, ly = 0.05 * b;
      return { x: wrist.x + lx * Math.cos(a) - ly * Math.sin(a), y: wrist.y + lx * Math.sin(a) + ly * Math.cos(a) };
    }

    // ---- rendering ------------------------------------------------------------------------------------------
    function pilePath(level) {
      var h = pile.h * level, x0 = pile.x - pile.w / 2, x1 = pile.x + pile.w / 2;
      return 'M' + x0 + ' ' + gy + 'C' + (pile.x - pile.w * 0.22) + ' ' + (gy - h * 1.05) + ' ' + (pile.x - pile.w * 0.08) + ' ' + (gy - h * 1.3) + ' ' + pile.x + ' ' + (gy - h) +
        'C' + (pile.x + pile.w * 0.08) + ' ' + (gy - h * 1.3) + ' ' + (pile.x + pile.w * 0.22) + ' ' + (gy - h * 1.05) + ' ' + x1 + ' ' + gy + 'Z';
    }
    function render() {
      solve();
      // pile
      pileBack.setAttribute('d', pilePath(st.pileLevel));
      var dd = '', k, q, lvl = st.pileLevel;
      for (k = 0; k < 7; k++) {
        q = -0.34 + k * 0.113; var yy = gy - pile.h * lvl * (0.18 + 0.52 * (1 - Math.abs(q) * 2.6) * ((k % 3) + 1) / 3);
        dd += 'M' + (pile.x + q * pile.w) + ' ' + yy + 'h' + Math.max(2, s * 0.012) + 'v' + Math.max(2, s * 0.008) + 'h-' + Math.max(2, s * 0.012) + 'Z';
      }
      pileDots.setAttribute('d', dd);
      // truck
      var off = st.truckOff, wob = st.truckWob;
      truck.setAttribute('transform', 'translate(' + (tr.x + off).toFixed(1) + ' ' + gy.toFixed(1) + ') rotate(' + wob.toFixed(2) + ')');
      var f = st.loadShown, u = s;
      if (f <= 0.01) { truckSand.setAttribute('visibility', 'hidden'); }
      else {
        var top = 0.048 * u * (0.15 + 0.95 * f);
        var x0 = -0.132 * u, x1 = 0.012 * u, yb = -0.084 * u, xm = (x0 + x1) / 2;
        truckSand.setAttribute('visibility', 'visible');
        truckSand.setAttribute('d', 'M' + x0 + ' ' + yb + 'Q' + (x0 + (xm - x0) * 0.4) + ' ' + (yb - top * 1.25) + ' ' + xm + ' ' + (yb - top) + 'Q' + (xm + (x1 - xm) * 0.6) + ' ' + (yb - top * 1.25) + ' ' + x1 + ' ' + yb + 'Z');
      }
      var glowOn = down && st.filled && st.tipPhase === '' && overTruck(G);
      truckGlow.setAttribute('opacity', glowOn ? '1' : '0');
      // machine
      mach.boomO.setAttribute('x1', P.x); mach.boomO.setAttribute('y1', P.y); mach.boomO.setAttribute('x2', E.x); mach.boomO.setAttribute('y2', E.y);
      mach.boom.setAttribute('x1', P.x); mach.boom.setAttribute('y1', P.y); mach.boom.setAttribute('x2', E.x); mach.boom.setAttribute('y2', E.y);
      mach.armO.setAttribute('x1', E.x); mach.armO.setAttribute('y1', E.y); mach.armO.setAttribute('x2', wrist.x); mach.armO.setAttribute('y2', wrist.y);
      mach.arm.setAttribute('x1', E.x); mach.arm.setAttribute('y1', E.y); mach.arm.setAttribute('x2', wrist.x); mach.arm.setAttribute('y2', wrist.y);
      mach.jP.setAttribute('cx', P.x); mach.jP.setAttribute('cy', P.y); mach.jE.setAttribute('cx', E.x); mach.jE.setAttribute('cy', E.y);
      mach.bucket.setAttribute('transform', 'translate(' + wrist.x.toFixed(1) + ' ' + wrist.y.toFixed(1) + ') rotate(' + ang.bucket.toFixed(1) + ')');
      var k2 = clamp(st.sandK, 0, 1);
      if (k2 <= 0.01) { bucketSandG.setAttribute('visibility', 'hidden'); }
      else {
        bucketSandG.setAttribute('visibility', 'visible');
        bucketSandG.setAttribute('transform', 'translate(' + (0.5 * b) + ' ' + (0.05 * b) + ') scale(' + (0.35 + 0.65 * k2).toFixed(3) + ') translate(' + (-0.5 * b) + ' ' + (-0.05 * b) + ')');
      }
      // particles
      parts.forEach(function (p) {
        if (p.life > 0) { p.n.setAttribute('visibility', 'visible'); p.n.setAttribute('cx', p.x.toFixed(1)); p.n.setAttribute('cy', p.y.toFixed(1)); }
        else { p.n.setAttribute('visibility', 'hidden'); }
      });
      // keyboard focus ring follows the bucket
      var fs = Math.max(56, b * 1.4);
      focusBtn.style.width = focusBtn.style.height = fs + 'px';
      focusBtn.style.transform = 'translate(' + (wrist.x - fs / 2).toFixed(1) + 'px,' + (wrist.y - fs / 2).toFixed(1) + 'px)';
    }

    // ---- behaviour ------------------------------------------------------------------------------------------
    function spawn(x, y) {
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].life <= 0) {
          parts[i].x = x + (Math.random() - 0.5) * b * 0.3; parts[i].y = y; parts[i].vx = (Math.random() - 0.5) * s * 0.03; parts[i].vy = s * 0.05; parts[i].life = 1; return;
        }
      }
    }
    function startTip() {
      if (!st.filled || st.tipPhase || st.truck !== 'wait') { return; }
      st.tipPhase = 'goto'; st.tipT = 0; G.x = tr.drop.x; G.y = tr.drop.y; clampPt(G);
      report(function (A) { A.track('interaction', { variant: 'tip' }); });
    }
    function finishScoop() {
      st.filled = true; st.dig = 1; st.pileBase = Math.max(0.3, st.pileBase - SCOOP_DROP); st.pileLevel = st.pileBase; st.keyScoop = false;
      report(function (A) { A.track('interaction', { variant: 'scoop' }); });
    }
    function afterTip() {
      st.tipPhase = ''; st.filled = false; st.dig = 0; st.sandK = 0; st.scoops++;
      if (st.lastInput === 'pointer' && !down) { G.x = rest.x; G.y = rest.y; clampPt(G); }
      if (st.scoops >= SCOOPS_PER_TRUCK) {
        st.scoops = 0; st.truck = 'wobble'; st.truckT = 0;
        report(function (A) { A.complete(); });
      }
    }
    function step(dt) {
      var i, dx, dy, d, mv, vmax = SPEED * W * dt, prevX = T.x, prevY = T.y;
      st.userT += dt;
      // bucket glide: damped, speed capped
      if (st.tipPhase !== 'pour' && st.tipPhase !== 'back') {
        dx = (G.x - T.x) * (1 - Math.exp(-FOLLOW * dt)); dy = (G.y - T.y) * (1 - Math.exp(-FOLLOW * dt));
        mv = Math.sqrt(dx * dx + dy * dy);
        if (mv > vmax) { dx *= vmax / mv; dy *= vmax / mv; }
        T.x += dx; T.y += dy; clampPt(T);
      }
      var travelled = Math.sqrt((T.x - prevX) * (T.x - prevX) + (T.y - prevY) * (T.y - prevY));
      var control = !!down || (st.userT < KEY_ACTIVE_S && st.lastInput === 'key');
      // digging
      var inP = inPile(T), tgtAng = st.filled ? BUCKET_CARRY : (inP && control ? BUCKET_DIG : BUCKET_EMPTY);
      if (!st.filled && !st.tipPhase) {
        if (st.keyScoop && inP) { st.dig = Math.min(1, st.dig + dt / KEY_SCOOP_S); }
        else if (inP && control && !st.keyScoop) { st.dig = Math.min(1, st.dig + travelled / (DIG_LEN * s)); }
        else if (st.keyScoop && !inP) { st.keyScoop = false; }
        st.pileLevel = st.pileBase - SCOOP_DROP * st.dig;
        if (st.dig >= 1) { finishScoop(); }
      }
      if (!st.tipPhase) { st.sandK = st.filled ? 1 : st.dig; }
      // tip sequence
      if (st.tipPhase === 'goto') {
        st.tipT += dt; tgtAng = BUCKET_CARRY;
        dx = tr.drop.x - T.x; dy = tr.drop.y - T.y;
        if ((dx * dx + dy * dy < 16 && ang.bucket < BUCKET_CARRY + 8) || st.tipT > GOTO_MAX_S) { st.tipPhase = 'pour'; st.tipT = 0; spawnT = 0; }
      } else if (st.tipPhase === 'pour') {
        st.tipT += dt;
        var u = clamp(st.tipT / POUR_S, 0, 1);
        ang.bucket = BUCKET_CARRY + (BUCKET_POUR - BUCKET_CARRY) * ease(Math.min(1, st.tipT / 0.4));
        st.sandK = 1 - ease(clamp((st.tipT - 0.2) / 0.6, 0, 1));
        if (st.tipT > 0.25 && st.tipT < 0.8) {
          spawnT -= dt;
          while (spawnT <= 0) { var lp = lipPoint(); spawn(lp.x, lp.y); spawnT += 0.045; }
        }
        if (u >= 1) { st.tipPhase = 'back'; st.tipT = 0; st.sandK = 0; st.load++; }
      } else if (st.tipPhase === 'back') {
        st.tipT += dt;
        ang.bucket = BUCKET_POUR + (BUCKET_EMPTY - BUCKET_POUR) * ease(st.tipT / BACK_S);
        if (st.tipT >= BACK_S) { ang.bucket = BUCKET_EMPTY; afterTip(); }
      }
      if (st.tipPhase !== 'pour' && st.tipPhase !== 'back') { ang.bucket += (tgtAng - ang.bucket) * (1 - Math.exp(-8 * dt)); }
      // sand in the truck grows towards the loaded fraction
      var tgtLoad = st.load / SCOOPS_PER_TRUCK;
      if (st.loadShown < tgtLoad) { st.loadShown = Math.min(tgtLoad, st.loadShown + dt / (LOAD_S * SCOOPS_PER_TRUCK)); }
      // falling sand
      for (i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.life > 0) {
          p.vy += s * 1.6 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.y >= tr.bedFloor - 0.02 * s * st.loadShown || p.y > gy) { p.life = 0; }
        }
      }
      // truck swap: wobble, drive off, new empty truck drives in, pile refills
      if (st.truck !== 'wait') {
        st.truckT += dt;
        var t = st.truckT, offAway = W - (tr.x - 0.14 * s) + 12;
        if (st.truck === 'wobble') {
          st.truckWob = 2.6 * Math.sin(t / WOBBLE_S * Math.PI * 6) * (1 - t / WOBBLE_S);
          if (t >= WOBBLE_S) { st.truck = 'out'; st.truckT = 0; st.truckWob = 0; }
        } else if (st.truck === 'out') {
          var o = clamp(t / OUT_S, 0, 1); st.truckOff = offAway * o * o;
          if (t >= OUT_S) { st.truck = 'gap'; st.truckT = 0; st.truckOff = offAway; st.load = 0; st.loadShown = 0; st.colorI++; applyTruckColor(); }
        } else if (st.truck === 'gap') {
          if (t >= GAP_S) { st.truck = 'in'; st.truckT = 0; }
        } else if (st.truck === 'in') {
          var e = ease(clamp(t / IN_S, 0, 1)); st.truckOff = offAway * (1 - e);
          if (t >= IN_S) { st.truck = 'settle'; st.truckT = 0; st.truckOff = 0; }
        } else if (st.truck === 'settle') {
          st.truckWob = -1.4 * Math.sin(t / SETTLE_S * Math.PI * 2) * (1 - t / SETTLE_S);
          if (t >= SETTLE_S) { st.truck = 'wait'; st.truckWob = 0; st.truckT = 0; }
        }
        st.pileBase = Math.min(1, st.pileBase + SCOOP_DROP * SCOOPS_PER_TRUCK * dt / REFILL_S);
        st.pileLevel = st.pileBase - SCOOP_DROP * st.dig;
      }
      tPrev.x = T.x; tPrev.y = T.y;
    }
    function busy() {
      var dx = G.x - T.x, dy = G.y - T.y;
      if (dx * dx + dy * dy > 0.25 || st.tipPhase || st.truck !== 'wait' || st.keyScoop) { return true; }
      for (var i = 0; i < parts.length; i++) { if (parts[i].life > 0) { return true; } }
      if (st.loadShown < st.load / SCOOPS_PER_TRUCK - 1e-4) { return true; }
      return Math.abs(ang.bucket - (st.filled ? BUCKET_CARRY : BUCKET_EMPTY)) > 0.3;
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      step(dt); render();
      if (alive && !document.hidden && busy() && !raf) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden || !alive) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); } }
    function onResize() { layout(); start(); }

    // ---- input ----------------------------------------------------------------------------------------------
    function localPt(e) { var r = root.getBoundingClientRect(); return { x: clamp(e.clientX - r.left, 0, W), y: clamp(e.clientY - r.top, 0, H) }; }
    function aim(p) {
      if (st.tipPhase) { return; }
      var q = { x: p.x, y: p.y };
      clampPt(q); G.x = q.x; G.y = q.y;
    }
    function onDown(e) {
      if (down) { return; }
      down = { id: e.pointerId }; st.lastInput = 'pointer'; st.userT = 0;
      try { root.setPointerCapture(e.pointerId); } catch (x) { /* unsupported */ }
      aim(localPt(e)); start(); e.preventDefault();
    }
    function onMove(e) {
      if (!down || e.pointerId !== down.id) { return; }
      aim(localPt(e)); start();
    }
    function onUp(e) {
      if (!down || e.pointerId !== down.id) { return; }
      down = null;
      try { root.releasePointerCapture(e.pointerId); } catch (x) { /* already released */ }
      if (st.tipPhase) { start(); return; }
      if (st.filled && overTruck(G)) { startTip(); }
      else { G.x = rest.x; G.y = rest.y; clampPt(G); }
      start();
    }
    function onCancel(e) {
      if (!down || e.pointerId !== down.id) { return; }
      down = null;
      if (!st.tipPhase) { G.x = rest.x; G.y = rest.y; clampPt(G); }
      start();
    }
    function onKey(e) {
      var k = e.key, stp = 0.035 * s, moved = true;
      if (k === 'ArrowLeft') { aim({ x: G.x - stp, y: G.y }); }
      else if (k === 'ArrowRight') { aim({ x: G.x + stp, y: G.y }); }
      else if (k === 'ArrowUp') { aim({ x: G.x, y: G.y - stp }); }
      else if (k === 'ArrowDown') { aim({ x: G.x, y: G.y + stp }); }
      else if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
        moved = false;
        if (st.filled && !st.tipPhase) { if (overTruck(T) || overTruck(G)) { startTip(); } }
        else if (!st.filled && !st.tipPhase && inPile(T)) { st.keyScoop = true; }
      } else { return; }
      st.lastInput = 'key'; st.userT = 0; e.preventDefault(); start();
    }
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onCancel);
    focusBtn.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    layout();
    start();

    return function cleanup() {
      alive = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'koparka') { a.mount = mount; } });
})();
