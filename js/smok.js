// Activity "Lot na Smoku": a friendly green dragon with a small rider flies at constant speed to the right over a scrolling land (hills,
// a castle, sea, clouds). The scenery is one canvas whose layers scroll with a shared phase f = (t mod 60 s) / 60 and have an integer number of
// pattern periods per loop, so the 60 s loop is seamless. Three biomes (meadow, snow, sea) blend into each other smoothly, one every 36 s.
// A finger (or arrow keys) steers the dragon with a damped spring (speed capped at 60% of the screen width per second); the target and the
// dragon are always clamped so the whole dragon (wings included) stays on screen, also after a resize. Lanterns (a pool of 14, each a 56 px
// button, always 6 or more on screen) drift left; tapping a lantern or the dragon makes it breathe a short fire puff that lights the nearest
// lantern ahead (or the tapped one) with a warm glow. Lit lanterns stay lit until they leave the screen. No obstacles, nothing hurts the dragon.
// One capped-dt rAF loop drives everything (wings too, so it works under prefers-reduced-motion), paused while the tab is hidden.
// Nothing is scored or stored. Usage metrics: track('interaction', {variant: 'steer' | 'fire' | 'lantern'}); open-ended, no complete().
(function () {
  var LOOP_S = 60, BIOME_S = 36, BLEND_S = 5, SPEED_W = 0.12;     // loop length, biome length, blend length, scroll speed (screen widths/s)
  var VMAX = 0.6, SK = 7, SD = 5.4, MAX_DT = 0.05;                // dragon speed cap (screen widths/s), spring stiffness and damping
  var NL = 14, LT_DIV = 8, FIRE_S = 0.8, HIT_S = 0.45, COOLDOWN_S = 0.35;
  var TAU = Math.PI * 2;
  // [sky top, sky bottom, far hills, near ground, ground edge, sun]
  var BIOMES = [
    { sky0: [158, 214, 245], sky1: [236, 247, 226], far: [157, 208, 140], near: [128, 200, 110], edge: [96, 170, 88], sun: [255, 226, 122] },
    { sky0: [190, 214, 236], sky1: [244, 248, 252], far: [200, 220, 238], near: [244, 248, 252], edge: [208, 224, 240], sun: [252, 246, 226] },
    { sky0: [150, 213, 240], sky1: [226, 244, 250], far: [120, 190, 214], near: [88, 172, 214], edge: [60, 140, 196], sun: [255, 226, 122] }
  ];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }
  function mod(a, n) { return ((a % n) + n) % n; }

  // Dragon drawn in a local space about 200 x 120 units around the body centre, facing right (head at +x), tail at -x, wings above.
  var DRAGON_W = 200, EXT_L = 112, EXT_R = 100, EXT_T = 74, EXT_B = 46;
  var MOUTH = [96, -8];

  function dragonSvg() {
    return '<g class="sm-tail"><path class="sm-tailp" d="M-50 4Q-90 20 -110 -6" fill="none" stroke="#8fd19e" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="M-104 -2L-122 -16L-112 6Z" fill="#f7a8c9"/></g>' +
      '<g class="sm-wingb"><path d="M-8-14L-44-70Q-20-76 8-44Q22-66 40-60Q30-30 14-14Z" fill="#e48fb4" stroke="#c76e98" stroke-width="2" stroke-linejoin="round"/></g>' +
      '<path d="M-60 6Q-10 40 50 22L52-14Q-6-30-60-8Z" fill="#8fd19e" stroke="#6bb57d" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M-40 16Q-5 34 44 20L46 6Q0 20-40 4Z" fill="#ffe9a8"/>' +
      '<path d="M-40-10l6-9 6 9zM-18-16l6-9 6 9zM4-18l6-9 6 9z" fill="#f7a8c9"/>' +
      '<rect x="-30" y="16" width="12" height="20" rx="6" fill="#8fd19e" stroke="#6bb57d" stroke-width="2"/>' +
      '<rect x="22" y="14" width="12" height="22" rx="6" fill="#8fd19e" stroke="#6bb57d" stroke-width="2"/>' +
      '<g class="sm-rider"><rect x="-6" y="-26" width="18" height="16" rx="7" fill="#f7a8c9"/><circle cx="3" cy="-33" r="8" fill="#f6d5b8"/>' +
      '<path d="M-5-36Q3-48 11-36Z" fill="#ffd98a"/><circle cx="6" cy="-33" r="1.3" fill="#5b5675"/><path d="M1-29Q4-27 8-29" fill="none" stroke="#5b5675" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M10-20L26-14" stroke="#f6d5b8" stroke-width="4" stroke-linecap="round"/></g>' +
      '<g class="sm-head"><path d="M44-14Q62-34 84-20Q104-12 100 4Q96 14 80 12Q60 16 46 8Z" fill="#8fd19e" stroke="#6bb57d" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M52 6Q76 12 96 6Q92 14 80 12Q62 16 52 6Z" fill="#ffe9a8"/>' +
      '<path d="M62-28L66-44L74-28Z" fill="#f7a8c9"/><circle cx="70" cy="-12" r="6.5" fill="#fff"/><circle cx="72" cy="-12" r="3.4" fill="#5b5675"/><circle cx="73" cy="-13" r="1.1" fill="#fff"/>' +
      '<circle cx="94" cy="-6" r="1.6" fill="#6bb57d"/><circle cx="80" cy="-2" r="4" fill="#f7a8c9" fill-opacity=".55"/>' +
      '<path class="sm-smile" d="M74 4Q86 12 98 4" fill="none" stroke="#5b5675" stroke-width="2" stroke-linecap="round"/>' +
      '<ellipse class="sm-open" cx="96" cy="4" rx="5" ry="6" fill="#d9605a" opacity="0"/></g>' +
      '<g class="sm-wingf"><path d="M-2-14L-30-74Q-4-80 18-46Q34-66 52-58Q40-28 22-14Z" fill="#f7a8c9" stroke="#e48fb4" stroke-width="2" stroke-linejoin="round"/></g>';
  }

  function lanternSvg() {
    return '<svg class="sm-ls" viewBox="0 0 56 56" aria-hidden="true" focusable="false">' +
      '<circle class="sm-glow" cx="28" cy="32" r="27" fill="url(#sm-g)"/>' +
      '<path d="M28 2V10" stroke="#8d6847" stroke-width="2" stroke-linecap="round"/>' +
      '<rect x="19" y="9" width="18" height="5" rx="2" fill="#8d6847"/>' +
      '<ellipse class="sm-body" cx="28" cy="31" rx="15" ry="17" fill="#e8605a" stroke="#c25b87" stroke-width="2"/>' +
      '<path d="M28 14V48M20 16Q17 31 20 46M36 16Q39 31 36 46" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>' +
      '<rect x="22" y="47" width="12" height="5" rx="2" fill="#8d6847"/></svg>';
  }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'sm';
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', 'Lot na Smoku');
    var canvas = document.createElement('canvas');
    canvas.className = 'sm-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    root.appendChild(canvas);
    var defs = '<svg class="sm-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs><radialGradient id="sm-g"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".95"/><stop offset=".55" stop-color="#ffc45a" stop-opacity=".5"/><stop offset="1" stop-color="#ffc45a" stop-opacity="0"/></radialGradient></defs></svg>';
    var holder = document.createElement('div');
    holder.innerHTML = defs;
    root.appendChild(holder.firstChild);
    var lts = [], i;
    for (i = 0; i < NL; i++) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sm-lt'; b.setAttribute('aria-label', 'Lampion');
      b.innerHTML = lanternSvg();
      root.appendChild(b);
      lts.push({ el: b, gl: b.querySelector('.sm-glow'), bd: b.querySelector('.sm-body'), x: 0, lvl: 0, lit: false, glow: 0 });
      b.addEventListener('click', (function (lt) { return function (e) { if (e.detail === 0) { fire(lt); } }; })(lts[lts.length - 1]));
    }
    var dragNS = 'http://www.w3.org/2000/svg';
    var dsvg = document.createElementNS(dragNS, 'svg');
    dsvg.setAttribute('class', 'sm-svg');
    dsvg.setAttribute('viewBox', '-130 -90 260 150');
    dsvg.setAttribute('aria-hidden', 'true');
    dsvg.setAttribute('focusable', 'false');
    var dg = document.createElementNS(dragNS, 'g');
    dg.innerHTML = dragonSvg();
    dsvg.appendChild(dg);
    root.appendChild(dsvg);
    var kb = document.createElement('button');
    kb.type = 'button'; kb.className = 'sm-kb';
    kb.setAttribute('aria-label', 'Smok. Strzałki sterują lotem, Enter lub spacja zieje ogniem.');
    root.appendChild(kb);
    container.appendChild(root);

    var wingF = dsvg.querySelector('.sm-wingf'), wingB = dsvg.querySelector('.sm-wingb'), tailG = dsvg.querySelector('.sm-tailp');
    var openM = dsvg.querySelector('.sm-open'), smile = dsvg.querySelector('.sm-smile'), headG = dsvg.querySelector('.sm-head');
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, sc = 1, dw = 0;
    var t = 0, raf = 0, last = 0;
    var x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0, pitch = 0;
    var fxr = 0.3, fyr = 0.45;                      // dragon position as a fraction of the screen, kept across resizes
    var pid = null, flap = 0, puff = null, cool = 0, openT = 0, seq = 0;
    var Y_LEVELS = [0, 2, 1];

    function dragonBounds() {
      return { x0: EXT_L * sc, x1: W - EXT_R * sc, y0: EXT_T * sc, y1: H - EXT_B * sc };
    }
    function clampTarget(px, py) {
      var b = dragonBounds();
      return [clamp(px, b.x0, Math.max(b.x0, b.x1)), clamp(py, b.y0, Math.max(b.y0, b.y1))];
    }
    function lanternBand() {
      var top = Math.max(76, H * 0.1), bot = H * 0.78 - 30;
      return [top + 28, Math.max(top + 28 + 120, bot)];
    }
    function lanternY(lt) {
      var band = lanternBand();
      return band[0] + (band[1] - band[0]) * (lt.lvl / 2);
    }
    function placeLantern(lt, px) {
      lt.x = px; lt.lvl = Y_LEVELS[seq % 3]; seq++; lt.lit = false; lt.glow = 0;
      lt.el.classList.remove('on');
    }
    function spacing() { return Math.max(40, W / LT_DIV); }

    function layout() {
      var w = root.clientWidth || window.innerWidth, h = root.clientHeight || window.innerHeight, k;
      var oldW = W;
      W = w; H = h;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      dw = clamp(Math.min(W, H * 1.5) * 0.36, 110, 260);
      sc = dw / DRAGON_W;
      var dsw = 260 * sc, dsh = 150 * sc;
      dsvg.style.width = dsw.toFixed(1) + 'px'; dsvg.style.height = dsh.toFixed(1) + 'px';
      if (oldW) {
        k = W / oldW;
        for (i = 0; i < lts.length; i++) { lts[i].x *= k; }
      } else {
        var dx = spacing();
        for (i = 0; i < lts.length; i++) { placeLantern(lts[i], W * 0.3 + i * dx); }
      }
      var p = clampTarget(fxr * W, fyr * H);
      x = p[0]; y = p[1]; vx = 0; vy = 0; tx = x; ty = y;
      paint();
    }

    // ---- input -------------------------------------------------------------------------------------------
    function pt(e) { var r = root.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function steer(e) { var p = pt(e), c = clampTarget(p[0], p[1]); tx = c[0]; ty = c[1]; }
    function lanternAt(node) {
      for (var j = 0; j < lts.length; j++) { if (lts[j].el === node) { return lts[j]; } }
      return null;
    }
    function onDown(e) {
      if (pid !== null) { return; }
      var tgt = e.target && e.target.closest ? e.target.closest('.sm-lt') : null;
      if (tgt) { var lt = lanternAt(tgt); if (lt) { fire(lt); } return; }
      var p = pt(e), reach = Math.max(56, 90 * sc);
      pid = e.pointerId;
      steer(e);
      report(function (A) { A.track('interaction', { variant: 'steer' }); });
      if (Math.abs(p[0] - x) < reach && Math.abs(p[1] - y) < reach) { fire(null); }
      start();
    }
    function onMove(e) { if (e.pointerId === pid) { steer(e); } }
    function onUp(e) { if (e.pointerId === pid) { pid = null; } }
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    kb.addEventListener('keydown', function (e) {
      var step = W * 0.1, dx = e.key === 'ArrowLeft' ? -step : (e.key === 'ArrowRight' ? step : 0);
      var dy = e.key === 'ArrowUp' ? -step : (e.key === 'ArrowDown' ? step : 0);
      if (dx || dy) {
        e.preventDefault();
        var c = clampTarget(tx + dx, ty + dy); tx = c[0]; ty = c[1]; start();
      } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(null); }
    });

    // ---- fire --------------------------------------------------------------------------------------------
    function mouthPos() {
      var a = pitch * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
      return [x + (MOUTH[0] * cs - MOUTH[1] * sn) * sc, y + (MOUTH[0] * sn + MOUTH[1] * cs) * sc];
    }
    function ltPos(lt) { return [lt.x, lanternY(lt) + 4]; }
    function nearestLantern() {
      var m = mouthPos(), best = null, bd = 1e9, pass, j;
      for (pass = 0; pass < 2 && !best; pass++) {
        for (j = 0; j < lts.length; j++) {
          var lt = lts[j];
          if (lt.x < 0 || lt.x > W) { continue; }
          if (pass === 0 && (lt.lit || lt.x < m[0] - 30)) { continue; }
          var p = ltPos(lt), d = Math.pow(p[0] - m[0], 2) + Math.pow(p[1] - m[1], 2);
          if (d < bd) { bd = d; best = lt; }
        }
      }
      return best;
    }
    function fire(lt) {
      if (cool > 0) { return; }
      cool = COOLDOWN_S;
      puff = { t: 0, lt: lt || nearestLantern(), lit: false };
      openT = FIRE_S;
      report(function (A) { A.track('interaction', { variant: 'fire' }); });
      start();
    }

    // ---- drawing -----------------------------------------------------------------------------------------
    function mix3(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
    function rgb(c, al) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (al === undefined ? 1 : al) + ')'; }
    function biomeState() {
      var b = t / BIOME_S, n = Math.floor(b), fr = b - n;
      var idx = n % 3, bl = smooth((fr - (1 - BLEND_S / BIOME_S)) / (BLEND_S / BIOME_S));
      var w = [0, 0, 0]; w[idx] = 1 - bl; w[(idx + 1) % 3] = bl;
      function col(key) {
        return mix3(BIOMES[idx][key], BIOMES[(idx + 1) % 3][key], bl);
      }
      return { w: w, sky0: col('sky0'), sky1: col('sky1'), far: col('far'), near: col('near'), edge: col('edge'), sun: col('sun') };
    }
    function hill(px, off, lam, base, amp, ph) {
      var th = TAU * (px + off) / lam;
      return base - amp * (0.6 * Math.sin(th + ph) + 0.3 * Math.sin(2 * th + 2 * ph) + 0.1 * Math.sin(3 * th));
    }
    function itemX(fr, off, lam, margin) { return mod(fr * lam - off, lam) - margin; }

    function cloud(cx, cy, s) {
      ctx.beginPath();
      ctx.arc(cx - 18 * s, cy + 4 * s, 12 * s, 0, TAU); ctx.arc(cx, cy - 4 * s, 16 * s, 0, TAU); ctx.arc(cx + 19 * s, cy + 3 * s, 12 * s, 0, TAU);
      ctx.rect(cx - 30 * s, cy + 4 * s, 60 * s, 12 * s);
      ctx.fill();
    }
    function tree(cx, by, s, a) {
      ctx.globalAlpha = a;
      ctx.fillStyle = '#8d6847'; ctx.fillRect(cx - 3 * s, by - 18 * s, 6 * s, 20 * s);
      ctx.fillStyle = '#5fb36a'; ctx.beginPath(); ctx.arc(cx, by - 28 * s, 16 * s, 0, TAU); ctx.arc(cx - 10 * s, by - 20 * s, 11 * s, 0, TAU); ctx.arc(cx + 10 * s, by - 20 * s, 11 * s, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    function pine(cx, by, s, a) {
      ctx.globalAlpha = a;
      ctx.fillStyle = '#8d6847'; ctx.fillRect(cx - 2.5 * s, by - 8 * s, 5 * s, 10 * s);
      ctx.fillStyle = '#4f9c78';
      ctx.beginPath(); ctx.moveTo(cx, by - 46 * s); ctx.lineTo(cx + 12 * s, by - 24 * s); ctx.lineTo(cx - 12 * s, by - 24 * s); ctx.closePath();
      ctx.moveTo(cx, by - 34 * s); ctx.lineTo(cx + 16 * s, by - 8 * s); ctx.lineTo(cx - 16 * s, by - 8 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(cx, by - 46 * s); ctx.lineTo(cx + 5 * s, by - 37 * s); ctx.lineTo(cx - 5 * s, by - 37 * s); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
    function boat(cx, cy, s, a, bob) {
      ctx.globalAlpha = a;
      ctx.fillStyle = '#c25b87'; ctx.beginPath(); ctx.moveTo(cx - 22 * s, cy - 6 * s + bob); ctx.lineTo(cx + 22 * s, cy - 6 * s + bob); ctx.lineTo(cx + 14 * s, cy + 6 * s + bob); ctx.lineTo(cx - 14 * s, cy + 6 * s + bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx, cy - 40 * s + bob); ctx.lineTo(cx + 16 * s, cy - 8 * s + bob); ctx.lineTo(cx, cy - 8 * s + bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.moveTo(cx - 2 * s, cy - 32 * s + bob); ctx.lineTo(cx - 14 * s, cy - 8 * s + bob); ctx.lineTo(cx - 2 * s, cy - 8 * s + bob); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
    function castle(cx, by, s, snow) {
      ctx.fillStyle = '#d9c9ee';
      ctx.fillRect(cx - 44 * s, by - 40 * s, 88 * s, 40 * s);
      ctx.fillRect(cx - 54 * s, by - 62 * s, 22 * s, 62 * s); ctx.fillRect(cx + 32 * s, by - 62 * s, 22 * s, 62 * s);
      ctx.fillRect(cx - 14 * s, by - 76 * s, 28 * s, 76 * s);
      ctx.fillStyle = '#c25b87';
      [[cx - 43 * s, 22], [cx + 43 * s, 22], [cx, 28]].forEach(function (c, k) {
        var half = c[1] * s / 2 + 3 * s, topY = k === 2 ? by - 76 * s : by - 62 * s;
        ctx.beginPath(); ctx.moveTo(c[0] - half, topY); ctx.lineTo(c[0], topY - 22 * s); ctx.lineTo(c[0] + half, topY); ctx.closePath(); ctx.fill();
      });
      if (snow) {
        ctx.fillStyle = '#fff';
        [cx - 43 * s, cx + 43 * s, cx].forEach(function (c, k) {
          var topY = k === 2 ? by - 76 * s : by - 62 * s;
          ctx.beginPath(); ctx.moveTo(c - 6 * s, topY - 14 * s); ctx.lineTo(c, topY - 22 * s); ctx.lineTo(c + 6 * s, topY - 14 * s); ctx.closePath(); ctx.fill();
        });
      }
      ctx.fillStyle = '#8f7fd1'; ctx.beginPath(); ctx.arc(cx, by, 9 * s, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff4cf'; ctx.fillRect(cx - 3 * s, by - 64 * s, 6 * s, 8 * s); ctx.fillRect(cx - 49 * s, by - 48 * s, 6 * s, 8 * s); ctx.fillRect(cx + 43 * s, by - 48 * s, 6 * s, 8 * s);
    }

    function drawWorld() {
      var s = biomeState(), f = (t % LOOP_S) / LOOP_S, P = LOOP_S * SPEED_W * W, px, g, lam, off, a, ix;
      g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, rgb(s.sky0)); g.addColorStop(1, rgb(s.sky1));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // sun
      ctx.fillStyle = rgb(s.sun); ctx.beginPath(); ctx.arc(W - Math.max(46, W * 0.1), Math.max(60, H * 0.12), Math.max(20, Math.min(W, H) * 0.06), 0, TAU); ctx.fill();
      // clouds (parallax 0.25, one pattern period per loop)
      lam = P * 0.25; off = f * lam;
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      [[0.1, 0.12, 1], [0.45, 0.25, 0.8], [0.8, 0.17, 1.15]].forEach(function (c) {
        cloud(itemX(c[0], off, lam, 120), H * c[1], c[2] * Math.max(0.8, Math.min(W, H) / 400));
      });
      // far hills (parallax 0.4, two periods per loop)
      var farBase = H * 0.72, farAmp = H * 0.07;
      lam = P * 0.4 / 2; off = f * P * 0.4;
      ctx.fillStyle = rgb(s.far); ctx.beginPath(); ctx.moveTo(0, H);
      for (px = 0; px <= W + 8; px += 8) { ctx.lineTo(px, hill(px, off, lam, farBase, farAmp, 0.7)); }
      ctx.lineTo(W + 8, H); ctx.closePath(); ctx.fill();
      // castle (parallax 0.55, one per loop) standing on its own mound
      lam = P * 0.55; off = f * lam;
      var cx = itemX(0.5, off, lam, 160), cs = Math.max(0.8, H / 330);
      if (cx > -160 && cx < W + 160) {
        ctx.fillStyle = rgb(s.far); ctx.beginPath(); ctx.ellipse(cx, farBase + 8, 90 * cs, 22 * cs, 0, Math.PI, 0); ctx.fill();
        castle(cx, farBase + 6, cs, s.w[1]);
      }
      // near ground: hills (meadow, snow) blended with a flat sea level
      var nearBase = H * 0.86, nearAmp = H * 0.05, seaY = H * 0.84, wob = Math.sin(t * 1.3) * 2;
      lam = P / 6; off = f * P;
      var sw = s.w[2];
      function surf(p) { return hill(p, off, lam, nearBase, nearAmp, 0) * (1 - sw) + (seaY + wob + 2 * Math.sin(p / 40 + t * 2)) * sw; }
      ctx.fillStyle = rgb(s.near); ctx.beginPath(); ctx.moveTo(0, H);
      for (px = 0; px <= W + 8; px += 8) { ctx.lineTo(px, surf(px)); }
      ctx.lineTo(W + 8, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgb(s.edge); ctx.lineWidth = Math.max(3, H * 0.008); ctx.beginPath();
      for (px = 0; px <= W + 8; px += 8) { if (px === 0) { ctx.moveTo(px, surf(px)); } else { ctx.lineTo(px, surf(px)); } }
      ctx.stroke();
      var ts = Math.max(0.8, H / 400);
      [0.2, 0.55, 0.85].forEach(function (fr, k) {
        ix = itemX(fr, off, lam, 60);
        if (ix < -60 || ix > W + 60) { return; }
        if (s.w[0] > 0.01) { tree(ix, surf(ix) + 4, ts * (k === 1 ? 1.25 : 1), s.w[0]); }
        if (s.w[1] > 0.01) { pine(ix, surf(ix) + 4, ts * (k === 1 ? 1.25 : 1), s.w[1]); }
      });
      if (sw > 0.01) {
        [0.35, 0.9].forEach(function (fr) {
          ix = itemX(fr, off, lam, 60);
          if (ix > -60 && ix < W + 60) { boat(ix, seaY - 2, ts, sw, Math.sin(t * 1.7 + fr * 9) * 3); }
        });
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.7 * sw).toFixed(2) + ')'; ctx.lineWidth = 2;
        for (var wv = 0; wv < 6; wv++) {
          var wx = itemX(wv / 6, off, lam, 40) , wy = seaY + (wv % 3) * H * 0.03 + 14;
          if (wx > -40 && wx < W + 40) { ctx.beginPath(); ctx.moveTo(wx - 14, wy); ctx.quadraticCurveTo(wx, wy - 6, wx + 14, wy); ctx.stroke(); }
        }
      }
      if (s.w[0] > 0.01 && W > 0) { /* meadow flowers */
        ctx.globalAlpha = s.w[0];
        [0.08, 0.38, 0.7].forEach(function (fr, k) {
          ix = itemX(fr, off, lam, 60);
          if (ix > -20 && ix < W + 20) { ctx.fillStyle = k === 1 ? '#ffd98a' : '#f7a8c9'; ctx.beginPath(); ctx.arc(ix, surf(ix) + 14, 4 * ts, 0, TAU); ctx.fill(); }
        });
        ctx.globalAlpha = 1;
      }
    }

    function drawFire() {
      if (!puff) { return; }
      var m = mouthPos(), tp = puff.lt ? ltPos(puff.lt) : [m[0] + W * 0.3, m[1] - 6];
      var p = clamp(puff.t / HIT_S, 0, 1), fade = puff.t < HIT_S ? 1 : clamp(1 - (puff.t - HIT_S) / (FIRE_S - HIT_S), 0, 1);
      for (var j = 0; j < 10; j++) {
        var fr = j / 9, q = fr * p;
        var fx = m[0] + (tp[0] - m[0]) * q + Math.sin(t * 30 + j) * 2 * sc, fy = m[1] + (tp[1] - m[1]) * q + Math.cos(t * 26 + j * 2) * 2 * sc;
        var r = (5 + 9 * fr) * sc * (0.6 + 0.4 * fade);
        ctx.fillStyle = 'rgba(' + Math.round(255) + ',' + Math.round(200 - 90 * fr) + ',' + Math.round(80 - 40 * fr) + ',' + (0.85 * fade).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(fx, fy, r, 0, TAU); ctx.fill();
      }
    }

    function paint() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      drawWorld();
      drawFire();
      var j, lt, ly;
      for (j = 0; j < lts.length; j++) {
        lt = lts[j]; ly = lanternY(lt);
        lt.el.style.transform = 'translate(' + (lt.x - 28).toFixed(1) + 'px,' + (ly - 28).toFixed(1) + 'px)';
        lt.el.style.visibility = lt.x < -40 || lt.x > W + 40 ? 'hidden' : 'visible';
        var gl = lt.glow;
        lt.gl.setAttribute('opacity', gl.toFixed(2));
        lt.bd.setAttribute('fill', gl > 0.5 ? '#ffc94a' : '#e8605a');
      }
      var fl = Math.sin(flap * TAU * 1.1), dwY = -fl * 16;
      wingF.setAttribute('transform', 'rotate(' + (fl * 22).toFixed(1) + ' 6 -14)');
      wingB.setAttribute('transform', 'rotate(' + (-fl * 14 + 6).toFixed(1) + ' 0 -14)');
      tailG.setAttribute('transform', 'rotate(' + (Math.sin(flap * TAU * 0.55) * 6 + dwY * 0.1).toFixed(1) + ' -50 4)');
      openM.setAttribute('opacity', openT > 0 ? '1' : '0');
      smile.setAttribute('opacity', openT > 0 ? '0' : '1');
      headG.setAttribute('transform', 'rotate(' + (openT > 0 ? -8 : 0) + ' 50 0)');
      var bob = Math.sin(flap * TAU * 0.55) * 3 * sc;
      dsvg.style.transform = 'translate(' + (x - 130 * sc).toFixed(1) + 'px,' + (y - 90 * sc + bob).toFixed(1) + 'px) rotate(' + pitch.toFixed(1) + 'deg)';
      dsvg.style.transformOrigin = (130 * sc).toFixed(1) + 'px ' + (90 * sc).toFixed(1) + 'px';
      var bs = Math.max(56, 90 * sc);
      kb.style.width = bs.toFixed(1) + 'px'; kb.style.height = bs.toFixed(1) + 'px';
      kb.style.transform = 'translate(' + (x - bs / 2).toFixed(1) + 'px,' + (y - bs / 2).toFixed(1) + 'px)';
    }

    function frame(now) {
      var dt = Math.min((now - last) / 1000, MAX_DT), j;
      last = now; t += dt; flap += dt; cool = Math.max(0, cool - dt); openT = Math.max(0, openT - dt);
      var spd = SPEED_W * W;
      // dragon: damped spring toward the target, speed capped
      vx += (SK * (tx - x) - SD * vx) * dt; vy += (SK * (ty - y) - SD * vy) * dt;
      var sp = Math.sqrt(vx * vx + vy * vy), cap = VMAX * W;
      if (sp > cap) { vx *= cap / sp; vy *= cap / sp; }
      x += vx * dt; y += vy * dt;
      var b = dragonBounds();
      if (x < b.x0 || x > b.x1) { x = clamp(x, b.x0, Math.max(b.x0, b.x1)); vx = 0; }
      if (y < b.y0 || y > b.y1) { y = clamp(y, b.y0, Math.max(b.y0, b.y1)); vy = 0; }
      fxr = x / W; fyr = y / H;
      pitch += (clamp(vy / (0.6 * W) * 28, -24, 24) - pitch) * (1 - Math.exp(-6 * dt));
      // lanterns drift left and are recycled on the right
      var maxX = -1e9, dx = spacing();
      for (j = 0; j < lts.length; j++) { lts[j].x -= spd * dt; if (lts[j].x > maxX) { maxX = lts[j].x; } }
      for (j = 0; j < lts.length; j++) {
        if (lts[j].x < -48) { maxX += dx; placeLantern(lts[j], maxX); }
      }
      // fire puff
      if (puff) {
        puff.t += dt;
        if (!puff.lit && puff.t >= HIT_S) {
          puff.lit = true;
          if (puff.lt && puff.lt.x > -40) {
            if (!puff.lt.lit) { report(function (A) { A.track('interaction', { variant: 'lantern' }); }); }
            puff.lt.lit = true;
          }
        }
        if (puff.t >= FIRE_S) { puff = null; }
      }
      for (j = 0; j < lts.length; j++) {
        var lt = lts[j], want = lt.lit ? 1 : 0;
        lt.glow += (want - lt.glow) * (1 - Math.exp(-8 * dt));
        if (Math.abs(want - lt.glow) < 0.01) { lt.glow = want; }
        if (lt.lit) { lt.el.classList.add('on'); }
      }
      paint();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf || document.hidden) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }
    function onResize() { layout(); }
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    layout();
    start();

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'smok') { a.mount = mount; } });
})();
