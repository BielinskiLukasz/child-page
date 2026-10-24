// Activity "Ogród Motyli": touch a flower -> the butterfly slowly flies there along a smooth curve; the flower sways.
// Everything animated runs in one rAF loop (so it works under prefers-reduced-motion); the loop pauses when the tab is hidden.
// Flight is a critically damped spring with a rotated pull (curved path): redirecting keeps position and velocity continuous.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var OMEGA = 2.2, TURN = 0.55, SWAY_MS = 2200, SWAY_AMP = 7, IDLE_MIN = 10, IDLE_MAX = 15; // seconds resting before it flies by itself
  // Flower layout: petal count (n) differs per flower, so shapes stay distinguishable whatever the colours are.
  var FLOWERS = [
    { x: 0.22, y: 0.24, n: 6 },
    { x: 0.74, y: 0.22, n: 8 },
    { x: 0.48, y: 0.5, n: 5 },
    { x: 0.22, y: 0.7, n: 7 },
    { x: 0.76, y: 0.68, n: 6 }
  ];
  // Colour sets: one set is picked at random per launch (flowers and butterfly independently). Each flower set has
  // a {petal, core} pair per flower, in FLOWERS order.
  var FLOWER_SETS = [
    [['#f7a8c9', '#ffe9a8'], ['#ffd98a', '#f2b7a0'], ['#c9b8f2', '#fff3c4'], ['#ffb7a5', '#ffe9a8'], ['#a8d8f0', '#fff3c4']],
    [['#ffd98a', '#f2b7a0'], ['#a8d8f0', '#fff3c4'], ['#f7a8c9', '#ffe9a8'], ['#c9b8f2', '#fff3c4'], ['#ffb7a5', '#ffe9a8']],
    [['#ffb7a5', '#fff3c4'], ['#ffb7a5', '#ffe9a8'], ['#ffd98a', '#f2b7a0'], ['#ffd98a', '#c9b8f2'], ['#f7a8c9', '#ffe9a8']],
    [['#a8d8f0', '#ffe9a8'], ['#c9b8f2', '#fff3c4'], ['#a8d8f0', '#f7a8c9'], ['#c9b8f2', '#ffe9a8'], ['#b7e4c7', '#fff3c4']],
    [['#b7e4c7', '#ffe9a8'], ['#ffd98a', '#f7a8c9'], ['#b7e4c7', '#f2b7a0'], ['#a8d8f0', '#ffe9a8'], ['#ffb7a5', '#fff3c4']],
    [['#fff3c4', '#f2b7a0'], ['#f7a8c9', '#fff3c4'], ['#fff3c4', '#c9b8f2'], ['#ffd98a', '#f7a8c9'], ['#c9b8f2', '#ffe9a8']]
  ];
  // Butterfly sets: [upper wing, lower wing]
  var BUTTERFLY_SETS = [
    ['#f7a8c9', '#c9b8f2'], ['#ffd98a', '#f2a07a'], ['#a8d8f0', '#7fb8e8'],
    ['#b7e4c7', '#f7e08a'], ['#ffb7a5', '#f7a8c9'], ['#c9b8f2', '#a8d8f0']
  ];

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) { parent.appendChild(n); }
    return n;
  }
  function flowerSvg(f) {
    var svg = el('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false' });
    el('path', { d: 'M50 50V150', stroke: '#8fcf9f', 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none' }, svg);
    el('ellipse', { cx: 36, cy: 118, rx: 14, ry: 6, fill: '#a9dcb4', transform: 'rotate(-30 36 118)' }, svg);
    for (var i = 0; i < f.n; i++) {
      el('ellipse', { cx: 50, cy: 24, rx: 11, ry: 22, fill: f.petal, transform: 'rotate(' + Math.round(360 / f.n * i) + ' 50 50)' }, svg);
    }
    el('circle', { cx: 50, cy: 50, r: 14, fill: f.core }, svg);
    return svg;
  }
  function butterflySvg(c) {
    return '<svg viewBox="-50 -40 100 80" aria-hidden="true" focusable="false">' +
      '<g class="m-wl"><ellipse cx="-20" cy="-12" rx="20" ry="22" fill="' + c[0] + '" stroke="#fff" stroke-width="3"/><ellipse cx="-16" cy="14" rx="13" ry="14" fill="' + c[1] + '" stroke="#fff" stroke-width="3"/></g>' +
      '<g class="m-wr"><ellipse cx="20" cy="-12" rx="20" ry="22" fill="' + c[0] + '" stroke="#fff" stroke-width="3"/><ellipse cx="16" cy="14" rx="13" ry="14" fill="' + c[1] + '" stroke="#fff" stroke-width="3"/></g>' +
      '<rect x="-3" y="-24" width="6" height="48" rx="3" fill="#5b5675" stroke="#fff" stroke-width="2"/></svg>';
  }

  function mount(container) {
    var scene = document.createElement('div');
    scene.className = 'm-scene';
    var box = document.createElement('div');
    box.className = 'm-box';
    scene.appendChild(box);
    container.appendChild(scene);

    var fset = Rand.pickOne(FLOWER_SETS, 'motyle-flowers'), bset = Rand.pickOne(BUTTERFLY_SETS, 'motyle-butterfly');
    var flowers = FLOWERS.map(function (f0, i) {
      var f = { x: f0.x, y: f0.y, n: f0.n, petal: fset[i][0], core: fset[i][1] };
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'm-flower';
      b.setAttribute('aria-label', 'Kwiatek ' + (i + 1));
      b.style.left = (f.x * 100) + '%';
      b.style.top = (f.y * 100) + '%';
      b.appendChild(flowerSvg(f));
      box.appendChild(b);
      return { f: f, node: b, svg: b.firstChild, swayT: -1 };
    });
    var fly = document.createElement('div');
    fly.className = 'm-butterfly';
    fly.setAttribute('aria-hidden', 'true');
    fly.innerHTML = butterflySvg(bset);
    box.appendChild(fly);
    var wl = fly.querySelector('.m-wl'), wr = fly.querySelector('.m-wr');

    var rest = 0; // flower the butterfly sits on (or flies to)
    var px = FLOWERS[rest].x, py = FLOWERS[rest].y, vx = 0, vy = 0;
    var flying = false, dir = 1, flapPhase = 0, raf = 0, last = 0;

    var idle = 0, idleLimit = 0;
    function newIdleLimit() { idle = 0; idleLimit = IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN); }
    newIdleLimit();
    function sway(fl) { fl.swayT = 0; }
    function flyTo(i) {
      if (i === rest) { return; } // never "land" on the flower it is already on / heading to
      rest = i;
      flying = true;
      dir = -dir;
    }
    function onFlower(i, e) {
      e.preventDefault();
      sway(flowers[i]);
      newIdleLimit();
      flyTo(i);
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min((now - last) / 1000, 0.05); // a long gap must not make the butterfly jump
      last = now;
      if (flying) {
        var t = FLOWERS[rest], dx = t.x - px, dy = t.y - py, a = TURN * dir;
        var c = Math.cos(a), s = Math.sin(a), w2 = OMEGA * OMEGA;
        var ax = w2 * (dx * c - dy * s) - 2 * OMEGA * vx;
        var ay = w2 * (dx * s + dy * c) - 2 * OMEGA * vy;
        vx += ax * dt; vy += ay * dt;
        px += vx * dt; py += vy * dt;
        if (Math.sqrt(dx * dx + dy * dy) < 0.006 && Math.sqrt(vx * vx + vy * vy) < 0.03) {
          px = t.x; py = t.y; vx = vy = 0; flying = false;
          newIdleLimit();
        }
      } else {
        idle += dt; // dt is clamped and the loop stops while the tab is hidden, so hidden time never counts
        if (idle >= idleLimit) {
          var others = [];
          flowers.forEach(function (fl, i) { if (i !== rest) { others.push(i); } });
          flyTo(others[Math.floor(Math.random() * others.length)]);
          newIdleLimit();
        }
      }
      flapPhase += dt * (flying ? 4.5 : 1.8) * Math.PI; // slow, calm flapping
      var k = 0.6 + 0.4 * Math.cos(flapPhase);
      // SVG transform attribute scales around the user-space origin (x=0 = body axis), so both wings fold toward the centre
      wl.setAttribute('transform', 'scale(' + k.toFixed(3) + ' 1)');
      wr.setAttribute('transform', 'scale(' + k.toFixed(3) + ' 1)');
      var tilt = Math.max(-15, Math.min(15, vx * 120));
      fly.style.left = (px * 100).toFixed(3) + '%';
      fly.style.top = (py * 100).toFixed(3) + '%';
      fly.style.transform = 'translate(-50%,-50%) rotate(' + tilt.toFixed(1) + 'deg)';
      flowers.forEach(function (fl) {
        if (fl.swayT < 0) { return; }
        fl.swayT += dt * 1000;
        if (fl.swayT >= SWAY_MS) { fl.swayT = -1; fl.svg.style.transform = ''; return; }
        var u = fl.swayT / SWAY_MS;
        fl.svg.style.transform = 'rotate(' + (Math.sin(u * Math.PI * 4) * SWAY_AMP * (1 - u)).toFixed(2) + 'deg)';
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

    var handlers = flowers.map(function (fl, i) {
      var h = function (e) { onFlower(i, e); };
      var k = function (e) { if (e.detail === 0) { onFlower(i, e); } };
      fl.node.addEventListener('pointerdown', h);
      fl.node.addEventListener('click', k);
      return { h: h, k: k };
    });
    document.addEventListener('visibilitychange', onVis);
    start();

    return function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      flowers.forEach(function (fl, i) { fl.node.removeEventListener('pointerdown', handlers[i].h); fl.node.removeEventListener('click', handlers[i].k); });
      document.removeEventListener('visibilitychange', onVis);
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'motyle') { a.mount = mount; } });
})();
