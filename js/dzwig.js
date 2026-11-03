// Activity "Dźwig": a tower crane. A finger drag moves the trolley along the jib (left/right) and lowers or raises the hook (up/down), both damped.
// When the hook touches a free brick it hooks it by itself and lifts it, swinging gently (max 8 degrees, damped to rest in about 1 s). Lifting the
// finger over the build area drops the brick into the nearest free, supported slot of a 3-2-1 stack (snaps in 0.4 s); lifting it anywhere else
// lowers the brick gently to the ground, where it can be hooked again. Bricks never topple. With all 6 placed the stack gets a roof and a soft glow
// (completion); after 5 s the bricks glide back to the pile. Nothing can fail and nothing is scored or stored.
// Keyboard: arrows move the trolley and hook, Space grabs the nearest brick within reach or releases the held one.
// One capped-dt rAF loop holds every state (nothing lives only in CSS keyframes), pauses while hidden and stops when idle.
// Usage metrics: track('interaction', {variant: hook|place}); complete() when the sixth brick is placed; open-ended.
(function () {
  var SNAP_S = 0.4, HOOK_S = 0.15, DONE_S = 5.0, BACK_S = 0.8, ROOF_S = 0.5, MAX_SWING = 8, KEY_V = 340;
  var SWING_K = 40, SWING_C = 10, SWING_COUP = 0.05;
  var COLORS = [
    { fill: '#e5586b', edge: '#a8384a', mark: 'lines' },
    { fill: '#4f8fe0', edge: '#2f5fa6', mark: 'dots' },
    { fill: '#f4c24e', edge: '#c9962a', mark: 'diag' }
  ];
  var MARKS = {
    lines: '<path d="M-24 -8H24M-24 10H24M-4 -8V10M12 10V28" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linecap="round"/>',
    dots: '<circle cx="-16" cy="-6" r="4" fill="rgba(255,255,255,.6)"/><circle cx="0" cy="8" r="4" fill="rgba(255,255,255,.6)"/><circle cx="16" cy="-6" r="4" fill="rgba(255,255,255,.6)"/>',
    diag: '<path d="M-22 14L-6 -14M-4 14L12 -14M14 14L28 -10" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="4" stroke-linecap="round"/>'
  };
  var NS = 'http://www.w3.org/2000/svg';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'dg-root';
    root.tabIndex = -1;
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', 'Dźwig. Strzałki przesuwają wózek i hak, spacja chwyta lub puszcza klocek.');
    root.innerHTML = '<svg class="dg-scene" aria-hidden="true">' +
      '<defs><radialGradient id="dg-glowg"><stop offset="0" stop-color="#fff3b0" stop-opacity=".95"/><stop offset="1" stop-color="#fff3b0" stop-opacity="0"/></radialGradient></defs>' +
      '<rect class="dg-ground" x="0" width="2000" height="400" fill="#e6c98a"/>' +
      '<rect class="dg-grass" x="0" width="2000" height="8" fill="#9ccf7e"/>' +
      '<g class="dg-mast"></g>' +
      '<ellipse class="dg-glow" fill="url(#dg-glowg)" opacity="0"/>' +
      '<g class="dg-slots"></g>' +
      '<g class="dg-jib"></g>' +
      '<g class="dg-bricks"></g>' +
      '<g class="dg-roof" opacity="0"><polygon class="dg-roofp" fill="#c0563f" stroke="#8c3a28" stroke-width="3" stroke-linejoin="round"/><rect class="dg-chim" fill="#8d89a3" stroke="#5b5675" stroke-width="2"/></g>' +
      '<line class="dg-cable" stroke="#3d3a4f" stroke-width="3"/>' +
      '<g class="dg-trolley"><rect x="-14" y="-4" width="28" height="12" rx="3" fill="#5b5675"/></g>' +
      '<g class="dg-hook"><rect x="-9" y="-2" width="18" height="10" rx="3" fill="#e5586b" stroke="#a8384a" stroke-width="2"/><path d="M0 8V13A6 6 0 1 1 -6 19" fill="none" stroke="#3d3a4f" stroke-width="4" stroke-linecap="round"/></g>' +
      '</svg>';
    container.appendChild(root);
    var q = function (c) { return root.querySelector('.' + c); };
    var svg = q('dg-scene'), gGround = q('dg-ground'), gGrass = q('dg-grass'), gMast = q('dg-mast'), gJib = q('dg-jib'), gSlots = q('dg-slots'), gBricks = q('dg-bricks');
    var gGlow = q('dg-glow'), gRoof = q('dg-roof'), roofP = q('dg-roofp'), chim = q('dg-chim'), cable = q('dg-cable'), trolleyG = q('dg-trolley'), hookG = q('dg-hook');

    var bricks = [0, 1, 2, 3, 4, 5].map(function (i) {
      var c = COLORS[i % 3], g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'dg-brick');
      g.innerHTML = '<rect x="-32" y="-28" width="64" height="56" rx="8" fill="' + c.fill + '" stroke="' + c.edge + '" stroke-width="3"/>' +
        '<rect x="-28" y="-24" width="56" height="8" rx="4" fill="rgba(255,255,255,.3)"/>' + MARKS[c.mark];
      gBricks.appendChild(g);
      return { i: i, node: g, x: 0, y: 0, rot: 0, state: 'pile', hx: 0, hy: 0, t: 0, dur: 1, x0: 0, y0: 0, r0: 0, tx: 0, ty: 0, slot: -1, armed: true, h: 0, fx: 0 };
    });

    var W = 320, H = 480, bw = 56, bh = 56, ground = 460, jibY = 44, mastX = 20, tmin = 40, tmax = 300, lmin = 30, lmax = 300;
    var slots = [], bx0 = 0;
    var P = { x: 160, L: 120, th: 0, w: 0, v: 0, jr: 0, hpx: 160, hpy: 164, phase: 'idle', doneT: 0, roofA: 0, bobT: 0, held: null, cy: 44 };
    var T = { x: 160, L: 120 };
    var keys = {}, drag = null, raf = 0, last = 0, alive = true, placed = 0;

    function pileHome(b) {
      var col = b.i % 2, row = Math.floor(b.i / 2);
      return [8 + bw / 2 + col * (bw + 4), ground - bh / 2 - row * bh];
    }
    // resting spot of a loose brick; a lowering brick already counts at its landing point
    function spot(o) {
      if (o.state === 'pile' || o.state === 'ground') { return [o.x, o.y]; }
      return o.state === 'lower' ? [o.tx, o.ty] : null;
    }
    function landY(b, x) {
      var y = ground - bh / 2;
      bricks.forEach(function (o) {
        var p = o !== b && spot(o);
        if (p && Math.abs(p[0] - x) < bw * 0.9) { y = Math.min(y, p[1] - bh); }
      });
      return y;
    }
    function freeTop(b) {
      if (b.state !== 'pile' && b.state !== 'ground') { return false; }
      return !bricks.some(function (o) {
        var p = o !== b && spot(o);
        return p && Math.abs(p[0] - b.x) < bw * 0.9 && p[1] < b.y - bh * 0.5;
      });
    }

    function layout() {
      var r = container.getBoundingClientRect();
      W = Math.max(280, r.width || window.innerWidth); H = Math.max(240, r.height || window.innerHeight);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      bw = clamp((W - 36) / 5, 56, 90);
      bh = Math.max(56, Math.min(bw * 0.8, (H - 120) / 4));
      ground = H - 12; jibY = 44; mastX = 20;
      var pileR = 8 + 2 * bw + 4, bW = 3 * bw + 6;
      bx0 = pileR + 14 + Math.max(0, (W - 8 - pileR - 14 - bW) / 2);
      slots = [];
      for (var i = 0; i < 3; i++) { slots.push([bx0 + bw / 2 + i * (bw + 3), ground - bh / 2]); }
      for (i = 0; i < 2; i++) { slots.push([(slots[i][0] + slots[i + 1][0]) / 2, ground - bh * 1.5]); }
      slots.push([(slots[3][0] + slots[4][0]) / 2, ground - bh * 2.5]);
      tmin = 44; tmax = W - 20; lmin = 28; lmax = ground - jibY - 8 - bh - 6;
      gGround.setAttribute('y', ground - 4); gGrass.setAttribute('y', ground - 4);
      gGround.setAttribute('height', Math.max(60, H - ground + 8));
      gMast.innerHTML = '<rect x="' + (mastX - 10) + '" y="' + jibY + '" width="20" height="' + (ground - jibY) + '" fill="#f4c24e" stroke="#c9962a" stroke-width="3"/>' +
        '<path d="M' + (mastX - 10) + ' ' + jibY + 'L' + (mastX + 10) + ' ' + (jibY + 30) + 'M' + (mastX + 10) + ' ' + jibY + 'L' + (mastX - 10) + ' ' + (jibY + 30) + '" stroke="#c9962a" stroke-width="2"/>' +
        '<rect x="' + (mastX - 20) + '" y="' + (ground - 14) + '" width="40" height="14" rx="3" fill="#8d89a3" stroke="#5b5675" stroke-width="3"/>';
      gJib.innerHTML = '<rect x="' + (mastX - 20) + '" y="' + (jibY - 2) + '" width="' + (W - mastX + 14) + '" height="12" rx="3" fill="#f4c24e" stroke="#c9962a" stroke-width="3"/>' +
        '<path d="M' + (mastX + 10) + ' ' + jibY + 'L' + (W - 20) + ' ' + jibY + '" stroke="#c9962a" stroke-width="2"/>' +
        '<rect x="' + (mastX - 20) + '" y="' + (jibY + 10) + '" width="16" height="22" rx="3" fill="#5b5675"/>' +
        '<rect x="' + (mastX - 8) + '" y="' + (jibY - 22) + '" width="22" height="20" rx="4" fill="#d9eefb" stroke="#5b5675" stroke-width="3"/>';
      gSlots.innerHTML = '';
      slots.forEach(function (s) {
        var rc = document.createElementNS(NS, 'rect');
        rc.setAttribute('x', (s[0] - bw / 2).toFixed(1)); rc.setAttribute('y', (s[1] - bh / 2).toFixed(1));
        rc.setAttribute('width', bw.toFixed(1)); rc.setAttribute('height', bh.toFixed(1)); rc.setAttribute('rx', '8');
        rc.setAttribute('fill', 'rgba(255,255,255,.28)'); rc.setAttribute('stroke', 'rgba(91,86,117,.35)');
        rc.setAttribute('stroke-width', '2'); rc.setAttribute('stroke-dasharray', '6 6');
        gSlots.appendChild(rc);
      });
      T.x = clamp(T.x, tmin, tmax); T.L = clamp(T.L, lmin, lmax); P.x = clamp(P.x, tmin, tmax); P.L = clamp(P.L, lmin, lmax);
      // settle bricks: pile, placed and moving ones snap to their spots; loose ones keep their horizontal fraction
      var loose = bricks.filter(function (b) { return b.state === 'ground'; }).sort(function (a, b) { return b.y - a.y; });
      bricks.forEach(function (b) {
        if (b.state === 'pile') { var h = pileHome(b); b.x = h[0]; b.y = h[1]; b.rot = 0; }
        else if (b.state === 'placed') { b.x = slots[b.slot][0]; b.y = slots[b.slot][1]; b.rot = 0; }
        else if (b.state === 'snap' || b.state === 'return') { b.tx = b.state === 'snap' ? slots[b.slot][0] : pileHome(b)[0]; b.ty = b.state === 'snap' ? slots[b.slot][1] : pileHome(b)[1]; }
        else if (b.state === 'lower') { b.x = clamp(b.fx * W, bw / 2 + 2, W - bw / 2 - 2); b.x0 = b.x; b.ty = landY(b, b.x); }
      });
      loose.forEach(function (b) { b.x = clamp(b.fx * W, bw / 2 + 2, W - bw / 2 - 2); b.y = ground - bh / 2; b.y = landY(b, b.x); b.rot = 0; });
      bricks.forEach(function (b) { b.node.setAttribute('data-sc', (bw / 64).toFixed(3) + ' ' + (bh / 56).toFixed(3)); });
      render();
    }

    function hookPos() {
      var rad = P.th * Math.PI / 180;
      var cy = jibY + 4 + (P.x - mastX) * Math.sin(P.jr * Math.PI / 180);
      P.cy = cy;
      P.hpx = P.x + P.L * Math.sin(rad); P.hpy = cy + 8 + P.L * Math.cos(rad);
      return rad;
    }

    function render() {
      var rad = hookPos();
      gJib.setAttribute('transform', 'rotate(' + P.jr.toFixed(2) + ' ' + mastX + ' ' + (jibY + 4) + ')');
      trolleyG.setAttribute('transform', 'translate(' + P.x.toFixed(1) + ' ' + P.cy.toFixed(1) + ')');
      cable.setAttribute('x1', P.x.toFixed(1)); cable.setAttribute('y1', (P.cy + 6).toFixed(1));
      cable.setAttribute('x2', P.hpx.toFixed(1)); cable.setAttribute('y2', P.hpy.toFixed(1));
      hookG.setAttribute('transform', 'translate(' + P.hpx.toFixed(1) + ' ' + P.hpy.toFixed(1) + ') rotate(' + (-P.th).toFixed(2) + ')');
      bricks.forEach(function (b) {
        if (b.state === 'held') {
          var hx = P.hpx + Math.sin(rad) * bh / 2, hy = P.hpy + Math.cos(rad) * bh / 2, u = ease(b.h);
          b.x = b.hx + (hx - b.hx) * u; b.y = b.hy + (hy - b.hy) * u; b.rot = b.r0 + (-P.th - b.r0) * u;
        }
        var sc = b.node.getAttribute('data-sc').split(' ');
        b.node.setAttribute('transform', 'translate(' + b.x.toFixed(1) + ' ' + b.y.toFixed(1) + ') rotate(' + b.rot.toFixed(2) + ') scale(' + sc[0] + ' ' + sc[1] + ')');
      });
      // roof and glow over the finished stack
      var top = slots[5] || [0, 0], roofA = P.roofA;
      gRoof.setAttribute('opacity', roofA.toFixed(3));
      var ty = top[1] - bh / 2, rw = bw * 0.78, rh = bh * 0.9;
      roofP.setAttribute('points', (top[0] - rw).toFixed(1) + ',' + (ty + 2).toFixed(1) + ' ' + top[0].toFixed(1) + ',' + (ty - rh).toFixed(1) + ' ' + (top[0] + rw).toFixed(1) + ',' + (ty + 2).toFixed(1));
      chim.setAttribute('x', (top[0] + rw * 0.35).toFixed(1)); chim.setAttribute('y', (ty - rh * 0.7).toFixed(1));
      chim.setAttribute('width', (bw * 0.2).toFixed(1)); chim.setAttribute('height', (rh * 0.5).toFixed(1));
      gGlow.setAttribute('cx', top[0].toFixed(1)); gGlow.setAttribute('cy', (ground - bh * 1.4).toFixed(1));
      gGlow.setAttribute('rx', (bw * 2.4).toFixed(1)); gGlow.setAttribute('ry', (bh * 2.4).toFixed(1));
      gGlow.setAttribute('opacity', (roofA * (0.75 + 0.25 * Math.sin(P.bobT * 3))).toFixed(3));
    }

    function overBuild(x) { return x > bx0 - bw / 2 && x < bx0 + 3 * bw + 6 + bw / 2; }
    function nearestSlot(b) {
      var occ = {};
      bricks.forEach(function (o) { if (o.slot >= 0 && (o.state === 'placed' || o.state === 'snap')) { occ[o.slot] = true; } });
      var ok = function (s) {
        if (occ[s]) { return false; }
        if (s < 3) { return true; }
        if (s < 5) { return occ[s - 3] && occ[s - 2]; }
        return occ[3] && occ[4];
      };
      var best = -1, bd = 1e9;
      for (var s = 0; s < 6; s++) {
        if (!ok(s)) { continue; }
        var d = Math.hypot(slots[s][0] - b.x, slots[s][1] - b.y);
        if (d < bd) { bd = d; best = s; }
      }
      return best;
    }
    function grab(b) {
      P.held = b; b.state = 'held'; b.h = 0; b.hx = b.x; b.hy = b.y; b.r0 = b.rot; b.slot = -1;
      report(function (A) { A.track('interaction', { variant: 'hook' }); });
    }
    function release() {
      var b = P.held; if (!b) { return false; }
      P.held = null; b.armed = false; b.t = 0; b.x0 = b.x; b.y0 = b.y; b.r0 = b.rot;
      var s = overBuild(b.x) ? nearestSlot(b) : -1;
      if (s >= 0) { b.state = 'snap'; b.slot = s; b.tx = slots[s][0]; b.ty = slots[s][1]; b.dur = SNAP_S; }
      else {
        b.x0 = clamp(b.x, bw / 2 + 2, W - bw / 2 - 2); b.fx = b.x0 / W;
        b.state = 'lower'; b.tx = b.x0; b.ty = landY(b, b.x0); b.dur = clamp(Math.abs(b.ty - b.y) / 220, 0.3, 1.2);
      }
      return true;
    }
    function reach(b, px, py, slack) {
      var dx = Math.abs(px - b.x), dy = py - (b.y - bh / 2);
      return dx <= bw / 2 + slack && dy >= -8 - slack && dy <= bh * 0.7 + slack;
    }
    function tryHook(px0, py0) {
      if (P.held || P.phase !== 'idle') { return; }
      for (var k = 1; k <= 3; k++) {
        var px = px0 + (P.hpx - px0) * k / 3, py = py0 + (P.hpy - py0) * k / 3;
        for (var i = 0; i < bricks.length; i++) {
          var b = bricks[i];
          if (b.armed && freeTop(b) && reach(b, px, py, 0)) { grab(b); return; }
        }
      }
    }
    function grabNearest() {
      if (P.held || P.phase !== 'idle') { return; }
      var best = null, bd = 1e9;
      bricks.forEach(function (b) {
        if (!freeTop(b)) { return; }
        var d = Math.hypot(P.hpx - b.x, P.hpy - (b.y - bh / 2));
        if (d < bd && d < bw * 1.3) { bd = d; best = b; }
      });
      if (best) { grab(best); }
    }

    function step(dt) {
      P.bobT += dt;
      var kx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), ky = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
      if (kx || ky) { T.x = clamp(T.x + kx * KEY_V * dt, tmin, tmax); T.L = clamp(T.L + ky * KEY_V * dt, lmin, lmax); }
      var ppx = P.hpx, ppy = P.hpy, k = Math.min(1, dt * 9);
      var nx = P.x + (T.x - P.x) * k;
      P.L += (T.L - P.L) * k;
      var vNew = (nx - P.x) / dt; P.x = nx;
      var pv = P.v; P.v += (vNew - P.v) * Math.min(1, dt * 10);
      var ax = clamp((P.v - pv) / dt, -4000, 4000);
      P.w += (-SWING_K * P.th - SWING_C * P.w - SWING_COUP * ax) * dt;
      P.th += P.w * dt;
      if (P.th > MAX_SWING) { P.th = MAX_SWING; if (P.w > 0) { P.w = 0; } }
      if (P.th < -MAX_SWING) { P.th = -MAX_SWING; if (P.w < 0) { P.w = 0; } }
      if (Math.abs(P.th) < 0.03 && Math.abs(P.w) < 0.2 && Math.abs(ax) < 60) { P.th = 0; P.w = 0; }
      if (Math.abs(T.x - P.x) < 0.2) { P.x = T.x; P.v = 0; }
      if (Math.abs(T.L - P.L) < 0.2) { P.L = T.L; }
      var jt = clamp(P.v / 600, -1, 1) * 0.8;
      P.jr += (jt - P.jr) * Math.min(1, dt * 5);
      if (Math.abs(P.jr) < 0.01 && Math.abs(jt) < 0.01) { P.jr = 0; }
      hookPos();
      tryHook(ppx, ppy);
      // bricks
      bricks.forEach(function (b) {
        if (b.state === 'held') { b.h = Math.min(1, b.h + dt / HOOK_S); }
        else if (b.state === 'lower' || b.state === 'snap' || b.state === 'return') {
          b.t += dt; var u = ease(b.t / b.dur);
          b.x = b.x0 + (b.tx - b.x0) * u; b.y = b.y0 + (b.ty - b.y0) * u; b.rot = b.r0 * (1 - u);
          if (b.t >= b.dur) {
            b.x = b.tx; b.y = b.ty; b.rot = 0;
            if (b.state === 'lower') { b.state = 'ground'; }
            else if (b.state === 'snap') {
              b.state = 'placed'; placed++;
              report(function (A) { A.track('interaction', { variant: 'place' }); });
              if (placed === 6) { P.phase = 'done'; P.doneT = 0; report(function (A) { A.complete(); }); }
            } else { b.state = 'pile'; b.armed = true; b.slot = -1; }
          }
        }
        if (!b.armed && Math.hypot(P.hpx - b.x, P.hpy - (b.y - bh / 2)) > bw * 0.8) { b.armed = true; }
      });
      if (P.phase === 'done') {
        P.doneT += dt;
        P.roofA = ease(P.doneT / ROOF_S);
        if (P.doneT >= DONE_S) {
          P.phase = 'back'; P.doneT = 0; placed = 0;
          bricks.forEach(function (b) { var h = pileHome(b); b.state = 'return'; b.t = 0; b.dur = BACK_S; b.x0 = b.x; b.y0 = b.y; b.r0 = 0; b.tx = h[0]; b.ty = h[1]; });
        }
      } else if (P.phase === 'back') {
        P.doneT += dt;
        P.roofA = 1 - ease(P.doneT / ROOF_S);
        if (bricks.every(function (b) { return b.state === 'pile'; }) && P.doneT >= ROOF_S) { P.phase = 'idle'; P.roofA = 0; }
      }
    }
    function busy() {
      if (P.phase !== 'idle' || P.th !== 0 || P.w !== 0 || P.x !== T.x || P.L !== T.L || P.jr !== 0 || keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown) { return true; }
      return bricks.some(function (b) { return b.state === 'lower' || b.state === 'snap' || b.state === 'return' || (b.state === 'held' && b.h < 1); });
    }
    function frame(now) {
      raf = 0;
      var dt = clamp((now - last) / 1000, 0.001, 0.05); last = now;
      step(dt); render();
      if (alive && !document.hidden && busy() && !raf) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden || !alive) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); } }
    function onResize() { layout(); start(); }

    root.addEventListener('pointerdown', function (e) {
      if (drag) { return; }
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      try { root.setPointerCapture(e.pointerId); } catch (x) { /* unsupported */ }
      e.preventDefault();
    });
    root.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) { return; }
      T.x = clamp(T.x + e.clientX - drag.x, tmin, tmax); T.L = clamp(T.L + e.clientY - drag.y, lmin, lmax);
      drag.x = e.clientX; drag.y = e.clientY;
      start();
    });
    function up(e) {
      if (!drag || e.pointerId !== drag.id) { return; }
      drag = null;
      try { root.releasePointerCapture(e.pointerId); } catch (x) { /* already released */ }
      if (release()) { render(); start(); }
    }
    root.addEventListener('pointerup', up);
    root.addEventListener('pointercancel', up);

    function onKey(e) {
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
        keys[k] = true; e.preventDefault(); start();
      } else if (k === ' ' || k === 'Spacebar') {
        e.preventDefault();
        if (e.repeat) { return; }
        if (P.held) { release(); } else { grabNearest(); }
        render(); start();
      }
    }
    function onKeyUp(e) { if (keys[e.key]) { keys[e.key] = false; } }
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    layout();
    T.x = P.x = clamp(W * 0.5, tmin, tmax); T.L = P.L = clamp(lmax * 0.45, lmin, lmax);
    render();
    start();

    return function cleanup() {
      alive = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'dzwig') { a.mount = mount; } });
})();
