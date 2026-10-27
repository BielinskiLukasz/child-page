// Activity "Wyścig Piesków": a friendly dog race. Four different random breeds (window.Dogs) run left to right in four lanes, each at
// its own gentle base speed (a race takes 25-35 s) and keep going untouched. Tapping a dog gives it a smooth ~1 s speed boost (+40%,
// never more than +60%) with a small dust puff. The race is never decided: from half way the dogs' speeds are blended towards one common
// finishing time, so all four finish within ~3 s of each other. Finished dogs wag their tails (happy face, Polish breed name small underneath);
// when all are in, confetti falls for ~4 s and a new race with new breeds begins. Positions are fractions of the track (rotation-safe),
// speed changes are slew-limited, one capped-dt rAF loop (pauses while hidden, stops on cleanup). Keyboard: Tab to a dog, Enter/Space cheers.
// Nothing is scored or stored. Usage metrics: track('interaction', {variant: breed}) on each cheer, complete() when a race is finished.
(function () {
  var LANES = 4, T_MIN = 25, T_MAX = 35;
  var BOOST_ADD = 0.4, BOOST_MAX = 0.6, BOOST_S = 1, BOOST_SLEW = 1.2;   // boost factor change per second
  var ACC = 0.02;                       // slew limit of the speed, track fractions per second squared
  var BLEND_FROM = 0.5, BLEND_TO = 0.9; // leader progress between which speeds are blended to a common finishing time
  var END_GAP_S = 2.5;                  // after the first finish nobody needs longer than this for the rest
  var CONFETTI = 36, CONFETTI_S = 4, FALL_S = 2.2, PUFFS = 12, PUFF_S = 0.55, SWAP_S = 0.7, WAG_HZ = 2.2;
  var COLORS = ['#f7a8c9', '#ffd98a', '#a8d8f0', '#b6e0aa', '#c9b8f2', '#f4a261'];
  var lastSet = '';

  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }

  // Four different breeds in random order; never the same set as the previous race.
  function pickBreeds() {
    var pick;
    do {
      var pool = window.Dogs.LIST.slice(), out = [];
      while (out.length < LANES) { out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); }
      pick = out;
    } while (pick.map(function (d) { return d.id; }).sort().join() === lastSet);
    lastSet = pick.map(function (d) { return d.id; }).sort().join();
    return pick;
  }

  function mount(container) {
    container.style.display = 'block';
    var board = document.createElement('div');
    board.className = 'wp';
    var html = '<div class="wp-field">';
    for (var i = 0; i < LANES; i++) {
      html += '<div class="wp-lane"><div class="wp-finish"></div><div class="wp-puffs"></div>' +
        '<button type="button" class="wp-dog"><span class="wp-art"></span><span class="wp-name"></span></button></div>';
    }
    html += '<div class="wp-confetti"></div></div>';
    board.innerHTML = html;
    container.appendChild(board);
    var field = board.querySelector('.wp-field'), confWrap = board.querySelector('.wp-confetti');
    var laneEls = board.querySelectorAll('.wp-lane');

    var runners = [], k;
    for (k = 0; k < LANES; k++) {
      var le = laneEls[k], r = { lane: le, btn: le.querySelector('.wp-dog'), art: le.querySelector('.wp-art'), nameEl: le.querySelector('.wp-name'),
        puffWrap: le.querySelector('.wp-puffs'), puffs: [], dog: null, p: 0, v: 0, base: 0, boost: 0, boostT: 0, boostTarget: 0,
        done: false, doneT: 0, wag: 0, happy: null, calm: null, tail: null, tailP: [0, 0], pw: 80, ph: 60 };
      for (var q = 0; q < PUFFS; q++) {
        var pn = document.createElement('div');
        pn.className = 'wp-puff'; pn.style.display = 'none';
        r.puffWrap.appendChild(pn);
        r.puffs.push({ node: pn, age: -1, x: 0, y: 0 });
      }
      runners.push(r);
    }
    var conf = [];
    for (k = 0; k < CONFETTI; k++) {
      var cn = document.createElement('div');
      cn.className = 'wp-conf'; cn.style.display = 'none';
      cn.style.background = COLORS[k % COLORS.length];
      confWrap.appendChild(cn);
      conf.push({ node: cn, age: -1, x: 0, drift: 0, delay: 0, rot: 0 });
    }

    var alive = true, raf = 0, last = 0, phase = 'run', phaseT = 0, fieldOp = 1, firstDone = false, wasReported = false;
    var trackW = 300;

    function setMood(r, on) {
      if (!r.happy) { return; }
      r.happy.setAttribute('display', on ? 'inline' : 'none');
      r.calm.setAttribute('display', on ? 'none' : 'inline');
    }
    function rotTail(r, a) { if (r.tail) { r.tail.setAttribute('transform', a ? 'rotate(' + a.toFixed(2) + ' ' + r.tailP[0] + ' ' + r.tailP[1] + ')' : ''); } }

    function newRace() {
      var breeds = pickBreeds();
      runners.forEach(function (r, i) {
        var d = breeds[i];
        r.dog = d;
        r.art.innerHTML = window.Dogs.draw(d.id);
        r.calm = r.art.querySelector('.dg-calm'); r.happy = r.art.querySelector('.dg-happy'); r.tail = r.art.querySelector('.dg-tail');
        r.tailP = r.tail ? [+r.tail.getAttribute('data-px'), +r.tail.getAttribute('data-py')] : [0, 0];
        setMood(r, false); rotTail(r, 0);
        r.nameEl.textContent = d.name;
        r.btn.setAttribute('aria-label', 'Piesek: ' + d.name + '. Dotknij lub naciśnij Enter, aby zachęcić do biegu.');
        r.base = 1 / (T_MIN + Math.random() * (T_MAX - T_MIN));
        r.p = 0; r.v = r.base; r.boost = 0; r.boostT = 0; r.boostTarget = 0; r.done = false; r.doneT = 0; r.wag = 0;
        r.puffs.forEach(function (pf) { pf.age = -1; pf.node.style.display = 'none'; });
      });
      conf.forEach(function (c) { c.age = -1; c.node.style.display = 'none'; });
      firstDone = false; wasReported = false; phaseT = 0;
      layout();
    }

    function puff(r) {
      for (var j = 0; j < r.puffs.length; j++) {
        var pf = r.puffs[j];
        if (pf.age >= 0) { continue; }
        pf.age = 0; pf.x = r.p * (trackW - r.pw) + r.pw * 0.1; pf.y = r.ph * 0.78;
        pf.node.style.display = '';
        pf.node.style.left = pf.x + 'px'; pf.node.style.top = pf.y + 'px';
        return;
      }
    }
    function cheer(r) {
      report(function (A) { A.track('interaction', { variant: r.dog.id }); });
      if (r.done) { r.wag = 0.8; start(); return; }
      r.boostTarget = Math.min(BOOST_MAX, r.boostTarget + BOOST_ADD);
      r.boostT = BOOST_S;
      puff(r);
      start();
    }

    function startConfetti() {
      conf.forEach(function (c, i) {
        c.age = 0; c.x = Math.random(); c.drift = (Math.random() - 0.5) * 0.12; c.delay = (i / CONFETTI) * (CONFETTI_S - FALL_S - 0.3) * Math.random() * 1.0;
        c.rot = Math.random() * 360;
        c.node.style.display = '';
      });
    }
    function paintConfetti() {
      var h = field.clientHeight;
      conf.forEach(function (c) {
        if (c.age < 0) { return; }
        var u = (c.age - c.delay) / FALL_S;
        if (u < 0) { c.node.style.opacity = '0'; return; }
        u = Math.min(1, u);
        c.node.style.left = ((c.x + c.drift * u) * 100).toFixed(2) + '%';
        c.node.style.top = (-10 + (h + 20) * u).toFixed(1) + 'px';
        c.node.style.opacity = (u < 0.85 ? 1 : (1 - u) / 0.15).toFixed(3);
        c.node.style.transform = 'rotate(' + (c.rot + 360 * u).toFixed(0) + 'deg)';
      });
    }
    function paint() {
      runners.forEach(function (r) {
        r.btn.style.transform = 'translateX(' + (r.p * (trackW - r.pw)).toFixed(1) + 'px)';
      });
    }

    // One simulation step: target speed per dog, slew-limited speed, progress.
    function step(dt) {
      var live = runners.filter(function (r) { return !r.done; });
      var lead = 0;
      runners.forEach(function (r) { if (r.p > lead) { lead = r.p; } });
      // boost: target holds for BOOST_S after the last cheer, then returns to 0; the factor follows it at a limited rate
      live.forEach(function (r) {
        if (r.boostT > 0) { r.boostT -= dt; if (r.boostT <= 0) { r.boostT = 0; r.boostTarget = 0; } }
        var d = r.boostTarget - r.boost, m = BOOST_SLEW * dt;
        r.boost += d > m ? m : d < -m ? -m : d;
      });
      // raw speeds, their mean remaining time, and how strongly to pull everybody towards it
      var raw = live.map(function (r) { return r.base * (1 + r.boost); });
      var tc = 0;
      live.forEach(function (r, i) { tc += (1 - r.p) / raw[i]; });
      tc = live.length ? tc / live.length : 1;
      var w = smooth((lead - BLEND_FROM) / (BLEND_TO - BLEND_FROM));
      live.forEach(function (r, i) {
        var common = (1 - r.p) / Math.max(tc, 0.5);
        var target = raw[i] + (common - raw[i]) * w;
        if (firstDone) { target = Math.max(target, (1 - r.p) / END_GAP_S); }
        var dv = target - r.v, m = ACC * dt;
        r.v += dv > m ? m : dv < -m ? -m : dv;
        r.p += r.v * dt;
        if (r.p >= 1) { r.p = 1; r.done = true; r.doneT = 0; firstDone = true; setMood(r, true); }
      });
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (phase === 'run' || phase === 'party') {
        step(dt);
        runners.forEach(function (r) {
          if (r.done) {
            r.doneT += dt;
            if (r.wag > 0) { r.wag = Math.max(0, r.wag - dt / 0.8); }
            rotTail(r, 26 * (1 + 0.6 * r.wag) * Math.sin(2 * Math.PI * WAG_HZ * r.doneT));
          }
          r.puffs.forEach(function (pf) {
            if (pf.age < 0) { return; }
            pf.age += dt;
            if (pf.age >= PUFF_S) { pf.age = -1; pf.node.style.display = 'none'; return; }
            var u = pf.age / PUFF_S;
            pf.node.style.opacity = (0.7 * (1 - u)).toFixed(3);
            pf.node.style.transform = 'translate(' + (-14 * u).toFixed(1) + 'px,' + (-8 * u).toFixed(1) + 'px) scale(' + (0.6 + 0.9 * u).toFixed(2) + ')';
          });
        });
        paint();
        if (phase === 'run' && runners.every(function (r) { return r.done; })) {
          phase = 'party'; phaseT = 0; startConfetti();
          if (!wasReported) { wasReported = true; report(function (A) { A.complete(); }); }
        }
        if (phase === 'party') {
          phaseT += dt;
          conf.forEach(function (c) { if (c.age >= 0) { c.age += dt; } });
          paintConfetti();
          if (phaseT >= CONFETTI_S) { phase = 'out'; phaseT = 0; }
        }
      } else if (phase === 'out') {
        fieldOp = Math.max(0, fieldOp - dt / SWAP_S);
        field.style.opacity = fieldOp.toFixed(3);
        if (fieldOp <= 0) {
          newRace(); paint(); phase = 'in';
        }
      } else if (phase === 'in') {
        fieldOp = Math.min(1, fieldOp + dt / SWAP_S);
        field.style.opacity = fieldOp.toFixed(3);
        if (fieldOp >= 1) { phase = 'run'; }
      }
      if (alive && !raf && !document.hidden) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden || !alive) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }

    function layout() {
      var fr = field.getBoundingClientRect();
      var laneH = Math.max(60, fr.height / LANES);
      trackW = Math.max(160, fr.width);
      var dh = Math.min(laneH - 20, 130), dw = dh * 6 / 5;
      dw = Math.min(dw, trackW * 0.34); dh = dw * 5 / 6;
      runners.forEach(function (r) {
        r.lane.style.height = laneH + 'px';
        r.pw = dw; r.ph = dh + 18;
        r.btn.style.width = dw + 'px'; r.btn.style.height = (dh + 18) + 'px';
        r.art.style.height = dh + 'px';
      });
      paint();
    }
    function onResize() { layout(); }

    runners.forEach(function (r) {
      r.btn.addEventListener('pointerdown', function (e) { if (phase === 'out') { return; } cheer(r); e.preventDefault(); });
      r.btn.addEventListener('click', function (e) { if (e.detail === 0 && phase !== 'out') { cheer(r); } });
    });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    newRace();
    start();

    return function cleanup() {
      alive = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (board.parentNode) { board.parentNode.removeChild(board); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'wyscig') { a.mount = mount; } });
})();
