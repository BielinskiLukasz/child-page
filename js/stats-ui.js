// Parent-only "Statystyki" screen: a pane inside the gated Settings overlay (never reachable from activities or the menu).
// Shows app metrics and rankings per period, exports the stored aggregates as JSON (download or copy) and resets them.
(function () {
  var openBtn = document.getElementById('stats-open');
  var pane = document.getElementById('stats-pane');
  if (!openBtn || !pane || !window.Analytics) { return; }
  var setPane = document.getElementById('settings-pane');
  var periodsEl = document.getElementById('stats-periods');
  var appEl = document.getElementById('stats-app');
  var rankEl = document.getElementById('stats-rank');
  var secEl = document.getElementById('stats-sec');
  var progEl = document.getElementById('stats-prog');
  var msg = document.getElementById('stats-msg');
  var resetBtn = document.getElementById('stats-reset');
  var confirmBox = document.getElementById('stats-confirm');
  var PERIODS = [['session', 'Ta sesja'], ['today', 'Dziś'], ['7d', '7 dni'], ['30d', '30 dni'], ['all', 'Od początku']];
  var PROGRESS = { 'puzzle': 'elementów', 'pamiec': 'kart', 'ksztalty': 'kształtów', 'policz-razem': 'liczba' };
  var cur = 'today';

  function fmt(ms) {
    var s = Math.round(ms / 1000);
    if (s < 60) { return s + ' s'; }
    var m = Math.floor(s / 60);
    if (m < 60) { return m + ' min ' + (s % 60) + ' s'; }
    return Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
  }
  function pct(x) { return (Math.round(x * 10) / 10).toString().replace('.', ',') + '%'; }
  function when(ms) { return ms ? new Date(ms).toLocaleString('pl-PL') : '-'; }
  function el(tag, text, cls) {
    var e = document.createElement(tag);
    if (text !== undefined) { e.textContent = text; }
    if (cls) { e.className = cls; }
    return e;
  }
  function empty(box) { box.appendChild(el('p', 'Brak danych w tym okresie.', 'stats-empty')); }
  function rateText(r) { return r.rate === null ? '-' : Math.round(r.rate * 100) + '%'; }

  function renderPeriods() {
    periodsEl.textContent = '';
    PERIODS.forEach(function (p) {
      var b = el('button', p[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', p[0] === cur ? 'true' : 'false');
      b.addEventListener('click', function () { cur = p[0]; render(); periodsEl.querySelector('[aria-pressed="true"]').focus(); });
      periodsEl.appendChild(b);
    });
  }

  function row(dl, k, v) { dl.appendChild(el('dt', k)); dl.appendChild(el('dd', v)); }

  function render() {
    renderPeriods();
    var rk = window.Analytics.ranking(cur), a = rk.app, n = a.s;
    appEl.textContent = rankEl.textContent = secEl.textContent = progEl.textContent = '';
    if (!n && !rk.rows.length) { empty(appEl); } else {
      row(appEl, 'Sesje', String(n));
      row(appEl, 'Pierwsze uruchomienie', when(a.t0));
      row(appEl, 'Ostatnie zakończenie', when(a.t1));
      row(appEl, 'Łączny czas', fmt(a.act + a.idle));
      row(appEl, 'Średnio na sesję', n ? fmt((a.act + a.idle) / n) : '-');
      row(appEl, 'Czas aktywny', fmt(a.act));
      row(appEl, 'Czas bez dotyku (widoczna aplikacja)', fmt(a.idle));
      row(appEl, 'Czas w tle', fmt(a.hid));
      row(appEl, 'Zabawy otwarte w sesji (średnio)', n ? (Math.round(a.op / n * 10) / 10).toString().replace('.', ',') : '-');
      row(appEl, 'Różne zabawy w sesji (średnio)', n ? (Math.round(a.dist / n * 10) / 10).toString().replace('.', ',') : '-');
      row(appEl, 'Sesje bez zabawy', String(a.s0));
      row(appEl, 'Sesje z 2+ zabawami', String(a.s2));
      row(appEl, 'Dni z odwiedzinami', String(rk.days));
      if (cur === 'session') {
        var seq = window.Analytics.sessionSequence();
        row(appEl, 'Kolejność zabaw', seq.length ? seq.map(function (id) { return nameFor(id, rk); }).join(' → ') : '-');
      }
    }
    if (!rk.rows.length) { empty(rankEl); empty(secEl); empty(progEl); return; }
    rk.rows.forEach(function (r) {
      var li = el('li', r.name + ' - ' + fmt(r.act) + ' (' + pct(r.pct) + ')');
      li.appendChild(el('small', 'Starty: ' + r.st + ' · średnio: ' + fmt(r.avg) +
        (r.completable ? ' · ukończenia: ' + r.cmp + ' (' + rateText(r) + ')' : '') +
        ' · powtórki: ' + r.rst + (r.completable ? ' · wyjścia przed końcem: ' + r.ex : '') +
        ' · szybkie wyjścia (do 10 s): ' + r.qx + ' · dotknięcia: ' + r.int));
      rankEl.appendChild(li);
    });
    var sc = window.Analytics.secondary(cur);
    [['Najczęściej otwierane', sc.opened, function (r) { return r.st + ' razy'; }],
     ['Najczęściej ukończone', sc.completed, function (r) { return r.cmp + ' razy'; }],
     ['Najwyższy odsetek ukończeń', sc.rate, function (r) { return rateText(r); }],
     ['Najczęściej powtarzane', sc.replayed, function (r) { return r.rst + ' razy'; }]].forEach(function (g) {
      secEl.appendChild(el('p', g[0], 'stats-sec-title'));
      if (!g[1].length) { secEl.appendChild(el('p', '-', 'stats-empty')); return; }
      var ol = el('ol', undefined, 'stats-list');
      g[1].forEach(function (r) { ol.appendChild(el('li', r.name + ' - ' + g[2](r))); });
      secEl.appendChild(ol);
    });
    var any = false;
    rk.rows.forEach(function (r) {
      if (PROGRESS[r.id]) {
        any = true;
        progEl.appendChild(el('li', r.name + ' - największy poziom: ' + (r.lv || '-') + ' ' + PROGRESS[r.id] + ' · ukończone: ' + r.cmp));
      } else if (r.id === 'literki') {
        any = true;
        progEl.appendChild(el('li', r.name + ' - pokazane litery: ' + Object.keys(r.sh).length + ' · dotknięte litery: ' + Object.keys(r.tc).length));
      }
    });
    if (!any) { empty(progEl); }
  }
  function nameFor(id, rk) {
    for (var i = 0; i < rk.rows.length; i++) { if (rk.rows[i].id === id) { return rk.rows[i].name; } }
    var l = window.ACTIVITIES || [];
    for (var j = 0; j < l.length; j++) { if (l[j].id === id) { return l[j].name; } }
    return id;
  }

  function json() { return JSON.stringify(window.Analytics.exportData(), null, 2); }
  function hideConfirm() { confirmBox.hidden = true; resetBtn.hidden = false; }

  openBtn.addEventListener('click', function () {
    setPane.hidden = true; pane.hidden = false;
    msg.textContent = ''; hideConfirm(); render();
    pane.querySelector('h2').scrollIntoView();
    document.getElementById('stats-back').focus();
  });
  document.getElementById('stats-back').addEventListener('click', function () {
    pane.hidden = true; setPane.hidden = false; openBtn.focus();
  });
  document.getElementById('stats-export').addEventListener('click', function () {
    try {
      var blob = new Blob([json()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'statystyki-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      msg.textContent = 'Plik zapisany.';
    } catch (e) { msg.textContent = 'Nie udało się zapisać pliku. Spróbuj skopiować dane.'; }
  });
  document.getElementById('stats-copy').addEventListener('click', function () {
    function fallback() {
      var t = document.createElement('textarea');
      t.value = json(); t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(t);
      msg.textContent = ok ? 'Skopiowano.' : 'Nie udało się skopiować. Użyj pobierania pliku.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json()).then(function () { msg.textContent = 'Skopiowano.'; }, fallback);
    } else { fallback(); }
  });
  resetBtn.addEventListener('click', function () {
    resetBtn.hidden = true; confirmBox.hidden = false;
    document.getElementById('stats-confirm-no').focus();
  });
  document.getElementById('stats-confirm-no').addEventListener('click', function () { hideConfirm(); resetBtn.focus(); });
  document.getElementById('stats-confirm-yes').addEventListener('click', function () {
    window.Analytics.reset();
    hideConfirm(); render();
    msg.textContent = 'Statystyki wyzerowane.';
    resetBtn.focus();
  });
})();
