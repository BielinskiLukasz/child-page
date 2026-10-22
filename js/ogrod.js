// Activity "Magiczny Ogród": tap the lawn -> a seed grows into a flower or mushroom; tap the cloud -> garden resets.
// Plants are small DOM nodes animated by CSS keyframes; removal is timer-based (never transitionend), because the
// global prefers-reduced-motion rule disables animations and transitions.
(function () {
  var MAX_PLANTS = 20, MAX_FADING = 6, FADE_MS = 900;
  var PASTELS = ['#f7a8c9', '#ffd98a', '#c9b8f2', '#ffb7a5', '#a8d8f0', '#b9e3c0'];
  var CAPS = ['#f08a8a', '#e8c39e', '#c9b8f2', '#f2b7a0', '#a8d8f0'];
  var STEM = '<g class="g-stem"><path d="M30 100V44" stroke="#7fbf8f" stroke-width="5" stroke-linecap="round"/></g>';
  var LEAVES = '<g class="g-leaves"><ellipse cx="20" cy="74" rx="10" ry="5" fill="#8fcf9f" transform="rotate(-30 20 74)"/>' +
    '<ellipse cx="40" cy="64" rx="10" ry="5" fill="#8fcf9f" transform="rotate(30 40 64)"/></g>';
  var FEET = '<g class="g-leaves"><ellipse cx="14" cy="98" rx="9" ry="4" fill="#8fcf9f"/><ellipse cx="46" cy="98" rx="9" ry="4" fill="#8fcf9f"/></g>';
  var DOTS = '<circle cx="20" cy="54" r="3.5" fill="#fff"/><circle cx="34" cy="48" r="3" fill="#fff"/><circle cx="42" cy="58" r="2.5" fill="#fff"/>';
  function bloom(inner) { return '<g class="g-bloom">' + inner + '</g>'; }
  function mushStem(x, w) { return '<g class="g-stem"><rect x="' + x + '" y="60" width="' + w + '" height="40" rx="6" fill="#fdf3e3"/></g>'; }

  // Each kind returns the inner SVG (stem / leaves / bloom groups animated by CSS); six flowers and mushrooms in all.
  var KINDS = [
    { colors: PASTELS, svg: function (c) { // four-petal flower
      return STEM + LEAVES + bloom('<g fill="' + c + '"><circle cx="30" cy="28" r="9"/><circle cx="30" cy="52" r="9"/>' +
        '<circle cx="18" cy="40" r="9"/><circle cx="42" cy="40" r="9"/></g><circle cx="30" cy="40" r="8" fill="#ffe9a8"/>'); } },
    { colors: PASTELS, svg: function (c) { // tulip
      return STEM + LEAVES + bloom('<path d="M17 24q0 24 13 24t13-24l-7 7-6-12-6 12z" fill="' + c + '"/>'); } },
    { colors: PASTELS, svg: function (c) { // daisy with many thin petals
      var petals = '';
      for (var i = 0; i < 10; i++) { petals += '<ellipse cx="30" cy="25" rx="3.6" ry="11" transform="rotate(' + i * 36 + ' 30 40)"/>'; }
      return STEM + LEAVES + bloom('<g fill="' + c + '">' + petals + '</g><circle cx="30" cy="40" r="6.5" fill="#ffd98a"/>'); } },
    { colors: PASTELS, svg: function (c) { // round pom-pom flower
      return STEM + LEAVES + bloom('<g fill="' + c + '"><circle cx="30" cy="38" r="15"/><circle cx="20" cy="30" r="8"/><circle cx="40" cy="30" r="8"/>' +
        '<circle cx="22" cy="46" r="8"/><circle cx="38" cy="46" r="8"/></g>'); } },
    { colors: CAPS, svg: function (c) { // classic spotted mushroom
      return mushStem(24, 12) + FEET + bloom('<path d="M6 64a24 24 0 0 1 48 0z" fill="' + c + '"/>' + DOTS); } },
    { colors: CAPS, svg: function (c) { // flat wide-cap mushroom
      return mushStem(26, 8) + FEET + bloom('<path d="M2 66a28 16 0 0 1 56 0z" fill="' + c + '"/><circle cx="18" cy="60" r="2.5" fill="#fff"/>' +
        '<circle cx="32" cy="56" r="3" fill="#fff"/><circle cx="46" cy="61" r="2.5" fill="#fff"/>'); } },
    { colors: CAPS, svg: function (c) { // tall pointed-cap mushroom
      return mushStem(25, 10) + FEET + bloom('<path d="M10 66q0-34 20-48 20 14 20 48z" fill="' + c + '"/><circle cx="26" cy="46" r="3" fill="#fff"/>' +
        '<circle cx="36" cy="36" r="2.5" fill="#fff"/><circle cx="38" cy="54" r="2.5" fill="#fff"/>'); } }
  ];

  function plantSvg(kind, color) {
    return '<svg viewBox="0 0 60 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">' +
      '<g class="g-seed"><ellipse cx="30" cy="96" rx="6" ry="4" fill="#9b7653"/></g>' + KINDS[kind].svg(color) + '</svg>';
  }

  function cloudSvg() {
    return '<svg viewBox="0 0 120 60" aria-hidden="true" focusable="false"><g fill="#fff">' +
      '<ellipse cx="60" cy="38" rx="48" ry="16"/><circle cx="42" cy="30" r="18"/><circle cx="70" cy="24" r="22"/><circle cx="92" cy="34" r="14"/></g></svg>';
  }

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function mount(container) {
    var garden = document.createElement('div');
    garden.className = 'garden';
    garden.setAttribute('role', 'group');
    garden.setAttribute('aria-label', 'Ogród z kwiatami');
    garden.innerHTML = '<div class="g-sky"></div><div class="g-lawn" role="button" tabindex="0" aria-label="Trawnik – posadź roślinę"></div><div class="g-plants"></div>' +
      '<div class="g-cloud" role="button" tabindex="0" aria-label="Chmurka">' + cloudSvg() + '</div>';
    container.appendChild(garden);
    var lawn = garden.querySelector('.g-lawn');
    var layer = garden.querySelector('.g-plants');
    var cloud = garden.querySelector('.g-cloud');
    var live = [];          // growing / grown plants, oldest first
    var fading = 0;         // nodes currently fading out (still in the DOM)
    var timers = [];
    var locked = false;     // true while a cloud reset is fading plants out

    function later(fn, ms) {
      var t = setTimeout(function () {
        timers.splice(timers.indexOf(t), 1);
        fn();
      }, ms);
      timers.push(t);
    }

    function remove(node) {
      if (node.parentNode) { node.parentNode.removeChild(node); }
    }

    function fadeOut(node) {
      fading++;
      node.classList.add('fading');
      later(function () { fading--; remove(node); }, FADE_MS);
    }

    function plant(x, y) {
      // Never exceed MAX_PLANTS live plants; drop the oldest instead of growing without bound.
      while (live.length >= MAX_PLANTS) {
        var old = live.shift();
        if (fading >= MAX_FADING) { remove(old); } else { fadeOut(old); }
      }
      var kind = Math.floor(Math.random() * KINDS.length);
      var node = document.createElement('div');
      node.className = 'g-plant';
      node.style.left = x.toFixed(2) + '%';   // percentages keep plants on the lawn after resize/rotation
      node.style.top = y.toFixed(2) + '%';
      node.style.setProperty('--s', (0.8 + Math.random() * 0.4).toFixed(2));
      node.innerHTML = plantSvg(kind, pick(KINDS[kind].colors));
      layer.appendChild(node);
      live.push(node);
    }

    function onLawn(e) {
      e.preventDefault();
      if (locked) { return; }
      var r = garden.getBoundingClientRect();
      plant((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100);
    }

    function isActivateKey(e) { return e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'; }

    // Keyboard: Enter/Space plants at a random spot on the lawn (lawn spans the bottom 45% of the garden).
    function onLawnKey(e) {
      if (!isActivateKey(e)) { return; }
      e.preventDefault();
      if (locked) { return; }
      plant(10 + Math.random() * 80, 60 + Math.random() * 36);
    }

    function onCloudKey(e) {
      if (isActivateKey(e)) { onCloud(e); }
    }

    function onCloud(e) {
      e.preventDefault();
      e.stopPropagation();
      if (locked) { return; }
      locked = true;
      live.splice(0).forEach(function (n) {
        if (fading >= MAX_FADING) { remove(n); } else { fadeOut(n); }
      });
      later(function () { locked = false; }, FADE_MS);
    }

    function onVisibility() { garden.classList.toggle('paused', document.hidden); }

    lawn.addEventListener('pointerdown', onLawn);
    cloud.addEventListener('pointerdown', onCloud);
    lawn.addEventListener('keydown', onLawnKey);
    cloud.addEventListener('keydown', onCloudKey);
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();

    return function cleanup() {
      lawn.removeEventListener('pointerdown', onLawn);
      cloud.removeEventListener('pointerdown', onCloud);
      lawn.removeEventListener('keydown', onLawnKey);
      cloud.removeEventListener('keydown', onCloudKey);
      document.removeEventListener('visibilitychange', onVisibility);
      timers.forEach(clearTimeout);
      timers = [];
      live = [];
      remove(garden);
    };
  }

  window.ACTIVITIES.forEach(function (a) { if (a.id === 'ogrod') { a.mount = mount; } });
})();
