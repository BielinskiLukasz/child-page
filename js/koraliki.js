// Activity "Koraliki": drag eight big beads from a bowl onto a string to make a necklace. No wrong answers:
// a bead released away from the string drifts back to the bowl; a bead on the string can be dragged off again.
// With all 8 threaded the necklace glows softly, waits, then the beads drift back to the bowl in a new order.
// One rAF loop (works under prefers-reduced-motion, pauses when the tab is hidden, stops when idle); fixed DOM
// of 8 beads + bowl/string buttons. The string runs in one row, or curves into two rows on narrow screens.
(function () {
  var N = 8, GLOW_MS = 3000, WAIT_MS = 4000;
  var DEFS = [
    { label: 'różowe kółko', color: '#f7a8c9', glow: '#f58fb8',
      path: '<circle cx="50" cy="50" r="40" fill="FILL"/>' },
    { label: 'niebieski kwadrat', color: '#a8d8f0', glow: '#8cc8ea',
      path: '<rect x="12" y="12" width="76" height="76" rx="20" fill="FILL"/>' },
    { label: 'zielony sześciokąt', color: '#bfe6b4', glow: '#9fd990',
      path: '<path d="M50 9 L85 29 L85 71 L50 91 L15 71 L15 29 Z" fill="FILL" stroke="FILL" stroke-width="8" stroke-linejoin="round"/>' },
    { label: 'fioletowy romb', color: '#c9b8f2', glow: '#b39cf0',
      path: '<path d="M50 8 L88 50 L50 92 L12 50 Z" fill="FILL" stroke="FILL" stroke-width="8" stroke-linejoin="round"/>' },
    { label: 'żółta gwiazdka', color: '#fff0a0', glow: '#ffe66b',
      path: '<path d="M50 10 L61 38 L91 38 L67 56 L76 87 L50 69 L24 87 L33 56 L9 38 L39 38 Z" fill="FILL" stroke="FILL" stroke-width="8" stroke-linejoin="round"/>' },
    { label: 'czerwone serduszko', color: '#f7b0b8', glow: '#f58f9c',
      path: '<path d="M50 86 C14 60 10 34 28 24 C40 18 48 26 50 34 C52 26 60 18 72 24 C90 34 86 60 50 86 Z" fill="FILL" stroke="FILL" stroke-width="6" stroke-linejoin="round"/>' },
    { label: 'pomarańczowy owal', color: '#ffc9a0', glow: '#ffb27a',
      path: '<ellipse cx="50" cy="50" rx="44" ry="30" fill="FILL"/>' },
    { label: 'miętowy kwiatek', color: '#a8e0d6', glow: '#82d2c4',
      path: '<g fill="FILL"><circle cx="50" cy="22" r="19"/><circle cx="76" cy="37" r="19"/><circle cx="76" cy="65" r="19"/><circle cx="50" cy="78" r="19"/><circle cx="24" cy="65" r="19"/><circle cx="24" cy="37" r="19"/><circle cx="50" cy="50" r="24"/></g>' }
  ];
  var VB = 'viewBox="0 0 100 100" aria-hidden="true" focusable="false"';

  function beadSvg(def) {
    return '<svg ' + VB + '>' + def.path.replace(/FILL/g, def.color) +
      '<circle cx="50" cy="50" r="10" fill="rgba(255,255,255,.8)"/>' +
      '<ellipse cx="34" cy="30" rx="9" ry="5" transform="rotate(-35 34 30)" fill="rgba(255,255,255,.55)"/></svg>';
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function shuffled(n, avoid) {
    var a, tries = 0;
    do {
      a = [];
      for (var i = 0; i < n; i++) { a.push(i); }
      for (var j = n - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)), t = a[j]; a[j] = a[k]; a[k] = t; }
      tries++;
    } while (avoid && tries < 20 && a.every(function (v, i) { return v === avoid[i]; }));
    return a;
  }
  function segDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    var t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }

  function mount(container) {
    container.style.display = 'block';
    var board = document.createElement('div');
    board.className = 'kr';
    board.innerHTML = '<div class="kr-glow"></div><div class="kr-field"><svg class="kr-deco" aria-hidden="true" focusable="false"></svg></div>';
    container.appendChild(board);
    var field = board.querySelector('.kr-field'), glowEl = board.querySelector('.kr-glow'), deco = board.querySelector('.kr-deco');

    var S = 64, fw = 0, fh = 0, pts = [], slots = [], homes = [], homeOrder = shuffled(N), string = [], selected = null;
    var raf = 0, last = 0, doneT = -1, doneGlow = 0;
    var beads = [];

    DEFS.forEach(function (def, i) {
      var el = document.createElement('button');
      el.type = 'button'; el.className = 'kr-bead';
      el.setAttribute('aria-pressed', 'false');
      el.innerHTML = beadSvg(def);
      field.appendChild(el);
      var b = { def: def, el: el, home: homeOrder[i], onString: false, mode: 'idle', pid: null, dx: 0, dy: 0,
        x: 0, y: 0, fx: 0, fy: 0, gx: 0, gy: 0, gt: 0, gd: 1, glow: 0 };
      beads.push(b);
      label(b);
      el.addEventListener('pointerdown', function (e) { down(b, e); });
      el.addEventListener('pointermove', function (e) { move(b, e); });
      el.addEventListener('pointerup', function (e) { up(b, e); });
      el.addEventListener('pointercancel', function (e) { up(b, e); });
      el.addEventListener('lostpointercapture', function (e) { up(b, e); });
      el.addEventListener('click', function (e) { if (e.detail === 0) { activate(b); } });
    });
    var strBtn = document.createElement('button');
    strBtn.type = 'button'; strBtn.className = 'kr-string';
    strBtn.setAttribute('aria-label', 'Nitka (wybierz koralik, potem nitkę)');
    field.appendChild(strBtn);
    strBtn.addEventListener('click', function () { if (selected) { threadIt(selected); } });

    function label(b) {
      b.el.setAttribute('aria-label', 'Koralik: ' + b.def.label +
        (b.onString ? ' (na nitce, Enter zdejmuje)' : ' (Enter lub spacja, potem wybierz nitkę)'));
    }

    function layout() {
      var r = field.getBoundingClientRect();
      fw = r.width; fh = r.height;
      var m = 12, extra = 78; // side margin; knot + hook room
      var s1 = (fw - 2 * m - extra) / (N * 1.04);
      var two = s1 < 56;
      var sw = two ? (fw - 2 * m - extra) / (4 * 1.04) : s1;
      var rows = two ? 2 : 1;
      // Bowl: one row of 8 when the screen is wide enough, otherwise 4x2 (keeps short landscape screens usable).
      var cols = fw - 2 * m >= 9 * Math.max(56, Math.min(84, sw)) ? N : 4;
      var sh = (fh - 8) / ((two ? 2.65 : 1.35) + 0.3 + (N / cols) * 1.12 + 0.5);
      S = Math.max(56, Math.min(84, sw, sh));
      field.style.setProperty('--kr-s', S + 'px');
      var pitch = S * 1.04, perRow = two ? 4 : N, y1 = S * 0.85, y2 = y1 + S * 1.3;
      var x0 = (fw - perRow * pitch) / 2 + pitch / 2;
      slots = [];
      for (var i = 0; i < N; i++) {
        var row = two ? Math.floor(i / 4) : 0, c = two ? i % 4 : i;
        slots.push([x0 + c * pitch, row ? y2 : y1]);
      }
      var last = slots[N - 1];
      // Polyline of the string: knot, every slot, open end (used for drawing and for the "near the string" test).
      pts = [[slots[0][0] - pitch / 2 - 16, slots[0][1]]].concat(slots, [[last[0] + pitch / 2 + 22, last[1]]]);
      // Bowl: 4x2 resting places at the bottom.
      var hp = S * 1.12, bw = cols * hp + S * 0.5, bh = (N / cols) * hp + S * 0.5, bx = (fw - bw) / 2, by = fh - 6 - bh;
      homes = [];
      for (var h = 0; h < N; h++) { homes.push([bx + bw / 2 + ((h % cols) - (cols - 1) / 2) * hp, by + S * 0.25 + hp / 2 + Math.floor(h / cols) * hp + 2]); }
      drawDeco(bx, by, bw, bh);
      var top = Math.min(y1, y2) - S / 2 - 8, bot = (two ? y2 : y1) + S / 2 + 8;
      strBtn.style.cssText = 'left:0;top:' + top + 'px;width:' + fw + 'px;height:' + (bot - top) + 'px';
      glowEl.style.background = 'radial-gradient(ellipse ' + fw * 0.55 + 'px ' + (bot - top) * 0.9 + 'px at 50% ' +
        (field.getBoundingClientRect().top + (top + bot) / 2) + 'px, rgba(255,233,168,.8), rgba(255,233,168,0) 75%)';
      beads.forEach(function (b) {
        if (b.mode === 'drag') { cancelDrag(b); }
        var t = target(b);
        if (b.mode === 'glide') { glideTo(b, t[0], t[1], true); } else { b.x = t[0]; b.y = t[1]; b.gx = t[0]; b.gy = t[1]; }
        place(b);
      });
    }
    function drawDeco(bx, by, bw, bh) {
      deco.setAttribute('width', fw); deco.setAttribute('height', fh);
      deco.setAttribute('viewBox', '0 0 ' + fw + ' ' + fh);
      var d = 'M' + pts[0][0] + ' ' + pts[0][1];
      for (var i = 1; i < pts.length; i++) {
        if (i === 5 && slots[4][1] !== slots[3][1]) { // string curves from the first row into the second
          var a = pts[4], b = pts[5];
          d += ' L' + a[0] + ' ' + a[1] + ' C' + (a[0] + S * 0.9) + ' ' + a[1] + ' ' + (b[0] - S * 0.9) + ' ' + b[1] + ' ' + b[0] + ' ' + b[1];
        } else { d += ' L' + pts[i][0] + ' ' + pts[i][1]; }
      }
      var ex = pts[pts.length - 1][0], ey = pts[pts.length - 1][1];
      deco.innerHTML =
        '<path d="M' + bx + ' ' + (by + S * 0.15) + ' Q' + (bx + bw / 2) + ' ' + (by + bh * 1.35) + ' ' + (bx + bw) + ' ' + (by + S * 0.15) +
        ' Z" fill="#fbe7c8" stroke="#e8cfa6" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="' + d + '" fill="none" stroke="#c9a0c0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="' + pts[0][0] + '" cy="' + pts[0][1] + '" r="9" fill="#b58aad"/>' +
        '<path d="M' + (ex + 10) + ' ' + (ey - 18) + ' v22 a11 11 0 1 0 11 -11" fill="none" stroke="#9fb7d8" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="' + ex + '" cy="' + ey + '" r="4" fill="#c9a0c0"/>';
    }
    function target(b) {
      return b.onString ? slots[string.indexOf(b)] : homes[b.home];
    }
    function place(b) { b.el.style.transform = 'translate(' + (b.x - S / 2) + 'px,' + (b.y - S / 2) + 'px)'; }
    function paintGlow(b) {
      var g = b.glow + doneGlow * 0.7;
      b.el.style.filter = g > 0.01 ? 'drop-shadow(0 0 ' + (4 + 14 * g) + 'px ' + b.def.glow + ')' : '';
    }

    // Glide: smoothstep from the current position; always re-startable from wherever the bead is.
    function glideTo(b, x, y, quick) {
      var d = Math.hypot(x - b.x, y - b.y);
      b.fx = b.x; b.fy = b.y; b.gx = x; b.gy = y; b.gt = 0;
      b.gd = quick ? 200 : (reduced() ? 300 : Math.min(1300, 600 + d * 0.9));
      b.mode = 'glide';
      b.el.style.zIndex = '2';
      start();
    }
    // Make every bead on the string glide to the slot matching its place (after a bead joined or left).
    function syncString() {
      string.forEach(function (b, i) {
        if (b.mode === 'drag') { return; }
        if (b.gx !== slots[i][0] || b.gy !== slots[i][1] || (b.mode === 'idle' && (b.x !== b.gx || b.y !== b.gy))) { glideTo(b, slots[i][0], slots[i][1]); }
      });
      doneT = -1;
    }
    function leaveString(b) {
      var i = string.indexOf(b);
      if (i >= 0) { string.splice(i, 1); }
      b.onString = false; label(b);
    }
    function threadIt(b) {
      select(null);
      if (b.mode === 'drag') { return; }
      if (!b.onString) { string.push(b); b.onString = true; label(b); }
      syncString();
    }
    function sendHome(b) {
      leaveString(b);
      glideTo(b, homes[b.home][0], homes[b.home][1]);
      syncString();
    }

    function cancelDrag(b) {
      if (b.pid !== null) { try { b.el.releasePointerCapture(b.pid); } catch (e) { /* already released */ } }
      b.pid = null; b.mode = 'idle'; sendHome(b);
    }
    function down(b, e) {
      if (b.pid !== null || (e.button !== undefined && e.button > 0)) { return; }
      var r = field.getBoundingClientRect();
      b.pid = e.pointerId; b.mode = 'drag';
      b.dx = b.x - (e.clientX - r.left); b.dy = b.y - (e.clientY - r.top);
      b.el.style.zIndex = '5';
      select(null);
      if (b.onString) { leaveString(b); syncString(); }
      try { b.el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      e.preventDefault();
    }
    function move(b, e) {
      if (b.mode !== 'drag' || e.pointerId !== b.pid) { return; }
      var r = field.getBoundingClientRect();
      var px = e.clientX - r.left + b.dx, py = e.clientY - r.top + b.dy;
      // Keep the bead centre inside the visible screen so it can never be lost off-screen.
      b.x = Math.max(-r.left + S / 2, Math.min(window.innerWidth - r.left - S / 2, px));
      b.y = Math.max(-r.top + S / 2, Math.min(window.innerHeight - r.top - S / 2, py));
      place(b);
    }
    function nearString(b) {
      for (var i = 1; i < pts.length; i++) {
        if (segDist(b.x, b.y, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]) < S * 0.9) { return true; }
      }
      return false;
    }
    function up(b, e) {
      if (b.mode !== 'drag' || e.pointerId !== b.pid) { return; }
      try { b.el.releasePointerCapture(b.pid); } catch (err) { /* already released */ }
      b.pid = null; b.mode = 'idle';
      if (string.length < N && nearString(b)) { threadIt(b); } else { sendHome(b); }
    }

    function select(b) {
      selected = b && selected !== b && !b.onString ? b : null;
      beads.forEach(function (o) {
        var on = o === selected;
        o.el.setAttribute('aria-pressed', on ? 'true' : 'false');
        o.el.classList.toggle('kr-selected', on);
      });
    }
    function activate(b) {
      if (b.mode === 'drag') { return; }
      if (b.onString) { select(null); sendHome(b); } else { select(b); }
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(now - last, 50); last = now;
      var busy = false, allIdle = true;
      beads.forEach(function (b) {
        if (b.mode === 'glide') {
          b.gt += dt;
          var k = smooth(b.gt / b.gd);
          b.x = b.fx + (b.gx - b.fx) * k; b.y = b.fy + (b.gy - b.fy) * k;
          place(b);
          if (b.gt >= b.gd) { b.mode = 'idle'; b.x = b.gx; b.y = b.gy; place(b); b.el.style.zIndex = ''; }
          else { busy = true; }
        }
        if (b.mode !== 'idle') { allIdle = false; }
      });
      // Necklace complete: glow, wait, then the beads drift back to the bowl in a new order (time only advances while visible).
      if (string.length === N && allIdle && doneT < 0) { doneT = 0; }
      var tg = 0;
      if (doneT >= 0) {
        doneT += dt;
        tg = doneT < GLOW_MS ? 1 : 0;
        if (doneT >= GLOW_MS + WAIT_MS) {
          doneT = -1; tg = 0;
          var prev = beads.map(function (b) { return b.home; }), order = shuffled(N, prev);
          string.slice().forEach(function (b) { leaveString(b); });
          beads.forEach(function (b, i) { b.home = order[i]; glideTo(b, homes[b.home][0], homes[b.home][1]); });
        } else { busy = true; }
      }
      if (Math.abs(doneGlow - tg) > 0.005) { doneGlow += (tg - doneGlow) * Math.min(1, dt / 450); busy = true; }
      else { doneGlow = tg; }
      glowEl.style.opacity = String(doneGlow);
      beads.forEach(paintGlow);
      if (busy) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }
    function onResize() { layout(); start(); }

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    layout();
    beads.forEach(paintGlow);

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (board.parentNode) { board.parentNode.removeChild(board); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'koraliki') { a.mount = mount; } });
})();
