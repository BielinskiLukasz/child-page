// Activity "Walec": the child drives a steam road roller along a bumpy road strip (finger drag/hold = drive toward the touch,
// Left/Right arrows on the keyboard). The road has 12 segments; each pass of the roller over a segment flattens it in 2 smooth
// steps (full bumps -> half -> flat), and a flat segment looks like fresh asphalt with a dotted line. When all 12 are flat a
// star appears at the end of the road, a little car (or a bunny on a bike) drives along it for 4 s and the road turns bumpy
// again with a new random bump pattern (6-10 big bumps; every other segment gets a small lump).
// All motion runs in one rAF loop (capped dt, paused while hidden, stopped when idle) and every end state is set from JS,
// so it behaves the same under the global prefers-reduced-motion rule.
(function () {
  var SEGS = 12;
  var SPEED = 0.4;             // max roller speed, screen widths per second
  var FOLLOW = 3;              // speed gain toward the touch point (1/s)
  var ACCEL = 8, STOP_RATE = 12; // speed smoothing (1/s)
  var FLIP_RATE = 6;           // facing turn (1/s)
  var LEVEL_RATE = 5;          // bump height easing toward its step target (1/s)
  var BOB_MAX = 6, BOB_RATE = 14; // roller bob over bumps (px max)
  var CAR_S = 4, STAR_RATE = 5;
  var MAX_DT = 0.05;
  var STEPS = [1, 0.5, 0];     // bump level after 0, 1, 2 passes
  var DIRT = [201, 165, 122], ASPHALT = [95, 90, 115];
  var DRUM_R = 24, REAR_R = 20; // roller units (viewBox 120 x 90)

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }
  function mix(t) {
    return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(ASPHALT[i] + (DIRT[i] - ASPHALT[i]) * t); }).join(',') + ')';
  }
  function wheel(cx, cy, r) {
    return '<g class="wc-w" data-cx="' + cx + '" data-cy="' + cy + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#5b5675"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.5) + '" fill="#cfc9e6"/>' +
      '<path d="M' + cx + ' ' + (cy - r * 0.9) + 'V' + (cy + r * 0.9) + 'M' + (cx - r * 0.9) + ' ' + cy + 'H' + (cx + r * 0.9) + '" stroke="#5b5675" stroke-width="2"/></g>';
  }
  function rollerSvg() {
    return '<g class="wc-rl">' +
      '<rect x="30" y="52" width="60" height="16" rx="6" fill="#d9a441"/>' +
      '<rect x="8" y="28" width="46" height="34" rx="8" fill="#f4c24e"/>' +
      '<rect x="14" y="34" width="30" height="20" rx="5" fill="#fdfbff"/>' +
      '<circle cx="29" cy="46" r="7" fill="#f6b9c8"/><circle cx="26.5" cy="45" r="1.2" fill="#5b5675"/><circle cx="31.5" cy="45" r="1.2" fill="#5b5675"/>' +
      '<rect x="6" y="24" width="50" height="6" rx="3" fill="#e6a23c"/>' +
      '<rect x="62" y="30" width="9" height="26" rx="3" fill="#7a748f"/>' +
      '<rect x="59" y="26" width="15" height="6" rx="3" fill="#5b5675"/>' +
      '<rect x="72" y="50" width="26" height="10" rx="5" fill="#e6a23c"/>' +
      '<g class="wc-rear" data-cx="28" data-cy="70"><circle cx="28" cy="70" r="20" fill="#6b6585"/><circle cx="28" cy="70" r="10" fill="#cfc9e6"/>' +
      '<path d="M28 52v36M10 70h36" stroke="#6b6585" stroke-width="3"/></g>' +
      '<g class="wc-drum" data-cx="92" data-cy="66"><circle cx="92" cy="66" r="24" fill="#8d89a3"/><circle cx="92" cy="66" r="15" fill="#aeaac4"/>' +
      '<circle cx="92" cy="66" r="5" fill="#5b5675"/><path d="M92 44v44M70 66h44M76 50l32 32M108 50L76 82" stroke="#6b6585" stroke-width="3" stroke-linecap="round"/></g></g>';
  }
  function carSvg() {
    return '<g class="wc-car-a"><rect x="4" y="-34" width="92" height="22" rx="8" fill="#f08a8a"/>' +
      '<path d="M26 -34L36 -52H66L78 -34z" fill="#f6a5a5"/><path d="M34 -36L40 -49H50V-36zM54 -36V-49H64L72 -36z" fill="#dff1fb"/>' +
      '<circle cx="94" cy="-24" r="4" fill="#ffe9a8"/>' + wheel(26, -11, 11) + wheel(74, -11, 11) + '</g>';
  }
  function bikeSvg() {
    return '<g class="wc-car-b">' + wheel(20, -14, 14) + wheel(78, -14, 14) +
      '<path d="M20 -14L42 -34H66L78 -14M42 -34L50 -14H20M66 -34L60 -44" fill="none" stroke="#e8605a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<ellipse cx="48" cy="-50" rx="11" ry="13" fill="#f2e6ef"/><circle cx="56" cy="-66" r="9" fill="#f2e6ef"/>' +
      '<ellipse cx="53" cy="-82" rx="3" ry="9" fill="#f2e6ef"/><ellipse cx="60" cy="-82" rx="3" ry="9" fill="#f2e6ef"/>' +
      '<circle cx="59" cy="-67" r="1.5" fill="#5b5675"/><circle cx="64" cy="-65" r="1.8" fill="#f3a8b8"/></g>';
  }
  function starPath(r) {
    var p = [], i;
    for (i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      p.push((rr * Math.cos(a)).toFixed(1) + ' ' + (rr * Math.sin(a)).toFixed(1));
    }
    return 'M' + p.join('L') + 'z';
  }

  function mount(container) {
    var scene = document.createElement('div');
    scene.className = 'wc';
    scene.setAttribute('role', 'group');
    scene.setAttribute('aria-label', 'Walec. Strzałki jeżdżą walcem.');
    var segHtml = '', lineHtml = '', i;
    for (i = 0; i < SEGS; i++) {
      segHtml += '<path class="wc-seg" d="" fill="' + mix(0) + '"/>';
      lineHtml += '<line class="wc-line" stroke="#fdfbff" stroke-linecap="round" opacity="0"/>';
    }
    scene.innerHTML = '<svg class="wc-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<circle class="wc-sun" fill="#ffe9a8"/>' +
      '<g class="wc-cloud" fill="#fff" opacity=".85"><ellipse cx="0" cy="0" rx="34" ry="12"/><ellipse cx="-14" cy="-9" rx="16" ry="11"/><ellipse cx="12" cy="-11" rx="18" ry="12"/></g>' +
      '<rect class="wc-grass" fill="#bfe3a8"/>' +
      '<g class="wc-road">' + segHtml + '</g><g class="wc-lines">' + lineHtml + '</g>' +
      '<g class="wc-star" opacity="0"><path d="' + starPath(20) + '" fill="#ffd45e" stroke="#e6a23c" stroke-width="2" stroke-linejoin="round"/></g>' +
      '<g class="wc-car" style="display:none"><g class="wc-car-sel">' + carSvg() + bikeSvg() + '</g></g>' +
      '<g class="wc-roller">' + rollerSvg() + '</g></svg>';
    container.appendChild(scene);

    var svg = scene.querySelector('.wc-svg');
    var sun = scene.querySelector('.wc-sun');
    var cloud = scene.querySelector('.wc-cloud');
    var grass = scene.querySelector('.wc-grass');
    var segEls = [].slice.call(scene.querySelectorAll('.wc-seg'));
    var lineEls = [].slice.call(scene.querySelectorAll('.wc-line'));
    var starEl = scene.querySelector('.wc-star');
    var carEl = scene.querySelector('.wc-car');
    var carA = scene.querySelector('.wc-car-a');
    var carB = scene.querySelector('.wc-car-b');
    var rollerEl = scene.querySelector('.wc-roller');
    var drumEl = scene.querySelector('.wc-drum');
    var rearEl = scene.querySelector('.wc-rear');
    var carWheels = [].slice.call(scene.querySelectorAll('.wc-w'));

    var W = 0, H = 0, x0 = 0, x1 = 0, segW = 1, baseY = 0, roadH = 0, hmax = 8, rw = 80, rs = 1, cs = 1;
    var segs = [], armed = [];
    var x = 0, v = 0, face = 1, faceT = 1, bob = 0, bobT = 0, drum = 0, rear = 0;
    var tx = 0, drivePtr = null, keys = { left: false, right: false };
    var phase = 'play', carT = 0, carKind = 0, carRot = 0, starV = 0, starOn = false;
    var dirty = true, raf = 0, last = 0;

    function newRound() {
      var order = [], j;
      for (j = 0; j < SEGS; j++) { order.push(j); }
      for (j = SEGS - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)), t = order[j]; order[j] = order[k]; order[k] = t; }
      var big = 6 + Math.floor(Math.random() * 5);
      for (j = 0; j < SEGS; j++) {
        var r = 0.35 + Math.random() * 0.15;
        var isBig = order.indexOf(j) < big;
        segs[j] = {
          step: 0, lv: segs[j] ? segs[j].lv : 0, tgt: 1,
          c: r + Math.random() * (1 - 2 * r), r: r, a: isBig ? 1 : 0.3 + Math.random() * 0.15
        };
      }
      phase = 'play';
      starOn = false;
      dirty = true;
    }

    function segH(sg, u) {
      var t = (u - sg.c) / sg.r;
      if (t <= -1 || t >= 1) { return 0; }
      var cs2 = Math.cos(Math.PI * t / 2);
      return sg.lv * sg.a * hmax * cs2 * cs2;
    }
    function heightAt(px) {
      var f = (px - x0) / segW;
      if (f < 0 || f >= SEGS) { return 0; }
      var j = Math.floor(f);
      return segH(segs[j], f - j);
    }

    function layout() {
      var xf = x1 > x0 ? (x - x0) / (x1 - x0) : 0;
      W = scene.clientWidth || window.innerWidth;
      H = scene.clientHeight || window.innerHeight;
      x0 = W * 0.06; x1 = W * 0.94;
      segW = (x1 - x0) / SEGS;
      baseY = H * 0.62;
      roadH = Math.min(H * 0.14, 80);
      hmax = clamp(Math.min(segW * 0.7, H * 0.07), 6, 30);
      rw = clamp(Math.min(W * 0.3, H * 0.42), 72, 240);
      rs = rw / 120;
      cs = clamp(W * 0.2, 64, 170) / 100;
      x = x0 + xf * (x1 - x0);
      tx = x;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      sun.setAttribute('cx', (W * 0.82).toFixed(1)); sun.setAttribute('cy', (H * 0.14).toFixed(1));
      sun.setAttribute('r', (Math.min(W, H) * 0.07).toFixed(1));
      cloud.setAttribute('transform', 'translate(' + (W * 0.28).toFixed(1) + ' ' + (H * 0.2).toFixed(1) + ') scale(' + (Math.min(W, H) / 400 + 0.4).toFixed(2) + ')');
      grass.setAttribute('x', 0); grass.setAttribute('y', baseY.toFixed(1));
      grass.setAttribute('width', W); grass.setAttribute('height', Math.max(0, H - baseY).toFixed(1));
      var dot = Math.max(3, roadH * 0.08);
      lineEls.forEach(function (ln, j) {
        var lx0 = x0 + j * segW, ly = baseY + roadH * 0.5;
        ln.setAttribute('x1', lx0.toFixed(1)); ln.setAttribute('x2', (lx0 + segW).toFixed(1));
        ln.setAttribute('y1', ly.toFixed(1)); ln.setAttribute('y2', ly.toFixed(1));
        ln.setAttribute('stroke-width', dot.toFixed(1));
        ln.setAttribute('stroke-dasharray', '0.1 ' + (segW / 3).toFixed(2));
        ln.setAttribute('stroke-dashoffset', (-segW / 6).toFixed(2));
      });
      var sr = Math.max(14, rw * 0.13);
      starEl.setAttribute('data-r', sr);
      dirty = true;
      paint();
      wake();
    }

    function paintRoad() {
      var n = Math.max(4, Math.ceil(segW / 3)), j, q;
      for (j = 0; j < SEGS; j++) {
        var sg = segs[j], d = '', sx = x0 + j * segW;
        for (q = 0; q <= n; q++) {
          var u = q / n;
          d += (q ? 'L' : 'M') + (sx + u * segW).toFixed(1) + ' ' + (baseY - segH(sg, u)).toFixed(1);
        }
        d += 'L' + (sx + segW).toFixed(1) + ' ' + (baseY + roadH).toFixed(1) + 'L' + sx.toFixed(1) + ' ' + (baseY + roadH).toFixed(1) + 'z';
        segEls[j].setAttribute('d', d);
        segEls[j].setAttribute('fill', mix(clamp(sg.lv, 0, 1)));
        lineEls[j].setAttribute('opacity', (1 - clamp(sg.lv * 2, 0, 1)).toFixed(2));
      }
      dirty = false;
    }

    function paint() {
      if (!W) { return; }
      if (dirty) { paintRoad(); }
      rollerEl.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + (baseY - bob).toFixed(1) + ') scale(' + (face * rs).toFixed(3) + ' ' + rs.toFixed(3) + ') translate(-60 -90)');
      drumEl.setAttribute('transform', 'rotate(' + (drum % 360).toFixed(1) + ' 92 66)');
      rearEl.setAttribute('transform', 'rotate(' + (rear % 360).toFixed(1) + ' 28 70)');
      var sr = parseFloat(starEl.getAttribute('data-r')) || 20;
      starEl.setAttribute('transform', 'translate(' + (x1 - sr * 1.3).toFixed(1) + ' ' + (baseY - rw * 0.42).toFixed(1) + ') scale(' + (sr / 20 * (0.4 + 0.6 * starV)).toFixed(3) + ')');
      starEl.setAttribute('opacity', starV.toFixed(2));
      if (phase === 'car') {
        var p = carT / CAR_S, cw = 100 * cs;
        var cx = -cw + p * (W + 2 * cw);
        carEl.style.display = '';
        carEl.setAttribute('transform', 'translate(' + cx.toFixed(1) + ' ' + baseY.toFixed(1) + ') scale(' + cs.toFixed(3) + ')');
        carA.style.display = carKind === 0 ? '' : 'none';
        carB.style.display = carKind === 1 ? '' : 'none';
        carWheels.forEach(function (w) {
          w.setAttribute('transform', 'rotate(' + (carRot % 360).toFixed(1) + ' ' + w.getAttribute('data-cx') + ' ' + w.getAttribute('data-cy') + ')');
        });
      } else {
        carEl.style.display = 'none';
      }
    }

    function active() {
      if (phase !== 'play') { return true; }
      if (drivePtr !== null || keys.left || keys.right) { return true; }
      if (Math.abs(v) > 0.05 || Math.abs(face - faceT) > 0.002 || Math.abs(bob - bobT) > 0.02) { return true; }
      if (Math.abs(starV - (starOn ? 1 : 0)) > 0.002) { return true; }
      return segs.some(function (sg) { return sg.lv !== sg.tgt; });
    }

    function step(dt) {
      var vmax = SPEED * W, vt = 0, j;
      if (drivePtr !== null) { vt = clamp((tx - x) * FOLLOW, -vmax, vmax); }
      if (keys.left !== keys.right) { vt = keys.right ? vmax : -vmax; }
      v += (vt - v) * (1 - Math.exp(-(vt === 0 ? STOP_RATE : ACCEL) * dt));
      if (Math.abs(v) < 0.05 && vt === 0) { v = 0; }
      v = clamp(v, -vmax, vmax);
      var nx = clamp(x + v * dt, x0, x1);
      if (nx !== x + v * dt) { v = 0; }
      var dx = nx - x;
      x = nx;
      if (v > 3) { faceT = 1; } else if (v < -3) { faceT = -1; }
      face += (faceT - face) * (1 - Math.exp(-FLIP_RATE * dt));
      if (Math.abs(face - faceT) < 0.002) { face = faceT; }
      drum += dx * face / (DRUM_R * rs) * 57.2958;
      rear += dx * face / (REAR_R * rs) * 57.2958;

      // passes: entering a segment's span flattens it one step; it re-arms once the roller is 1.5 segments away
      var si = clamp(Math.floor((x - x0) / segW), 0, SEGS - 1);
      for (j = 0; j < SEGS; j++) {
        if (!armed[j] && Math.abs(x - (x0 + (j + 0.5) * segW)) > segW * 1.5) { armed[j] = true; }
      }
      var sg = segs[si];
      if (phase === 'play' && armed[si] && sg.step < 2) {
        sg.step++;
        sg.tgt = STEPS[sg.step];
        armed[si] = false;
        report(function (A) { A.track('interaction', { variant: 'flatten' }); });
      }

      var anyMoved = false;
      for (j = 0; j < SEGS; j++) {
        var s2 = segs[j];
        if (s2.lv !== s2.tgt) {
          s2.lv += (s2.tgt - s2.lv) * (1 - Math.exp(-LEVEL_RATE * dt));
          if (Math.abs(s2.lv - s2.tgt) < 0.004) { s2.lv = s2.tgt; }
          anyMoved = true;
        }
      }
      if (anyMoved) { dirty = true; }

      // bob over the bumps under the roller (max BOB_MAX px, follows the surface, never blocks)
      var mh = 0, q;
      for (q = -3; q <= 3; q++) { mh = Math.max(mh, heightAt(x + q * rw * 0.1)); }
      bobT = BOB_MAX * clamp(mh / hmax, 0, 1);
      bob += (bobT - bob) * (1 - Math.exp(-BOB_RATE * dt));
      if (Math.abs(bob - bobT) < 0.01) { bob = bobT; }

      if (phase === 'play') {
        var flat = segs.every(function (s3) { return s3.step === 2 && s3.lv === 0; });
        if (flat) {
          phase = 'car'; carT = 0; carRot = 0; carKind = Math.floor(Math.random() * 2); starOn = true;
          report(function (A) { A.complete(); });
        }
      } else {
        carT += dt;
        carRot += (W + 200 * cs) / CAR_S * dt / (11 * cs) * 57.2958;
        if (carT >= CAR_S) {
          newRound();
          for (j = 0; j < SEGS; j++) { armed[j] = j !== clamp(Math.floor((x - x0) / segW), 0, SEGS - 1); }
        }
      }
      starV += ((starOn ? 1 : 0) - starV) * (1 - Math.exp(-STAR_RATE * dt));
      if (Math.abs(starV - (starOn ? 1 : 0)) < 0.002) { starV = starOn ? 1 : 0; }
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

    function localX(e) { return e.clientX - scene.getBoundingClientRect().left; }
    function onDown(e) {
      if (drivePtr !== null) { return; }
      e.preventDefault();
      drivePtr = e.pointerId;
      try { scene.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers */ }
      tx = localX(e);
      report(function (A) { A.track('interaction', { variant: 'drive' }); });
      wake();
    }
    function onMove(e) {
      if (e.pointerId !== drivePtr) { return; }
      tx = localX(e);
    }
    function onUp(e) {
      if (e.pointerId !== drivePtr) { return; }
      drivePtr = null;
      wake();
    }
    function onKeyDown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) { return; }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (!keys.left && !keys.right) { report(function (A) { A.track('interaction', { variant: 'drive' }); }); }
        if (e.key === 'ArrowLeft') { keys.left = true; } else { keys.right = true; }
        wake();
      }
    }
    function onKeyUp(e) {
      if (e.key === 'ArrowLeft') { keys.left = false; wake(); } else if (e.key === 'ArrowRight') { keys.right = false; wake(); }
    }
    function onBlur() { keys.left = false; keys.right = false; }
    scene.addEventListener('pointerdown', onDown);
    scene.addEventListener('pointermove', onMove);
    scene.addEventListener('pointerup', onUp);
    scene.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', layout);
    document.addEventListener('visibilitychange', onVis);

    newRound();
    segs.forEach(function (sg) { sg.lv = 1; });   // the first road is already bumpy
    armed = segs.map(function (sg, j) { return j !== 0; });
    layout();

    return function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      scene.removeEventListener('pointerdown', onDown);
      scene.removeEventListener('pointermove', onMove);
      scene.removeEventListener('pointerup', onUp);
      scene.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('resize', layout);
      window.removeEventListener('orientationchange', layout);
      document.removeEventListener('visibilitychange', onVis);
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'walec') { a.mount = mount; } });
})();
