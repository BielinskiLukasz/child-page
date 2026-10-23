// Activity "Przeciwieństwa": four big objects (door, cup, balloon, lamp). Touching one slowly turns it into its opposite
// (open, full, high, on) and touching it again turns it back. A small sparkle fades after each change; when all four are
// in their second state the scene glows softly. All changes are reversible; nothing is scored or stored.
// Fades run from one capped-dt rAF loop (not CSS transitions), so they still work under prefers-reduced-motion.
(function () {
  var CHANGE_S = 1.5, SPARK_S = 1.6, GLOW_IN_S = 2, GLOW_OUT_S = 1.5;

  function sparkSvg() {
    return '<g class="pw-spark" opacity="0"><path d="M84 8l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#ffe9a8" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></g>';
  }

  // Each object: build(id) -> inner svg markup, paint(svg, e) with e in 0..1 (0 = first state, 1 = opposite).
  var OBJECTS = [
    { name: 'Drzwi', off: 'zamknięte', on: 'otwarte', bg: '#e6e0f7',
      build: function () {
        return '<rect x="18" y="8" width="64" height="86" rx="8" fill="#c9a98a"/>' +
          '<rect x="25" y="15" width="50" height="79" fill="#ffe9c4"/>' +
          '<path d="M25 94v-30l12-8 13 8v30z" fill="#f3d9a8" opacity=".7"/>' +
          '<polygon class="pw-panel" points="25,15 75,15 75,94 25,94" fill="#c9a0c0" stroke="#b78fb0" stroke-width="2" stroke-linejoin="round"/>' +
          '<circle class="pw-knob" cx="66" cy="56" r="4.5" fill="#ffe9a8"/>' + sparkSvg();
      },
      paint: function (s, e) {
        var rx = 75 - 41 * e, d = 8 * e;
        s.querySelector('.pw-panel').setAttribute('points',
          '25,15 ' + rx.toFixed(2) + ',' + (15 + d).toFixed(2) + ' ' + rx.toFixed(2) + ',' + (94 - d).toFixed(2) + ' 25,94');
        var k = s.querySelector('.pw-knob');
        k.setAttribute('cx', (rx - 9 + 3 * e).toFixed(2));
        k.setAttribute('r', (4.5 - 1.5 * e).toFixed(2));
      } },
    { name: 'Kubek', off: 'pusty', on: 'pełny', bg: '#dff1fb',
      build: function (n) {
        var body = 'M26 30h48l-6 56q-1 7-8 7H40q-7 0-8-7z';
        return '<defs><clipPath id="pw-cup-clip-' + n + '"><path d="' + body + '"/></clipPath></defs>' +
          '<path d="M72 40q20 0 18 17t-20 17" fill="none" stroke="#fbf7ff" stroke-width="7" stroke-linecap="round"/>' +
          '<path d="' + body + '" fill="#fbf7ff" fill-opacity=".7"/>' +
          '<g clip-path="url(#pw-cup-clip-' + n + ')"><rect class="pw-liquid" x="20" y="93" width="60" height="64" fill="#a9d6f2"/>' +
          '<path class="pw-wave" d="M20 93q10-4 20 0t20 0t20 0" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/></g>' +
          '<path d="' + body + '" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
          '<path d="M24 94h52" stroke="#d6cdef" stroke-width="5" stroke-linecap="round"/>' + sparkSvg();
      },
      paint: function (s, e) {
        var y = 93 - 56 * e;
        s.querySelector('.pw-liquid').setAttribute('y', y.toFixed(2));
        s.querySelector('.pw-wave').setAttribute('transform', 'translate(0 ' + (y - 93).toFixed(2) + ')');
        s.querySelector('.pw-wave').setAttribute('opacity', Math.min(1, e * 4).toFixed(3));
      } },
    { name: 'Balon', off: 'nisko', on: 'wysoko', bg: '#fdf0d5',
      build: function () {
        return '<path d="M5 94q45-10 90 0v6H5z" fill="#cfeab4"/>' +
          '<path class="pw-string" d="M50 86Q44 90 50 90" fill="none" stroke="#8a84a8" stroke-width="2" stroke-linecap="round"/>' +
          '<circle cx="50" cy="91" r="4.5" fill="#8a84a8"/>' +
          '<g class="pw-balloon"><ellipse cx="50" cy="32" rx="20" ry="22" fill="#f7a8c9"/>' +
          '<path d="M46 56l4 5 4-5z" fill="#f7a8c9"/><path d="M40 22q3-7 10-8" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/></g>' + sparkSvg();
      },
      paint: function (s, e) {
        var dy = 32 * (1 - e), top = 61 + dy, w = 6 * Math.sin(e * Math.PI);
        s.querySelector('.pw-balloon').setAttribute('transform', 'translate(0 ' + dy.toFixed(2) + ')');
        s.querySelector('.pw-string').setAttribute('d',
          'M50 ' + top.toFixed(2) + 'Q' + (50 - w).toFixed(2) + ' ' + ((top + 88) / 2).toFixed(2) + ' 50 88');
      } },
    { name: 'Lampa', off: 'wyłączona', on: 'włączona', bg: '#e3f1d9',
      build: function () {
        return '<path class="pw-cone" d="M32 44L8 92h84L68 44z" fill="#fff2b8" opacity="0"/>' +
          '<ellipse cx="50" cy="90" rx="20" ry="5" fill="#8a84a8"/><rect x="47" y="46" width="6" height="42" rx="3" fill="#8a84a8"/>' +
          '<circle cx="50" cy="48" r="7" fill="#d6cdef"/><circle class="pw-bulb" cx="50" cy="48" r="7" fill="#ffe9a8" opacity="0"/>' +
          '<path d="M30 42l8-28h24l8 28z" fill="#f7a8c9" stroke="#f7a8c9" stroke-width="5" stroke-linejoin="round"/>' +
          '<path class="pw-rays" d="M18 20l-7-5M82 20l7-5M50 8V1" stroke="#ffd98a" stroke-width="3" stroke-linecap="round" opacity="0"/>' + sparkSvg();
      },
      paint: function (s, e) {
        s.querySelector('.pw-cone').setAttribute('opacity', (0.85 * e).toFixed(3));
        s.querySelector('.pw-bulb').setAttribute('opacity', e.toFixed(3));
        s.querySelector('.pw-rays').setAttribute('opacity', e.toFixed(3));
      } }
  ];

  function toward(v, t, step) { return v < t ? Math.min(t, v + step) : Math.max(t, v - step); }
  function smooth(v) { return v * v * (3 - 2 * v); }

  function mount(container) {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var root = document.createElement('div');
    root.className = 'pw';
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', 'Przeciwieństwa');
    var board = document.createElement('div');
    board.className = 'pw-board';
    root.appendChild(board);
    var glowEl = document.createElement('div');
    glowEl.className = 'pw-glow';
    root.appendChild(glowEl);

    var items = [];
    var glow = 0, glowT = 0;
    var raf = 0, last = 0;

    OBJECTS.forEach(function (o) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pw-btn';
      btn.style.background = o.bg;
      // Reduced motion: two static views (first state, opposite) cross-fade instead of moving.
      var views = reduced ? [0, 1] : [null];
      btn.innerHTML = views.map(function (v, vi) {
        return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + o.build(vi) + '</svg>';
      }).join('');
      var svgs = btn.querySelectorAll('svg');
      if (reduced) {
        o.paint(svgs[0], 0);
        o.paint(svgs[1], 1);
        svgs[0].style.position = svgs[1].style.position = 'absolute';
        svgs[0].style.inset = svgs[1].style.inset = '6%';
        svgs[0].style.width = svgs[1].style.width = svgs[0].style.height = svgs[1].style.height = '88%';
      }
      var it = { o: o, btn: btn, svgs: svgs, v: 0, t: 0, spark: 1 };
      it.paint = function () {
        var e = smooth(it.v);
        if (reduced) {
          svgs[0].style.opacity = (1 - e).toFixed(3);
          svgs[1].style.opacity = e.toFixed(3);
        } else {
          o.paint(svgs[0], e);
        }
        var sp = it.spark < 1 ? Math.sin(Math.PI * it.spark) : 0;
        var g = svgs[reduced ? 1 : 0].querySelector('.pw-spark');
        g.setAttribute('opacity', sp.toFixed(3));
        g.setAttribute('transform', 'translate(0 ' + (-4 * it.spark).toFixed(2) + ')');
        if (reduced) { svgs[0].querySelector('.pw-spark').setAttribute('opacity', '0'); }
      };
      it.label = function () {
        btn.setAttribute('aria-label', o.name + ': ' + (it.t ? o.on : o.off) + ' – dotknij, aby zmienić');
      };
      items.push(it);
      board.appendChild(btn);
    });
    container.appendChild(root);

    function paintGlow() { glowEl.style.opacity = smooth(glow).toFixed(3); }

    function step(ts) {
      raf = 0;
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      var busy = false;
      items.forEach(function (it) {
        var changed = false;
        if (it.v !== it.t) { it.v = toward(it.v, it.t, dt / CHANGE_S); changed = true; if (it.v !== it.t) { busy = true; } }
        if (it.spark < 1) { it.spark = Math.min(1, it.spark + dt / SPARK_S); changed = true; if (it.spark < 1) { busy = true; } }
        if (changed) { it.paint(); }
      });
      if (glow !== glowT) {
        glow = toward(glow, glowT, dt / (glowT > glow ? GLOW_IN_S : GLOW_OUT_S));
        paintGlow();
        if (glow !== glowT) { busy = true; }
      }
      if (busy) { raf = requestAnimationFrame(step); } else { last = 0; }
    }
    function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(step); } }

    // After a hidden tab, don't count the gap: rAF itself pauses, so just restart the clock.
    function onVis() { last = 0; }
    document.addEventListener('visibilitychange', onVis);

    var handlers = items.map(function (it) {
      var h = function () {
        if (it.v !== it.t) { return; } // a change in progress is ignored until it ends
        it.t = it.t ? 0 : 1;
        it.spark = 0;
        it.label();
        glowT = items.every(function (x) { return x.t === 1; }) ? 1 : 0;
        kick();
      };
      it.btn.addEventListener('click', h);
      return h;
    });

    items.forEach(function (it) { it.paint(); it.label(); });
    paintGlow();

    return function cleanup() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      document.removeEventListener('visibilitychange', onVis);
      items.forEach(function (it, i) { it.btn.removeEventListener('click', handlers[i]); });
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'przeciwienstwa') { a.mount = mount; } });
})();
