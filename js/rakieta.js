// Activity "Rakieta": a small rocket with an animal astronaut drifts through a starry sky with three friendly planets.
// Touch the rocket -> it flies slowly along a smooth looping path; touch it again -> it slows to a hover (~2 s) and bobs.
// Touch a planet -> the rocket curves over to it (damped spring, rotated pull), hovers beside it for ~3 s while the planet
// glows softly, then resumes what it was doing. Touch a star -> one slow twinkle; touch the astronaut -> a slow wave.
// All motion runs from one rAF loop (capped dt, paused when the tab is hidden) so it works under the global
// prefers-reduced-motion rule that disables CSS animations.
(function () {
  var CROSS_S = 15;             // seconds to cross the screen width at cruise speed (>= 12 s)
  var HOVER_TAU = 0.5;          // slow-down time constant (~2 s to stop)
  var BOB_AMP = 4, BOB_W = 1.9; // bob <= ~4 px each way, one bob every ~3.3 s
  var STAY_S = 3;               // time next to a planet
  var MAX_DT = 0.05;
  var MAX_PUFFS = 8, PUFF_S = 2.6, PUFF_EVERY = 0.6;
  var WAVE_S = 2.4, TW_S = 2.4;
  var K = 0.8, C = 1.8;         // spring stiffness and damping (about critical)
  var TWO_PI = Math.PI * 2, UP = -Math.PI / 2;

  var STARS = [[0.07, 0.08], [0.3, 0.06], [0.5, 0.13], [0.72, 0.07], [0.93, 0.12], [0.38, 0.3], [0.12, 0.42], [0.9, 0.5],
    [0.48, 0.46], [0.28, 0.62], [0.75, 0.83], [0.92, 0.72], [0.42, 0.86], [0.05, 0.26], [0.62, 0.3]];
  var PLANETS = [[0.2, 0.2], [0.8, 0.32], [0.62, 0.68]];
  var PCOL = [['#f7c9a0', '#e9b184'], ['#c9b8f2', '#b3a0e6'], ['#a8d8f0', '#8fc6e6']];

  function sm(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
  function wrapPi(a) { a = (a + Math.PI) % TWO_PI; if (a < 0) { a += TWO_PI; } return a - Math.PI; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function rocketSvg() {
    return '<svg viewBox="0 0 200 100" aria-hidden="true" focusable="false">' +
      '<g class="rq-flame"><path d="M44 50Q20 32 6 50Q20 68 44 50z" fill="#ffd98a"/><path d="M44 50Q28 41 18 50Q28 59 44 50z" fill="#fff4cf"/></g>' +
      '<path d="M70 28L50 6Q62 4 78 22z" fill="#a8d8f0"/><path d="M70 72L50 94Q62 96 78 78z" fill="#a8d8f0"/>' +
      '<path d="M40 32Q40 22 54 22L118 22Q160 28 180 50Q160 72 118 78L54 78Q40 78 40 68z" fill="#fdfbff"/>' +
      '<path d="M140 25Q166 32 180 50Q166 68 140 75Q150 50 140 25z" fill="#f7a8c9"/>' +
      '<rect x="48" y="40" width="10" height="20" rx="5" fill="#c9b8f2"/>' +
      '<circle cx="104" cy="50" r="19" fill="#cfeaf7" stroke="#a8d8f0" stroke-width="4"/>' +
      '<g class="rq-ast"><circle cx="95" cy="40" r="5" fill="#c99b72"/><circle cx="113" cy="40" r="5" fill="#c99b72"/>' +
      '<circle cx="104" cy="51" r="12" fill="#c99b72"/><ellipse cx="104" cy="56" rx="5.5" ry="4" fill="#f3dcc4"/>' +
      '<circle cx="99" cy="49" r="1.8" fill="#5b5675"/><circle cx="109" cy="49" r="1.8" fill="#5b5675"/>' +
      '<circle cx="104" cy="54.5" r="1.6" fill="#6b5a73"/>' +
      '<g class="rq-paw"><circle cx="0" cy="0" r="4.5" fill="#c99b72"/></g></g></svg>';
  }

  function starSvg() {
    return '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M20 3l4.6 11.6L37 15.6l-9.6 7.8L30.4 36 20 29l-10.4 7 3-12.6L3 15.6l12.4-1z" fill="#fff4cf" stroke="#fff4cf" stroke-width="3" stroke-linejoin="round"/></svg>';
  }

  function planetSvg(i) {
    var c = PCOL[i];
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<circle cx="50" cy="50" r="44" fill="' + c[0] + '"/>' +
      '<circle cx="24" cy="36" r="8" fill="' + c[1] + '"/><circle cx="78" cy="66" r="10" fill="' + c[1] + '"/><circle cx="66" cy="22" r="5" fill="' + c[1] + '"/>' +
      '<circle cx="39" cy="46" r="3.6" fill="#5b5675"/><circle cx="61" cy="46" r="3.6" fill="#5b5675"/>' +
      '<path d="M38 59Q50 70 62 59" fill="none" stroke="#6b5a73" stroke-width="3.4" stroke-linecap="round"/>' +
      '<circle cx="31" cy="57" r="5" fill="#f7a8c9" opacity=".55"/><circle cx="69" cy="57" r="5" fill="#f7a8c9" opacity=".55"/></svg>';
  }

  function mount(container) {
    var scene = document.createElement('div');
    scene.className = 'rq';
    scene.setAttribute('role', 'group');
    scene.setAttribute('aria-label', 'Rakieta');
    var html = '';
    var i;
    for (i = 0; i < STARS.length; i++) {
      html += '<button class="rq-star" type="button" data-i="' + i + '" aria-label="Gwiazdka ' + (i + 1) + ' – zamigocze">' + starSvg() + '</button>';
    }
    for (i = 0; i < PLANETS.length; i++) {
      html += '<button class="rq-planet" type="button" data-i="' + i + '" aria-label="Planeta ' + (i + 1) + ' – rakieta poleci do niej"><span class="rq-halo"></span>' + planetSvg(i) + '</button>';
    }
    html += '<div class="rq-puffs"></div>' +
      '<div class="rq-rocket" role="button" tabindex="0" aria-label="Rakieta – leć lub zawisnij">' + rocketSvg() +
      '<button class="rq-abtn" type="button" aria-label="Miś astronauta – pomachaj"></button></div>';
    scene.innerHTML = html;
    container.appendChild(scene);

    var rocket = scene.querySelector('.rq-rocket');
    var abtn = scene.querySelector('.rq-abtn');
    var flame = scene.querySelector('.rq-flame');
    var paw = scene.querySelector('.rq-paw');
    var puffLayer = scene.querySelector('.rq-puffs');
    var stars = [].slice.call(scene.querySelectorAll('.rq-star'));
    var planets = [].slice.call(scene.querySelectorAll('.rq-planet'));
    var halos = planets.map(function (p) { return p.querySelector('.rq-halo'); });
    var twT = stars.map(function () { return -1; });
    var glow = planets.map(function () { return 0; });

    var W = 0, H = 0, pw = 160, ph = 80, m = 90, sc = 40, Rt = 40, Om = 1, pr = 80;
    var cx = 0, cy = 0, rx = 0, ry = 0;
    var st = 'hover', prev = 'hover';          // hover | fly | visit
    var x = 0, y = 0, hd = UP, spd = 0, om = 0;
    var ang = UP, sy = 1, face = 1;
    var vs = null;                             // visit: { i, phase, t, vx, vy, curve, tt }
    var puffs = [], puffT = 0, waveT = -1, clock = 0;
    var raf = 0, last = 0, started = false;

    function planetPos(i) { return { x: W * PLANETS[i][0], y: H * PLANETS[i][1] }; }
    function spot(i) {
      var p = planetPos(i), side = p.x < W / 2 ? 1 : -1;
      return { x: clamp(p.x + side * (pr / 2 + pw * 0.5 + 10), m, W - m), y: clamp(p.y, m, H - m) };
    }

    function layout() {
      var oW = W, oH = H;
      W = scene.clientWidth || window.innerWidth;
      H = scene.clientHeight || window.innerHeight;
      pw = clamp(Math.min(W * 0.3, H * 0.4), 150, 260);
      ph = pw / 2;
      m = pw * 0.5 + 6;
      pr = clamp(Math.min(W, H) * 0.2, 64, 140);
      sc = W / CROSS_S;
      Rt = Math.max(Math.min(W, H) * 0.09, 36);
      Om = sc / Rt;
      cx = W / 2; cy = H / 2;
      rx = Math.max(20, W / 2 - m); ry = Math.max(20, H / 2 - m);
      scene.style.setProperty('--pw', pw.toFixed(1) + 'px');
      scene.style.setProperty('--ph', ph.toFixed(1) + 'px');
      scene.style.setProperty('--pr', pr.toFixed(1) + 'px');
      planets.forEach(function (p, k) {
        var q = planetPos(k);
        p.style.left = q.x.toFixed(1) + 'px'; p.style.top = q.y.toFixed(1) + 'px';
      });
      stars.forEach(function (s, k) {
        s.style.left = (STARS[k][0] * W).toFixed(1) + 'px'; s.style.top = (STARS[k][1] * H).toFixed(1) + 'px';
      });
      if (!started) {
        x = Math.max(W * 0.16, m); y = Math.min(H * 0.82, H - m); started = true;
      } else if (oW && oH) {
        x *= W / oW; y *= H / oH;
        if (vs) { vs.vx *= W / oW; vs.vy *= H / oH; }
      }
      x = clamp(x, m, W - m); y = clamp(y, m, H - m);
      render();
    }

    function bobY() {
      var cur = st === 'visit' && vs ? Math.hypot(vs.vx, vs.vy) : spd;
      return Math.sin(clock * BOB_W) * BOB_AMP * (1 - sm(cur / (0.4 * sc)));
    }

    function render() {
      rocket.style.transform = 'translate(' + (x - pw / 2).toFixed(1) + 'px,' + (y + bobY() - ph / 2).toFixed(1) + 'px) rotate(' +
        (ang * 57.2958).toFixed(2) + 'deg) scale(1,' + sy.toFixed(3) + ')';
    }

    function endVisit(toState) {
      if (vs) {
        var s = Math.hypot(vs.vx, vs.vy);
        if (s > 1) { hd = Math.atan2(vs.vy, vs.vx); }
        spd = s; om = 0; vs = null;
      }
      st = toState;
    }

    function onRocket() {
      if (st === 'visit') { prev = prev === 'fly' ? 'hover' : 'fly'; endVisit(prev); }
      else if (st === 'hover') { st = 'fly'; }
      else { st = 'hover'; }
    }

    function onPlanet(i) {
      if (st !== 'visit') {
        prev = st;
        vs = { i: i, phase: 'go', t: 0, vx: Math.cos(hd) * spd, vy: Math.sin(hd) * spd, curve: x < W / 2 ? -1 : 1 };
        st = 'visit';
      } else { vs.i = i; vs.phase = 'go'; vs.t = 0; vs.curve = x < W / 2 ? -1 : 1; }
    }

    function onStar(i) { if (twT[i] < 0) { twT[i] = 0; } }
    function onAstronaut() { if (waveT < 0) { waveT = 0; } }

    function spawnPuff() {
      if (puffs.length >= MAX_PUFFS) { return; }
      var n = document.createElement('div');
      n.className = 'rq-puff';
      puffLayer.appendChild(n);
      puffs.push({ n: n, t: 0, x: x - Math.cos(ang) * pw * 0.52, y: y + bobY() - Math.sin(ang) * pw * 0.52 });
    }

    function steer(tx, ty, gate, dt) {
      var diff = wrapPi(Math.atan2(ty - y, tx - x) - hd);
      var want = clamp(diff * 1.5, -Om, Om) * gate;
      om += (want - om) * Math.min(1, dt * 2.5);
      hd += om * dt;
    }

    function updateFly(dt) {
      spd += (sc - spd) * (1 - Math.exp(-dt * 0.9));
      var gate = sm((spd / sc - 0.15) / 0.5);
      var th = Math.atan2((y - cy) / ry, (x - cx) / rx) + 0.6;
      steer(cx + rx * Math.cos(th), cy + ry * Math.sin(th), gate, dt);
      x += Math.cos(hd) * spd * dt;
      y += Math.sin(hd) * spd * dt;
    }

    function updateHover(dt) {
      spd *= Math.exp(-dt / HOVER_TAU);
      if (spd < 0.01 * sc) { spd = 0; om = 0; }
      x += Math.cos(hd) * spd * dt;
      y += Math.sin(hd) * spd * dt;
    }

    function updateVisit(dt) {
      var T = spot(vs.i), dx = T.x - x, dy = T.y - y, dist = Math.hypot(dx, dy);
      var a = vs.phase === 'go' ? vs.curve * 0.6 * sm(dist / (pw * 3)) : 0;
      var ca = Math.cos(a), sa = Math.sin(a);
      var ax = K * (dx * ca - dy * sa) - C * vs.vx, ay = K * (dx * sa + dy * ca) - C * vs.vy;
      vs.vx += ax * dt; vs.vy += ay * dt;
      var s = Math.hypot(vs.vx, vs.vy), cap = 1.1 * sc;
      if (s > cap) { vs.vx *= cap / s; vs.vy *= cap / s; s = cap; }
      x += vs.vx * dt; y += vs.vy * dt;
      vs.t += dt;
      if (vs.phase === 'go') {
        if ((dist < 10 && s < 0.15 * sc) || vs.t > 25) { vs.phase = 'stay'; vs.t = 0; }
      } else if (vs.t >= STAY_S) { endVisit(prev); }
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
      last = now;
      clock += dt;
      if (st === 'fly') { updateFly(dt); }
      else if (st === 'hover') { updateHover(dt); }
      else { updateVisit(dt); }
      x = clamp(x, m, W - m); y = clamp(y, m, H - m);

      // displayed angle: nose along the travel direction when moving, upright when hovering; never abrupt
      var cur = st === 'visit' && vs ? Math.hypot(vs.vx, vs.vy) : spd;
      var dir = st === 'visit' && vs && cur > 1 ? Math.atan2(vs.vy, vs.vx) : hd;
      var k = sm((cur / sc - 0.25) / 0.6);
      var target = UP + wrapPi(dir - UP) * k;
      ang += wrapPi(target - ang) * Math.min(1, dt * 2.5);
      var cs = Math.cos(ang);
      if (Math.abs(cs) > 0.2) { face = cs > 0 ? 1 : -1; }
      sy += (face - sy) * Math.min(1, dt * 4);

      flame.setAttribute('transform', 'translate(44 50) scale(' + (0.75 + 0.15 * Math.sin(clock * 2.2) + 0.3 * Math.min(1, cur / sc)).toFixed(3) + ') translate(-44 -50)');

      if (waveT >= 0) {
        waveT += dt;
        if (waveT >= WAVE_S) { waveT = -1; paw.setAttribute('transform', 'translate(122 56)'); paw.setAttribute('opacity', '0'); }
        else {
          var q = waveT / WAVE_S, e = Math.sin(q * Math.PI);
          paw.setAttribute('opacity', '1');
          paw.setAttribute('transform', 'translate(' + (122 + Math.sin(q * Math.PI * 4) * 4 * e).toFixed(2) + ' ' + (56 - 16 * e).toFixed(2) + ')');
        }
      }

      for (var i = 0; i < stars.length; i++) {
        if (twT[i] >= 0) {
          twT[i] += dt;
          if (twT[i] >= TW_S) { twT[i] = -1; stars[i].firstChild.style.transform = ''; stars[i].firstChild.style.opacity = ''; }
          else {
            var u = Math.sin(Math.PI * twT[i] / TW_S);
            stars[i].firstChild.style.transform = 'scale(' + (1 + 0.7 * u).toFixed(3) + ')';
            stars[i].firstChild.style.opacity = (0.75 + 0.25 * u).toFixed(3);
          }
        }
      }

      for (var j = 0; j < planets.length; j++) {
        var want = st === 'visit' && vs && vs.i === j && vs.phase === 'stay' ? 1 : 0;
        glow[j] += (want - glow[j]) * Math.min(1, dt * 1.5);
        if (Math.abs(glow[j] - want) < 0.003) { glow[j] = want; }
        halos[j].style.opacity = glow[j].toFixed(3);
        halos[j].style.transform = 'scale(' + (0.9 + 0.2 * glow[j]).toFixed(3) + ')';
      }

      puffT -= dt;
      if (puffT <= 0) { spawnPuff(); puffT = PUFF_EVERY; }
      for (var n = puffs.length - 1; n >= 0; n--) {
        var p = puffs[n];
        p.t += dt;
        if (p.t >= PUFF_S) { if (p.n.parentNode) { p.n.parentNode.removeChild(p.n); } puffs.splice(n, 1); continue; }
        var f = p.t / PUFF_S, sz = ph * (0.16 + 0.22 * f);
        p.n.style.width = p.n.style.height = sz.toFixed(1) + 'px';
        p.n.style.opacity = (0.7 * (1 - f) * Math.min(1, f * 6)).toFixed(3);
        p.n.style.transform = 'translate(' + (p.x - sz / 2).toFixed(1) + 'px,' + (p.y - sz / 2).toFixed(1) + 'px)';
      }

      render();
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
    function bindTap(node, fn, stop) {
      var h = function (e) { if (stop) { e.stopPropagation(); } e.preventDefault(); fn(); };
      var kk = function (e) { if (stop) { e.stopPropagation(); } if (e.detail === 0) { fn(); } };
      node.addEventListener('pointerdown', h);
      node.addEventListener('click', kk);
      offs.push(function () { node.removeEventListener('pointerdown', h); node.removeEventListener('click', kk); });
    }
    bindTap(rocket, onRocket, false);
    bindTap(abtn, onAstronaut, true);
    stars.forEach(function (s, k) { bindTap(s, function () { onStar(k); }, true); });
    planets.forEach(function (p, k) { bindTap(p, function () { onPlanet(k); }, true); });
    var onKey = function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === rocket) { e.preventDefault(); onRocket(); } };
    rocket.addEventListener('keydown', onKey);
    window.addEventListener('resize', layout);
    window.addEventListener('orientationchange', layout);
    document.addEventListener('visibilitychange', onVis);

    paw.setAttribute('transform', 'translate(122 56)');
    paw.setAttribute('opacity', '0');
    layout();
    start();

    return function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      offs.forEach(function (o) { o(); });
      rocket.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', layout);
      window.removeEventListener('orientationchange', layout);
      document.removeEventListener('visibilitychange', onVis);
      puffs.forEach(function (p) { if (p.n.parentNode) { p.n.parentNode.removeChild(p.n); } });
      puffs = [];
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'rakieta') { a.mount = mount; } });
})();
