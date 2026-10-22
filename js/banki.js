// Activity "Bańki Mydlane": touch blows a big soft bubble that floats up; touching a bubble splits it gently.
// Bubbles are pooled DOM divs driven by one rAF loop (JS motion, so it survives prefers-reduced-motion).
(function () {
  var MAX = 25, MIN_R = 14, BIG_R = [46, 62], FADE_IN = 0.8, FADE_OUT = 1.6, SPLIT_MS = 700, GUARD_PAD = 12;
  var TINTS = [[255, 183, 213], [183, 222, 255], [200, 255, 226], [226, 205, 255], [255, 236, 186]];

  function mount(container) {
    var scene = document.createElement('div');
    scene.className = 'bm';
    scene.setAttribute('role', 'img');
    scene.setAttribute('aria-label', 'Bańki mydlane unoszące się w powietrzu');
    container.appendChild(scene);
    var W = 0, H = 0, raf = 0, last = 0, lastTrail = 0, bubbles = [], pool = [], dead = false;

    function size() { W = scene.clientWidth; H = scene.clientHeight; }
    size();

    function smooth(t) { t = Math.min(Math.max(t, 0), 1); return t * t * (3 - 2 * t); }
    function rnd(a, b) { return a + Math.random() * (b - a); }

    function alive() { return bubbles.filter(function (b) { return !b.fading; }).length; }

    function make(x, y, r, vy) {
      var el = pool.pop();
      if (!el) { el = document.createElement('div'); el.className = 'bm-b'; }
      var t = TINTS[Math.floor(Math.random() * TINTS.length)];
      el.style.setProperty('--c', t.join(','));
      el.style.width = el.style.height = (r * 2) + 'px';
      scene.appendChild(el);
      var b = { el: el, x: x, y: y, r: r, vy: vy, vx: 0, ph: rnd(0, 6.28), sw: rnd(0.25, 0.5), amp: rnd(6, 16),
        age: 0, fading: false, fade: 0, split: 0, tx: 0, ty: 0, a: 0 };
      bubbles.push(b);
      // Keep the population bounded: the oldest still-visible bubble fades out gently.
      while (alive() > MAX) {
        for (var i = 0; i < bubbles.length; i++) { if (!bubbles[i].fading) { bubbles[i].fading = true; break; } }
      }
      // Hard DOM bound under rapid tapping: bubbles that are already fading finish quickly.
      var over = bubbles.length - (MAX + 8);
      for (var j = 0; j < bubbles.length && over > 0; j++) {
        if (bubbles[j].fading && bubbles[j].fade < FADE_OUT * 0.85) { bubbles[j].fade = FADE_OUT * 0.85; over--; }
      }
      draw(b);
      return b;
    }

    function remove(b) {
      var i = bubbles.indexOf(b);
      if (i >= 0) { bubbles.splice(i, 1); }
      if (b.el.parentNode) { b.el.parentNode.removeChild(b.el); }
      if (pool.length < MAX) { pool.push(b.el); }
    }

    function draw(b) {
      var inA = smooth(b.age / FADE_IN);
      var out = b.fading ? 1 - smooth(b.fade / FADE_OUT) : 1;
      var sc = 1 + (b.split > 0 ? 0.08 * Math.sin(Math.min(b.split, 1) * 3.14) : 0);
      b.el.style.opacity = (inA * out).toFixed(3);
      b.el.style.transform = 'translate(' + (b.x - b.r).toFixed(1) + 'px,' + (b.y - b.r).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
    }

    function blow(x, y, small) {
      var r = small ? rnd(MIN_R, MIN_R + 8) : rnd(BIG_R[0], BIG_R[1]);
      return make(x, y, r, rnd(14, 24) * (small ? 1.1 : 1));
    }

    function splitBubble(b) {
      var n = Math.random() < 0.5 ? 2 : 3, nr = b.r * (n === 2 ? 0.66 : 0.58);
      b.fading = true; b.fade = 0; b.split = 1; // the parent dissolves slowly while the children appear
      for (var i = 0; i < n; i++) {
        var ang = (i / n) * 6.28 + rnd(0, 1);
        var c = make(b.x + Math.cos(ang) * b.r * 0.3, b.y + Math.sin(ang) * b.r * 0.3, nr, b.vy);
        c.vx = Math.cos(ang) * 14; c.vy = b.vy + Math.sin(ang) * 8 - 4;
        c.small = nr < MIN_R * 1.2;
        if (c.small) { c.life = rnd(4, 7); } // the smallest bubbles drift a little, then fade gently
      }
    }

    function hit(x, y) {
      var best = null, bd = Infinity;
      bubbles.forEach(function (b) {
        if (b.fading) { return; }
        var d = Math.hypot(b.x - x, b.y - y);
        if (d < b.r + 8 && d < bd) { bd = d; best = b; }
      });
      return best;
    }

    var down = false, dragged = false;
    function onDown(e) {
      e.preventDefault();
      down = true; dragged = false; lastTrail = performance.now();
      var r = scene.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var b = hit(x, y);
      if (b && b.r > MIN_R * 1.2) { splitBubble(b); }
      else if (b) { b.fading = true; b.fade = 0; } // a very small bubble answers the touch by fading away gently
      else { blow(x, y, false); }
      if (scene.setPointerCapture) { try { scene.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
    }
    function onMove(e) {
      if (!down) { return; }
      var now = performance.now();
      if (now - lastTrail < 260) { return; } // gentle rate
      lastTrail = now; dragged = true;
      var r = scene.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (!hit(x, y)) { blow(x, y, true); }
    }
    function onUp() { down = false; }
    scene.addEventListener('pointerdown', onDown);
    scene.addEventListener('pointermove', onMove);
    scene.addEventListener('pointerup', onUp);
    scene.addEventListener('pointercancel', onUp);

    for (var i = 0; i < 5; i++) {
      var s = make(W * rnd(0.1, 0.9), H * rnd(0.25, 0.9), rnd(16, 30), rnd(10, 18));
      s.age = FADE_IN;
    }

    function tick(now) {
      if (dead) { return; }
      var dt = Math.min((now - (last || now)) / 1000, 0.1);
      last = now;
      var zones = guards();
      bubbles.slice().forEach(function (b) {
        b.age += dt;
        b.ph += b.sw * dt;
        b.x += (b.vx + Math.cos(b.ph) * b.amp * b.sw) * dt;
        b.y -= b.vy * dt;
        b.vx *= Math.pow(0.5, dt); // splitting push eases off slowly
        if (b.vy > 26) { b.vy = 26; }
        if (b.x < b.r) { b.vx += 10 * dt; } else if (b.x > W - b.r) { b.vx -= 10 * dt; }
        if (b.life !== undefined) { b.life -= dt; if (b.life <= 0) { b.fading = true; } }
        // Near the top, or over the Back button / hourglass, the bubble fades out gently.
        if (!b.fading && (b.y < b.r + 4 || zones.some(function (z) { return b.x > z.l && b.x < z.r && b.y > z.t && b.y < z.b; }))) { b.fading = true; }
        if (b.fading) { b.fade += dt; if (b.split > 0) { b.split = Math.max(0, b.split - dt / (SPLIT_MS / 1000)); } }
        if (b.fading && b.fade >= FADE_OUT) { remove(b); } else { draw(b); }
      });
      raf = requestAnimationFrame(tick);
    }
    // Keep-out zones: the Back button and the playtime hourglass (measured, so safe-area insets and sizes are honoured).
    function guards() {
      var sr = scene.getBoundingClientRect(), out = [];
      ['.back', '.hourglass'].forEach(function (sel) {
        var el = document.querySelector(sel);
        if (!el) { return; }
        var r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) { out.push({ l: r.left - sr.left - GUARD_PAD, t: r.top - sr.top - GUARD_PAD, r: r.right - sr.left + GUARD_PAD, b: r.bottom - sr.top + GUARD_PAD }); }
      });
      return out;
    }
    function start() { if (!raf && !dead) { last = 0; raf = requestAnimationFrame(tick); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    function onVis() { if (document.hidden) { stop(); } else { start(); } }
    function onResize() { size(); }
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    start();

    return function cleanup() {
      dead = true; stop();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'banki') { a.mount = mount; } });
})();
