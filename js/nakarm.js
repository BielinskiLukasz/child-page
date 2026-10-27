// Activity "Nakarm Pieska": a hungry dog of a random breed (window.Dogs) sits next to an empty bowl; four items lie on a table: a bone,
// a bowl of dog food, a bowl of water and a carrot. Dragging a dog-friendly item to the dog or its bowl: it is eaten with a happy chew
// (1.5 s), then a heart rises and the dog wags (1 s). The carrot is gently refused by a head shake and drifts back to the table in 0.5 s;
// so does any item dropped elsewhere or while the dog is busy. Each friendly item is given once per round; after 3 different items the
// dog yawns, lies down with a soft glow for 3 s, walks off and a new breed arrives (never the same twice in a row), the items return.
// Dragging over the dog or bowl shows a glowing outline (non-colour cue). Keyboard: Tab to an item, Enter/Space gives it to the dog.
// One capped-dt rAF loop (final states are set from JS, never only in CSS keyframes), pauses while hidden and stops when idle.
// Nothing is scored or stored. Usage metrics: track('interaction', {variant: breed}) per give attempt, complete() when the dog is full;
// the activity stays open-ended (a new round starts by itself).
(function () {
  var CHEW_S = 1.5, WAG_S = 1.0, SHAKE_S = 0.9, YAWN_S = 1.0, LIE_S = 3.0, OUT_S = 0.5, IN_S = 0.7, BACK_S = 0.5, FLY_S = 0.3, FADE_S = 0.5;
  var NAME_H = 18, ROUND_ITEMS = 3, YARD_TOP = 56;
  var KINDS = [
    { id: 'bone', label: 'Kość', ok: true },
    { id: 'food', label: 'Miska karmy', ok: true },
    { id: 'water', label: 'Woda', ok: true },
    { id: 'carrot', label: 'Marchewka', ok: false }
  ];
  var ICONS = {
    bone: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 26a8 8 0 1 1 7-12l16 0a8 8 0 1 1 7 12 8 8 0 1 1-7 12l-16 0a8 8 0 1 1-7-12z" transform="rotate(-35 32 32) translate(0 6)" fill="#fbf1dc" stroke="#d9c49c" stroke-width="2.5"/></svg>',
    food: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 32h52q0 20-12 24H18Q6 52 6 32z" fill="#f7a8c9"/><path d="M8 32h48" stroke="#e58bb0" stroke-width="3"/><path d="M12 32q4-12 10-6t10-8 10 8 8-4q4 6 0 10z" fill="#b57b4d"/><circle cx="22" cy="24" r="3" fill="#8d5e38"/><circle cx="36" cy="20" r="3" fill="#8d5e38"/><circle cx="46" cy="26" r="3" fill="#8d5e38"/></svg>',
    water: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 32h52q0 20-12 24H18Q6 52 6 32z" fill="#9fd0f0"/><path d="M8 32h48" stroke="#6fb2e0" stroke-width="3"/><ellipse cx="32" cy="32" rx="25" ry="6" fill="#c9e8fb"/><path d="M32 6c7 9 10 14 10 19a10 10 0 0 1-20 0c0-5 3-10 10-19z" fill="#6fb8ec"/><path d="M27 24a5 5 0 0 0 3 6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
    carrot: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M36 20l16 24Q46 56 20 58 8 58 8 52q0-24 28-32z" transform="rotate(-20 32 36)" fill="#f4a261"/><path d="M24 40l6 2M30 32l6 2M20 50l6 1" stroke="#e08a45" stroke-width="2" stroke-linecap="round" transform="rotate(-20 32 36)"/><path d="M40 16q-4-9 2-12M44 18q4-8 10-6M46 22q8-2 10 4" fill="none" stroke="#7fc26b" stroke-width="4" stroke-linecap="round"/></svg>'
  };
  var BOWL_SVG = '<svg viewBox="0 0 80 40" aria-hidden="true"><path d="M4 8h72q0 24-16 28H20Q4 32 4 8z" fill="#f2b8cf"/><ellipse cx="40" cy="8" rx="36" ry="6" fill="#f9d3e1"/><ellipse cx="40" cy="9" rx="28" ry="3.5" fill="#fbe7ef"/></svg>';
  var lastBreed = '';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }
  function pickBreed(except) {
    var list = window.Dogs.LIST, d;
    do { d = list[Math.floor(Math.random() * list.length)]; } while (d.id === except && list.length > 1);
    return d;
  }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'nk';
    root.innerHTML =
      '<svg class="nk-sky" viewBox="0 0 400 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<circle cx="330" cy="34" r="16" fill="#ffe27a"/><ellipse cx="80" cy="34" rx="34" ry="11" fill="#fff"/><ellipse cx="106" cy="28" rx="20" ry="10" fill="#fff"/>' +
      '<rect x="26" y="66" width="6" height="34" rx="3" fill="#b98963"/><circle cx="29" cy="58" r="16" fill="#a9d98f"/></svg>' +
      '<div class="nk-yard"></div><div class="nk-table"></div>' +
      '<div class="nk-glow"></div>' +
      '<button type="button" class="nk-dog"><span class="nk-art"></span><span class="nk-name"></span></button>' +
      '<div class="nk-bowl">' + BOWL_SVG + '</div>' +
      '<div class="nk-heart"></div>';
    container.appendChild(root);
    var yard = root.querySelector('.nk-yard'), table = root.querySelector('.nk-table'), glow = root.querySelector('.nk-glow');
    var dogBtn = root.querySelector('.nk-dog'), art = root.querySelector('.nk-art'), nameEl = root.querySelector('.nk-name');
    var bowl = root.querySelector('.nk-bowl'), heartEl = root.querySelector('.nk-heart');
    heartEl.innerHTML = '<svg viewBox="0 0 32 30" aria-hidden="true"><path d="M16 28C4 19 1 13 1 9a7 7 0 0 1 15-3a7 7 0 0 1 15 3c0 4-3 10-15 19z" fill="#f48aa8"/></svg>';
    dogBtn.setAttribute('tabindex', '-1');   // the dog is only a drop target; items are the keyboard stops

    var items = KINDS.map(function (k) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'nk-item'; b.innerHTML = ICONS[k.id];
      b.setAttribute('aria-label', k.label + '. Przeciągnij do pieska lub naciśnij Enter, aby go poczęstować.');
      root.appendChild(b);
      return { kind: k, node: b, hx: 0, hy: 0, x: 0, y: 0, mode: 'home', t: 0, x0: 0, y0: 0, given: false, alpha: 1, fade: 0, scale: 1 };
    });

    var W = 320, H = 568, dw = 150, dh = 125, isz = 64, bw = 70, bh = 56;
    var dog = { cx: 0, by: 0, breed: null, phase: 'wait', t: 0, off: 0, calm: null, hap: null, head: null, tail: null, tailP: [0, 0], headP: [0, 0],
      given: 0, happy: false, wag: 0, lastItem: null, glow: 0 };
    var heartT = -1, heartX = 0, heartY = 0;
    var alive = true, raf = 0, last = 0, drag = null;

    // ---- geometry -------------------------------------------------------------------------------------------
    function layout() {
      var r = root.getBoundingClientRect();
      W = Math.max(280, r.width); H = Math.max(240, r.height);
      isz = clamp(Math.min(W / 4.6, H * 0.17), 60, 100);
      var tH = isz + 40, yardH = H - tH - YARD_TOP;
      table.style.height = tH + 'px'; yard.style.top = YARD_TOP + 'px'; yard.style.bottom = tH + 'px';
      dw = Math.min(W * 0.52, (yardH - NAME_H - 24) * 1.2, 220); dh = dw * 5 / 6;
      bw = Math.max(64, dw * 0.46); bh = Math.max(56, bw * 0.5);
      var gw = dw + bw * 0.9, x0 = (W - gw) / 2;
      dog.cx = x0 + dw / 2; dog.by = YARD_TOP + yardH - 6;
      dogBtn.style.width = Math.max(56, dw) + 'px'; dogBtn.style.height = (dh + NAME_H) + 'px';
      art.style.width = dw + 'px'; art.style.height = dh + 'px';
      bowl.style.width = bw + 'px'; bowl.style.height = bh + 'px';
      bowl.dataset.x = String(x0 + dw + bw * 0.45 - bw / 2 + bw * 0.1); bowl.dataset.y = String(dog.by - NAME_H - bh * 0.8);
      var slot = W / items.length;
      items.forEach(function (it, i) {
        it.hx = slot * (i + 0.5); it.hy = H - tH / 2 - 4;
        it.node.style.width = it.node.style.height = isz + 'px';
        if (it.mode === 'home' || it.mode === 'back') { it.mode = 'home'; it.x = it.hx; it.y = it.hy; }
      });
      render();
    }
    function dogRect() {
      var w = Math.max(56, dw) + 24, left = dog.cx - w / 2 + dog.off, top = dog.by - NAME_H - dh - 12;
      return { l: left, t: top, r: left + w, b: dog.by + 12 };
    }
    function bowlRect() {
      var x = +bowl.dataset.x, y = +bowl.dataset.y;
      return { l: x - 14, t: y - 14, r: x + bw + 14, b: y + bh + 14 };
    }
    function inside(r, x, y) { return x >= r.l && x <= r.r && y >= r.t && y <= r.b; }
    function overDog(x, y) { return inside(dogRect(), x, y) || inside(bowlRect(), x, y); }
    function mouthPt() { return [dog.cx + dw * 0.4 + dog.off, dog.by - NAME_H - dh * 0.3]; }
    function bowlPt() { return [+bowl.dataset.x + bw / 2, +bowl.dataset.y + bh * 0.3]; }
    function accepting() { return dog.phase === 'wait'; }

    // ---- dog look -------------------------------------------------------------------------------------------
    function setBreed(d) {
      dog.breed = d; lastBreed = d.id;
      art.innerHTML = window.Dogs.draw(d.id);
      dog.calm = art.querySelector('.dg-calm'); dog.hap = art.querySelector('.dg-happy'); dog.tail = art.querySelector('.dg-tail');
      dog.head = art.querySelector('.dg-head'); var ears = art.querySelector('.dg-ears');
      dog.tailP = dog.tail ? [+dog.tail.getAttribute('data-px'), +dog.tail.getAttribute('data-py')] : [0, 0];
      dog.headP = ears ? [+ears.getAttribute('data-px') + 4, +ears.getAttribute('data-py') + 9] : [80, 50];
      nameEl.textContent = d.name;
      dogBtn.setAttribute('aria-label', 'Piesek: ' + d.name);
      setMood(false);
    }
    function setMood(on) {
      dog.happy = on;
      if (dog.hap) { dog.hap.setAttribute('display', on ? 'inline' : 'none'); dog.calm.setAttribute('display', on ? 'none' : 'inline'); }
    }
    function rot(node, a, p, dy) {
      if (!node) { return; }
      node.setAttribute('transform', (dy ? 'translate(0 ' + dy.toFixed(2) + ') ' : '') + (a ? 'rotate(' + a.toFixed(2) + ' ' + p[0] + ' ' + p[1] + ')' : ''));
    }

    // ---- rendering ------------------------------------------------------------------------------------------
    function render() {
      var px = dog.cx + dog.off, w = Math.max(56, dw);
      dogBtn.style.transform = 'translate(' + (px - w / 2).toFixed(1) + 'px,' + (dog.by - NAME_H - dh).toFixed(1) + 'px)';
      bowl.style.transform = 'translate(' + (+bowl.dataset.x).toFixed(1) + 'px,' + (+bowl.dataset.y).toFixed(1) + 'px)';
      var squash = 1, drop = 0, tilt = 0, shakeA = 0, headA = 0, headDy = 0, tailA = 0, ph = dog.phase, t = dog.t;
      if (ph === 'eat') { headDy = Math.abs(Math.sin(t * 9)) * 3; headA = 6 * Math.sin(t * 9); tailA = 14 * Math.sin(t * 12); }
      else if (ph === 'wag') { tailA = 26 * Math.sin(t * 14) * Math.min(1, (WAG_S - t) / 0.3 + 0.0001) ; }
      else if (ph === 'shake') { headA = 16 * Math.sin(t / SHAKE_S * Math.PI * 6) * (1 - t / SHAKE_S); }
      else if (ph === 'yawn') { headA = -16 * Math.sin(Math.min(1, t / YAWN_S) * Math.PI); }
      else if (ph === 'lie' || ph === 'out') { squash = 0.8; drop = dh * 0.1; }
      if (ph === 'yawn') { var u = ease(t / YAWN_S); squash = 1 - 0.2 * u; drop = dh * 0.1 * u; }
      art.style.transform = 'translateY(' + drop.toFixed(1) + 'px) scaleY(' + squash.toFixed(3) + ')';
      rot(dog.head, headA, dog.headP, headDy); rot(dog.tail, tailA, dog.tailP);
      var g = ph === 'lie' ? 1 : ph === 'yawn' ? ease(t / YAWN_S) * 0.4 : ph === 'out' ? 1 - ease(t / OUT_S) : 0;
      glow.style.opacity = g.toFixed(3);
      glow.style.width = (dw * 1.7).toFixed(0) + 'px'; glow.style.height = (dw * 1.2).toFixed(0) + 'px';
      glow.style.transform = 'translate(' + (px - dw * 0.85).toFixed(1) + 'px,' + (dog.by - dh * 1.05).toFixed(1) + 'px)';
      var o = ph === 'out' ? 1 - ease(t / OUT_S) : 1;
      dogBtn.style.opacity = o.toFixed(3); heartEl.style.opacity = '0';
      if (heartT >= 0) {
        var hu = heartT / (WAG_S + 0.6);
        heartEl.style.transform = 'translate(' + (heartX - 22).toFixed(1) + 'px,' + (heartY - 44 - 50 * ease(hu)).toFixed(1) + 'px) scale(' + (0.6 + 0.4 * Math.min(1, hu * 4)).toFixed(2) + ')';
        heartEl.style.opacity = (hu < 0.7 ? 1 : (1 - hu) / 0.3).toFixed(3);
      }
      // outline cue while dragging over the dog/bowl
      var over = !!(drag && accepting() && overDog(drag.it.x, drag.it.y));
      dogBtn.classList.toggle('nk-over', over); bowl.classList.toggle('nk-over', over);
      items.forEach(function (it) {
        var a = it.alpha, s = it.scale;
        it.node.style.opacity = a.toFixed(3);
        it.node.style.visibility = a <= 0.001 ? 'hidden' : 'visible';
        it.node.style.transform = 'translate(' + (it.x - isz / 2).toFixed(1) + 'px,' + (it.y - isz / 2 - (it.mode === 'drag' ? 10 : 0)).toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
        it.node.classList.toggle('nk-lift', it.mode === 'drag');
        it.node.disabled = it.given && it.alpha <= 0.001;
      });
    }

    // ---- behaviour ------------------------------------------------------------------------------------------
    function giveBack(it) { it.mode = 'back'; it.t = 0; it.x0 = it.x; it.y0 = it.y; }
    function give(it) {
      report(function (A) { A.track('interaction', { variant: dog.breed.id }); });
      if (!accepting() || it.given) { giveBack(it); start(); return; }
      if (!it.kind.ok) {
        giveBack(it); dog.phase = 'shake'; dog.t = 0; start(); return;
      }
      it.mode = 'fly'; it.t = 0; it.x0 = it.x; it.y0 = it.y; it.given = true; dog.lastItem = it;
      dog.phase = 'eat'; dog.t = -FLY_S; dog.given++; setMood(true);
      start();
    }
    function newRound() {
      items.forEach(function (it) { it.given = false; it.mode = 'home'; it.x = it.hx; it.y = it.hy; it.scale = 1; it.alpha = 0; it.fade = 0.0001; it.node.disabled = false; });
      dog.given = 0;
    }

    function step(dt) {
      var ph = dog.phase;
      dog.t += dt;
      if (ph === 'eat') {
        if (dog.t >= CHEW_S) { dog.phase = 'wag'; dog.t = 0; var d = mouthPt(); heartT = 0; heartX = d[0]; heartY = d[1] - dh * 0.3; }
      } else if (ph === 'wag') {
        if (dog.t >= WAG_S) {
          setMood(false);
          if (dog.given >= ROUND_ITEMS) { dog.phase = 'yawn'; dog.t = 0; setMood(true); report(function (A) { A.complete(); }); }
          else { dog.phase = 'wait'; dog.t = 0; }
        }
      } else if (ph === 'shake') {
        if (dog.t >= SHAKE_S) { dog.phase = 'wait'; dog.t = 0; rot(dog.head, 0, dog.headP); }
      } else if (ph === 'yawn') {
        if (dog.t >= YAWN_S) { dog.phase = 'lie'; dog.t = 0; setMood(false); }
      } else if (ph === 'lie') {
        if (dog.t >= LIE_S) { dog.phase = 'out'; dog.t = 0; }
      } else if (ph === 'out') {
        dog.off = -W * 0.5 * ease(dog.t / OUT_S);
        if (dog.t >= OUT_S) { setBreed(pickBreed(dog.breed.id)); newRound(); dog.phase = 'in'; dog.t = 0; dog.off = -W * 0.5; }
      } else if (ph === 'in') {
        dog.off = -W * 0.5 * (1 - ease(dog.t / IN_S));
        if (dog.t >= IN_S) { dog.off = 0; dog.phase = 'wait'; dog.t = 0; }
      }
      items.forEach(function (it) {
        if (it.mode === 'back') {
          it.t += dt; var e = ease(it.t / BACK_S);
          it.x = it.x0 + (it.hx - it.x0) * e; it.y = it.y0 + (it.hy - it.y0) * e;
          if (it.t >= BACK_S) { it.mode = 'home'; it.x = it.hx; it.y = it.hy; }
        } else if (it.mode === 'fly') {
          it.t += dt; var f = ease(it.t / FLY_S), tg = it.kind.id === 'bone' ? mouthPt() : bowlPt();
          it.x = it.x0 + (tg[0] - it.x0) * f; it.y = it.y0 + (tg[1] - it.y0) * f; it.scale = 1 - 0.7 * f;
          if (it.t >= FLY_S) { it.mode = 'gone'; it.alpha = 0; it.scale = 1; }
        }
        if (it.fade > 0) { it.fade += dt; it.alpha = clamp(it.fade / FADE_S, 0, 1); if (it.fade >= FADE_S) { it.fade = 0; it.alpha = 1; } }
      });
      if (heartT >= 0) { heartT += dt; if (heartT >= WAG_S + 0.6) { heartT = -1; } }
    }
    function busy() {
      if (dog.phase !== 'wait' || heartT >= 0) { return true; }
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

    // ---- input ----------------------------------------------------------------------------------------------
    function localPt(e) { var r = root.getBoundingClientRect(); return [clamp(e.clientX - r.left, 0, W), clamp(e.clientY - r.top, 0, H)]; }
    items.forEach(function (it) {
      var b = it.node;
      b.addEventListener('pointerdown', function (e) {
        if (drag || it.given || (it.mode !== 'home' && it.mode !== 'back')) { return; }
        drag = { id: e.pointerId, it: it, moved: false };
        it.mode = 'drag'; try { b.setPointerCapture(e.pointerId); } catch (x) { /* unsupported */ }
        var p = localPt(e); it.x = p[0]; it.y = p[1]; render(); e.preventDefault();
      });
      b.addEventListener('pointermove', function (e) {
        if (!drag || drag.it !== it || e.pointerId !== drag.id) { return; }
        var p = localPt(e); it.x = p[0]; it.y = p[1]; drag.moved = true; render();
      });
      b.addEventListener('pointerup', function (e) {
        if (!drag || drag.it !== it || e.pointerId !== drag.id) { return; }
        drag = null;
        try { b.releasePointerCapture(e.pointerId); } catch (x) { /* already released */ }
        if (overDog(it.x, it.y)) { give(it); } else { giveBack(it); start(); }
        render();
      });
      b.addEventListener('pointercancel', function (e) {
        if (!drag || drag.it !== it || e.pointerId !== drag.id) { return; }
        drag = null; giveBack(it); render(); start();
      });
      b.addEventListener('click', function (e) {
        if (e.detail !== 0 || it.given || (it.mode !== 'home' && it.mode !== 'back')) { return; }   // pointer taps are handled above
        var m = bowlPt(); it.x = m[0]; it.y = m[1] + 30; give(it); render();
      });
    });

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    setBreed(pickBreed(lastBreed));
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

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'nakarm') { a.mount = mount; } });
})();
