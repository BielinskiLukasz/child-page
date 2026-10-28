// Activity "Nalej Wody": a jug (at least 96 px wide) is dragged sideways along the top row. While it is held over the opening of a glass
// it tilts and pours a thin stream; the glass fills at 25% of its height per second (small), 15% (medium) or 10% (large) and sparkles for 2 s
// when full. The stream stops by itself when the jug moves away, the glass is full or the jug is empty, so water never spills. Over the small
// pitcher at the right the jug refills by itself (a level line and tick marks show how much water it holds). When all three glasses are
// full they glow, a small animal toasts for 3 s, the glasses empty over 2 s and come back with new random heights (each at most 0.75 of the
// next taller one, i.e. at least 25% apart) and new colours. Keyboard: arrows move the jug, Enter/Space pours while held.
// One capped-dt rAF loop drives everything (so it works under prefers-reduced-motion); it stops when idle and while the tab is hidden.
// Usage metrics: track('interaction', {variant: 'small'|'medium'|'large'}) per pour start, {variant: '<size>-full'} per filled glass,
// complete() per full set. Nothing is scored or stored.
(function () {
  var TAU = Math.PI * 2;
  var RATE = [0.25, 0.15, 0.10];                    // glass height per second by rank (small, medium, large)
  var SIZES = ['small', 'medium', 'large'];
  var DRAIN = 0.06, REFILL = 0.6;                   // jug level per second (pouring / over the pitcher)
  var TILT_MAX = 40 * Math.PI / 180, TILT_RATE = 5; // jug tilt, ease rate per second
  var FLIP_SPEED = 4, KEY_SPEED = 260;              // turn of the jug (units/s, a full turn is 2), arrow speed px/s
  var SPARK_S = 2, TOAST_S = 3, EMPTY_S = 2, IN_S = 0.6, START_GAP = 400;
  var COLORS = ['#f7a8c9', '#ffc93c', '#6fd0a0', '#b7a0f0', '#ff9f6b', '#5fc8e0', '#ee8a9a', '#a8c95a'];
  var STAR = 'M0-9L2.5-2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5-2.5Z';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function r1(v) { return Math.round(v * 10) / 10; }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }

  function jugSvg() {
    return '<svg class="nw-jsvg" viewBox="0 0 96 88" aria-hidden="true" focusable="false">' +
      '<defs><clipPath id="nw-jclip"><path d="M12 8H66Q78 8 90 17L76 24Q80 52 74 76Q72 84 64 84H24Q16 84 14 76Q8 44 12 8Z"/></clipPath></defs>' +
      '<path d="M12 24Q-2 26 1 46Q3 60 14 60" fill="none" stroke="#e8935a" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M12 8H66Q78 8 90 17L76 24Q80 52 74 76Q72 84 64 84H24Q16 84 14 76Q8 44 12 8Z" fill="#fff6e6"/>' +
      '<g clip-path="url(#nw-jclip)"><g class="nw-jw"><rect class="nw-jwr" x="-30" y="84" width="160" height="120" fill="#8fd0f5"/>' +
      '<rect class="nw-jwl" x="-30" y="84" width="160" height="3" fill="#fff"/></g></g>' +
      '<path d="M12 8H66Q78 8 90 17L76 24Q80 52 74 76Q72 84 64 84H24Q16 84 14 76Q8 44 12 8Z" fill="none" stroke="#e8935a" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M16 66h12M16 48h12M16 30h12" stroke="#e8935a" stroke-width="2.5" stroke-linecap="round"/></svg>';
  }
  function pitcherSvg() {
    return '<g class="nw-pit"><path class="nw-pring" d="M-6 6H70V86H-6Z" fill="none" stroke="#8f7fd1" stroke-width="4" stroke-dasharray="8 6" stroke-linejoin="round" visibility="hidden"/>' +
      '<path d="M54 30Q70 32 66 54Q64 62 52 62" fill="none" stroke="#e8935a" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M8 20H52L48 72Q47 78 41 78H19Q13 78 12 72Z" fill="#fff6e6" stroke="#e8935a" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M8 20L0 12L14 20Z" fill="#fff6e6" stroke="#e8935a" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M11 36H49L47 71Q46 75 41 75H19Q14 75 13 71Z" fill="#8fd0f5"/><path d="M11 36H49" stroke="#fff" stroke-width="3"/></g>';
  }
  function toastSvg(head) {
    return '<svg class="nw-tsvg" viewBox="0 0 130 100" aria-hidden="true" focusable="false">' +
      (head ? '<svg x="6" y="18" width="78" height="78" viewBox="-18 -18 36 36" overflow="visible">' + head + '</svg>' : '<circle cx="45" cy="57" r="30" fill="#f6d5b8"/>') +
      '<path d="M88 12H116L112 46Q111 52 105 52H99Q93 52 92 46Z" fill="#e8f6ff" stroke="#8fd0f5" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M90 24H114L112 46Q111 50 105 50H99Q93 50 92 46Z" fill="#8fd0f5"/>' +
      '<path d="M78 60Q86 56 92 46" fill="none" stroke="#f6d5b8" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="' + STAR + '" transform="translate(76 14) scale(.8)" fill="#ffd54a"/><path d="' + STAR + '" transform="translate(122 4) scale(.6)" fill="#ffd54a"/></svg>';
  }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'nw';
    root.innerHTML = '<div class="nw-field"><svg class="nw-svg" aria-hidden="true" focusable="false"></svg>' +
      '<button type="button" class="nw-jug" aria-label="Dzbanek. Strzałki przesuwają, Enter lub spacja nalewa wodę">' + jugSvg() + '</button>' +
      '<div class="nw-toast"></div></div>';
    container.appendChild(root);
    var field = root.querySelector('.nw-field'), svg = root.querySelector('.nw-svg');
    var jug = root.querySelector('.nw-jug'), toast = root.querySelector('.nw-toast');
    var jWater = jug.querySelector('.nw-jw'), jWR = jug.querySelector('.nw-jwr'), jWL = jug.querySelector('.nw-jwl');

    var fw = 0, fh = 0, fl = 0, s = 1;
    var jw = 96, jh = 88, pr = 42, pvx = 90, pvy = 17, py = 70, xmin = 48, xmax = 48;
    var hMax = 90, ground = 0, pcx = 0, pitReach = 40, pitScale = 1, pitTop = 0;
    var fx = 0.5, dir = 1, f = 1, mv = 0, tilt = 0, jugLvl = 1, jugOp = 1;
    var glasses = [], gEls = null, pitRing = null, stream = null, streamTop = null, splash = null, gsGroup = null;
    var phase = 'play', pt = 0, glowA = 0, toastA = 0, gsOp = 1, animalId = null;
    var ptrId = null, ptrHeld = false, kbHeld = false, grabDx = 0, keys = { left: false, right: false };
    var pouring = false, pourG = -1, wasPour = false, raf = 0, last = 0, tAcc = 0;

    function newSet() {
      var big = 0.9 + Math.random() * 0.1;
      var med = big * (0.68 + Math.random() * 0.07);
      var sm = med * (0.68 + Math.random() * 0.07);
      var rels = Rand.shuffle([sm, med, big]);
      var cols = Rand.pick(COLORS, 3);
      glasses = rels.map(function (r, i) {
        return { rel: r, color: cols[i], rank: r === big ? 2 : r === med ? 1 : 0, lvl: 0, full: false, sp: -1, lastStart: -1e9,
          h: 0, gw: 0, cx: 0 };
      });
      var a = window.Animals ? window.Animals.pick(1) : null;
      animalId = a && a[0] ? a[0].id : null;
    }
    function outline(g, close) {
      var tw = g.gw / 2, bw = g.gw * 0.38, r = Math.min(10, g.h / 6);
      return 'M' + r1(-tw) + ' ' + r1(-g.h) + 'L' + r1(-bw) + ' ' + r1(-r) + 'Q' + r1(-bw) + ' 0 ' + r1(-bw + r) + ' 0L' + r1(bw - r) + ' 0Q' + r1(bw) + ' 0 ' +
        r1(bw) + ' ' + r1(-r) + 'L' + r1(tw) + ' ' + r1(-g.h) + (close ? 'Z' : '');
    }
    function build() {
      var h = '<defs>';
      glasses.forEach(function (g, i) { h += '<clipPath id="nw-c' + i + '"><path d="' + outline(g, true) + '"/></clipPath>'; });
      h += '</defs><g class="nw-gs">';
      glasses.forEach(function (g, i) {
        var tw = g.gw / 2;
        h += '<g class="nw-g" transform="translate(' + r1(g.cx) + ' ' + r1(ground) + ')">' +
          '<ellipse cx="0" cy="3" rx="' + r1(tw * 0.9) + '" ry="4" fill="#3d3a4f" fill-opacity=".12"/>' +
          '<path d="' + outline(g, true) + '" fill="' + g.color + '" fill-opacity=".3"/>' +
          '<g clip-path="url(#nw-c' + i + ')"><rect class="nw-gw" x="' + r1(-g.gw) + '" y="0" width="' + r1(g.gw * 2) + '" height="0" fill="#8fd0f5"/>' +
          '<rect class="nw-gsur" x="' + r1(-g.gw) + '" y="0" width="' + r1(g.gw * 2) + '" height="3" fill="#fff" fill-opacity=".8" visibility="hidden"/></g>' +
          '<path class="nw-gglow" d="' + outline(g, false) + '" fill="none" stroke="#ffd54a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>' +
          '<path d="' + outline(g, false) + '" fill="none" stroke="' + g.color + '" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<g class="nw-gsp" opacity="0">';
        [[-tw - 10, -g.h * 0.7], [tw + 10, -g.h * 0.5], [-tw * 0.3, -g.h - 14], [tw * 0.6, -g.h - 8]].forEach(function (p) {
          h += '<path class="nw-star" data-x="' + r1(p[0]) + '" data-y="' + r1(p[1]) + '" d="' + STAR + '" fill="#ffd54a" stroke="#fff" stroke-width="1.5"/>';
        });
        h += '</g></g>';
      });
      h += '</g><g class="nw-pg" transform="translate(' + r1(pcx - 32 * pitScale) + ' ' + r1(pitTop) + ') scale(' + r1(pitScale * 100) / 100 + ')">' + pitcherSvg() + '</g>' +
        '<g class="nw-sg"><line class="nw-st" stroke="#6fbfee" stroke-width="5" stroke-linecap="round" visibility="hidden"/>' +
        '<line class="nw-st2" stroke="#fff" stroke-opacity=".8" stroke-width="2" stroke-dasharray="9 7" stroke-linecap="round" visibility="hidden"/>' +
        '<ellipse class="nw-spl" rx="9" ry="3" fill="#fff" fill-opacity=".7" visibility="hidden"/></g>';
      svg.innerHTML = h;
      gsGroup = svg.querySelector('.nw-gs');
      var gs = svg.querySelectorAll('.nw-g');
      gEls = [];
      for (var i = 0; i < gs.length && i < glasses.length; i++) {
        gEls.push({ w: gs[i].querySelector('.nw-gw'), sur: gs[i].querySelector('.nw-gsur'), glow: gs[i].querySelector('.nw-gglow'),
          sp: gs[i].querySelector('.nw-gsp'), stars: gs[i].querySelectorAll('.nw-star') });
      }
      pitRing = svg.querySelector('.nw-pring');
      stream = svg.querySelector('.nw-st'); streamTop = svg.querySelector('.nw-st2'); splash = svg.querySelector('.nw-spl');
    }
    function buildToast() {
      toast.innerHTML = toastSvg(animalId && window.Animals ? window.Animals.head(animalId) : '');
    }

    function layout() {
      var r = field.getBoundingClientRect();
      fw = r.width; fh = r.height; fl = r.left;
      if (!fw || !fh) { return; }
      s = clamp(Math.min(fw / 320, fh / 300), 1, 1.35);
      jw = 96 * s; jh = 88 * s; pr = 42 * s; pvx = 90 * s; pvy = 17 * s;
      xmin = jw / 2; xmax = Math.max(xmin, fw - jw / 2);
      hMax = clamp(Math.min(0.42 * fh, 0.5 * fw, fh - 8 - 70 - 78 * s), 60, 170 * s);
      ground = fh - 8;
      py = Math.max(70, Math.min(ground - hMax - 78 * s, 190));
      pitScale = s;
      pcx = fw - 32 * s - 4; pitTop = py - 28 * s;
      pitReach = 32 * s + 6;
      var slot = fw / 3;
      glasses.forEach(function (g, i) {
        g.h = g.rel * hMax; g.gw = clamp(g.h * 0.7, 44, slot - 10); g.cx = slot * (i + 0.5);
      });
      jug.style.width = jw + 'px'; jug.style.height = jh + 'px';
      var ts = jw * 1.3;
      toast.style.width = ts + 'px'; toast.style.height = (ts * 100 / 130) + 'px';
      svg.setAttribute('width', r1(fw)); svg.setAttribute('height', r1(fh));
      svg.setAttribute('viewBox', '0 0 ' + r1(fw) + ' ' + r1(fh));
      svg.style.width = fw + 'px'; svg.style.height = fh + 'px';
      build();
      paint(0);
    }

    function curX() { return xmin + fx * (xmax - xmin); }
    function moveBy(dx) {
      var span = xmax - xmin;
      if (span <= 0 || !dx) { return; }
      fx = clamp(fx + dx / span, 0, 1);
      if (mv * dx < 0) { mv = 0; }
      mv += dx;
      if (Math.abs(mv) > 5 && tilt < 0.05) { dir = mv > 0 ? 1 : -1; mv = 0; }
    }
    function glassAt(px) {
      var best = -1, bd = 1e9;
      glasses.forEach(function (g, i) {
        var d = Math.abs(px - g.cx);
        if (d < g.gw * 0.34 && d < bd) { bd = d; best = i; }
      });
      return best;
    }
    function startToast() {
      phase = 'toast'; pt = 0; ptrHeld = false; kbHeld = false; keys.left = keys.right = false; ptrId = null;
      buildToast();
      report(function (A) { A.complete(); });
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(now - last, 50) / 1000; last = now; tAcc += dt;
      var busy = false, play = phase === 'play', held = ptrHeld || kbHeld;
      if (play) {
        var kd = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
        if (kd) { moveBy(kd * KEY_SPEED * dt); busy = true; }
      }
      var X = curX(), px = X + f * pr;
      var overPit = play && Math.abs(X - pcx) < pitReach;
      var over = play && !overPit ? glassAt(px) : -1;
      var g = over >= 0 ? glasses[over] : null;
      var want = !!(play && held && g && !g.full && jugLvl > 0.001);
      tilt += ((want ? TILT_MAX : 0) - tilt) * (1 - Math.exp(-TILT_RATE * dt));
      if (Math.abs((want ? TILT_MAX : 0) - tilt) < 0.002) { tilt = want ? TILT_MAX : 0; } else { busy = true; }
      pouring = want && tilt > TILT_MAX * 0.55;
      if (pouring) {
        busy = true;
        if (!wasPour || pourG !== over) {
          if (now - g.lastStart > START_GAP) {
            report(function (A) { A.track('interaction', { variant: SIZES[g.rank] }); });
          }
          g.lastStart = now;
        }
        wasPour = true; pourG = over;
        g.lvl = Math.min(1, g.lvl + RATE[g.rank] * dt);
        jugLvl = Math.max(0, jugLvl - DRAIN * dt);
        if (g.lvl >= 1) {
          g.full = true; g.sp = 0; pouring = false; wasPour = false; pourG = -1;
          report(function (A) { A.track('interaction', { variant: SIZES[g.rank] + '-full' }); });
        }
      } else { wasPour = false; pourG = -1; }
      if (overPit && jugLvl < 1) { jugLvl = Math.min(1, jugLvl + REFILL * dt); busy = true; }
      var df = dir - f;
      if (Math.abs(df) > 0.002) { f += clamp(df, -FLIP_SPEED * dt, FLIP_SPEED * dt); busy = true; } else { f = dir; }
      glasses.forEach(function (q) {
        if (q.sp >= 0) { q.sp += dt; if (q.sp >= SPARK_S) { q.sp = -1; } else { busy = true; } }
      });
      if (play && glasses.length && glasses.every(function (q) { return q.full; })) { startToast(); }

      var gT = 0, tT = 0, jT = 1;
      if (phase === 'toast') {
        pt += dt; busy = true; gT = 1; tT = 1; jT = 0;
        if (pt >= TOAST_S) { phase = 'empty'; pt = 0; }
      } else if (phase === 'empty') {
        pt += dt; busy = true; gT = 0; tT = 0; jT = 0;
        var k = Math.max(0, 1 - pt / EMPTY_S);
        glasses.forEach(function (q) { q.lvl = k; });
        if (pt >= EMPTY_S) {
          newSet(); gsOp = 0; layout(); jugLvl = 1; phase = 'in'; pt = 0;
        }
      } else if (phase === 'in') {
        pt += dt; busy = true; gsOp = Math.min(1, pt / IN_S);
        if (pt >= IN_S) { gsOp = 1; phase = 'play'; }
      }
      var ez = 1 - Math.exp(-6 * dt);
      glowA += (gT - glowA) * ez; toastA += (tT - toastA) * ez; jugOp += (jT - jugOp) * ez;
      if (Math.abs(gT - glowA) > 0.01 || Math.abs(tT - toastA) > 0.01 || Math.abs(jT - jugOp) > 0.01) { busy = true; }
      else { glowA = gT; toastA = tT; jugOp = jT; }
      paint(dt);
      if (busy || ptrHeld || kbHeld) { raf = requestAnimationFrame(frame); }
    }

    function paint(dt) {
      if (!fw || !gEls) { return; }
      var X = curX(), px = X + f * pr, deg = tilt * 180 / Math.PI, sg = dir;
      jug.style.transform = 'translate(' + r1(px) + 'px,' + r1(py) + 'px) rotate(' + r1(deg * sg) + 'deg) scale(' + r1(f * 1000) / 1000 + ',1) translate(' + r1(-pvx) + 'px,' + r1(-pvy) + 'px)';
      jug.style.opacity = String(r1(jugOp * 100) / 100);
      jug.style.pointerEvents = phase === 'play' ? 'auto' : 'none';
      var wy = 84 - 72 * jugLvl;
      jWater.setAttribute('transform', 'rotate(' + r1(-deg) + ' 48 44)');
      jWR.setAttribute('y', r1(wy)); jWL.setAttribute('y', r1(wy - 1));
      jWL.setAttribute('visibility', jugLvl > 0.01 ? 'visible' : 'hidden');
      pitRing.setAttribute('visibility', jugLvl < 0.2 && phase === 'play' ? 'visible' : 'hidden');
      gsGroup.setAttribute('opacity', String(r1(gsOp * 100) / 100));
      glasses.forEach(function (g, i) {
        var e = gEls[i];
        if (!e) { return; }
        var wh = g.h * g.lvl;
        e.w.setAttribute('y', r1(-wh)); e.w.setAttribute('height', r1(wh + 1));
        e.sur.setAttribute('y', r1(-wh - 1.5)); e.sur.setAttribute('visibility', g.lvl > 0.01 ? 'visible' : 'hidden');
        e.glow.setAttribute('opacity', String(r1((g.full ? glowA : 0) * 100) / 100));
        var a = g.sp >= 0 ? Math.sin(Math.PI * Math.min(1, g.sp / SPARK_S)) : 0;
        e.sp.setAttribute('opacity', String(r1(a * 100) / 100));
        for (var j = 0; j < e.stars.length; j++) {
          var st = e.stars[j], sc = 0.8 + 0.3 * Math.sin(g.sp * TAU * 0.8 + j * 1.7);
          st.setAttribute('transform', 'translate(' + st.getAttribute('data-x') + ' ' + st.getAttribute('data-y') + ') scale(' + r1(sc * 100) / 100 + ')');
        }
      });
      if (pouring && glasses[pourG]) {
        var q = glasses[pourG], sy = ground - q.h * q.lvl;
        stream.setAttribute('x1', r1(px)); stream.setAttribute('x2', r1(px));
        stream.setAttribute('y1', r1(py + 2)); stream.setAttribute('y2', r1(sy));
        streamTop.setAttribute('x1', r1(px)); streamTop.setAttribute('x2', r1(px));
        streamTop.setAttribute('y1', r1(py + 2)); streamTop.setAttribute('y2', r1(sy));
        streamTop.setAttribute('stroke-dashoffset', r1(-(tAcc * 70) % 16));
        splash.setAttribute('cx', r1(px)); splash.setAttribute('cy', r1(sy));
        stream.setAttribute('visibility', 'visible'); streamTop.setAttribute('visibility', 'visible'); splash.setAttribute('visibility', 'visible');
      } else {
        stream.setAttribute('visibility', 'hidden'); streamTop.setAttribute('visibility', 'hidden'); splash.setAttribute('visibility', 'hidden');
      }
      toast.style.opacity = String(r1(toastA * 100) / 100);
      var tw = jw * 1.3, th = tw * 100 / 130;
      toast.style.transform = 'translate(' + r1(fw / 2 - tw / 2) + 'px,' + r1(py - th * 0.3) + 'px) rotate(' + r1(Math.sin(tAcc * TAU * 0.6) * 8) + 'deg)';
    }

    function start() {
      if (raf || document.hidden || !fw) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function release() {
      ptrHeld = false; kbHeld = false; ptrId = null; keys.left = keys.right = false;
    }

    // ---- input -----------------------------------------------------------------------------------------------
    function onDown(e) {
      if (phase !== 'play' || ptrId !== null) { return; }
      ptrId = e.pointerId;
      try { jug.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
      fl = field.getBoundingClientRect().left;
      grabDx = curX() - (e.clientX - fl);
      ptrHeld = true;
      if (e.preventDefault) { e.preventDefault(); }
      start();
    }
    function onMove(e) {
      if (e.pointerId !== ptrId || phase !== 'play') { return; }
      var nx = clamp(e.clientX - fl + grabDx, xmin, xmax);
      moveBy(nx - curX());
      start();
    }
    function onUp(e) {
      if (e.pointerId !== ptrId) { return; }
      ptrId = null; ptrHeld = false; start();
    }
    function onKeyDown(e) {
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'ArrowRight') {
        if (phase === 'play') { keys[k === 'ArrowLeft' ? 'left' : 'right'] = true; start(); }
        e.preventDefault();
      } else if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
        if (phase === 'play' && !e.repeat) { kbHeld = true; start(); }
        e.preventDefault();
      }
    }
    function onKeyUp(e) {
      var k = e.key;
      if (k === 'ArrowLeft') { keys.left = false; } else if (k === 'ArrowRight') { keys.right = false; }
      else if (k === 'Enter' || k === ' ' || k === 'Spacebar') { kbHeld = false; e.preventDefault(); }
      start();
    }
    function onBlur() { keys.left = keys.right = false; kbHeld = false; }
    function onVis() {
      if (document.hidden) { release(); if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }
    function onResize() { layout(); start(); }

    jug.addEventListener('pointerdown', onDown);
    jug.addEventListener('pointermove', onMove);
    jug.addEventListener('pointerup', onUp);
    jug.addEventListener('pointercancel', onUp);
    jug.addEventListener('lostpointercapture', onUp);
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('keyup', onKeyUp);
    jug.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);

    newSet();
    layout();
    start();

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      jug.removeEventListener('pointerdown', onDown);
      jug.removeEventListener('pointermove', onMove);
      jug.removeEventListener('pointerup', onUp);
      jug.removeEventListener('pointercancel', onUp);
      jug.removeEventListener('lostpointercapture', onUp);
      root.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('keyup', onKeyUp);
      jug.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'nalej') { a.mount = mount; } });
})();
