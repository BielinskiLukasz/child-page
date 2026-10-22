// Activity "Zwierzątka na Farmie": a calm pastel farm. Touching an animal makes it react slowly for ~2.5s
// (ignored while it is reacting); touching the barn slowly opens the door, an animal peeks out, the door closes.
// One rAF loop (capped dt, stops when the tab is hidden) drives idle breathing/blinking and reactions via
// transforms, so everything works under prefers-reduced-motion. Fixed DOM: 1 backdrop, 1 barn, 4 animals.
(function () {
  var REACT = 2.6, BARN = 4.6, MAXDT = 0.05;
  var EYES = '<g class="fm-eyes"><circle cx="40" cy="EY" r="2.4" fill="#4a4560"/><circle cx="60" cy="EY" r="2.4" fill="#4a4560"/></g>';
  function eyes(y) { return EYES.replace(/EY/g, y); }
  function smile(y) { return '<path d="M45 ' + y + 'q5 4 10 0" fill="none" stroke="#4a4560" stroke-width="2" stroke-linecap="round"/>'; }

  var SVG = {
    sheep: '<g class="fm-all"><g fill="#cfc6e0"><rect x="30" y="72" width="8" height="22" rx="4"/><rect x="62" y="72" width="8" height="22" rx="4"/></g>' +
      '<g class="fm-body"><g fill="#fbf7ff" stroke="#e1d9f0" stroke-width="2"><circle cx="30" cy="52" r="16"/><circle cx="70" cy="52" r="16"/><circle cx="50" cy="42" r="18"/><circle cx="50" cy="62" r="18"/><circle cx="36" cy="38" r="12"/><circle cx="64" cy="38" r="12"/></g>' +
      '<ellipse cx="50" cy="52" rx="15" ry="16" fill="#e4dcf1"/>' + eyes(48) + smile(58) + '</g></g>',
    cow: '<g class="fm-all"><g fill="#f3eee6" stroke="#e3dccf" stroke-width="2"><rect x="18" y="62" width="9" height="30" rx="4"/><rect x="70" y="62" width="9" height="30" rx="4"/><ellipse cx="46" cy="58" rx="32" ry="22"/></g>' +
      '<ellipse cx="34" cy="52" rx="9" ry="7" fill="#c9b8f2"/><ellipse cx="56" cy="66" rx="8" ry="6" fill="#c9b8f2"/>' +
      '<g class="fm-head"><ellipse cx="74" cy="34" rx="16" ry="14" fill="#f3eee6" stroke="#e3dccf" stroke-width="2"/><ellipse cx="78" cy="42" rx="10" ry="7" fill="#f7c9d6"/>' +
      '<ellipse cx="63" cy="22" rx="6" ry="3" fill="#e3dccf"/><ellipse cx="86" cy="22" rx="6" ry="3" fill="#e3dccf"/><circle cx="70" cy="31" r="2.3" fill="#4a4560"/><circle cx="82" cy="31" r="2.3" fill="#4a4560"/></g></g>',
    hen: '<g class="fm-all"><g fill="#f6d27a"><rect x="40" y="76" width="4" height="16" rx="2"/><rect x="56" y="76" width="4" height="16" rx="2"/></g>' +
      '<g class="fm-body"><ellipse cx="50" cy="56" rx="28" ry="24" fill="#fff4dc" stroke="#f1e0b8" stroke-width="2"/>' +
      '<circle cx="50" cy="26" r="13" fill="#fff4dc" stroke="#f1e0b8" stroke-width="2"/><circle cx="44" cy="13" r="5" fill="#f7a8c9"/><circle cx="52" cy="11" r="5" fill="#f7a8c9"/>' +
      '<path d="M46 29l4 7 4-7z" fill="#f6d27a"/><g class="fm-eyes"><circle cx="44" cy="24" r="2.2" fill="#4a4560"/><circle cx="56" cy="24" r="2.2" fill="#4a4560"/></g>' +
      '<ellipse class="fm-wl" cx="26" cy="56" rx="9" ry="14" fill="#f5e2b4"/><ellipse class="fm-wr" cx="74" cy="56" rx="9" ry="14" fill="#f5e2b4"/></g></g>',
    cat: '<g class="fm-all"><path class="fm-tail" d="M72 78q22 0 18-26" fill="none" stroke="#f3c9a0" stroke-width="8" stroke-linecap="round"/>' +
      '<g class="fm-body"><ellipse cx="46" cy="72" rx="26" ry="20" fill="#f7d6b4"/><circle cx="44" cy="42" r="17" fill="#f7d6b4"/>' +
      '<path d="M30 32l2-17 12 9zM58 32l-2-17-12 9z" fill="#f7d6b4"/><path d="M33 27l1-8 6 4zM55 27l-1-8-6 4z" fill="#f7c9d6"/>' +
      eyes(42).replace(/cx="40"/, 'cx="37"').replace(/cx="60"/, 'cx="51"') + '<path d="M42 48l2 2 2-2z" fill="#f7a8c9"/></g></g>',
    barn: '<g class="fm-all"><path d="M4 42L50 8l46 34z" fill="#d9b99b"/><rect x="10" y="38" width="80" height="58" rx="5" fill="#f6c9b0"/>' +
      '<rect x="34" y="52" width="32" height="44" rx="4" fill="#8f7fa3"/>' +
      '<g clip-path="url(#fm-clip)"><g class="fm-peek"><circle cx="50" cy="94" r="12" fill="#fff4dc"/><circle cx="45" cy="92" r="2" fill="#4a4560"/><circle cx="55" cy="92" r="2" fill="#4a4560"/><path d="M47 98q3 3 6 0" fill="none" stroke="#4a4560" stroke-width="1.6" stroke-linecap="round"/></g></g>' +
      '<rect class="fm-door" x="34" y="52" width="32" height="44" rx="4" fill="#fbe7c8" stroke="#e9cfa4" stroke-width="2"/>' +
      '<path d="M34 52l32 44M66 52L34 96" stroke="#e9cfa4" stroke-width="2"/>' +
      '<circle cx="50" cy="26" r="5" fill="#fbe7c8"/></g><defs><clipPath id="fm-clip"><rect x="34" y="52" width="32" height="44"/></clipPath></defs>'
  };
  var LABEL = { sheep: 'Owieczka', cow: 'Krowa', hen: 'Kura', cat: 'Kotek', barn: 'Stodoła' };
  // left, top, width in % of the 4:3 board (buttons are square)
  var POS = { barn: [3, 14, 32], cow: [38, 36, 30], cat: [79, 36, 18], sheep: [4, 58, 26], hen: [64, 66, 20] };
  var BACKDROP = '<svg viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<rect width="400" height="300" fill="#e8f4fb"/><circle cx="340" cy="46" r="24" fill="#fff0c4"/>' +
    '<ellipse cx="90" cy="215" rx="190" ry="90" fill="#cfe8c3"/><ellipse cx="320" cy="225" rx="200" ry="80" fill="#bfe0b4"/>' +
    '<rect y="250" width="400" height="50" fill="#b3d9a6"/>' +
    '<g fill="#f6e7cf" stroke="#e6d3b0" stroke-width="2"><rect x="150" y="222" width="250" height="8" rx="4"/><rect x="150" y="238" width="250" height="8" rx="4"/>' +
    '<rect x="160" y="214" width="8" height="40" rx="4"/><rect x="210" y="214" width="8" height="40" rx="4"/><rect x="260" y="214" width="8" height="40" rx="4"/><rect x="310" y="214" width="8" height="40" rx="4"/><rect x="360" y="214" width="8" height="40" rx="4"/></g></svg>';

  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'fm';
    root.innerHTML = '<div class="fm-board">' + BACKDROP + '</div>';
    container.appendChild(root);
    var board = root.firstChild;

    var names = ['barn', 'cow', 'cat', 'sheep', 'hen'], A = {};
    names.forEach(function (n) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'fm-btn fm-' + n;
      b.setAttribute('aria-label', LABEL[n]);
      b.style.left = POS[n][0] + '%'; b.style.top = POS[n][1] + '%'; b.style.width = POS[n][2] + '%';
      b.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + SVG[n] + '</svg>';
      board.appendChild(b);
      var a = { n: n, el: b, t: -1, ph: Math.random() * 6, blinkAt: 2 + Math.random() * 3, blink: 0,
        all: b.querySelector('.fm-all'), body: b.querySelector('.fm-body'), eyes: b.querySelector('.fm-eyes'), head: b.querySelector('.fm-head'), tail: b.querySelector('.fm-tail'),
        wl: b.querySelector('.fm-wl'), wr: b.querySelector('.fm-wr'), door: b.querySelector('.fm-door'), peek: b.querySelector('.fm-peek') };
      function origin(el, o) { if (el) { el.style.transformOrigin = o; } }
      origin(a.all, '50px 95px'); origin(a.body, '50px 95px'); origin(a.eyes, '50px 45px');
      origin(a.head, '70px 40px'); origin(a.tail, '72px 78px'); origin(a.wl, '34px 46px'); origin(a.wr, '66px 46px');
      origin(a.door, '34px 74px');
      A[n] = a;
      b.addEventListener('click', function () { if (a.t < 0) { a.t = 0; wake(); } });
    });
    if (A.barn.peek) { A.barn.who = 0; }

    var raf = 0, last = 0, clock = 0;
    function set(el, tr) { if (el) { el.style.transform = tr; } }

    function frame(now) {
      raf = 0;
      var dt = last ? Math.min((now - last) / 1000, MAXDT) : 0;
      last = now; clock += dt;
      names.forEach(function (n) {
        var a = A[n], r = 0, p = 0, env = 0;
        if (a.t >= 0) {
          a.t += dt;
          var dur = n === 'barn' ? BARN : REACT;
          p = a.t / dur;
          if (p >= 1) { a.t = -1; p = 0; } else { env = Math.sin(Math.PI * p); r = env * env * (3 - 2 * env); }
        }
        var breath = 1 + 0.018 * Math.sin(clock * 1.3 + a.ph);
        if (n !== 'barn') {
          set(a.body, 'scale(' + (1 / breath) + ',' + breath + ')');
          a.blinkAt -= dt;
          if (a.blinkAt <= 0) { a.blink = 0.18; a.blinkAt = 3 + Math.random() * 3; }
          var by = 1;
          if (a.blink > 0) { a.blink -= dt; by = 0.15 + 0.85 * Math.abs(a.blink / 0.18 * 2 - 1); }
          set(a.eyes, 'scaleY(' + by + ')');
        }
        var w = Math.sin(p * Math.PI * 2 * 1.5);
        if (n === 'sheep') { set(a.all, 'rotate(' + (r * 4 * w) + 'deg)'); }
        else if (n === 'cow') { set(a.head, 'rotate(' + (r * -12 * Math.sin(p * Math.PI * 2 * 0.75 + 0.0)) + 'deg)'); }
        else if (n === 'hen') {
          set(a.all, 'translateY(' + (-r * 3 * Math.abs(Math.sin(p * Math.PI * 3))) + 'px)');
          var f = r * 14 * (0.5 + 0.5 * Math.sin(p * Math.PI * 2 * 2.5));
          set(a.wl, 'rotate(' + (-f) + 'deg)'); set(a.wr, 'rotate(' + f + 'deg)');
        } else if (n === 'cat') { set(a.tail, 'rotate(' + (r * 22 * Math.sin(p * Math.PI * 2 * 1.5)) + 'deg)'); }
        else {
          // 0-.25 door opens, .25-.75 animal peeks, .75-1 peeks away and door closes
          var door = p < 0.25 ? smooth(p / 0.25) : p > 0.75 ? 1 - smooth((p - 0.75) / 0.25) : 1;
          var peek = p < 0.2 ? 0 : p < 0.4 ? smooth((p - 0.2) / 0.2) : p < 0.6 ? 1 : p < 0.75 ? 1 - smooth((p - 0.6) / 0.15) : 0;
          set(a.door, 'scaleX(' + (1 - 0.88 * door) + ')');
          set(a.peek, 'translateY(' + (-peek * 26) + 'px)');
        }
      });
      raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
      else { wake(); }
    }
    document.addEventListener('visibilitychange', onVis);
    wake();

    return function cleanup() {
      document.removeEventListener('visibilitychange', onVis);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  var list = window.ACTIVITIES || [];
  for (var i = 0; i < list.length; i++) { if (list[i].id === 'farma') { list[i].mount = mount; } }
})();
