// Shared randomisation helper for activity variety: window.Rand. Pure in-memory, stores nothing
// (no localStorage); "last pick" memory lasts only for the current page session.
(function () {
  var last = {}; // key -> last item returned by pickOne in this page session

  // Returns a new shuffled copy (Fisher-Yates); the input is not modified.
  function shuffle(list) {
    var a = Array.prototype.slice.call(list || []);
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // N unique items from the pool; N >= pool size returns the whole pool shuffled;
  // a negative or non-numeric N returns [].
  function pick(list, n) {
    var a = shuffle(list);
    n = Math.floor(n);
    if (!(n >= 0)) return [];
    return n < a.length ? a.slice(0, n) : a;
  }

  // One item, never the one returned last time for the same key (pools of 2+).
  // key: any string naming the call site, e.g. an activity id. Empty pool -> undefined.
  function pickOne(list, key) {
    var a = Array.prototype.slice.call(list || []);
    if (!a.length) return undefined;
    key = key || '';
    var pool = a.length > 1 && last.hasOwnProperty(key)
      ? a.filter(function (x) { return x !== last[key]; }) : a;
    if (!pool.length) pool = a; // pool of duplicates only
    var item = pool[Math.floor(Math.random() * pool.length)];
    last[key] = item;
    return item;
  }

  window.Rand = { shuffle: shuffle, pick: pick, pickOne: pickOne };
})();
