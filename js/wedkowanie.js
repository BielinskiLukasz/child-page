// Activity "Wędkowanie": an animal fisher on a jetty, a pond with slowly swimming fish and toys and a bucket. Holding a finger anywhere on the
// pond lowers the hook (25% of the pond depth per second, at most 90%), releasing pulls it up at the same speed. While the hook is down any
// swimmer within 56 px latches on. Every pull-up brings exactly one catch (fish, boot, star or bottle): if nothing latched, the nearest
// allowed swimmer is drawn to the hook, so a pull-up never comes up empty. The catch swings on the hook and is put into the bucket in 1.5 s.
// The same kind never appears three times in a row (a kind that was caught twice is skipped by the hook and by the pull). Swimmers move at
// most 15% of the screen width per second and are replaced by random new ones at the edges. After five catches the fisher hops, the bucket
// glows for 3 s and a new random pond fills. Keyboard: Enter/Space held lowers the hook, released raises it.
// One capped-dt rAF loop (final states are set from JS, never only in a CSS keyframe), paused while hidden (swimmers always move, so it runs while visible).
// Nothing is scored or stored. Usage metrics: track('interaction', {variant: catch kind}) per lowering; complete() per five-catch set.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var HOOK_SPEED = 0.25, HOOK_MAX = 0.9;   // pond depths per second, maximum depth
  var LATCH_PX = 56, MAX_SPEED = 0.15;     // latch radius, max swim speed (screen widths per second)
  var STORE_S = 1.5, SET_SIZE = 5, GLOW_S = 3, HOP_S = 0.8, FADE_S = 0.6;
  var NSWIM = 6;
  var KINDS = ['fish', 'boot', 'star', 'bottle'];
  var ANIMALS = ['bear', 'rabbit', 'cat', 'dog'];
  var FISH_COLORS = ['#f7a76b', '#8fc7f0', '#f29bbd', '#9bd6a0'];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag), k;
    for (k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) { n.setAttribute(k, attrs[k]); } }
    if (parent) { parent.appendChild(n); }
    return n;
  }

  // Pictures are drawn in a 60 x 60 box centred on 0,0 and facing right.
  function drawKind(kind, color) {
    if (kind === 'fish') {
      return '<path d="M-18 0L-30 -11L-30 11Z" fill="' + color + '"/><ellipse cx="0" cy="0" rx="22" ry="14" fill="' + color + '"/>' +
        '<path d="M-4 -12Q4 -22 10 -12Z" fill="#fff" fill-opacity=".55"/><circle cx="12" cy="-3" r="3" fill="#fff"/><circle cx="13" cy="-3" r="1.6" fill="#5b5675"/>' +
        '<path d="M20 4Q23 6 20 8" fill="none" stroke="#5b5675" stroke-width="1.5" stroke-linecap="round"/>';
    }
    if (kind === 'boot') {
      return '<path d="M-14 -26H6V2L24 8Q28 10 28 16V22H-14Z" fill="#a8683f" stroke="#7a4a2b" stroke-width="2" stroke-linejoin="round"/>' +
        '<rect x="-14" y="-26" width="20" height="7" fill="#c58d62"/><rect x="-14" y="17" width="42" height="6" rx="2" fill="#5b5675"/>';
    }
    if (kind === 'star') {
      return '<path d="M0 -28L8 -9L28 -8L12 5L18 25L0 14L-18 25L-12 5L-28 -8L-8 -9Z" fill="#ffd54a" stroke="#e0a800" stroke-width="2" stroke-linejoin="round"/>';
    }
    return '<rect x="-7" y="-28" width="14" height="9" rx="2" fill="#c9a067"/><path d="M-7 -19H7L7 -14Q18 -8 18 4V22Q18 28 12 28H-12Q-18 28 -18 22V4Q-18 -8 -7 -14Z" fill="#cfeedd" fill-opacity=".85" stroke="#7fb89a" stroke-width="2"/>' +
      '<path d="M0 18C-9 11 -9 4 -4 4Q0 4 0 9Q0 4 4 4C9 4 9 11 0 18Z" fill="#f2879f"/>';
  }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'wd';
    var svg = el('svg', { 'class': 'wd-svg', 'aria-hidden': 'true', preserveAspectRatio: 'none' }, root);
    var gBack = el('g', {}, svg), gSwim = el('g', {}, svg), gPier = el('g', {}, svg), gLine = el('g', {}, svg), gCatch = el('g', {}, svg);
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'wd-rod';
    btn.setAttribute('aria-label', 'Wędka. Przytrzymaj Enter lub spację, żeby opuścić haczyk, puść, żeby go podciągnąć.');
    root.appendChild(btn);
    container.appendChild(root);

    var skyR = el('rect', { fill: '#cfeaf8' }, gBack), sunC = el('circle', { fill: '#ffe27a' }, gBack);
    var cloud = el('ellipse', { fill: '#fff' }, gBack), waterR = el('rect', { fill: '#7cc4e8' }, gBack);
    var deepR = el('rect', { fill: '#5aa9d6', 'fill-opacity': '0.55' }, gBack), waveP = el('path', { fill: 'none', stroke: '#fff', 'stroke-opacity': '.7' }, gBack);
    var pier = el('g', {}, gPier), fisher = el('g', {}, gPier), glowR = el('ellipse', { fill: '#fff6b0', opacity: 0 }, gPier);
    var bucketG = el('g', {}, gPier), bucketFill = el('g', {}, bucketG);
    var rodL = el('line', { stroke: '#8d6847', 'stroke-linecap': 'round' }, gLine);
    var lineL = el('line', { stroke: '#fff', 'stroke-opacity': '.9', 'stroke-linecap': 'round' }, gLine);
    var hookN = el('path', { fill: 'none', stroke: '#5b5675', 'stroke-linecap': 'round' }, gLine);
    var animal = window.Animals ? window.Animals.byId(ANIMALS[Math.floor(Math.random() * ANIMALS.length)]) : null;

    var W = 320, H = 568, u = 52, f = 52, waterTop = 200, pondH = 300;
    var hx = 180, rodX = 130, rodY = 100, deckY = 200, bx = 40, by = 200, fx = 100;
    var hook = { d: 0, press: false, pullT: 0 };
    var swimmers = [], flying = [], latched = null, history = [];
    var st = { count: 0, glowT: -1, hopT: -1, bucketItems: [], sway: 0, swayT: 0, t: 0, refill: 0 };
    var alive = true, raf = 0, last = 0, ptr = null, keyDown = false;

    function banned() {
      var n = history.length;
      return (n >= 2 && history[n - 1] === history[n - 2]) ? history[n - 1] : '';
    }
    function pickKind() { return KINDS[Math.floor(Math.random() * KINDS.length)]; }
    function newSwimmer(edge) {
      var kind = pickKind();
      var sp = rnd(0.05, 0.12) * W;
      var s = { kind: kind, color: FISH_COLORS[Math.floor(Math.random() * 4)], dir: Math.random() < 0.5 ? 1 : -1, speed: sp,
        lane: rnd(0.1, 0.92), x: 0, y: 0, alpha: 0, fade: 1, rot: 0, g: el('g', {}, gSwim), att: 0 };
      s.g.innerHTML = drawKind(kind, s.color);
      s.x = edge ? (s.dir > 0 ? -u : W + u) : rnd(0.05, 0.95) * W;
      s.y = waterTop + s.lane * pondH;
      return s;
    }
    function ensureVariety() {
      // at least three different kinds so the skipped kind never empties the pond
      var seen = {}, n = 0;
      swimmers.forEach(function (s) { if (!seen[s.kind]) { seen[s.kind] = 1; n++; } });
      var i = 0;
      while (n < 3 && i < swimmers.length) {
        var s = swimmers[i++];
        if (s.fade < 0) { continue; }
        for (var k = 0; k < KINDS.length; k++) { if (!seen[KINDS[k]]) { setKind(s, KINDS[k]); seen[KINDS[k]] = 1; n++; break; } }
      }
    }
    function setKind(s, kind) { s.kind = kind; s.g.innerHTML = drawKind(kind, s.color); }
    function fillPond() {
      swimmers.forEach(function (s) { if (s.g.parentNode) { s.g.parentNode.removeChild(s.g); } });
      swimmers = [];
      for (var i = 0; i < NSWIM; i++) { var s = newSwimmer(false); s.lane = 0.1 + 0.8 * (i + Math.random() * 0.8) / NSWIM; s.y = waterTop + s.lane * pondH; swimmers.push(s); }
      ensureVariety();
    }

    function layout() {
      var r = root.getBoundingClientRect();
      W = Math.max(280, r.width); H = Math.max(240, r.height);
      var sc = Math.min(W, H * 1.4);
      u = clamp(0.12 * sc, 44, 62); f = clamp(0.14 * sc, 50, 84);
      waterTop = H * 0.4; pondH = H - waterTop - 6;
      deckY = waterTop - 0.03 * f;
      bx = f * 0.7 + 8; fx = bx + f * 1.3; hx = fx + f * 1.5;
      rodX = fx + f * 0.25; rodY = deckY - f * 1.35;
      by = deckY;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      skyR.setAttribute('width', W); skyR.setAttribute('height', H);
      sunC.setAttribute('cx', W * 0.86); sunC.setAttribute('cy', Math.max(48, waterTop * 0.25)); sunC.setAttribute('r', Math.max(14, sc * 0.04));
      cloud.setAttribute('cx', W * 0.6); cloud.setAttribute('cy', Math.max(40, waterTop * 0.3)); cloud.setAttribute('rx', sc * 0.09); cloud.setAttribute('ry', sc * 0.03);
      waterR.setAttribute('x', 0); waterR.setAttribute('y', waterTop); waterR.setAttribute('width', W); waterR.setAttribute('height', H - waterTop);
      deepR.setAttribute('x', 0); deepR.setAttribute('y', waterTop + pondH * 0.55); deepR.setAttribute('width', W); deepR.setAttribute('height', H - waterTop - pondH * 0.55);
      var wd = '', x;
      for (x = 0; x < W; x += 36) { wd += 'M' + x + ' ' + (waterTop + 6) + 'q9 -5 18 0t18 0'; }
      waveP.setAttribute('d', wd); waveP.setAttribute('stroke-width', 2);
      buildPier();
      swimmers.forEach(function (s) { s.y = waterTop + s.lane * pondH; s.x = clamp(s.x, -u, W + u); });
      render();
    }
    function buildPier() {
      var jw = fx + f * 0.95;
      pier.innerHTML = '<rect x="0" y="' + deckY + '" width="' + jw + '" height="' + (f * 0.16) + '" rx="3" fill="#b98963"/>' +
        '<rect x="0" y="' + (deckY + f * 0.16) + '" width="' + jw + '" height="' + (f * 0.05) + '" fill="#8d6847"/>' +
        '<rect x="' + (jw - f * 0.3) + '" y="' + (deckY + f * 0.16) + '" width="' + (f * 0.12) + '" height="' + (f * 0.7) + '" fill="#8d6847"/>' +
        '<rect x="' + (f * 0.1) + '" y="' + (deckY + f * 0.16) + '" width="' + (f * 0.12) + '" height="' + (f * 0.7) + '" fill="#8d6847"/>';
      var k = f / 40;
      fisher.innerHTML = '<g transform="translate(0 ' + (-f * 0.62) + ') scale(' + (k * 1.15) + ')">' + (animal ? window.Animals.head(animal.id, { body: true }) : '<circle r="16" fill="#d2a67f"/>') + '</g>' +
        '<rect x="' + (-f * 0.34) + '" y="' + (-f * 0.4) + '" width="' + (f * 0.68) + '" height="' + (f * 0.4) + '" rx="' + (f * 0.1) + '" fill="#f7a8c9"/>';
      bucketG.innerHTML = '';
      el('path', { d: 'M' + (bx - f * 0.4) + ' ' + (by - f * 0.55) + 'H' + (bx + f * 0.4) + 'L' + (bx + f * 0.32) + ' ' + by + 'H' + (bx - f * 0.32) + 'Z', fill: '#e8605a', stroke: '#b9443f', 'stroke-width': 2, 'stroke-linejoin': 'round' }, bucketG);
      bucketFill = el('g', {}, bucketG);
      el('path', { d: 'M' + (bx - f * 0.4) + ' ' + (by - f * 0.55) + 'Q' + bx + ' ' + (by - f * 0.85) + ' ' + (bx + f * 0.4) + ' ' + (by - f * 0.55), fill: 'none', stroke: '#b9443f', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, bucketG);
      glowR.setAttribute('cx', bx); glowR.setAttribute('cy', by - f * 0.4); glowR.setAttribute('rx', f * 0.75); glowR.setAttribute('ry', f * 0.7);
      rodL.setAttribute('stroke-width', Math.max(3, f * 0.06)); lineL.setAttribute('stroke-width', 1.8); hookN.setAttribute('stroke-width', 2.5);
      drawBucket();
    }
    function drawBucket() {
      bucketFill.innerHTML = '';
      st.bucketItems.forEach(function (kind, i) {
        var g = el('g', { transform: 'translate(' + (bx + (i - 2) * f * 0.17) + ' ' + (by - f * 0.55 - (i % 2) * f * 0.06) + ') scale(' + (f * 0.0075) + ')' }, bucketFill);
        g.innerHTML = drawKind(kind, FISH_COLORS[i % 4]);
      });
    }
    function hookPos() { return { x: hx, y: waterTop + hook.d * pondH }; }

    function startCatch(s, via) {
      latched = s; s.att = via === 'pull' ? 0.0001 : 0; s.fade = 1; s.alpha = 1;
      st.sway = 0.35; st.swayT = 0;
    }
    function allowed(s) { return s.kind !== banned() && s.fade > 0 && s.alpha > 0.6 && s !== latched; }
    function release() {
      if (!hook.press) { return; }
      hook.press = false;
      if (!latched) {
        var hp = hookPos(), best = null, bd = 1e9;
        swimmers.forEach(function (s) { if (allowed(s)) { var d = Math.hypot(s.x - hp.x, s.y - hp.y); if (d < bd) { bd = d; best = s; } } });
        if (!best) { // pond is refilling: any swimmer of an allowed kind comes straight in
          swimmers.forEach(function (s) { if (s !== latched && s.kind !== banned() && Math.hypot(s.x - hp.x, s.y - hp.y) < bd) { bd = Math.hypot(s.x - hp.x, s.y - hp.y); best = s; } });
        }
        if (best) { startCatch(best, 'pull'); }
      }
      if (latched) { var kind = latched.kind; report(function (A) { A.track('interaction', { variant: kind }); }); }
    }
    function press() {
      if (hook.press) { return; }
      hook.press = true;
    }

    function step(dt) {
      st.t += dt;
      var hp0 = hookPos();
      if (hook.press) { hook.d = Math.min(HOOK_MAX, hook.d + HOOK_SPEED * dt); }
      else { hook.d = Math.max(0, hook.d - HOOK_SPEED * dt); }
      var hp = hookPos(), i;
      // swimmers
      for (i = 0; i < swimmers.length; i++) {
        var s = swimmers[i];
        if (s === latched) { continue; }
        if (s.att > 0) { // being drawn to the hook
          s.att = Math.min(1, s.att + dt / 0.5);
          s.x += (hp.x - s.x) * ease(s.att) * Math.min(1, dt * 10); s.y += (hp.y - s.y) * ease(s.att) * Math.min(1, dt * 10);
          continue;
        }
        s.x += s.dir * s.speed * dt;
        s.y = waterTop + s.lane * pondH + Math.sin(st.t * 0.9 + s.lane * 20) * 4;
        s.alpha = clamp(s.alpha + s.fade * dt / FADE_S, 0, 1);
        if (s.fade < 0 && s.alpha <= 0) { reroll(s); }
        if ((s.dir > 0 && s.x > W + u) || (s.dir < 0 && s.x < -u)) { reroll(s, true); }
        if (hook.press && !latched && allowed(s) && Math.hypot(s.x - hp.x, s.y - hp.y) < LATCH_PX) { startCatch(s, 'latch'); }
      }
      if (latched) {
        var l = latched;
        if (l.att > 0 && l.att < 1) { l.att = Math.min(1, l.att + dt / 0.5); }
        st.swayT += dt; st.sway *= Math.exp(-dt * 0.6);
        var ang = st.sway * Math.sin(st.swayT * 2.4);
        l.x += (hp.x + Math.sin(ang) * 0.55 * u - l.x) * Math.min(1, dt * 12);
        l.y += (hp.y + Math.cos(ang) * 0.55 * u - l.y) * Math.min(1, dt * 12);
        l.rot += ((l.kind === 'fish' ? -75 * l.dir : 0) + ang * 40 - l.rot) * Math.min(1, dt * 6);
        if (hook.d <= 0 && !hook.press) { // at the surface: put it into the bucket
          flying.push({ s: l, t: 0, x0: l.x, y0: l.y, g: l.g });
          swimmers.splice(swimmers.indexOf(l), 1); latched = null;
          var fresh = newSwimmer(true); swimmers.push(fresh); ensureVariety();
        }
      }
      // catches on their way into the bucket
      for (i = flying.length - 1; i >= 0; i--) {
        var q = flying[i]; q.t += dt;
        var p = ease(q.t / STORE_S), tx = bx, ty = by - f * 0.7;
        q.s.x = q.x0 + (tx - q.x0) * p; q.s.y = q.y0 + (ty - q.y0) * p - Math.sin(p * Math.PI) * f * 0.9;
        q.s.rot *= 1 - Math.min(1, dt * 4);
        q.sc = 1 - 0.45 * p;
        if (q.t >= STORE_S) {
          flying.splice(i, 1);
          if (q.s.g.parentNode) { q.s.g.parentNode.removeChild(q.s.g); }
          arrive(q.s.kind);
        }
      }
      if (st.hopT >= 0) { st.hopT += dt; if (st.hopT > HOP_S) { st.hopT = -1; } }
      if (st.glowT >= 0) { st.glowT += dt; if (st.glowT > GLOW_S) { st.glowT = -1; st.bucketItems = []; drawBucket(); } }
    }
    function reroll(s, edge) {
      var k = pickKind();
      s.dir = Math.random() < 0.5 ? 1 : -1; s.speed = rnd(0.05, 0.12) * W; s.lane = rnd(0.1, 0.92);
      s.color = FISH_COLORS[Math.floor(Math.random() * 4)]; setKind(s, k);
      s.x = edge || s.fade < 0 ? (s.dir > 0 ? -u : W + u) : rnd(0.05, 0.95) * W;
      if (s.fade < 0) { s.x = rnd(0.05, 0.95) * W; s.alpha = 0; s.fade = 1; }
      s.att = 0; s.rot = 0; s.y = waterTop + s.lane * pondH;
      ensureVariety();
    }
    function arrive(kind) {
      history.push(kind); if (history.length > 3) { history.shift(); }
      st.bucketItems.push(kind); st.count++;
      drawBucket();
      if (st.count >= SET_SIZE) {
        st.count = 0; st.hopT = 0; st.glowT = 0;
        report(function (A) { A.complete(); });
        swimmers.forEach(function (s) { if (s !== latched && s.att === 0) { s.fade = -1; } });
      }
    }

    function render() {
      var hp = hookPos(), i;
      var hop = st.hopT >= 0 ? Math.abs(Math.sin(st.hopT / HOP_S * Math.PI * 2)) * f * 0.35 * (1 - st.hopT / HOP_S * 0.3) : 0;
      fisher.setAttribute('transform', 'translate(' + fx + ' ' + (deckY - hop) + ')');
      var tipY = rodY;
      rodL.setAttribute('x1', fx + f * 0.1); rodL.setAttribute('y1', deckY - hop - f * 0.35);
      rodL.setAttribute('x2', hx); rodL.setAttribute('y2', tipY);
      lineL.setAttribute('x1', hx); lineL.setAttribute('y1', tipY); lineL.setAttribute('x2', hp.x); lineL.setAttribute('y2', hp.y);
      hookN.setAttribute('d', 'M' + hp.x + ' ' + hp.y + 'v5q0 8 -7 7q-5 -1 -4 -6');
      var g = st.glowT >= 0 ? ease(Math.min(st.glowT / 0.6, 1)) * ease(Math.min((GLOW_S - st.glowT) / 0.6, 1)) : 0;
      glowR.setAttribute('opacity', (0.85 * g).toFixed(3));
      for (i = 0; i < swimmers.length; i++) { place(swimmers[i], 1); }
      for (i = 0; i < flying.length; i++) { place(flying[i].s, flying[i].sc || 1); }
      var br = btn.style;
      br.width = Math.max(56, f) + 'px'; br.height = Math.max(56, f * 1.2) + 'px';
      br.left = (fx - Math.max(56, f) / 2) + 'px'; br.top = (deckY - Math.max(56, f * 1.2)) + 'px';
    }
    function place(s, sc) {
      var k = (u / 60) * sc * (s === latched || s.kind !== 'fish' ? 1 : 1);
      var flip = s.kind === 'fish' && s.dir < 0 ? -1 : 1;
      s.g.setAttribute('transform', 'translate(' + s.x.toFixed(1) + ' ' + s.y.toFixed(1) + ') rotate(' + s.rot.toFixed(1) + ') scale(' + (k * flip).toFixed(3) + ' ' + k.toFixed(3) + ')');
      s.g.setAttribute('opacity', s.alpha.toFixed(2));
    }
    function busy() {
      return (hook.press || hook.d > 0 || flying.length > 0 || st.hopT >= 0 || st.glowT >= 0 || !!latched || swimmers.length > 0);
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      step(dt); render();
      if (alive && !document.hidden && busy() && !raf) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden || !alive) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); } }
    function onResize() { layout(); start(); }

    function onDown(e) {
      if (ptr !== null) { return; }
      ptr = e.pointerId;
      try { root.setPointerCapture(e.pointerId); } catch (x) { /* unsupported */ }
      press(); start(); e.preventDefault();
    }
    function onUp(e) {
      if (ptr === null || e.pointerId !== ptr) { return; }
      ptr = null;
      try { root.releasePointerCapture(e.pointerId); } catch (x) { /* already released */ }
      release(); start();
    }
    function onKeyDown(e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') { return; }
      e.preventDefault();
      if (e.repeat || keyDown || ptr !== null) { return; }
      keyDown = true; press(); start();
    }
    function onKeyUp(e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') { return; }
      if (!keyDown) { return; }
      keyDown = false; release(); start();
    }
    function onBlur() { if (keyDown) { keyDown = false; release(); start(); } }
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    btn.addEventListener('keydown', onKeyDown);
    btn.addEventListener('keyup', onKeyUp);
    btn.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    layout();
    fillPond();
    swimmers.forEach(function (s) { s.alpha = 1; });
    render();
    start();

    return function cleanup() {
      alive = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'wedkowanie') { a.mount = mount; } });
})();
