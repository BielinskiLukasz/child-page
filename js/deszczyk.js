// Activity "Deszczyk i Tęcza": touch a cloud -> gentle rain for ~5 s; puddles ripple and fill a little;
// after ~10 s of total rain a soft rainbow fades in, stays, then fades out.
// All motion (rain, ripples, puddles, rainbow) runs in one rAF loop with a capped dt, so it works under
// prefers-reduced-motion and pauses (never replays) while the tab is hidden. DOM is bounded by fixed pools.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var RAIN_S = 5, RAINBOW_AFTER_S = 10, FADE_IN_S = 4, HOLD_S = 10, FADE_OUT_S = 4;
  var MAX_DROPS = 60, MAX_RIPPLES = 12, DROPS_PER_S = 7, FALL = 0.2, RIPPLE_S = 2.6;
  var CLOUDS = [{ x: 0.2, y: 0.17, w: 0.34 }, { x: 0.52, y: 0.1, w: 0.36 }, { x: 0.82, y: 0.2, w: 0.3 }];
  var PUDDLES = [{ x: 0.24, y: 0.84, w: 0.24 }, { x: 0.56, y: 0.92, w: 0.22 }, { x: 0.8, y: 0.8, w: 0.2 }];
  var GROUND_MIN = 0.74, GROUND_MAX = 0.97;

  function smooth(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
  function div(cls, parent) {
    var d = document.createElement('div');
    d.className = cls;
    parent.appendChild(d);
    return d;
  }
  var CLOUD_SVG = '<svg viewBox="0 0 120 70" aria-hidden="true" focusable="false">' +
    '<g fill="#ffffff"><circle cx="38" cy="42" r="22"/><circle cx="62" cy="32" r="26"/><circle cx="88" cy="43" r="20"/>' +
    '<rect x="22" y="42" width="80" height="20" rx="10"/></g>' +
    '<g fill="#e8f1fb"><rect x="30" y="52" width="64" height="10" rx="5"/></g></svg>';
  function rainbowSvg() {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 110');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    ['#f7b6c2', '#ffd3a8', '#fff0a8', '#bfe6b4', '#b5dcf5', '#c9b8f2'].forEach(function (c, i) {
      var r = 96 - i * 9;
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M' + (100 - r) + ' 104A' + r + ' ' + r + ' 0 0 1 ' + (100 + r) + ' 104');
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', c);
      p.setAttribute('stroke-width', 9);
      svg.appendChild(p);
    });
    return svg;
  }

  function mount(container) {
    var scene = div('r-scene', container);
    var box = div('r-box', scene);
    div('r-meadow', box);
    var rainbowEl = div('r-rainbow', box);
    rainbowEl.appendChild(rainbowSvg());

    var puddles = PUDDLES.map(function (p) {
      var n = div('r-puddle', box);
      n.style.left = (p.x * 100) + '%';
      n.style.top = (p.y * 100) + '%';
      n.style.width = (p.w * 100) + '%';
      return { p: p, node: n };
    });
    var ripples = [];
    for (var i = 0; i < MAX_RIPPLES; i++) {
      var rn = div('r-ripple', box);
      rn.style.display = 'none';
      ripples.push({ node: rn, age: -1 });
    }
    var drops = [];
    for (var j = 0; j < MAX_DROPS; j++) {
      var dn = div('r-drop', box);
      dn.style.display = 'none';
      drops.push({ node: dn, live: false, x: 0, y: 0, ground: 0, puddle: null });
    }
    var clouds = CLOUDS.map(function (c, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'r-cloud';
      b.setAttribute('aria-label', 'Chmurka ' + (k + 1));
      b.style.left = (c.x * 100) + '%';
      b.style.top = (c.y * 100) + '%';
      b.style.width = (c.w * 100) + '%';
      b.innerHTML = CLOUD_SVG;
      box.appendChild(b);
      return { c: c, node: b, rain: 0, acc: 0 };
    });

    var level = 0, rainTotal = 0, bowState = 0, bowT = 0, raf = 0, last = 0;

    function touch(i, e) {
      e.preventDefault();
      clouds[i].rain = RAIN_S;
      start();
    }
    function ripple(x, y) {
      for (var k = 0; k < ripples.length; k++) {
        if (ripples[k].age < 0) {
          var r = ripples[k];
          r.age = 0;
          r.node.style.left = (x * 100) + '%';
          r.node.style.top = (y * 100) + '%';
          r.node.style.display = '';
          return;
        }
      }
    }
    function spawn(cl) {
      for (var k = 0; k < drops.length; k++) {
        var d = drops[k];
        if (d.live) { continue; }
        d.live = true;
        d.puddle = Math.random() < 0.6 ? puddles[Math.floor(Math.random() * puddles.length)].p : null;
        if (d.puddle) {
          d.x = d.puddle.x + (Math.random() - 0.5) * d.puddle.w * 0.6;
          d.ground = d.puddle.y;
        } else {
          d.x = cl.c.x + (Math.random() - 0.5) * cl.c.w * 0.7;
          d.ground = GROUND_MIN + Math.random() * (GROUND_MAX - GROUND_MIN);
        }
        d.y = cl.c.y + 0.05;
        d.node.style.display = '';
        return;
      }
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min((now - last) / 1000, 0.05); // long gaps (hidden tab) are never replayed
      last = now;
      var raining = false;
      clouds.forEach(function (cl) {
        if (cl.rain <= 0) { return; }
        raining = true;
        cl.rain -= dt;
        cl.acc += dt * DROPS_PER_S;
        while (cl.acc >= 1) { cl.acc -= 1; spawn(cl); }
      });
      if (raining && bowState === 0) { rainTotal += dt; } // rain while the rainbow shows doesn't count towards the next one
      drops.forEach(function (d) {
        if (!d.live) { return; }
        d.y += FALL * dt;
        if (d.y >= d.ground) {
          d.live = false;
          d.node.style.display = 'none';
          if (d.puddle) { ripple(d.puddle.x + (d.x - d.puddle.x) * 0.8, d.puddle.y); }
          return;
        }
        d.node.style.left = (d.x * 100).toFixed(2) + '%';
        d.node.style.top = (d.y * 100).toFixed(2) + '%';
      });
      var anyDrop = drops.some(function (d) { return d.live; });
      ripples.forEach(function (r) {
        if (r.age < 0) { return; }
        r.age += dt;
        var u = r.age / RIPPLE_S;
        if (u >= 1) { r.age = -1; r.node.style.display = 'none'; return; }
        r.node.style.transform = 'translate(-50%,-50%) scale(' + (0.2 + 0.8 * smooth(u)).toFixed(3) + ')';
        r.node.style.opacity = (0.7 * (1 - u)).toFixed(3);
      });
      var anyRipple = ripples.some(function (r) { return r.age >= 0; });
      // puddles slowly fill while it rains and shrink back afterwards
      var target = raining ? 1 : 0;
      level += Math.max(-1, Math.min(1, target - level)) * Math.min(dt * 0.25, 1);
      if (Math.abs(target - level) < 0.002) { level = target; }
      puddles.forEach(function (pd) {
        pd.node.style.transform = 'translate(-50%,-50%) scale(' + (1 + 0.18 * level).toFixed(3) + ')';
      });
      // rainbow: fade in, hold, fade out
      if (bowState === 0 && rainTotal >= RAINBOW_AFTER_S) { bowState = 1; bowT = 0; rainTotal = 0; }
      if (bowState) {
        bowT += dt;
        var o;
        if (bowState === 1) { o = smooth(bowT / FADE_IN_S); if (bowT >= FADE_IN_S) { bowState = 2; bowT = 0; } }
        else if (bowState === 2) { o = 1; if (bowT >= HOLD_S) { bowState = 3; bowT = 0; } }
        else { o = 1 - smooth(bowT / FADE_OUT_S); if (bowT >= FADE_OUT_S) { bowState = 0; o = 0; } }
        rainbowEl.style.opacity = (0.85 * o).toFixed(3);
      }
      var busy = raining || anyDrop || anyRipple || bowState || level > 0;
      if (busy && !document.hidden) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden) { return; }
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }

    var handlers = clouds.map(function (cl, i) {
      var h = function (e) { touch(i, e); };
      var k = function (e) { if (e.detail === 0) { touch(i, e); } };
      cl.node.addEventListener('pointerdown', h);
      cl.node.addEventListener('click', k);
      return { h: h, k: k };
    });
    document.addEventListener('visibilitychange', onVis);

    return function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      clouds.forEach(function (cl, i) { cl.node.removeEventListener('pointerdown', handlers[i].h); cl.node.removeEventListener('click', handlers[i].k); });
      document.removeEventListener('visibilitychange', onVis);
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'deszczyk') { a.mount = mount; } });
})();
