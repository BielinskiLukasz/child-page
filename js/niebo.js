// Activity "Nocne Niebo": connect glowing stars to complete car, bear, house and cat constellations.
// Stars are buttons over a square sky; lines are SVG paths created once per constellation (no growth over time).
(function () {
  var NS = 'http://www.w3.org/2000/svg', FADE_MS = 800;
  // pts: [x, y] in 0..100; the first `ring` points form a closed outline, `extra` adds more edges.
  var SHAPES = [
    { name: 'samochód', ring: 10, extra: [],
      pts: [[12, 62], [12, 50], [30, 48], [40, 34], [65, 34], [78, 48], [90, 50], [90, 62], [72, 74], [28, 74]] },
    { name: 'miś', ring: 7, extra: [[7, 5], [7, 4]],
      pts: [[26, 20], [50, 34], [74, 20], [82, 48], [66, 76], [34, 76], [18, 48], [50, 58]] },
    { name: 'domek', ring: 7, extra: [],
      pts: [[12, 52], [50, 20], [88, 52], [78, 52], [78, 84], [22, 84], [22, 52]] },
    { name: 'kot', ring: 8, extra: [],
      pts: [[24, 16], [40, 32], [60, 32], [76, 16], [82, 50], [68, 80], [32, 80], [18, 50]] }
  ];

  function svgEl(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) { parent.appendChild(n); }
    return n;
  }

  function mount(container) {
    var scene = document.createElement('div');
    scene.className = 'night';
    scene.innerHTML = '<div class="n-sky"><svg class="n-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"></svg></div>' +
      '<div class="n-msg" aria-live="polite"><p class="n-bravo">Brawo, Artur!</p><button type="button" class="n-next">Dalej</button></div>';
    container.appendChild(scene);
    var sky = scene.querySelector('.n-sky'), lines = scene.querySelector('.n-lines');
    var msg = scene.querySelector('.n-msg'), next = scene.querySelector('.n-next');
    var index = 0, busy = false, timers = [], stars, edges, active, shape;

    function later(fn, ms) {
      var t = setTimeout(function () { timers.splice(timers.indexOf(t), 1); fn(); }, ms);
      timers.push(t);
    }

    function build() {
      shape = SHAPES[index];
      active = shape.pts.map(function () { return false; });
      lines.textContent = '';
      Array.prototype.slice.call(sky.querySelectorAll('.n-star')).forEach(function (b) { sky.removeChild(b); });
      var pairs = [], i;
      for (i = 0; i < shape.ring; i++) { pairs.push([i, (i + 1) % shape.ring]); }
      pairs = pairs.concat(shape.extra);
      var pl = shape.pts.slice(0, shape.ring).map(function (p) { return p.join(','); }).join(' ');
      svgEl('polygon', { 'class': 'n-fill', points: pl }, lines);
      edges = pairs.map(function (p) {
        var a = shape.pts[p[0]], b = shape.pts[p[1]], d = 'M' + a.join(' ') + 'L' + b.join(' ');
        svgEl('path', { 'class': 'n-ghost', d: d }, lines);
        return { a: p[0], b: p[1], node: svgEl('path', { 'class': 'n-line', d: d, pathLength: 1 }, lines) };
      });
      stars = shape.pts.map(function (p, k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'n-star';
        b.setAttribute('aria-label', 'Gwiazdka');
        b.style.left = p[0] + '%';
        b.style.top = p[1] + '%';
        b.dataset.i = k;
        sky.appendChild(b);
        return b;
      });
      scene.classList.remove('done');
      msg.classList.remove('show');
      next.disabled = true;
    }

    function activate(k) {
      if (busy || active[k]) { return; }
      active[k] = true;
      stars[k].classList.add('on');
      edges.forEach(function (e) { if (active[e.a] && active[e.b]) { e.node.classList.add('on'); } });
      if (active.every(Boolean)) {
        scene.classList.add('done');
        msg.classList.add('show');
        next.disabled = false;
      }
    }

    function onSky(e) {
      var b = e.target.closest ? e.target.closest('.n-star') : null;
      if (b) { activate(+b.dataset.i); }
    }
    function onNext() {
      if (busy || next.disabled) { return; }
      busy = true;
      next.disabled = true;
      sky.classList.add('fade');
      msg.classList.remove('show');
      later(function () {
        index = (index + 1) % SHAPES.length;
        build();
        sky.classList.remove('fade');
        later(function () { busy = false; }, FADE_MS);
      }, FADE_MS);
    }
    function onVis() { scene.classList.toggle('paused', document.hidden); }

    sky.addEventListener('click', onSky);
    next.addEventListener('click', onNext);
    document.addEventListener('visibilitychange', onVis);
    build();
    onVis();

    return function () {
      timers.forEach(clearTimeout);
      timers = [];
      sky.removeEventListener('click', onSky);
      next.removeEventListener('click', onNext);
      document.removeEventListener('visibilitychange', onVis);
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'niebo') { a.mount = mount; } });
})();
