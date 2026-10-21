// Activity "Dzień i Noc": touch the sun -> smooth fall of night; touch the moon -> day returns; touch the sky -> a cloud drifts by.
// Transition is driven by one rAF loop (so it also works under prefers-reduced-motion, just shorter).
// Clouds are removed once off-screen or after their lifetime; their number is capped at MAX_CLOUDS.
(function () {
  var MAX_CLOUDS = 7, AMBIENT = 3, TRANSITION_MS = 3500, REDUCED_MS = 1200;
  var CLOUD_SVG = '<svg viewBox="0 0 120 60" aria-hidden="true" focusable="false"><g fill="#fff"><circle cx="35" cy="38" r="20"/>' +
    '<circle cx="60" cy="28" r="26"/><circle cx="88" cy="38" r="20"/><rect x="35" y="38" width="53" height="20" rx="10"/></g></svg>';
  var STARS = [[8, 12, 3], [20, 28, 2], [34, 8, 2.5], [46, 22, 2], [58, 10, 3], [70, 30, 2], [82, 14, 2.5], [92, 26, 2],
    [14, 44, 2], [28, 38, 2.5], [64, 42, 2], [88, 46, 3], [40, 46, 2]];

  function mount(container) {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var scene = document.createElement('div');
    scene.className = 'dn';
    var stars = STARS.map(function (s) {
      return '<i style="left:' + s[0] + '%;top:' + s[1] + '%;width:' + s[2] + 'px;height:' + s[2] + 'px"></i>';
    }).join('');
    scene.innerHTML = '<div class="dn-night"></div><div class="dn-stars" aria-hidden="true">' + stars + '</div>' +
      '<div class="dn-clouds" aria-hidden="true"></div>' +
      '<button class="dn-body" type="button" aria-label="Słońce"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<g class="dn-sun"><g stroke="#ffd96a" stroke-width="5" stroke-linecap="round">' +
      '<path d="M50 6v10M50 84v10M6 50h10M84 50h10M19 19l7 7M74 74l7 7M81 19l-7 7M26 74l-7 7"/></g>' +
      '<circle cx="50" cy="50" r="27" fill="#ffe08a"/></g>' +
      '<g class="dn-moon"><circle cx="50" cy="50" r="30" fill="#f4f1d8"/><circle cx="38" cy="58" r="5" fill="#e3ddb8"/>' +
      '<circle cx="62" cy="38" r="4" fill="#e3ddb8"/><path d="M36 48q5 5 10 0M54 48q5 5 10 0" fill="none" stroke="#8a84a8" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M44 60q6 4 12 0" fill="none" stroke="#8a84a8" stroke-width="2.5" stroke-linecap="round"/></g></svg></button>';
    container.appendChild(scene);
    var cloudBox = scene.querySelector('.dn-clouds'), body = scene.querySelector('.dn-body');

    var progress = 0, target = 0, busy = false, raf = 0, last = 0, hidden = document.hidden;
    var clouds = [], timers = [];

    function render() {
      scene.style.setProperty('--p', progress.toFixed(3));
      var night = progress >= 0.5;
      body.setAttribute('aria-label', night ? 'Księżyc' : 'Słońce');
    }
    function ease(t) { return t * t * (3 - 2 * t); }
    function step(now) {
      raf = 0;
      var dt = Math.min(now - last, 100); // a long gap (hidden tab) must not skip the transition
      last = now;
      var dur = reduced ? REDUCED_MS : TRANSITION_MS;
      step.t = Math.min(step.t + dt / dur, 1);
      progress = step.from + (target - step.from) * ease(step.t);
      render();
      if (step.t >= 1) { progress = target; busy = false; render(); return; }
      raf = requestAnimationFrame(step);
    }
    function toggle() {
      busy = true;
      step.from = progress;
      step.t = 0;
      target = progress < 0.5 ? 1 : 0;
      last = performance.now();
      if (!hidden && !raf) { raf = requestAnimationFrame(step); }
    }

    function removeCloud(c) {
      var i = clouds.indexOf(c);
      if (i >= 0) { clouds.splice(i, 1); }
      if (c.node.parentNode) { c.node.parentNode.removeChild(c.node); }
    }
    function addCloud(x, y, speed, life) {
      while (clouds.length >= MAX_CLOUDS) { removeCloud(clouds[0]); }
      var node = document.createElement('div');
      node.className = 'dn-cloud';
      node.innerHTML = CLOUD_SVG;
      node.style.top = y + '%';
      node.style.setProperty('--w', (18 + Math.random() * 12) + 'vmin');
      cloudBox.appendChild(node);
      var c = { node: node, x: x, speed: speed, life: life };
      clouds.push(c);
      place(c);
      return c;
    }
    function place(c) { c.node.style.transform = 'translateX(' + c.x.toFixed(2) + 'vw)'; }
    function ambient() {
      var n = clouds.filter(function (c) { return !c.tapped; }).length;
      while (n < AMBIENT) {
        addCloud(n === 0 && !clouds.length ? 10 : -25 - Math.random() * 20, 8 + Math.random() * 40, 1.6 + Math.random() * 0.8, 0).tapped = false;
        n++;
      }
    }
    var cloudLast = performance.now(), cloudRaf = 0;
    function cloudTick(now) {
      cloudRaf = 0;
      var dt = Math.min(now - cloudLast, 100) / 1000;
      cloudLast = now;
      if (!reduced) {
        clouds.slice().forEach(function (c) {
          c.x += c.speed * dt;
          if (c.x > 105) { removeCloud(c); } else { place(c); }
        });
        ambient();
      }
      if (!hidden) { cloudRaf = requestAnimationFrame(cloudTick); }
    }
    // initial ambient clouds spread across the sky
    [8, 42, 70].forEach(function (x, i) { addCloud(x, 10 + i * 14, 1.6 + i * 0.4, 0).tapped = false; });

    function onDown(e) {
      e.preventDefault();
      if (busy) { return; }
      if (e.target.closest('.dn-body')) { toggle(); return; }
      var h = Math.max(scene.clientHeight, 1);
      var y = Math.min(Math.max(e.clientY / h * 100 - 8, 2), 70);
      if (reduced) {
        var c = addCloud(Math.min(Math.max(e.clientX / Math.max(scene.clientWidth, 1) * 100 - 12, 0), 75), y, 0, 1);
        c.tapped = true;
        var t = setTimeout(function () { timers.splice(timers.indexOf(t), 1); removeCloud(c); }, 6000);
        timers.push(t);
      } else {
        addCloud(-30, y, 3.2, 0).tapped = true;
      }
    }
    function onClick(e) {
      // keyboard activation (Enter/Space) fires click with detail 0; pointer input is handled in onDown
      if (e.detail !== 0 || busy || !e.target.closest('.dn-body')) { return; }
      toggle();
    }
    function onVis() {
      hidden = document.hidden;
      scene.classList.toggle('paused', hidden);
      if (!hidden) {
        last = cloudLast = performance.now();
        if (busy && !raf) { raf = requestAnimationFrame(step); }
        if (!cloudRaf) { cloudRaf = requestAnimationFrame(cloudTick); }
      }
    }

    scene.addEventListener('pointerdown', onDown);
    scene.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVis);
    render();
    cloudRaf = requestAnimationFrame(cloudTick);

    return function () {
      if (raf) { cancelAnimationFrame(raf); }
      if (cloudRaf) { cancelAnimationFrame(cloudRaf); }
      timers.forEach(clearTimeout);
      scene.removeEventListener('pointerdown', onDown);
      scene.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVis);
      if (scene.parentNode) { scene.parentNode.removeChild(scene); }
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'dzien-i-noc') { a.mount = mount; } });
})();
