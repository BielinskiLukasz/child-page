// Activity "Wywrotka": the child drives a toy dump truck round a looping road (two screen widths long) by holding a pedal button,
// taps stones in a pile at the loading spot to drop them into the bed (0.4 s arc) and tips the bed (35 degrees for 1.2 s) at the
// dumping spot, where the load slides out into a growing heap. After 3 loads the heap becomes a small hill with a flag (soft glow)
// and clears for a new round after 5 s. A stone that is not within reach of the bed hops and stays on the ground; nothing is lost.
// All motion runs in one rAF loop (capped dt, paused while hidden, stopped when idle) and every end state is set from JS,
// so it behaves the same under the global prefers-reduced-motion rule.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var SPEED = 0.3;              // max speed, screen widths per second
  var ACCEL_S = 0.5, STOP_S = 0.5; // time from rest to full speed / from full speed to rest (spec: stop within 0.6 s)
  var ARC_S = 0.4;              // stone flight into the bed
  var TIP_S = 1.2, TIP_DEG = 35;
  var LOADS = 3, HILL_S = 5, CLEAR_S = 0.9;
  var STONES = 5, SLOTS = 5;
  var MAX_DT = 0.05;
  var LOAD_AT = 0.25, DUMP_AT = 0.75; // positions on the loop (fractions of its length)
  var STONE_COLORS = ['#9a95ad', '#c4a574', '#b9b3cc', '#a58b66', '#d8c49a'];
  var TILT_MAX = 8;
  var BED_X = -18;              // bed centre in truck units (100 units = truck width)
  var SLOT_X = [-38, -27.5, -17, -6.5, 4]; // bed slots (units)
  var REAR_X = -50;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag), k;
    for (k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) { n.setAttribute(k, attrs[k]); } }
    if (parent) { parent.appendChild(n); }
    return n;
  }
  function mix(c1, c2, t) { // numeric colour blend, hex strings
    var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16), out = 0, sh;
    for (sh = 16; sh >= 0; sh -= 8) { out = out * 256 + Math.round(lerp((a >> sh) & 255, (b >> sh) & 255, t)); }
    return '#' + ('000000' + out.toString(16)).slice(-6);
  }

  function mount(container) {
    var scene = document.createElement('div');
    scene.className = 'wt';
    scene.setAttribute('role', 'group');
    scene.setAttribute('aria-label', 'Wywrotka. Strzałka w prawo jedzie, spacja ładuje i wysypuje.');
    var svg = el('svg', { 'aria-hidden': 'true', focusable: 'false', 'class': 'wt-svg' });
    var pedal = document.createElement('button');
    pedal.type = 'button';
    pedal.className = 'wt-pedal';
    pedal.setAttribute('aria-label', 'Jedź (przytrzymaj)');
    pedal.setAttribute('tabindex', '-1');
    pedal.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="9" y="6" width="22" height="28" rx="7" fill="#5b5675"/>' +
      '<path d="M14 14h12M14 20h12M14 26h12" stroke="#cfc9e6" stroke-width="3" stroke-linecap="round"/></svg>';
    var tipBtn = document.createElement('button');
    tipBtn.type = 'button';
    tipBtn.className = 'wt-tip wt-off';
    tipBtn.setAttribute('aria-label', 'Wysyp');
    tipBtn.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M6 30h28" stroke="#7a5a3c" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M8 12L30 6l4 14H12z" fill="#f4c24e" stroke="#c9922a" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="30" r="3.5" fill="#5b5675"/><circle cx="28" cy="30" r="3.5" fill="#5b5675"/></svg>';
    scene.appendChild(svg);
    var hits = [], i;
    for (i = 0; i < STONES; i++) {
      var hb = document.createElement('div');
      hb.className = 'wt-hit';
      hb.setAttribute('role', 'button');
      hb.setAttribute('tabindex', '0');
      hb.setAttribute('aria-label', 'Kamień – załaduj');
      hb.setAttribute('data-i', String(i));
      scene.appendChild(hb);
      hits.push(hb);
    }
    scene.appendChild(tipBtn);
    scene.appendChild(pedal);
    container.appendChild(scene);

    var W = 0, H = 0, L = 0, P = 0, gy = 0, hh = 0, ew = 0, s = 1, sp = 56, tx = 0;
    var u = 0, v = 0, tilt = 0, wheel = 0;
    var pedalOn = false, keyRight = false, pedalPtr = null;
    var pile = [];                  // {on: 0/1, g: 0..1 grow, hop: 0..ARC_S or -1}
    var bed = [];                   // null | {ci, ready}
    var flies = [];                 // flying stones: {kind, t, ...}
    var tipT = -1, released = 0;
    var loads = 0, dumped = 0, heap = 0, heapT = 0;
    var hill = 0, hillT = 0, clrT = 0;
    var N = {};
    var raf = 0, last = 0;
    for (i = 0; i < STONES; i++) { pile.push({ on: 1, g: 1, hop: -1 }); }
    for (i = 0; i < SLOTS; i++) { bed.push(null); }

    // ----- geometry helpers (road coordinates are pixels along the loop, 0..L)
    function wrap(d) { d = (d + L / 2) % L; if (d < 0) { d += L; } return d - L / 2; }
    function groundAt(pos) { return gy - hh * Math.cos(2 * Math.PI * pos / P); }
    function screenX(pos) { return tx + wrap(pos - u); }
    function truckPt(lx, ly) {
      var r = tilt * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r), X = lx * s, Y = ly * s;
      return [tx + X * c - Y * sn, groundAt(u) + X * sn + Y * c];
    }
    function pileBase() { return groundAt(LOAD_AT * L) - 56 * s; } // the pile sits on the far ground, behind the truck
    function stoneOff(i) { // offset of a pile stone from the pile centre (px; x, height above ground)
      var row = i < 3 ? 0 : 1, col = row ? i - 3 : i;
      return row ? [(col - 0.5) * sp, sp * 1.5] : [(col - 1) * sp, sp * 0.5];
    }
    function heapScale() { var k = 0.3 + 0.7 * heap; return [ew * 0.0095 * k, ew * 0.0105 * k]; }
    function heapTop() { return 56 * heapScale()[1]; }
    function bedCount(readyOnly) {
      var n = 0, k;
      for (k = 0; k < SLOTS; k++) { if (bed[k] && (!readyOnly || bed[k].ready)) { n++; } }
      return n;
    }
    function inDumpZone() {
      var rear = u + REAR_X * s;
      return Math.abs(wrap(rear - (DUMP_AT * L + 0.55 * ew))) <= 0.5 * ew;
    }
    function canTip() {
      return tipT < 0 && hill === 0 && bedCount(true) > 0 && bedCount(false) === bedCount(true) && Math.abs(v) < SPEED * W * 0.03 && inDumpZone();
    }

    // ----- build
    function stoneNode(parent, r, color) {
      return el('circle', { r: r, fill: color, stroke: '#6b6585', 'stroke-width': 1.5 }, parent);
    }
    function build() {
      var q, d, x, y;
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      // far layer (parallax 0.5, period W): sun, clouds, hills
      N.far = el('g', {}, svg);
      el('circle', { cx: W * 0.84, cy: H * 0.14, r: Math.max(18, Math.min(W, H) * 0.06), fill: '#fff1bd' }, N.far);
      for (q = 0; q < 3; q++) {
        [[0.15, 0.1, 1], [0.62, 0.2, 0.8]].forEach(function (c) {
          var g = el('g', { transform: 'translate(' + ((c[0] + q) * W) + ' ' + (c[1] * H) + ') scale(' + (c[2] * Math.max(0.6, W / 700)) + ')' }, N.far);
          el('ellipse', { cx: 0, cy: 0, rx: 34, ry: 12, fill: '#fff', opacity: '.85' }, g);
          el('ellipse', { cx: 18, cy: -8, rx: 20, ry: 11, fill: '#fff', opacity: '.85' }, g);
        });
      }
      d = 'M0 ' + H;
      for (x = 0; x <= 3 * W; x += 12) { d += ' L' + x + ' ' + (gy - H * 0.1 - Math.sin(2 * Math.PI * x / W * 2 + 1) * H * 0.04 - Math.sin(2 * Math.PI * x / W * 5) * H * 0.012).toFixed(1); }
      d += ' L' + (3 * W) + ' ' + H + 'Z';
      el('path', { d: d, fill: '#b9dcc0' }, N.far);
      // ground (period P): drawn for q in [-P, 2P]; the group is shifted by the position within one period
      N.ground = el('g', {}, svg);
      var top = '';
      for (x = -P; x <= 2 * P + 6; x += 6) { top += (top ? ' L' : 'M') + x + ' ' + groundAt(x).toFixed(1); }
      el('path', { d: top + ' L' + (2 * P + 6) + ' ' + H + ' L' + (-P) + ' ' + H + 'Z', fill: '#cfa97b' }, N.ground);
      el('path', { d: top, fill: 'none', stroke: '#a8d9a0', 'stroke-width': Math.max(6, ew * 0.1), 'stroke-linejoin': 'round' }, N.ground);
      for (q = 0; q < 18; q++) {
        x = -P + (q + 0.5) / 18 * 3 * P; y = gy + hh + (H - gy - hh) * (0.25 + 0.5 * ((q * 37) % 10) / 10);
        el('ellipse', { cx: x.toFixed(1), cy: y.toFixed(1), rx: 4 + (q % 3) * 2, ry: 2.5 + (q % 2), fill: '#b98e60' }, N.ground);
      }
      // dumping spot: hatched patch and a barrier
      N.dump = el('g', {}, svg);
      var pw = ew * 0.7;
      el('rect', { x: 0.2 * ew, y: -4, width: pw, height: 6, rx: 3, fill: '#f4c24e' }, N.dump);
      for (q = 0; q < 5; q++) { el('path', { d: 'M' + (0.2 * ew + q * pw / 5) + ' -4l' + (pw / 10) + ' 6', stroke: '#5b5675', 'stroke-width': 3 }, N.dump); }
      el('path', { d: 'M' + (0.95 * ew) + ' 0V' + (-ew * 0.2), stroke: '#8d89a3', 'stroke-width': 4, 'stroke-linecap': 'round' }, N.dump);
      el('rect', { x: 0.95 * ew - 8, y: -ew * 0.2 - 8, width: 16, height: 8, rx: 2, fill: '#e8605a' }, N.dump);
      // heap + hill flag
      N.heapG = el('g', {}, svg);
      N.heap = el('path', { d: 'M-50 0Q-22 -56 0 -56Q22 -56 50 0Z', fill: '#ecd28f', stroke: '#d3b56c', 'stroke-width': 2 }, N.heapG);
      N.flagG = el('g', {}, svg);
      N.glow = el('circle', { cx: 0, cy: -ew * 0.22, r: ew * 0.32, fill: '#fff7c2', opacity: '0' }, N.flagG);
      N.flag = el('g', {}, N.flagG);
      el('path', { d: 'M0 0V' + (-ew * 0.4), stroke: '#8d6847', 'stroke-width': 4, 'stroke-linecap': 'round' }, N.flag);
      el('path', { d: 'M2 ' + (-ew * 0.4) + 'L' + (ew * 0.22) + ' ' + (-ew * 0.33) + 'L2 ' + (-ew * 0.26) + 'Z', fill: '#e8605a' }, N.flag);
      // loading spot: sand pile, cones, stones
      N.pileG = el('g', {}, svg);
      el('ellipse', { cx: 0, cy: 0, rx: 3.2 * sp, ry: 0.2 * sp, fill: '#b9a27b' }, N.pileG);
      el('path', { d: 'M' + (-2.6 * sp) + ' 0L' + (-0.45 * sp) + ' ' + (-2.25 * sp) + 'Q0 ' + (-2.55 * sp) + ' ' + (0.45 * sp) + ' ' + (-2.25 * sp) + 'L' + (2.6 * sp) + ' 0Z',
        fill: '#ecd28f', stroke: '#d3b56c', 'stroke-width': 2, 'stroke-linejoin': 'round' }, N.pileG);
      [-1, 1].forEach(function (sg) {
        var cg = el('g', { transform: 'translate(' + (sg * 3.1 * sp) + ' 0)' }, N.pileG);
        el('path', { d: 'M-12 0L-4 -26h8l8 26z', fill: '#f2994a' }, cg);
        el('path', { d: 'M-8 -14h16l-2 -7h-12z', fill: '#fff' }, cg);
      });
      N.stones = [];
      for (i = 0; i < STONES; i++) {
        var so = stoneOff(i), sg = el('g', {}, N.pileG);
        stoneNode(sg, sp * 0.38, STONE_COLORS[i]);
        el('circle', { cx: -sp * 0.12, cy: -sp * 0.12, r: sp * 0.09, fill: '#fff', opacity: '.35' }, sg);
        sg.setAttribute('data-ox', so[0]);
        N.stones.push(sg);
      }
      // truck
      N.truck = el('g', {}, svg);
      var t = N.truck;
      el('rect', { x: -50, y: -26, width: 100, height: 13, rx: 4, fill: '#5b5675' }, t);
      N.bedG = el('g', {}, t);
      el('path', { d: 'M-48 -26L-53 -49H12V-26Z', fill: '#e6a23c', stroke: '#c9922a', 'stroke-width': 2, 'stroke-linejoin': 'round' }, N.bedG);
      el('rect', { x: -48, y: -29, width: 60, height: 4, rx: 2, fill: '#c9922a' }, N.bedG);
      N.bedStones = [];
      for (i = 0; i < SLOTS; i++) { N.bedStones.push(stoneNode(N.bedG, 5.5, '#9a95ad')); }
      el('path', { d: 'M16 -26V-52Q16 -56 21 -56H34Q39 -56 43 -47L50 -34V-26Z', fill: '#f4c24e', stroke: '#c9922a', 'stroke-width': 2, 'stroke-linejoin': 'round' }, t);
      el('path', { d: 'M22 -51H33Q36 -51 38 -46L41 -40H22Z', fill: '#cfeaf8' }, t);
      N.wheels = [-30, 28].map(function (cx) {
        var g = el('g', { transform: 'translate(' + cx + ' -9)' }, t);
        el('circle', { r: 10, fill: '#3d3a4f' }, g);
        var rot = el('g', {}, g);
        el('circle', { r: 5, fill: '#cfc9e6' }, rot);
        el('path', { d: 'M-4 0H4M0 -4V4', stroke: '#8d89a3', 'stroke-width': 2 }, rot);
        return rot;
      });
      N.fly = el('g', {}, svg);
      flies.forEach(function (f) { f.node = flyNode(STONE_COLORS[f.ci], 5.5 * s); });
    }

    function layout() {
      var oldL = L;
      W = scene.clientWidth || window.innerWidth;
      H = scene.clientHeight || window.innerHeight;
      L = W * 2; P = W;
      gy = H * 0.68;
      hh = Math.min(H * 0.035, 18);
      ew = clamp(Math.min(W * 0.3, H * 0.42), 90, 300);
      s = ew / 100;
      sp = Math.max(56, ew * 0.28);
      tx = W * 0.4;
      if (oldL > 0) { u = u / oldL * L; } else { u = (LOAD_AT * L + 0.18 * ew) % L; }
      build();
      paint();
      wake();
    }

    // ----- actions
    function flyNode(color, r) {
      var n = stoneNode(N.fly, r, color);
      return n;
    }
    function loadStone(k) {
      var st = pile[k], slot = -1, j;
      if (!st || !st.on || st.g < 0.9 || st.hop >= 0 || tipT >= 0) { return; }
      for (j = 0; j < SLOTS; j++) { if (!bed[j]) { slot = j; break; } }
      if (slot < 0) { return; }
      var so = stoneOff(k), pos = LOAD_AT * L + so[0], bedPos = u + BED_X * s;
      report(function (A) { A.track('interaction', { variant: 'load' }); });
      if (Math.abs(wrap(pos - bedPos)) <= 0.28 * ew + 0.6 * sp) {
        st.on = 0; st.g = 0;
        bed[slot] = { ci: k, ready: false };
        flies.push({ kind: 'load', t: 0, pos: pos, h: so[1] + 56 * s, slot: slot, ci: k, node: flyNode(STONE_COLORS[k], sp * 0.38) });
      } else {
        st.hop = 0; // not within reach of the bed: it hops and stays on the ground
      }
      wake();
    }
    function nextStone() {
      var best = -1, bd = 1e9, k, d;
      for (k = 0; k < STONES; k++) {
        if (pile[k].on && pile[k].g >= 0.9 && pile[k].hop < 0) {
          d = Math.abs(wrap(LOAD_AT * L + stoneOff(k)[0] - (u + BED_X * s)));
          if (d < bd) { bd = d; best = k; }
        }
      }
      return best;
    }
    function startTip() {
      if (!canTip()) { return; }
      tipT = 0; released = 0;
      report(function (A) { A.track('interaction', { variant: 'tip' }); });
      wake();
    }
    function tipAngle(t) {
      if (t < 0) { return 0; }
      if (t < 0.4) { return TIP_DEG * ease(t / 0.4); }
      if (t < 0.8) { return TIP_DEG; }
      return TIP_DEG * (1 - ease((t - 0.8) / 0.4));
    }
    function slotOrder(slot) { // rank among occupied slots, leftmost (closest to the hinge) first
      var r = 0, j;
      for (j = 0; j < slot; j++) { if (bed[j]) { r++; } }
      return r;
    }
    function dropTime(slot) { return 0.3 + 0.1 * slotOrder(slot); }
    function releaseStone(slot) {
      var b = bed[slot], p = truckPt(REAR_X - 3, -31), pos = u + (p[0] - tx), h = groundAt(u) - p[1];
      bed[slot] = null;
      released++;
      flies.push({ kind: 'drop', t: 0, pos: pos, h: h, ci: b.ci, node: flyNode(STONE_COLORS[b.ci], 5.5 * s) });
    }

    // ----- simulation
    function step(dt) {
      var vmax = SPEED * W, vt = (pedalOn || keyRight) && tipT < 0 ? vmax : 0, i, f, k;
      if (vt > v) { v = Math.min(vt, v + vmax / ACCEL_S * dt); } else { v = Math.max(vt, v - vmax / STOP_S * dt); }
      u = (u + v * dt) % L;
      wheel += v * dt / (10 * s);
      var d = ew * 0.3, tt = Math.atan2(groundAt(u + d) - groundAt(u - d), 2 * d) * 57.2958;
      tilt = clamp(tt, -TILT_MAX, TILT_MAX);

      // pile: stones grow back once the truck has left the loading spot
      for (i = 0; i < STONES; i++) {
        k = pile[i];
        if (k.hop >= 0) { k.hop += dt; if (k.hop >= ARC_S) { k.hop = -1; } }
        if (!k.on && Math.abs(wrap(LOAD_AT * L - u)) > 0.45 * W) { k.on = 1; }
        if (k.on && k.g < 1) { k.g = Math.min(1, k.g + dt / ARC_S); }
      }
      // flights
      for (i = flies.length - 1; i >= 0; i--) {
        f = flies[i];
        f.t += dt;
        if (f.t >= ARC_S) {
          if (f.kind === 'load') { if (bed[f.slot]) { bed[f.slot].ready = true; } } else { dumped++; if (hill === 0) { heapT = Math.min(1, dumped / (LOADS * SLOTS)); } }
          if (f.node && f.node.parentNode) { f.node.parentNode.removeChild(f.node); }
          flies.splice(i, 1);
        }
      }
      // tipping
      if (tipT >= 0) {
        tipT += dt;
        for (i = 0; i < SLOTS; i++) { if (bed[i] && bed[i].ready && tipT >= dropTime(i)) { releaseStone(i); break; } }
        if (tipT >= TIP_S && bedCount(false) === 0) {
          tipT = -1;
          if (released > 0) { loads++; }
          if (loads >= LOADS && hill === 0) {
            hill = 1; hillT = 0; heapT = 1;
            report(function (A) { A.complete(); });
          }
        } else if (tipT >= TIP_S + 1) { tipT = -1; } // safety: never stuck tipping
      }
      // heap / hill
      heap += (heapT - heap) * (1 - Math.exp(-6 * dt));
      if (Math.abs(heapT - heap) < 0.002) { heap = heapT; }
      if (hill === 1) {
        hillT += dt;
        if (hillT >= HILL_S) { hill = 2; clrT = 0; heapT = 0; }
      } else if (hill === 2) {
        clrT += dt;
        if (clrT >= CLEAR_S) { hill = 0; hillT = 0; clrT = 0; loads = 0; dumped = 0; heap = 0; heapT = 0; }
      }
    }

    function active() {
      var i;
      if (pedalOn || keyRight || v !== 0 || tipT >= 0 || flies.length || hill !== 0) { return true; }
      if (heap !== heapT) { return true; }
      for (i = 0; i < STONES; i++) { if (pile[i].hop >= 0 || (pile[i].on && pile[i].g < 1)) { return true; } }
      // a stone waiting for the truck to leave (re-spawns on the next move) needs no loop
      return false;
    }

    // ----- paint
    function paint() {
      if (!N.truck) { return; }
      var i, f, p, sx, gyp, x, y, a, hs, ps, off, k;
      N.far.setAttribute('transform', 'translate(' + (-((u * 0.5) % W)).toFixed(1) + ' 0)');
      N.ground.setAttribute('transform', 'translate(' + (tx - (u % P)).toFixed(1) + ' 0)');
      // truck
      gyp = groundAt(u);
      N.truck.setAttribute('transform', 'translate(' + tx.toFixed(1) + ' ' + gyp.toFixed(1) + ') rotate(' + tilt.toFixed(2) + ') scale(' + s.toFixed(3) + ')');
      a = tipAngle(tipT);
      N.bedG.setAttribute('transform', 'rotate(' + (-a).toFixed(2) + ' -48 -26)');
      N.wheels.forEach(function (w) { w.setAttribute('transform', 'rotate(' + ((wheel * 57.2958) % 360).toFixed(1) + ')'); });
      for (i = 0; i < SLOTS; i++) {
        var b = bed[i], n = N.bedStones[i];
        if (b && b.ready) {
          var bx = SLOT_X[i];
          if (tipT >= 0.15) { bx = lerp(bx, REAR_X - 3, ease((tipT - 0.15) / Math.max(0.05, dropTime(i) - 0.15))); }
          n.setAttribute('cx', bx.toFixed(2)); n.setAttribute('cy', '-31.5');
          n.setAttribute('fill', STONE_COLORS[b.ci]); n.setAttribute('opacity', '1');
        } else { n.setAttribute('opacity', '0'); }
      }
      // loading spot
      sx = screenX(LOAD_AT * L);
      N.pileG.setAttribute('transform', 'translate(' + sx.toFixed(1) + ' ' + pileBase().toFixed(1) + ')');
      for (i = 0; i < STONES; i++) {
        k = pile[i]; off = stoneOff(i);
        var arc = k.hop >= 0 ? Math.sin(Math.PI * k.hop / ARC_S) * ew * 0.25 : 0, sc = k.on ? ease(k.g) : 0;
        N.stones[i].setAttribute('transform', 'translate(' + off[0].toFixed(1) + ' ' + (-off[1] - arc).toFixed(1) + ') scale(' + sc.toFixed(3) + ')');
        N.stones[i].setAttribute('opacity', sc > 0 ? '1' : '0');
        var hb = hits[i], vis = k.on && k.g >= 0.9 && sx + off[0] > -sp && sx + off[0] < W + sp;
        hb.style.width = sp + 'px'; hb.style.height = sp + 'px';
        hb.style.transform = 'translate(' + (sx + off[0] - sp / 2).toFixed(1) + 'px,' + (pileBase() - off[1] - sp / 2).toFixed(1) + 'px)';
        hb.style.visibility = vis ? 'visible' : 'hidden';
        hb.setAttribute('tabindex', vis ? '0' : '-1');
      }
      // dumping spot, heap, flag
      var dpos = DUMP_AT * L;
      sx = screenX(dpos); gyp = groundAt(dpos);
      N.dump.setAttribute('transform', 'translate(' + sx.toFixed(1) + ' ' + (gyp + 2).toFixed(1) + ')');
      hs = heapScale();
      N.heapG.setAttribute('transform', 'translate(' + sx.toFixed(1) + ' ' + (gyp + 2).toFixed(1) + ') scale(' + hs[0].toFixed(3) + ' ' + hs[1].toFixed(3) + ')');
      N.heapG.setAttribute('opacity', heap > 0.01 ? '1' : '0');
      var gm = hill === 1 ? ease(hillT / 0.8) : hill === 2 ? 1 - ease(clrT / CLEAR_S) : 0;
      N.heap.setAttribute('fill', mix('#ecd28f', '#9ad68a', gm));
      N.heap.setAttribute('stroke', mix('#d3b56c', '#6fb878', gm));
      var fs = hill === 1 ? ease(hillT / 0.6) : hill === 2 ? 1 - ease(clrT / CLEAR_S) : 0;
      N.flagG.setAttribute('transform', 'translate(' + sx.toFixed(1) + ' ' + (gyp + 2 - heapTop() * 0.95).toFixed(1) + ')');
      N.flag.setAttribute('transform', 'scale(' + fs.toFixed(3) + ')');
      N.flagG.setAttribute('opacity', fs > 0.001 ? '1' : '0');
      N.glow.setAttribute('opacity', (0.55 * fs).toFixed(3));
      // flights
      for (i = 0; i < flies.length; i++) {
        f = flies[i]; p = clamp(f.t / ARC_S, 0, 1);
        var x0 = screenX(f.pos), y0 = groundAt(f.pos) - f.h;
        if (f.kind === 'load') {
          var tp = truckPt(SLOT_X[f.slot], -31.5);
          x = lerp(x0, tp[0], ease(p)); y = lerp(y0, tp[1], ease(p)) - Math.sin(Math.PI * p) * ew * 0.5;
          f.node.setAttribute('r', lerp(sp * 0.38, 5.5 * s, ease(p)).toFixed(2));
        } else {
          var hx = screenX(DUMP_AT * L), hy = groundAt(DUMP_AT * L) + 2 - heapTop() * 0.6;
          x = lerp(x0, hx, p); y = lerp(y0, hy, p * p);
          f.node.setAttribute('r', lerp(5.5 * s, 4 * s, p).toFixed(2));
        }
        f.node.setAttribute('cx', x.toFixed(1)); f.node.setAttribute('cy', y.toFixed(1));
      }
      // buttons
      var tipOk = canTip();
      tipBtn.classList.toggle('wt-off', !tipOk);
      tipBtn.setAttribute('aria-disabled', tipOk ? 'false' : 'true');
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

    // ----- input
    function onPedalDown(e) {
      e.preventDefault();
      if (pedalPtr !== null) { return; }
      pedalPtr = e.pointerId; pedalOn = true;
      try { pedal.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers */ }
      report(function (A) { A.track('interaction', { variant: 'drive' }); });
      wake();
    }
    function onPedalUp(e) {
      if (e.pointerId !== pedalPtr) { return; }
      pedalPtr = null; pedalOn = false;
      wake();
    }
    function onPedalLost() { pedalPtr = null; pedalOn = false; wake(); }
    function onPedalMouse(e) { e.preventDefault(); }
    pedal.addEventListener('pointerdown', onPedalDown);
    pedal.addEventListener('pointerup', onPedalUp);
    pedal.addEventListener('pointercancel', onPedalUp);
    pedal.addEventListener('lostpointercapture', onPedalLost);
    pedal.addEventListener('mousedown', onPedalMouse);
    pedal.addEventListener('contextmenu', onPedalMouse);

    var onTipDown = function (e) { e.preventDefault(); e.stopPropagation(); startTip(); };
    var onTipClick = function (e) { if (e.detail === 0) { startTip(); } };
    tipBtn.addEventListener('pointerdown', onTipDown);
    tipBtn.addEventListener('click', onTipClick);
    var onHitDown = function (e) { e.preventDefault(); e.stopPropagation(); loadStone(parseInt(e.currentTarget.getAttribute('data-i'), 10)); };
    var onHitKey = function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); loadStone(parseInt(e.currentTarget.getAttribute('data-i'), 10)); }
    };
    hits.forEach(function (h) { h.addEventListener('pointerdown', onHitDown); h.addEventListener('keydown', onHitKey); });

    function onKeyDown(e) {
      var k = e.key;
      if (k === 'ArrowRight') {
        e.preventDefault();
        if (!keyRight && !e.repeat) { report(function (A) { A.track('interaction', { variant: 'drive' }); }); }
        keyRight = true;
        wake();
      } else if (k === ' ' && !(e.target && e.target.closest && e.target.closest('.wt-tip, .wt-hit'))) {
        e.preventDefault();
        if (e.repeat) { return; }
        if (canTip()) { startTip(); } else { var n = nextStone(); if (n >= 0) { loadStone(n); } }
      }
    }
    function onKeyUp(e) { if (e.key === 'ArrowRight') { keyRight = false; wake(); } }
    function onBlur() { keyRight = false; pedalOn = false; pedalPtr = null; }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', layout);
    document.addEventListener('visibilitychange', onVis);

    layout();

    return function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      pedal.removeEventListener('pointerdown', onPedalDown);
      pedal.removeEventListener('pointerup', onPedalUp);
      pedal.removeEventListener('pointercancel', onPedalUp);
      pedal.removeEventListener('lostpointercapture', onPedalLost);
      pedal.removeEventListener('mousedown', onPedalMouse);
      pedal.removeEventListener('contextmenu', onPedalMouse);
      tipBtn.removeEventListener('pointerdown', onTipDown);
      tipBtn.removeEventListener('click', onTipClick);
      hits.forEach(function (h) { h.removeEventListener('pointerdown', onHitDown); h.removeEventListener('keydown', onHitKey); });
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', layout);
      window.removeEventListener('orientationchange', layout);
      document.removeEventListener('visibilitychange', onVis);
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'wywrotka') { a.mount = mount; } });
})();
