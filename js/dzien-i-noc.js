// Activity "Dzień i Noc": touch the sun -> smooth fall of night; touch the moon -> day returns; touch the sky -> a cloud drifts by.
// Transition is driven by one rAF loop (so it also works under prefers-reduced-motion, just shorter).
// Clouds are removed once off-screen or after their lifetime; their number is capped at MAX_CLOUDS.
(function () {
  var MAX_CLOUDS = 7, AMBIENT = 3, TRANSITION_MS = 3500, REDUCED_MS = 1200;
  var CLOUD_SVG = '<svg viewBox="0 0 120 60" aria-hidden="true" focusable="false"><g fill="#fff"><circle cx="35" cy="38" r="20"/>' +
    '<circle cx="60" cy="28" r="26"/><circle cx="88" cy="38" r="20"/><rect x="35" y="38" width="53" height="20" rx="10"/></g></svg>';
  var BIRD_SECONDS = 20, LOOP_SECONDS = 2.6;
  var BIRD_SVG = '<svg viewBox="-30 -20 60 40" aria-hidden="true" focusable="false"><g fill="#7a7396">' +
    '<g class="dn-wing"><path d="M0 0Q-14 -16 -28 -6Q-14 -6 0 4z"/><path d="M0 0Q14 -16 28 -6Q14 -6 0 4z"/></g>' +
    '<ellipse cx="0" cy="3" rx="9" ry="5"/><circle cx="8" cy="0" r="4"/><path d="M11 -1l6 2-6 1z" fill="#ffd98a"/></g></svg>';
  // Night flyers: now and then a steady white satellite or an airplane (grey dot pulsing red) drifts across the stars.
  // New stars slowly appear while the activity stays open: one every 15-30 s, from 1 px up to their target size, capped at STAR_CAP in total.
  var STAR_ADD_MIN = 15, STAR_ADD_MAX = 30, STAR_GROW_SECONDS = 8, STAR_CAP = 160;
  var FLY_MIN = 20, FLY_MAX = 45, SAT_SECONDS = 18, PLANE_SECONDS = 12, BLINK_SECONDS = 0.7;
  // ~100 stars, laid out once with a fixed seed so the sky looks the same every visit.
  function makeStars() {
    var out = [], seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    while (out.length < 100) {
      var bright = rnd() < 0.1;
      out.push([2 + rnd() * 96, 2 + rnd() * 94, bright ? 3 + rnd() : 1.4 + rnd() * 1.3, bright ? 0.9 : 0.4 + rnd() * 0.4]);
    }
    return out;
  }

  function mount(container) {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var scene = document.createElement('div');
    scene.className = 'dn';
    var stars = makeStars().map(function (s) {
      return '<i style="left:' + s[0].toFixed(1) + '%;top:' + s[1].toFixed(1) + '%;width:' + s[2].toFixed(1) + 'px;height:' + s[2].toFixed(1) + 'px;opacity:' + s[3].toFixed(2) + '"></i>';
    }).join('');
    scene.innerHTML = '<div class="dn-night"></div><div class="dn-stars" aria-hidden="true">' + stars + '</div>' +
      '<div class="dn-clouds" aria-hidden="true"></div>' +
      '<button class="dn-body" type="button" aria-label="Słońce"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<g class="dn-sun"><g stroke="#ffd96a" stroke-width="5" stroke-linecap="round">' +
      '<path d="M50 6v10M50 84v10M6 50h10M84 50h10M19 19l7 7M74 74l7 7M81 19l-7 7M26 74l-7 7"/></g>' +
      '<circle cx="50" cy="50" r="27" fill="#ffe08a"/></g>' +
      '<g class="dn-moon"><circle cx="50" cy="50" r="30" fill="#f4f1d8"/><circle cx="38" cy="58" r="5" fill="#e3ddb8"/>' +
      '<circle cx="62" cy="38" r="4" fill="#e3ddb8"/><path d="M36 48q5 5 10 0M54 48q5 5 10 0" fill="none" stroke="#8a84a8" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M44 60q6 4 12 0" fill="none" stroke="#8a84a8" stroke-width="2.5" stroke-linecap="round"/></g></svg></button>';
    container.appendChild(scene);
    var cloudBox = scene.querySelector('.dn-clouds'), starBox = scene.querySelector('.dn-stars'), body = scene.querySelector('.dn-body');

    var progress = 0, target = 0, busy = false, raf = 0, last = 0, hidden = document.hidden;
    var clouds = [], timers = [];

    function render() {
      scene.style.setProperty('--p', progress.toFixed(3));
      var night = progress >= 0.5;
      body.setAttribute('aria-label', night ? 'Księżyc' : 'Słońce');
    }
    function ease(t) { return t * t * (3 - 2 * t); }
    function step(now) {
      raf = 0;
      var dt = Math.min(now - last, 100); // a long gap (hidden tab) must not skip the transition
      last = now;
      var dur = reduced ? REDUCED_MS : TRANSITION_MS;
      step.t = Math.min(step.t + dt / dur, 1);
      progress = step.from + (target - step.from) * ease(step.t);
      render();
      if (step.t >= 1) { progress = target; busy = false; render(); return; }
      raf = requestAnimationFrame(step);
    }
    function toggle() {
      busy = true;
      step.from = progress;
      step.t = 0;
      target = progress < 0.5 ? 1 : 0;
      last = performance.now();
      if (!hidden && !raf) { raf = requestAnimationFrame(step); }
    }

    function removeCloud(c) {
      var i = clouds.indexOf(c);
      if (i >= 0) { clouds.splice(i, 1); }
      if (c.node.parentNode) { c.node.parentNode.removeChild(c.node); }
    }
    function addCloud(x, y, speed, life) {
      while (clouds.length >= MAX_CLOUDS) { removeCloud(clouds[0]); }
      var node = document.createElement('div');
      node.className = 'dn-cloud';
      node.innerHTML = CLOUD_SVG;
      node.style.top = y + '%';
      node.style.setProperty('--w', (18 + Math.random() * 12) + 'vmin');
      cloudBox.appendChild(node);
      var c = { node: node, x: x, speed: speed, life: life };
      clouds.push(c);
      place(c);
      return c;
    }
    function place(c) { c.node.style.transform = 'translateX(' + c.x.toFixed(2) + 'vw)'; }
    function ambient() {
      var n = clouds.filter(function (c) { return !c.tapped; }).length;
      while (n < AMBIENT) {
        addCloud(n === 0 && !clouds.length ? 10 : -25 - Math.random() * 20, 8 + Math.random() * 40, 1.6 + Math.random() * 0.8, 0).tapped = false;
        n++;
      }
    }
    // Birds: a small flock (7-9, chosen on every launch) only by day. Each flies slowly across in a lane that keeps clear of the sun/moon
    // button; when one leaves the screen another follows shortly after, so at least 5 are visible at the day peak.
    var flockSize = 7 + Math.floor(Math.random() * 3), birds = [], respawn = [], flockOn = false;
    function removeBird(b) {
      var i = birds.indexOf(b);
      if (i >= 0) { birds.splice(i, 1); }
      if (b.node.parentNode) { b.node.parentNode.removeChild(b.node); }
    }
    function spawnBird(u) {
      var node = document.createElement('button');
      node.type = 'button';
      node.className = 'dn-bird';
      node.setAttribute('aria-label', 'Ptaszek');
      node.innerHTML = BIRD_SVG;
      scene.appendChild(node);
      var b = { node: node, wing: node.querySelector('.dn-wing'), u: u, ltr: Math.random() < 0.5, lane: Math.random(), secs: BIRD_SECONDS * (0.85 + Math.random() * 0.4),
        ph: Math.random() * 6.28, loop: -1 };
      birds.push(b);
      placeBird(b, 0);
    }
    // Free vertical lanes: above the sun/moon box and below it. Returns the y (px) for lane 0..1 and the direction a touch-loop may move (away from the body).
    function laneY(b, w, h, bh) {
      var size = Math.min(Math.max(150, Math.min(w, h) * 0.38), 320), top = h * 0.42 - size / 2, bottom = h * 0.42 + size / 2;
      var R = Math.min(w, h) * 0.07, m = h * 0.02 + 4;
      var t0 = m + R, t1 = top - bh - m, b0 = bottom + m, b1 = h - bh - m - R;
      var lt = Math.max(t1 - t0, 0), lb = Math.max(b1 - b0, 0), tot = lt + lb;
      if (tot <= 0) { return { y: Math.max(t0, 0), dir: 0 }; }
      var d = b.lane * tot;
      return d < lt ? { y: t0 + d, dir: -1 } : { y: b0 + (d - lt), dir: 1 };
    }
    function placeBird(b, dt) {
      var w = scene.clientWidth, h = scene.clientHeight, bw = b.node.offsetWidth || 56, bh = Math.max(b.node.offsetHeight || 56, 56);
      b.u += dt / b.secs;
      b.ph += dt * 2.4 * Math.PI; // slow, gentle flapping
      var ly = laneY(b, w, h, bh), x = -bw + b.u * (w + 2 * bw), y = ly.y + Math.sin(b.u * 5 + b.lane * 6) * h * 0.02, R = Math.min(w, h) * 0.07;
      if (!b.ltr) { x = w - x - bw; }
      if (b.loop >= 0) { // gentle slow loop after a touch: smooth circle, moving only away from the sun/moon
        b.loop += dt / LOOP_SECONDS;
        if (b.loop >= 1) { b.loop = -1; } else {
          var a = b.loop * 2 * Math.PI, e = Math.sin(b.loop * Math.PI);
          x += (b.ltr ? 1 : -1) * R * Math.sin(a) * e; y += (ly.dir || -1) * R * (1 - Math.cos(a)) * 0.5 * e;
        }
      }
      var f = 0.55 + 0.45 * Math.cos(b.ph);
      b.wing.setAttribute('transform', 'scale(1 ' + f.toFixed(3) + ')');
      b.node.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (b.ltr ? 1 : -1) + ',1)';
    }
    function clearFlock() {
      birds.slice().forEach(removeBird);
      respawn.length = 0;
      flockOn = false;
    }
    function birdTick(dt) {
      if (progress >= 0.5) { if (birds.length || flockOn) { clearFlock(); } return; }
      if (!flockOn) {
        if (!(progress < 0.05 && target === 0)) { return; }
        flockOn = true; // day peak reached: the flock appears already spread across the sky
        for (var i = 0; i < flockSize; i++) { spawnBird((i + Math.random() * 0.6) / flockSize * 0.9); }
        return;
      }
      birds.slice().forEach(function (b) {
        if (b.u >= 1) { removeBird(b); respawn.push(Math.random() * 1.5); } else { placeBird(b, dt); }
      });
      respawn = respawn.map(function (t) { return t - dt; }).filter(function (t) {
        if (t > 0 || birds.length >= flockSize) { return t > 0; }
        spawnBird(0);
        return false;
      });
    }
    function touchBird(node) {
      var b = birds.filter(function (x) { return x.node === node; })[0];
      if (b && b.loop < 0) { b.loop = 0; }
    }
    // Slowly revealed stars: each starts at 1 px and eases to its target size (JS-driven, so it works under prefers-reduced-motion).
    var starCount = 100, starWait = STAR_ADD_MIN + Math.random() * (STAR_ADD_MAX - STAR_ADD_MIN), growing = [];
    function addStar() {
      var r = Math.random(), bright = r < 0.1, target = bright ? 3 + Math.random() : (r < 0.35 ? 1 : 1.4 + Math.random() * 1.3);
      var node = document.createElement('i');
      node.style.cssText = 'left:' + (2 + Math.random() * 96).toFixed(1) + '%;top:' + (2 + Math.random() * 94).toFixed(1) + '%;width:1px;height:1px;transform:translate(-50%,-50%);opacity:' + (bright ? 0.9 : 0.4 + Math.random() * 0.4).toFixed(2);
      starBox.appendChild(node);
      starCount++;
      if (target > 1) { growing.push({ node: node, t: 0, target: target }); }
    }
    function starTick(dt) {
      if (starCount < STAR_CAP) {
        starWait -= dt;
        if (starWait <= 0) { starWait = STAR_ADD_MIN + Math.random() * (STAR_ADD_MAX - STAR_ADD_MIN); addStar(); }
      }
      growing = growing.filter(function (g) {
        g.t = Math.min(g.t + dt / STAR_GROW_SECONDS, 1);
        var px = (1 + (g.target - 1) * ease(g.t)).toFixed(2) + 'px';
        g.node.style.width = px;
        g.node.style.height = px;
        return g.t < 1;
      });
    }
    // Flyer: at most one, only at night, every 20-45 s; removed when it leaves the sky or day returns. Not touchable.
    var flyer = null, flyWait = FLY_MIN + Math.random() * (FLY_MAX - FLY_MIN);
    function removeFlyer() {
      if (flyer && flyer.node.parentNode) { flyer.node.parentNode.removeChild(flyer.node); }
      flyer = null;
    }
    function placeFlyer(dt) {
      var f = flyer, x;
      f.u += dt / (f.plane ? PLANE_SECONDS : SAT_SECONDS);
      f.t += dt;
      x = f.ltr ? -2 + f.u * 104 : 102 - f.u * 104;
      f.node.style.left = x.toFixed(2) + '%';
      f.node.style.top = (f.y + f.u * f.slope).toFixed(2) + '%';
      if (f.plane) {
        // grey dot with a red pulse, same 0.7 s period as before; driven here (not by a CSS keyframe) so it also runs under prefers-reduced-motion
        f.node.style.setProperty('--pulse', (0.5 - 0.5 * Math.cos(2 * Math.PI * f.t / BLINK_SECONDS)).toFixed(3));
      }
    }
    function flyerTick(dt) {
      if (flyer) {
        if (progress < 0.5 || flyer.u >= 1) { removeFlyer(); } else { placeFlyer(dt); }
      } else if (progress >= 0.95 && target === 1) {
        flyWait -= dt;
        if (flyWait <= 0) {
          flyWait = FLY_MIN + Math.random() * (FLY_MAX - FLY_MIN);
          var node = document.createElement('div'), plane = Math.random() < 0.5;
          node.className = 'dn-fly' + (plane ? ' plane' : '');
          starBox.appendChild(node);
          flyer = { node: node, plane: plane, u: 0, t: 0, ltr: Math.random() < 0.5, y: 4 + Math.random() * 40, slope: (Math.random() - 0.5) * 12 };
          placeFlyer(0);
        }
      }
    }
    var cloudLast = performance.now(), cloudRaf = 0;
    function cloudTick(now) {
      cloudRaf = 0;
      var dt = Math.min(now - cloudLast, 100) / 1000;
      cloudLast = now;
      birdTick(dt);
      flyerTick(dt);
      starTick(dt);
      if (!reduced) {
        clouds.slice().forEach(function (c) {
          c.x += c.speed * dt;
          if (c.x > 105) { removeCloud(c); } else { place(c); }
        });
        ambient();
      }
      if (!hidden) { cloudRaf = requestAnimationFrame(cloudTick); }
    }
    // initial ambient clouds spread across the sky
    [8, 42, 70].forEach(function (x, i) { addCloud(x, 10 + i * 14, 1.6 + i * 0.4, 0).tapped = false; });

    function onDown(e) {
      e.preventDefault();
      var bn = e.target.closest('.dn-bird');
      if (bn) { touchBird(bn); return; }
      if (busy) { return; }
      if (e.target.closest('.dn-body')) { toggle(); return; }
      var h = Math.max(scene.clientHeight, 1);
      var y = Math.min(Math.max(e.clientY / h * 100 - 8, 2), 70);
      if (reduced) {
        var c = addCloud(Math.min(Math.max(e.clientX / Math.max(scene.clientWidth, 1) * 100 - 12, 0), 75), y, 0, 1);
        c.tapped = true;
        var t = setTimeout(function () { timers.splice(timers.indexOf(t), 1); removeCloud(c); }, 6000);
        timers.push(t);
      } else {
        addCloud(-30, y, 3.2, 0).tapped = true;
      }
    }
    function onClick(e) {
      // keyboard activation (Enter/Space) fires click with detail 0; pointer input is handled in onDown
      if (e.detail !== 0) { return; }
      var bn = e.target.closest('.dn-bird');
      if (bn) { touchBird(bn); return; }
      if (busy || !e.target.closest('.dn-body')) { return; }
      toggle();
    }
    function onVis() {
      hidden = document.hidden;
      scene.classList.toggle('paused', hidden);
      if (!hidden) {
        last = cloudLast = performance.now();
        if (busy && !raf) { raf = requestAnimationFrame(step); }
        if (!cloudRaf) { cloudRaf = requestAnimationFrame(cloudTick); }
      }
    }

    scene.addEventListener('pointerdown', onDown);
    scene.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVis);
    render();
    cloudRaf = requestAnimationFrame(cloudTick);

    return function () {
      if (raf) { cancelAnimationFrame(raf); }
      if (cloudRaf) { cancelAnimationFrame(cloudRaf); }
      timers.forEach(clearTimeout);
      scene.removeEventListener('pointerdown', onDown);
      scene.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVis);
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'dzien-i-noc') { a.mount = mount; } });
})();
