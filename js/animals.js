// Shared animal family: window.Animals. One drawn style (round head, r = 16, centred on 0,0) used by every activity that
// picks random animals (Pociąg, Dobranoc, Farma, Chowany, Cienie, Autobusik, Buźki). Nothing is stored; the helpers are
// pure string builders plus a random picker on top of window.Rand.
//   Animals.LIST               [{ id, name, fur, sil, top }]  name = Polish label, sil = silhouette group, top = ear height above 0,0
//   Animals.byId(id)           the entry above
//   Animals.head(id, opts)     SVG markup of the head. opts: { noEyes, bare, body, eyesClass, shadow }
//                               noEyes: leave the dark eye dots out (the caller draws its own; see Animals.eyes(id))
//                               bare: only the shape (ears, face, muzzle) - no eyes, nose or mouth (Buźki draws its own)
//                               body: add a small body ellipse behind the head (full figure)
//                               eyesClass: wrap the eye dots in <g class="..."> so a caller can blink them
//                               shadow: a colour; the whole shape is drawn in this one colour with no details
//   Animals.eyes(id)           [[x, y], ...] eye centres and Animals.eyeColor(id) the dot colour
//   Animals.pick(n, opts)      n unique animals at random; opts.ids limits the pool, opts.distinct = true avoids two
//                               animals of one silhouette group (Cienie)
(function () {
  var DARK = '#5b5675';

  // Template tokens: {f} fur, {a} accent. d(...) helpers keep the strings short.
  function circ(x, y, r, c) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '"/>'; }
  function ell(x, y, rx, ry, c, extra) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + c + '"' + (extra || '') + '/>'; }
  function path(d, c) { return '<path d="' + d + '" fill="' + c + '"/>'; }

  // back: drawn behind the face; face: head disc and shapes on it; nose: nose/mouth details; eyes: dot centres.
  var DEFS = {
    bear: { name: 'Miś', fur: '#d2a67f', sil: 'round', top: 19, body: '#d2a67f',
      back: function (f) { return circ(-13, -13, 6, f) + circ(13, -13, 6, f); },
      face: function (f) { return circ(0, 0, 16, f) + ell(0, 5, 6, 4.5, '#f3dcc4'); },
      nose: function () { return circ(0, 3.5, 2, '#6b5a73'); }, eyes: [[-6, -3], [6, -3]] },
    rabbit: { name: 'Króliczek', fur: '#f3ecf7', sil: 'long', top: 38,
      back: function (f) { return ell(-8, -26, 4.5, 12, f) + ell(8, -26, 4.5, 12, f) + ell(-8, -26, 2, 8, '#f7b7cf') + ell(8, -26, 2, 8, '#f7b7cf'); },
      face: function (f) { return circ(0, 0, 16, f); },
      nose: function () { return circ(0, 4, 2, '#e99bb5'); }, eyes: [[-6, -3], [6, -3]] },
    cat: { name: 'Kotek', fur: '#f2c48d', sil: 'point', top: 25,
      back: function (f) { return path('M-15 -8l3-17 11 9z', f) + path('M15 -8l-3-17-11 9z', f) + path('M-12 -12l1.5-8 5 4z', '#f7c9d6') + path('M12 -12l-1.5-8-5 4z', '#f7c9d6'); },
      face: function (f) { return circ(0, 0, 16, f); },
      nose: function () { return circ(0, 4, 2, '#e99bb5'); }, eyes: [[-6, -3], [6, -3]] },
    dog: { name: 'Piesek', fur: '#dcb88e', sil: 'floppy', top: 17, side: 21,
      back: function () { return '<ellipse cx="-14" cy="-1" rx="5.5" ry="11" fill="#b58a62" transform="rotate(14 -14 -1)"/>' +
        '<ellipse cx="14" cy="-1" rx="5.5" ry="11" fill="#b58a62" transform="rotate(-14 14 -1)"/>'; },
      face: function (f) { return circ(0, 0, 16, f) + ell(0, 6, 7, 5, '#f6e6d2'); },
      nose: function () { return ell(0, 3.5, 3, 2, DARK); }, eyes: [[-6, -3], [6, -3]] },
    mouse: { name: 'Myszka', fur: '#cfcad8', sil: 'bigear', top: 20,
      back: function (f) { return circ(-12, -12, 8, f) + circ(12, -12, 8, f) + circ(-12, -12, 5, '#f7c9d6') + circ(12, -12, 5, '#f7c9d6'); },
      face: function (f) { return circ(0, 0, 16, f); },
      nose: function () { return circ(0, 4, 1.8, '#e99bb5') + '<path d="M-5 6l-8-1M-5 8l-8 2M5 6l8-1M5 8l8 2" stroke="' + DARK + '" stroke-width="1" stroke-linecap="round" fill="none" opacity=".55"/>'; },
      eyes: [[-6, -3], [6, -3]] },
    pig: { name: 'Świnka', fur: '#f7b9c8', sil: 'folded', top: 22,
      back: function (f) { return path('M-14 -7L-18 -21 -4 -14z', f) + path('M14 -7L18 -21 4 -14z', f); },
      face: function (f) { return circ(0, 0, 16, f) + ell(0, 5, 7, 5, '#ef93aa'); },
      nose: function () { return circ(-2.6, 5, 1.2, '#b0607a') + circ(2.6, 5, 1.2, '#b0607a'); }, eyes: [[-6, -3], [6, -3]] },
    fox: { name: 'Lisek', fur: '#f2a45b', sil: 'point', top: 30,
      back: function (f) { return path('M-15 -6L-13 -30 -2 -13z', f) + path('M15 -6L13 -30 2 -13z', f) + path('M-12 -12l1-10 4 6z', '#5b4a55') + path('M12 -12l-1-10-4 6z', '#5b4a55'); },
      face: function (f) { return circ(0, 0, 16, f) + ell(0, 8, 11, 8, '#fff4e6'); },
      nose: function () { return circ(0, 5.5, 2, DARK); }, eyes: [[-6, -3], [6, -3]] },
    lion: { name: 'Lew', fur: '#f0c36b', sil: 'mane', top: 22, side: 22,
      back: function (f) { return circ(0, 0, 22, '#d9964a') + circ(-11, -14, 4.5, f) + circ(11, -14, 4.5, f); },
      face: function (f) { return circ(0, 0, 16, f) + ell(0, 6, 6, 4.5, '#fbe3b8'); },
      nose: function () { return circ(0, 4, 2, '#8a5a44'); }, eyes: [[-6, -3], [6, -3]] },
    elephant: { name: 'Słoń', fur: '#b9c9dc', sil: 'trunk', top: 17, side: 27,
      back: function (f) { return circ(-17, 0, 10, f) + circ(17, 0, 10, f) + circ(-17, 0, 6, '#d6b8c8') + circ(17, 0, 6, '#d6b8c8'); },
      face: function (f) { return circ(0, 0, 16, f) + '<rect x="-4" y="3" width="8" height="22" rx="4" fill="' + f + '"/>'; },
      nose: function () { return '<path d="M-3 12h6M-3 17h6" stroke="#8fa3bb" stroke-width="1.4" stroke-linecap="round"/>'; },
      eyes: [[-6, -3], [6, -3]] },
    panda: { name: 'Panda', fur: '#fbfbfd', sil: 'round', top: 19,
      back: function () { return circ(-12, -13, 6, '#4a4560') + circ(12, -13, 6, '#4a4560'); },
      face: function (f) { return circ(0, 0, 16, f) + '<ellipse cx="-6" cy="-2" rx="4.5" ry="5.5" fill="#4a4560" transform="rotate(20 -6 -2)"/>' +
        '<ellipse cx="6" cy="-2" rx="4.5" ry="5.5" fill="#4a4560" transform="rotate(-20 6 -2)"/>'; },
      nose: function () { return ell(0, 4.5, 2.4, 1.8, '#4a4560'); }, eyes: [[-6, -3], [6, -3]], eyeColor: '#fff' },
    frog: { name: 'Żabka', fur: '#9fd48f', sil: 'bulb', top: 19,
      back: function (f) { return circ(-9, -13, 6, f) + circ(9, -13, 6, f); },
      face: function (f) { return circ(0, 0, 16, f) + circ(-9, -13, 4.4, '#fff') + circ(9, -13, 4.4, '#fff'); },
      nose: function () { return '<path d="M-8 5q8 6 16 0" fill="none" stroke="#5b7a52" stroke-width="1.8" stroke-linecap="round"/>'; },
      eyes: [[-9, -13], [9, -13]] },
    owl: { name: 'Sowa', fur: '#b89a7c', sil: 'tuft', top: 22,
      back: function (f) { return path('M-14 -8L-13 -22 -4 -13z', f) + path('M14 -8L13 -22 4 -13z', f); },
      face: function (f) { return circ(0, 0, 16, f) + circ(-6.5, -3, 6, '#f3e4cf') + circ(6.5, -3, 6, '#f3e4cf'); },
      nose: function () { return path('M-2.5 3h5l-2.5 5z', '#f2b84b'); }, eyes: [[-6.5, -3], [6.5, -3]] },
    koala: { name: 'Koala', fur: '#aeb4bf', sil: 'round', top: 20, side: 22,
      back: function (f) { return circ(-14, -12, 8.5, f) + circ(14, -12, 8.5, f) + circ(-14, -12, 5, '#f0e6ee') + circ(14, -12, 5, '#f0e6ee'); },
      face: function (f) { return circ(0, 0, 16, f); },
      nose: function () { return ell(0, 3, 4.2, 5.5, '#4a4560'); }, eyes: [[-7, -4], [7, -4]] }
  };
  var ORDER = ['bear', 'rabbit', 'cat', 'dog', 'mouse', 'pig', 'fox', 'lion', 'elephant', 'panda', 'frog', 'owl', 'koala'];

  var LIST = ORDER.map(function (id) {
    var d = DEFS[id];
    return { id: id, name: d.name, fur: d.fur, sil: d.sil, top: d.top };
  });
  var BY_ID = {};
  LIST.forEach(function (a) { BY_ID[a.id] = a; });

  function byId(id) { return BY_ID[id]; }

  function head(id, opts) {
    var d = DEFS[id];
    if (!d) { return ''; }
    opts = opts || {};
    var f = opts.shadow || d.fur;
    var s = d.back(f);
    if (opts.body) { s += ell(0, 27, 18, 12, f); }
    var face = d.face(f);
    if (opts.shadow) {
      // one flat colour: every fill in the shape becomes the shadow colour
      var all = s + face;
      return all.replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="' + opts.shadow + '"');
    }
    s += face;
    if (opts.bare) { return s; }
    if (!opts.noEyes) {
      var dots = '', ec = d.eyeColor || DARK;
      d.eyes.forEach(function (p) { dots += circ(p[0], p[1], 2, ec); });
      s += opts.eyesClass ? '<g class="' + opts.eyesClass + '">' + dots + '</g>' : dots;
    }
    return s + d.nose(f);
  }

  function eyes(id) { return DEFS[id] ? DEFS[id].eyes : []; }
  function eyeColor(id) { return (DEFS[id] && DEFS[id].eyeColor) || DARK; }

  // n unique animals at random. opts.ids: restrict the pool; opts.distinct: at most one animal per silhouette group
  // (falls back to plain unique picks when the pool has too few groups).
  function pick(n, opts) {
    opts = opts || {};
    var pool = (opts.ids || ORDER).map(byId);
    var shuffled = window.Rand ? window.Rand.shuffle(pool) : pool.slice().sort(function () { return Math.random() - 0.5; });
    if (!opts.distinct) { return shuffled.slice(0, n); }
    var out = [], seen = {};
    shuffled.forEach(function (a) { if (out.length < n && !seen[a.sil]) { seen[a.sil] = 1; out.push(a); } });
    shuffled.forEach(function (a) { if (out.length < n && out.indexOf(a) < 0) { out.push(a); } });
    return out;
  }

  window.Animals = { LIST: LIST, byId: byId, head: head, eyes: eyes, eyeColor: eyeColor, pick: pick };
})();
