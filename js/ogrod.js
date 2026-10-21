// Activity "Magiczny Ogród": touch the lawn -> a seed grows into a flower or mushroom; touch the cloud -> garden fades away.
// Plants are small DOM nodes (max MAX_PLANTS visible); every removed plant is taken out of the DOM.
(function () {
  var MAX_PLANTS = 12, MAX_FADING = 6, FADE_MS = 900, NS = 'http://www.w3.org/2000/svg';
  var FLOWERS = [
    { petal: '#f7a8c9', core: '#ffe9a8', n: 6 }, { petal: '#ffd98a', core: '#f2b7a0', n: 8 },
    { petal: '#c9b8f2', core: '#fff3c4', n: 5 }, { petal: '#ffb7a5', core: '#ffe9a8', n: 7 }
  ];
  var MUSHROOMS = [
    { cap: '#f5b5b5', dot: '#fff', stalk: '#fbf1e2' }, { cap: '#e8c9a0', dot: '#fff6e0', stalk: '#fbf1e2' },
    { cap: '#cdbaf0', dot: '#fff', stalk: '#fbf1e2' }
  ];

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) { parent.appendChild(n); }
    return n;
  }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function plantSvg() {
    var svg = el('svg', { viewBox: '0 0 60 100', 'aria-hidden': 'true', focusable: 'false' });
    el('circle', { 'class': 'g-seed', cx: 30, cy: 96, r: 4, fill: '#b99a78' }, svg);
    if (Math.random() < 0.65) {
      var f = pick(FLOWERS);
      var stem = el('g', { 'class': 'g-stem' }, svg);
      el('path', { d: 'M30 100V44', stroke: '#8fcf9f', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, stem);
      var leaves = el('g', { 'class': 'g-leaves' }, svg);
      el('ellipse', { cx: 21, cy: 76, rx: 9, ry: 4.5, fill: '#a9dcb4', transform: 'rotate(-30 21 76)' }, leaves);
      el('ellipse', { cx: 39, cy: 66, rx: 9, ry: 4.5, fill: '#a9dcb4', transform: 'rotate(30 39 66)' }, leaves);
      var bloom = el('g', { 'class': 'g-bloom' }, svg);
      for (var i = 0; i < f.n; i++) {
        el('ellipse', { cx: 30, cy: 30, rx: 5.5, ry: 10, fill: f.petal,
          transform: 'rotate(' + Math.round(360 / f.n * i) + ' 30 40)' }, bloom);
      }
      el('circle', { cx: 30, cy: 40, r: 6, fill: f.core }, bloom);
    } else {
      var m = pick(MUSHROOMS);
      var st = el('g', { 'class': 'g-stem' }, svg);
      el('rect', { x: 25, y: 60, width: 10, height: 40, rx: 5, fill: m.stalk }, st);
      var lv = el('g', { 'class': 'g-leaves' }, svg);
      el('ellipse', { cx: 22, cy: 97, rx: 7, ry: 3.5, fill: '#a9dcb4' }, lv);
      el('ellipse', { cx: 39, cy: 98, rx: 6, ry: 3, fill: '#a9dcb4' }, lv);
      var cap = el('g', { 'class': 'g-bloom' }, svg);
      el('path', { d: 'M10 64a20 20 0 0 1 40 0z', fill: m.cap }, cap);
      el('circle', { cx: 22, cy: 56, r: 3, fill: m.dot }, cap);
      el('circle', { cx: 35, cy: 52, r: 3.5, fill: m.dot }, cap);
    }
    return svg;
  }

  function mount(container) {
    var scene = document.createElement('div');
    scene.className = 'garden';
    scene.innerHTML = '<div class="g-sky"></div><div class="g-lawn"></div><div class="g-plants" aria-hidden="true"></div>' +
      '<div class="g-cloud" aria-label="Chmurka"><svg viewBox="0 0 120 60" aria-hidden="true" focusable="false">' +
      '<g fill="#fff"><circle cx="35" cy="38" r="20"/><circle cx="60" cy="28" r="26"/><circle cx="88" cy="38" r="20"/><rect x="35" y="38" width="53" height="20" rx="10"/></g></svg></div>';
    container.appendChild(scene);
    var lawn = scene.querySelector('.g-lawn'), plants = scene.querySelector('.g-plants'),
        cloud = scene.querySelector('.g-cloud');
    var live = [], fading = [], resetting = false, timers = [];

    function later(fn, ms) {
      var t = setTimeout(function () { timers.splice(timers.indexOf(t), 1); fn(); }, ms);
      timers.push(t);
    }
    function drop(p) {
      var i = fading.indexOf(p);
      if (i >= 0) { fading.splice(i, 1); }
      if (p.node.parentNode) { p.node.parentNode.removeChild(p.node); }
    }
    function fade(p) {
      var i = live.indexOf(p);
      if (i < 0) { return; }
      live.splice(i, 1);
      fading.push(p);
      p.node.classList.add('fading');
      later(function () { drop(p); }, FADE_MS + 50);
      while (fading.length > MAX_FADING) { drop(fading[0]); }
    }

    function plant(clientX, clientY) {
      var r = lawn.getBoundingClientRect();
      var x = Math.min(Math.max(clientX, r.left), r.right), y = Math.min(Math.max(clientY, r.top), r.bottom);
      while (live.length >= MAX_PLANTS) { fade(live[0]); }
      var node = document.createElement('div');
      node.className = 'g-plant';
      var depth = (y - r.top) / Math.max(r.height, 1); // lower on the lawn = a bit bigger
      node.style.left = (x / window.innerWidth * 100) + '%';
      node.style.top = (y / window.innerHeight * 100) + '%';
      node.style.setProperty('--s', (0.8 + 0.4 * depth).toFixed(2));
      node.style.zIndex = String(Math.round(y));
      node.appendChild(plantSvg());
      plants.appendChild(node);
      live.push({ node: node });
    }

    function onLawn(e) {
      e.preventDefault();
      if (resetting) { return; }
      plant(e.clientX, e.clientY);
    }
    function onCloud(e) {
      e.preventDefault();
      e.stopPropagation();
      if (resetting) { return; }
      resetting = true;
      live.slice().forEach(fade);
      later(function () { resetting = false; }, FADE_MS + 100);
    }
    function onVis() { scene.classList.toggle('paused', document.hidden); }

    lawn.addEventListener('pointerdown', onLawn);
    plants.addEventListener('pointerdown', function (e) { e.preventDefault(); });
    cloud.addEventListener('pointerdown', onCloud);
    document.addEventListener('visibilitychange', onVis);
    onVis();

    return function () {
      timers.forEach(clearTimeout);
      timers = [];
      lawn.removeEventListener('pointerdown', onLawn);
      cloud.removeEventListener('pointerdown', onCloud);
      document.removeEventListener('visibilitychange', onVis);
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'ogrod') { a.mount = mount; } });
})();
