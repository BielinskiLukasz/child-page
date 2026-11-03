// Activity "Zakupy": a shop with six shelf slots (each shows 2-4 units of one product, drawn from a pool of 22 kinds, with a barcode stripe),
// a big basket, a checkout button and a counter with a scanner. A shopping list of 1-5 pictures (kinds that are on the shelves) is shown
// at the top (round 1 = 1 item ... round 5 = 5, then it starts again from 1). Dragging a product from a shelf onto the basket takes one
// unit off the shelf and puts it in the basket (up to 15 items, the same product any number of times); an emptied slot stays empty for
// 2 s and is then restocked with 2-4 fresh units. Dragging the basket to the counter, tapping it or pressing the checkout button brings
// the basket to the counter. Basket items are used first; list products that were not picked are added until the counter holds as many
// items as the list. The counter shows 5 items at a time (further waves follow); each is dragged across the scanner (or activated with
// Enter/Space): the scanner flashes a green line and the numeral at the top rises by 1. Any product is accepted and the same product
// several times counts normally. When everything is scanned a big receipt (one picture + count numeral per product) slides out, the shop
// owner (an animal) smiles and about 4 s later a new list starts with a different random set of products on the shelves. Nothing is
// scored or stored, no wrong answers, no sound.
// Keyboard: arrows move focus between the visible products/basket/checkout or counter items; Enter/Space puts a product in the basket,
// presses checkout or scans a counter item. One capped-dt rAF loop (final states set from JS, never only in CSS keyframes), pauses while
// hidden, stops when idle.
// Optional store scale (shop screen only): a produce unit (11 of the 22 kinds, each light/medium/heavy) dropped on the plate stays there (up to 5),
// the plate dips 4-8 px and the dial pointer swings (damped spring, ~0.8 s) to an angle proportional to the summed weight (capped at the dial end);
// non-produce glides back. A unit on the plate goes into the basket when dragged there, is taken off by a tap or by dragging it elsewhere (it
// returns to its shelf) and is moved into the basket automatically at checkout. The dial has ticks and a pointer only, no text.
// Keyboard: Enter/Space on the scale weighs the last focused produce product (else the first produce on the shelves); Enter/Space on a plate unit takes it off.
// Usage metrics: track('interaction', {variant: product id}) per product put in the basket and per scan, track('interaction', {variant: 'weigh'})
// per unit put on the scale, complete() when a round is fully scanned; the activity stays open-ended (a new list starts by itself).
(function () {
  var SCAN_FLASH_S = 0.45, BACK_S = 0.4, TO_S = 0.6, BAG_S = 0.45, RECEIPT_S = 0.9, DONE_S = 4.0, FADE_S = 0.5, KEY_SCAN_S = 0.5;
  var MAX_ROUND = 5, MAX_BASKET = 15, SHELF_N = 6, RESTOCK_S = 2, IN_S = 0.2, WAVE_FADE_S = 0.3, TOP_MIN = 48, TOP_MAX = 64;

  // Each product: drawn in the upper part of a 64 x 64 box; the barcode label (white with black bars) is the same for all.
  var BARCODE = '<rect x="12" y="49" width="40" height="13" rx="2" fill="#fff" stroke="#cfc8dc" stroke-width="1"/>' +
    '<path d="M16 52v7M19 52v7M23 52v7M25 52v7M29 52v7M32 52v7M36 52v7M38 52v7M42 52v7M45 52v7M48 52v7" stroke="#3d3a4f" stroke-width="1.6"/>';
  var PRODUCTS = [
    { id: 'apple', label: 'Jabłko', art: '<ellipse cx="32" cy="29" rx="17" ry="16" fill="#ee6a5f"/><path d="M32 13q-1-6 4-8" fill="none" stroke="#7a5a3a" stroke-width="2.5" stroke-linecap="round"/><path d="M33 13q7-5 11 0q-6 5-11 0z" fill="#7fc26b"/><ellipse cx="25" cy="24" rx="4" ry="6" fill="#fff" fill-opacity=".35"/>' },
    { id: 'banana', label: 'Banan', art: '<path d="M10 20Q16 44 44 40Q52 38 54 30Q50 36 42 36Q22 36 16 14z" fill="#f8d65a" stroke="#d8b23a" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 20l5-8 3 3z" fill="#8d6847"/>' },
    { id: 'bread', label: 'Chleb', art: '<path d="M8 36Q6 14 32 14t24 22q0 8-6 8H14q-6 0-6-8z" fill="#e0a85f"/><path d="M20 22l6 8M32 18l6 10M44 22l5 7" stroke="#b9803f" stroke-width="2.5" stroke-linecap="round"/><path d="M12 44h40" stroke="#c78f4c" stroke-width="2"/>' },
    { id: 'milk', label: 'Mleko', art: '<path d="M18 16l8-8h12l8 8v30H18z" fill="#fdfbff" stroke="#b7deff" stroke-width="2" stroke-linejoin="round"/><rect x="18" y="24" width="28" height="14" fill="#8cc8f2"/><circle cx="32" cy="31" r="4" fill="#fff"/><path d="M26 8h12" stroke="#b7deff" stroke-width="2"/>' },
    { id: 'carrot', label: 'Marchewka', art: '<path d="M44 14l6 8Q38 44 12 46q-3-14 4-24Q30 12 44 14z" transform="rotate(-10 32 30)" fill="#f4a261"/><path d="M22 24l6 2M30 30l6 2M20 36l5 1" stroke="#e08a45" stroke-width="2" stroke-linecap="round"/><path d="M44 14q-2-8 4-9M46 16q6-6 10-2M47 19q8-1 9 5" fill="none" stroke="#7fc26b" stroke-width="3.5" stroke-linecap="round"/>' },
    { id: 'cheese', label: 'Ser', art: '<path d="M6 34L50 14v18H6z" fill="#fbd75a" stroke="#e0b53a" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 34h44v10H6z" fill="#f4c542" stroke="#e0b53a" stroke-width="1.5" stroke-linejoin="round"/><circle cx="18" cy="38" r="2.5" fill="#e0b53a"/><circle cx="34" cy="40" r="2" fill="#e0b53a"/><circle cx="30" cy="24" r="3" fill="#e0b53a"/>' },
    { id: 'orange', label: 'Pomarańcza', art: '<circle cx="32" cy="28" r="17" fill="#f7a23b"/><path d="M32 11q2-4 7-4q-1 5-7 4z" fill="#6fb35a"/><ellipse cx="25" cy="22" rx="4" ry="6" fill="#fff" fill-opacity=".35"/><circle cx="38" cy="34" r="1.2" fill="#e0861f"/><circle cx="28" cy="38" r="1.2" fill="#e0861f"/>' },
    { id: 'strawberry', label: 'Truskawka', art: '<path d="M32 46Q10 32 14 20Q17 12 32 17Q47 12 50 20Q54 32 32 46z" fill="#e5484d"/><path d="M22 12l10 6 10-6-5 9h-10z" fill="#5fae4e"/><circle cx="24" cy="26" r="1.5" fill="#ffe29a"/><circle cx="34" cy="24" r="1.5" fill="#ffe29a"/><circle cx="41" cy="30" r="1.5" fill="#ffe29a"/><circle cx="29" cy="34" r="1.5" fill="#ffe29a"/><circle cx="35" cy="40" r="1.5" fill="#ffe29a"/>' },
    { id: 'grapes', label: 'Winogrona', art: '<g fill="#8e5bc4"><circle cx="22" cy="22" r="7"/><circle cx="34" cy="20" r="7"/><circle cx="45" cy="24" r="7"/><circle cx="27" cy="32" r="7"/><circle cx="39" cy="32" r="7"/><circle cx="33" cy="42" r="6"/></g><path d="M34 14q0-6 6-8" fill="none" stroke="#7a5a3a" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="20" r="2" fill="#fff" fill-opacity=".45"/>' },
    { id: 'pear', label: 'Gruszka', art: '<path d="M32 10Q40 10 40 21Q53 28 48 38Q44 46 32 46Q20 46 16 38Q11 28 24 21Q24 10 32 10z" fill="#b9d654"/><path d="M32 10q0-5 4-6" fill="none" stroke="#7a5a3a" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="25" cy="32" rx="3" ry="6" fill="#fff" fill-opacity=".35"/>' },
    { id: 'tomato', label: 'Pomidor', art: '<circle cx="32" cy="29" r="17" fill="#e8443a"/><path d="M32 13l-8 4 6 1-3 5 5-3 3 4 3-4 5 3-3-5 6-1-8-4z" fill="#5fae4e"/><ellipse cx="25" cy="26" rx="3.5" ry="5" fill="#fff" fill-opacity=".35"/>' },
    { id: 'cucumber', label: 'Ogórek', art: '<rect x="6" y="20" width="52" height="18" rx="9" fill="#4f9f4a" transform="rotate(-12 32 29)"/><g fill="#8fd17a" transform="rotate(-12 32 29)"><circle cx="16" cy="29" r="1.8"/><circle cx="26" cy="26" r="1.8"/><circle cx="36" cy="32" r="1.8"/><circle cx="46" cy="28" r="1.8"/></g>' },
    { id: 'broccoli', label: 'Brokuł', art: '<rect x="27" y="28" width="10" height="18" rx="3" fill="#9fcf7a"/><g fill="#3f9a45"><circle cx="20" cy="26" r="9"/><circle cx="32" cy="17" r="10"/><circle cx="44" cy="26" r="9"/><circle cx="27" cy="29" r="8"/><circle cx="38" cy="29" r="8"/></g>' },
    { id: 'eggs', label: 'Jajka', art: '<ellipse cx="23" cy="29" rx="12" ry="15" fill="#fff6e5" stroke="#e2cfa8" stroke-width="2"/><ellipse cx="42" cy="32" rx="12" ry="14" fill="#f3d3a0" stroke="#d8b57a" stroke-width="2"/><ellipse cx="19" cy="24" rx="3" ry="5" fill="#fff" fill-opacity=".7"/>' },
    { id: 'juice', label: 'Sok', art: '<path d="M18 14l6-5h16l6 5v32H18z" fill="#ffb347" stroke="#e08a1f" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="30" r="8" fill="#fff"/><path d="M32 22v16M24 30h16" stroke="#f7a23b" stroke-width="2"/><path d="M38 10l5-8h7" fill="none" stroke="#e8605a" stroke-width="3" stroke-linecap="round"/>' },
    { id: 'fish', label: 'Ryba', art: '<ellipse cx="28" cy="28" rx="20" ry="12" fill="#6fb7e6"/><path d="M44 28l13-11v22z" fill="#4f9bd0"/><circle cx="17" cy="25" r="3" fill="#fff"/><circle cx="16.5" cy="25" r="1.4" fill="#33415c"/><path d="M26 18q5 10 0 20M34 18q5 10 0 20" fill="none" stroke="#4f9bd0" stroke-width="2"/>' },
    { id: 'candy', label: 'Cukierek', art: '<path d="M18 28L5 19v18zM46 28l13-9v18z" fill="#ffb3d4"/><circle cx="32" cy="28" r="14" fill="#ff7eb6"/><path d="M24 20q8 8 0 16" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M36 18q6 10 2 18" fill="none" stroke="#ffd0e5" stroke-width="2.5" stroke-linecap="round"/>' },
    { id: 'toy', label: 'Kaczka (zabawka)', art: '<ellipse cx="29" cy="35" rx="19" ry="11" fill="#ffd84a"/><circle cx="43" cy="20" r="11" fill="#ffd84a"/><path d="M51 19l9 4-9 4z" fill="#f48c2a"/><circle cx="46" cy="17" r="2" fill="#33415c"/><path d="M12 32q9 8 18 0" fill="none" stroke="#f0b92a" stroke-width="2.5" stroke-linecap="round"/>' },
    { id: 'yogurt', label: 'Jogurt', art: '<path d="M18 16h28l-4 30H22z" fill="#fff" stroke="#e5a1c5" stroke-width="2" stroke-linejoin="round"/><path d="M19.5 26h25l-1.2 10h-22.6z" fill="#ff9ec4"/><rect x="15" y="10" width="34" height="7" rx="3" fill="#c9c3dc"/>' },
    { id: 'cookie', label: 'Ciastko', art: '<circle cx="32" cy="28" r="18" fill="#d9a35f"/><g fill="#6b4630"><circle cx="24" cy="22" r="2.6"/><circle cx="37" cy="21" r="2.6"/><circle cx="30" cy="31" r="2.6"/><circle cx="42" cy="32" r="2.6"/><circle cx="23" cy="36" r="2.6"/></g>' },
    { id: 'melon', label: 'Arbuz', art: '<path d="M6 18h52a26 26 0 0 1-52 0z" fill="#ef5a6b"/><path d="M6 18a26 26 0 0 0 52 0" fill="none" stroke="#4f9f4a" stroke-width="5"/><g fill="#33302b"><ellipse cx="20" cy="26" rx="1.8" ry="3"/><ellipse cx="32" cy="30" rx="1.8" ry="3"/><ellipse cx="44" cy="26" rx="1.8" ry="3"/></g>' },
    { id: 'lollipop', label: 'Lizak', art: '<path d="M32 36v11" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M32 36v11" stroke="#cfc8dc" stroke-width="1.5" stroke-linecap="round"/><circle cx="32" cy="22" r="15" fill="#ff8fb0"/><path d="M32 22m0 0q4-3 4 1t-8 1q-6-3-2-9t12 2" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>' }
  ];
  function iconSvg(p, cls) {
    return '<svg viewBox="0 0 64 64" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + p.art + BARCODE + '</svg>';
  }
  function thumbSvg(p) { return '<svg viewBox="0 0 64 50" aria-hidden="true">' + p.art + '</svg>'; }
  var BASKET_SVG = '<svg viewBox="0 0 100 70" aria-hidden="true"><path d="M26 22Q50 -2 74 22" fill="none" stroke="#a8683f" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M6 24h88l-10 40q-1 4-5 4H21q-4 0-5-4z" fill="#d9a066"/><path d="M6 24h88" stroke="#a8683f" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M28 32l3 28M50 32v30M72 32l-3 28" stroke="#b9803f" stroke-width="3" stroke-linecap="round"/></svg>';
  var REGISTER_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="30" width="48" height="26" rx="5" fill="#8f7fd1"/><rect x="14" y="10" width="36" height="20" rx="4" fill="#dff1fb" stroke="#6f62b0" stroke-width="3"/>' +
    '<path d="M22 20h20" stroke="#6f62b0" stroke-width="3" stroke-linecap="round"/><rect x="14" y="38" width="10" height="6" rx="2" fill="#dcd5f5"/><rect x="27" y="38" width="10" height="6" rx="2" fill="#dcd5f5"/><rect x="40" y="38" width="10" height="6" rx="2" fill="#dcd5f5"/><rect x="14" y="47" width="36" height="5" rx="2" fill="#6f62b0"/></svg>';
  // Produce on the scale: weight class 1 = light, 2 = medium, 3 = heavy (11 of the 22 kinds); everything else is not weighable.
  var WEIGHT = { strawberry: 1, grapes: 1, carrot: 1, apple: 2, orange: 2, tomato: 2, pear: 2, banana: 2, cucumber: 2, broccoli: 3, melon: 3 };
  var UNIT_DEG = 30, REST_DEG = -100, MAX_DEG = 200, PLATE_MAX = 5, PL_POOL = 8, PIS = 56, PSTEP = 24;
  var SC_W = 160, SC_H = 104, SC_PLATE_W = 152, SC_PLATE_Y = 50, SC_BODY_Y = 60, SC_BODY_H = 44, DIP_MIN = 4, DIP_MAX = 8, SPRING_K = 64, SPRING_C = 9.6;
  var SCALE_SVG = (function () {
    var t = '', k, a, c, sn, x1, y1, x2, y2;
    for (k = 0; k <= 8; k++) {
      a = (REST_DEG + k * MAX_DEG / 8) * Math.PI / 180; sn = Math.sin(a); c = Math.cos(a);
      x1 = 80 + sn * 14.5; y1 = 22 - c * 14.5; x2 = 80 + sn * 17.5; y2 = 22 - c * 17.5;
      t += 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1);
    }
    return '<svg viewBox="0 0 ' + SC_W + ' ' + SC_BODY_H + '" aria-hidden="true"><rect x="4" y="2" width="152" height="40" rx="12" fill="#8f7fd1"/>' +
      '<rect x="4" y="34" width="152" height="8" rx="4" fill="#6f62b0"/><circle cx="80" cy="22" r="19" fill="#fff" stroke="#5b5675" stroke-width="3"/>' +
      '<path d="' + t + '" stroke="#5b5675" stroke-width="1.6" stroke-linecap="round" fill="none"/>' +
      '<g class="zk-ptr" transform="rotate(' + REST_DEG + ' 80 22)"><path d="M80 22V8" stroke="#e8443a" stroke-width="3" stroke-linecap="round"/></g>' +
      '<circle cx="80" cy="22" r="3" fill="#5b5675"/></svg>';
  })();
  var lastKinds = '';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function report(fn) { try { if (window.Analytics) { fn(window.Analytics); } } catch (e) { /* metrics must never break the activity */ } }
  function shuffled(a) {
    var r = a.slice(), i, j, t;
    for (i = r.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = r[i]; r[i] = r[j]; r[j] = t; }
    return r;
  }
  function byId(id) { for (var i = 0; i < PRODUCTS.length; i++) { if (PRODUCTS[i].id === id) { return PRODUCTS[i]; } } return PRODUCTS[0]; }
  // Six distinct kinds for the shelves; a new draw never repeats the previous set.
  function drawShelf() {
    var l, key, tries = 0;
    do { l = shuffled(PRODUCTS).slice(0, SHELF_N); key = l.map(function (p) { return p.id; }).sort().join(','); tries++; } while (key === lastKinds && tries < 8);
    lastKinds = key;
    return l;
  }
  function randStock() { return 2 + Math.floor(Math.random() * 3); }
  // Which products end up on the counter: the basket first, then missing list products until the counter holds as many items as the list.
  function counterKinds(basket, list) {
    var out = basket.slice(), need = list.slice(), i, k;
    basket.forEach(function (id) { k = need.indexOf(id); if (k >= 0) { need.splice(k, 1); } });
    for (i = 0; i < need.length && out.length < list.length; i++) { out.push(need[i]); }
    return out;
  }

  function mount(container) {
    container.style.display = 'block';
    var root = document.createElement('div');
    root.className = 'zk';
    root.innerHTML =
      '<div class="zk-wall"></div><div class="zk-floor"></div>' +
      '<div class="zk-top"><div class="zk-list"></div><div class="zk-num" aria-live="off">0</div></div>' +
      '<div class="zk-shelves"></div>' +
      '<div class="zk-scene"><div class="zk-belt"></div><div class="zk-bag"></div><div class="zk-scanner"><div class="zk-laser"></div></div></div>' +
      '<div class="zk-receipt"></div>' +
      '<div class="zk-owner"></div>';
    container.appendChild(root);
    var listEl = root.querySelector('.zk-list'), numEl = root.querySelector('.zk-num');
    var shelves = root.querySelector('.zk-shelves'), scene = root.querySelector('.zk-scene'), belt = root.querySelector('.zk-belt');
    var bag = root.querySelector('.zk-bag'), scanner = root.querySelector('.zk-scanner'), laser = root.querySelector('.zk-laser');
    var receipt = root.querySelector('.zk-receipt'), ownerEl = root.querySelector('.zk-owner'), floor = root.querySelector('.zk-floor');

    var prods = [], i;
    for (i = 0; i < SHELF_N; i++) {
      (function (k) {
        var b = document.createElement('button'), g = document.createElement('div');
        b.type = 'button'; b.className = 'zk-prod'; root.appendChild(b);
        g.className = 'zk-ghost'; root.appendChild(g);
        prods.push({ kind: PRODUCTS[k], node: b, ghost: g, stock: 0, restock: 0, shown: '', hx: 0, hy: 0, x: 0, y: 0, x0: 0, y0: 0, t: 0, mode: 'home', alpha: 1 });
      })(i);
    }
    var basketBtn = document.createElement('button');
    basketBtn.type = 'button'; basketBtn.className = 'zk-basket';
    basketBtn.setAttribute('aria-label', 'Koszyk. Naciśnij Enter, aby przejść do kasy.');
    basketBtn.innerHTML = '<span class="zk-bart">' + BASKET_SVG + '</span><span class="zk-bth"></span>';
    root.appendChild(basketBtn);
    var bThumbs = basketBtn.querySelector('.zk-bth');
    var regBtn = document.createElement('button');
    regBtn.type = 'button'; regBtn.className = 'zk-reg'; regBtn.innerHTML = REGISTER_SVG;
    regBtn.setAttribute('aria-label', 'Kasa. Naciśnij Enter, aby zanieść koszyk do kasy.');
    root.appendChild(regBtn);
    var cn = [];
    for (i = 0; i < MAX_ROUND; i++) {
      (function () {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'zk-item';
        root.appendChild(b);
        cn.push({ kind: null, node: b, hx: 0, hy: 0, x: 0, y: 0, x0: 0, y0: 0, t: 0, mode: 'off', alpha: 0, scanned: false, bx: 0, by: 0 });
      })();
    }

    // store scale: body button with the dial, the plate (a plain div) and a pool of plate units (buttons)
    var plateEl = document.createElement('div');
    plateEl.className = 'zk-plate'; root.appendChild(plateEl);
    var scaleBtn = document.createElement('button');
    scaleBtn.type = 'button'; scaleBtn.className = 'zk-scale'; scaleBtn.innerHTML = SCALE_SVG;
    scaleBtn.setAttribute('aria-label', 'Waga. Naciśnij Enter, aby położyć na wadze wybrany owoc lub warzywo.');
    root.appendChild(scaleBtn);
    var pointerEl = scaleBtn.querySelector('.zk-ptr');
    var pl = [];
    for (i = 0; i < PL_POOL; i++) {
      (function () {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'zk-pi'; b.style.width = b.style.height = PIS + 'px'; root.appendChild(b);
        pl.push({ kind: null, from: null, node: b, hx: 0, hy: 0, x: 0, y: 0, x0: 0, y0: 0, t: 0, mode: 'off', alpha: 0, seq: 0 });
      })();
    }

    var W = 320, H = 568, topH = TOP_MAX, botH = 100, psz = 80, gsz = 64, isz = 64, bsz = 76, regSz = 60, osz = 80, ls = 36;
    var bkW = 116, bkH = 81, pUw = 40, pTh = 31, pStep = 34, pStepY = 27, pCols = 3, pV = 12, pileUp = 0, recW = 80, recH = 100, recRow = 24;
    var midT = 0, midB = 0, shelfB = 0, rowH = 0, scBand = false, scCx = 0, scTop = 0, scY = 0, scX0 = 0, scX1 = 0, beltY = 0, bagY = 0, floorT = 0;
    var round = 0, list = [], basket = [], queue = [], tally = {}, tallyOrder = [], phase = 'shop', phaseT = 0, count = 0, flash = 0, owner = null, smile = false, recT = -1;
    var bk = { x: 0, y: 0, hx: 0, hy: 0, x0: 0, y0: 0, t: 0, mode: 'home', moved: false };
    var sceneAlpha = 0, shelfAlpha = 1;
    var ptA = REST_DEG, ptV = 0, dip = 0, plSeq = 0, lastProd = null;
    var alive = true, raf = 0, last = 0, drag = null;

    // ---- geometry -------------------------------------------------------------------------------------------
    function layout() {
      var r = root.getBoundingClientRect();
      W = Math.max(280, r.width); H = Math.max(240, r.height);
      topH = clamp(H * 0.12, TOP_MIN, TOP_MAX);
      ls = Math.min(clamp(topH * 0.62, 30, 40), Math.max(24, Math.floor((W - 168) / 5))); // 5 list pictures + counter fit right of the Back button
      bsz = clamp(Math.min(W * 0.26, H * 0.17), 72, 104); regSz = clamp(bsz * 0.78, 56, 80); osz = clamp(bsz * 0.9, 64, 96);
      // basket: 1.6 x the old width (about 2.5 x the area); its pile shows items 40+ px wide, up to 4 rows high
      bkW = Math.round(bsz * 1.6); bkH = Math.round(bkW * 0.7);
      pUw = Math.max(44, Math.round(bkW * 0.4)); pTh = Math.round(pUw * 50 / 64); pStep = Math.round(pUw * 0.85); pStepY = Math.round(pTh * 0.85);
      pCols = Math.max(2, Math.floor((bkW * 0.96 - pUw) / pStep) + 1); pV = Math.min(12, pCols * 4);
      pileUp = Math.max(0, pTh + (Math.ceil(pV / pCols) - 1) * pStepY - bkH * 0.93 - 8) + 4;
      // the scale sits in the bottom band between register and owner when there is room, otherwise in a row above the band (right side)
      var regRight = 8 + bkW + 10 + regSz, ownLeft = W - osz - 14;
      scBand = ownLeft - regRight - 12 >= SC_W;
      botH = Math.max(bkH, osz, scBand ? SC_H : 0) + 16; rowH = scBand ? 0 : SC_H + 4;
      midT = topH; midB = H - botH; shelfB = midB - rowH;
      floorT = midB;
      floor.style.top = floorT + 'px';
      // shelf grid: 3 x 2 or 6 x 1, whichever gives bigger products (at least 64 px)
      var aw = W - 16, ah = shelfB - midT - 12 - Math.max(0, pileUp - rowH), best = null, cols;
      [3, 6].forEach(function (c) {
        var rows = Math.ceil(6 / c), s = Math.min(aw / c, ah / rows, 104);
        if (!best || s > best.s + 1) { best = { c: c, rows: rows, s: s }; }
      });
      cols = best.c;
      psz = clamp(best.s * 0.88, 64, 104); gsz = clamp(psz * 0.85, 64, 92);
      var cw = aw / cols, rh = ah / best.rows;
      prods.forEach(function (p, k) {
        var c = k % cols, rr = Math.floor(k / cols);
        p.hx = 8 + cw * (c + 0.5); p.hy = midT + 6 + rh * (rr + 0.5);
        p.node.style.width = p.node.style.height = psz + 'px';
        p.ghost.style.width = p.ghost.style.height = gsz + 'px'; p.shown = '';
        if (p.mode === 'home') { p.x = p.hx; p.y = p.hy; }
      });
      shelves.innerHTML = '';
      for (var rr2 = 0; rr2 < best.rows; rr2++) {
        var pl = document.createElement('div');
        pl.className = 'zk-plank'; pl.style.top = (midT + 6 + rh * (rr2 + 0.5) + psz / 2 - 2).toFixed(0) + 'px';
        shelves.appendChild(pl);
      }
      // counter scene
      isz = clamp(Math.min(W / (MAX_ROUND + 0.4), (midB - midT) * 0.22), 56, 84);
      var mh = midB - midT;
      beltY = midT + mh * 0.2; scY = midT + mh * 0.52; bagY = midT + mh * 0.84;
      var sw = Math.min(W - 16, Math.max(Math.min(W * 0.78, 360), (isz + 14) * MAX_ROUND)); scX0 = (W - sw) / 2; scX1 = scX0 + sw;
      scanner.style.left = scX0 + 'px'; scanner.style.width = sw + 'px'; scanner.style.top = (scY - 14) + 'px';
      belt.style.top = (beltY - isz / 2 - 6) + 'px'; belt.style.height = (isz + 12) + 'px';
      bag.style.top = (bagY - isz / 2 - 6) + 'px'; bag.style.height = (isz + 12) + 'px';
      cn.forEach(function (c) { c.node.style.width = c.node.style.height = isz + 'px'; });
      placeCounter();
      // bottom band: basket, register, owner
      bk.hx = 8 + bkW / 2; bk.hy = midB + botH / 2 + 2;
      if (bk.mode === 'home' || bk.mode === 'back') { bk.mode = 'home'; bk.x = bk.hx; bk.y = bk.hy; }
      basketBtn.style.width = bkW + 'px'; basketBtn.style.height = bkH + 'px';
      renderThumbs();
      if (scBand) { scCx = (regRight + ownLeft) / 2; scTop = bk.hy - SC_H / 2; } else { scCx = W - SC_W / 2 - 8; scTop = shelfB + 2; }
      scaleBtn.style.width = SC_W + 'px'; scaleBtn.style.height = SC_BODY_H + 'px';
      plateEl.style.width = SC_PLATE_W + 'px';
      placePlate();
      regBtn.style.width = regBtn.style.height = regSz + 'px';
      ownerEl.style.width = ownerEl.style.height = osz + 'px';
      sizeReceipt();
      render();
    }
    function slotX(k, n) { var step = Math.min(isz + 14, (W - 16) / Math.max(n, 1)); return W / 2 + (k - (n - 1) / 2) * step; }
    function placeCounter() {
      var n = cn.filter(function (c) { return c.mode !== 'off'; }).length, k = 0;
      cn.forEach(function (c) {
        if (c.mode === 'off') { return; }
        c.hx = slotX(k, n); c.hy = beltY; c.bx = slotX(k, n); c.by = bagY; k++;
        if (c.mode === 'home') { c.x = c.hx; c.y = c.hy; } else if (c.mode === 'bagged') { c.x = c.bx; c.y = c.by; }
      });
    }
    function overBasket(x, y) { return Math.abs(x - bk.hx) < bkW * 0.6 && y > bk.hy - bkH * 0.5 - 28 && y < bk.hy + bkH * 0.6; }
    function overScale(x, y) { return Math.abs(x - scCx) < SC_W / 2 + 8 && y > scTop - 8 && y < scTop + SC_H + 8; }
    function onPlate(it) { return it.mode === 'in' || it.mode === 'home' || it.mode === 'back'; }
    function plateCount() { return pl.filter(function (it) { return onPlate(it) || it.mode === 'drag'; }).length; }
    function plateWeight() { return pl.reduce(function (s, it) { return s + (onPlate(it) ? WEIGHT[it.kind.id] : 0); }, 0); }
    // slots along the plate, in the order the units were put on it (later ones on top)
    function placePlate() {
      var on = pl.filter(onPlate).sort(function (a, b) { return a.seq - b.seq; });
      on.forEach(function (it, k) {
        it.hx = scCx + (k - (on.length - 1) / 2) * PSTEP; it.hy = scTop + SC_PLATE_Y + 6 - PIS / 2;
        it.node.style.zIndex = String(5 + k);
        if (it.mode === 'home') { it.x = it.hx; it.y = it.hy; }
      });
    }
    function overScanner(x, y) { return x >= scX0 - 8 && x <= scX1 + 8 && Math.abs(y - scY) <= 26; }
    function shopping() { return phase === 'shop'; }
    function counterPhase() { return phase === 'scan'; }

    // ---- state helpers --------------------------------------------------------------------------------------
    function renderList() {
      listEl.innerHTML = list.map(function (p) { return '<span class="zk-li">' + iconSvg(p) + '</span>'; }).join('');
      Array.prototype.forEach.call(listEl.children, function (s) { s.style.width = s.style.height = ls + 'px'; });
    }
    // The basket pile: pV visible slots (rows from the bottom up, lower rows in front, at most ~28% of an item hidden); items beyond that
    // are stacked on top with a small offset and the count numeral shows the total.
    function renderThumbs() {
      var n = basket.length, html = '', rowW = (pCols - 1) * pStep + pUw, x0 = (bkW - rowW) / 2, i, slot, row, ex, x, y;
      for (i = 0; i < n; i++) {
        slot = i % pV; ex = i >= pV ? 5 : 0; row = Math.floor(slot / pCols);
        x = x0 + (slot % pCols) * pStep + ex; y = bkH * 0.93 - pTh - row * pStepY - ex;
        html += '<span class="zk-bt" style="left:' + x.toFixed(0) + 'px;top:' + y.toFixed(0) + 'px;width:' + pUw + 'px;height:' + pTh + 'px;z-index:' +
          (30 - row + (i >= pV ? 20 : 0)) + '">' + thumbSvg(byId(basket[i])) + '</span>';
      }
      if (n > 8) { html += '<span class="zk-bn">' + n + '</span>'; }
      bThumbs.innerHTML = html;
    }
    // Shelf slot: the units still on the shelf (bottom row first); one is lifted while it is dragged or gliding back.
    function renderUnits(p) {
      var n = Math.max(0, p.stock - (p.mode === 'drag' || p.mode === 'back' ? 1 : 0)), key = p.kind.id + ':' + n + ':' + psz;
      if (p.shown === key) { return; }
      p.shown = key;
      var us = Math.round(psz * 0.62), gap = psz - us, order = [2, 3, 0, 1], html = '', k, cell;
      for (k = 0; k < n && k < 4; k++) {
        cell = order[k];
        html += '<span class="zk-un" style="left:' + ((cell % 2) * gap) + 'px;top:' + (Math.floor(cell / 2) * gap) + 'px;width:' + us + 'px;height:' + us + 'px">' + iconSvg(p.kind) + '</span>';
      }
      p.node.innerHTML = html;
    }
    // Receipt: one row per distinct product (picture + count numeral), in up to 3 columns; sized to the space below the scanner.
    function sizeReceipt() {
      var n = Math.max(1, tallyOrder.length), cols = Math.min(3, Math.ceil(n / 5)), rowsPer = Math.ceil(n / cols), i, html = '';
      var colW = Math.min(Math.round(isz * 1.25), Math.floor((W - 16) / cols)), availH = Math.max(80, H - 8 - (scY + 10));
      recRow = clamp(Math.floor((availH - 20) / rowsPer), 18, 34);
      recW = colW * cols; recH = Math.min(availH, Math.max(Math.round(isz * 1.6), rowsPer * recRow + 20));
      var st = receipt.style;
      st.width = recW + 'px'; st.height = recH + 'px'; st.gridTemplateColumns = 'repeat(' + cols + ', 1fr)'; st.gridTemplateRows = 'repeat(' + rowsPer + ', ' + recRow + 'px)';
      st.fontSize = Math.round(recRow * 0.62) + 'px';
      for (i = 0; i < tallyOrder.length; i++) {
        html += '<span class="zk-rr"><span class="zk-rp" style="height:' + (recRow - 4) + 'px">' + thumbSvg(byId(tallyOrder[i])) + '</span><b>x' + tally[tallyOrder[i]] + '</b></span>';
      }
      receipt.innerHTML = html;
    }
    function setOwner(smiling) {
      smile = smiling;
      var face = ownerEl.querySelector('.zk-mouth');
      if (face) { face.setAttribute('display', smiling ? 'inline' : 'none'); }
    }
    function newRound() {
      var n = (round % MAX_ROUND) + 1;
      var shelf = drawShelf();
      list = shuffled(shelf).slice(0, n); basket = []; queue = []; tally = {}; tallyOrder = []; count = 0; numEl.textContent = '0';
      cn.forEach(function (c) { c.mode = 'off'; c.alpha = 0; c.scanned = false; c.node.disabled = true; });
      var a = window.Animals ? window.Animals.pick(1) : null;
      owner = a && a[0] ? a[0] : null;
      ownerEl.innerHTML = owner ?
        '<svg viewBox="-24 -26 48 52" aria-hidden="true">' + window.Animals.head(owner.id, { body: true }) +
        '<path class="zk-mouth" d="M-6 8Q0 15 6 8" fill="none" stroke="#5b5675" stroke-width="1.8" stroke-linecap="round" display="none"/></svg>' : '';
      setOwner(false);
      renderList(); renderThumbs();
      prods.forEach(function (p, k) {
        p.kind = shelf[k]; p.stock = randStock(); p.restock = 0; p.mode = 'home'; p.x = p.hx; p.y = p.hy; p.shown = '';
        p.node.setAttribute('aria-label', p.kind.label + '. Przeciągnij do koszyka lub naciśnij Enter, aby włożyć do koszyka.');
        p.ghost.innerHTML = iconSvg(p.kind);
      });
      pl.forEach(function (it) { it.mode = 'off'; it.alpha = 0; it.node.disabled = true; });
      ptA = REST_DEG; ptV = 0; dip = 0; lastProd = null;
      recT = -1; flash = 0;
      shelfAlpha = 0; sceneAlpha = 0; bk.mode = 'home'; bk.x = bk.hx; bk.y = bk.hy;
      phase = 'fadein'; phaseT = 0;
    }
    // Puts up to MAX_ROUND kinds on the counter; the first fromBasket come straight from the basket (the rest fade in).
    function setBatch(kinds, fromBasket) {
      cn.forEach(function (c, k) {
        if (k < kinds.length) {
          c.kind = byId(kinds[k]); c.node.innerHTML = iconSvg(c.kind); c.node.disabled = false; c.scanned = false; c.mode = 'home';
          c.node.setAttribute('aria-label', c.kind.label + '. Przeciągnij przez skaner lub naciśnij Enter, aby zeskanować.');
          c.alpha = k < fromBasket ? 1 : 0; c.t = k < fromBasket ? 0 : 0.0001;
        } else { c.mode = 'off'; c.alpha = 0; c.node.disabled = true; }
      });
      placeCounter();
    }
    function checkout() {
      if (!shopping()) { return; }
      if (drag && drag.pitem) { drag = null; }
      pl.forEach(function (it) {   // units still on the plate go into the basket, none are lost
        if (onPlate(it) || it.mode === 'drag') { basket.push(it.kind.id); report(function (A) { A.track('interaction', { variant: it.kind.id }); }); it.mode = 'off'; it.alpha = 0; it.node.disabled = true; }
      });
      var kinds = counterKinds(basket, list.map(function (p) { return p.id; }));
      setBatch(kinds.slice(0, MAX_ROUND), basket.length);
      queue = kinds.slice(MAX_ROUND);
      basket = []; renderThumbs();
      phase = 'to'; phaseT = 0; setOwner(false);
      start();
    }
    function scan(c, viaKey) {
      if (c.scanned || !counterPhase()) { return; }
      c.scanned = true; count++; numEl.textContent = String(count); flash = SCAN_FLASH_S;
      if (!tally[c.kind.id]) { tally[c.kind.id] = 0; tallyOrder.push(c.kind.id); }
      tally[c.kind.id]++;
      report(function (A) { A.track('interaction', { variant: c.kind.id }); });
      if (viaKey) { c.mode = 'cross'; c.t = 0; c.x0 = c.x; c.y0 = c.y; }
      var left = cn.filter(function (k) { return k.mode !== 'off' && !k.scanned; }).length;
      if (left === 0 && queue.length) { phase = 'wave'; phaseT = 0; }
      else if (left === 0) { report(function (A) { A.complete(); }); phase = 'finish'; phaseT = 0; }
      start();
    }
    function send(c, mode) { c.mode = mode; c.t = 0; c.x0 = c.x; c.y0 = c.y; }

    // ---- rendering ------------------------------------------------------------------------------------------
    function render() {
      var sa = shelfAlpha, ca = sceneAlpha;
      scene.style.opacity = ca.toFixed(3); scene.style.visibility = ca <= 0.001 ? 'hidden' : 'visible';
      prods.forEach(function (p) {
        var a = p.alpha * sa, gi = p.mode === 'in' ? clamp(p.t / IN_S, 0, 1) : 0;
        renderUnits(p);
        p.node.style.opacity = a.toFixed(3);
        p.node.style.visibility = a <= 0.001 ? 'hidden' : 'visible';
        p.node.style.transform = 'translate(' + (p.hx - psz / 2).toFixed(1) + 'px,' + (p.hy - psz / 2).toFixed(1) + 'px)';
        p.node.disabled = !shopping() || sa < 0.5 || p.stock <= 0;
        p.ghost.style.visibility = p.mode === 'home' || sa <= 0.001 ? 'hidden' : 'visible';
        p.ghost.style.opacity = (1 - 0.6 * gi).toFixed(3);
        p.ghost.style.transform = 'translate(' + (p.x - gsz / 2).toFixed(1) + 'px,' + (p.y - gsz / 2 - (p.mode === 'drag' ? 8 : 0)).toFixed(1) + 'px) scale(' + (1 - 0.4 * gi).toFixed(3) + ')';
        p.ghost.classList.toggle('zk-lift', p.mode === 'drag');
      });
      var over = !!(drag && (drag.prod || drag.pitem) && shopping() && overBasket((drag.prod || drag.pitem).x, (drag.prod || drag.pitem).y));
      scaleBtn.classList.toggle('zk-over', !!(drag && drag.prod && shopping() && WEIGHT[drag.prod.kind.id] && overScale(drag.prod.x, drag.prod.y)));
      scaleBtn.style.opacity = plateEl.style.opacity = sa.toFixed(3);
      scaleBtn.style.visibility = plateEl.style.visibility = sa <= 0.001 ? 'hidden' : 'visible';
      scaleBtn.style.transform = 'translate(' + (scCx - SC_W / 2).toFixed(1) + 'px,' + (scTop + SC_BODY_Y).toFixed(1) + 'px)';
      plateEl.style.transform = 'translate(' + (scCx - SC_PLATE_W / 2).toFixed(1) + 'px,' + (scTop + SC_PLATE_Y + dip).toFixed(1) + 'px)';
      scaleBtn.disabled = !shopping() || sa < 0.5;
      pointerEl.setAttribute('transform', 'rotate(' + ptA.toFixed(2) + ' 80 22)');
      pl.forEach(function (it) {
        var on = it.mode !== 'off', a = on ? it.alpha * sa : 0;
        it.node.style.opacity = a.toFixed(3);
        it.node.style.visibility = a > 0.001 ? 'visible' : 'hidden';
        it.node.style.transform = 'translate(' + (it.x - PIS / 2).toFixed(1) + 'px,' + (it.y - PIS / 2 + (it.mode === 'home' || it.mode === 'in' ? dip : 0) - (it.mode === 'drag' ? 8 : 0)).toFixed(1) + 'px)';
        it.node.classList.toggle('zk-lift', it.mode === 'drag');
        it.node.disabled = !on || it.mode !== 'home' || !shopping() || sa < 0.5;
      });
      basketBtn.classList.toggle('zk-over', over);
      basketBtn.style.transform = 'translate(' + (bk.x - bkW / 2).toFixed(1) + 'px,' + (bk.y - bkH / 2).toFixed(1) + 'px)';
      basketBtn.classList.toggle('zk-lift', bk.mode === 'drag');
      basketBtn.disabled = !shopping();
      regBtn.style.transform = 'translate(' + (bk.hx + bkW / 2 + 10).toFixed(1) + 'px,' + (bk.hy - regSz / 2).toFixed(1) + 'px)';
      regBtn.disabled = !shopping();
      ownerEl.style.transform = 'translate(' + (W - osz - 14).toFixed(1) + 'px,' + (bk.hy - osz / 2).toFixed(1) + 'px)';
      // scanner flash
      var f = flash > 0 ? flash / SCAN_FLASH_S : 0;
      scanner.classList.toggle('zk-flash', f > 0);
      laser.style.opacity = (0.35 + 0.65 * f).toFixed(3);
      laser.style.background = f > 0 ? '#3fd16b' : '#e8605a';
      cn.forEach(function (c) {
        var on = c.mode !== 'off';
        c.node.style.opacity = (on ? c.alpha * ca : 0).toFixed(3);
        c.node.style.visibility = on && c.alpha * ca > 0.001 ? 'visible' : 'hidden';
        var sc = c.mode === 'bagged' || c.mode === 'tobag' ? 0.85 : 1;
        c.node.style.transform = 'translate(' + (c.x - isz / 2).toFixed(1) + 'px,' + (c.y - isz / 2 - (c.mode === 'drag' ? 8 : 0)).toFixed(1) + 'px) scale(' + sc + ')';
        c.node.classList.toggle('zk-lift', c.mode === 'drag');
        c.node.disabled = !on || c.scanned || !counterPhase();
        c.node.classList.toggle('zk-done', c.scanned);
      });
      if (recT >= 0) {
        var u = ease(recT / RECEIPT_S);
        receipt.style.visibility = 'visible'; receipt.style.opacity = ca.toFixed(3);
        receipt.style.transform = 'translate(' + clamp(scX1 - recW - 6, 8, Math.max(8, W - recW - 8)).toFixed(1) + 'px,' + Math.min(scY + 10, H - 8 - recH).toFixed(1) + 'px)';
        receipt.style.clipPath = 'inset(0 0 ' + (100 * (1 - u)).toFixed(1) + '% 0)';
      } else { receipt.style.visibility = 'hidden'; receipt.style.opacity = '0'; receipt.style.clipPath = 'none'; }
    }

    // ---- behaviour ------------------------------------------------------------------------------------------
    function step(dt) {
      phaseT += dt;
      if (flash > 0) { flash = Math.max(0, flash - dt); }
      if (phase === 'fadein') {
        var u0 = clamp(phaseT / FADE_S, 0, 1); shelfAlpha = u0; sceneAlpha = 0;
        if (u0 >= 1) { phase = 'shop'; phaseT = 0; shelfAlpha = 1; }
      } else if (phase === 'to') {
        var u = clamp(phaseT / TO_S, 0, 1);
        shelfAlpha = 1 - u; sceneAlpha = ease(u);
        cn.forEach(function (c) { if (c.mode === 'home' && c.t > 0) { c.alpha = clamp(u * 1.5 - 0.3, 0, 1); } });
        if (u >= 1) {
          phase = 'scan'; phaseT = 0; shelfAlpha = 0; sceneAlpha = 1;
          cn.forEach(function (c) { if (c.mode === 'home') { c.alpha = 1; c.t = 0; } });
        }
      } else if (phase === 'wave') {
        if (cn.every(function (c) { return c.mode === 'off' || c.mode === 'bagged'; })) {
          setBatch(queue.splice(0, MAX_ROUND), 0); phase = 'scan'; phaseT = 0;
        }
      } else if (phase === 'finish') {
        var allIn = cn.every(function (c) { return c.mode === 'off' || c.mode === 'bagged'; });
        if (allIn) { phase = 'receipt'; phaseT = 0; recT = 0; setOwner(true); sizeReceipt(); }
      } else if (phase === 'receipt') {
        recT = Math.min(RECEIPT_S, phaseT);
        if (phaseT >= DONE_S) { phase = 'out'; phaseT = 0; }
      } else if (phase === 'out') {
        var o = clamp(phaseT / FADE_S, 0, 1);
        sceneAlpha = 1 - o;
        if (o >= 1) { round++; recT = -1; sceneAlpha = 0; newRound(); }
      }
      prods.forEach(function (p) {
        if (p.mode === 'back') {
          p.t += dt; var e = ease(p.t / BACK_S);
          p.x = p.x0 + (p.hx - p.x0) * e; p.y = p.y0 + (p.hy - p.y0) * e;
          if (p.t >= BACK_S) { p.mode = 'home'; p.x = p.hx; p.y = p.hy; }
        } else if (p.mode === 'in') {
          p.t += dt; var ei = ease(p.t / IN_S);
          p.x = p.x0 + (bk.hx - p.x0) * ei; p.y = p.y0 + (bk.hy - bkH * 0.15 - p.y0) * ei;
          if (p.t >= IN_S) { p.mode = 'home'; p.x = p.hx; p.y = p.hy; }
        }
        if (p.restock > 0) { p.restock -= dt; if (p.restock <= 0) { p.restock = 0; p.stock = randStock(); } }
      });
      if (bk.mode === 'back') {
        bk.t += dt; var eb = ease(bk.t / BACK_S);
        bk.x = bk.x0 + (bk.hx - bk.x0) * eb; bk.y = bk.y0 + (bk.hy - bk.y0) * eb;
        if (bk.t >= BACK_S) { bk.mode = 'home'; bk.x = bk.hx; bk.y = bk.hy; }
      }
      stepScale(dt);
      cn.forEach(function (c) {
        if (phase === 'scan' && c.mode === 'home' && c.alpha < 1) { c.alpha = Math.min(1, c.alpha + dt / WAVE_FADE_S); }
        if (c.mode === 'back') {
          c.t += dt; var e = ease(c.t / BACK_S);
          c.x = c.x0 + (c.hx - c.x0) * e; c.y = c.y0 + (c.hy - c.y0) * e;
          if (c.t >= BACK_S) { c.mode = 'home'; c.x = c.hx; c.y = c.hy; }
        } else if (c.mode === 'tobag') {
          c.t += dt; var g = ease(c.t / BAG_S);
          c.x = c.x0 + (c.bx - c.x0) * g; c.y = c.y0 + (c.by - c.y0) * g;
          if (c.t >= BAG_S) { c.mode = 'bagged'; c.x = c.bx; c.y = c.by; }
        } else if (c.mode === 'cross') {
          // keyboard scan: slide down across the scanner, then into the bag
          c.t += dt; var h = ease(c.t / KEY_SCAN_S);
          c.x = c.x0 + (c.bx - c.x0) * h; c.y = c.y0 + (c.by - c.y0) * h;
          if (c.t >= KEY_SCAN_S) { c.mode = 'bagged'; c.x = c.bx; c.y = c.by; }
        }
      });
    }
    function stepScale(dt) {
      var on = plateCount() - pl.filter(function (it) { return it.mode === 'drag'; }).length, target = REST_DEG + Math.min(MAX_DEG, UNIT_DEG * plateWeight());
      var dipT = on > 0 ? DIP_MIN + (DIP_MAX - DIP_MIN) * (target - REST_DEG) / MAX_DEG : 0, n = Math.max(1, Math.ceil(dt * 120)), h = dt / n, k;
      for (k = 0; k < n; k++) {   // damped spring: settles in about 0.8 s with a small swing past the target
        ptV += (SPRING_K * (target - ptA) - SPRING_C * ptV) * h; ptA += ptV * h;
        if (ptA < REST_DEG) { ptA = REST_DEG; ptV = 0; } else if (ptA > REST_DEG + MAX_DEG) { ptA = REST_DEG + MAX_DEG; ptV = 0; }
      }
      if (Math.abs(target - ptA) < 0.05 && Math.abs(ptV) < 0.3) { ptA = target; ptV = 0; }
      dip += (dipT - dip) * (1 - Math.exp(-dt * 16));
      if (Math.abs(dipT - dip) < 0.05) { dip = dipT; }
      pl.forEach(function (it) {
        if (it.mode === 'in' || it.mode === 'back') {
          it.t += dt; var e = ease(it.t / (it.mode === 'in' ? IN_S : BACK_S));
          it.x = it.x0 + (it.hx - it.x0) * e; it.y = it.y0 + (it.hy - it.y0) * e;
          if (it.t >= (it.mode === 'in' ? IN_S : BACK_S)) { it.mode = 'home'; it.x = it.hx; it.y = it.hy; }
        } else if (it.mode === 'out') {
          it.t += dt; var o = ease(it.t / BACK_S), p = it.from;
          it.x = it.x0 + (p.hx - it.x0) * o; it.y = it.y0 + (p.hy - it.y0) * o; it.alpha = 1 - 0.6 * o;
          if (it.t >= BACK_S) {   // the unit is back on its shelf
            it.mode = 'off'; it.alpha = 0;
            if (p.kind === it.kind) { p.stock = Math.min(4, p.stock + 1); p.restock = 0; p.shown = ''; }
          }
        } else if (it.mode === 'tobasket') {
          it.t += dt; var g = ease(it.t / IN_S);
          it.x = it.x0 + (bk.hx - it.x0) * g; it.y = it.y0 + (bk.hy - bkH * 0.15 - it.y0) * g; it.alpha = 1 - 0.6 * g;
          if (it.t >= IN_S) { it.mode = 'off'; it.alpha = 0; }
        }
      });
    }
    function busy() {
      if (phase !== 'shop' && phase !== 'scan') { return true; }
      if (flash > 0) { return true; }
      if (bk.mode === 'back') { return true; }
      if (ptA !== REST_DEG + Math.min(MAX_DEG, UNIT_DEG * plateWeight()) || ptV !== 0 || pl.some(function (it) { return it.mode !== 'off' && it.mode !== 'home' && it.mode !== 'drag'; })) { return true; }
      return prods.some(function (p) { return p.mode === 'back' || p.mode === 'in' || p.restock > 0; }) ||
        cn.some(function (c) { return c.mode === 'back' || c.mode === 'tobag' || c.mode === 'cross' || (c.mode === 'home' && c.alpha < 1); });
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      step(dt); render();
      if (alive && !document.hidden && busy() && !raf) { raf = requestAnimationFrame(frame); }
    }
    function start() {
      if (raf || document.hidden || !alive) { return; }
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    function onVis() { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else { start(); } }
    function onResize() { layout(); start(); }

    // ---- input ----------------------------------------------------------------------------------------------
    function localPt(e) { var r = root.getBoundingClientRect(); return [clamp(e.clientX - r.left, 0, W), clamp(e.clientY - r.top, 0, H)]; }
    // Takes one unit off the shelf (only here, once per drag/key press) and glides it into the basket; a full basket sends it back.
    function putInBasket(p) {
      if (p.stock <= 0 || basket.length >= MAX_BASKET) { send(p, 'back'); return; }
      report(function (A) { A.track('interaction', { variant: p.kind.id }); });
      basket.push(p.kind.id); p.stock--; if (p.stock === 0) { p.restock = RESTOCK_S; }
      renderThumbs(); send(p, 'in');
    }
    // Puts one produce unit on the plate (the unit leaves the shelf, restocked by the usual 2 s rule); anything else glides back.
    function putOnPlate(p, fromX, fromY) {
      var it = null, k;
      if (p.stock <= 0 || !WEIGHT[p.kind.id] || plateCount() >= PLATE_MAX) { send(p, 'back'); return false; }
      for (k = 0; k < pl.length && !it; k++) { if (pl[k].mode === 'off') { it = pl[k]; } }
      if (!it) { send(p, 'back'); return false; }
      report(function (A) { A.track('interaction', { variant: 'weigh' }); });
      p.stock--; if (p.stock === 0) { p.restock = RESTOCK_S; }
      p.mode = 'home'; p.x = p.hx; p.y = p.hy; p.shown = '';
      it.kind = p.kind; it.from = p; it.seq = ++plSeq; it.node.innerHTML = iconSvg(p.kind);
      it.node.setAttribute('aria-label', p.kind.label + ' na wadze. Naciśnij Enter, aby zdjąć z wagi.');
      it.mode = 'in'; it.t = 0; it.alpha = 1; it.x0 = it.x = fromX; it.y0 = it.y = fromY;
      placePlate(); return true;
    }
    function takeOff(it) { it.mode = 'out'; it.t = 0; it.x0 = it.x; it.y0 = it.y; it.alpha = 1; placePlate(); }
    function plateToBasket(it) {
      basket.push(it.kind.id); report(function (A) { A.track('interaction', { variant: it.kind.id }); });
      renderThumbs(); it.mode = 'tobasket'; it.t = 0; it.x0 = it.x; it.y0 = it.y; placePlate();
    }
    function weighByKey() {
      var p = lastProd && WEIGHT[lastProd.kind.id] && lastProd.stock > 0 ? lastProd : null, k;
      for (k = 0; k < prods.length && !p; k++) { if (WEIGHT[prods[k].kind.id] && prods[k].stock > 0 && prods[k].mode === 'home') { p = prods[k]; } }
      if (p) { putOnPlate(p, p.hx, p.hy); }
    }
    prods.forEach(function (p) {
      var b = p.node;
      b.addEventListener('focus', function () { lastProd = p; });
      b.addEventListener('pointerdown', function (e) {
        if (drag || !shopping() || p.stock <= 0 || (p.mode !== 'home' && p.mode !== 'back')) { return; }
        drag = { id: e.pointerId, prod: p };
        p.mode = 'drag'; try { b.setPointerCapture(e.pointerId); } catch (x) { /* unsupported */ }
        var q = localPt(e); p.x = q[0]; p.y = q[1]; render(); e.preventDefault();
      });
      b.addEventListener('pointermove', function (e) {
        if (!drag || drag.prod !== p || e.pointerId !== drag.id) { return; }
        var q = localPt(e); p.x = q[0]; p.y = q[1]; render();
      });
      b.addEventListener('pointerup', function (e) {
        if (!drag || drag.prod !== p || e.pointerId !== drag.id) { return; }
        drag = null;
        try { b.releasePointerCapture(e.pointerId); } catch (x) { /* already released */ }
        if (overBasket(p.x, p.y)) { putInBasket(p); } else if (overScale(p.x, p.y)) { putOnPlate(p, p.x, p.y); } else { send(p, 'back'); }
        render(); start();
      });
      b.addEventListener('pointercancel', function (e) {
        if (!drag || drag.prod !== p || e.pointerId !== drag.id) { return; }
        drag = null; send(p, 'back'); render(); start();
      });
      b.addEventListener('click', function (e) {
        if (e.detail !== 0 || !shopping() || p.stock <= 0 || (p.mode !== 'home' && p.mode !== 'back')) { return; }   // pointer taps are handled above
        p.x = p.hx; p.y = p.hy; putInBasket(p); render(); start();
      });
    });
    pl.forEach(function (it) {
      var b = it.node;
      b.addEventListener('pointerdown', function (e) {
        if (drag || !shopping() || it.mode !== 'home') { return; }
        var q = localPt(e);
        drag = { id: e.pointerId, pitem: it, sx: q[0], sy: q[1], moved: false };
        it.mode = 'drag'; try { b.setPointerCapture(e.pointerId); } catch (x) { /* unsupported */ }
        it.x = q[0]; it.y = q[1]; placePlate(); render(); start(); e.preventDefault();
      });
      b.addEventListener('pointermove', function (e) {
        if (!drag || drag.pitem !== it || e.pointerId !== drag.id) { return; }
        var q = localPt(e);
        if (Math.abs(q[0] - drag.sx) + Math.abs(q[1] - drag.sy) >= 8) { drag.moved = true; }
        it.x = q[0]; it.y = q[1]; render();
      });
      function release(e, cancel) {
        if (!drag || drag.pitem !== it || e.pointerId !== drag.id) { return; }
        var moved = drag.moved; drag = null;
        try { b.releasePointerCapture(e.pointerId); } catch (x) { /* already released */ }
        if (cancel || (moved && overScale(it.x, it.y))) { it.mode = 'back'; it.t = 0; it.x0 = it.x; it.y0 = it.y; placePlate(); }
        else if (overBasket(it.x, it.y) && basket.length < MAX_BASKET) { plateToBasket(it); }
        else if (overBasket(it.x, it.y)) { it.mode = 'back'; it.t = 0; it.x0 = it.x; it.y0 = it.y; placePlate(); }
        else { takeOff(it); }
        render(); start();
      }
      b.addEventListener('pointerup', function (e) { release(e, false); });
      b.addEventListener('pointercancel', function (e) { release(e, true); });
      b.addEventListener('click', function (e) {
        if (e.detail !== 0 || !shopping() || it.mode !== 'home') { return; }
        takeOff(it); scaleBtn.focus(); render(); start();
      });
    });
    scaleBtn.addEventListener('click', function (e) { if (e.detail === 0 && shopping()) { weighByKey(); render(); start(); } });
    // basket: a tap checks out, a drag into the shop area checks out, anything else glides back
    basketBtn.addEventListener('pointerdown', function (e) {
      if (drag || !shopping()) { return; }
      drag = { id: e.pointerId, bask: true, sx: 0, sy: 0 };
      var q = localPt(e); drag.sx = q[0]; drag.sy = q[1]; bk.moved = false;
      bk.mode = 'drag'; try { basketBtn.setPointerCapture(e.pointerId); } catch (x) { /* unsupported */ }
      e.preventDefault();
    });
    basketBtn.addEventListener('pointermove', function (e) {
      if (!drag || !drag.bask || e.pointerId !== drag.id) { return; }
      var q = localPt(e);
      if (!bk.moved && Math.abs(q[0] - drag.sx) + Math.abs(q[1] - drag.sy) < 8) { return; }
      bk.moved = true; bk.x = q[0]; bk.y = q[1]; render();
    });
    basketBtn.addEventListener('pointerup', function (e) {
      if (!drag || !drag.bask || e.pointerId !== drag.id) { return; }
      drag = null;
      try { basketBtn.releasePointerCapture(e.pointerId); } catch (x) { /* already released */ }
      var inShop = bk.moved && bk.y < midB - 10;
      if (!bk.moved || inShop) { bk.mode = 'home'; bk.x = bk.hx; bk.y = bk.hy; checkout(); }
      else { bk.mode = 'back'; bk.t = 0; bk.x0 = bk.x; bk.y0 = bk.y; }
      bk.moved = false; render(); start();
    });
    basketBtn.addEventListener('pointercancel', function (e) {
      if (!drag || !drag.bask || e.pointerId !== drag.id) { return; }
      drag = null; bk.moved = false; bk.mode = 'back'; bk.t = 0; bk.x0 = bk.x; bk.y0 = bk.y; render(); start();
    });
    basketBtn.addEventListener('click', function (e) { if (e.detail === 0) { checkout(); render(); } });
    regBtn.addEventListener('click', function () { checkout(); render(); });
    cn.forEach(function (c) {
      var b = c.node;
      b.addEventListener('pointerdown', function (e) {
        if (drag || !counterPhase() || c.scanned || (c.mode !== 'home' && c.mode !== 'back')) { return; }
        drag = { id: e.pointerId, item: c, lx: c.x, ly: c.y };
        c.mode = 'drag'; try { b.setPointerCapture(e.pointerId); } catch (x) { /* unsupported */ }
        var q = localPt(e); c.x = q[0]; c.y = q[1]; drag.lx = q[0]; drag.ly = q[1]; render(); e.preventDefault();
      });
      b.addEventListener('pointermove', function (e) {
        if (!drag || drag.item !== c || e.pointerId !== drag.id) { return; }
        var q = localPt(e), dx = q[0] - drag.lx, dy = q[1] - drag.ly, n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 8)), k;
        for (k = 1; k <= n; k++) {   // fast drags are walked in ~8 px steps so crossing the scanner is never skipped
          if (!c.scanned && overScanner(drag.lx + dx * k / n, drag.ly + dy * k / n)) { scan(c, false); }
        }
        drag.lx = q[0]; drag.ly = q[1]; c.x = q[0]; c.y = q[1]; render();
      });
      b.addEventListener('pointerup', function (e) {
        if (!drag || drag.item !== c || e.pointerId !== drag.id) { return; }
        drag = null;
        try { b.releasePointerCapture(e.pointerId); } catch (x) { /* already released */ }
        send(c, c.scanned ? 'tobag' : 'back'); render(); start();
      });
      b.addEventListener('pointercancel', function (e) {
        if (!drag || drag.item !== c || e.pointerId !== drag.id) { return; }
        drag = null; send(c, c.scanned ? 'tobag' : 'back'); render(); start();
      });
      b.addEventListener('click', function (e) {
        if (e.detail !== 0 || !counterPhase() || c.scanned || (c.mode !== 'home' && c.mode !== 'back')) { return; }
        scan(c, true); render();
      });
    });
    // arrows move focus between the visible, enabled products / counter items
    function onKey(e) {
      var dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!dir) { return; }
      var nodes = (shopping() ? prods.map(function (p) { return p.node; }).concat([scaleBtn], pl.filter(function (it) { return it.mode === 'home'; }).sort(function (a, b) { return a.seq - b.seq; }).map(function (it) { return it.node; }), [basketBtn, regBtn]) :
        cn.map(function (c) { return c.node; })).filter(function (n) { return !n.disabled && n.style.visibility !== 'hidden'; });
      if (!nodes.length) { return; }
      var k = nodes.indexOf(document.activeElement);
      nodes[(k < 0 ? (dir > 0 ? 0 : nodes.length - 1) : (k + dir + nodes.length) % nodes.length)].focus();
      e.preventDefault();
    }
    root.addEventListener('keydown', onKey);

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVis);
    newRound();
    layout();
    start();

    return function cleanup() {
      alive = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      document.removeEventListener('visibilitychange', onVis);
      root.removeEventListener('keydown', onKey);
      if (root.parentNode) { root.parentNode.removeChild(root); }
    };
  }

  (window.ACTIVITIES || []).forEach(function (a) { if (a.id === 'zakupy') { a.mount = mount; } });
})();
