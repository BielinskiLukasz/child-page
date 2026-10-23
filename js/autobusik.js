// Activity "Autobusik": a little bus loops slowly along a village road with 3 bus stops. Touch the bus -> it starts /
// slows to a halt; touch a stop -> the bus brakes there (only the last touched stop counts), its doors open and the waiting
// animal hops in; touch an animal in a window -> it steps out at the stop (bus stopped) or waves (bus moving).
// All motion is driven by one rAF loop (capped dt, paused when the tab is hidden) so it keeps working under the global
// prefers-reduced-motion rule that disables CSS animations. The bus position is a loop fraction f (0 = just off the left
// edge, 1 = just off the right edge) so speed and stops stay valid after a resize / orientation change.
(function () {
  var CROSS_S = 24;            // seconds for a full loop at cruise speed (the front crosses the visible width in >= ~14 s)
  var V = 1 / CROSS_S;         // cruise speed, loop fractions per second
  var RAMP_S = 2.2;            // gentle start / slow-down
  var BRAKE_S = 3;             // braking into a stop takes about this long
  var DOOR_S = 1.8;            // doors open / close slowly
  var HOP_S = 1.8, WAVE_S = 2.2;
  var MAX_DT = 0.05;
  var VB_W = 340, VB_H = 110;  // bus viewBox
  var WIN_X = [58, 140, 222];  // window centres in viewBox units (spacing 82/340 of the bus width)
  var KINDS = ['bear', 'rabbit', 'cat'];
  var NAMES = ['Miś', 'Króliczek', 'Kotek'];
  var STOP_X = [0.2, 0.5, 0.8];

  function sm(u) { return u * u * (3 - 2 * u); }
  function wrap(x) { return x - Math.floor(x); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  function animalSvg(kind) {
    var fur = { bear: '#c99b72', rabbit: '#f3ecf7', cat: '#f2c48d' }[kind];
    var ears = kind === 'rabbit'
      ? '<ellipse cx="-8" cy="-26" rx="4.5" ry="12" fill="' + fur + '"/><ellipse cx="8" cy="-26" rx="4.5" ry="12" fill="' + fur + '"/>' +
        '<ellipse cx="-8" cy="-26" rx="2" ry="8" fill="#f7b7cf"/><ellipse cx="8" cy="-26" rx="2" ry="8" fill="#f7b7cf"/>'
      : kind === 'cat'
        ? '<path d="M-15 -8l3-17 11 9z" fill="' + fur + '"/><path d="M15 -8l-3-17-11 9z" fill="' + fur + '"/>'
        : '<circle cx="-13" cy="-13" r="6" fill="' + fur + '"/><circle cx="13" cy="-13" r="6" fill="' + fur + '"/>';
    var nose = kind === 'bear'
      ? '<ellipse cx="0" cy="5" rx="6" ry="4.5" fill="#f3dcc4"/><circle cx="0" cy="3.5" r="2" fill="#6b5a73"/>'
      : '<circle cx="0" cy="4" r="2" fill="#e99bb5"/>';
    return '<svg viewBox="-28 -22 56 56" aria-hidden="true" focusable="false"><g transform="translate(0 6)">' + ears +
      '<circle cx="0" cy="0" r="16" fill="' + fur + '"/><circle cx="-6" cy="-3" r="2" fill="#5b5675"/>' +
      '<circle cx="6" cy="-3" r="2" fill="#5b5675"/>' + nose + '</g></svg>';
  }

  function busSvg() {
    var s = '<svg viewBox="0 0 ' + VB_W + ' ' + VB_H + '" aria-hidden="true" focusable="false">' +
      '<rect x="2" y="8" width="336" height="84" rx="22" fill="#ffd98a"/>' +
      '<rect x="2" y="64" width="336" height="8" fill="#fff" opacity=".5"/>' +
      '<rect x="2" y="78" width="336" height="14" rx="7" fill="#f7a8c9"/>';
    WIN_X.forEach(function (x) { s += '<rect x="' + (x - 33) + '" y="20" width="66" height="46" rx="14" fill="#cfeaf7"/>'; });
    // door: dark interior + a panel that slides away (width set from JS)
    s += '<rect x="262" y="24" width="46" height="62" rx="8" fill="#8a84a8"/>' +
      '<rect class="ab-door" x="262" y="24" width="46" height="62" rx="8" fill="#a8d8f0"/>' +
      '<rect x="314" y="26" width="20" height="30" rx="8" fill="#cfeaf7"/>' +
      '<circle cx="330" cy="70" r="5" fill="#fff3b8"/>';
    [70, 270].forEach(function (wx) {
      s += '<g class="ab-wheel" data-cx="' + wx + '"><circle cx="' + wx + '" cy="94" r="13" fill="#6b6585"/>' +
        '<circle cx="' + wx + '" cy="94" r="6.5" fill="#cfc9e6"/><path d="M' + wx + ' 87v14M' + (wx - 7) + ' 94h14" stroke="#6b6585" stroke-width="2.5"/></g>';
    });
    return s + '</svg>';
  }

  function stopSvg() {
    return '<svg viewBox="0 0 60 120" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">' +
      '<rect x="27" y="30" width="6" height="90" rx="3" fill="#8a84a8"/>' +
      '<circle cx="30" cy="26" r="22" fill="#fdfbff" stroke="#a8d8f0" stroke-width="4"/>' +
      '<rect x="17" y="16" width="26" height="15" rx="5" fill="#ffd98a"/><rect x="20" y="19" width="6" height="6" rx="2" fill="#cfeaf7"/>' +
      '<rect x="28" y="19" width="6" height="6" rx="2" fill="#cfeaf7"/><rect x="36" y="19" width="5" height="6" rx="2" fill="#cfeaf7"/>' +
      '<circle cx="23" cy="33" r="3" fill="#6b6585"/><circle cx="38" cy="33" r="3" fill="#6b6585"/></svg>';
  }

  function houseSvg(wall, roof) {
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">' +
      '<rect x="10" y="40" width="80" height="60" rx="6" fill="' + wall + '"/><path d="M2 44L50 6l48 38z" fill="' + roof + '"/>' +
      '<rect x="42" y="64" width="16" height="36" rx="5" fill="#b9b3e0"/><rect x="18" y="52" width="16" height="16" rx="4" fill="#cfeaf7"/>' +
      '<rect x="66" y="52" width="16" height="16" rx="4" fill="#cfeaf7"/></svg>';
  }

  function treeSvg() {
    return '<svg viewBox="0 0 60 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">' +
      '<rect x="26" y="60" width="8" height="40" rx="3" fill="#c9a98a"/><circle cx="30" cy="40" r="26" fill="#9fd694"/><circle cx="20" cy="50" r="14" fill="#8cc982"/></svg>';
  }

  function mount(container) {
    var scene = document.createElement('div');
    scene.className = 'ab';
    scene.setAttribute('role', 'group');
    scene.setAttribute('aria-label', 'Autobusik');
    var deco = '<div class="ab-sun"></div><div class="ab-cloud ab-c1"></div><div class="ab-cloud ab-c2"></div>';
    var houses = [[0.07, '#fdf0d5', '#f7b7a5'], [0.35, '#e6e0f7', '#c9b8f2'], [0.65, '#d8ecfb', '#f7a8c9'], [0.93, '#fde3ef', '#ffc9a0']];
    houses.forEach(function (h, i) { deco += '<div class="ab-house" data-x="' + h[0] + '">' + houseSvg(h[1], h[2]) + '</div>'; });
    [0.21, 0.5, 0.79].forEach(function (x) { deco += '<div class="ab-tree" data-x="' + x + '">' + treeSvg() + '</div>'; });
    var stops = '';
    for (var i = 0; i < 3; i++) {
      stops += '<button class="ab-stop" type="button" data-i="' + i + '" aria-label="Przystanek ' + (i + 1) + ' – zatrzymaj autobusik tutaj">' + stopSvg() + '</button>';
    }
    var animalsHtml = '';
    for (var k = 0; k < 3; k++) {
      animalsHtml += '<button class="ab-an" type="button" data-i="' + k + '" aria-label="' + NAMES[k] + '">' + animalSvg(KINDS[k]) + '</button>';
    }
    scene.innerHTML = deco + '<div class="ab-sidewalk"></div><div class="ab-road"><div class="ab-dash"></div></div>' + stops +
      '<div class="ab-bus" role="button" tabindex="0" aria-label="Autobusik – ruszaj lub zatrzymaj">' + busSvg() + '</div>' + animalsHtml;
    container.appendChild(scene);

    var bus = scene.querySelector('.ab-bus');
    var door = scene.querySelector('.ab-door');
    var wheels = [].slice.call(scene.querySelectorAll('.ab-wheel'));
    var stopBtns = [].slice.call(scene.querySelectorAll('.ab-stop'));
    var houseEls = [].slice.call(scene.querySelectorAll('.ab-house'));
    var treeEls = [].slice.call(scene.querySelectorAll('.ab-tree'));
    var animals = [].slice.call(scene.querySelectorAll('.ab-an')).map(function (el, i) {
      return { el: el, i: i, stop: i, st: 'wait', t: 0, p0: [0, 0], noBoard: i === 0, wave: -1, x: 0, y: 0 };
    });

    var W = 0, H = 0, bw = 0, bh = 0, L = 1, AS = 56, sy = 0, roadBase = 0, busTop = 0;
    var sx = [0, 0, 0], fs = [0, 0, 0];
    var f = 0, v = 0, odo = 0;
    var ramp = { v0: 0, vt: 0, t: RAMP_S, dur: RAMP_S };
    var brake = null;          // {v0, T, t, f0, sPrev}
    var target = -1;           // stop the child asked for (only the last one counts)
    var skip = false;          // the target was too close to brake for: wait until the bus has gone round
    var go = false;            // doors are closing / animals finishing, then the bus drives off
    var parkedAt = 0;          // stop index the bus stands at, -1 when moving or halted mid-road
    var door1 = 0;             // 0 closed .. 1 open
    var raf = 0, last = 0;

    function layout() {
      W = scene.clientWidth || window.innerWidth;
      H = scene.clientHeight || window.innerHeight;
      bw = Math.min(Math.max(W * 0.64, 240), W * 0.8, 460, H * 0.26 * VB_W / VB_H);
      bh = bw * VB_H / VB_W;
      L = W + bw;
      roadBase = H * 0.88;
      busTop = roadBase - bh;
      sy = H * 0.6;
      AS = Math.max(56, Math.min(76, bw * 0.24));
      for (var i = 0; i < 3; i++) {
        sx[i] = W * STOP_X[i];
        var c = clamp(sx[i], bw / 2, W - bw / 2);   // bus centre when stopped: the bus always stays fully on screen
        fs[i] = (c + bw / 2) / L;
      }
      scene.style.setProperty('--sy', sy.toFixed(1) + 'px');
      scene.style.setProperty('--ry', (H * 0.62).toFixed(1) + 'px');
      scene.style.setProperty('--rh', (H * 0.3).toFixed(1) + 'px');
      scene.style.setProperty('--bw', bw.toFixed(1) + 'px');
      scene.style.setProperty('--bh', bh.toFixed(1) + 'px');
      scene.style.setProperty('--as', AS.toFixed(1) + 'px');
      var hh = Math.min(H * 0.22, W * 0.2);
      houseEls.forEach(function (h) {
        h.style.width = h.style.height = hh.toFixed(1) + 'px';
        h.style.left = (parseFloat(h.getAttribute('data-x')) * W - hh / 2).toFixed(1) + 'px';
        h.style.top = (sy - hh).toFixed(1) + 'px';
      });
      treeEls.forEach(function (t) {
        var th = hh * 0.9;
        t.style.width = (th * 0.6).toFixed(1) + 'px'; t.style.height = th.toFixed(1) + 'px';
        t.style.left = (parseFloat(t.getAttribute('data-x')) * W - th * 0.3).toFixed(1) + 'px';
        t.style.top = (sy - th).toFixed(1) + 'px';
      });
      var sh = Math.max(sy * 0.45, 96);
      stopBtns.forEach(function (b, i) {
        b.style.width = Math.max(56, sh * 0.5).toFixed(1) + 'px';
        b.style.height = sh.toFixed(1) + 'px';
        b.style.left = (sx[i] - Math.max(56, sh * 0.5) / 2).toFixed(1) + 'px';
        b.style.top = (sy - sh).toFixed(1) + 'px';
      });
      if (parkedAt >= 0 && v === 0) { f = fs[parkedAt]; }
      else if (brake) { brake = null; ramp = { v0: v, vt: V, t: 0, dur: RAMP_S }; }   // stop moved: re-plan from the current speed, no snap
    }

    function anyHop() { return animals.some(function (a) { return a.st === 'hopin' || a.st === 'hopout'; }); }
    function parkedNow() { return parkedAt >= 0 && v === 0 && !brake; }

    function slotOf(a) {
      var n = 0;
      animals.forEach(function (b) { if (b.i < a.i && b.stop === a.stop && (b.st === 'wait' || b.st === 'hopout')) { n++; } });
      return n;
    }
    function waitPos(a) {
      var off = [AS * 0.9, -AS * 0.9, AS * 1.8][slotOf(a)];
      return [clamp(sx[a.stop] + off, AS / 2 + 4, W - AS / 2 - 4), sy - AS * 0.5 + 2];
    }
    function winPos(a) {
      return [f * L - bw + bw * WIN_X[a.i] / VB_W, busTop + bh * 0.4];
    }

    function depart() {
      parkedAt = -1;
      animals.forEach(function (a) { a.noBoard = false; });
    }

    function onBus() {
      if (parkedNow() || (v === 0 && !brake)) {
        if (parkedAt >= 0) { go = true; } else { ramp = { v0: 0, vt: V, t: 0, dur: RAMP_S }; target = -1; skip = false; }
      } else {
        // moving: slow down smoothly and halt where the bus is
        go = false; target = -1; skip = false; brake = null;
        ramp = { v0: v, vt: 0, t: 0, dur: RAMP_S };
      }
    }

    function onStop(j) {
      if (parkedNow() && parkedAt === j) {
        go = false; target = -1;
        animals.forEach(function (a) { if (a.stop === j) { a.noBoard = false; } });
        return;
      }
      if (target === j) { return; }
      target = j;
      skip = false;
      if (v === 0 && !brake) {
        if (parkedAt >= 0) { go = true; } else { ramp = { v0: 0, vt: V, t: 0, dur: RAMP_S }; }
      } else {
        go = false;
        if (brake) { brake = null; ramp = { v0: v, vt: V, t: 0, dur: RAMP_S }; }
        else if (ramp.vt < V) { ramp = { v0: v, vt: V, t: 0, dur: RAMP_S }; }
        var D = wrap(fs[j] - f);
        if (D < 1.25 * v) { skip = true; }   // just passed / too close to stop gently: it stops on the next loop
      }
    }

    function onAnimal(a) {
      if (a.st === 'wait') { onStop(a.stop); return; }
      if (a.st !== 'in') { return; }
      if (parkedNow() && door1 > 0.5) {
        a.st = 'hopout'; a.t = 0; a.stop = parkedAt; a.p0 = winPos(a); a.noBoard = true;
      } else if (a.wave < 0) { a.wave = 0; }
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
      last = now;
      var df = 0;

      // go: wait for the doors to close and the animals to finish, then drive off gently
      if (go && door1 <= 0.02 && !anyHop()) { go = false; depart(); ramp = { v0: 0, vt: V, t: 0, dur: RAMP_S }; }

      if (brake) {
        brake.t += dt;
        var u = Math.min(1, brake.t / brake.T);
        var s = brake.v0 * brake.T * (u - u * u * u + u * u * u * u / 2);
        v = brake.v0 * (1 - sm(u));
        df = s - brake.sPrev; brake.sPrev = s;
        f = wrap(brake.f0 + s);
        if (u >= 1) { v = 0; f = fs[target]; parkedAt = target; target = -1; brake = null; ramp = { v0: 0, vt: 0, t: RAMP_S, dur: RAMP_S }; }
      } else {
        ramp.t = Math.min(ramp.dur, ramp.t + dt);
        v = ramp.v0 + (ramp.vt - ramp.v0) * sm(ramp.t / ramp.dur);
        if (ramp.vt === 0 && ramp.t >= ramp.dur) { v = 0; }
        if (v < 0) { v = 0; }
        df = v * dt;
        f = wrap(f + df);
        if (v > 0 && parkedAt >= 0 && !go) { depart(); }
        // start braking about BRAKE_S before the asked-for stop (never backwards)
        if (target >= 0 && v > 0.002) {
          var D = wrap(fs[target] - f);
          if (skip) { if (D > 0.9) { skip = false; } }
          else if (D <= 1.5 * v) { brake = { v0: v, T: 2 * D / v, t: 0, f0: f, sPrev: 0 }; }
        }
      }
      var left = f * L - bw;
      bus.style.transform = 'translate(' + left.toFixed(1) + 'px,' + busTop.toFixed(1) + 'px)';
      odo += df * L;
      var ang = (odo / 13 * 57.2958) % 360;
      wheels.forEach(function (w) { var c = w.getAttribute('data-cx'); w.setAttribute('transform', 'rotate(' + ang.toFixed(1) + ' ' + c + ' 94)'); });

      // doors: open only while standing at a stop
      var doorT = (parkedNow() && (!go || anyHop())) ? 1 : 0;
      door1 += clamp(doorT - door1, -dt / DOOR_S, dt / DOOR_S);
      door.setAttribute('width', (46 * (1 - sm(door1) * 0.92)).toFixed(2));

      // boarding: one animal at a time, only while the doors are open
      if (parkedNow() && !go && door1 >= 0.95 && !anyHop()) {
        for (var q = 0; q < animals.length; q++) {
          var c = animals[q];
          if (c.st === 'wait' && c.stop === parkedAt && !c.noBoard) { c.st = 'hopin'; c.t = 0; c.p0 = waitPos(c); break; }
        }
      }

      animals.forEach(function (a) {
        var p, rot = 0;
        if (a.st === 'wait') { p = waitPos(a); }
        else if (a.st === 'in') { p = winPos(a); }
        else {
          a.t += dt;
          var k = Math.min(1, a.t / HOP_S), e = sm(k);
          var p1 = a.st === 'hopin' ? winPos(a) : waitPos(a);
          p = [a.p0[0] + (p1[0] - a.p0[0]) * e, a.p0[1] + (p1[1] - a.p0[1]) * e - Math.sin(k * Math.PI) * AS * 0.7];
          if (k >= 1) { a.st = a.st === 'hopin' ? 'in' : 'wait'; }
        }
        if (a.wave >= 0) {
          a.wave += dt;
          if (a.wave >= WAVE_S) { a.wave = -1; }
          else { var w = a.wave / WAVE_S; rot = Math.sin(w * Math.PI * 4) * 14 * Math.sin(w * Math.PI); }
        }
        a.x = p[0]; a.y = p[1];
        a.el.style.transform = 'translate(' + (p[0] - AS / 2).toFixed(1) + 'px,' + (p[1] - AS / 2).toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg)';
      });
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
    function bind(node, fn) {
      var h = function (e) { e.preventDefault(); fn(); };
      var k = function (e) { if (e.detail === 0) { fn(); } };
      node.addEventListener('pointerdown', h);
      node.addEventListener('click', k);
      offs.push(function () { node.removeEventListener('pointerdown', h); node.removeEventListener('click', k); });
    }
    bind(bus, onBus);
    stopBtns.forEach(function (b, i) { bind(b, function () { onStop(i); }); });
    animals.forEach(function (a) { bind(a.el, function () { onAnimal(a); }); });
    var onKey = function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === bus) { e.preventDefault(); onBus(); } };
    bus.addEventListener('keydown', onKey);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', layout);
    document.addEventListener('visibilitychange', onVis);

    layout();
    f = fs[0];
    start();

    return function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      offs.forEach(function (o) { o(); });
      bus.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', layout);
      window.removeEventListener('orientationchange', layout);
      document.removeEventListener('visibilitychange', onVis);
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'autobusik') { a.mount = mount; } });
})();
