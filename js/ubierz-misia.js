// Activity "Ubierz Misia": dress a teddy bear for the weather in the window. No wrong answers: every item is accepted
// for any weather; a fitting item gives a small happy hop + soft glow (~2 s), another one a small neutral head tilt.
// Board = fixed 4:3 coordinate space of 400x300 "units"; everything is positioned in units and scaled by k = width/400.
// One rAF loop (works under prefers-reduced-motion, pauses when the tab is hidden, stops when idle);
// fixed DOM (6 items, <= 20 weather particles).
(function () {
  var SVGNS = 'http://www.w3.org/2000/svg';
  var BX = 165, PIVOT_Y = 258;                       // bear centre x and the point it tilts around
  var BEAR_RECT = { x0: 95, y0: 100, x1: 235, y1: 275 }; // drop zone (units)
  var WEATHER_S = 3;                                 // seconds for a full weather change
  var HAPPY_MS = 2000, NEUTRAL_MS = 1400;
  var SKY = [[191, 227, 247], [184, 196, 216], [223, 230, 243]]; // sun, rain, snow
  var GROUND = [[207, 232, 195], [190, 220, 184], [244, 248, 255]];

  var ITEMS = [
    { id: 'sunhat', label: 'kapelusz słoneczny', fits: 0, wx: 165, wy: 110,
      art: '<ellipse cx="50" cy="64" rx="44" ry="13" fill="#ffd98a"/><path d="M24 64Q24 26 50 26Q76 26 76 64Z" fill="#ffe3a0"/><rect x="25" y="52" width="50" height="9" rx="4" fill="#f7a8c9"/>' },
    { id: 'umbrella', label: 'parasol', fits: 1, wx: 222, wy: 184,
      art: '<path d="M8 54A42 42 0 0 1 92 54Q82 46 71 54Q60 46 50 54Q40 46 29 54Q18 46 8 54Z" fill="#a8d8f0"/><path d="M50 54V80Q50 90 41 88" fill="none" stroke="#8a84a8" stroke-width="5" stroke-linecap="round"/><path d="M50 12V18" stroke="#8a84a8" stroke-width="4" stroke-linecap="round"/>' },
    { id: 'scarf', label: 'szalik', fits: 2, wx: 165, wy: 184,
      art: '<rect x="10" y="32" width="80" height="26" rx="13" fill="#f7a8c9"/><rect x="56" y="48" width="22" height="42" rx="9" fill="#f08fb6"/><path d="M60 66h14M60 76h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' },
    { id: 'boots', label: 'kalosze', fits: 1, wx: 165, wy: 241,
      art: '<g fill="#9ed8c6"><rect x="10" y="40" width="28" height="22" rx="5"/><ellipse cx="24" cy="68" rx="23" ry="14"/><rect x="62" y="40" width="28" height="22" rx="5"/><ellipse cx="76" cy="68" rx="23" ry="14"/></g><path d="M10 47H38M62 47H90" stroke="#7fc4b0" stroke-width="5"/><path d="M8 74Q24 80 40 74M60 74Q76 80 92 74" fill="none" stroke="#7fc4b0" stroke-width="3" stroke-linecap="round"/>' },
    { id: 'warmhat', label: 'ciepła czapka', fits: 2, wx: 165, wy: 112,
      art: '<path d="M18 62Q18 22 50 22Q82 22 82 62Z" fill="#c9b8f2"/><rect x="13" y="56" width="74" height="18" rx="9" fill="#b39cf0"/><circle cx="50" cy="16" r="9" fill="#fff"/>' },
    { id: 'sunglasses', label: 'okulary przeciwsłoneczne', fits: 0, wx: 165, wy: 144,
      art: '<path d="M46 48Q50 42 54 48" fill="none" stroke="#5b5675" stroke-width="4"/><circle cx="28" cy="52" r="19" fill="#6b6490"/><circle cx="72" cy="52" r="19" fill="#6b6490"/><path d="M9 48L2 42M91 48L98 42" stroke="#5b5675" stroke-width="4" stroke-linecap="round"/><path d="M20 46a9 9 0 0 1 7-4M64 46a9 9 0 0 1 7-4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>' }
  ];
  // Home slots on the right: two columns of three (units).
  var HOME_X = [288, 356], HOME_Y = [70, 150, 230];

  var BEAR = '<g id="um-bear">' +
    '<circle id="um-glow" cx="165" cy="190" r="92" fill="#ffe9a8" opacity="0"/>' +
    '<g id="um-body">' +
    '<ellipse cx="143" cy="256" rx="20" ry="12" fill="#c99566"/><ellipse cx="187" cy="256" rx="20" ry="12" fill="#c99566"/>' +
    '<ellipse cx="165" cy="212" rx="42" ry="46" fill="#d9a77a"/><ellipse cx="165" cy="218" rx="26" ry="30" fill="#f1d3b3"/>' +
    '<ellipse cx="124" cy="204" rx="12" ry="22" transform="rotate(18 124 204)" fill="#d9a77a"/>' +
    '<ellipse cx="206" cy="204" rx="12" ry="22" transform="rotate(-18 206 204)" fill="#d9a77a"/>' +
    '<circle cx="137" cy="122" r="13" fill="#d9a77a"/><circle cx="193" cy="122" r="13" fill="#d9a77a"/>' +
    '<circle cx="137" cy="122" r="7" fill="#f1d3b3"/><circle cx="193" cy="122" r="7" fill="#f1d3b3"/>' +
    '<circle cx="165" cy="150" r="36" fill="#d9a77a"/><ellipse cx="165" cy="162" rx="15" ry="11" fill="#f1d3b3"/>' +
    '<ellipse cx="165" cy="157" rx="5" ry="3.5" fill="#5b5675"/>' +
    '<circle cx="152" cy="144" r="3.6" fill="#5b5675"/><circle cx="178" cy="144" r="3.6" fill="#5b5675"/>' +
    '<path d="M158 167Q165 173 172 167" fill="none" stroke="#5b5675" stroke-width="2.4" stroke-linecap="round"/>' +
    '</g></g>';

  function room() {
    return '<rect width="400" height="300" fill="#fdf0e0"/>' +
      '<rect y="262" width="400" height="38" fill="#ecd6c0"/><ellipse cx="165" cy="268" rx="96" ry="14" fill="#f7c9d6" opacity=".85"/>' +
      '<defs><clipPath id="um-clip"><rect x="26" y="21" width="118" height="88" rx="8"/></clipPath></defs>';
  }
  function windowArt() {
    return '<g clip-path="url(#um-clip)">' +
      '<rect id="um-sky" x="26" y="21" width="118" height="88" fill="#bfe3f7"/>' +
      '<g id="um-sun" opacity="1"><circle cx="62" cy="52" r="26" fill="#ffe9a8" opacity=".5"/><circle cx="62" cy="52" r="15" fill="#ffd96b"/>' +
      '<g stroke="#ffd96b" stroke-width="3" stroke-linecap="round">' + rays() + '</g></g>' +
      '<g id="um-cloud" opacity="0" fill="#eef2fa"><circle cx="64" cy="48" r="14"/><circle cx="82" cy="44" r="17"/><circle cx="102" cy="50" r="13"/><rect x="52" y="48" width="62" height="14" rx="7"/></g>' +
      '<rect id="um-ground" x="26" y="98" width="118" height="12" fill="#cfe8c3"/>' +
      '<g id="um-rain" opacity="0"></g><g id="um-snow" opacity="0"></g></g>' +
      '<rect x="26" y="21" width="118" height="88" rx="8" fill="none" stroke="#fff" stroke-width="6"/>' +
      '<path d="M85 21V109M26 65H144" stroke="#fff" stroke-width="4"/>' +
      '<rect x="18" y="108" width="134" height="8" rx="4" fill="#fff"/>';
  }
  function rays() {
    var s = '';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, c = Math.cos(a), n = Math.sin(a);
      s += '<line x1="' + (62 + c * 21).toFixed(1) + '" y1="' + (52 + n * 21).toFixed(1) + '" x2="' + (62 + c * 28).toFixed(1) + '" y2="' + (52 + n * 28).toFixed(1) + '"/>';
    }
    return s;
  }
  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    for (var k in attrs) { e.setAttribute(k, attrs[k]); }
    return e;
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function mix(cols, w) {
    var s = w[0] + w[1] + w[2] + 0.001, out = [0, 0, 0];
    for (var i = 0; i < 3; i++) { for (var c = 0; c < 3; c++) { out[c] += cols[i][c] * (w[i] + (i === 0 ? 0.001 : 0)); } }
    return 'rgb(' + Math.round(out[0] / s) + ',' + Math.round(out[1] / s) + ',' + Math.round(out[2] / s) + ')';
  }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'um';
    root.innerHTML = '<div class="um-board"><div class="um-bg"><svg viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      room() + windowArt() + BEAR + '</svg></div>' +
      '<button type="button" class="um-hit um-window" aria-label="Okno: zmień pogodę"></button>' +
      '<button type="button" class="um-hit um-bearbtn" aria-label="Miś (wybierz ubranie, potem miś)"></button></div>';
    container.appendChild(root);
    var board = root.querySelector('.um-board'), svg = root.querySelector('svg');
    var skyEl = svg.querySelector('#um-sky'), sunEl = svg.querySelector('#um-sun'), cloudEl = svg.querySelector('#um-cloud');
    var groundEl = svg.querySelector('#um-ground'), rainEl = svg.querySelector('#um-rain'), snowEl = svg.querySelector('#um-snow');
    var glowEl = svg.querySelector('#um-glow'), bodyEl = svg.querySelector('#um-body');
    var windowBtn = root.querySelector('.um-window'), bearBtn = root.querySelector('.um-bearbtn');

    // Weather particles: 10 rain streaks + 10 snow dots, fixed pool.
    var rain = [], snow = [], i;
    for (i = 0; i < 10; i++) {
      var r = el('line', { x1: 0, y1: 0, x2: -1.5, y2: 7, stroke: '#8ec5ea', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
      rainEl.appendChild(r); rain.push({ el: r, x: 30 + ((i * 37) % 100) * 1.08, ph: ((i * 53) % 100) / 100 });
      var s = el('circle', { cx: 0, cy: 0, r: 2.4, fill: '#fff' });
      snowEl.appendChild(s); snow.push({ el: s, x: 32 + ((i * 29) % 100) * 1.04, ph: ((i * 71) % 100) / 100 });
    }

    var k = 1, S = 56, W = 400;
    var target = 0, wts = [1, 0, 0], tt = 0;
    var pose = { dy: 0, ang: 0, glow: 0 }, react = null;
    var raf = 0, last = 0, items = [], selected = null, zTop = 10;

    ITEMS.forEach(function (def, n) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'um-item'; b.setAttribute('data-id', def.id);
      b.setAttribute('aria-label', def.label + ' (Enter lub spacja, potem wybierz misia)');
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + def.art.replace('', '') + '</svg>';
      board.appendChild(b);
      var it = { def: def, el: b, hx: HOME_X[n % 2], hy: HOME_Y[Math.floor(n / 2)], x: 0, y: 0, worn: false,
        mode: 'idle', pid: null, dx: 0, dy: 0, fx: 0, fy: 0, gt: 0, gd: 1, pending: false, skipClick: false };
      it.x = it.hx; it.y = it.hy;
      items.push(it);
      b.addEventListener('pointerdown', function (e) { down(it, e); });
      b.addEventListener('pointermove', function (e) { move(it, e); });
      b.addEventListener('pointerup', function (e) { up(it, e); });
      b.addEventListener('pointercancel', function (e) { up(it, e); });
      b.addEventListener('lostpointercapture', function (e) { up(it, e); });
      b.addEventListener('click', function () { onItemClick(it); });
    });

    function wornPos(it) {
      var a = pose.ang * Math.PI / 180, dx = it.def.wx - BX, dy = it.def.wy - PIVOT_Y;
      return [BX + dx * Math.cos(a) - dy * Math.sin(a), PIVOT_Y + dx * Math.sin(a) + dy * Math.cos(a) + pose.dy];
    }
    function place(it) {
      it.el.style.transform = 'translate(' + (it.x * k - S / 2) + 'px,' + (it.y * k - S / 2) + 'px)';
    }
    function layout() {
      var r = board.getBoundingClientRect();
      W = r.width || 400; k = W / 400;
      S = Math.max(56, 0.15 * W);
      board.style.setProperty('--um-s', S + 'px');
      items.forEach(function (it) {
        if (it.mode === 'drag') { cancelDrag(it); }
        if (it.mode === 'idle') { var p = it.worn ? wornPos(it) : [it.hx, it.hy]; it.x = p[0]; it.y = p[1]; }
        place(it);
      });
    }

    function glideTo(it, x, y) {
      var d = Math.hypot(x - it.x, y - it.y) * k;
      it.fx = it.x; it.fy = it.y; it.gt = 0;
      it.gd = reduced() ? 300 : Math.min(1200, 600 + d * 0.8);
      it.mode = 'glide';
      it.el.style.zIndex = '50';
      start();
    }
    function wear(it) {
      // The two hats share one spot on the head, so wearing one returns the other to its shelf.
      items.forEach(function (o) {
        if (o !== it && o.worn && o.def.wy === it.def.wy && o.def.wx === it.def.wx) { takeOff(o); }
      });
      it.worn = true; it.el.classList.add('um-worn'); it.pending = true; it.z = zTop++; select(null);
      var p = wornPos(it);
      glideTo(it, p[0], p[1]);
    }
    function takeOff(it) {
      it.worn = false; it.el.classList.remove('um-worn'); it.pending = false; select(null);
      glideTo(it, it.hx, it.hy);
    }
    function startReaction(type) {
      react = { type: type, t: 0 };
      start();
    }
    function arrived(it) {
      if (it.worn && it.pending) {
        it.pending = false;
        startReaction(it.def.fits === target ? 'happy' : 'neutral');
      }
    }

    function cancelDrag(it) {
      if (it.pid !== null) { try { it.el.releasePointerCapture(it.pid); } catch (e) { /* already released */ } }
      it.pid = null; it.mode = 'idle'; glideTo(it, it.hx, it.hy);
    }
    function down(it, e) {
      it.skipClick = false;
      if (it.worn || it.pid !== null || (e.button !== undefined && e.button > 0)) { return; }
      var r = board.getBoundingClientRect();
      it.pid = e.pointerId; it.mode = 'drag';
      it.dx = it.x - (e.clientX - r.left) / k; it.dy = it.y - (e.clientY - r.top) / k;
      it.el.style.zIndex = '50';
      try { it.el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      e.preventDefault();
    }
    function move(it, e) {
      if (it.mode !== 'drag' || e.pointerId !== it.pid) { return; }
      var r = board.getBoundingClientRect();
      var px = (e.clientX - r.left) / k + it.dx, py = (e.clientY - r.top) / k + it.dy;
      // Keep the item centre inside the visible screen so it can never be lost off-screen.
      var h = S / 2;
      var minX = (-r.left + h) / k, maxX = (window.innerWidth - r.left - h) / k;
      var minY = (-r.top + h) / k, maxY = (window.innerHeight - r.top - h) / k;
      it.x = Math.max(minX, Math.min(maxX, px)); it.y = Math.max(minY, Math.min(maxY, py));
      place(it);
    }
    function overBear(it) {
      var m = 18;
      return it.x > BEAR_RECT.x0 - m && it.x < BEAR_RECT.x1 + m && it.y > BEAR_RECT.y0 - m && it.y < BEAR_RECT.y1 + m;
    }
    function up(it, e) {
      if (it.mode !== 'drag' || e.pointerId !== it.pid) { return; }
      try { it.el.releasePointerCapture(it.pid); } catch (err) { /* already released */ }
      it.pid = null; it.mode = 'idle'; it.skipClick = true;
      setTimeout(function () { it.skipClick = false; }, 60);
      if (overBear(it)) { wear(it); } else { glideTo(it, it.hx, it.hy); }
    }
    function onItemClick(it) {
      if (it.skipClick) { it.skipClick = false; return; }
      if (it.worn) { takeOff(it); return; }
      if (it.mode === 'idle' || it.mode === 'glide') { select(it); }
    }
    function select(it) {
      selected = it && selected !== it && !it.worn ? it : null;
      items.forEach(function (o) {
        var on = o === selected;
        o.el.setAttribute('aria-pressed', on ? 'true' : 'false');
        o.el.classList.toggle('um-selected', on);
      });
    }
    bearBtn.addEventListener('click', function () {
      if (!selected || selected.mode === 'drag') { return; }
      wear(selected);
    });
    windowBtn.addEventListener('click', function () { target = (target + 1) % 3; start(); });

    function paintWeather() {
      var v = [smooth(wts[0]), smooth(wts[1]), smooth(wts[2])];
      skyEl.setAttribute('fill', mix(SKY, v));
      groundEl.setAttribute('fill', mix(GROUND, v));
      sunEl.setAttribute('opacity', v[0].toFixed(3));
      cloudEl.setAttribute('opacity', Math.max(v[1], v[2] * 0.85).toFixed(3));
      rainEl.setAttribute('opacity', v[1].toFixed(3));
      snowEl.setAttribute('opacity', v[2].toFixed(3));
    }
    function paintParticles(still) {
      var t = still ? 0 : tt, i, p, y;
      for (i = 0; i < 10; i++) {
        p = rain[i]; y = 24 + (((p.ph + t * 0.45) % 1) * 78);
        p.el.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ',' + y.toFixed(1) + ')');
        p = snow[i]; y = 24 + (((p.ph + t * 0.14) % 1) * 78);
        p.el.setAttribute('transform', 'translate(' + (p.x + 3 * Math.sin(t * 1.2 + i)).toFixed(1) + ',' + y.toFixed(1) + ')');
      }
    }
    function paintBear() {
      bodyEl.setAttribute('transform', 'translate(0,' + pose.dy.toFixed(2) + ') rotate(' + pose.ang.toFixed(2) + ' ' + BX + ' ' + PIVOT_Y + ')');
      glowEl.setAttribute('opacity', (pose.glow * 0.6).toFixed(3));
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(now - last, 50); last = now;
      var busy = false, still = reduced(), j;

      // Weather: each layer eases to its target weight in WEATHER_S seconds (a soft fade; JS-driven so it works under reduced motion).
      var step = dt / 1000 / WEATHER_S;
      for (j = 0; j < 3; j++) {
        var tg = j === target ? 1 : 0;
        if (wts[j] < tg) { wts[j] = Math.min(tg, wts[j] + step); busy = true; }
        else if (wts[j] > tg) { wts[j] = Math.max(tg, wts[j] - step); busy = true; }
      }
      if (!still && (wts[1] > 0.01 || wts[2] > 0.01)) { tt += dt / 1000; busy = true; }
      paintWeather(); paintParticles(still);

      // Bear reaction.
      if (react) {
        react.t += dt;
        var dur = react.type === 'happy' ? HAPPY_MS : NEUTRAL_MS;
        if (react.t >= dur) { react = null; pose.dy = 0; pose.ang = 0; pose.glow = 0; }
        else {
          busy = true;
          if (react.type === 'happy') {
            pose.glow = Math.sin(Math.PI * react.t / dur);
            pose.dy = still ? 0 : -6 * Math.abs(Math.sin(Math.PI * react.t / (dur / 2)));
            pose.ang = 0;
          } else {
            pose.glow = 0; pose.dy = 0;
            pose.ang = still ? 0 : 5 * Math.sin(2 * Math.PI * react.t / dur);
          }
        }
      }
      paintBear();

      items.forEach(function (it) {
        if (it.mode === 'glide') {
          it.gt += dt;
          var tx = it.worn ? wornPos(it)[0] : it.hx, ty = it.worn ? wornPos(it)[1] : it.hy;
          var q = smooth(it.gt / it.gd);
          it.x = it.fx + (tx - it.fx) * q; it.y = it.fy + (ty - it.fy) * q;
          if (it.gt >= it.gd) { it.mode = 'idle'; it.x = tx; it.y = ty; it.el.style.zIndex = it.worn ? String(it.z) : ''; arrived(it); }
          else { busy = true; }
        } else if (it.mode === 'idle' && it.worn) {
          var p = wornPos(it); it.x = p[0]; it.y = p[1];
        }
        place(it);
      });
      if (busy) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }
    function onResize() { layout(); start(); }

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    layout(); paintWeather(); paintParticles(true); paintBear();

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'ubierz-misia') { a.mount = mount; } });
})();
