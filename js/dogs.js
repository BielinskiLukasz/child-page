// Shared dog family: window.Dogs. One drawn side-view style (dog faces right, feet on y = 92 in a 120 x 100 box) used by
// every dog activity. Nothing is stored; the helpers are pure string builders.
//   Dogs.LIST             [{ id, name, size }]  name = Polish parent-facing label, size = 'small' | 'medium' | 'large'
//   Dogs.SCALE            { small: .78, medium: .89, large: 1 }  relative size of each size class
//   Dogs.byId(id)         the entry above; an unknown id falls back to the first breed (no error)
//   Dogs.draw(id, opts)   SVG markup (viewBox 0 0 120 100). opts: { scale } overrides the size-class scale (1 = full size).
//                         Separable parts carry classes so activities can animate them: dg-body, dg-legs, dg-tail
//                         (pivot data-px/data-py), dg-ears (pivot data-px/data-py), dg-head, dg-calm / dg-happy (mouths;
//                         dg-happy is hidden with display="none" by default). Dogs only ever look calm or happy.
(function () {
  var DARK = '#5b5675';
  var SCALE = { small: 0.78, medium: 0.89, large: 1 };

  // len/h/leg: body length, height, leg height; hr: head radius; fur/fur2/ear: colours; ears: floppy|point|fold|puff;
  // tail: thick|curl|pom|stub|bushy; deco: spots|mask|saddle|none
  var DEFS = {
    labrador: { name: 'Labrador', size: 'medium', len: 52, h: 28, leg: 22, hr: 13, snout: 8, fur: '#e8c27a', fur2: '#f3dcab', ear: '#c9a05a', ears: 'floppy', tail: 'thick', deco: 'none' },
    jamnik: { name: 'Jamnik', size: 'small', len: 66, h: 20, leg: 10, hr: 11, snout: 9, fur: '#a8683f', fur2: '#c58d62', ear: '#7d4a2b', ears: 'floppy', tail: 'thick', deco: 'none' },
    husky: { name: 'Husky', size: 'medium', len: 50, h: 28, leg: 24, hr: 13, snout: 7, fur: '#8f98aa', fur2: '#f6f4fa', ear: '#6f788c', ears: 'point', tail: 'curl', deco: 'mask' },
    pudel: { name: 'Pudel', size: 'small', len: 42, h: 26, leg: 22, hr: 12, snout: 7, fur: '#f1e6d6', fur2: '#fbf4ea', ear: '#e6d6bf', ears: 'puff', tail: 'pom', deco: 'none' },
    owczarek: { name: 'Owczarek', size: 'large', len: 58, h: 30, leg: 26, hr: 14, snout: 9, fur: '#c98f55', fur2: '#e2b98a', ear: '#8a5a33', ears: 'point', tail: 'bushy', deco: 'saddle' },
    buldog: { name: 'Buldog', size: 'medium', len: 42, h: 30, leg: 14, hr: 15, snout: 6, fur: '#e3b98c', fur2: '#fbf1e4', ear: '#c08f63', ears: 'fold', tail: 'stub', deco: 'none' },
    corgi: { name: 'Corgi', size: 'small', len: 54, h: 24, leg: 11, hr: 12, snout: 8, fur: '#f0a560', fur2: '#fdf6ec', ear: '#e08e45', ears: 'point', tail: 'stub', deco: 'none' },
    dalmatynczyk: { name: 'Dalmatyńczyk', size: 'large', len: 56, h: 28, leg: 28, hr: 13, snout: 9, fur: '#fbfbfd', fur2: '#ffffff', ear: '#4f4a66', ears: 'floppy', tail: 'thick', deco: 'spots' }
  };
  var ORDER = ['labrador', 'jamnik', 'husky', 'pudel', 'owczarek', 'buldog', 'corgi', 'dalmatynczyk'];
  var LIST = ORDER.map(function (id) { return { id: id, name: DEFS[id].name, size: DEFS[id].size }; });

  function byId(id) {
    for (var i = 0; i < LIST.length; i++) { if (LIST[i].id === id) { return LIST[i]; } }
    return LIST[0];
  }
  function r1(n) { return Math.round(n * 10) / 10; }
  function circ(x, y, r, c) { return '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(r) + '" fill="' + c + '"/>'; }
  function ell(x, y, rx, ry, c, extra) { return '<ellipse cx="' + r1(x) + '" cy="' + r1(y) + '" rx="' + r1(rx) + '" ry="' + r1(ry) + '" fill="' + c + '"' + (extra || '') + '/>'; }

  function tailShape(b) {
    switch (b.tail) {
      case 'curl': return '<path d="M0 0Q-13 -3 -11 -15Q-9 -22 -3 -17" fill="none" stroke="' + b.fur + '" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M-10 -12Q-9 -20 -3 -17" fill="none" stroke="' + b.fur2 + '" stroke-width="3.5" stroke-linecap="round"/>';
      case 'pom': return '<path d="M0 0L-8 -9" stroke="' + b.fur + '" stroke-width="3" stroke-linecap="round"/>' + circ(-10, -12, 6.5, b.fur2);
      case 'stub': return circ(-2, -2, 3.8, b.fur);
      case 'bushy': return ell(-11, 3, 14, 5.5, b.fur, ' transform="rotate(18 -11 3)"') + ell(-15, 5, 8, 3, '#5b4a45', ' transform="rotate(18 -11 3)" opacity=".55"');
      default: return ell(-9, -3, 11, 4, b.fur, ' transform="rotate(-20 -9 -3)"');
    }
  }
  function earShape(b, hr) {
    switch (b.ears) {
      case 'point': return '<path d="M-7 0L-3 -19L6 -2Z" fill="' + b.ear + '"/><path d="M-4 -2L-2.6 -13L2.6 -3Z" fill="#f7c9d6"/>';
      case 'fold': return ell(-1, -2, 6, 4.5, b.ear, ' transform="rotate(-20 -1 -2)"');
      case 'puff': return circ(0, -4, 6, b.ear) + ell(-3, 8, 6.5, 10, b.ear);
      default: return ell(-3, 8, 5.5, 10.5, b.ear, ' transform="rotate(8 -3 8)"');
    }
  }
  function deco(b, x0, top, bot) {
    var i, s = '', c = '#4f4a66';
    if (b.deco === 'spots') {
      var sp = [[0.15, 0.3, 3.2], [0.3, 0.7, 2.6], [0.45, 0.35, 3.6], [0.6, 0.75, 2.8], [0.75, 0.3, 3], [0.88, 0.6, 2.6], [0.55, 0.12, 2.2]];
      for (i = 0; i < sp.length; i++) { s += circ(x0 + sp[i][0] * b.len, top + sp[i][1] * (bot - top), sp[i][2], c); }
    } else if (b.deco === 'saddle') {
      s = '<path d="M' + r1(x0 + 6) + ' ' + r1(top + 2) + 'Q' + r1(x0 + b.len * 0.5) + ' ' + r1(top - 1) + ' ' + r1(x0 + b.len - 6) + ' ' + r1(top + 3) +
        'Q' + r1(x0 + b.len * 0.55) + ' ' + r1(top + b.h * 0.6) + ' ' + r1(x0 + 8) + ' ' + r1(top + b.h * 0.5) + 'Z" fill="#4a3f45" opacity=".85"/>';
    }
    return s;
  }

  function draw(id, opts) {
    var b = DEFS[byId(id).id], sc = (opts && opts.scale != null) ? opts.scale : SCALE[b.size];
    var x0 = 14, x1 = x0 + b.len, bot = 92 - b.leg, top = bot - b.h;
    var hx = x1 + 5, hy = top + 3, hr = b.hr, sn = b.snout, i, legs = '';
    var legX = [x0 + 3, x0 + 13, x1 - 21, x1 - 11];
    for (i = 0; i < 4; i++) {
      legs += '<rect x="' + legX[i] + '" y="' + r1(bot - 4) + '" width="8" height="' + (b.leg + 4) + '" rx="4" fill="' + (i % 2 ? b.fur : b.fur2 === '#ffffff' ? b.fur : b.fur) + '"/>' +
        ell(legX[i] + 4, 91.5, 5, 2.6, b.fur2);
    }
    var tailPx = x0 + 2, tailPy = top + 7;
    var earPx = hx - hr * 0.3, earPy = hy - hr * 0.7;
    var headDark = b.deco === 'mask';
    var body = '<g class="dg-body">' + '<rect x="' + x0 + '" y="' + r1(top) + '" width="' + b.len + '" height="' + b.h + '" rx="' + b.h / 2 + '" fill="' + b.fur + '"/>' +
      ell(x1 - 14, bot - 4, 11, 5, b.fur2) + deco(b, x0, top, bot) + '</g>';
    var tail = '<g class="dg-tail" data-px="' + tailPx + '" data-py="' + r1(tailPy) + '"><g transform="translate(' + tailPx + ' ' + r1(tailPy) + ')">' + tailShape(b) + '</g></g>';
    var ears = '<g class="dg-ears" data-px="' + r1(earPx) + '" data-py="' + r1(earPy) + '"><g transform="translate(' + r1(earPx) + ' ' + r1(earPy) + ')">' + earShape(b, hr) + '</g></g>';
    var nx = hr * 0.7 + sn - 3, ny = hy + hr * 0.3;
    var head = '<g class="dg-head">' + circ(hx, hy, hr, headDark ? '#7b8498' : b.fur) +
      (b.deco === 'spots' ? circ(hx + 2, hy - hr * 0.6, 2.4, '#4f4a66') : '') +
      ell(hx + hr * 0.7, ny, sn, hr * 0.5, headDark ? '#f6f4fa' : b.fur2) +
      (headDark ? ell(hx + 1, hy + 3, hr * 0.7, hr * 0.7, '#f6f4fa') : '') +
      ell(hx + nx - hr * 0.7 + hr * 0.7 + 3, ny - hr * 0.2, 3, 2.2, DARK) +
      circ(hx + hr * 0.3, hy - hr * 0.2, 2, DARK) + circ(hx + hr * 0.3 + 0.7, hy - hr * 0.2 - 0.7, 0.7, '#fff') +
      '<path class="dg-calm" d="M' + r1(hx + hr * 0.5) + ' ' + r1(ny + 2.5) + 'Q' + r1(hx + hr * 0.9) + ' ' + r1(ny + 5) + ' ' + r1(hx + hr * 1.35 + sn * 0.4) + ' ' + r1(ny + 2.2) + '" fill="none" stroke="' + DARK + '" stroke-width="1.3" stroke-linecap="round"/>' +
      '<g class="dg-happy" display="none"><path d="M' + r1(hx + hr * 0.5) + ' ' + r1(ny + 2) + 'Q' + r1(hx + hr * 0.9) + ' ' + r1(ny + 9) + ' ' + r1(hx + hr * 1.35 + sn * 0.4) + ' ' + r1(ny + 2) + 'Z" fill="#8a4a5e"/>' +
      ell(hx + hr * 0.95, ny + 6, 2.6, 2.2, '#f48aa8') + '</g></g>';
    var inner = tail + '<g class="dg-legs">' + legs + '</g>' + body + head + ears;
    var tf = 'translate(60 92) scale(' + sc + ') translate(-60 -92)';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" class="dg-svg" aria-hidden="true"><g transform="' + tf + '">' + inner + '</g></svg>';
  }

  window.Dogs = { LIST: LIST, SCALE: SCALE, byId: byId, draw: draw };
})();
