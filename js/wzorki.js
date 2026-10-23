// Activity "Wzorki": a string of 4 beads in a simple repeating pattern and an empty slot; two big choices below.
// The correct bead glides into the slot with a soft glow; the other one only wobbles gently and stays available.
// After 3 correct beads (7 on the string) the whole string glows ~2s, ~4s later a new pattern cross-fades in.
// Beads differ by shape and inner mark as well as colour. One rAF loop (capped dt, stops when idle or hidden)
// drives everything, so it works under prefers-reduced-motion. Nothing is stored. Fixed DOM: 7 beads, 2 choices.
(function () {
  var MAXDT = 0.05, GLIDE = 0.8, GLOW = 2, WAIT = 4, FADE = 0.9, WOB = 0.55, N = 7, GIVEN = 4;
  var NS = 'http://www.w3.org/2000/svg';
  var STAR = (function () {
    var p = [], i, a, r;
    for (i = 0; i < 10; i++) { a = -Math.PI / 2 + i * Math.PI / 5; r = i % 2 ? 19 : 42; p.push((50 + r * Math.cos(a)).toFixed(1) + ',' + (50 + r * Math.sin(a)).toFixed(1)); }
    return p.join(' ');
  })();
  // shape + inner mark + colour, so beads are told apart without colour
  var TYPES = [
    { label: 'Różowe kółko', svg: '<circle cx="50" cy="50" r="40" fill="#f7a8c9" stroke="#e68fb4" stroke-width="3"/><circle cx="50" cy="50" r="11" fill="#fff" opacity=".85"/>' },
    { label: 'Niebieski kwadrat', svg: '<rect x="12" y="12" width="76" height="76" rx="16" fill="#a8d8f0" stroke="#8cc4e2" stroke-width="3"/><path d="M26 40h48M26 60h48" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".85"/>' },
    { label: 'Żółta gwiazdka', svg: '<polygon points="' + STAR + '" fill="#ffd98a" stroke="#f3c26a" stroke-width="3" stroke-linejoin="round"/>' },
    { label: 'Zielony romb', svg: '<path d="M50 8L92 50L50 92L8 50z" fill="#9ed8c6" stroke="#7dc4ae" stroke-width="3" stroke-linejoin="round"/><path d="M50 32L68 50L50 68L32 50z" fill="#fff" opacity=".8"/>' }
  ];
  // symbols of the repeating pattern: A B A B, A A B A A B, A B C A B C, A B B A B B
  var PATTERNS = [[0, 1], [0, 0, 1], [0, 1, 2], [0, 1, 1]];

  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name), k;
    for (k in attrs) { e.setAttribute(k, attrs[k]); }
    if (parent) { parent.appendChild(e); }
    return e;
  }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'wz';
    root.innerHTML = '<div class="wz-field"><svg class="wz-svg" aria-hidden="true" focusable="false"></svg>' +
      '<button type="button" class="wz-btn"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"></svg></button>' +
      '<button type="button" class="wz-btn"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"></svg></button></div>';
    container.appendChild(root);
    var field = root.firstChild, svg = field.firstChild, btns = [field.children[1], field.children[2]];

    var lines = [el('polyline', { fill: 'none', stroke: '#d9d0ee', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg),
      el('polyline', { fill: 'none', stroke: '#d9d0ee', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg)];
    var ring = el('circle', { fill: '#fff', 'fill-opacity': '.6', stroke: '#c9bde8', 'stroke-width': 3, 'stroke-dasharray': '6 7' }, svg);
    var beads = [], i;
    for (i = 0; i < N; i++) {
      var g = el('g', { opacity: 0 }, svg);
      var gl = el('circle', { cx: 50, cy: 50, r: 52, fill: '#fff3b8', opacity: 0 }, g);
      var body = el('g', {}, g);
      beads.push({ g: g, gl: gl, body: body, glow: 0 });
    }

    var round = 0, seq = [], correct = 0, other = 0, side = 0, lastSides = [];
    var filled = GIVEN, phase = 'in', pt = 0, fade = 0, allGlow = 0, cf = 1, cfOn = false;
    var wob = [-1, -1], glide = null, lay = null, shown = [-1, -1], shownB = [];

    function paintBody(b, type) { b.body.innerHTML = TYPES[type].svg; }

    function chooseSide() {
      var s = Math.random() < 0.5 ? 0 : 1, n = lastSides.length;
      if (n >= 2 && lastSides[n - 1] === lastSides[n - 2]) { s = 1 - lastSides[n - 1]; }
      lastSides.push(s); if (lastSides.length > 3) { lastSides.shift(); }
      return s;
    }
    function newChoices() {
      var t = seq[filled];
      correct = t;
      other = (t + 1 + Math.floor(Math.random() * 3)) % 4;
      side = chooseSide();
      var types = [0, 0];
      types[side] = correct; types[1 - side] = other;
      for (var k = 0; k < 2; k++) {
        btns[k].querySelector('svg').innerHTML = TYPES[types[k]].svg;
        btns[k].setAttribute('aria-label', TYPES[types[k]].label);
        btns[k].dataset.type = types[k];
      }
      wob[0] = wob[1] = -1; cf = 0; cfOn = true;
    }
    function build() {
      var pat = PATTERNS[round % PATTERNS.length], k;
      seq = [];
      for (k = 0; k < N; k++) { seq.push((pat[k % pat.length] + round) % 4); }
      filled = GIVEN; glide = null; allGlow = 0;
      for (k = 0; k < N; k++) { beads[k].glow = 0; paintBody(beads[k], seq[k]); }
      newChoices();
      btns[0].disabled = btns[1].disabled = false;
    }

    function layout() {
      var W = field.clientWidth, H = field.clientHeight, S, single, cs;
      if (!W || !H) { return; }
      cs = Math.max(56, Math.min(H * 0.26, W * 0.3, 132));
      var topH = H - cs - 40;
      var S1 = Math.min((W - 24) / 7.6, topH * 0.6, 110);
      single = S1 >= 62;
      S = single ? S1 : Math.max(56, Math.min((W - 24) / 4.5, (topH - 8) / 2.5, 110));
      var pos = [], rows = single ? 1 : 2, gap = S * 1.1;
      var blockH = rows === 1 ? S : S * 2.15, y0 = Math.max(S / 2 + 4, (topH - blockH) / 2 + S / 2), k;
      for (k = 0; k < N; k++) {
        if (single) { pos.push([W / 2 + (k - 3) * gap, y0]); }
        else if (k < 4) { pos.push([W / 2 + (k - 1.5) * gap, y0]); }
        else { pos.push([W / 2 + (k - 5) * gap, y0 + S * 1.15]); }
      }
      var cy = H - cs / 2 - 14, off = cs * 0.78;
      lay = { W: W, H: H, S: S, single: single, pos: pos, cs: cs, cpos: [[W / 2 - off, cy], [W / 2 + off, cy]] };
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var pts = function (a, b) { var s = []; for (var q = a; q <= b; q++) { s.push(pos[q][0].toFixed(1) + ',' + pos[q][1].toFixed(1)); } return s.join(' '); };
      lines[0].setAttribute('points', single ? pts(0, N - 1) : pts(0, 3));
      lines[1].setAttribute('points', single ? '' : pts(4, N - 1));
      ring.setAttribute('r', S * 0.4);
      for (k = 0; k < 2; k++) {
        btns[k].style.width = btns[k].style.height = cs + 'px';
        btns[k].style.left = (lay.cpos[k][0] - cs / 2) + 'px';
        btns[k].style.top = (lay.cpos[k][1] - cs / 2) + 'px';
      }
    }

    function render() {
      if (!lay) { return; }
      var k, S = lay.S, sc = S / 100 * 0.9;
      field.style.opacity = fade;
      for (k = 0; k < N; k++) {
        var b = beads[k], x = lay.pos[k][0], y = lay.pos[k][1], vis = k < filled ? 1 : 0, gs = 1;
        if (glide && glide.idx === k) {
          var p = smooth(glide.t / GLIDE), c = lay.cpos[side];
          x = c[0] + (x - c[0]) * p; y = c[1] + (y - c[1]) * p - Math.sin(Math.PI * p) * S * 0.25;
          gs = (lay.cs / S) + (1 - lay.cs / S) * p; vis = 1;
        }
        b.g.setAttribute('opacity', vis);
        b.g.setAttribute('transform', 'translate(' + (x - 50 * sc * gs).toFixed(1) + ',' + (y - 50 * sc * gs).toFixed(1) + ') scale(' + (sc * gs).toFixed(3) + ')');
        b.gl.setAttribute('opacity', (Math.min(1, b.glow + allGlow) * 0.9).toFixed(3));
      }
      if (filled < N) {
        ring.setAttribute('cx', lay.pos[filled][0]); ring.setAttribute('cy', lay.pos[filled][1]);
        ring.setAttribute('opacity', glide ? 0 : 1);
      } else { ring.setAttribute('opacity', 0); }
      var show = (phase === 'play' || phase === 'glide') && cfOn ? smooth(cf) : 0;
      for (k = 0; k < 2; k++) {
        var w = wob[k] >= 0 ? Math.sin(wob[k] / WOB * Math.PI * 4) * (1 - wob[k] / WOB) * 9 : 0;
        btns[k].style.opacity = show;
        btns[k].style.visibility = show > 0 ? 'visible' : 'hidden';
        btns[k].style.transform = 'rotate(' + w.toFixed(2) + 'deg)';
      }
    }

    function onChoice(k) {
      if (phase !== 'play' || cf < 1 || btns[k].disabled) { return; }
      if (Number(btns[k].dataset.type) === correct && k === side) {
        phase = 'glide'; glide = { idx: filled, t: 0 };
      } else if (wob[k] < 0) { wob[k] = 0; }
      wake();
    }
    btns[0].addEventListener('click', function () { onChoice(0); });
    btns[1].addEventListener('click', function () { onChoice(1); });

    var raf = 0, last = 0;
    function frame(now) {
      raf = 0;
      var dt = last ? Math.min((now - last) / 1000, MAXDT) : 0, k, busy = false;
      last = now;
      for (k = 0; k < N; k++) { if (beads[k].glow > 0) { beads[k].glow = Math.max(0, beads[k].glow - dt / 1.4); busy = true; } }
      for (k = 0; k < 2; k++) { if (wob[k] >= 0) { wob[k] += dt; busy = true; if (wob[k] >= WOB) { wob[k] = -1; } } }
      if (cfOn && cf < 1) { cf = Math.min(1, cf + dt / 0.5); busy = true; }
      if (phase === 'glide') {
        glide.t += dt; busy = true;
        if (glide.t >= GLIDE) {
          beads[glide.idx].glow = 1; filled++; glide = null;
          if (filled >= N) {
            phase = 'glow'; pt = 0; btns[0].disabled = btns[1].disabled = true;
          } else { phase = 'play'; newChoices(); }
        }
      } else if (phase === 'glow' || phase === 'wait') {
        pt += dt; busy = true;
        if (phase === 'glow') {
          allGlow = pt < 0.5 ? smooth(pt / 0.5) : pt > GLOW - 0.5 ? smooth((GLOW - pt) / 0.5) : 1;
          if (pt >= GLOW) { phase = 'wait'; pt = 0; allGlow = 0; }
        } else if (pt >= WAIT) { phase = 'out'; pt = 0; }
      } else if (phase === 'out') {
        pt += dt; busy = true; fade = 1 - smooth(pt / FADE);
        if (pt >= FADE) { round++; build(); fade = 0; phase = 'in'; pt = 0; }
      } else if (phase === 'in') {
        pt += dt; busy = true; fade = smooth(pt / FADE);
        if (pt >= FADE) { fade = 1; phase = 'play'; }
      }
      render();
      if (busy && !document.hidden) { raf = requestAnimationFrame(frame); } else { last = 0; }
    }
    function wake() { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } last = 0; } else { wake(); }
    }
    function onResize() { layout(); render(); }
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    build();
    layout();
    render();
    wake();

    return function cleanup() {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  var list = window.ACTIVITIES || [];
  for (var i = 0; i < list.length; i++) { if (list[i].id === 'wzorki') { list[i].mount = mount; } }
})();
