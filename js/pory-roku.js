// Activity "Pory Roku": a big tree on a hill. Touching the tree slowly (~4s) changes the season
// spring -> summer -> autumn -> winter -> spring ...; sky, ground, crown and a seasonal animal change with it.
// Touches on the tree/animal are ignored while a change runs; nothing changes by itself. A few soft particles
// (petals, leaves, snowflakes; pooled, max 18 alive) drift down and are removed after fading at the ground.
// One rAF loop (capped dt, stopped when the tab is hidden) sets all opacities/colours in JS, so the change
// also works under prefers-reduced-motion (which only drops the particles). Nothing is stored.
(function () {
  var CHANGE_S = 4, REACT_S = 2, MAXDT = 0.05, MAX_P = 18, SPAWN_S = 1.1, NS = 'http://www.w3.org/2000/svg';
  var SKY = ['#dff1fb', '#c9e8fa', '#f6e6d2', '#dfe6f2'];
  var GROUND = ['#cfe8c3', '#a9d9a0', '#e1cfa0', '#f4f8fc'];
  var FAR = ['#bfe0b4', '#92cc8f', '#d3b98a', '#e6eef7'];

  function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  function mix(a, b, t) {
    var x = hex(a), y = hex(b);
    return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * t) + ',' + Math.round(x[1] + (y[1] - x[1]) * t) + ',' + Math.round(x[2] + (y[2] - x[2]) * t) + ')';
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }

  var CROWN = [[150, 105, 38], [250, 105, 38], [165, 72, 34], [235, 72, 34], [200, 55, 36], [200, 112, 46]];
  function circles(fill, extra) {
    return CROWN.map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + fill + '"' + (extra || '') + '/>'; }).join('');
  }
  var SPOTS = [[128, 92], [160, 60], [200, 36], [240, 60], [272, 92], [150, 128], [200, 98], [250, 128], [180, 80], [222, 82], [118, 118], [282, 118], [200, 140]];
  function blossom(x, y) {
    var s = '';
    for (var i = 0; i < 5; i++) {
      var a = i * Math.PI * 2 / 5;
      s += '<circle cx="' + (x + Math.cos(a) * 4.4).toFixed(1) + '" cy="' + (y + Math.sin(a) * 4.4).toFixed(1) + '" r="3.6" fill="#fbc9dd"/>';
    }
    return s + '<circle cx="' + x + '" cy="' + y + '" r="2.4" fill="#ffe9a8"/>';
  }
  function leaf(x, y, rot, fill) {
    return '<path transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')" d="M0-9Q7-2 0 9Q-7-2 0-9z" fill="' + fill + '"/>';
  }
  var LEAF_COL = ['#f2a65a', '#f6c35e', '#e98f4f', '#f8d27a'];

  var SPRING = circles('#cfeab4', ' opacity=".95"') + SPOTS.map(function (p) { return blossom(p[0], p[1]); }).join('');
  var SUMMER = circles('#8fcf9a') + '<g fill="#7bbf8a">' + SPOTS.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + (p[1] + 6) + '" r="9"/>'; }).join('') + '</g>';
  var AUTUMN = circles('#f4cf92', ' opacity=".9"') + SPOTS.map(function (p, i) { return leaf(p[0], p[1], (i * 47) % 120 - 60, LEAF_COL[i % 4]); }).join('');
  var WINTER = '<g fill="#fff"><ellipse cx="150" cy="98" rx="14" ry="5"/><ellipse cx="250" cy="93" rx="14" ry="5"/><ellipse cx="200" cy="68" rx="12" ry="5"/>' +
    '<ellipse cx="172" cy="124" rx="10" ry="4"/><ellipse cx="228" cy="124" rx="10" ry="4"/><ellipse cx="200" cy="150" rx="22" ry="5"/></g>';

  // animals: [left %, top %, width %] on the 4:3 board
  var ANIMALS = [
    { label: 'Ptaszek', pos: [57, 17, 13], svg:
      '<ellipse cx="50" cy="58" rx="26" ry="22" fill="#a8d8f0"/><circle cx="38" cy="34" r="17" fill="#a8d8f0"/><path d="M52 62q22 6 34 26q-26 2-34-26z" fill="#8cc4e4"/>' +
      '<ellipse cx="52" cy="66" rx="14" ry="10" fill="#fff4dc"/><path d="M22 34l-14 4 14 5z" fill="#f6c35e"/><circle cx="34" cy="30" r="2.6" fill="#4a4560"/>' +
      '<path d="M44 88v8M56 88v8" stroke="#f6c35e" stroke-width="3" stroke-linecap="round"/>' },
    { label: 'Motylek', pos: [14, 40, 13], svg:
      '<ellipse cx="32" cy="38" rx="20" ry="22" fill="#f7a8c9"/><ellipse cx="68" cy="38" rx="20" ry="22" fill="#c9b8f2"/>' +
      '<ellipse cx="34" cy="64" rx="13" ry="15" fill="#fbc9dd"/><ellipse cx="66" cy="64" rx="13" ry="15" fill="#dcd0f7"/>' +
      '<rect x="46" y="26" width="8" height="50" rx="4" fill="#5b5675"/><path d="M48 28q-6-14-12-16M52 28q6-14 12-16" fill="none" stroke="#5b5675" stroke-width="2.5" stroke-linecap="round"/>' },
    { label: 'Wiewiórka', pos: [12, 55, 17], svg:
      '<path d="M66 86q34 4 26-34q-4-20-18-22q10 20-8 30z" fill="#e9a77a"/><path d="M80 52q8 12 0 26" fill="none" stroke="#f6d4b4" stroke-width="5" stroke-linecap="round"/>' +
      '<ellipse cx="46" cy="68" rx="22" ry="24" fill="#e9a77a"/><ellipse cx="46" cy="74" rx="12" ry="16" fill="#fbe7c8"/>' +
      '<circle cx="40" cy="38" r="16" fill="#e9a77a"/><circle cx="29" cy="25" r="6" fill="#e9a77a"/><circle cx="50" cy="24" r="6" fill="#e9a77a"/>' +
      '<circle cx="34" cy="36" r="2.4" fill="#4a4560"/><circle cx="46" cy="36" r="2.4" fill="#4a4560"/><path d="M38 43q2 3 4 0" fill="none" stroke="#4a4560" stroke-width="1.8" stroke-linecap="round"/>' +
      '<circle cx="34" cy="62" r="7" fill="#c9a06a"/>' },
    { label: 'Zajączek', pos: [70, 56, 15], svg:
      '<ellipse cx="50" cy="72" rx="26" ry="22" fill="#fbf7ff" stroke="#e1d9f0" stroke-width="2"/><circle cx="50" cy="44" r="18" fill="#fbf7ff" stroke="#e1d9f0" stroke-width="2"/>' +
      '<ellipse cx="40" cy="14" rx="6" ry="17" fill="#fbf7ff" stroke="#e1d9f0" stroke-width="2"/><ellipse cx="60" cy="14" rx="6" ry="17" fill="#fbf7ff" stroke="#e1d9f0" stroke-width="2"/>' +
      '<ellipse cx="40" cy="16" rx="2.6" ry="11" fill="#f7c9d6"/><ellipse cx="60" cy="16" rx="2.6" ry="11" fill="#f7c9d6"/>' +
      '<circle cx="43" cy="42" r="2.4" fill="#4a4560"/><circle cx="57" cy="42" r="2.4" fill="#4a4560"/><path d="M47 49l3 3 3-3z" fill="#f7a8c9"/>' +
      '<circle cx="74" cy="78" r="7" fill="#fff" stroke="#e1d9f0" stroke-width="2"/>' }
  ];

  function scene() {
    return '<svg viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      '<rect class="pk-sky" width="400" height="300"/><circle cx="345" cy="48" r="24" fill="#fff6d4" opacity=".9"/>' +
      '<ellipse class="pk-far" cx="60" cy="230" rx="170" ry="70"/>' +
      '<ellipse class="pk-hill" cx="200" cy="300" rx="270" ry="108"/>' +
      '<ellipse class="pk-snow" cx="200" cy="300" rx="270" ry="108" fill="#fff"/>' +
      '<ellipse cx="200" cy="205" rx="64" ry="9" fill="#000" opacity=".05"/>' +
      '<g stroke="#b69272" stroke-linecap="round" fill="none"><path d="M200 210V140" stroke-width="22"/>' +
      '<path d="M200 156Q175 124 150 100M200 156Q225 124 250 96M200 140Q200 100 200 62" stroke-width="9"/></g>' +
      '<g class="pk-c" opacity="1">' + SPRING + '</g><g class="pk-c" opacity="0">' + SUMMER + '</g>' +
      '<g class="pk-c" opacity="0">' + AUTUMN + '</g><g class="pk-c" opacity="0">' + WINTER + '</g>' +
      '<g class="pk-parts"></g></svg>';
  }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'pk';
    root.innerHTML = '<div class="pk-board">' + scene() + '</div>';
    container.appendChild(root);
    var board = root.firstChild;
    var sky = board.querySelector('.pk-sky'), far = board.querySelector('.pk-far'), hill = board.querySelector('.pk-hill');
    var snow = board.querySelector('.pk-snow'), layer = board.querySelector('.pk-parts');
    var crowns = board.querySelectorAll('.pk-c');
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var tree = document.createElement('button');
    tree.type = 'button'; tree.className = 'pk-btn pk-tree'; tree.setAttribute('aria-label', 'Drzewo');
    board.appendChild(tree);
    var animals = ANIMALS.map(function (d, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pk-btn pk-animal';
      b.setAttribute('aria-label', d.label);
      b.style.left = d.pos[0] + '%'; b.style.top = d.pos[1] + '%'; b.style.width = d.pos[2] + '%';
      b.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + d.svg + '</svg>';
      board.appendChild(b);
      var a = { el: b, svg: b.firstChild, i: i, op: i === 0 ? 1 : 0 };
      b.addEventListener('click', function () { if (!change && react < 0 && a.i === cur) { react = 0; wake(); } });
      return a;
    });

    var cur = 0, nxt = 0, change = false, ct = 0, react = -1, clock = 0, spawnIn = 0.5, parts = [];

    function weights() {
      var w = [0, 0, 0, 0];
      if (change) { var p = smooth(ct / CHANGE_S); w[cur] = 1 - p; w[nxt] = p; } else { w[cur] = 1; }
      return w;
    }
    function apply() {
      var w = weights(), p = change ? smooth(ct / CHANGE_S) : 0, a = cur, b = change ? nxt : cur;
      sky.style.fill = mix(SKY[a], SKY[b], p);
      hill.style.fill = mix(GROUND[a], GROUND[b], p);
      far.style.fill = mix(FAR[a], FAR[b], p);
      snow.style.opacity = (0.92 * w[3]).toFixed(3);
      for (var i = 0; i < 4; i++) {
        crowns[i].style.opacity = w[i].toFixed(3);
        animals[i].el.style.opacity = w[i].toFixed(3);
        animals[i].el.style.visibility = w[i] > 0.001 ? 'visible' : 'hidden';
      }
    }
    function lock() {
      var off = change;
      tree.disabled = off;
      animals.forEach(function (a) { a.el.disabled = off || a.i !== cur; a.el.tabIndex = a.el.disabled ? -1 : 0; });
    }
    function startChange() {
      if (change) { return; }
      change = true; ct = 0; nxt = (cur + 1) % 4; react = -1; lock(); wake();
    }
    tree.addEventListener('click', startChange);

    function shown() { return change && ct / CHANGE_S >= 0.5 ? nxt : cur; }
    function spawn() {
      var s = shown();
      if (s === 1 || parts.length >= MAX_P) { return; }
      var el = document.createElementNS(NS, 'g'), inner, x, y, vy, r = Math.random();
      if (s === 3) {
        x = 20 + r * 360; y = -6; vy = 14 + Math.random() * 6;
        inner = '<circle r="' + (2.6 + Math.random() * 1.6).toFixed(1) + '" fill="#fff" stroke="#cfe0f0" stroke-width=".8"/>';
      } else {
        x = 110 + r * 180; y = 70 + Math.random() * 70; vy = 11 + Math.random() * 5;
        inner = s === 0 ? '<ellipse rx="4.5" ry="2.8" fill="#fbc9dd"/>' : leaf(0, 0, 0, LEAF_COL[Math.floor(Math.random() * 4)]).replace(/ transform="[^"]*"/, '');
      }
      el.innerHTML = inner;
      layer.appendChild(el);
      parts.push({ el: el, x: x, y: y, vy: vy, ph: Math.random() * 6, rot: Math.random() * 360, g: 232 + Math.random() * 50, age: 0, fade: -1 });
    }
    function stepParts(dt) {
      for (var i = parts.length - 1; i >= 0; i--) {
        var q = parts[i], o = 1;
        q.age += dt; q.y += q.vy * dt; q.rot += 20 * dt;
        if (q.fade < 0 && q.y >= q.g) { q.fade = 0; }
        if (q.fade >= 0) { q.fade += dt; o = 1 - q.fade / 1.2; q.y -= q.vy * dt * 0.8; }
        if (o <= 0) { layer.removeChild(q.el); parts.splice(i, 1); continue; }
        o *= Math.min(1, q.age / 0.8);
        q.el.setAttribute('transform', 'translate(' + (q.x + Math.sin(clock * 0.8 + q.ph) * 12).toFixed(1) + ' ' + q.y.toFixed(1) + ') rotate(' + q.rot.toFixed(0) + ')');
        q.el.setAttribute('opacity', o.toFixed(2));
      }
    }
    function wiggle(a, u) {
      var env = Math.sin(Math.PI * u), x = 0, y = 0, r = 0, w = Math.sin(u * Math.PI * 4);
      if (a.i === 0) { y = -Math.abs(Math.sin(u * Math.PI * 3)) * 10 * env; r = w * 8 * env; }
      else if (a.i === 1) { x = Math.sin(u * Math.PI * 2) * 25 * env; y = Math.cos(u * Math.PI * 2) * 12 * env - 12 * env; r = w * 10 * env; }
      else if (a.i === 2) { y = -Math.abs(Math.sin(u * Math.PI * 2)) * 12 * env; r = w * 6 * env; }
      else { y = -Math.abs(Math.sin(u * Math.PI * 2)) * 16 * env; r = w * 3 * env; }
      a.svg.style.transform = 'translate(' + x.toFixed(1) + '%,' + y.toFixed(1) + '%) rotate(' + r.toFixed(1) + 'deg)';
    }

    var raf = 0, last = 0;
    function frame(now) {
      raf = 0;
      var dt = last ? Math.min((now - last) / 1000, MAXDT) : 0;
      last = now; clock += dt;
      if (change) {
        ct += dt;
        if (ct >= CHANGE_S) { cur = nxt; change = false; ct = 0; lock(); }
        apply();
      }
      if (react >= 0) {
        react += dt;
        var u = react / REACT_S;
        if (u >= 1) { react = -1; u = 0; }
        wiggle(animals[cur], u);
      }
      if (!reduced) {
        spawnIn -= dt;
        if (spawnIn <= 0) { spawn(); spawnIn = SPAWN_S + Math.random() * 0.6; }
        stepParts(dt);
      }
      raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
      else { wake(); }
    }
    document.addEventListener('visibilitychange', onVis);
    lock(); apply(); wake();

    return function cleanup() {
      document.removeEventListener('visibilitychange', onVis);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      parts = [];
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  var list = window.ACTIVITIES || [];
  for (var i = 0; i < list.length; i++) { if (list[i].id === 'pory-roku') { list[i].mount = mount; } }
})();
