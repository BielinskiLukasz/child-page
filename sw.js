// Offline support: network-first for same-origin GETs (so a new deployment is picked up on the
// next launch with network), falling back to the cache when offline or the network is slow.
// No version bump needed on deploy: assets are re-validated against the network every time.
var CACHE = 'swa-v1';

self.addEventListener('install', function (e) {
  e.waitUntil((async function () {
    var cache = await caches.open(CACHE);
    var res = await fetch('./', { cache: 'reload' });
    var html = await res.clone().text();
    await cache.put('./', res);
    // Cache every script/stylesheet/icon index.html references, so whatever it lists works offline.
    var urls = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'];
    var re = /(?:src|href)="([^":]+\.(?:js|css|png|svg|webmanifest))"/g;
    var m;
    while ((m = re.exec(html))) { urls.push(m[1]); }
    // Activity scripts are loaded lazily, so precache every src/deps URL listed in the registry too.
    var reg = await (await fetch('js/activities.js', { cache: 'reload' })).text();
    var re2 = /'(js\/[\w.-]+\.js)'/g;
    while ((m = re2.exec(reg))) { if (urls.indexOf(m[1]) < 0) { urls.push(m[1]); } }
    // A file that cannot be fetched fails the install (the browser retries) instead of caching a partial app.
    await Promise.all(urls.map(function (u) {
      return fetch(u, { cache: 'reload' }).then(function (r) {
        if (!r.ok) { throw new Error(u + ' ' + r.status); }
        return cache.put(u, r);
      });
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) { return; }
  e.respondWith((async function () {
    var cache = await caches.open(CACHE);
    var key = req.mode === 'navigate' ? './' : req;
    try {
      var res = await Promise.race([
        fetch(req, { cache: 'no-cache' }),
        new Promise(function (_, rej) { setTimeout(rej, 5000); })
      ]);
      if (res && res.ok) { cache.put(key, res.clone()); }
      return res;
    } catch (err) {
      var hit = await cache.match(key, { ignoreSearch: true });
      if (hit) { return hit; }
      throw err;
    }
  })());
});
