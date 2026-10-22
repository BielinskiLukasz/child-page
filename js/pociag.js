// Activity "Mały Pociąg": touch the train -> it starts / stops gently; touch the station -> it stops there;
// touch an animal in a wagon -> it nods. All motion is driven by one rAF loop (capped dt, paused when the tab is
// hidden) so it keeps working under the global prefers-reduced-motion rule that disables CSS animations.
// Train position is a fraction f of the loop (0 = just off the left edge, 1 = just off the right edge), so the speed
// and the station position stay valid when the screen size or orientation changes.
(function () {
  var CROSS_S = 22;            // seconds for a full loop at cruise speed (the front crosses the visible width in >= ~12 s even on narrow screens)
  var V = 1 / CROSS_S;         // cruise speed, loop fractions per second
  var RAMP_S = 2;              // gentle start / stop
  var MAX_DT = 0.05;
  var MAX_PUFFS = 5, PUFF_S = 3.2;
  var NOD_S = 1.8;

  function sm(u) { return u * u * (3 - 2 * u); }
  function wrap(x) { return x - Math.floor(x); }

  function animalSvg(kind, cx) {
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
    return '<g class="tp-animal" data-cx="' + cx + '" transform="translate(' + cx + ' 50)">' + ears +
      '<circle cx="0" cy="0" r="16" fill="' + fur + '"/><circle cx="-6" cy="-3" r="2" fill="#5b5675"/>' +
      '<circle cx="6" cy="-3" r="2" fill="#5b5675"/>' + nose + '</g>';
  }

  function trainSvg() {
    var s = '<svg viewBox="0 0 400 100" aria-hidden="true" focusable="false">';
    var kinds = ['bear', 'rabbit', 'cat'], colors = ['#f7a8c9', '#a9d6f2', '#ffd98a'];
    for (var i = 0; i < 3; i++) {
      var x = 4 + i * 100, cx = x + 46;
      s += '<rect x="' + (x + 90) + '" y="76" width="14" height="4" rx="2" fill="#8a84a8"/>' +
        '<rect x="' + x + '" y="18" width="92" height="62" rx="12" fill="' + colors[i] + '"/>' +
        '<rect x="' + x + '" y="62" width="92" height="6" fill="#fff" opacity=".45"/>' +
        '<circle cx="' + cx + '" cy="50" r="21" fill="#fdfbff"/>' + animalSvg(kinds[i], cx) +
        '<path d="M' + (cx - 21) + ' 50a21 21 0 0 1 42 0z" fill="none"/>';
    }
    // locomotive
    s += '<rect x="304" y="30" width="60" height="50" rx="10" fill="#9ed8c6"/>' +
      '<rect x="340" y="14" width="46" height="66" rx="10" fill="#8cccb8"/>' +
      '<rect x="346" y="22" width="30" height="26" rx="8" fill="#fdfbff"/>' +
      '<rect x="318" y="8" width="16" height="26" rx="5" fill="#7a748f"/><rect x="314" y="4" width="24" height="8" rx="4" fill="#5b5675"/>' +
      '<circle cx="330" cy="58" r="7" fill="#ffe9a8"/><rect x="304" y="62" width="82" height="6" fill="#fff" opacity=".45"/>';
    // wheels (spokes rotate from JS)
    [30, 130, 230, 322, 362].forEach(function (wx) {
      s += '<g class="tp-wheel" data-cx="' + wx + '"><circle cx="' + wx + '" cy="86" r="11" fill="#6b6585"/>' +
        '<circle cx="' + wx + '" cy="86" r="6" fill="#cfc9e6"/><path d="M' + wx + ' 80v12M' + (wx - 6) + ' 86h12" stroke="#6b6585" stroke-width="2.5"/></g>';
    });
    return s + '</svg>';
  }

  function stationSvg() {
    return '<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">' +
      '<rect x="14" y="44" width="172" height="72" rx="8" fill="#fdf0d5"/>' +
      '<path d="M4 48L100 8l96 40z" fill="#f7b7a5"/>' +
      '<rect x="84" y="70" width="32" height="46" rx="8" fill="#b9b3e0"/>' +
      '<rect x="30" y="62" width="34" height="26" rx="6" fill="#cfeaf7"/><rect x="136" y="62" width="34" height="26" rx="6" fill="#cfeaf7"/>' +
      '<circle cx="100" cy="36" r="11" fill="#fff"/><path d="M100 36v-7M100 36l5 3" stroke="#5b5675" stroke-width="2.5" stroke-linecap="round"/></svg>';
  }

  function hillsSvg() {
    return '<svg class="tp-hills" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      '<path d="M0 200V110Q140 30 300 100T600 90T1000 70V200z" fill="#cdeac3"/>' +
      '<path d="M0 200V150Q200 90 420 140T800 120T1000 140V200z" fill="#b6e0aa"/></svg>';
  }

  function mount(container) {
    var scene = document.createElement('div');
    scene.className = 'tp';
    scene.setAttribute('role', 'group');
    scene.setAttribute('aria-label', 'Mały pociąg');
    scene.innerHTML =
      '<div class="tp-sun"></div>' + hillsSvg() + '<div class="tp-ground"></div><div class="tp-track"></div>' +
      '<button class="tp-station" type="button" aria-label="Stacja – zatrzymaj pociąg na stacji">' + stationSvg() + '</button>' +
      '<div class="tp-puffs"></div>' +
      '<div class="tp-train" role="button" tabindex="0" aria-label="Pociąg – ruszaj lub zatrzymaj">' + trainSvg() +
      '<button class="tp-ab" type="button" data-i="0" aria-label="Miś w wagonie"></button>' +
      '<button class="tp-ab" type="button" data-i="1" aria-label="Króliczek w wagonie"></button>' +
      '<button class="tp-ab" type="button" data-i="2" aria-label="Kotek w wagonie"></button></div>';
    container.appendChild(scene);

    var train = scene.querySelector('.tp-train');
    var station = scene.querySelector('.tp-station');
    var puffLayer = scene.querySelector('.tp-puffs');
    var animals = [].slice.call(scene.querySelectorAll('.tp-animal'));
    var wheels = [].slice.call(scene.querySelectorAll('.tp-wheel'));
    var abtns = [].slice.call(scene.querySelectorAll('.tp-ab'));
    var nods = animals.map(function () { return -1; });

    var W = 0, H = 0, tw = 0, th = 0, trackY = 0, L = 1, fs = 0.5;
    var f = 0, v = 0, odo = 0, f_unwrapped = 0, df = 0;
    var ramp = { v0: 0, vt: 0, t: RAMP_S, dur: RAMP_S };
    var plan = null;
    var parked = true;
    var puffs = [], puffT = 0;
    var raf = 0, last = 0;

    function layout() {
      W = scene.clientWidth || window.innerWidth;
      H = scene.clientHeight || window.innerHeight;
      tw = Math.min(W * 0.8, 560, H * 1.6);
      th = tw / 4;
      trackY = H * 0.72;
      L = W + tw;
      fs = (tw + (W - tw) / 2) / L;
      scene.style.setProperty('--tw', tw.toFixed(1) + 'px');
      scene.style.setProperty('--th', th.toFixed(1) + 'px');
      scene.style.setProperty('--ty', trackY.toFixed(1) + 'px');
      if (parked) { f = fs; }
      else if (plan) { goStation(); }   // station moved: re-plan from the current speed so there is no snap at the end
      place();
    }

    function place() {
      train.style.transform = 'translate(' + (f * L - tw).toFixed(1) + 'px,' + (trackY - th * 0.9).toFixed(1) + 'px)';
    }

    function startRamp(vt) {
      plan = null;
      ramp = { v0: v, vt: vt, t: 0, dur: RAMP_S };
    }

    function goStation() {
      if (parked) { return; }
      var D = wrap(fs - f);
      if (D < 0.002 && v < V * 0.05) { f = fs; v = 0; parked = true; plan = null; ramp = { v0: 0, vt: 0, t: RAMP_S, dur: RAMP_S }; place(); return; }
      // cubic Hermite from the current speed to a stop at the station: smooth, never backwards
      // T is capped at 2.85*D/v (Hermite with end speed 0 stays monotone while v*T <= 3D); a lap is added only when that would mean braking in < 2.5 s
      var T = Math.max(2.5, 1.2 * D / V);
      if (v > 0 && v * T > 2.85 * D) { T = 2.85 * D / v; }
      if (T < 2.5) { D += 1; T = Math.max(2.5, 1.2 * D / V); if (v * T > 2.85 * D) { T = 2.85 * D / v; } }
      plan = { D: D, T: T, v0: v, t: 0 };
      f_unwrapped = f;
      plan.f0 = f;
    }

    function onTrain() {
      var moving = plan || ramp.vt > 0;
      parked = false;
      startRamp(moving ? 0 : V);
    }

    function onAnimal(i) { if (nods[i] < 0) { nods[i] = 0; } }

    function spawnPuff() {
      if (puffs.length >= MAX_PUFFS) { return; }
      var n = document.createElement('div');
      n.className = 'tp-puff';
      puffLayer.appendChild(n);
      puffs.push({ n: n, t: 0, x: f * L - tw + tw * 0.83, y: trackY - th * 0.9 + th * 0.02, dx: 6 + Math.random() * 6 });
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
      last = now;
      var df = 0;
      if (plan) {
        plan.t += dt;
        var u = Math.min(1, plan.t / plan.T), s;
        var vT = plan.v0 * plan.T, u2 = u * u, u3 = u2 * u;
        s = vT * (u3 - 2 * u2 + u) + plan.D * (3 * u2 - 2 * u3);
        v = Math.max(0, (vT * (3 * u2 - 4 * u + 1) + plan.D * 6 * u * (1 - u)) / plan.T);
        if (u >= 1) { s = plan.D; v = 0; parked = true; ramp = { v0: 0, vt: 0, t: RAMP_S, dur: RAMP_S }; df = plan.f0 + s - f_unwrapped; plan = null; f = fs; f_unwrapped = f; }
        else { df = plan.f0 + s - f_unwrapped; f_unwrapped = plan.f0 + s; f = wrap(f_unwrapped); }
      } else {
        ramp.t = Math.min(ramp.dur, ramp.t + dt);
        v = ramp.v0 + (ramp.vt - ramp.v0) * sm(ramp.t / ramp.dur);
        if (v < 0) { v = 0; }
        df = v * dt;
        f = wrap(f + df);
        f_unwrapped = f;
      }
      odo += df * L;
      place();
      var ang = (odo / 11 * 57.2958) % 360;
      wheels.forEach(function (w) { w.setAttribute('transform', 'rotate(' + ang.toFixed(1) + ' ' + w.getAttribute('data-cx') + ' 86)'); });

      animals.forEach(function (a, i) {
        var cx = a.getAttribute('data-cx');
        if (nods[i] < 0) { return; }
        nods[i] += dt;
        if (nods[i] >= NOD_S) { nods[i] = -1; a.setAttribute('transform', 'translate(' + cx + ' 50)'); return; }
        var k = nods[i] / NOD_S, e = Math.sin(k * Math.PI);
        var rot = Math.sin(k * Math.PI * 2) * 14 * e, dy = Math.sin(k * Math.PI * 2) * 3 * e;
        a.setAttribute('transform', 'translate(' + cx + ' ' + (50 + dy).toFixed(2) + ') rotate(' + rot.toFixed(2) + ')');
      });

      // soft steam: bounded pool, nodes removed when finished
      puffT -= dt;
      if (puffT <= 0) { spawnPuff(); puffT = v > 0.002 ? 1.1 : 2.4; }
      for (var i = puffs.length - 1; i >= 0; i--) {
        var p = puffs[i];
        p.t += dt;
        if (p.t >= PUFF_S) { if (p.n.parentNode) { p.n.parentNode.removeChild(p.n); } puffs.splice(i, 1); continue; }
        var k2 = p.t / PUFF_S, sz = th * (0.18 + 0.3 * k2);
        p.n.style.width = p.n.style.height = sz.toFixed(1) + 'px';
        p.n.style.opacity = (0.8 * (1 - k2) * Math.min(1, k2 * 6)).toFixed(3);
        p.n.style.transform = 'translate(' + (p.x - sz / 2 - p.dx * k2).toFixed(1) + 'px,' + (p.y - th * 1.1 * k2 - sz / 2).toFixed(1) + 'px)';
      }
      if (!document.hidden) { raf = requestAnimationFrame(frame); }
    }
    var f_unwrapped = 0;

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
      var h = function (e) { if (e.target.closest && e.target.closest('.tp-ab') && node === train) { return; } e.preventDefault(); fn(); };
      var k = function (e) { if (e.detail === 0) { fn(); } };
      node.addEventListener('pointerdown', h);
      node.addEventListener('click', k);
      offs.push(function () { node.removeEventListener('pointerdown', h); node.removeEventListener('click', k); });
    }
    bind(train, onTrain);
    bind(station, goStation);
    abtns.forEach(function (b, i) {
      var h = function (e) { e.stopPropagation(); e.preventDefault(); onAnimal(i); };
      var k = function (e) { e.stopPropagation(); if (e.detail === 0) { onAnimal(i); } };
      b.addEventListener('pointerdown', h);
      b.addEventListener('click', k);
      offs.push(function () { b.removeEventListener('pointerdown', h); b.removeEventListener('click', k); });
    });
    var onKey = function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === train) { e.preventDefault(); onTrain(); } };
    train.addEventListener('keydown', onKey);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', layout);
    document.addEventListener('visibilitychange', onVis);

    layout();
    f_unwrapped = f;
    start();

    return function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      offs.forEach(function (o) { o(); });
      train.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', layout);
      window.removeEventListener('orientationchange', layout);
      document.removeEventListener('visibilitychange', onVis);
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'pociag') { a.mount = mount; } });
})();
