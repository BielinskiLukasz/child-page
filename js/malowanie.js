// Activity "Malowanie Światłem": touch/drag paints soft glowing marks that drift and fade out (~3-5 s).
// Single canvas + single rAF loop (works under prefers-reduced-motion); marks are plain objects, capped at MAX;
// loop pauses when the tab is hidden and stops when nothing is left to draw.
(function () {
  var MAX = 150, SPACING = 22;
  var COLORS = ['#f7a8c9', '#c9b8f2', '#a8d8f0', '#ffd98a', '#a9dcb4', '#ffb7a5'];

  function mount(container) {
    var canvas = document.createElement('canvas');
    canvas.className = 'paint-canvas';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Malowanie światłem: strzałki przesuwają światło, Enter lub spacja maluje');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;background:#2b2748;';
    container.style.position = 'relative';
    container.style.display = 'block';
    container.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var marks = [], pointers = {}, raf = 0, last = 0, w = 0, h = 0, colorIdx = 0;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    function addMark(x, y) {
      var a = Math.random() * Math.PI * 2, s = 6 + Math.random() * 8;
      var color = COLORS[colorIdx++ % COLORS.length];
      marks.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 40 + Math.random() * 35,
        life: 3000 + Math.random() * 2000, age: 0, color: color });
      if (marks.length > MAX) { marks.splice(0, marks.length - MAX); }
      start();
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < marks.length; i++) {
        var m = marks[i], t = m.age / m.life;
        var alpha = 0.5 * Math.sin(Math.min(t * 8, 1) * Math.PI / 2) * (1 - t) * (1 - t);
        var g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
        g.addColorStop(0, m.color); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = alpha; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    function frame(now) {
      var dt = Math.min(now - last, 50); last = now;
      for (var i = marks.length - 1; i >= 0; i--) {
        var m = marks[i];
        m.age += dt; m.x += m.vx * dt / 1000; m.y += m.vy * dt / 1000;
        if (m.age >= m.life) { marks.splice(i, 1); }
      }
      draw();
      raf = marks.length ? requestAnimationFrame(frame) : 0;
    }
    function start() {
      if (raf || document.hidden) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    function onVis() { if (document.hidden) { stop(); } else if (marks.length) { start(); } }

    function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function down(e) {
      var p = pos(e);
      pointers[e.pointerId] = p;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      addMark(p.x, p.y);
    }
    function move(e) {
      var prev = pointers[e.pointerId];
      if (!prev) { return; }
      var p = pos(e), dx = p.x - prev.x, dy = p.y - prev.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < SPACING) { return; }
      var n = Math.min(Math.floor(d / SPACING), 3);   // fast drags: cap marks per event
      for (var i = 1; i <= n; i++) { addMark(prev.x + dx * i / n, prev.y + dy * i / n); }
      pointers[e.pointerId] = p;
    }
    function up(e) { delete pointers[e.pointerId]; }

    // Keyboard: arrows move a light spot (painting as it goes), Enter/Space paints in place.
    var kx = null, ky = 0, STEP = 30;
    function key(e) {
      var dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') { dx = -STEP; } else if (e.key === 'ArrowRight') { dx = STEP; }
      else if (e.key === 'ArrowUp') { dy = -STEP; } else if (e.key === 'ArrowDown') { dy = STEP; }
      else if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') { return; }
      e.preventDefault();
      if (kx === null) { kx = w / 2; ky = h / 2; }
      kx = Math.max(0, Math.min(w, kx + dx)); ky = Math.max(0, Math.min(h, ky + dy));
      addMark(kx, ky);
    }

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('lostpointercapture', up);
    canvas.addEventListener('keydown', key);
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    document.addEventListener('visibilitychange', onVis);
    resize();

    return function () {
      stop(); marks = []; pointers = {};
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      document.removeEventListener('visibilitychange', onVis);
      container.style.position = ''; container.style.display = '';
      container.innerHTML = '';
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'malowanie') { a.mount = mount; } });
})();
