// Activity "Akwarium Artura": calm canvas aquarium. Touch water -> food; fish swim to eat; touch fish -> bubbles.
// Everything lives on one canvas, so no DOM nodes are created per particle.
(function () {
  var MAX_FOOD = 10, MAX_BUBBLES = 30, FOOD_FALL = 28, FOOD_REST_MS = 6000, FOOD_MAX_MS = 25000;
  var COLORS = ['#ffb7a5', '#ffd98a', '#f7a8c9'];

  function mount(container) {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var slow = reduced ? 0.6 : 1;
    var canvas = document.createElement('canvas');
    canvas.className = 'aquarium';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Akwarium z rybkami');
    container.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, raf = 0, last = 0, time = 0;
    var food = [], bubbles = [], fish = [];

    function resize() {
      var dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fish.forEach(function (f) { f.x = Math.min(Math.max(f.x, 0), W); f.y = Math.min(Math.max(f.y, 0), H); });
    }
    resize();

    for (var i = 0; i < 3; i++) {
      fish.push({ x: W * (0.2 + 0.3 * i), y: H * (0.25 + 0.2 * i), a: i % 2 ? Math.PI : 0,
        wander: 0, wanderT: 0, size: 26 + i * 4, color: COLORS[i], nudge: 0, nudgeT: 0, target: null });
    }

    function wrap(a) { while (a > Math.PI) { a -= 2 * Math.PI; } while (a < -Math.PI) { a += 2 * Math.PI; } return a; }
    function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
    function speed() { return Math.max(24, W / 14) * slow; } // crossing the width takes >= ~14 s

    function addBubble(x, y) {
      if (bubbles.length >= MAX_BUBBLES) { bubbles.shift(); }
      bubbles.push({ x: x, y: y, r: 3 + Math.random() * 4, ph: Math.random() * 6, v: 18 + Math.random() * 14 });
    }

    function onDown(e) {
      e.preventDefault();
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var hit = null, best = Infinity;
      fish.forEach(function (f) {
        var d = Math.hypot(f.x - x, f.y - y);
        if (d < f.size * 1.8 && d < best) { best = d; hit = f; }
      });
      if (hit) {
        var n = 3 + Math.floor(Math.random() * 3);
        for (var i = 0; i < n; i++) {
          addBubble(hit.x + Math.cos(hit.a) * hit.size + (Math.random() - 0.5) * 10, hit.y - 4 - i * 9);
        }
        hit.nudge = (Math.random() < 0.5 ? -1 : 1) * 0.8; // gentle bias, still subject to the capped turn rate
        hit.nudgeT = 3;
        return;
      }
      if (food.length >= MAX_FOOD) { food.shift(); }
      food.push({ x: x, y: y, age: 0, rest: 0, eaten: false });
    }
    canvas.addEventListener('pointerdown', onDown);

    function update(dt) {
      var sp = speed();
      // Assign each food (oldest first) to the nearest still-free fish.
      fish.forEach(function (f) { f.target = null; });
      food.forEach(function (fd) {
        var best = null, bd = Infinity;
        fish.forEach(function (f) {
          if (f.target) { return; }
          var d = Math.hypot(f.x - fd.x, f.y - fd.y);
          if (d < bd) { bd = d; best = f; }
        });
        if (best) { best.target = fd; }
      });
      fish.forEach(function (f) {
        var desired, maxPitch = 0.45, turn = 0.7 * slow;
        f.wanderT -= dt;
        if (f.wanderT <= 0) { f.wander = (Math.random() - 0.5) * 0.7; f.wanderT = 3 + Math.random() * 4; }
        if (f.nudgeT > 0) { f.nudgeT -= dt; }
        if (f.target) {
          desired = Math.atan2(f.target.y - f.y, f.target.x - f.x);
          maxPitch = 1.0;
        } else {
          var dir = Math.cos(f.a) >= 0 ? 0 : Math.PI, m = 70, k = 1;
          if (f.x < m) { dir = 0; } else if (f.x > W - m) { dir = Math.PI; }
          k = dir === 0 ? 1 : -1;
          desired = dir + k * (f.wander + (f.nudgeT > 0 ? f.nudge * 0.5 : 0));
          if (f.y < 50) { desired += 0.3 * k; } else if (f.y > H - 90) { desired -= 0.3 * k; }
        }
        // Keep fish roughly horizontal, and turn at a capped rate so direction never flips instantly.
        var s = clamp(Math.sin(desired), -Math.sin(maxPitch), Math.sin(maxPitch));
        desired = Math.atan2(s, Math.cos(desired));
        f.a = wrap(f.a + clamp(wrap(desired - f.a), -turn * dt, turn * dt));
        f.x = clamp(f.x + Math.cos(f.a) * sp * dt, 0, W);
        f.y = clamp(f.y + Math.sin(f.a) * sp * dt, 30, H - 50);
        if (f.target && Math.hypot(f.target.x - f.x - Math.cos(f.a) * f.size, f.target.y - f.y) < f.size * 0.9) {
          f.target.eaten = true;
        }
      });
      var floor = H - 36;
      food = food.filter(function (fd) {
        if (fd.eaten) { return false; }
        fd.age += dt * 1000;
        if (fd.y < floor) { fd.y = Math.min(floor, fd.y + FOOD_FALL * slow * dt); } else { fd.rest += dt * 1000; }
        return fd.rest < FOOD_REST_MS && fd.age < FOOD_MAX_MS;
      });
      bubbles = bubbles.filter(function (b) {
        b.y -= b.v * slow * dt;
        b.x += Math.sin(time * 1.5 + b.ph) * 8 * dt;
        return b.y > -b.r;
      });
    }

    function drawPlant(x, h, color, ph) {
      ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.lineCap = 'round';
      var sway = reduced ? 0 : Math.sin(time * 0.6 + ph) * 8;
      ctx.beginPath(); ctx.moveTo(x, H);
      ctx.quadraticCurveTo(x + sway, H - h * 0.5, x + sway * 1.5, H - h);
      ctx.stroke();
    }

    function draw() {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#d6eefb'); g.addColorStop(1, '#b5dcf2');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f3e6c8'; ctx.fillRect(0, H - 22, W, 22);
      drawPlant(W * 0.1, 130, '#9bd3ac', 0); drawPlant(W * 0.14, 90, '#b4e0bd', 1.5);
      drawPlant(W * 0.55, 110, '#9bd3ac', 3); drawPlant(W * 0.88, 150, '#b4e0bd', 4.5); drawPlant(W * 0.92, 95, '#9bd3ac', 2);
      food.forEach(function (fd) {
        ctx.fillStyle = '#d9a35f'; ctx.beginPath(); ctx.arc(fd.x, fd.y, 5, 0, 7); ctx.fill();
      });
      fish.forEach(function (f) {
        ctx.save(); ctx.translate(f.x, f.y);
        var left = Math.cos(f.a) < 0;
        ctx.scale(left ? -1 : 1, 1);
        ctx.rotate(left ? Math.PI - f.a : f.a);
        var s = f.size, wag = reduced ? 0 : Math.sin(time * 3 + f.size) * s * 0.12;
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.62, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-s * 0.8, 0); ctx.lineTo(-s * 1.5, -s * 0.5 + wag); ctx.lineTo(-s * 1.5, s * 0.5 + wag); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5b5675'; ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.12, s * 0.09, 0, 7); ctx.fill();
        ctx.restore();
      });
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5;
      bubbles.forEach(function (b) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.stroke(); });
    }

    function frame(t) {
      var dt = last ? Math.min((t - last) / 1000, 0.05) : 0; // clamp so a resumed tab doesn't jump
      last = t; time += dt;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    }
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);
    raf = requestAnimationFrame(frame);

    return function () {
      cancelAnimationFrame(raf); raf = 0;
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointerdown', onDown);
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'akwarium') { a.mount = mount; } });
})();
