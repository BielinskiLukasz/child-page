// Activity "Rozmiar": five nesting cups (or matryoshka dolls) of clearly different sizes lie scattered on a table.
// Drag one onto a bigger one and it slides inside with a soft click (a small squash, no sound); dropping it on a smaller
// one just drifts it back in 0.5 s. A nested item keeps its own contents, so any item lifts out (with what is inside it)
// and the smallest comes out alone. When all five are one stack it glows for 3 s, the animal in the biggest item waves,
// then a new random set (cups or dolls, new colours, never the same twice in a row) is laid out on the table.
// One capped-dt rAF loop (works under prefers-reduced-motion, pauses when hidden, stops when idle); nothing is stored.
(function () {
  var N = 5, RATIO = 1.28, BASE_H = 56, ASPECT = 0.76, RISE = 0.08;
  var GLOW_MS = 3000, OUT_MS = 500, IN_MS = 600, DRIFT_MS = 500, NEST_MS = 450, PULSE_MS = 260, MOVE_PX = 6;
  var SETS = [
    { id: 'cup0', kind: 'cup', c1: '#f7a8c9', c2: '#fdf6ec' }, { id: 'cup1', kind: 'cup', c1: '#a8d8f0', c2: '#ffd98a' },
    { id: 'cup2', kind: 'cup', c1: '#bfe6b4', c2: '#f9f1d0' }, { id: 'cup3', kind: 'cup', c1: '#c9b8f2', c2: '#fdf6ec' },
    { id: 'cup4', kind: 'cup', c1: '#ffc9a0', c2: '#a8d8f0' }, { id: 'cup5', kind: 'cup', c1: '#a8e6d4', c2: '#f7a8c9' },
    { id: 'doll0', kind: 'doll', c1: '#ee6a5f', c2: '#ffd98a' }, { id: 'doll1', kind: 'doll', c1: '#5fa8e0', c2: '#fdf6ec' },
    { id: 'doll2', kind: 'doll', c1: '#7fc58a', c2: '#ffe27a' }, { id: 'doll3', kind: 'doll', c1: '#b58ae0', c2: '#ffd98a' },
    { id: 'doll4', kind: 'doll', c1: '#f4a261', c2: '#fdf6ec' }, { id: 'doll5', kind: 'doll', c1: '#e88fb4', c2: '#a8e6d4' }
  ];
  var FACE = '#fde4cf', INK = '#5b5675';

  function itemSvg(set) {
    var s;
    if (set.kind === 'cup') {
      s = '<path d="M8 14H68L60 94Q59 98 55 98H21Q17 98 16 94Z" fill="' + set.c1 + '"/>' +
        '<path d="M11 48H65L63 62H13Z" fill="' + set.c2 + '"/>' +
        '<rect x="3" y="8" width="70" height="11" rx="5.5" fill="' + set.c2 + '"/>' +
        '<path d="M16 28q-1 6 0 12" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>';
    } else {
      s = '<path d="M38 4C56 4 66 22 66 44C66 70 72 80 68 90Q64 98 38 98Q12 98 8 90C4 80 10 70 10 44C10 22 20 4 38 4Z" fill="' + set.c1 + '"/>' +
        '<circle cx="38" cy="34" r="14" fill="' + FACE + '"/>' +
        '<path d="M14 36C12 8 64 8 62 36C56 22 20 22 14 36Z" fill="' + set.c2 + '"/>' +
        '<circle cx="33" cy="36" r="1.8" fill="' + INK + '"/><circle cx="43" cy="36" r="1.8" fill="' + INK + '"/>' +
        '<circle cx="38" cy="72" r="15" fill="' + set.c2 + '"/><circle cx="38" cy="72" r="5.5" fill="' + set.c1 + '"/>';
    }
    return '<svg class="rz-svg" viewBox="0 0 76 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + s + '</svg>';
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }
  function shuffled(a) {
    var r = a.slice(), i, j, t;
    for (i = r.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = r[i]; r[i] = r[j]; r[j] = t; }
    return r;
  }

  function mount(container) {
    container.style.display = 'block';
    var board = document.createElement('div');
    board.className = 'rz';
    board.innerHTML = '<div class="rz-field"></div>';
    container.appendChild(board);
    var field = board.querySelector('.rz-field');

    var fw = 0, fh = 0, k = 1, headSize = 0, headExtra = 0;
    var set = null, animalId = null;
    var phase = 'play', phaseT = 0, glow = 0, waveT = 0, alpha = 1;
    var raf = 0, last = 0;
    var dragIt = null, drag = null, kb = { sel: null, targets: [], ti: 0 };
    var items = [], TABLE = { table: true };

    for (var i = 0; i < N; i++) { items.push(makeItem(i)); }
    function makeItem(idx) {
      var el = document.createElement('button');
      el.type = 'button'; el.className = 'rz-item';
      el.setAttribute('aria-pressed', 'false');
      var it = { i: idx, el: el, H: 0, W: 0, x: 0, y: 0, tx: 0, ty: 0, fx: 0, fy: 0, gt: 0, gd: 1, glide: false,
        inside: null, inner: null, fax: 0.5, fay: 0.5, pt: PULSE_MS, nestFlag: false, head: null };
      el.style.zIndex = String(1 + (N - 1 - idx));
      field.appendChild(el);
      el.addEventListener('pointerdown', function (e) { down(it, e); });
      el.addEventListener('pointermove', function (e) { move(it, e); });
      el.addEventListener('pointerup', function (e) { up(it, e, false); });
      el.addEventListener('pointercancel', function (e) { up(it, e, true); });
      el.addEventListener('click', function (e) { if (e.detail === 0) { kbClick(it); } });
      return it;
    }

    function chainOf(r) { var c = []; while (r) { c.push(r); r = r.inner; } return c; }
    function rootOf(it) { while (it.inside) { it = it.inside; } return it; }

    function paintSet() {
      var noun = set.kind === 'cup' ? 'Kubek' : 'Matrioszka';
      items.forEach(function (it) {
        var html = itemSvg(set);
        it.head = null;
        if (it.i === N - 1 && animalId && window.Animals) {
          html = '<span class="rz-head"><svg class="rz-hsvg" viewBox="-18 -18 36 36" aria-hidden="true" focusable="false">' +
            window.Animals.head(animalId) + '</svg></span>' + html;
        }
        it.el.innerHTML = html;
        it.head = it.el.querySelector('.rz-head');
        it.el.setAttribute('aria-label', noun + ' ' + (it.i + 1) + ' z ' + N + ' (Enter lub spacja, potem wybierz większy)');
      });
      sizeItems();
    }
    function sizeItems() {
      items.forEach(function (it) {
        it.H = BASE_H * k * Math.pow(RATIO, it.i); it.W = it.H * ASPECT;
        it.el.style.width = it.W + 'px'; it.el.style.height = it.H + 'px';
        if (it.head) {
          it.head.style.width = headSize + 'px'; it.head.style.height = headSize + 'px';
          it.head.style.left = ((it.W - headSize) / 2) + 'px'; it.head.style.top = (-headExtra) + 'px';
        }
      });
    }
    function newSet() {
      set = Rand.pickOne(SETS, 'rozmiar');
      var a = window.Animals ? window.Animals.pick(1) : null;
      animalId = a && a[0] ? a[0].id : null;
    }

    function clampRoot(r) {
      var ax = r.fax * fw, ay = r.fay * fh;
      var top = r.H + (r.i === N - 1 ? headExtra : 0);
      ax = Math.max(r.W / 2 + 2, Math.min(fw - r.W / 2 - 2, ax));
      ay = Math.max(top + 2, Math.min(fh - 2, ay));
      r.fax = fw ? ax / fw : 0.5; r.fay = fh ? ay / fh : 0.5;
      return [ax, ay];
    }
    // Rest positions of every root and the items nested in it.
    function computeTargets() {
      items.forEach(function (r) {
        if (r.inside) { return; }
        var p = clampRoot(r), bottom = p[1];
        chainOf(r).forEach(function (it) {
          it.tx = p[0]; it.ty = bottom; bottom -= RISE * it.H;
        });
      });
    }
    function glideTo(it, x, y, dur) {
      it.fx = it.x; it.fy = it.y; it.tx = x; it.ty = y; it.gt = 0; it.gd = Math.max(1, dur); it.glide = true;
      start();
    }
    // Move every item that is not being dragged to its rest position (instantly when dur is 0).
    function settle(dur) {
      computeTargets();
      items.forEach(function (it) {
        if (it.drag) { return; }
        if (dur > 0 && Math.hypot(it.tx - it.x, it.ty - it.y) > 0.5) { glideTo(it, it.tx, it.ty, dur); }
        else if (!it.glide || dur === 0) { it.glide = false; it.x = it.tx; it.y = it.ty; }
      });
      paint();
    }
    function scatter() {
      var portrait = fh >= fw;
      var order = shuffled(items);
      var rows = portrait ? [order.slice(0, 2), order.slice(2, 4), order.slice(4)] : [order];
      var rh = rows.map(function (row) {
        return row.reduce(function (m, it) { return Math.max(m, it.H + (it.i === N - 1 ? headExtra : 0)); }, 0);
      });
      var free = fh - rh.reduce(function (s, v) { return s + v; }, 0);
      var gap = Math.max(4, free / (rows.length + 1)), top = gap;
      rows.forEach(function (row, ri) {
        var sw = row.reduce(function (s, it) { return s + it.W; }, 0);
        var hg = Math.max(4, (fw - sw) / (row.length + 1)), x = hg;
        row.forEach(function (it) {
          var jx = (Math.random() - 0.5) * hg * 0.5;
          var slack = rh[ri] - it.H - (it.i === N - 1 ? headExtra : 0);
          var by = top + rh[ri] - Math.random() * slack * 0.8;
          it.inside = null; it.inner = null;
          it.fax = (x + it.W / 2 + jx) / fw; it.fay = by / fh;
          x += it.W + hg;
        });
        top += rh[ri] + gap;
      });
      items.forEach(function (it) { it.glide = false; });
      settle(0);
    }

    function layout() {
      var r = field.getBoundingClientRect();
      var ow = fw, oh = fh;
      fw = r.width; fh = r.height;
      var portrait = fh >= fw;
      k = Math.max(1, Math.min(1.4, fw / 330, portrait ? fh / 360 : fh / 240));
      var bigW = BASE_H * k * Math.pow(RATIO, N - 1) * ASPECT;
      headSize = bigW * 0.5; headExtra = headSize * 0.45;
      sizeItems();
      if (!ow || !oh) { scatter(); } else { settle(0); }
    }

    function place(it) {
      var s = 1;
      if (it.pt < PULSE_MS) { s = 1 + 0.05 * Math.sin(Math.PI * it.pt / PULSE_MS); }
      it.el.style.transform = 'translate(' + (it.x - it.W / 2).toFixed(1) + 'px,' + (it.y - it.H).toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
    }
    function paint() {
      var full = chainOf(rootOf(items[N - 1])).length === N;
      items.forEach(function (it) {
        place(it);
        it.el.style.opacity = alpha < 0.999 ? alpha.toFixed(3) : '';
        it.el.style.filter = full && glow > 0.01 ? 'drop-shadow(0 0 ' + (6 + 16 * glow).toFixed(1) + 'px #ffe08a)' : '';
        if (it.head) {
          it.head.style.transform = waveT > 0 && glow > 0.01 ? 'rotate(' + (16 * glow * Math.sin(waveT * 2 * Math.PI * 0.7)).toFixed(1) + 'deg)' : '';
        }
      });
    }

    // ---- nesting model -------------------------------------------------------------------------------------
    function detach(it) {
      var c = it.inside;
      if (c) { c.inner = null; it.inside = null; }
      return c;
    }
    function nest(it, B) {
      var G = chainOf(it), contents = chainOf(B.inner);
      contents.forEach(function (c) { c.inside = null; });
      B.inner = null;
      var merged = G.concat(contents).sort(function (a, b) { return b.i - a.i; });
      var prev = B;
      merged.forEach(function (m) { prev.inner = m; m.inside = prev; m.inner = null; prev = m; });
      G.forEach(function (g) { g.nestFlag = true; });
      report(function (A) { A.track('interaction', { variant: 's' + (it.i + 1) }); });
      settle(NEST_MS);
      if (chainOf(rootOf(B)).length === N && phase === 'play') {
        report(function (A) { A.complete(); });
        phase = 'pre'; phaseT = 0; start();
      }
    }
    function liftOut(it) {
      var c = detach(it);
      if (!c) { return; }
      var side = c.x + c.W / 2 + it.W + 14 <= fw ? 1 : -1;
      var ax = c.x + side * (c.W / 2 + it.W / 2 + 14);
      it.fax = ax / fw; it.fay = c.y / fh;
      settle(NEST_MS);
    }

    // ---- pointer ---------------------------------------------------------------------------------------------
    function down(it, e) {
      if (phase !== 'play' || dragIt || (e.button !== undefined && e.button > 0)) { return; }
      clearKb();
      var r = field.getBoundingClientRect();
      var cont = it.inside;
      drag = { pid: e.pointerId, cont: cont, ofax: it.fax, ofay: it.fay, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0 };
      dragIt = it;
      if (cont) { detach(it); it.fax = it.x / fw; it.fay = it.y / fh; }
      drag.dx = it.x - (e.clientX - r.left); drag.dy = it.y - (e.clientY - r.top);
      chainOf(it).forEach(function (g) { g.drag = true; g.glide = false; g.el.style.zIndex = String(20 + (N - g.i)); });
      try { it.el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      settle(0);
      e.preventDefault();
    }
    function move(it, e) {
      if (it !== dragIt || e.pointerId !== drag.pid) { return; }
      var r = field.getBoundingClientRect();
      it.fax = (e.clientX - r.left + drag.dx) / fw; it.fay = (e.clientY - r.top + drag.dy) / fh;
      computeTargets();
      chainOf(it).forEach(function (g) { g.x = g.tx; g.y = g.ty; });
      paint();
    }
    function endDrag() {
      chainOf(dragIt).forEach(function (g) { g.drag = false; g.el.style.zIndex = String(1 + (N - 1 - g.i)); });
      try { dragIt.el.releasePointerCapture(drag.pid); } catch (err) { /* already released */ }
      dragIt = null;
    }
    function restore(it, d, dur) {
      if (d.cont) {
        d.cont.inner = it; it.inside = d.cont;
      } else { it.fax = d.ofax; it.fay = d.ofay; }
      settle(dur);
    }
    function up(it, e, cancelled) {
      if (it !== dragIt || e.pointerId !== drag.pid) { return; }
      var d = drag;
      endDrag();
      var moved = Math.hypot(e.clientX - d.sx, e.clientY - d.sy);
      if (cancelled || phase !== 'play') { restore(it, d, DRIFT_MS); return; }
      if (moved < MOVE_PX) { restore(it, d, 120); return; }
      var G = chainOf(it), cx = it.x, cy = it.y - it.H / 2, best = null, bd = 1e9, hitSmaller = false;
      items.forEach(function (B) {
        if (G.indexOf(B) >= 0) { return; }
        if (Math.abs(cx - B.x) > B.W / 2 || cy > B.y || cy < B.y - B.H) { return; }
        if (B.i > it.i) {
          var dd = Math.hypot(cx - B.x, cy - (B.y - B.H / 2));
          if (dd < bd) { bd = dd; best = B; }
        } else { hitSmaller = true; }
      });
      if (best) { nest(it, best); }
      else if (hitSmaller) { restore(it, d, DRIFT_MS); }
      else { settle(DRIFT_MS); }
    }
    function cancelDrag() {
      if (!dragIt) { return; }
      var it = dragIt, d = drag;
      endDrag();
      restore(it, d, DRIFT_MS);
    }

    // ---- keyboard --------------------------------------------------------------------------------------------
    function targetsFor(sel) {
      var list = sel.inside ? [TABLE] : [];
      items.forEach(function (B) {
        if (B.i <= sel.i) { return; }
        for (var a = sel.inside; a; a = a.inside) { if (a === B) { return; } }
        list.push(B);
      });
      return list;
    }
    function paintKb() {
      var t = kb.sel ? kb.targets[kb.ti] : null;
      items.forEach(function (it) {
        var on = it === kb.sel;
        it.el.setAttribute('aria-pressed', on ? 'true' : 'false');
        it.el.classList.toggle('rz-sel', on);
        it.el.classList.toggle('rz-tgt', !!t && t === it);
        it.el.classList.toggle('rz-lift', on && t === TABLE);
      });
    }
    function clearKb() { kb.sel = null; kb.targets = []; kb.ti = 0; paintKb(); }
    function commitKb() {
      var sel = kb.sel, t = kb.targets[kb.ti];
      clearKb();
      if (!sel || !t) { return; }
      if (t === TABLE) { liftOut(sel); } else { detach(sel); nest(sel, t); }
    }
    function kbClick(it) {
      if (phase !== 'play' || dragIt) { return; }
      if (kb.sel && kb.sel !== it) {
        var ix = kb.targets.indexOf(it);
        if (ix >= 0) { kb.ti = ix; commitKb(); return; }
      }
      if (kb.sel === it) { commitKb(); return; }
      kb.sel = it; kb.targets = targetsFor(it); kb.ti = 0;
      if (!kb.targets.length) { kb.sel = null; }
      paintKb();
    }
    function onKey(e) {
      if (!kb.sel) { return; }
      var key = e.key;
      if (key === 'Escape') { clearKb(); e.preventDefault(); return; }
      var n = kb.targets.length;
      if (key === 'ArrowRight' || key === 'ArrowDown') { kb.ti = (kb.ti + 1) % n; }
      else if (key === 'ArrowLeft' || key === 'ArrowUp') { kb.ti = (kb.ti + n - 1) % n; }
      else { return; }
      e.preventDefault();
      paintKb();
    }

    // ---- loop ------------------------------------------------------------------------------------------------
    function frame(now) {
      raf = 0;
      var dt = Math.min(now - last, 50); last = now;
      var busy = false, gliding = false;
      items.forEach(function (it) {
        if (it.glide) {
          it.gt += dt;
          var q = smooth(it.gt / it.gd);
          it.x = it.fx + (it.tx - it.fx) * q; it.y = it.fy + (it.ty - it.fy) * q;
          if (it.gt >= it.gd) {
            it.glide = false; it.x = it.tx; it.y = it.ty;
            if (it.nestFlag) { it.nestFlag = false; it.pt = 0; }
          } else { busy = true; gliding = true; }
        }
        if (it.pt < PULSE_MS) { it.pt += dt; busy = true; }
      });
      phaseT += dt;
      if (phase === 'pre') { if (!gliding) { phase = 'glow'; phaseT = 0; waveT = 0.001; } busy = true; }
      else if (phase === 'glow') {
        waveT += dt / 1000; busy = true;
        if (phaseT >= GLOW_MS) { phase = 'out'; phaseT = 0; }
      } else if (phase === 'out') {
        alpha = Math.max(0, 1 - phaseT / OUT_MS); busy = true;
        if (phaseT >= OUT_MS) {
          alpha = 0; waveT = 0; glow = 0;
          newSet(); paintSet(); scatter();
          phase = 'in'; phaseT = 0;
        }
      } else if (phase === 'in') {
        alpha = Math.min(1, phaseT / IN_MS); busy = true;
        if (phaseT >= IN_MS) { alpha = 1; phase = 'play'; }
      }
      var tg = phase === 'glow' ? 1 : 0;
      if (Math.abs(glow - tg) > 0.005) { glow += (tg - glow) * Math.min(1, dt / 300); busy = true; } else { glow = tg; }
      paint();
      if (busy) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { cancelDrag(); if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }
    function onResize() { cancelDrag(); layout(); start(); }

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    board.addEventListener('keydown', onKey);
    newSet(); paintSet();
    layout();

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      board.removeEventListener('keydown', onKey);
      if (board.parentNode) { board.parentNode.removeChild(board); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'rozmiar') { a.mount = mount; } });
})();
