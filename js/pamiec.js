// Activity "Pamięć": a gentle memory game with 3 pairs of large picture cards (6 cards, 2x3 portrait / 3x2 landscape).
// Touch a card to turn it over (~0.6 s). Two matching cards glow and stay open; two different cards turn back after
// ~1.5 s with no shake, red or message. When all pairs are found the cards glow ~3 s, then ~4 s later they turn back
// and shuffle gently for a new round with a different picture set (3 sets cycle). Under prefers-reduced-motion cards
// cross-fade instead of turning. One capped-dt rAF loop (pauses when hidden, stops when idle); fixed DOM of 6 buttons.
(function () {
  var FLIP_S = 0.6, BACK_AFTER_S = 1.5, GLOW_S = 3, NEXT_AT_S = 7, SHUFFLE_S = 0.8;
  var P = {
    cat: { label: 'kotek', svg: '<path d="M26 44L28 18L46 32ZM74 44L72 18 54 32Z" fill="#f7d6b4"/><circle cx="50" cy="56" r="28" fill="#f7d6b4"/>' +
      '<circle cx="40" cy="52" r="3.4" fill="#5b5675"/><circle cx="60" cy="52" r="3.4" fill="#5b5675"/><ellipse cx="50" cy="62" rx="4" ry="3" fill="#e59aa8"/>' },
    fish: { label: 'rybka', svg: '<ellipse cx="44" cy="52" rx="30" ry="20" fill="#a8dcd0"/><path d="M68 52L92 32V72Z" fill="#a8dcd0"/><path d="M32 36Q44 18 58 36Z" fill="#8ccabc"/>' +
      '<circle cx="28" cy="48" r="3.4" fill="#5b5675"/>' },
    flower: { label: 'kwiatek', svg: '<path d="M50 92V58" stroke="#7fbf8f" stroke-width="5" stroke-linecap="round"/><g fill="#f7a8c9"><circle cx="50" cy="32" r="13"/><circle cx="34" cy="46" r="13"/>' +
      '<circle cx="66" cy="46" r="13"/><circle cx="38" cy="30" r="13"/><circle cx="62" cy="30" r="13"/></g><circle cx="50" cy="40" r="10" fill="#ffe9a8"/>' },
    bird: { label: 'ptaszek', svg: '<path d="M22 54L6 44L10 66Z" fill="#ffd98a"/><ellipse cx="46" cy="58" rx="26" ry="22" fill="#ffd98a"/><circle cx="68" cy="36" r="14" fill="#ffd98a"/>' +
      '<path d="M78 34L94 39L78 44Z" fill="#f7a8c9"/><circle cx="71" cy="33" r="2.8" fill="#5b5675"/>' },
    pear: { label: 'gruszka', svg: '<path d="M50 14Q62 14 62 30Q62 38 70 52Q80 76 50 90Q20 76 30 52Q38 38 38 30Q38 14 50 14Z" fill="#d6ec9a"/>' +
      '<path d="M50 16Q52 8 58 6" stroke="#8a6a4a" stroke-width="3" stroke-linecap="round" fill="none"/><ellipse cx="62" cy="14" rx="8" ry="4" fill="#9fd4a8"/>' },
    cloud: { label: 'chmurka', svg: '<g fill="#cfe6f7"><circle cx="34" cy="58" r="18"/><circle cx="54" cy="46" r="22"/><circle cx="72" cy="60" r="16"/><rect x="18" y="58" width="68" height="18" rx="9"/></g>' },
    heart: { label: 'serduszko', svg: '<path d="M50 86C16 60 12 36 30 26C42 20 48 28 50 36C52 28 58 20 70 26C88 36 84 60 50 86Z" fill="#f7b0c4"/>' },
    star: { label: 'gwiazdka', svg: '<path d="M50 10L61 38L91 38L67 56L76 87L50 69L24 87L33 56L9 38L39 38Z" fill="#ffe08a" stroke="#ffe08a" stroke-width="4" stroke-linejoin="round"/>' },
    house: { label: 'domek', svg: '<rect x="20" y="44" width="60" height="44" rx="5" fill="#f6dcc8"/><path d="M12 48L50 14L88 48Z" fill="#c9a0c0" stroke="#c9a0c0" stroke-width="5" stroke-linejoin="round"/>' +
      '<rect x="42" y="62" width="16" height="26" rx="8" fill="#b99a86"/>' }
  };
  var SETS = [['cat', 'fish', 'flower'], ['bird', 'pear', 'cloud'], ['heart', 'star', 'house']];
  var BACK = '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><rect x="3" y="3" width="94" height="94" rx="18" fill="#c9b8f2"/>' +
    '<rect x="10" y="10" width="80" height="80" rx="12" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>' +
    '<g fill="#fff" fill-opacity=".7"><circle cx="50" cy="50" r="9"/><circle cx="30" cy="30" r="4"/><circle cx="70" cy="30" r="4"/><circle cx="30" cy="70" r="4"/><circle cx="70" cy="70" r="4"/></g></svg>';

  function front(key) {
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><rect x="3" y="3" width="94" height="94" rx="18" fill="#fff"/>' + P[key].svg + '</svg>';
  }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function shuffled(a) {
    a = a.slice();
    for (var j = a.length - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var t = a[j]; a[j] = a[k]; a[k] = t; }
    return a;
  }

  function mount(container) {
    container.style.display = 'block';
    var board = document.createElement('div');
    board.className = 'pm';
    board.innerHTML = '<div class="pm-field"></div>';
    container.appendChild(board);
    var field = board.querySelector('.pm-field');

    var setIdx = 0, deck = [], cards = [], sel = [];
    var phase = 'play', phaseT = 0, backT = 0, glow = 0, shuf = null, raf = 0, last = 0;
    var C = 120, pos = [];

    for (var i = 0; i < 6; i++) {
      (function (i) {
        var el = document.createElement('button');
        el.type = 'button'; el.className = 'pm-card';
        el.setAttribute('aria-pressed', 'false');
        el.innerHTML = '<span class="pm-back">' + BACK + '</span><span class="pm-front"></span>';
        field.appendChild(el);
        var c = { i: i, el: el, backEl: el.firstChild, frontEl: el.lastChild, f: 0, t: 0, matched: false, g: 0, key: '', op: 1 };
        cards.push(c);
        el.addEventListener('click', function () { touch(c); });
      })(i);
    }
    function deal() {
      var keys = SETS[setIdx];
      deck = shuffled([keys[0], keys[0], keys[1], keys[1], keys[2], keys[2]]);
      cards.forEach(function (c, i) {
        c.key = deck[i]; c.f = 0; c.t = 0; c.matched = false; c.g = 0;
        c.frontEl.innerHTML = front(c.key);
        c.el.setAttribute('aria-label', 'Karta (zakryta)');
        c.el.setAttribute('aria-pressed', 'false');
      });
      sel = [];
    }

    function touch(c) {
      if (phase !== 'play' || c.t === 1 || c.f !== c.t || sel.length >= 2) { return; }
      c.t = 1; sel.push(c);
      c.el.setAttribute('aria-pressed', 'true');
      c.el.setAttribute('aria-label', 'Karta: ' + P[c.key].label);
      start();
    }

    function paintCard(c) {
      var rm = reduced(), f = smooth(c.f), x = pos[c.i] || [0, 0];
      var sx = rm ? 1 : Math.abs(1 - 2 * f);
      c.el.style.transform = 'translate(' + (x[0] - C / 2) + 'px,' + (x[1] - C / 2) + 'px) scaleX(' + Math.max(0.001, sx).toFixed(3) + ')';
      var showFront = rm ? f : (f >= 0.5 ? 1 : 0);
      c.frontEl.style.opacity = showFront.toFixed(3);
      c.backEl.style.opacity = (rm ? 1 - f : 1 - showFront).toFixed(3);
      c.el.style.opacity = c.op.toFixed(3);
      var g = Math.max(c.g, glow * (c.f >= 1 ? 1 : 0));
      c.el.style.filter = g > 0.01 ? 'drop-shadow(0 0 ' + (6 + 14 * g) + 'px #ffe08a)' : '';
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      var busy = false, rate = dt / (reduced() ? FLIP_S * 0.6 : FLIP_S);
      cards.forEach(function (c) {
        if (c.f !== c.t) {
          c.f += c.t > c.f ? rate : -rate;
          if ((c.t === 1 && c.f >= 1) || (c.t === 0 && c.f <= 0)) { c.f = c.t; }
          busy = true;
        }
        var gt = c.matched ? 1 : 0;
        if (Math.abs(c.g - gt) > 0.005) { c.g += (gt - c.g) * Math.min(1, dt / 0.4); busy = true; } else { c.g = gt; }
      });
      if (phase === 'play') {
        if (sel.length === 2 && sel[0].f === 1 && sel[1].f === 1) {
          if (sel[0].key === sel[1].key) {
            sel.forEach(function (c) { c.matched = true; });
            sel = [];
            if (cards.every(function (c) { return c.matched; })) { phase = 'glow'; phaseT = 0; }
          } else {
            backT += dt;
            if (backT >= BACK_AFTER_S) {
              backT = 0;
              sel.forEach(function (c) { c.t = 0; c.el.setAttribute('aria-pressed', 'false'); c.el.setAttribute('aria-label', 'Karta (zakryta)'); });
              phase = 'turnback';
            }
          }
          busy = true;
        } else if (sel.length === 2) { busy = true; }
      } else if (phase === 'turnback') {
        busy = true;
        if (cards.every(function (c) { return c.f === c.t; })) { sel = []; phase = 'play'; }
      } else if (phase === 'glow') {
        phaseT += dt; busy = true;
        glow = phaseT < GLOW_S ? Math.min(1, phaseT / 0.5) : Math.max(0, 1 - (phaseT - GLOW_S) / 0.5);
        if (phaseT >= NEXT_AT_S) {
          phase = 'close'; glow = 0;
          cards.forEach(function (c) { c.t = 0; c.matched = false; });
        }
      } else if (phase === 'close') {
        busy = true;
        if (cards.every(function (c) { return c.f === 0; })) { phase = 'shuffle'; shuf = { t: 0, done: false }; }
      } else if (phase === 'shuffle') {
        busy = true; shuf.t += dt;
        var u = shuf.t / SHUFFLE_S;
        if (u >= 0.5 && !shuf.done) { shuf.done = true; setIdx = (setIdx + 1) % SETS.length; deal(); }
        var op = u >= 1 ? 1 : u < 0.5 ? 1 - u * 1.6 : 0.2 + (u - 0.5) * 1.6;
        cards.forEach(function (c) { c.op = op; });
        if (u >= 1) { phase = 'play'; shuf = null; }
      }
      cards.forEach(paintCard);
      if (busy && !document.hidden) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }

    function layout() {
      var r = field.getBoundingClientRect(), fw = r.width, fh = r.height;
      var portrait = fh >= fw, cols = portrait ? 2 : 3, rows = portrait ? 3 : 2;
      C = Math.max(72, Math.min(170, fw / cols * 0.92, fh / rows * 0.92));
      field.style.setProperty('--pm-c', C + 'px');
      var gx = (fw - cols * C) / (cols + 1), gy = (fh - rows * C) / (rows + 1);
      pos = cards.map(function (c, i) {
        return [gx + (i % cols) * (C + gx) + C / 2, gy + Math.floor(i / cols) * (C + gy) + C / 2];
      });
      cards.forEach(paintCard);
    }
    function onResize() { layout(); }

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    deal();
    layout();

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (board.parentNode) { board.parentNode.removeChild(board); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'pamiec') { a.mount = mount; } });
})();
