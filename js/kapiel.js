// Activity "Kąpiel Zwierzątek": an animal spa. A random animal (13 from window.Animals, never the same twice in a row) goes through
// three gentle finger-drag stages: 1 scrub the mud away (soap bubbles), 2 wash the white foam off with a shower stream,
// 3 rub it dry with a towel (damp tint + droplets vanish, the fur gets fluffy). Each stage is a mask canvas in logical
// coordinates (resize/rotation keeps the progress); at ~90% the rest fades by itself, the next state fades in over 0.7 s.
// Then a random accessory appears, the animal glows ~3 s and ~4 s later a new animal fades in. Keyboard: arrow keys move
// the brush, Enter/Space advance it along a zig-zag. One capped-dt rAF loop (pauses while hidden, stops when idle);
// at most 28 bubbles/droplets (pooled DOM nodes); nothing is stored.
(function () {
  var LW = 256, LH = 336;            // logical size of the stage mask; the animal fills a 64 x 84 viewBox (x -32..32, y -42..42)
  var VX = -32, VY = -42, VW = 64, VH = 84;
  var MAX_BUBBLES = 28, BUBBLE_S = 1.6, SPAWN_GAP_S = 0.09;
  var DONE_AT = 0.9, REST_S = 0.5, IN_S = 0.7, GLOW_S = 3, NEXT_AT_S = 7, SWAP_S = 0.7;
  var BRUSH = [0.11, 0.2, 0.17];     // brush width per stage as a fraction of the box width (shower is wider)
  var SIL_CACHE = {};

  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  // Accessories (drawn in the animal's own units, on top of the head).
  var ACCESSORIES = [
    { label: 'kokardka', svg: '<path d="M11-14L21-20V-8Z" fill="#f7a8c9"/><path d="M11-14L1-20V-8Z" fill="#f7a8c9"/><circle cx="11" cy="-14" r="3.2" fill="#e8739f"/>' },
    { label: 'czapeczka', svg: '<path d="M-8-14L0-34L8-14Z" fill="#9fd0f0"/><path d="M-5-21L5-21M-7-17L7-17" stroke="#fff" stroke-width="2"/><circle cx="0" cy="-35" r="3" fill="#ffd98a"/>' },
    { label: 'korona', svg: '<path d="M-10-14V-26L-5-20L0-28L5-20L10-26V-14Z" fill="#ffd25e" stroke="#e9ac2f" stroke-width="1"/><circle cx="0" cy="-17" r="1.8" fill="#f7a8c9"/>' },
    { label: 'kwiatek', svg: '<g transform="translate(-11 -13)"><circle cx="0" cy="-5" r="3.6" fill="#f7a8c9"/><circle cx="5" cy="0" r="3.6" fill="#f7a8c9"/><circle cx="0" cy="5" r="3.6" fill="#f7a8c9"/><circle cx="-5" cy="0" r="3.6" fill="#f7a8c9"/><circle r="3" fill="#ffd25e"/></g>' },
    { label: 'muszka', svg: '<path d="M0 15L-10 9V21Z" fill="#8f7fd1"/><path d="M0 15L10 9V21Z" fill="#8f7fd1"/><circle cx="0" cy="15" r="3" fill="#6f60b8"/>' },
    { label: 'gwiazdka', svg: '<path d="M10-14L12-19L14-14L19-12L14-10L12-5L10-10L5-12Z" fill="#ffd25e" stroke="#e9ac2f" stroke-width=".8"/>' }
  ];

  function animalSvg(id, opts) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + VX + ' ' + VY + ' ' + VW + ' ' + VH + '" width="' + (VW * 4) + '" height="' + (VH * 4) + '">' +
      window.Animals.head(id, opts) + '</svg>';
  }
  function silhouette(id, colour, cb) {
    var key = id + colour, img = SIL_CACHE[key];
    if (!img) {
      img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(animalSvg(id, { body: true, shadow: colour }));
      SIL_CACHE[key] = img;
    }
    if (img.complete && img.naturalWidth) { cb(img); } else { img.addEventListener('load', function () { cb(img); }, { once: true }); }
  }

  function mount(container) {
    container.style.display = 'block';
    var board = document.createElement('div');
    board.className = 'kp';
    board.innerHTML = '<div class="kp-field"><div class="kp-box" tabindex="0" role="application" aria-label="Zwierzątko do kąpieli. Strzałki przesuwają szczotkę, Enter lub spacja myje dalej.">' +
      '<div class="kp-halo"></div><div class="kp-animal"></div><canvas class="kp-layer" width="' + LW + '" height="' + LH + '"></canvas>' +
      '<div class="kp-acc"></div><div class="kp-shower"></div><div class="kp-brush"></div><div class="kp-bubbles"></div></div></div>';
    container.appendChild(board);
    var field = board.querySelector('.kp-field'), box = board.querySelector('.kp-box'), halo = board.querySelector('.kp-halo'),
      animalEl = board.querySelector('.kp-animal'), layer = board.querySelector('.kp-layer'), accEl = board.querySelector('.kp-acc'),
      shower = board.querySelector('.kp-shower'), brushEl = board.querySelector('.kp-brush'), bubWrap = board.querySelector('.kp-bubbles');
    var ctx = layer.getContext('2d');
    var small = document.createElement('canvas');
    small.width = 32; small.height = 42;
    var sctx = small.getContext('2d', { willReadFrequently: true });

    var bubbles = [];
    for (var b = 0; b < MAX_BUBBLES; b++) {
      var bn = document.createElement('div');
      bn.className = 'kp-bub';
      bn.style.display = 'none';
      bubWrap.appendChild(bn);
      bubbles.push({ node: bn, age: -1, x: 0, y: 0, r: 0, dx: 0, fall: false });
    }

    var alive = true, animal = null, token = 0, stage = 0, baseline = 1, boxW = 240, brushLogical = 30;
    var phase = 'play', phaseT = 0, layerOp = 1, boxOp = 1, swapDir = 0, glow = 0, accOp = 0, fluff = 0;
    var pointers = {}, lastSpawn = 0, dirty = false, checkT = 0, kx = 0.2, ky = 0.3, kdir = 1, raf = 0, last = 0, clock = 0;

    function remaining() {
      sctx.clearRect(0, 0, 32, 42);
      sctx.drawImage(layer, 0, 0, 32, 42);
      var d = sctx.getImageData(0, 0, 32, 42).data, s = 0;
      for (var i = 3; i < d.length; i += 4) { s += d[i]; }
      return s;
    }

    // Paint the current stage's covering layer: mud, foam or damp tint with droplets, clipped to the animal's silhouette.
    function drawLayer(myToken) {
      layout();
      var colour = stage === 0 ? '#b99a7a' : stage === 1 ? '#ffffff' : '#7c8fb8';
      silhouette(animal.id, colour, function (img) {
        if (!alive || myToken !== token) { return; }
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, LW, LH);
        ctx.globalAlpha = stage === 2 ? 0.38 : 1;
        ctx.drawImage(img, 0, 0, LW, LH);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-atop';
        var i, n = stage === 2 ? 70 : 46;
        for (i = 0; i < n; i++) {
          var x = Math.random() * LW, y = Math.random() * LH;
          if (stage === 0) {
            ctx.fillStyle = Math.random() < 0.5 ? 'rgba(140,105,72,.32)' : 'rgba(210,180,140,.3)';
            ctx.beginPath(); ctx.arc(x, y, 6 + Math.random() * 20, 0, Math.PI * 2); ctx.fill();
          } else if (stage === 1) {
            ctx.fillStyle = Math.random() < 0.5 ? 'rgba(210,232,246,.9)' : 'rgba(255,255,255,.95)';
            ctx.beginPath(); ctx.arc(x, y, 5 + Math.random() * 14, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(160,205,235,.7)'; ctx.lineWidth = 1.5; ctx.stroke();
          } else {
            ctx.fillStyle = 'rgba(205,232,250,.9)';
            ctx.beginPath(); ctx.arc(x, y, 2 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,.9)';
            ctx.beginPath(); ctx.arc(x - 1, y - 1, 1.2, 0, Math.PI * 2); ctx.fill();
          }
        }
        ctx.globalCompositeOperation = 'source-over';
        baseline = Math.max(1, remaining());
        layerOp = 0; phaseT = 0;
        if (stage === 0) { layerOp = 1; if (phase === 'wait') { phase = 'play'; } }
        else if (phase === 'wait') { phase = 'in'; }
        layer.style.opacity = layerOp.toFixed(3);
        start();
      });
    }
    function setAnimal(a) {
      animal = a; token++; stage = 0; phase = 'wait'; phaseT = 0; glow = 0; accOp = 0; fluff = 0;
      animalEl.innerHTML = '<svg viewBox="' + VX + ' ' + VY + ' ' + VW + ' ' + VH + '" aria-hidden="true" focusable="false">' +
        '<ellipse cx="0" cy="40" rx="24" ry="2.6" fill="#000" fill-opacity=".08"/>' + window.Animals.head(a.id, { body: true }) + '</svg>';
      halo.style.backgroundImage = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(animalSvg(a.id, { body: true, shadow: a.fur })) + '")';
      halo.style.opacity = '0';
      var acc = window.Rand.pickOne(ACCESSORIES, 'kapiel-acc');
      accEl.innerHTML = '<svg viewBox="' + VX + ' ' + VY + ' ' + VW + ' ' + VH + '" aria-hidden="true" focusable="false">' + acc.svg + '</svg>';
      accEl.style.opacity = '0';
      animalEl.style.filter = ''; box.style.filter = '';
      box.setAttribute('aria-label', 'Zwierzątko do kąpieli: ' + a.name + '. Strzałki przesuwają szczotkę, Enter lub spacja myje dalej.');
      kx = 0.2; ky = 0.3; kdir = 1;
      layer.style.opacity = '0';
      drawLayer(token);
    }
    function nextAnimal() {
      var pool = window.Animals.LIST;
      return window.Rand.pickOne(pool, 'kapiel-animal');
    }

    function erase(x0, y0, x1, y1) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = brushLogical;
      ctx.strokeStyle = '#000';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      dirty = true;
    }
    function toLogical(e) {
      var r = box.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width * LW, (e.clientY - r.top) / r.height * LH];
    }
    function spawnBubble(lx, ly, fall) {
      for (var k = 0; k < bubbles.length; k++) {
        var bb = bubbles[k];
        if (bb.age >= 0) { continue; }
        bb.age = 0; bb.x = lx / LW; bb.y = ly / LH; bb.fall = !!fall;
        bb.r = fall ? 0.012 + Math.random() * 0.01 : 0.03 + Math.random() * 0.04;
        bb.dx = (Math.random() - 0.5) * 0.06;
        bb.node.className = fall ? 'kp-bub kp-drop' : 'kp-bub';
        bb.node.style.display = '';
        bb.node.style.width = bb.node.style.height = (bb.r * 200) + '%';
        return;
      }
    }
    function maybeSpawn(lx, ly) {
      if (clock - lastSpawn < SPAWN_GAP_S) { return; }
      lastSpawn = clock;
      spawnBubble(lx + (Math.random() - 0.5) * 30, ly + (Math.random() - 0.5) * 20, stage === 1);
    }
    function showShower(lx, ly) {
      if (stage !== 1) { shower.style.display = 'none'; return; }
      var x = lx / LW * 100, y = ly / LH * 100;
      shower.style.display = 'block';
      shower.style.left = x + '%'; shower.style.top = '0'; shower.style.height = y + '%';
    }

    function down(e) {
      if (phase !== 'play') { return; }
      var p = toLogical(e);
      pointers[e.pointerId] = p;
      try { box.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      erase(p[0], p[1], p[0], p[1]);
      maybeSpawn(p[0], p[1]);
      showShower(p[0], p[1]);
      e.preventDefault();
      start();
    }
    function move(e) {
      var prev = pointers[e.pointerId];
      if (!prev || phase !== 'play') { return; }
      var p = toLogical(e);
      erase(prev[0], prev[1], p[0], p[1]);
      maybeSpawn(p[0], p[1]);
      showShower(p[0], p[1]);
      pointers[e.pointerId] = p;
      start();
    }
    function up(e) { delete pointers[e.pointerId]; if (!Object.keys(pointers).length) { shower.style.display = 'none'; } }

    function brushTo(nx, ny) {
      var x0 = kx * LW, y0 = ky * LH;
      kx = Math.max(0.06, Math.min(0.94, nx)); ky = Math.max(0.05, Math.min(0.95, ny));
      brushEl.style.left = (kx * 100) + '%'; brushEl.style.top = (ky * 100) + '%';
      if (phase !== 'play') { return; }
      erase(x0, y0, kx * LW, ky * LH);
      maybeSpawn(kx * LW, ky * LH);
      showShower(kx * LW, ky * LH);
      start();
    }
    function onKey(e) {
      var step = 0.07, handled = true;
      if (e.key === 'ArrowLeft') { brushTo(kx - step, ky); }
      else if (e.key === 'ArrowRight') { brushTo(kx + step, ky); }
      else if (e.key === 'ArrowUp') { brushTo(kx, ky - step); }
      else if (e.key === 'ArrowDown') { brushTo(kx, ky + step); }
      else if (e.key === 'Enter' || e.key === ' ') {
        var nx = kx + kdir * step;
        if (nx > 0.94 || nx < 0.06) { kdir = -kdir; brushTo(kx, ky + 0.1 > 0.95 ? 0.05 : ky + 0.1); }
        else { brushTo(nx, ky); }
      } else { handled = false; }
      if (handled) { e.preventDefault(); }
    }
    function onFocus() { brushEl.style.display = 'block'; brushEl.style.left = (kx * 100) + '%'; brushEl.style.top = (ky * 100) + '%'; }
    function onBlur() { brushEl.style.display = 'none'; shower.style.display = 'none'; }

    function paintBubbles() {
      bubbles.forEach(function (bb) {
        if (bb.age < 0) { return; }
        var u = bb.age / BUBBLE_S;
        bb.node.style.left = ((bb.x + bb.dx * u) * 100).toFixed(2) + '%';
        bb.node.style.top = ((bb.y + (bb.fall ? 0.22 * u * u : -0.18 * smooth(u))) * 100).toFixed(2) + '%';
        bb.node.style.opacity = (0.8 * (1 - u * u)).toFixed(3);
      });
    }
    function paintLook() {
      halo.style.opacity = (fluff * (stage === 2 ? 1 : 0)).toFixed(3);
      accEl.style.opacity = accOp.toFixed(3);
      box.style.filter = glow > 0.01 ? 'drop-shadow(0 0 ' + (6 + 16 * glow) + 'px #ffe08a)' : '';
    }
    function finishStage() {
      phase = 'rest'; phaseT = 0; shower.style.display = 'none'; pointers = {};
      for (var i = 0; i < 6; i++) { spawnBubble(LW * (0.2 + 0.12 * i), LH * (0.3 + 0.4 * Math.random()), false); }
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min((now - last) / 1000, 0.05); last = now; clock += dt;
      var busy = false;
      bubbles.forEach(function (bb) {
        if (bb.age < 0) { return; }
        bb.age += dt;
        if (bb.age >= BUBBLE_S) { bb.age = -1; bb.node.style.display = 'none'; } else { busy = true; }
      });
      paintBubbles();
      if (phase === 'play') {
        if (dirty) {
          checkT += dt; busy = true;
          if (checkT >= 0.12) {
            checkT = 0; dirty = false;
            var cleaned = 1 - remaining() / baseline;
            if (stage === 2) { fluff = Math.max(0, Math.min(1, cleaned)); paintLook(); }
            if (cleaned >= DONE_AT) { finishStage(); }
          }
        }
      } else if (phase === 'rest') {
        phaseT += dt; busy = true;
        layerOp = reduced() ? 0 : Math.max(0, 1 - phaseT / REST_S);
        layer.style.opacity = layerOp.toFixed(3);
        if (stage === 2) { fluff = 1; paintLook(); }
        if (layerOp <= 0) {
          layer.style.opacity = '0';
          if (stage < 2) { stage++; dirty = false; phase = 'wait'; drawLayer(token); }
          else { phase = 'done'; phaseT = 0; }
        }
      } else if (phase === 'wait') {
        busy = true;   // next layer is being painted (async image load)
      } else if (phase === 'in') {
        phaseT += dt; busy = true;
        layerOp = Math.min(1, phaseT / IN_S);
        layer.style.opacity = layerOp.toFixed(3);
        if (layerOp >= 1) { phase = 'play'; phaseT = 0; dirty = false; checkT = 0; }
      } else if (phase === 'done') {
        phaseT += dt; busy = true;
        accOp = Math.min(1, phaseT / IN_S);
        glow = phaseT < GLOW_S ? Math.min(1, phaseT / 0.5) : Math.max(0, 1 - (phaseT - GLOW_S) / 0.5);
        paintLook();
        if (phaseT >= NEXT_AT_S) { phase = 'swap'; phaseT = 0; swapDir = -1; }
      } else if (phase === 'swap') {
        phaseT += dt; busy = true;
        boxOp += swapDir * dt / SWAP_S;
        if (swapDir < 0 && boxOp <= 0) { boxOp = 0; setAnimal(nextAnimal()); phase = 'swap'; swapDir = 1; }
        else if (swapDir > 0 && boxOp >= 1) { boxOp = 1; phase = 'play'; swapDir = 0; }
        box.style.opacity = boxOp.toFixed(3);
      }
      if (busy) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden || !alive) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }

    function layout() {
      var r = field.getBoundingClientRect();
      var h = Math.max(160, Math.min(r.height * 0.96, r.width * 0.96 * VH / VW, 640));
      boxW = h * VW / VH;
      box.style.width = boxW + 'px'; box.style.height = h + 'px';
      var frac = BRUSH[stage] || BRUSH[0];
      brushLogical = Math.max(44, boxW * frac) / boxW * LW;   // brush at least 44 CSS px wide
      brushEl.style.width = brushEl.style.height = (brushLogical / LW * boxW) + 'px';
      brushEl.style.margin = (-brushLogical / LW * boxW / 2) + 'px 0 0 ' + (-brushLogical / LW * boxW / 2) + 'px';
      shower.style.width = (brushLogical / LW * 100) + '%';
    }
    function onResize() { layout(); }

    box.addEventListener('pointerdown', down);
    box.addEventListener('pointermove', move);
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', up);
    box.addEventListener('lostpointercapture', up);
    box.addEventListener('keydown', onKey);
    box.addEventListener('focus', onFocus);
    box.addEventListener('blur', onBlur);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    layout();
    setAnimal(nextAnimal());

    return function cleanup() {
      alive = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (board.parentNode) { board.parentNode.removeChild(board); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'kapiel') { a.mount = mount; } });
})();
