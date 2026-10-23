// Activity "Policz Razem": 3-5 friendly objects of one kind (apples, ducks, flowers, fish; 3, 4, 5, 2 and so on).
// Touching an object bounces it once and adds a dot to the counting row; the numeral crossfades to the new count.
// A touched object can only bounce again. When all are counted the group glows ~2s, ~4s later the scene crossfades
// to the next one. One rAF loop (capped dt, stops when idle or hidden) drives everything, so it works under
// prefers-reduced-motion. Nothing is stored. Fixed DOM per scene: <= 5 buttons, 5 slots, 5 dots, 2 numerals.
(function () {
  var MAXDT = 0.05, BOUNCE = 0.7, DOT = 0.4, NUM = 0.5, GLOW = 2, WAIT = 4, FADE = 0.9;
  var COUNTS = [3, 4, 5, 2];
  var GLOWC = '<circle class="pr-glow" cx="50" cy="52" r="50" fill="#fff3b8" opacity="0"/>';
  var KINDS = [
    { label: 'Jabłko', svg: '<ellipse cx="50" cy="94" rx="26" ry="4" fill="#000" opacity=".06"/><path d="M50 30q0-14 8-18" fill="none" stroke="#9c8268" stroke-width="4" stroke-linecap="round"/><path d="M52 22q14-8 22 0q-10 10-22 0z" fill="#a8dba0"/><path d="M50 32c-10-8-32-4-32 22c0 22 16 38 32 34c16 4 32-12 32-34c0-26-22-30-32-22z" fill="#c4e8a0" stroke="#a9d283" stroke-width="2"/><path d="M30 52a14 14 0 0 1 8-12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>' },
    { label: 'Kaczuszka', svg: '<ellipse cx="50" cy="90" rx="38" ry="7" fill="#bfe3f5"/><ellipse cx="46" cy="66" rx="30" ry="20" fill="#ffe08a" stroke="#f3cd66" stroke-width="2"/><path d="M26 64q10 14 28 4" fill="none" stroke="#f3cd66" stroke-width="3" stroke-linecap="round"/><circle cx="64" cy="38" r="17" fill="#ffe08a" stroke="#f3cd66" stroke-width="2"/><path d="M78 40l14 4-14 6z" fill="#f9b872"/><circle cx="68" cy="34" r="2.6" fill="#4a4560"/>' },
    { label: 'Kwiatek', svg: '<path d="M50 52v40" stroke="#8fcf9f" stroke-width="5" stroke-linecap="round"/><path d="M50 78q16-12 24-2q-14 8-24 2z" fill="#a8dba0"/><g fill="#f7b6d2"><circle cx="50" cy="22" r="14"/><circle cx="74" cy="40" r="14"/><circle cx="66" cy="66" r="0"/><circle cx="26" cy="40" r="14"/><circle cx="36" cy="62" r="0"/></g><g fill="#f7b6d2"><circle cx="64" cy="58" r="13"/><circle cx="36" cy="58" r="13"/></g><circle cx="50" cy="44" r="12" fill="#ffe9a8"/>' },
    { label: 'Rybka', svg: '<ellipse cx="46" cy="52" rx="32" ry="22" fill="#a8d8f0" stroke="#8cc4e2" stroke-width="2"/><path d="M74 52l20-18v36z" fill="#a8d8f0" stroke="#8cc4e2" stroke-width="2" stroke-linejoin="round"/><path d="M40 34q8-12 18-4" fill="#8cc4e2"/><circle cx="30" cy="46" r="3" fill="#4a4560"/><path d="M26 58q5 4 10 0" fill="none" stroke="#4a4560" stroke-width="2" stroke-linecap="round"/>' }
  ];
  // [left, top] in % of the 4:3 board; every object is 21% wide (square)
  var POS = {
    2: [[20, 22], [59, 22]],
    3: [[8, 22], [39, 22], [70, 22]],
    4: [[18, 6], [61, 6], [18, 38], [61, 38]],
    5: [[8, 6], [39, 6], [70, 6], [23, 38], [54, 38]]
  };
  var BACKDROP = '<svg viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<rect width="400" height="300" fill="#e8f4fb"/><circle cx="352" cy="40" r="22" fill="#fff0c4"/>' +
    '<ellipse cx="100" cy="210" rx="220" ry="80" fill="#d3ebc8"/><ellipse cx="330" cy="225" rx="200" ry="70" fill="#c3e3b8"/>' +
    '<rect y="226" width="400" height="74" fill="#f3eefb"/></svg>';

  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'pr';
    root.innerHTML = '<div class="pr-board">' + BACKDROP + '<div class="pr-layer"></div></div>';
    container.appendChild(root);
    var layer = root.querySelector('.pr-layer');

    var si = 0, phase = 'play', pt = 0, fade = 1, count = 0, shown = 0, prevShown = 0, numT = 1;
    var objs = [], dots = [], glow = 0, numCur, numPrev;

    function build() {
      var kind = KINDS[si % KINDS.length], n = COUNTS[si % COUNTS.length], i;
      layer.innerHTML = '';
      var ov = '<svg class="pr-row" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">';
      for (i = 0; i < 5; i++) { ov += '<circle cx="' + (40 + i * 40) + '" cy="262" r="16" fill="#fff" stroke="#d9d0ee" stroke-width="3"/>'; }
      for (i = 0; i < 5; i++) { ov += '<circle class="pr-dot" cx="' + (40 + i * 40) + '" cy="262" r="12" fill="#f7a8c9" opacity="0" transform-origin="' + (40 + i * 40) + 'px 262px"/>'; }
      ov += '<text class="pr-num" x="340" y="276" text-anchor="middle" font-size="96" font-weight="700" fill="#7d6fc0" opacity="0"></text>' +
        '<text class="pr-num" x="340" y="276" text-anchor="middle" font-size="96" font-weight="700" fill="#7d6fc0" opacity="0"></text></svg>';
      layer.innerHTML = ov;
      var row = layer.firstChild, nums = row.querySelectorAll('.pr-num');
      numCur = nums[0]; numPrev = nums[1];
      numCur.style.transformOrigin = '340px 245px'; numPrev.style.transformOrigin = '340px 245px';
      dots = [];
      var dEls = row.querySelectorAll('.pr-dot');
      for (i = 0; i < 5; i++) { dots.push({ el: dEls[i], t: 1, on: false }); }
      objs = [];
      POS[n].forEach(function (p, k) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'pr-btn'; b.setAttribute('aria-label', kind.label + ' ' + (k + 1));
        b.style.left = p[0] + '%'; b.style.top = p[1] + '%';
        b.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + GLOWC + '<g class="pr-fig">' + kind.svg + '</g></svg>';
        layer.appendChild(b);
        var o = { el: b, fig: b.querySelector('.pr-fig'), gl: b.querySelector('.pr-glow'), counted: false, t: -1 };
        o.fig.style.transformOrigin = '50px 92px';
        b.addEventListener('click', function () { touch(o); });
        objs.push(o);
      });
      count = 0; shown = 0; prevShown = 0; numT = 1; glow = 0;
    }

    function touch(o) {
      if (phase !== 'play') { return; }
      o.t = 0;
      if (!o.counted) {
        o.counted = true;
        prevShown = shown; count++; shown = count; numT = 0;
        dots[count - 1].on = true; dots[count - 1].t = 0;
        if (count === objs.length) { phase = 'glow'; pt = 0; }
      }
      wake();
    }

    var raf = 0, last = 0;
    function frame(now) {
      raf = 0;
      var dt = last ? Math.min((now - last) / 1000, MAXDT) : 0;
      last = now;
      var busy = phase !== 'play', i, o;
      if (phase === 'glow' || phase === 'wait') {
        pt += dt;
        if (phase === 'glow') {
          glow = pt < 0.5 ? smooth(pt / 0.5) : pt > GLOW - 0.5 ? smooth((GLOW - pt) / 0.5) : 1;
          if (pt >= GLOW) { phase = 'wait'; pt = 0; glow = 0; }
        } else if (pt >= WAIT) { phase = 'out'; pt = 0; }
      } else if (phase === 'out') {
        pt += dt; fade = 1 - smooth(pt / FADE);
        if (pt >= FADE) { si++; build(); fade = 0; phase = 'in'; pt = 0; }
      } else if (phase === 'in') {
        pt += dt; fade = smooth(pt / FADE);
        if (pt >= FADE) { fade = 1; phase = 'play'; busy = false; }
      }
      layer.style.opacity = fade;
      for (i = 0; i < objs.length; i++) {
        o = objs[i];
        var y = 0, sx = 1, sy = 1;
        if (o.t >= 0) {
          o.t += dt; busy = true;
          if (o.t >= BOUNCE) { o.t = -1; } else {
            var p = o.t / BOUNCE, h = Math.sin(Math.PI * p);
            y = -14 * h; sy = 1 + 0.06 * h; sx = 1 - 0.04 * h;
          }
        }
        o.fig.style.transform = 'translateY(' + y + 'px) scale(' + sx + ',' + sy + ')';
        o.gl.setAttribute('opacity', glow * 0.9);
      }
      for (i = 0; i < dots.length; i++) {
        var d = dots[i];
        if (d.on && d.t < 1) { d.t = Math.min(1, d.t + dt / DOT); busy = true; }
        var s = d.on ? 0.4 + 0.6 * smooth(d.t) : 0.4;
        d.el.setAttribute('opacity', d.on ? smooth(d.t) : 0);
        d.el.style.transform = 'scale(' + s + ')';
      }
      if (numT < 1) { numT = Math.min(1, numT + dt / NUM); busy = true; }
      var k = smooth(numT);
      numCur.textContent = shown ? String(shown) : '';
      numPrev.textContent = prevShown ? String(prevShown) : '';
      numCur.setAttribute('opacity', shown ? k : 0);
      numPrev.setAttribute('opacity', prevShown ? 1 - k : 0);
      numCur.style.transform = 'scale(' + (0.75 + 0.25 * k) + ')';
      if (busy && !document.hidden) { raf = requestAnimationFrame(frame); } else { last = 0; }
    }
    function wake() { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } last = 0; }
      else { wake(); }
    }
    document.addEventListener('visibilitychange', onVis);
    build();
    wake();

    return function cleanup() {
      document.removeEventListener('visibilitychange', onVis);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  var list = window.ACTIVITIES || [];
  for (var i = 0; i < list.length; i++) { if (list[i].id === 'policz-razem') { list[i].mount = mount; } }
})();
