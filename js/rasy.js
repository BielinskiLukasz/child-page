// Activity "Rasy Piesków": a gallery of the shared dog breeds (window.Dogs), drawn at their relative sizes (small < medium < large)
// with the Polish breed name under each. Touching a dog (or Enter/Space on the focused dog) makes it happy for ~2.5 s: the mouth
// smiles, the tail wags and the ears flutter, with a soft glow. Under prefers-reduced-motion the happy face and glow still show,
// only the wag is skipped. One capped-dt rAF loop (pauses while hidden, stops when idle); nothing is scored or stored.
(function () {
  var HAPPY_S = 2.5, WAG_HZ = 2.2, WAG_DEG = 16, EAR_DEG = 5;

  function reduced() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'rp';
    var grid = document.createElement('div');
    grid.className = 'rp-grid';
    root.appendChild(grid);
    container.appendChild(root);

    var dogs = [], raf = 0, last = 0, alive = true;
    window.Dogs.LIST.forEach(function (d) {
      var cell = document.createElement('div');
      cell.className = 'rp-cell';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rp-dog';
      btn.setAttribute('aria-label', d.name);
      btn.innerHTML = window.Dogs.draw(d.id);
      var label = document.createElement('div');
      label.className = 'rp-name';
      label.textContent = d.name;
      cell.appendChild(btn); cell.appendChild(label);
      grid.appendChild(cell);
      var tail = btn.querySelector('.dg-tail'), ears = btn.querySelector('.dg-ears');
      var st = { btn: btn, calm: btn.querySelector('.dg-calm'), happy: btn.querySelector('.dg-happy'), tail: tail, ears: ears, t: -1,
        tp: [+tail.getAttribute('data-px'), +tail.getAttribute('data-py')], ep: [+ears.getAttribute('data-px'), +ears.getAttribute('data-py')] };
      btn.addEventListener('click', function () { pet(st); });
      dogs.push(st);
    });

    function rot(el, p, a) { el.setAttribute('transform', a ? 'rotate(' + a.toFixed(2) + ' ' + p[0] + ' ' + p[1] + ')' : ''); }
    function show(st, on) {
      st.happy.setAttribute('display', on ? 'inline' : 'none');
      st.calm.setAttribute('display', on ? 'none' : 'inline');
      st.btn.classList.toggle('rp-on', on);
    }
    function pet(st) {
      st.t = 0; show(st, true); start();
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var busy = false;
      dogs.forEach(function (st) {
        if (st.t < 0) { return; }
        st.t += dt;
        if (st.t >= HAPPY_S) { st.t = -1; show(st, false); rot(st.tail, st.tp, 0); rot(st.ears, st.ep, 0); return; }
        busy = true;
        if (!reduced()) {
          var env = Math.sin(Math.PI * st.t / HAPPY_S), ph = 2 * Math.PI * WAG_HZ * st.t;
          rot(st.tail, st.tp, WAG_DEG * env * Math.sin(ph));
          rot(st.ears, st.ep, EAR_DEG * env * Math.sin(ph * 0.5));
        }
      });
      if (busy && alive && !raf && !document.hidden) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden || !alive) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); }
    }
    document.addEventListener('visibilitychange', onVis);

    return function cleanup() {
      alive = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      document.removeEventListener('visibilitychange', onVis);
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'rasy') { a.mount = mount; } });
})();
