// Activity "Zabawa w chowanego": a garden with 4 hiding places (bush, box, tree, barrel); 3 hide an animal that
// peeks out (rabbit, cat, bear), the 4th hides a flower. Touch a place to lift its cover slowly (~1.5 s) and reveal
// what is behind it; touch it again to close it. When every place has been opened once they glow ~2 s, close slowly
// and the animals move to new places. While all are closed the animals sometimes quietly swap places.
// No wrong answers, no sound. One capped-dt rAF loop (works under prefers-reduced-motion, where covers fade instead
// of moving; pauses while hidden); fixed DOM of 4 buttons; nothing is stored.
(function () {
  var MOVE_S = 1.5, GLOW_S = 2, HOP_S = 0.7, SWAP_IDLE_S = 7, FADE_S = 0.9;
  var PLACES = [
    { label: 'krzak', ox: 0,
      cover: '<g fill="#9fd4a8"><circle cx="30" cy="66" r="22"/><circle cx="55" cy="56" r="26"/><circle cx="77" cy="68" r="19"/><rect x="12" y="70" width="80" height="26" rx="12"/></g>' +
        '<g fill="#bfe6b4"><circle cx="40" cy="52" r="5"/><circle cx="64" cy="46" r="4"/><circle cx="26" cy="74" r="4"/><circle cx="80" cy="76" r="4"/></g>' },
    { label: 'pudło', ox: 0,
      cover: '<rect x="14" y="40" width="72" height="56" rx="8" fill="#e8c9a0"/><rect x="10" y="34" width="80" height="14" rx="6" fill="#d9b185"/>' +
        '<path d="M22 62H78M22 78H78" stroke="#c9a070" stroke-width="3" stroke-linecap="round"/>' },
    { label: 'drzewo', ox: 26,
      cover: '<rect x="30" y="46" width="36" height="50" rx="10" fill="#c9a98a"/><circle cx="40" cy="34" r="26" fill="#9fd4a8"/>' +
        '<circle cx="28" cy="40" r="5" fill="#bfe6b4"/><circle cx="48" cy="24" r="5" fill="#bfe6b4"/><ellipse cx="48" cy="70" rx="6" ry="9" fill="#a98b6c"/>' },
    { label: 'beczka', ox: 0,
      cover: '<rect x="16" y="40" width="68" height="56" rx="16" fill="#d9b8e8"/><path d="M16 56H84M16 80H84" stroke="#b894cc" stroke-width="5"/>' +
        '<path d="M26 44q-6 24 0 48" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>' }
  ];
  // Animals differ in shape (ears), not only colour.
  var ANIMALS = [
    { label: 'królik', body: '#fbf7ff',
      ears: '<ellipse cx="40" cy="20" rx="6" ry="16" fill="#fbf7ff"/><ellipse cx="60" cy="20" rx="6" ry="16" fill="#fbf7ff"/><ellipse cx="40" cy="22" rx="2.6" ry="10" fill="#f7c9d6"/><ellipse cx="60" cy="22" rx="2.6" ry="10" fill="#f7c9d6"/>' },
    { label: 'kotek', body: '#f7d6b4',
      ears: '<path d="M32 44L34 20l16 14zM68 44L66 20 50 34z" fill="#f7d6b4"/><path d="M36 38l1-9 7 5zM64 38l-1-9-7 5z" fill="#f7c9d6"/>' },
    { label: 'miś', body: '#d9b99b',
      ears: '<circle cx="33" cy="34" r="9" fill="#d9b99b"/><circle cx="67" cy="34" r="9" fill="#d9b99b"/><circle cx="33" cy="34" r="4" fill="#f0d8c4"/><circle cx="67" cy="34" r="4" fill="#f0d8c4"/>' }
  ];

  function animalSvg(a) {
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + a.ears +
      '<ellipse cx="50" cy="88" rx="26" ry="16" fill="' + a.body + '"/><circle cx="50" cy="56" r="21" fill="' + a.body + '"/>' +
      '<circle cx="42" cy="54" r="3" fill="#5b5675"/><circle cx="58" cy="54" r="3" fill="#5b5675"/>' +
      '<ellipse cx="50" cy="62" rx="3.4" ry="2.4" fill="#e59aa8"/><path d="M44 67q6 5 12 0" fill="none" stroke="#5b5675" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  var FLOWER = '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M50 92V64" stroke="#7fbf8f" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M50 84q-14-2-16-14 13 1 16 14z" fill="#9fd4a8"/><g fill="#f7a8c9"><circle cx="50" cy="48" r="9"/><circle cx="38" cy="58" r="9"/><circle cx="62" cy="58" r="9"/><circle cx="41" cy="45" r="9"/><circle cx="59" cy="45" r="9"/></g>' +
    '<circle cx="50" cy="54" r="7" fill="#ffe9a8"/></svg>';

  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  // occupant per place: animal index 0..2 or -1 (flower); exactly one empty place.
  function arrangement(avoid) {
    var a;
    do {
      var empty = Math.floor(Math.random() * 4), an = [0, 1, 2];
      for (var j = 2; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var t = an[j]; an[j] = an[k]; an[k] = t; }
      a = []; for (var i = 0; i < 4; i++) { a.push(i === empty ? -1 : an.pop()); }
    } while (avoid && a.every(function (v, i) { return v === avoid[i]; }));
    return a;
  }

  function mount(container) {
    container.style.display = 'block';
    var board = document.createElement('div');
    board.className = 'hd';
    board.innerHTML = '<div class="hd-field"></div>';
    container.appendChild(board);
    var field = board.querySelector('.hd-field');

    var occ = arrangement(null), spots = [];
    var phase = 'play', phaseT = 0, idleT = 0, glow = 0, fadeJob = null, raf = 0, last = 0;

    PLACES.forEach(function (pl, i) {
      var el = document.createElement('button');
      el.type = 'button'; el.className = 'hd-spot';
      el.setAttribute('aria-label', 'Kryjówka: ' + pl.label);
      el.setAttribute('aria-expanded', 'false');
      el.innerHTML = '<span class="hd-flower">' + FLOWER + '</span><span class="hd-ani"></span>' +
        '<svg class="hd-cov" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
        '<ellipse cx="50" cy="96" rx="44" ry="5" fill="#000" fill-opacity=".07"/>' + pl.cover + '</svg>';
      field.appendChild(el);
      var s = { i: i, el: el, ani: el.querySelector('.hd-ani'), flower: el.querySelector('.hd-flower'), cov: el.querySelector('.hd-cov'),
        o: 0, t: 0, opened: false, hop: -1, op: 1, shown: -2 };
      spots.push(s);
      el.addEventListener('click', function () { toggle(s); });
    });

    function setAnimal(s) {
      if (s.shown === occ[s.i]) { return; }
      s.shown = occ[s.i];
      s.ani.innerHTML = s.shown >= 0 ? animalSvg(ANIMALS[s.shown]) : '';
    }
    function moving(s) { return s.o !== s.t; }
    function toggle(s) {
      if (phase !== 'play' || moving(s)) { return; } // touches during a movement (or the glow/close phases) are ignored
      s.t = s.t ? 0 : 1;
      s.el.setAttribute('aria-expanded', s.t ? 'true' : 'false');
      s.el.style.zIndex = '2';
      idleT = 0;
      start();
    }

    function paintSpot(s) {
      var u = smooth(s.o), rm = reduced();
      s.cov.style.transform = rm ? '' : 'translateY(' + (-38 * u).toFixed(1) + '%)';
      s.cov.style.opacity = (rm ? 1 - u : 1 - 0.6 * u).toFixed(3);
      s.flower.style.opacity = occ[s.i] < 0 ? u.toFixed(3) : '0';
      var hop = s.hop >= 0 && !rm ? Math.sin(Math.PI * Math.min(1, s.hop / HOP_S)) * 7 : 0;
      s.ani.style.transform = 'translate(' + (PLACES[s.i].ox) + '%,' + (-hop).toFixed(1) + '%)';
      s.ani.style.opacity = s.op.toFixed(3);
      s.el.style.filter = glow > 0.01 ? 'drop-shadow(0 0 ' + (6 + 14 * glow) + 'px #ffe08a)' : '';
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      var rate = dt / (reduced() ? MOVE_S * 0.5 : MOVE_S);
      spots.forEach(function (s) {
        if (s.o !== s.t) {
          s.o += s.t > s.o ? rate : -rate;
          if ((s.t && s.o >= 1) || (!s.t && s.o <= 0)) {
            s.o = s.t;
            if (s.t) { s.opened = true; s.hop = 0; } else { s.el.style.zIndex = ''; }
          }
        }
        if (s.hop >= 0) { s.hop += dt; if (s.hop >= HOP_S) { s.hop = -1; } }
      });
      if (fadeJob) {
        fadeJob.t += dt;
        var u = fadeJob.t / FADE_S;
        if (u >= 0.5 && !fadeJob.done) { fadeJob.done = true; fadeJob.apply(); }
        var op = u >= 1 ? 1 : u < 0.5 ? 1 - u * 2 : (u - 0.5) * 2;
        fadeJob.set.forEach(function (i) { spots[i].op = op; });
        if (u >= 1) { fadeJob = null; }
      }
      var anyMoving = spots.some(moving);
      if (phase === 'play') {
        if (!anyMoving && spots.every(function (s) { return s.opened; })) { phase = 'glow'; phaseT = 0; }
        else if (!anyMoving && !fadeJob && spots.every(function (s) { return s.o === 0; })) {
          idleT += dt;
          if (idleT >= SWAP_IDLE_S) { idleT = 0; swapTwo(); }
        } else { idleT = 0; }
      } else if (phase === 'glow') {
        phaseT += dt;
        if (phaseT >= GLOW_S) { phase = 'close'; spots.forEach(function (s) { s.t = 0; s.el.setAttribute('aria-expanded', 'false'); }); }
      } else if (phase === 'close') {
        if (!anyMoving && !fadeJob) {
          var old = occ.slice();
          fadeJob = { t: 0, done: false, set: [0, 1, 2, 3], apply: function () { occ = arrangement(old); spots.forEach(setAnimal); } };
          spots.forEach(function (s) { s.opened = false; });
          phase = 'play'; idleT = 0;
        }
      }
      var tg = phase === 'glow' ? 1 : 0;
      glow += (tg - glow) * Math.min(1, dt / 0.4);
      if (Math.abs(glow - tg) < 0.005) { glow = tg; }
      spots.forEach(paintSpot);
      if (!document.hidden) { raf = requestAnimationFrame(frame); }
    }
    function swapTwo() {
      var pairs = [];
      for (var a = 0; a < 4; a++) { for (var b = a + 1; b < 4; b++) { if (occ[a] !== occ[b]) { pairs.push([a, b]); } } }
      if (!pairs.length) { return; }
      var p = pairs[Math.floor(Math.random() * pairs.length)];
      fadeJob = { t: 0, done: false, set: p, apply: function () {
        var t = occ[p[0]]; occ[p[0]] = occ[p[1]]; occ[p[1]] = t; setAnimal(spots[p[0]]); setAnimal(spots[p[1]]);
      } };
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
      var portrait = fh >= fw, cols = portrait ? 2 : 4, rows = portrait ? 2 : 1;
      var S = Math.max(64, Math.min(200, fw / cols * 0.92, (fh / (rows + 0.4)) * 0.92));
      var cw = fw / cols, top = Math.max(0, (fh - (rows * S + 0.4 * S)) / 2) + 0.4 * S;
      field.style.setProperty('--hd-s', S + 'px');
      spots.forEach(function (s, i) {
        var col = i % cols, row = Math.floor(i / cols);
        s.el.style.transform = 'translate(' + (cw * (col + 0.5) - S / 2) + 'px,' + (top + row * S) + 'px)';
      });
    }
    function onResize() { layout(); }

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    spots.forEach(setAnimal);
    layout();
    spots.forEach(paintSpot);
    start();

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      if (board.parentNode) { board.parentNode.removeChild(board); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'chowany') { a.mount = mount; } });
})();
