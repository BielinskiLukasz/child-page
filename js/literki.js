// Activity "Literki": one big letter (Aa) on a soft card with a friendly picture of something that starts with it.
// Touch the picture: it wiggles gently and its Polish word shows small underneath for ~3 s (for the parent to read);
// touch the letter: it glows softly. Arrows (or a gentle swipe) slide to the next / previous letter; 12 letters in
// alphabetical order, cycling. No scores, no wrong answers, no sound; nothing changes by itself.
// All motion runs in one capped-dt rAF loop (so it works under prefers-reduced-motion, where wiggle/slide are replaced
// by a soft fade); the loop stops when idle and pauses while hidden. Nothing is stored.
(function () {
  var LETTERS = [
    { u: 'A', l: 'a', word: 'arbuz', svg: '<path d="M8 38A42 42 0 0 0 92 38Z" fill="#9fd4a8"/><path d="M15 38A35 35 0 0 0 85 38Z" fill="#f7a8c9"/>' +
      '<g fill="#5b5675"><ellipse cx="36" cy="52" rx="2.4" ry="4"/><ellipse cx="50" cy="60" rx="2.4" ry="4"/><ellipse cx="64" cy="52" rx="2.4" ry="4"/><ellipse cx="50" cy="47" rx="2.4" ry="4"/></g>' },
    { u: 'B', l: 'b', word: 'balon', svg: '<ellipse cx="50" cy="40" rx="26" ry="32" fill="#a8d8f0"/><path d="M44 72L56 72L50 80Z" fill="#a8d8f0"/>' +
      '<path d="M50 80Q42 88 52 94" fill="none" stroke="#8a84a8" stroke-width="2.4" stroke-linecap="round"/><path d="M36 26a16 18 0 0 1 10-12" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"/>' },
    { u: 'D', l: 'd', word: 'dom', svg: '<rect x="20" y="46" width="60" height="44" rx="5" fill="#f6dcc8"/><path d="M12 50L50 16L88 50Z" fill="#c9a0c0" stroke="#c9a0c0" stroke-width="5" stroke-linejoin="round"/>' +
      '<rect x="43" y="64" width="16" height="26" rx="8" fill="#b99a86"/><rect x="26" y="56" width="12" height="12" rx="2" fill="#ffe9a8"/>' },
    { u: 'K', l: 'k', word: 'kot', svg: '<path d="M24 46L26 14L46 30ZM76 46L74 14 54 30Z" fill="#f7d6b4"/><circle cx="50" cy="56" r="30" fill="#f7d6b4"/>' +
      '<circle cx="39" cy="52" r="3.6" fill="#5b5675"/><circle cx="61" cy="52" r="3.6" fill="#5b5675"/><ellipse cx="50" cy="62" rx="4" ry="3" fill="#e59aa8"/>' +
      '<path d="M43 69q7 5 14 0" fill="none" stroke="#5b5675" stroke-width="2" stroke-linecap="round"/>' },
    { u: 'L', l: 'l', word: 'lody', svg: '<path d="M32 52L50 94L68 52Z" fill="#e8c9a8"/><circle cx="40" cy="44" r="16" fill="#f7a8c9"/><circle cx="60" cy="42" r="15" fill="#bfe6b4"/><circle cx="50" cy="30" r="14" fill="#ffe9a8"/>' },
    { u: 'Ł', l: 'ł', word: 'łódka', svg: '<path d="M10 62H90L76 84Q74 88 68 88H32Q26 88 24 84Z" fill="#f7a8c9"/><path d="M50 12V62" stroke="#8a6a4a" stroke-width="3"/>' +
      '<path d="M54 14L84 58H54Z" fill="#fff" stroke="#e8e0f2" stroke-width="2" stroke-linejoin="round"/><path d="M6 92q10-6 20 0t20 0t20 0t20 0" fill="none" stroke="#a8d8f0" stroke-width="4" stroke-linecap="round"/>' },
    { u: 'M', l: 'm', word: 'miś', svg: '<circle cx="26" cy="30" r="12" fill="#d9b99b"/><circle cx="74" cy="30" r="12" fill="#d9b99b"/><circle cx="50" cy="54" r="32" fill="#d9b99b"/>' +
      '<ellipse cx="50" cy="64" rx="14" ry="11" fill="#f0d8c4"/><circle cx="39" cy="48" r="3.4" fill="#5b5675"/><circle cx="61" cy="48" r="3.4" fill="#5b5675"/><ellipse cx="50" cy="60" rx="4.5" ry="3.2" fill="#5b5675"/>' },
    { u: 'O', l: 'o', word: 'owca', svg: '<g fill="#fff" stroke="#e8e0f2" stroke-width="2"><circle cx="34" cy="52" r="16"/><circle cx="50" cy="44" r="18"/><circle cx="64" cy="54" r="16"/><circle cx="48" cy="62" r="16"/></g>' +
      '<circle cx="80" cy="46" r="12" fill="#d9cfe8"/><circle cx="83" cy="43" r="2.4" fill="#5b5675"/><rect x="36" y="72" width="6" height="16" rx="3" fill="#d9cfe8"/><rect x="58" y="72" width="6" height="16" rx="3" fill="#d9cfe8"/>' },
    { u: 'P', l: 'p', word: 'piłka', svg: '<circle cx="50" cy="50" r="40" fill="#f7a8c9"/><path d="M10 44Q50 66 90 44" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="7"/>' +
      '<path d="M24 24a34 34 0 0 1 22-12" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/>' },
    { u: 'S', l: 's', word: 'słoń', svg: '<ellipse cx="44" cy="62" rx="30" ry="22" fill="#c9d6e8"/><circle cx="74" cy="46" r="16" fill="#c9d6e8"/><path d="M82 56Q96 62 92 84Q90 89 85 86Q87 70 79 62Z" fill="#c9d6e8"/>' +
      '<circle cx="62" cy="46" r="10" fill="#b4c4dc"/><rect x="24" y="74" width="12" height="18" rx="5" fill="#b4c4dc"/><rect x="50" y="74" width="12" height="18" rx="5" fill="#b4c4dc"/><circle cx="78" cy="42" r="2.6" fill="#5b5675"/>' },
    { u: 'T', l: 't', word: 'tulipan', svg: '<path d="M50 94V58" stroke="#7fbf8f" stroke-width="5" stroke-linecap="round"/><path d="M50 82Q30 80 26 62Q44 64 50 82Z" fill="#9fd4a8"/><path d="M50 78Q70 76 74 58Q56 60 50 78Z" fill="#9fd4a8"/>' +
      '<path d="M30 24Q30 62 50 62Q70 62 70 24L60 36L50 18L40 36Z" fill="#f7a8c9" stroke="#f7a8c9" stroke-width="3" stroke-linejoin="round"/>' },
    { u: 'Ż', l: 'ż', word: 'żaba', svg: '<circle cx="50" cy="62" r="30" fill="#bfe6b4"/><circle cx="34" cy="34" r="12" fill="#bfe6b4"/><circle cx="66" cy="34" r="12" fill="#bfe6b4"/>' +
      '<circle cx="34" cy="34" r="6" fill="#fff"/><circle cx="66" cy="34" r="6" fill="#fff"/><circle cx="35" cy="35" r="3" fill="#5b5675"/><circle cx="65" cy="35" r="3" fill="#5b5675"/>' +
      '<path d="M34 66q16 12 32 0" fill="none" stroke="#5b5675" stroke-width="3" stroke-linecap="round"/>' }
  ];
  var SLIDE_S = 0.5, WIGGLE_S = 0.8, WORD_S = 3, WORD_FADE_S = 0.5, GLOW_S = 1;

  function picSvg(L) { return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + L.svg + '</svg>'; }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'lt';
    root.innerHTML = '<div class="lt-field"><button type="button" class="lt-nav lt-prev" aria-label="Poprzednia litera"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5L8 12l7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<div class="lt-card"><button type="button" class="lt-letter"><span class="lt-lt"></span></button>' +
      '<div class="lt-picwrap"><button type="button" class="lt-pic"></button><div class="lt-word" aria-live="polite"></div></div></div>' +
      '<button type="button" class="lt-nav lt-next" aria-label="Następna litera"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>';
    container.appendChild(root);
    var card = root.querySelector('.lt-card'), letterBtn = root.querySelector('.lt-letter'),
      letterTxt = root.querySelector('.lt-lt'), picBtn = root.querySelector('.lt-pic'), wordEl = root.querySelector('.lt-word'),
      prev = root.querySelector('.lt-prev'), next = root.querySelector('.lt-next');

    var idx = 0, slide = null, wiggle = -1, wordT = -1, glow = -1, raf = 0, last = 0;

    function show(i) {
      idx = (i + LETTERS.length) % LETTERS.length;
      var L = LETTERS[idx];
      letterTxt.textContent = L.u + L.l;
      letterBtn.setAttribute('aria-label', 'Litera ' + L.u);
      picBtn.innerHTML = picSvg(L);
      picBtn.setAttribute('aria-label', 'Obrazek: ' + L.word);
      wordEl.textContent = L.word;
      wordEl.style.opacity = '0'; wordT = -1; wiggle = -1; glow = -1;
      picBtn.style.transform = ''; letterBtn.style.filter = '';
    }
    function go(dir) {
      if (slide) { return; }          // very quick touches during the change are ignored
      slide = { t: 0, dir: dir, swapped: false };
      start();
    }
    function onPic() { wiggle = 0; wordT = 0; start(); }
    function onLetter() { glow = 0; start(); }

    function frame(now) {
      raf = 0;
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      var busy = false, rm = reduced();
      if (slide) {
        slide.t += dt; busy = true;
        var u = slide.t / SLIDE_S, op, dx = 0;
        if (u < 0.5) { op = 1 - u * 2; dx = -slide.dir * smooth(u * 2) * 60; }
        else {
          if (!slide.swapped) { slide.swapped = true; show(idx + slide.dir); }
          op = (u - 0.5) * 2; dx = slide.dir * (1 - smooth((u - 0.5) * 2)) * 60;
        }
        card.style.opacity = Math.max(0, Math.min(1, op)).toFixed(3);
        card.style.transform = rm ? '' : 'translateX(' + dx.toFixed(1) + 'px)';
        if (u >= 1) { slide = null; card.style.opacity = '1'; card.style.transform = ''; }
      }
      if (wiggle >= 0) {
        wiggle += dt;
        var w = wiggle / WIGGLE_S;
        if (w >= 1 || rm) { picBtn.style.transform = ''; wiggle = -1; }
        else { picBtn.style.transform = 'rotate(' + (7 * Math.sin(w * Math.PI * 6) * (1 - w)).toFixed(2) + 'deg)'; busy = true; }
      }
      if (wordT >= 0) {
        wordT += dt; busy = wordT >= 0 || busy;
        var o = wordT < 0.25 ? wordT / 0.25 : wordT < WORD_S ? 1 : 1 - (wordT - WORD_S) / WORD_FADE_S;
        if (wordT >= WORD_S + WORD_FADE_S) { wordT = -1; o = 0; }
        wordEl.style.opacity = Math.max(0, Math.min(1, o)).toFixed(3);
      }
      if (glow >= 0) {
        glow += dt;
        var g = Math.sin(Math.PI * Math.min(1, glow / GLOW_S));
        letterBtn.style.filter = g > 0.01 ? 'drop-shadow(0 0 ' + (4 + 18 * g).toFixed(1) + 'px #ffe08a)' : '';
        if (glow >= GLOW_S) { glow = -1; letterBtn.style.filter = ''; } else { busy = true; }
      }
      if (busy && !document.hidden) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }

    // gentle swipe on the card
    var sx = null;
    function sdown(e) { sx = e.clientX; }
    function sup(e) {
      if (sx === null) { return; }
      var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 60) { go(dx < 0 ? 1 : -1); }
    }

    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    picBtn.addEventListener('click', onPic);
    letterBtn.addEventListener('click', onLetter);
    card.addEventListener('pointerdown', sdown);
    card.addEventListener('pointerup', sup);
    card.addEventListener('pointercancel', function () { sx = null; });
    document.addEventListener('visibilitychange', onVis);
    show(0);

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      document.removeEventListener('visibilitychange', onVis);
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'literki') { a.mount = mount; } });
})();
