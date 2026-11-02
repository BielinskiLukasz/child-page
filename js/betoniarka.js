// Activity "Betoniarka": a cement mixer truck. Three buckets (sand, water, stones; different shapes and colours) tip into the drum when tapped or
// dragged onto it (0.6 s). The drum turns while it holds anything (3 speed levels by amount) and its content blends toward the ingredient colours.
// After 3 ingredients the mix is ready (soft glow) and a 56 px chute lever appears; tapping/dragging it lowers the chute and pours the mix into the
// chosen mould (house, star or heart; tap a mould to choose, otherwise the first free one) in 2 s. A filled mould shows the finished shape; when all
// three are filled the truck wobbles and after 4 s the moulds empty for a new round. Nothing can fail and nothing is scored or stored.
// Keyboard: 1-3 add sand/water/stones, Left/Right choose a mould, Enter pours (Tab reaches every button too).
// One capped-dt rAF loop holds every state (nothing lives only in CSS keyframes), pauses while hidden and stops when idle.
// Usage metrics: track('interaction', {variant: sand|water|stones|pour}); complete() when the third mould is filled; open-ended.
(function () {
  var TIP_S = 0.6, CHUTE_S = 0.3, FILL_S = 2.0, DONE_S = 4.0, FADE_S = 0.5, BACK_S = 0.5, WOBBLE_S = 1.2, READY_N = 3, MAX_N = 8;
  var COL = { sand: [230, 200, 130], water: [79, 143, 224], stones: [141, 137, 163] };
  var KINDS = ['sand', 'water', 'stones'];
  var LABEL = { sand: 'Piasek', water: 'Woda', stones: 'Kamienie' };
  var MOULDS = ['house', 'star', 'heart'];
  var MLABEL = { house: 'Forma domek', star: 'Forma gwiazda', heart: 'Forma serce' };
  var SHAPE = {
    house: 'M10 54V28L32 10L54 28V54Z',
    star: 'M32 5L39 24L59 25L43 38L49 58L32 46L15 58L21 38L5 25L25 24Z',
    heart: 'M32 56C8 40 6 22 18 14C26 9 32 16 32 20C32 16 38 9 46 14C58 22 56 40 32 56Z'
  };
  var DETAIL = {
    house: '<rect x="26" y="38" width="12" height="16" rx="2" fill="rgba(61,58,79,.35)"/><rect x="16" y="32" width="8" height="8" rx="1" fill="rgba(255,255,255,.6)"/><rect x="40" y="32" width="8" height="8" rx="1" fill="rgba(255,255,255,.6)"/>',
    star: '<path d="M32 16L35 26L45 27L37 33L40 43L32 37L24 43L27 33L19 27L29 26Z" fill="rgba(255,255,255,.45)"/>',
    heart: '<path d="M20 22Q24 18 28 22" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="3" stroke-linecap="round"/>'
  };
  var ICON = {
    sand: '<svg class="bk-svg-i" viewBox="0 0 64 64" aria-hidden="true"><path d="M12 18H52L46 58H18Z" fill="#e6c98a" stroke="#a88a4a" stroke-width="3" stroke-linejoin="round"/><path d="M10 18Q32 4 54 18" fill="#f3dcab" stroke="#a88a4a" stroke-width="3"/><circle cx="26" cy="38" r="2.5" fill="#a88a4a"/><circle cx="38" cy="44" r="2.5" fill="#a88a4a"/><circle cx="34" cy="30" r="2.5" fill="#a88a4a"/></svg>',
    water: '<svg class="bk-svg-i" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="36" r="24" fill="#4f8fe0" stroke="#2f5fa6" stroke-width="3"/><path d="M32 14Q44 30 44 38A12 12 0 0 1 20 38Q20 30 32 14Z" fill="#cfe6ff"/><path d="M14 52Q22 46 30 52T46 52" fill="none" stroke="#2f5fa6" stroke-width="3" stroke-linecap="round"/></svg>',
    stones: '<svg class="bk-svg-i" viewBox="0 0 64 64" aria-hidden="true"><path d="M20 6H44L58 32L44 58H20L6 32Z" fill="#8d89a3" stroke="#5b5675" stroke-width="3" stroke-linejoin="round"/><path d="M22 36L32 26L44 38L36 48Z" fill="#c5c2d4"/><path d="M18 24L26 18L30 26L22 30Z" fill="#c5c2d4"/></svg>'
  };
  function moldSvg(i, id) {
    return '<svg class="bk-svg-i" viewBox="0 0 64 64" aria-hidden="true"><defs><clipPath id="bk-clip' + i + '"><path d="' + SHAPE[id] + '"/></clipPath></defs>' +
      '<path d="' + SHAPE[id] + '" fill="#efe9dd" stroke="#8d89a3" stroke-width="3" stroke-linejoin="round" stroke-dasharray="1 0"/>' +
      '<g clip-path="url(#bk-clip' + i + ')"><rect class="bk-mfill" x="0" y="64" width="64" height="64" fill="#fff"/></g>' +
      '<g class="bk-mdet" opacity="0">' + DETAIL[id] + '</g>' +
      '<path d="' + SHAPE[id] + '" fill="none" stroke="#5b5675" stroke-width="3" stroke-linejoin="round"/></svg>';
  }
  var TRUCK = '<g class="bk-truck">' +
    '<rect x="14" y="94" width="214" height="16" rx="6" fill="#5b5675"/>' +
    '<path d="M14 94V66Q14 58 24 58H52Q60 58 64 68L72 94Z" fill="#f4c24e" stroke="#c9962a" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M24 66H48Q54 66 56 72L58 82H24Z" fill="#d9eefb"/>' +
    '<defs><clipPath id="bk-drum"><ellipse cx="140" cy="68" rx="46" ry="34"/></clipPath></defs>' +
    '<g transform="rotate(-18 140 68)">' +
    '<path d="M104 46L116 22H138L150 40Z" fill="#e9a23b" stroke="#c9801a" stroke-width="3" stroke-linejoin="round"/>' +
    '<ellipse cx="140" cy="68" rx="46" ry="34" fill="#f1eef9" stroke="#8d89a3" stroke-width="4"/>' +
    '<g clip-path="url(#bk-drum)"><rect class="bk-content" x="80" y="102" width="120" height="70" fill="#fff"/>' +
    '<g class="bk-spin" opacity=".4"><path d="M80 52L200 84M80 84L200 52" stroke="#fff" stroke-width="10"/><path d="M110 24L170 112" stroke="#8d89a3" stroke-width="8"/></g></g>' +
    '<ellipse class="bk-glow" cx="140" cy="68" rx="49" ry="37" fill="none" stroke="#ffe08a" stroke-width="7" opacity="0"/>' +
    '<ellipse cx="140" cy="68" rx="46" ry="34" fill="none" stroke="#8d89a3" stroke-width="4"/></g>' +
    '<g class="bk-chute"><rect x="0" y="-5" width="40" height="10" rx="4" fill="#8d89a3" stroke="#5b5675" stroke-width="2"/></g>' +
    '<circle cx="46" cy="110" r="16" fill="#3d3a4f"/><circle cx="46" cy="110" r="7" fill="#c5c2d4"/>' +
    '<circle cx="110" cy="110" r="16" fill="#3d3a4f"/><circle cx="110" cy="110" r="7" fill="#c5c2d4"/>' +
    '<circle cx="190" cy="110" r="16" fill="#3d3a4f"/><circle cx="190" cy="110" r="7" fill="#c5c2d4"/></g>';
  var CHUTE_PIVOT = [214, 88], CHUTE_L = 40, CHUTE_UP = -38, CHUTE_DOWN = 38, MOUTH = [122, 30], TW = 250, TH = 130;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }
  function css(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'bk';
    root.tabIndex = -1;
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', 'Betoniarka. Klawisze 1, 2 i 3 dodają piasek, wodę i kamienie, Enter wylewa beton.');
    root.innerHTML = '<svg class="bk-svg" aria-hidden="true"><g class="bk-tg">' + TRUCK + '</g><path class="bk-stream" fill="none" stroke-linecap="round" opacity="0"/><g class="bk-parts"></g></svg>';
    var svg = root.querySelector('.bk-svg'), tg = root.querySelector('.bk-tg'), spin = root.querySelector('.bk-spin'), content = root.querySelector('.bk-content');
    var glow = root.querySelector('.bk-glow'), chute = root.querySelector('.bk-chute'), stream = root.querySelector('.bk-stream'), parts = root.querySelector('.bk-parts');
    var NS = 'http://www.w3.org/2000/svg';
    var buckets = KINDS.map(function (k) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bk-bucket'; b.setAttribute('aria-label', LABEL[k]); b.innerHTML = ICON[k];
      root.appendChild(b);
      return { id: k, node: b, x: 0, y: 0, hx: 0, hy: 0, sz: 80, mode: 'home', t: 0, x0: 0, y0: 0, tilt: 0 };
    });
    var moulds = MOULDS.map(function (m, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bk-mould'; b.setAttribute('aria-label', MLABEL[m]); b.innerHTML = moldSvg(i, m);
      root.appendChild(b);
      return { id: m, node: b, fillEl: b.querySelector('.bk-mfill'), detEl: b.querySelector('.bk-mdet'), x: 0, y: 0, sz: 80, state: 'empty', fill: 0, col: [255, 255, 255], alpha: 1 };
    });
    var lever = document.createElement('button');
    lever.type = 'button'; lever.className = 'bk-lever'; lever.setAttribute('aria-label', 'Dźwignia rynny'); lever.style.visibility = 'hidden';
    lever.innerHTML = '<svg class="bk-svg-i" viewBox="0 0 40 40" aria-hidden="true"><rect x="16" y="4" width="8" height="26" rx="4" fill="#8d89a3"/><circle cx="20" cy="8" r="7" fill="#e5586b"/><rect x="8" y="30" width="24" height="7" rx="3" fill="#5b5675"/></svg>';
    root.appendChild(lever);
    container.appendChild(root);

    var W = 320, H = 480, s = 1, tx = 0, ty = 0, drumC = [0, 0], mouthP = [0, 0];
    var P = {
      n: 0, counts: { sand: 0, water: 0, stones: 0 }, pend: 0,
      col: [255, 255, 255], c0: [255, 255, 255], c1: [255, 255, 255], cT: 1, cD: 0.5,
      lv: 0, lv0: 0, lv1: 0, lvT: 1, lvD: 0.4,
      angle: 0, speed: 0, ready: 0, leverA: 0, bobT: 0,
      phase: 'idle', t: 0, target: -1, sel: 0, chuteA: 0, wob: -1, doneT: -1
    };
    var flights = [], drag = null, raf = 0, last = 0, alive = true;

    function levelOf(n) { return n <= 0 ? 0 : n < 3 ? 1 : n < 5 ? 2 : 3; }
    var SPEEDS = [0, 90, 180, 320];
    function targetCol() {
      var tot = P.counts.sand + P.counts.water + P.counts.stones, c = [0, 0, 0];
      if (!tot) { return [255, 255, 255]; }
      KINDS.forEach(function (k) { for (var j = 0; j < 3; j++) { c[j] += COL[k][j] * P.counts[k] / tot; } });
      return c;
    }
    function tweenCol(c, d) { P.c0 = P.col.slice(); P.c1 = c; P.cT = 0; P.cD = d; }
    function tweenLv(v, d) { P.lv0 = P.lv; P.lv1 = v; P.lvT = 0; P.lvD = d; }
    function lvFor(n) { return n <= 0 ? 0 : clamp(0.2 + 0.09 * n, 0, 0.82); }

    function layout() {
      var r = container.getBoundingClientRect();
      W = Math.max(280, r.width || window.innerWidth); H = Math.max(240, r.height || window.innerHeight);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var wide = W > H * 1.3, bs, ms, box;
      var top = 56;
      if (wide) {
        bs = clamp(Math.min((H - top - 24) / 3 - 8, 100), 72, 100); ms = clamp(Math.min((H - top - 24) / 3 - 8, 96), 64, 96);
        buckets.forEach(function (b, i) { b.sz = bs; b.hx = bs / 2 + 14; b.hy = top + 8 + bs / 2 + i * (bs + 8); });
        moulds.forEach(function (m, i) { m.sz = ms; m.x = W - ms - 14; m.y = top + 8 + i * (ms + 8); });
        box = { x: bs + 24, y: top, w: W - bs - ms - 56, h: H - top - 10 };
      } else {
        bs = clamp(Math.min(W / 3.6, 100), 72, 100); ms = clamp(Math.min(W / 3.6, (H - top) * 0.2, 96), 64, 96);
        buckets.forEach(function (b, i) { b.sz = bs; b.hx = W / 3 * (i + 0.5); b.hy = top + bs / 2; });
        moulds.forEach(function (m, i) { m.sz = ms; m.x = W / 3 * (i + 0.5) - ms / 2; m.y = H - ms - 10; });
        box = { x: 4, y: top + bs + 6, w: W - 8, h: H - ms - 10 - (top + bs + 6) - 6 };
      }
      s = Math.max(0.3, Math.min(box.w / TW, box.h / TH));
      tx = box.x + (box.w - TW * s) / 2; ty = box.y + (box.h - TH * s) / 2;
      drumC = [tx + 140 * s, ty + 68 * s]; mouthP = [tx + MOUTH[0] * s, ty + MOUTH[1] * s];
      lever.style.width = lever.style.height = clamp(56 * Math.max(1, s * 0.9), 56, 72) + 'px';
      buckets.forEach(function (b) {
        b.node.style.width = b.node.style.height = b.sz + 'px';
        if (b.mode === 'home') { b.x = b.hx; b.y = b.hy; }
      });
      moulds.forEach(function (m) { m.node.style.width = m.node.style.height = m.sz + 'px'; m.node.style.transform = 'translate(' + m.x.toFixed(1) + 'px,' + m.y.toFixed(1) + 'px)'; });
      render();
    }
    function chuteEnd(a) {
      var rad = a * Math.PI / 180;
      return [tx + (CHUTE_PIVOT[0] + CHUTE_L * Math.cos(rad)) * s, ty + (CHUTE_PIVOT[1] + CHUTE_L * Math.sin(rad)) * s];
    }
    function overDrum(x, y) { return Math.abs(x - drumC[0]) < 60 * s + 20 && Math.abs(y - drumC[1]) < 44 * s + 20; }
    function freeMould() {
      if (moulds[P.sel] && moulds[P.sel].state === 'empty') { return P.sel; }
      for (var i = 0; i < moulds.length; i++) { if (moulds[i].state === 'empty') { return i; } }
      return -1;
    }

    function add(kind, from) {
      if (P.phase === 'pour') { return false; }
      var b = buckets[KINDS.indexOf(kind)];
      if (b.mode !== 'home' && b.mode !== 'back' && b.mode !== 'drag') { return false; }
      b.x0 = from ? from[0] : b.x; b.y0 = from ? from[1] : b.y; b.mode = 'tip'; b.t = 0;
      report(function (A) { A.track('interaction', { variant: kind }); });
      return true;
    }
    function land(kind) {
      P.counts[kind]++; P.n = Math.min(MAX_N, P.n + 1);
      tweenCol(targetCol(), 0.5); tweenLv(lvFor(P.n), 0.4);
    }
    function pour() {
      if (P.phase !== 'idle' || P.n < READY_N) { return; }
      var i = freeMould(); if (i < 0) { return; }
      P.target = i; P.sel = i; P.phase = 'pour'; P.t = 0;
      moulds[i].col = P.c1.slice(); moulds[i].fill = 0; moulds[i].state = 'filling';
      P.pourLv = P.lv;
      report(function (A) { A.track('interaction', { variant: 'pour' }); });
    }
    function finishPour() {
      var m = moulds[P.target]; m.state = 'done'; m.fill = 1;
      P.n = 0; P.counts = { sand: 0, water: 0, stones: 0 }; P.col = [255, 255, 255]; P.cT = 1; P.lv = 0; P.lvT = 1;
      P.phase = 'idle'; P.target = -1;
      var all = moulds.every(function (x) { return x.state === 'done'; });
      if (all) { P.phase = 'done'; P.doneT = 0; P.wob = 0; report(function (A) { A.complete(); }); }
      else { P.sel = freeMould(); }
    }

    function render() {
      var wobA = P.wob >= 0 ? Math.sin(P.wob / 0.15 * Math.PI) * 3 * (1 - clamp(P.wob / WOBBLE_S, 0, 1)) : 0;
      tg.setAttribute('transform', 'translate(' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ') rotate(' + wobA.toFixed(2) + ' ' + (TW / 2) + ' ' + (TH - 20) + ') scale(' + s.toFixed(4) + ')');
      var chA = CHUTE_UP + (CHUTE_DOWN - CHUTE_UP) * P.chuteA;
      chute.setAttribute('transform', 'translate(' + CHUTE_PIVOT[0] + ' ' + CHUTE_PIVOT[1] + ') rotate(' + chA.toFixed(1) + ')');
      spin.setAttribute('transform', 'rotate(' + (P.angle % 360).toFixed(1) + ' 140 68)');
      var top = 102 - 68 * P.lv;
      content.setAttribute('y', top.toFixed(1)); content.setAttribute('fill', css(P.col));
      glow.setAttribute('opacity', (P.ready * (0.55 + 0.25 * Math.sin(P.bobT * 4))).toFixed(3));
      // lever follows the truck rear, lowered with the chute
      var lw = parseFloat(lever.style.width) || 56;
      var lx = clamp(tx + 236 * s - lw / 2, 4, W - lw - 4), ly = clamp(ty + 20 * s, 56, H - lw - 4);
      lever.style.transform = 'translate(' + lx.toFixed(1) + 'px,' + ly.toFixed(1) + 'px) rotate(' + (P.chuteA * 40).toFixed(1) + 'deg)';
      lever.style.opacity = P.leverA.toFixed(3);
      lever.style.visibility = P.leverA <= 0.001 ? 'hidden' : 'visible';
      // stream
      if (P.phase === 'pour' && P.t >= CHUTE_S && P.t < CHUTE_S + FILL_S + 0.05) {
        var e = chuteEnd(CHUTE_DOWN), m = moulds[P.target], mx = m.x + m.sz / 2, my = m.y + m.sz * 0.2;
        stream.setAttribute('d', 'M' + e[0].toFixed(1) + ' ' + e[1].toFixed(1) + 'Q' + (e[0] + 10).toFixed(1) + ' ' + ((e[1] + my) / 2).toFixed(1) + ' ' + mx.toFixed(1) + ' ' + my.toFixed(1));
        stream.setAttribute('stroke', css(m.col)); stream.setAttribute('stroke-width', (9 * Math.max(0.6, s)).toFixed(1)); stream.setAttribute('opacity', '1');
      } else { stream.setAttribute('opacity', '0'); }
      // moulds
      moulds.forEach(function (m, i) {
        var f = m.state === 'done' ? 1 : m.state === 'filling' ? m.fill : 0;
        m.fillEl.setAttribute('y', (64 - 64 * f).toFixed(1)); m.fillEl.setAttribute('fill', css(m.col));
        m.detEl.setAttribute('opacity', m.state === 'done' ? '1' : '0');
        m.node.style.opacity = m.alpha.toFixed(3);
        m.node.classList.toggle('bk-sel', i === P.sel && m.state === 'empty');
      });
      // buckets
      buckets.forEach(function (b) {
        b.node.style.transform = 'translate(' + (b.x - b.sz / 2).toFixed(1) + 'px,' + (b.y - b.sz / 2 - (b.mode === 'drag' ? 8 : 0)).toFixed(1) + 'px) rotate(' + b.tilt.toFixed(1) + 'deg)';
        b.node.classList.toggle('bk-lift', b.mode === 'drag');
      });
      // falling pellets
      while (parts.firstChild) { parts.removeChild(parts.firstChild); }
      flights.forEach(function (f) {
        var u = f.t / TIP_S;
        for (var j = 0; j < 4; j++) {
          var q = clamp((u - 0.25 - j * 0.1) / 0.3, 0, 1);
          if (q <= 0 || q >= 1) { continue; }
          var sx = f.b.x, sy = f.b.y, ex = mouthP[0], ey = mouthP[1];
          var px = sx + (ex - sx) * q, py = sy + (ey - sy) * q - Math.sin(q * Math.PI) * 30;
          var c = document.createElementNS(NS, 'circle');
          c.setAttribute('cx', px.toFixed(1)); c.setAttribute('cy', py.toFixed(1)); c.setAttribute('r', (5 * Math.max(0.7, s)).toFixed(1));
          c.setAttribute('fill', css(COL[f.b.id])); parts.appendChild(c);
        }
      });
    }

    function step(dt) {
      P.bobT += dt; P.t += dt;
      // bucket tips
      flights = flights.filter(function (f) { return f.b.mode === 'tip'; });
      buckets.forEach(function (b) {
        if (b.mode === 'tip') {
          b.t += dt; var u = clamp(b.t / TIP_S, 0, 1), e = ease(u);
          b.x = b.x0 + (b.hx - b.x0) * e; b.y = b.y0 + (b.hy - b.y0) * e;
          b.tilt = (drumC[0] >= b.hx ? 1 : -1) * 55 * Math.sin(Math.PI * clamp(u * 1.2, 0, 1));
          if (!b.fl) { b.fl = { b: b, t: 0 }; flights.push(b.fl); }
          b.fl.t = b.t;
          if (!b.landed && u >= 0.8) { b.landed = true; land(b.id); }
          if (b.t >= TIP_S) { b.mode = 'home'; b.x = b.hx; b.y = b.hy; b.tilt = 0; b.fl = null; b.landed = false; }
        } else if (b.mode === 'back') {
          b.t += dt; var e2 = ease(b.t / BACK_S);
          b.x = b.x0 + (b.hx - b.x0) * e2; b.y = b.y0 + (b.hy - b.y0) * e2;
          if (b.t >= BACK_S) { b.mode = 'home'; b.x = b.hx; b.y = b.hy; }
        }
      });
      if (P.cT < 1) {
        P.cT = Math.min(1, P.cT + dt / P.cD); var ce = ease(P.cT);
        P.col = [0, 1, 2].map(function (k) { return P.c0[k] + (P.c1[k] - P.c0[k]) * ce; });
      }
      if (P.lvT < 1) { P.lvT = Math.min(1, P.lvT + dt / P.lvD); P.lv = P.lv0 + (P.lv1 - P.lv0) * ease(P.lvT); }
      // pour sequence
      if (P.phase === 'pour') {
        var m = moulds[P.target];
        P.chuteA = P.t < CHUTE_S ? ease(P.t / CHUTE_S) : P.t < CHUTE_S + FILL_S ? 1 : 1 - ease((P.t - CHUTE_S - FILL_S) / CHUTE_S);
        var fu = clamp((P.t - CHUTE_S) / FILL_S, 0, 1);
        m.fill = fu; P.lv = P.pourLv * (1 - fu); P.lvT = 1;
        if (P.t >= CHUTE_S + FILL_S + CHUTE_S) { P.chuteA = 0; finishPour(); }
      } else if (P.chuteA > 0) { P.chuteA = Math.max(0, P.chuteA - dt / CHUTE_S); }
      // drum
      var goal = P.phase === 'pour' ? (P.lv > 0.01 ? SPEEDS[levelOf(P.n || 1)] : 0) : SPEEDS[levelOf(P.n)];
      P.speed += (goal - P.speed) * Math.min(1, dt * 4);
      if (Math.abs(goal - P.speed) < 1) { P.speed = goal; }
      P.angle += P.speed * dt;
      var rdy = P.phase === 'idle' && P.n >= READY_N ? 1 : 0;
      P.ready += (rdy - P.ready) * Math.min(1, dt * 6); if (Math.abs(rdy - P.ready) < 0.01) { P.ready = rdy; }
      P.leverA += ((rdy ? 1 : 0) - P.leverA) * Math.min(1, dt * 10); if (Math.abs((rdy ? 1 : 0) - P.leverA) < 0.01) { P.leverA = rdy ? 1 : 0; }
      // finished round
      if (P.phase === 'done') {
        P.doneT += dt; P.wob = P.doneT;
        if (P.wob > WOBBLE_S) { P.wob = -1; }
        if (P.doneT >= DONE_S - FADE_S) {
          var fa = 1 - clamp((P.doneT - (DONE_S - FADE_S)) / FADE_S, 0, 1);
          moulds.forEach(function (x) { x.alpha = fa; });
        }
        if (P.doneT >= DONE_S) {
          moulds.forEach(function (x) { x.state = 'empty'; x.fill = 0; x.alpha = 1; x.col = [255, 255, 255]; });
          P.phase = 'idle'; P.wob = -1; P.doneT = -1; P.sel = 0;
        }
      }
    }
    function busy() {
      if (P.phase !== 'idle' || P.n > 0 || P.speed > 0 || P.cT < 1 || P.lvT < 1 || P.chuteA > 0 || P.leverA > 0 || P.ready > 0) { return true; }
      return buckets.some(function (b) { return b.mode === 'tip' || b.mode === 'back'; });
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

    function localPt(e) { var r = root.getBoundingClientRect(); return [clamp(e.clientX - r.left, 0, W), clamp(e.clientY - r.top, 0, H)]; }
    buckets.forEach(function (b) {
      var node = b.node, moved = false, sx = 0, sy = 0;
      node.addEventListener('pointerdown', function (e) {
        if (drag || b.mode === 'tip' || P.phase === 'pour') { return; }
        drag = { id: e.pointerId, b: b }; moved = false;
        var p = localPt(e); sx = p[0]; sy = p[1];
        b.mode = 'drag'; b.x = p[0]; b.y = p[1];
        try { node.setPointerCapture(e.pointerId); } catch (x) { /* unsupported */ }
        render(); e.preventDefault();
      });
      node.addEventListener('pointermove', function (e) {
        if (!drag || drag.b !== b || e.pointerId !== drag.id) { return; }
        var p = localPt(e); b.x = p[0]; b.y = p[1];
        if (Math.abs(p[0] - sx) + Math.abs(p[1] - sy) > 10) { moved = true; }
        render();
      });
      function release(e, cancel) {
        if (!drag || drag.b !== b || e.pointerId !== drag.id) { return; }
        drag = null;
        try { node.releasePointerCapture(e.pointerId); } catch (x) { /* already released */ }
        var from = [b.x, b.y];
        if (!cancel && (!moved || overDrum(b.x, b.y)) && add(b.id, moved ? from : null)) { /* tipping */ }
        else { b.mode = 'back'; b.t = 0; b.x0 = b.x; b.y0 = b.y; }
        render(); start();
      }
      node.addEventListener('pointerup', function (e) { release(e, false); });
      node.addEventListener('pointercancel', function (e) { release(e, true); });
      node.addEventListener('click', function (e) {
        if (e.detail !== 0) { return; }   // pointer taps are handled above
        if (add(b.id, null)) { render(); start(); }
      });
    });
    moulds.forEach(function (m, i) {
      m.node.addEventListener('click', function () {
        if (m.state === 'empty' && P.phase !== 'pour') { P.sel = i; render(); }
      });
    });
    var lp = null;
    lever.addEventListener('pointerdown', function (e) { lp = e.pointerId; try { lever.setPointerCapture(e.pointerId); } catch (x) { /* unsupported */ } e.preventDefault(); });
    lever.addEventListener('pointerup', function (e) { if (lp === e.pointerId) { lp = null; pour(); render(); start(); } });
    lever.addEventListener('pointercancel', function () { lp = null; });
    lever.addEventListener('click', function (e) { if (e.detail === 0) { pour(); render(); start(); } });

    function onKey(e) {
      var k = e.key;
      if (k === '1' || k === '2' || k === '3') {
        if (add(KINDS[+k - 1], null)) { render(); start(); }
      } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
        if (P.phase === 'pour') { return; }
        var d = k === 'ArrowLeft' ? -1 : 1, i = P.sel;
        for (var j = 0; j < moulds.length; j++) {
          i = (i + d + moulds.length) % moulds.length;
          if (moulds[i].state === 'empty') { P.sel = i; break; }
        }
        render(); e.preventDefault();
      } else if (k === 'Enter' && !(e.target && e.target.tagName === 'BUTTON')) {
        pour(); render(); start();
      }
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    layout();
    start();

    return function cleanup() {
      alive = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'betoniarka') { a.mount = mount; } });
})();
