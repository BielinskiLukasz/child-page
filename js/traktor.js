// Activity "Traktor": touch the tractor -> it starts / stops gently; it drives a closed serpentine loop over 3 field rows
// (row 1, 2, 3, 2, ...) with smooth U-turns and leaves tiny sprouts behind that slowly grow into flowers / vegetables.
// Touch a plant -> it wiggles once; touch the barn -> the tractor drives there and parks; touch the animal driver -> wave.
// All motion is driven by one rAF loop (capped dt, paused when the tab is hidden) so it keeps working under the global
// prefers-reduced-motion rule that disables CSS animations; the grown state of a plant is set from JS, never a keyframe.
(function () {
  var CROSS_S = 12;            // seconds to cross the visible width at cruise speed (>= 10)
  var RAMP_S = 2;              // gentle start / stop
  var MAX_DT = 0.05;
  var SLOTS = 12, GROW_S = 3, WIG_S = 1.2, WAVE_S = 2.4;
  var FULL_WAIT_S = 1.5, FADE_S = 3;
  var TURN_N = 24;

  function sm(u) { return u * u * (3 - 2 * u); }
  function mod(a, b) { return a - Math.floor(a / b) * b; }

  function tractorSvg() {
    return '<svg viewBox="0 0 120 84" aria-hidden="true" focusable="false">' +
      '<rect x="60" y="32" width="54" height="26" rx="9" fill="#9ed8c6"/>' +
      '<rect x="62" y="48" width="50" height="5" fill="#fff" opacity=".45"/>' +
      '<rect x="102" y="20" width="6" height="14" rx="3" fill="#7a748f"/>' +
      '<circle cx="112" cy="44" r="4" fill="#ffe9a8"/>' +
      '<rect x="14" y="16" width="48" height="44" rx="10" fill="#8cccb8"/>' +
      '<rect x="20" y="22" width="36" height="30" rx="8" fill="#fdfbff"/>' +
      '<circle cx="38" cy="40" r="10" fill="#c99b72"/><circle cx="31" cy="33" r="4" fill="#c99b72"/><circle cx="45" cy="33" r="4" fill="#c99b72"/>' +
      '<circle cx="34" cy="38" r="1.7" fill="#5b5675"/><circle cx="42" cy="38" r="1.7" fill="#5b5675"/>' +
      '<ellipse cx="38" cy="44" rx="4" ry="3" fill="#f3dcc4"/><circle cx="38" cy="43" r="1.4" fill="#6b6585"/>' +
      '<g class="tk-wave" transform="rotate(0 50 50)"><ellipse cx="50" cy="46" rx="3.5" ry="6" fill="#c99b72"/></g>' +
      '<g class="tk-wheel" data-cx="32" data-cy="64"><circle cx="32" cy="64" r="19" fill="#6b6585"/><circle cx="32" cy="64" r="10" fill="#cfc9e6"/><path d="M32 52v24M20 64h24" stroke="#6b6585" stroke-width="3"/></g>' +
      '<g class="tk-wheel" data-cx="94" data-cy="70"><circle cx="94" cy="70" r="13" fill="#6b6585"/><circle cx="94" cy="70" r="7" fill="#cfc9e6"/><path d="M94 63v14M87 70h14" stroke="#6b6585" stroke-width="2.5"/></g>' +
      '</svg>';
  }

  function barnSvg() {
    return '<svg viewBox="0 0 120 104" aria-hidden="true" focusable="false">' +
      '<rect x="10" y="38" width="100" height="62" rx="6" fill="#f7b7a5"/>' +
      '<path d="M2 42L60 6l58 36z" fill="#d9a3b8"/>' +
      '<rect x="38" y="58" width="44" height="42" rx="6" fill="#fdf0d5"/>' +
      '<path d="M38 58l44 42M82 58L38 100" stroke="#e3c9a6" stroke-width="3"/>' +
      '<circle cx="60" cy="30" r="7" fill="#fdf0d5"/></svg>';
  }

  var KINDS = [
    '<circle cx="20" cy="14" r="7" fill="#f7a8c9"/><circle cx="20" cy="14" r="3" fill="#ffe08a"/>',
    '<circle cx="20" cy="14" r="7" fill="#ffd98a"/><circle cx="20" cy="14" r="3" fill="#f3b0a0"/>',
    '<path d="M13 12q7-9 14 0q-2 12-7 14q-5-2-7-14z" fill="#f3b27a"/><path d="M20 10l-4-6M20 10l4-6M20 10v-8" stroke="#8fc98a" stroke-width="2.5" stroke-linecap="round"/>'
  ];
  function plantSvg(k) {
    return '<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false">' +
      '<path d="M20 58V24" stroke="#7fbf7a" stroke-width="3.5" stroke-linecap="round"/>' +
      '<ellipse cx="13" cy="44" rx="7" ry="3.5" fill="#8fd08a" transform="rotate(-25 13 44)"/>' +
      '<ellipse cx="27" cy="40" rx="7" ry="3.5" fill="#8fd08a" transform="rotate(25 27 40)"/>' +
      '<g class="tk-hd" transform="translate(0 6)">' + KINDS[k % 3] + '</g></svg>';
  }

  function mount(container) {
    var scene = document.createElement('div');
    scene.className = 'tk';
    scene.setAttribute('role', 'group');
    scene.setAttribute('aria-label', 'Traktor');
    var html = '<div class="tk-sun"></div><div class="tk-field"></div>' +
      '<div class="tk-furrows"><i></i><i></i><i></i></div>' +
      '<button class="tk-barn" type="button" aria-label="Stodoła – traktor jedzie do stodoły">' + barnSvg() + '</button>' +
      '<div class="tk-plants">';
    for (var r = 0; r < 3; r++) {
      for (var k = 0; k < SLOTS; k++) {
        html += '<div class="tk-pl" aria-hidden="true"><div class="tk-pi">' + plantSvg(k + r) + '</div></div>';
      }
    }
    html += '</div><div class="tk-tr" role="button" tabindex="0" aria-label="Traktor – ruszaj lub zatrzymaj">' + tractorSvg() +
      '<button class="tk-dr" type="button" aria-label="Zwierzak za kierownicą – pomacha"></button></div>';
    scene.innerHTML = html;
    container.appendChild(scene);

    var tr = scene.querySelector('.tk-tr');
    var barn = scene.querySelector('.tk-barn');
    var driver = scene.querySelector('.tk-dr');
    var wave = scene.querySelector('.tk-wave');
    var wheels = [].slice.call(scene.querySelectorAll('.tk-wheel'));
    var furrows = [].slice.call(scene.querySelectorAll('.tk-furrows i'));
    var layer = scene.querySelector('.tk-plants');
    var plants = [].slice.call(scene.querySelectorAll('.tk-pl')).map(function (n, i) {
      return { n: n, pi: n.firstChild, hd: n.querySelector('.tk-hd'), row: Math.floor(i / SLOTS), k: i % SLOTS, age: -1, wig: -1 };
    });

    var W = 0, H = 0, tw = 0, th = 0, rh = 0, ps = 0, V = 1, Ltot = 1;
    var pieces = [], rowY = [], xl = 0, xr = 0, slotX = [], slotS = [];
    var s = 0, v = 0, odo = 0, sUn = 0;
    var ramp = { v0: 0, vt: 0, t: RAMP_S, dur: RAMP_S };
    var plan = null, parked = true;
    var waveT = -1;
    var fullT = 0, fadeT = -1;
    var raf = 0, last = 0;

    function turnTable(rx, dy) {
      var t = [0], i, prev = [0, 0];
      for (i = 1; i <= TURN_N; i++) {
        var th2 = Math.PI * i / TURN_N;
        var x = rx * Math.sin(th2), y = Math.abs(dy) * (1 - Math.cos(th2)) / 2;
        t.push(t[i - 1] + Math.sqrt((x - prev[0]) * (x - prev[0]) + (y - prev[1]) * (y - prev[1])));
        prev = [x, y];
      }
      return t;
    }

    function layout() {
      var oq = s / Ltot;
      W = scene.clientWidth || window.innerWidth;
      H = scene.clientHeight || window.innerHeight;
      var fieldTop = H * 0.3;
      rh = Math.min((H - fieldTop - 8) / 2.85, W * 0.28);
      var fTop = H - rh * 2.85 - 6;
      fieldTop = Math.max(H * 0.2, Math.min(fieldTop, fTop));
      tw = Math.min(rh * 1.6, W * 0.3, 230);
      th = tw * 84 / 120;
      var rx = rh * 0.35;
      ps = Math.max(26, Math.min(rh * 0.5, (W / SLOTS) * 1.6));
      xl = tw / 2 + rx + 6; xr = W - xl;
      var contact = rh * 0.3;
      rowY = [0, 1, 2].map(function (i) { return fieldTop + rh * (i + 0.5); });
      var order = [[0, 1], [1, -1], [2, 1], [1, -1]];
      pieces = [];
      var acc = 0, i;
      var turns = [[1, 0, 1], [-1, 1, 2], [1, 2, 1], [-1, 1, 0]];
      for (i = 0; i < 4; i++) {
        var o = order[i], len = xr - xl;
        pieces.push({ k: 'row', s0: acc, len: len, row: o[0], dir: o[1], y: rowY[o[0]] });
        acc += len;
        var tt = turns[i], dy = rowY[tt[2]] - rowY[tt[1]];
        var tab = turnTable(rx, dy);
        pieces.push({ k: 'turn', s0: acc, len: tab[TURN_N], tab: tab, side: tt[0], ya: rowY[tt[1]], dy: dy,
          xe: tt[0] > 0 ? xr : xl, rx: rx });
        acc += tab[TURN_N];
      }
      Ltot = acc;
      var ratio = (W / CROSS_S) / V;
      V = W / CROSS_S;
      if (v) { v *= ratio; ramp.v0 *= ratio; ramp.vt *= ratio; }
      s = parked ? 0 : mod(oq * Ltot, Ltot);
      sUn = s;
      slotX = []; slotS = [];
      for (var k = 0; k < SLOTS; k++) { slotX.push(xl + (k + 0.5) / SLOTS * (xr - xl)); }
      // s of every slot on each straight piece
      pieces.forEach(function (p) {
        if (p.k !== 'row') { return; }
        p.slotS = slotX.map(function (x) { return p.s0 + (p.dir > 0 ? x - xl : xr - x); });
      });
      scene.style.setProperty('--tk-ft', fieldTop.toFixed(1) + 'px');
      scene.style.setProperty('--tk-tw', tw.toFixed(1) + 'px');
      scene.style.setProperty('--tk-th', th.toFixed(1) + 'px');
      furrows.forEach(function (f, j) {
        f.style.top = (rowY[j] + contact - rh * 0.3).toFixed(1) + 'px';
        f.style.height = (rh * 0.55).toFixed(1) + 'px';
      });
      var bw = Math.min(W * 0.34, (fieldTop + 4) * 1.15 * 0.95, 200);
      barn.style.width = bw.toFixed(1) + 'px';
      barn.style.height = (bw * 104 / 120).toFixed(1) + 'px';
      barn.style.left = (W * 0.04).toFixed(1) + 'px';
      barn.style.top = (fieldTop + 6 - bw * 104 / 120).toFixed(1) + 'px';
      plants.forEach(function (p) {
        var x = slotX[p.k], y = rowY[p.row] + contact;
        p.n.style.left = (x - 28).toFixed(1) + 'px';
        p.n.style.top = (y - 56).toFixed(1) + 'px';
        p.pi.style.width = ps.toFixed(1) + 'px';
        p.pi.style.height = (ps * 1.5).toFixed(1) + 'px';
        p.pi.style.left = (28 - ps / 2).toFixed(1) + 'px';
        p.pi.style.top = (56 - ps * 1.5).toFixed(1) + 'px';
      });
      if (plan) { goBarn(); }
      place();
    }

    function pointAt(q) {
      q = mod(q, Ltot);
      for (var i = 0; i < pieces.length; i++) {
        var p = pieces[i];
        if (q >= p.s0 && q < p.s0 + p.len || i === pieces.length - 1) {
          var u = q - p.s0;
          if (p.k === 'row') { return { x: p.dir > 0 ? xl + u : xr - u, y: p.y, nx: p.dir }; }
          var j = 0;
          while (j < TURN_N - 1 && p.tab[j + 1] < u) { j++; }
          var f = (u - p.tab[j]) / Math.max(1e-6, p.tab[j + 1] - p.tab[j]);
          var th2 = Math.PI * (j + Math.min(1, Math.max(0, f))) / TURN_N;
          return { x: p.xe + p.side * p.rx * Math.sin(th2), y: p.ya + p.dy * (1 - Math.cos(th2)) / 2,
            nx: Math.max(-1, Math.min(1, p.side * Math.cos(th2) * 3)) };
        }
      }
      return { x: xl, y: rowY[0], nx: 1 };
    }

    function place() {
      var pt = pointAt(s);
      var contact = rh * 0.3;
      tr.style.transform = 'translate(' + (pt.x - tw / 2).toFixed(1) + 'px,' + (pt.y + contact - th).toFixed(1) + 'px) scale(' + pt.nx.toFixed(3) + ',1)';
    }

    function startRamp(vt) { plan = null; ramp = { v0: v, vt: vt, t: 0, dur: RAMP_S }; }

    function goBarn() {
      if (parked) { return; }
      var D = mod(Ltot - s, Ltot);
      if (D < 1 && v < V * 0.05) { s = 0; sUn = 0; v = 0; parked = true; plan = null; ramp = { v0: 0, vt: 0, t: RAMP_S, dur: RAMP_S }; place(); return; }
      var T = Math.max(2.5, 1.2 * D / V);
      if (v > 0 && v * T > 2.85 * D) { T = 2.85 * D / v; }
      if (T < 2.5) { D += Ltot; T = Math.max(2.5, 1.2 * D / V); if (v * T > 2.85 * D) { T = 2.85 * D / v; } }
      plan = { D: D, T: T, v0: v, t: 0, s0: s };
      sUn = s;
    }

    function onTractor() {
      var moving = plan || ramp.vt > 0;
      parked = false;
      startRamp(moving ? 0 : V);
    }
    function onBarn() {
      if (parked) { return; }
      goBarn();
    }
    function onDriver() { if (waveT < 0) { waveT = 0; } }
    function onPlant(p) { if (p.age >= 0 && p.wig < 0) { p.wig = 0; } }

    function paintPlant(p) {
      var g = sm(Math.min(1, p.age / GROW_S));
      var sc = 0.3 + 0.7 * g;
      var rot = 0;
      if (p.wig >= 0) { var k = p.wig / WIG_S; rot = Math.sin(k * Math.PI * 2) * 10 * (1 - k); }
      p.pi.style.transform = 'scale(' + sc.toFixed(3) + ') rotate(' + rot.toFixed(2) + 'deg)';
      p.hd.setAttribute('opacity', Math.max(0, Math.min(1, (g - 0.25) / 0.6)).toFixed(3));
    }

    function plant(p) {
      p.age = 0; p.wig = -1;
      p.n.style.visibility = 'visible';
      paintPlant(p);
    }

    function crossings(sPrev, delta) {
      if (delta <= 0 || fadeT >= 0 || fullT > 0) { return; }
      pieces.forEach(function (pc) {
        if (pc.k !== 'row') { return; }
        for (var k = 0; k < SLOTS; k++) {
          if (mod(pc.slotS[k] - sPrev, Ltot) <= delta) {
            var p = plants[pc.row * SLOTS + k];
            if (p.age < 0) { plant(p); }
          }
        }
      });
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
      last = now;
      var df = 0;
      if (plan) {
        plan.t += dt;
        var u = Math.min(1, plan.t / plan.T), ss;
        var vT = plan.v0 * plan.T, u2 = u * u, u3 = u2 * u;
        ss = vT * (u3 - 2 * u2 + u) + plan.D * (3 * u2 - 2 * u3);
        v = Math.max(0, (vT * (3 * u2 - 4 * u + 1) + plan.D * 6 * u * (1 - u)) / plan.T);
        if (u >= 1) { ss = plan.D; v = 0; parked = true; ramp = { v0: 0, vt: 0, t: RAMP_S, dur: RAMP_S }; df = plan.s0 + ss - sUn; plan = null; }
        else { df = plan.s0 + ss - sUn; }
        var sPrev = s;
        sUn += df;
        s = parked ? 0 : mod(sUn, Ltot);
        if (parked) { sUn = 0; }
        crossings(sPrev, df);
      } else {
        ramp.t = Math.min(ramp.dur, ramp.t + dt);
        v = ramp.v0 + (ramp.vt - ramp.v0) * sm(ramp.t / ramp.dur);
        if (v < 0) { v = 0; }
        df = v * dt;
        var sp = s;
        s = mod(s + df, Ltot);
        sUn = s;
        crossings(sp, df);
      }
      odo += df;
      place();
      var ang = (df ? odo : odo) / 15 * 57.2958;
      wheels.forEach(function (w, i) {
        var a = i === 0 ? ang * 0.8 : ang * 1.2;
        w.setAttribute('transform', 'rotate(' + (a % 360).toFixed(1) + ' ' + w.getAttribute('data-cx') + ' ' + w.getAttribute('data-cy') + ')');
      });

      if (waveT >= 0) {
        waveT += dt;
        if (waveT >= WAVE_S) { waveT = -1; wave.setAttribute('transform', 'rotate(0 50 50)'); }
        else {
          var k = waveT / WAVE_S, e = Math.sin(k * Math.PI);
          wave.setAttribute('transform', 'rotate(' + (-70 * e + Math.sin(k * Math.PI * 4) * 18 * e).toFixed(2) + ' 50 50)');
        }
      }

      var full = true, any = false;
      plants.forEach(function (p) {
        if (p.age < 0) { full = false; return; }
        any = true;
        var dirty = false;
        if (p.age < GROW_S) { p.age = Math.min(GROW_S, p.age + dt); dirty = true; }
        if (p.age < GROW_S) { full = false; }
        if (p.wig >= 0) { p.wig += dt; if (p.wig >= WIG_S) { p.wig = -1; } dirty = true; }
        if (dirty) { paintPlant(p); }
      });
      if (fadeT < 0) {
        if (full && any) {
          fullT += dt;
          if (fullT >= FULL_WAIT_S) { fadeT = 0; }
        }
      } else {
        fadeT += dt;
        if (fadeT >= FADE_S) {
          plants.forEach(function (p) { p.age = -1; p.wig = -1; p.n.style.visibility = 'hidden'; });
          layer.style.opacity = '1';
          fadeT = -1; fullT = 0;
        } else { layer.style.opacity = (1 - sm(fadeT / FADE_S)).toFixed(3); }
      }
      if (!document.hidden) { raf = requestAnimationFrame(frame); }
    }

    function start() {
      if (raf || document.hidden) { return; }
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }

    var offs = [];
    function bind(node, fn, guard) {
      var h = function (e) { if (guard && guard(e)) { return; } e.preventDefault(); e.stopPropagation(); fn(); };
      var kk = function (e) { if (e.detail === 0) { fn(); } };
      node.addEventListener('pointerdown', h);
      node.addEventListener('click', kk);
      offs.push(function () { node.removeEventListener('pointerdown', h); node.removeEventListener('click', kk); });
    }
    bind(tr, onTractor, function (e) { return e.target.closest && e.target.closest('.tk-dr'); });
    bind(barn, onBarn);
    bind(driver, onDriver);
    plants.forEach(function (p) { bind(p.n, function () { onPlant(p); }); });
    var onKey = function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === tr) { e.preventDefault(); onTractor(); } };
    tr.addEventListener('keydown', onKey);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', layout);
    document.addEventListener('visibilitychange', onVis);

    layout();
    start();

    return function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      offs.forEach(function (o) { o(); });
      tr.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', layout);
      window.removeEventListener('orientationchange', layout);
      document.removeEventListener('visibilitychange', onVis);
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'traktor') { a.mount = mount; } });
})();
