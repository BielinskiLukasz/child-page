// Activity "Psia Myjnia": a dog car wash. A muddy dog of a random breed (window.Dogs, never the same breed twice in a row) stands in
// the wash; dragging a finger over it scrubs the mud away (a persistent mud mask on a canvas in logical coordinates, so resize/rotation
// keeps the cleaned areas) and releases soap bubbles from a pool of 28. At ~90% clean the rest of the mud fades, the dog shakes for
// ~1 s with droplets, glows ~3 s with its Polish breed name shown small underneath, and ~4 s after being clean the next breed fades in.
// Keyboard: arrow keys move the brush, Enter/Space advance it along a zig-zag path. One capped-dt rAF loop (pauses while hidden,
// stops when idle); nothing is scored or stored. Usage metrics: track('interaction', {variant: breed}) on touches, complete() per dog.
(function () {
  var LW = 480, LH = 400;            // logical size of the mud mask (the dog box is 6:5, like the Dogs viewBox 120 x 100)
  var MAX_BUBBLES = 28, BUBBLE_S = 1.8, SPAWN_GAP_S = 0.09;
  var DROPS = 14, DROP_S = 1;
  var DONE_AT = 0.9, FADE_MUD_S = 1.2, SHAKE_S = 1, GLOW_S = 3, NAME_S = 3, NEXT_AT_S = 4, SWAP_S = 0.7;
  var SHAKE_DEG = 6, SHAKE_HZ = 3;
  var IMG_CACHE = {}, lastId = null;

  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }

  // Next breed: random from the shared list, never the previous one.
  function pickDog() {
    var pool = window.Dogs.LIST.filter(function (d) { return d.id !== lastId; });
    var d = pool[Math.floor(Math.random() * pool.length)];
    lastId = d.id;
    return d;
  }
  // The dog as an Image (cached per breed) for the mud silhouette; a cached image calls back synchronously.
  function dogImage(id, cb) {
    var img = IMG_CACHE[id];
    if (!img) {
      img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(window.Dogs.draw(id).replace('<svg ', '<svg width="' + LW + '" height="' + LH + '" '));
      IMG_CACHE[id] = img;
    }
    if (img.complete && img.naturalWidth) { cb(img); } else { img.addEventListener('load', function () { cb(img); }, { once: true }); }
  }

  function mount(container) {
    container.style.display = 'block';
    var board = document.createElement('div');
    board.className = 'pj';
    board.innerHTML = '<div class="pj-field"><div class="pj-foam pj-f1"></div><div class="pj-foam pj-f2"></div><div class="pj-foam pj-f3"></div>' +
      '<div class="pj-box" tabindex="0" role="application" aria-label="Brudny piesek. Strzałki przesuwają szczotkę, Enter lub spacja szoruje dalej.">' +
      '<div class="pj-clean"></div><canvas class="pj-mud" width="' + LW + '" height="' + LH + '"></canvas>' +
      '<div class="pj-brush"></div><div class="pj-bubbles"></div><div class="pj-drops"></div></div>' +
      '<div class="pj-name"></div></div>';
    container.appendChild(board);
    var field = board.querySelector('.pj-field'), box = board.querySelector('.pj-box'), clean = board.querySelector('.pj-clean'),
      mud = board.querySelector('.pj-mud'), brushEl = board.querySelector('.pj-brush'), bubWrap = board.querySelector('.pj-bubbles'),
      dropWrap = board.querySelector('.pj-drops'), nameEl = board.querySelector('.pj-name');
    var ctx = mud.getContext('2d');
    var small = document.createElement('canvas');
    small.width = 48; small.height = 40;
    var sctx = small.getContext('2d', { willReadFrequently: true });

    var bubbles = [], drops = [], b;
    for (b = 0; b < MAX_BUBBLES; b++) {
      var bn = document.createElement('div');
      bn.className = 'pj-bub'; bn.style.display = 'none';
      bubWrap.appendChild(bn);
      bubbles.push({ node: bn, age: -1, x: 0, y: 0, dx: 0 });
    }
    for (b = 0; b < DROPS; b++) {
      var dn = document.createElement('div');
      dn.className = 'pj-drop'; dn.style.display = 'none';
      dropWrap.appendChild(dn);
      drops.push({ node: dn, age: -1, x: 0, y: 0, vx: 0, vy: 0 });
    }

    var dog = null, calm = null, happy = null, tail = null, tailP = [0, 0], token = 0, alive = true;
    var baseline = 1, boxW = 300, brushLogical = 40;
    var phase = 'wait', phaseT = 0, boxOp = 0, glow = 0, first = true;
    var pointers = {}, lastSpawn = 0, dirty = false, checkT = 0, kx = 0.15, ky = 0.35, kdir = 1, raf = 0, last = 0, clock = 0;

    function remaining() {
      sctx.clearRect(0, 0, 48, 40);
      sctx.drawImage(mud, 0, 0, 48, 40);
      var d = sctx.getImageData(0, 0, 48, 40).data, s = 0;
      for (var i = 3; i < d.length; i += 4) { s += d[i]; }
      return s;
    }
    function drawMud(img) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, LW, LH);
      ctx.drawImage(img, 0, 0, LW, LH);
      ctx.globalCompositeOperation = 'source-in';       // mud only where the dog is
      ctx.fillStyle = '#b99a7a';
      ctx.fillRect(0, 0, LW, LH);
      ctx.globalCompositeOperation = 'source-atop';
      for (var i = 0; i < 46; i++) {
        ctx.fillStyle = Math.random() < 0.5 ? 'rgba(140,105,72,.32)' : 'rgba(210,180,140,.3)';
        ctx.beginPath();
        ctx.arc(Math.random() * LW, Math.random() * LH, 8 + Math.random() * 26, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      baseline = Math.max(1, remaining());
    }
    function setMood(on) {
      if (!happy) { return; }
      happy.setAttribute('display', on ? 'inline' : 'none');
      calm.setAttribute('display', on ? 'none' : 'inline');
    }
    function rotTail(a) { if (tail) { tail.setAttribute('transform', a ? 'rotate(' + a.toFixed(2) + ' ' + tailP[0] + ' ' + tailP[1] + ')' : ''); } }

    // Bring in a new dog: the box stays hidden ('wait') until the silhouette image is ready, then fades in.
    function setDog(d) {
      token++;
      var my = token;
      dog = d;
      clean.innerHTML = window.Dogs.draw(d.id);
      calm = clean.querySelector('.dg-calm'); happy = clean.querySelector('.dg-happy'); tail = clean.querySelector('.dg-tail');
      tailP = tail ? [+tail.getAttribute('data-px'), +tail.getAttribute('data-py')] : [0, 0];
      setMood(false);
      box.setAttribute('aria-label', 'Brudny piesek: ' + d.name + '. Strzałki przesuwają szczotkę, Enter lub spacja szoruje dalej.');
      nameEl.style.opacity = '0'; nameEl.textContent = '';
      box.style.filter = ''; box.style.transform = '';
      mud.style.opacity = '1';
      phase = 'wait'; phaseT = 0; glow = 0; kx = 0.15; ky = 0.35; kdir = 1; dirty = false; pointers = {};
      dogImage(d.id, function (img) {
        if (!alive || my !== token) { return; }
        drawMud(img);
        boxOp = first ? 1 : 0; first = false;
        box.style.opacity = boxOp.toFixed(3);
        phase = boxOp >= 1 ? 'play' : 'in';
        start();
      });
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
    function spawnBubble(lx, ly) {
      for (var k = 0; k < bubbles.length; k++) {
        var bb = bubbles[k];
        if (bb.age >= 0) { continue; }
        var r = 0.02 + Math.random() * 0.025;
        bb.age = 0; bb.x = lx / LW; bb.y = ly / LH; bb.dx = (Math.random() - 0.5) * 0.04;
        bb.node.style.display = '';
        bb.node.style.width = bb.node.style.height = (r * 200) + '%';
        return;
      }
    }
    function maybeSpawn(lx, ly) {
      if (clock - lastSpawn < SPAWN_GAP_S) { return; }
      lastSpawn = clock;
      spawnBubble(lx + (Math.random() - 0.5) * 30, ly + (Math.random() - 0.5) * 20);
    }
    function canScrub() { return phase === 'play' || phase === 'in' || phase === 'done'; }

    function down(e) {
      if (!canScrub()) { return; }
      var p = toLogical(e);
      pointers[e.pointerId] = p;
      try { box.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      erase(p[0], p[1], p[0], p[1]);
      maybeSpawn(p[0], p[1]);
      report(function (A) { A.track('interaction', { variant: dog.id }); });
      e.preventDefault();
      start();
    }
    function move(e) {
      var prev = pointers[e.pointerId];
      if (!prev || !canScrub()) { return; }
      var p = toLogical(e);
      erase(prev[0], prev[1], p[0], p[1]);
      maybeSpawn(p[0], p[1]);
      pointers[e.pointerId] = p;
      start();
    }
    function up(e) { delete pointers[e.pointerId]; }

    function brushTo(nx, ny) {
      var x0 = kx * LW, y0 = ky * LH;
      kx = Math.max(0.04, Math.min(0.96, nx)); ky = Math.max(0.06, Math.min(0.94, ny));
      brushEl.style.left = (kx * 100) + '%'; brushEl.style.top = (ky * 100) + '%';
      if (!canScrub()) { return; }
      erase(x0, y0, kx * LW, ky * LH);
      maybeSpawn(kx * LW, ky * LH);
      start();
    }
    function onKey(e) {
      var step = 0.07, handled = true;
      if (e.key === 'ArrowLeft') { brushTo(kx - step, ky); }
      else if (e.key === 'ArrowRight') { brushTo(kx + step, ky); }
      else if (e.key === 'ArrowUp') { brushTo(kx, ky - step); }
      else if (e.key === 'ArrowDown') { brushTo(kx, ky + step); }
      else if (e.key === 'Enter' || e.key === ' ') {
        // zig-zag across the dog in steps
        var nx = kx + kdir * step;
        if (nx > 0.96 || nx < 0.04) { kdir = -kdir; brushTo(kx, ky + 0.12 > 0.94 ? 0.06 : ky + 0.12); }
        else { brushTo(nx, ky); }
        report(function (A) { A.track('interaction', { variant: dog.id }); });
      } else { handled = false; }
      if (handled) { e.preventDefault(); }
    }
    function onFocus() { brushEl.style.display = 'block'; brushEl.style.left = (kx * 100) + '%'; brushEl.style.top = (ky * 100) + '%'; }
    function onBlur() { brushEl.style.display = 'none'; }

    function startDrops() {
      drops.forEach(function (dr, i) {
        var a = Math.PI * (0.1 + 0.8 * (i + Math.random() * 0.5) / DROPS);   // fan out above and to the sides
        dr.age = 0; dr.x = 0.3 + 0.4 * Math.random(); dr.y = 0.35 + 0.2 * Math.random();
        dr.vx = Math.cos(a) * (i % 2 ? 0.55 : -0.55) * (0.5 + Math.random() * 0.5); dr.vy = -Math.sin(a) * 0.5;
        dr.node.style.display = '';
      });
    }
    function paintBubbles() {
      bubbles.forEach(function (bb) {
        if (bb.age < 0) { return; }
        var u = bb.age / BUBBLE_S;
        bb.node.style.left = ((bb.x + bb.dx * u) * 100).toFixed(2) + '%';
        bb.node.style.top = ((bb.y - 0.18 * smooth(u)) * 100).toFixed(2) + '%';
        bb.node.style.opacity = (0.8 * (1 - u * u)).toFixed(3);
      });
    }
    function paintDrops() {
      drops.forEach(function (dr) {
        if (dr.age < 0) { return; }
        var u = dr.age / DROP_S;
        dr.node.style.left = ((dr.x + dr.vx * u) * 100).toFixed(2) + '%';
        dr.node.style.top = ((dr.y + dr.vy * u + 0.7 * u * u) * 100).toFixed(2) + '%';
        dr.node.style.opacity = (0.9 * (1 - u)).toFixed(3);
      });
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
      drops.forEach(function (dr) {
        if (dr.age < 0) { return; }
        dr.age += dt;
        if (dr.age >= DROP_S) { dr.age = -1; dr.node.style.display = 'none'; } else { busy = true; }
      });
      paintBubbles(); paintDrops();
      if (phase === 'in') {
        boxOp = Math.min(1, boxOp + dt / SWAP_S); busy = true;
        box.style.opacity = boxOp.toFixed(3);
        if (boxOp >= 1) { phase = 'play'; }
      }
      if (dirty && phase === 'play') {
        checkT += dt;
        if (checkT >= 0.12) {
          checkT = 0; dirty = false;
          if (remaining() / baseline <= 1 - DONE_AT) {
            phase = 'done'; phaseT = 0;
            setMood(true);
            nameEl.textContent = dog.name; nameEl.style.opacity = '1';
            startDrops();
            for (var i = 0; i < 6; i++) { spawnBubble(LW * (0.2 + 0.12 * i), LH * (0.3 + 0.3 * Math.random())); }
            report(function (A) { A.complete(); });
          }
        } else { busy = true; }
      } else if (dirty && phase === 'in') { busy = true; }
      if (phase === 'done') {
        phaseT += dt; busy = true;
        mud.style.opacity = (reduced() ? 0 : Math.max(0, 1 - phaseT / FADE_MUD_S)).toFixed(3);
        glow = phaseT < GLOW_S ? Math.min(1, phaseT / 0.5) : Math.max(0, 1 - (phaseT - GLOW_S) / 0.5);
        box.style.filter = glow > 0.01 ? 'drop-shadow(0 0 ' + (6 + 16 * glow) + 'px #ffe08a)' : '';
        if (phaseT < SHAKE_S && !reduced()) {
          var w = Math.sin(2 * Math.PI * SHAKE_HZ * phaseT) * (1 - phaseT / SHAKE_S);
          box.style.transform = 'rotate(' + (SHAKE_DEG * w).toFixed(2) + 'deg)';
          rotTail(25 * w);
        } else { box.style.transform = ''; rotTail(0); }
        if (phaseT >= NAME_S) { nameEl.style.opacity = '0'; }
        if (phaseT >= NEXT_AT_S) { phase = 'out'; phaseT = 0; pointers = {}; }
      } else if (phase === 'out') {
        phaseT += dt; busy = true;
        boxOp = Math.max(0, boxOp - dt / SWAP_S);
        box.style.opacity = boxOp.toFixed(3);
        if (boxOp <= 0) { box.style.filter = ''; setDog(pickDog()); busy = phase !== 'wait' || busy; }
      }
      if (busy && alive && !raf && !document.hidden) { raf = requestAnimationFrame(frame); }
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
      boxW = Math.max(120, Math.min(r.width * 0.96, (r.height - 28) * 6 / 5, 680));
      box.style.width = boxW + 'px'; box.style.height = (boxW * 5 / 6) + 'px';
      brushLogical = Math.max(56, boxW * 0.11) / boxW * LW;   // brush at least 56 CSS px wide
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
    setDog(pickDog());

    return function cleanup() {
      alive = false; token++;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (board.parentNode) { board.parentNode.removeChild(board); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'psiamyjnia') { a.mount = mount; } });
})();
