// Anonymous, on-device usage metrics (window.Analytics). The one and only place that touches analytics storage.
// Stores only daily aggregates (last 90 days) plus running all-time totals in localStorage under 'swa.stats':
// no network, no cookies, no per-event history, no names/ids/fingerprint; the per-session id lives in memory only.
// Everything is wrapped so a failure (or unavailable/full storage) never affects the app or any activity.
// Event model: track(type, { activityId, level, variant, duration }) with type one of session_start, session_end,
// activity_start, activity_end, activity_complete, activity_restart, interaction, level_start, level_complete.
// Activities call levelStart / levelComplete / complete / track('interaction', { variant }); app.js reports
// activity start/end and this module counts touches inside #stage itself.
(function () {
  var KEY = 'swa.stats';
  var IDLE_MS = 60000;         // no input for this long = inactive
  var SESSION_GAP_MS = 30 * 60000; // hidden longer than this: a return starts a new session
  var KEEP_DAYS = 90;
  var MAX_TICK = 2000;         // ms; larger gaps (clock jumps, throttled timers) are not credited
  var QUICK_MS = 10000;        // leaving within this time of starting is a quick exit
  var FLUSH_MS = 5000;
  // Activities with a clear completion state; all others are open-ended (starts, active time, interactions only).
  var COMPLETABLE = { 'puzzle': 1, 'pamiec': 1, 'ksztalty': 1, 'policz-razem': 1 };

  var stage = document.getElementById('stage');
  var mem = null, dirty = false;
  var data = load();
  var sess = null, cur = null;
  var lastTick = Date.now(), lastInput = Date.now(), hiddenAt = 0, lastFlush = 0;

  // ---- data model ----
  function num(v) { return typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0; }
  function newAct() { return { st: 0, act: 0, cmp: 0, rc: 0, rst: 0, ex: 0, qx: 0, int: 0, lc: 0, lv: 0, first: 0, sh: {}, tc: {} }; }
  function newBucket() { return { s: 0, s0: 0, s2: 0, act: 0, idle: 0, hid: 0, op: 0, dist: 0, t0: 0, t1: 0, acts: {} }; }
  function cleanMap(m) {
    var o = {};
    if (m && typeof m === 'object') { Object.keys(m).slice(0, 80).forEach(function (k) { o[String(k).slice(0, 8)] = num(m[k]); }); }
    return o;
  }
  // Rebuilds a bucket from untrusted JSON, keeping only the known numeric fields.
  function cleanBucket(r) {
    var b = newBucket();
    if (!r || typeof r !== 'object') { return b; }
    ['s', 's0', 's2', 'act', 'idle', 'hid', 'op', 'dist', 't0', 't1'].forEach(function (k) { b[k] = num(r[k]); });
    if (r.acts && typeof r.acts === 'object') {
      Object.keys(r.acts).slice(0, 200).forEach(function (id) {
        var e = r.acts[id], a = newAct();
        if (!e || typeof e !== 'object') { return; }
        ['st', 'act', 'cmp', 'rc', 'rst', 'ex', 'qx', 'int', 'lc', 'lv', 'first'].forEach(function (k) { a[k] = num(e[k]); });
        a.sh = cleanMap(e.sh); a.tc = cleanMap(e.tc);
        b.acts[String(id).slice(0, 40)] = a;
      });
    }
    return b;
  }
  function fresh() { return { v: 1, days: {}, total: newBucket(), nDays: 0 }; }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayKey(ms) { var d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function cutoffKey(daysBack) { var d = new Date(); return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysBack).getTime()); }

  function load() {
    var d = fresh(), raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { raw = mem; }
    if (raw && typeof raw === 'object' && raw.days && typeof raw.days === 'object') {
      Object.keys(raw.days).forEach(function (k) { if (/^\d{4}-\d{2}-\d{2}$/.test(k)) { d.days[k] = cleanBucket(raw.days[k]); } });
      d.total = cleanBucket(raw.total);
      d.nDays = num(raw.nDays);
    }
    prune(d);
    return d;
  }
  function prune(d) {
    var cut = cutoffKey(KEEP_DAYS);
    Object.keys(d.days).forEach(function (k) { if (k < cut) { delete d.days[k]; } });
  }
  function flush() {
    lastFlush = Date.now();
    if (!dirty) { return; }
    try { prune(data); mem = data; localStorage.setItem(KEY, JSON.stringify(data)); dirty = false; } catch (e) { /* kept in memory */ }
  }

  function dayBucket(key) {
    if (!data.days[key]) { data.days[key] = newBucket(); }
    return data.days[key];
  }
  function actOf(b, id) { return b.acts[id] || (b.acts[id] = newAct()); }

  // Applies fn to the session, the day and the all-time bucket. Session-scoped counters go to the day the session began.
  function each(fn, sessionScoped) {
    if (sess) { fn(sess.b); }
    fn(dayBucket(sessionScoped && sess ? sess.day : dayKey(Date.now())));
    fn(data.total);
    dirty = true;
  }

  function rid() {
    var s = '', i;
    try {
      var a = new Uint8Array(8); crypto.getRandomValues(a);
      for (i = 0; i < a.length; i++) { s += (a[i] < 16 ? '0' : '') + a[i].toString(16); }
      return s;
    } catch (e) { for (i = 0; i < 16; i++) { s += Math.floor(Math.random() * 16).toString(16); } return s; }
  }

  // ---- sessions ----
  function startSession() {
    var now = Date.now();
    sess = { id: rid(), day: dayKey(now), start: now, b: newBucket(), opened: 0, seen: {}, seq: [] };
    var newDay = !data.days[sess.day] || !data.days[sess.day].s;
    each(function (b) { b.s++; b.s0++; if (!b.t0 || now < b.t0) { b.t0 = now; } b.t1 = Math.max(b.t1, now); }, true);
    if (newDay) { data.nDays++; }
    lastInput = now;
  }
  function endSession() {
    if (!sess) { return; }
    var now = Date.now();
    each(function (b) { b.t1 = Math.max(b.t1, now); }, true);
    sess = null;
  }

  // ---- activities ----
  function activityStart(id) {
    if (!id) { return; }
    if (cur) { activityEnd(); }
    if (!sess) { startSession(); }
    var now = Date.now();
    cur = { id: id, t0: now, done: false };
    var s = sess;
    s.opened++; s.seq.push(id);
    var again = !!s.seen[id], firstEver = s.opened === 1;
    s.seen[id] = 1;
    each(function (b) { var a = actOf(b, id); a.st++; b.op++; if (again) { a.rst++; } if (firstEver) { a.first++; } });
    each(function (b) {
      if (s.opened === 1) { b.s0 = Math.max(0, b.s0 - 1); }
      if (s.opened === 2) { b.s2++; }
      if (!again) { b.dist++; }
    }, true);
  }
  function activityEnd(duration) {
    if (!cur) { return; }
    var c = cur, id = c.id, dur = Math.max(0, typeof duration === 'number' ? duration : Date.now() - c.t0);
    cur = null;
    each(function (b) {
      var a = actOf(b, id);
      if (COMPLETABLE[id] && !c.done) { a.ex++; }
      if (dur <= QUICK_MS) { a.qx++; }
    });
  }
  function complete(level) {
    if (!cur) { return; }
    var id = cur.id, first = !cur.done;
    cur.done = true;
    each(function (b) { var a = actOf(b, id); a.cmp++; if (first) { a.rc++; } if (level > a.lv) { a.lv = level; } });
  }
  function bump(level, variant, completed) {
    if (!cur) { return; }
    var id = cur.id;
    level = typeof level === 'number' && isFinite(level) && level > 0 ? level : 0;
    variant = variant === undefined || variant === null ? null : String(variant).slice(0, 8);
    each(function (b) {
      var a = actOf(b, id);
      if (level > a.lv) { a.lv = level; }
      if (completed) { a.lc++; }
      if (variant && !completed) { a.sh[variant] = (a.sh[variant] || 0) + 1; }
    });
  }

  // One entry point for the common event model; unknown types are ignored. Nothing is kept per event.
  function track(type, d) {
    try {
      d = d || {};
      var e = { type: type, activityId: d.activityId || (cur && cur.id) || null, sessionId: sess ? sess.id : null,
        timestamp: Date.now(), duration: d.duration, level: d.level, variant: d.variant };
      switch (type) {
        case 'session_start': if (!sess) { startSession(); } break;
        case 'session_end': activityEnd(); endSession(); flush(); break;
        case 'activity_start': activityStart(e.activityId); break;
        case 'activity_end': activityEnd(e.duration); break;
        case 'activity_complete': complete(e.level); break;
        case 'activity_restart':
          if (cur) { var id = cur.id; each(function (b) { actOf(b, id).rst++; }); }
          break;
        case 'interaction':
          // Touches are counted centrally; an interaction event with a variant only records which variant (e.g. a letter).
          if (cur && e.variant !== undefined && e.variant !== null) {
            var v = String(e.variant).slice(0, 8), cid = cur.id;
            each(function (b) { var a = actOf(b, cid); a.tc[v] = (a.tc[v] || 0) + 1; });
          }
          break;
        case 'level_start': bump(e.level, e.variant, false); break;
        case 'level_complete': bump(e.level, null, true); break;
      }
    } catch (err) { /* analytics must never break the app */ }
  }

  // ---- time: active vs inactive ----
  function tick() {
    try {
      var now = Date.now(), dt = Math.max(0, Math.min(MAX_TICK, now - lastTick));
      lastTick = now;
      if (document.visibilityState !== 'visible') { return; }
      if (!sess) { startSession(); }
      if (dt > 0) {
        var active = now - lastInput < IDLE_MS, c = cur;
        each(function (b) {
          if (active) { b.act += dt; if (c) { actOf(b, c.id).act += dt; } } else { b.idle += dt; }
        });
      }
      if (now - lastFlush >= FLUSH_MS) { flush(); }
    } catch (err) { /* ignore */ }
  }
  function input() { lastInput = Date.now(); }
  function touchIn(e) {
    try {
      lastInput = Date.now();
      if (cur && stage && stage.contains(e.target)) {
        var id = cur.id;
        each(function (b) { actOf(b, id).int++; });
      }
    } catch (err) { /* ignore */ }
  }

  document.addEventListener('pointerdown', touchIn, true);
  document.addEventListener('keydown', touchIn, true);
  document.addEventListener('pointermove', input, true);
  document.addEventListener('touchstart', input, true);
  document.addEventListener('visibilitychange', function () {
    try {
      var now = Date.now();
      if (document.visibilityState === 'hidden') {
        hiddenAt = now;
        flush();
      } else {
        var gap = hiddenAt ? Math.max(0, now - hiddenAt) : 0, seen = cur ? Math.max(0, hiddenAt - cur.t0) : 0;
        hiddenAt = 0; lastTick = now; lastInput = now;
        if (gap > SESSION_GAP_MS) {
          // Away too long: the old session (and its open activity) ended when it was hidden; this return is a new session.
          var open = cur && cur.id;
          activityEnd(seen);
          endSession();
          startSession();
          if (open) { activityStart(open); }
        } else if (gap > 0) {
          each(function (b) { b.hid += gap; });
        }
      }
    } catch (err) { /* ignore */ }
  });
  window.addEventListener('pagehide', function () {
    try { activityEnd(); endSession(); flush(); } catch (err) { /* ignore */ }
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && !sess) { try { startSession(); } catch (err) { /* ignore */ } }
  });
  startSession();
  setInterval(tick, 1000);

  // ---- queries (used by the parent-only stats screen) ----
  function merge(list) {
    var o = newBucket();
    list.forEach(function (b) {
      ['s', 's0', 's2', 'act', 'idle', 'hid', 'op', 'dist'].forEach(function (k) { o[k] += b[k]; });
      if (b.t0 && (!o.t0 || b.t0 < o.t0)) { o.t0 = b.t0; }
      o.t1 = Math.max(o.t1, b.t1);
      Object.keys(b.acts).forEach(function (id) {
        var x = b.acts[id], a = actOf(o, id);
        ['st', 'act', 'cmp', 'rc', 'rst', 'ex', 'qx', 'int', 'lc', 'first'].forEach(function (k) { a[k] += x[k]; });
        a.lv = Math.max(a.lv, x.lv);
        ['sh', 'tc'].forEach(function (m) { Object.keys(x[m]).forEach(function (k) { a[m][k] = (a[m][k] || 0) + x[m][k]; }); });
      });
    });
    return o;
  }
  // period: session | today | 7d | 30d | all. Returns { b: merged bucket, days: distinct days with a session }.
  function period(name) {
    var keys = Object.keys(data.days), key;
    if (name === 'session') { return { b: merge(sess ? [sess.b] : []), days: sess ? 1 : 0 }; }
    if (name === 'all') { return { b: merge([data.total]), days: data.nDays }; }
    key = name === 'today' ? cutoffKey(0) : cutoffKey(name === '7d' ? 6 : 29);
    var list = keys.filter(function (k) { return k >= key && data.days[k].s > 0; }).map(function (k) { return data.days[k]; });
    return { b: merge(list), days: list.length };
  }
  function nameOf(id) {
    var l = window.ACTIVITIES || [];
    for (var i = 0; i < l.length; i++) { if (l[i].id === id) { return l[i].name; } }
    return id;
  }
  // Primary ranking: by total active time, ties by starts. Only activities with history appear.
  function ranking(name) {
    var p = period(name), total = 0, rows = [];
    Object.keys(p.b.acts).forEach(function (id) {
      var a = p.b.acts[id];
      if (!a.st && !a.act) { return; }
      total += a.act;
      rows.push({ id: id, name: nameOf(id), act: a.act, st: a.st, cmp: a.cmp, rc: a.rc, rst: a.rst, ex: a.ex, qx: a.qx,
        int: a.int, lv: a.lv, lc: a.lc, sh: a.sh, tc: a.tc, completable: !!COMPLETABLE[id] });
    });
    rows.forEach(function (r) {
      r.pct = total ? r.act / total * 100 : 0;
      r.avg = r.st ? r.act / r.st : 0;
      r.rate = r.completable && r.st ? Math.min(1, r.rc / r.st) : null; // share of starts with at least one completion
    });
    rows.sort(function (x, y) { return y.act - x.act || y.st - x.st; });
    rows.forEach(function (r, i) { r.rank = i + 1; });
    return { rows: rows, total: total, app: p.b, days: p.days };
  }
  function secondary(name) {
    var rows = ranking(name).rows;
    function top(list, key) { return list.filter(function (r) { return r[key] > 0; }).sort(function (x, y) { return y[key] - x[key] || y.act - x.act; }).slice(0, 5); }
    var comp = rows.filter(function (r) { return r.completable; });
    return {
      opened: top(rows, 'st'),
      completed: top(comp, 'cmp'),
      rate: comp.filter(function (r) { return r.rate !== null && r.rate > 0; })
        .sort(function (x, y) { return y.rate - x.rate || y.st - x.st; }).slice(0, 5),
      replayed: top(rows, 'rst')
    };
  }
  function exportData() {
    return { app: 'child-page', kind: 'usage-aggregates', version: 1, exportedAt: new Date().toISOString(),
      retentionDays: KEEP_DAYS, distinctDaysAllTime: data.nDays, days: data.days, total: data.total };
  }
  function reset() {
    var open = cur && cur.id;
    data = fresh(); dirty = true; cur = null; sess = null;
    startSession();
    if (open) { activityStart(open); }
    flush();
  }

  window.Analytics = { track: track, levelStart: function (level, variant) { track('level_start', { level: level, variant: variant }); },
    levelComplete: function (level) { track('level_complete', { level: level }); },
    complete: function (level) { track('activity_complete', { level: level }); },
    activityStart: function (id) { track('activity_start', { activityId: id }); },
    activityEnd: function () { track('activity_end'); },
    period: period, ranking: ranking, secondary: secondary, exportData: exportData, reset: reset,
    sessionSequence: function () { return sess ? sess.seq.slice() : []; }};
})();
