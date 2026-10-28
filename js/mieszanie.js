// Activity "Mieszanie Kolorów": three paint blobs (red 1 dot, yellow 2 dots, blue 3 dots) sit on a shelf. Dragging one over the big glass pot
// and releasing drops it in with a splash; anything released elsewhere drifts back in 0.5 s. Two different blobs blend the pot over 1.5 s into
// the mix (orange stripes, green zigzag, purple ring) and a result blob with the same pattern glows for 3 s; the same colour twice only glows a little.
// Then the pot empties over 1 s and the next round starts. When all three different mixes have been made once, a friendly animal in that colour
// appears beside the pot for the 3 s glow. Keyboard: Tab to a blob, Enter/Space drops it into the pot.
// One capped-dt rAF loop holds every state (nothing lives only in CSS keyframes), pauses while hidden and stops when idle.
// Nothing is scored or stored. Usage metrics: track('interaction', {variant: colour}) per drop, complete() per mix; open-ended.
(function () {
  var MIX_S = 1.5, GLOW_S = 3.0, EMPTY_S = 1.0, BACK_S = 0.5, FLY_S = 0.25, FADE_S = 0.5, SPLASH_S = 0.7, SAME_S = 1.0;
  var RGB = { red: [238, 90, 90], yellow: [247, 213, 74], blue: [79, 143, 224], orange: [245, 154, 59], green: [92, 184, 92], purple: [154, 99, 201] };
  var NAMES = { red: 'Czerwona', yellow: 'Żółta', blue: 'Niebieska' };
  var MIX = { 'red+yellow': 'orange', 'blue+yellow': 'green', 'blue+red': 'purple' };
  var BASE = ['red', 'yellow', 'blue'];
  var BLOB_D = 'M32 6C50 6 58 22 56 36C54 52 42 58 30 58C14 58 6 46 8 32C10 18 18 6 32 6Z';
  var MARK = 'fill="#fff" stroke="rgba(61,58,79,.35)" stroke-width="1.5"';
  var LINE = 'fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
  var PATTERN = {
    red: '<circle cx="32" cy="34" r="6" ' + MARK + '/>',
    yellow: '<circle cx="23" cy="34" r="6" ' + MARK + '/><circle cx="41" cy="34" r="6" ' + MARK + '/>',
    blue: '<circle cx="32" cy="23" r="5.5" ' + MARK + '/><circle cx="22" cy="40" r="5.5" ' + MARK + '/><circle cx="42" cy="40" r="5.5" ' + MARK + '/>',
    orange: '<path d="M16 42L38 20M24 50L48 26M14 32L28 18" ' + LINE + '/>',
    green: '<path d="M13 38L23 27L33 40L43 27L52 37" ' + LINE + '/>',
    purple: '<circle cx="32" cy="34" r="13" ' + LINE + '/><circle cx="32" cy="34" r="3" fill="#fff"/>'
  };
  function blobSvg(id) {
    var c = RGB[id];
    return '<svg class="mx-svg" viewBox="0 0 64 64" aria-hidden="true"><path d="' + BLOB_D + '" fill="rgb(' + c.join(',') + ')" stroke="rgba(61,58,79,.3)" stroke-width="2"/>' +
      '<ellipse cx="22" cy="17" rx="6" ry="3.5" fill="#fff" opacity=".45" transform="rotate(-25 22 17)"/>' + PATTERN[id] + '</svg>';
  }
  var EYES = '<circle cx="39" cy="48" r="3" fill="#3d3a4f"/><circle cx="61" cy="48" r="3" fill="#3d3a4f"/><path d="M43 60Q50 67 57 60" fill="none" stroke="#3d3a4f" stroke-width="2.5" stroke-linecap="round"/>';
  var ANIMALS = {
    orange: '<svg class="mx-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M20 46L24 12L44 32ZM80 46L76 12L56 32Z" fill="#f59a3b"/><circle cx="50" cy="54" r="32" fill="#f59a3b"/><ellipse cx="50" cy="66" rx="17" ry="13" fill="#fff4e0"/>' + EYES + '<ellipse cx="50" cy="56" rx="4" ry="3" fill="#5b3a29"/></svg>',
    green: '<svg class="mx-svg" viewBox="0 0 100 100" aria-hidden="true"><circle cx="30" cy="30" r="14" fill="#5cb85c"/><circle cx="70" cy="30" r="14" fill="#5cb85c"/><ellipse cx="50" cy="58" rx="38" ry="30" fill="#5cb85c"/><circle cx="30" cy="30" r="7" fill="#fff"/><circle cx="70" cy="30" r="7" fill="#fff"/><circle cx="31" cy="31" r="3.5" fill="#3d3a4f"/><circle cx="69" cy="31" r="3.5" fill="#3d3a4f"/><path d="M28 62Q50 80 72 62" fill="none" stroke="#3d3a4f" stroke-width="3" stroke-linecap="round"/></svg>',
    purple: '<svg class="mx-svg" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="34" cy="22" rx="10" ry="22" fill="#9a63c9"/><ellipse cx="66" cy="22" rx="10" ry="22" fill="#9a63c9"/><ellipse cx="34" cy="24" rx="5" ry="15" fill="#e6c9f5"/><ellipse cx="66" cy="24" rx="5" ry="15" fill="#e6c9f5"/><circle cx="50" cy="58" r="32" fill="#9a63c9"/>' + EYES + '<ellipse cx="50" cy="54" rx="4" ry="3" fill="#f7a8c9"/></svg>'
  };
  var POT_SVG = '<svg class="mx-svg" viewBox="0 0 200 170" aria-hidden="true">' +
    '<defs><clipPath id="mx-clip"><path d="M20 50Q14 150 60 160H140Q186 150 180 50Z"/></clipPath></defs>' +
    '<ellipse cx="60" cy="164" rx="22" ry="6" fill="#8d89a3"/><ellipse cx="140" cy="164" rx="22" ry="6" fill="#8d89a3"/>' +
    '<ellipse cx="100" cy="50" rx="80" ry="16" fill="#e4e0f1"/>' +
    '<path d="M20 50Q14 150 60 160H140Q186 150 180 50Z" fill="#f4f2fb" fill-opacity=".75"/>' +
    '<g clip-path="url(#mx-clip)"><rect class="mx-liq" x="0" y="160" width="200" height="120" fill="#fff"/>' +
    '<ellipse class="mx-surf" cx="100" cy="160" rx="82" ry="15" fill="#fff"/></g>' +
    '<path d="M20 50Q14 150 60 160H140Q186 150 180 50" fill="none" stroke="#8d89a3" stroke-width="5" stroke-linejoin="round"/>' +
    '<ellipse cx="100" cy="50" rx="80" ry="16" fill="none" stroke="#8d89a3" stroke-width="5"/>' +
    '<path d="M36 80Q34 120 50 140" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/></svg>';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }
  function css(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'mx';
    root.innerHTML = '<div class="mx-shelf"></div><div class="mx-glow"></div><div class="mx-pot">' + POT_SVG + '</div>' +
      '<div class="mx-res"></div><div class="mx-animal"></div><div class="mx-splash"></div>';
    container.appendChild(root);
    var shelf = root.querySelector('.mx-shelf'), glow = root.querySelector('.mx-glow'), potEl = root.querySelector('.mx-pot');
    var liq = root.querySelector('.mx-liq'), surf = root.querySelector('.mx-surf');
    var resEl = root.querySelector('.mx-res'), animalEl = root.querySelector('.mx-animal'), splashEl = root.querySelector('.mx-splash');

    var items = BASE.map(function (id) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'mx-blob'; b.innerHTML = blobSvg(id);
      b.setAttribute('aria-label', NAMES[id] + ' plama. Przeciągnij do garnka lub naciśnij Enter.');
      root.appendChild(b);
      return { id: id, node: b, hx: 0, hy: 0, x: 0, y: 0, mode: 'home', t: 0, x0: 0, y0: 0, alpha: 1, fade: 0, scale: 1 };
    });

    var W = 320, H = 568, bs = 80, shelfH = 100, pot = { x: 0, y: 0, w: 160, h: 136 };
    // pot state: phase open|mix|glow|empty; first = colour already inside; lv = fill level 0..1 (tweened); col = liquid colour (numeric, tweened)
    var P = { phase: 'open', t: 0, first: null, result: null, set: {}, animal: null, same: -1,
      lv: 0, lv0: 0, lv1: 0, lvT: 1, lvD: 0.3, col: [255, 255, 255], c0: [255, 255, 255], c1: [255, 255, 255], cT: 1, cD: 0.25 };
    var splash = { t: -1, x: 0, y: 0, col: RGB.red };
    var alive = true, raf = 0, last = 0, drag = null, bobT = 0;

    function tweenLv(to, d) { P.lv0 = P.lv; P.lv1 = to; P.lvT = 0; P.lvD = d; }
    function tweenCol(to, d) { P.c0 = P.col.slice(); P.c1 = to.slice(); P.cT = 0; P.cD = d; }

    function layout() {
      var r = root.getBoundingClientRect();
      W = Math.max(280, r.width); H = Math.max(240, r.height);
      bs = H < 400 ? 72 : clamp(Math.min(W / 3.6, 100), 80, 100);
      shelfH = bs + 22;
      var areaTop = 56, areaH = H - shelfH - areaTop;
      var pw = Math.min(W * 0.5, (areaH - 8) * 200 / 170);
      pw = Math.max(pw, Math.min(W * 0.31, areaH * 200 / 170));
      pot.w = pw; pot.h = pw * 170 / 200; pot.x = (W - pw) / 2; pot.y = H - shelfH - 8 - pot.h;
      shelf.style.height = shelfH + 'px';
      potEl.style.width = pot.w + 'px'; potEl.style.height = pot.h + 'px';
      potEl.style.transform = 'translate(' + pot.x.toFixed(1) + 'px,' + pot.y.toFixed(1) + 'px)';
      var rs = clamp(pot.w * 0.5, 56, 130);
      resEl.style.width = resEl.style.height = rs + 'px';
      var an = clamp(Math.min(pot.w * 0.55, (W - pot.w) / 2 - 6), 56, 120);
      animalEl.style.width = animalEl.style.height = an + 'px';
      var slot = W / items.length;
      items.forEach(function (it, i) {
        it.hx = slot * (i + 0.5); it.hy = H - shelfH / 2 - 4;
        it.node.style.width = it.node.style.height = bs + 'px';
        if (it.mode === 'home' || it.mode === 'back') { it.mode = 'home'; it.x = it.hx; it.y = it.hy; }
      });
      render();
    }
    function potRect() { return { l: pot.x - 16, t: pot.y - pot.h * 0.35, r: pot.x + pot.w + 16, b: pot.y + pot.h + 8 }; }
    function overPot(x, y) { var r = potRect(); return x >= r.l && x <= r.r && y >= r.t && y <= r.b; }
    function mouth() { return [pot.x + pot.w / 2, pot.y + pot.h * 0.3]; }

    function render() {
      // pot contents
      var lv = P.lv, yTop = 160 - lv * 105;
      liq.setAttribute('y', yTop.toFixed(1)); surf.setAttribute('cy', yTop.toFixed(1));
      liq.setAttribute('fill', css(P.col));
      surf.setAttribute('fill', css([P.col[0] * 0.9 + 25, P.col[1] * 0.9 + 25, P.col[2] * 0.9 + 25]));
      surf.setAttribute('display', lv > 0.01 ? 'inline' : 'none');
      // glow
      var g = P.phase === 'glow' ? ease(P.t / 0.3) : P.phase === 'empty' ? 1 - ease(P.t / EMPTY_S) : 0;
      if (P.same >= 0) { g = Math.max(g, 0.6 * Math.sin(clamp(P.same / SAME_S, 0, 1) * Math.PI)); }
      var gw = pot.w * 1.6, gh = pot.h * 1.7;
      glow.style.width = gw.toFixed(0) + 'px'; glow.style.height = gh.toFixed(0) + 'px';
      glow.style.transform = 'translate(' + (pot.x + pot.w / 2 - gw / 2).toFixed(1) + 'px,' + (pot.y + pot.h * 0.45 - gh / 2).toFixed(1) + 'px)';
      glow.style.opacity = clamp(g, 0, 1).toFixed(3);
      // result blob and animal
      var ra = P.phase === 'glow' ? ease(P.t / 0.4) : P.phase === 'empty' ? 1 - ease(P.t / 0.5) : 0;
      var rs = parseFloat(resEl.style.width) || 80, bob = Math.sin(bobT * 2) * 4;
      resEl.style.opacity = ra.toFixed(3); resEl.style.visibility = ra <= 0.001 ? 'hidden' : 'visible';
      resEl.style.transform = 'translate(' + (pot.x + pot.w / 2 - rs / 2).toFixed(1) + 'px,' + (pot.y - rs * 0.45 + bob - (1 - ra) * 10).toFixed(1) + 'px) scale(' + (0.85 + 0.15 * ra).toFixed(3) + ')';
      var aa = P.animal ? (P.phase === 'glow' ? ease(P.t / 0.4) * (1 - ease((P.t - (GLOW_S - 0.4)) / 0.4)) : P.phase === 'mix' ? 0 : P.phase === 'empty' ? 0 : 0) : 0;
      var as = parseFloat(animalEl.style.width) || 80;
      animalEl.style.opacity = aa.toFixed(3); animalEl.style.visibility = aa <= 0.001 ? 'hidden' : 'visible';
      var ax = pot.x + pot.w + 4; if (ax + as > W - 2) { ax = W - 2 - as; }
      animalEl.style.transform = 'translate(' + ax.toFixed(1) + 'px,' + (pot.y + pot.h - as - Math.sin(bobT * 2.4) * 3 - (1 - aa) * 8).toFixed(1) + 'px)';
      // splash
      if (splash.t >= 0) {
        var u = splash.t / SPLASH_S, ss = 40 + 70 * ease(u);
        splashEl.style.width = splashEl.style.height = ss.toFixed(1) + 'px';
        splashEl.style.borderColor = css(splash.col);
        splashEl.style.opacity = (1 - ease(u)).toFixed(3);
        splashEl.style.transform = 'translate(' + (splash.x - ss / 2).toFixed(1) + 'px,' + (splash.y - ss * 0.2).toFixed(1) + 'px) scaleY(.4)';
      } else { splashEl.style.opacity = '0'; }
      var over = !!(drag && P.phase === 'open' && overPot(drag.it.x, drag.it.y));
      potEl.classList.toggle('mx-over', over);
      items.forEach(function (it) {
        it.node.style.opacity = it.alpha.toFixed(3);
        it.node.style.visibility = it.alpha <= 0.001 ? 'hidden' : 'visible';
        it.node.style.transform = 'translate(' + (it.x - bs / 2).toFixed(1) + 'px,' + (it.y - bs / 2 - (it.mode === 'drag' ? 10 : 0)).toFixed(1) + 'px) scale(' + it.scale.toFixed(3) + ')';
        it.node.classList.toggle('mx-lift', it.mode === 'drag');
      });
    }

    function setResult(id) {
      P.result = id; resEl.innerHTML = blobSvg(id);
      resEl.setAttribute('role', 'img'); resEl.setAttribute('aria-label', 'Nowy kolor');
    }
    function startGlow() {
      P.phase = 'glow'; P.t = 0; P.same = -1;
      report(function (A) { A.complete(); });
      P.set[P.result] = true; P.animal = null;
      if (P.set.orange && P.set.green && P.set.purple) { P.animal = P.result; animalEl.innerHTML = ANIMALS[P.result]; P.set = {}; }
    }
    function drop(it) {
      report(function (A) { A.track('interaction', { variant: it.id }); });
      if (P.phase !== 'open' || it.mode === 'fly') { giveBack(it); return; }
      var m = mouth(), c = RGB[it.id];
      it.mode = 'fly'; it.t = 0; it.x0 = it.x; it.y0 = it.y;
      splash.col = c; splash.x = m[0]; splash.y = m[1] + pot.h * 0.05; splash.t = -FLY_S;
      if (!P.first) { P.first = it.id; tweenCol(c, 0.3); tweenLv(0.4, 0.3); }
      else if (P.first === it.id) { tweenLv(0.55, 0.3); P.same = -FLY_S; }
      else {
        var key = [P.first, it.id].sort().join('+');
        setResult(MIX[key]);
        P.phase = 'mix'; P.t = 0; tweenLv(0.55, 0.3); tweenCol(RGB[P.result], MIX_S);
      }
    }
    function giveBack(it) { it.mode = 'back'; it.t = 0; it.x0 = it.x; it.y0 = it.y; }

    function step(dt) {
      bobT += dt; P.t += dt;
      if (P.phase === 'mix' && P.t >= MIX_S) { P.col = RGB[P.result].slice(); startGlow(); }
      else if (P.phase === 'glow' && P.t >= GLOW_S) { P.phase = 'empty'; P.t = 0; tweenLv(0, EMPTY_S); }
      else if (P.phase === 'empty' && P.t >= EMPTY_S) { P.phase = 'open'; P.t = 0; P.first = null; P.result = null; P.animal = null; P.lv = 0; P.lvT = 1; P.col = [255, 255, 255]; P.cT = 1; }
      if (P.lvT < 1) { P.lvT = Math.min(1, P.lvT + dt / P.lvD); P.lv = P.lv0 + (P.lv1 - P.lv0) * ease(P.lvT); }
      if (P.cT < 1) {
        P.cT = Math.min(1, P.cT + dt / P.cD); var e = ease(P.cT);
        P.col = [0, 1, 2].map(function (k) { return P.c0[k] + (P.c1[k] - P.c0[k]) * e; });
      }
      if (P.same !== -1) { P.same += dt; if (P.same >= SAME_S) { P.same = -1; } }   // -1 = idle, negative start = short delay for the flight
      if (splash.t !== -1) { splash.t += dt; if (splash.t >= SPLASH_S) { splash.t = -1; } }
      items.forEach(function (it) {
        if (it.mode === 'back') {
          it.t += dt; var e2 = ease(it.t / BACK_S);
          it.x = it.x0 + (it.hx - it.x0) * e2; it.y = it.y0 + (it.hy - it.y0) * e2;
          if (it.t >= BACK_S) { it.mode = 'home'; it.x = it.hx; it.y = it.hy; }
        } else if (it.mode === 'fly') {
          it.t += dt; var f = ease(it.t / FLY_S), tg = mouth();
          it.x = it.x0 + (tg[0] - it.x0) * f; it.y = it.y0 + (tg[1] - it.y0) * f; it.scale = 1 - 0.6 * f;
          if (it.t >= FLY_S) { it.mode = 'home'; it.x = it.hx; it.y = it.hy; it.scale = 1; it.alpha = 0; it.fade = 0.0001; }
        }
        if (it.fade > 0) { it.fade += dt; it.alpha = clamp(it.fade / FADE_S, 0, 1); if (it.fade >= FADE_S) { it.fade = 0; it.alpha = 1; } }
      });
    }
    function busy() {
      if (P.phase !== 'open' || P.lvT < 1 || P.cT < 1 || P.same !== -1 || splash.t !== -1) { return true; }
      return items.some(function (it) { return it.mode === 'back' || it.mode === 'fly' || it.fade > 0; });
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

    function localPt(e) { var r = root.getBoundingClientRect(); return [clamp(e.clientX - r.left, 0, W), clamp(e.clientY - r.top, 0, H)]; }
    items.forEach(function (it) {
      var b = it.node;
      b.addEventListener('pointerdown', function (e) {
        if (drag || it.mode !== 'home' && it.mode !== 'back') { return; }
        drag = { id: e.pointerId, it: it };
        it.mode = 'drag'; try { b.setPointerCapture(e.pointerId); } catch (x) { /* unsupported */ }
        var p = localPt(e); it.x = p[0]; it.y = p[1]; render(); e.preventDefault();
      });
      b.addEventListener('pointermove', function (e) {
        if (!drag || drag.it !== it || e.pointerId !== drag.id) { return; }
        var p = localPt(e); it.x = p[0]; it.y = p[1]; render();
      });
      b.addEventListener('pointerup', function (e) {
        if (!drag || drag.it !== it || e.pointerId !== drag.id) { return; }
        drag = null;
        try { b.releasePointerCapture(e.pointerId); } catch (x) { /* already released */ }
        if (overPot(it.x, it.y)) { drop(it); } else { giveBack(it); }
        render(); start();
      });
      b.addEventListener('pointercancel', function (e) {
        if (!drag || drag.it !== it || e.pointerId !== drag.id) { return; }
        drag = null; giveBack(it); render(); start();
      });
      b.addEventListener('click', function (e) {
        if (e.detail !== 0 || it.mode !== 'home' && it.mode !== 'back') { return; }   // pointer taps are handled above
        var m = mouth(); it.x = m[0]; it.y = m[1] + 20; drop(it); render(); start();
      });
    });

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    layout();
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

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'mieszanie') { a.mount = mount; } });
})();
