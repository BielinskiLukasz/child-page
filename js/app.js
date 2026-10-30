(function () {
  var menu = document.getElementById('menu-view');
  var view = document.getElementById('activity-view');
  var stage = document.getElementById('stage');
  var tiles = document.getElementById('tiles');
  var favTiles = document.getElementById('fav-tiles');
  var favHead = document.getElementById('fav-head');
  var backBtn = document.getElementById('back');
  var cleanup = null;
  var currentId = null;
  var pushedByApp = false;
  var lastTile = null;
  var menuScroll = 0;
  var mountToken = 0;
  var scripts = {};
  var loaded = {};

  // Loads a script once (shared promise); a script already present in index.html counts as loaded.
  function loadScript(url) {
    if (!scripts[url]) {
      scripts[url] = new Promise(function (resolve, reject) {
        if (document.querySelector('script[src="' + url + '"]')) { resolve(); return; }
        var el = document.createElement('script');
        el.src = url;
        el.onload = function () { loaded[url] = true; resolve(); };
        el.onerror = function () { delete scripts[url]; el.remove(); reject(new Error(url)); };
        document.head.appendChild(el);
      });
    }
    return scripts[url];
  }

  // Resolves once the activity's deps and then its own script are loaded (no-op without `src`).
  function loadActivity(a) {
    return (a.deps || []).reduce(function (p, d) {
      return p.then(function () { return loadScript(d); });
    }, Promise.resolve()).then(function () { return a.src ? loadScript(a.src) : null; });
  }

  function isLoaded(a) {
    return [].concat(a.deps || [], a.src || []).every(function (u) {
      // Eager tags (index.html) run before app.js; injected ones count once their load event fired.
      return u in loaded || (!scripts[u] && !!document.querySelector('script[src="' + u + '"]'));
    });
  }

  function say(text) {
    var p = document.createElement('p');
    p.className = 'load-msg';
    p.setAttribute('role', 'status');
    p.textContent = text;
    stage.textContent = '';
    stage.appendChild(p);
  }

  function byId(id) {
    return window.ACTIVITIES.filter(function (a) { return a.id === id; })[0];
  }

  function addTile(parent, a) {
    var li = document.createElement('li');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tile';
    btn.innerHTML = a.icon + '<span></span>';
    btn.lastChild.textContent = a.name;
    btn.addEventListener('click', function () {
      lastTile = btn;
      menuScroll = window.pageYOffset || 0;
      if (location.hash !== '#' + a.id) { pushedByApp = true; location.hash = a.id; }
    });
    li.appendChild(btn);
    parent.appendChild(li);
  }

  // Tiles are the enabled activities in the parent-configured order (see menu-config.js); parent-starred
  // ones go in the "Ulubione" section above and are not repeated below.
  function buildTiles() {
    tiles.textContent = '';
    favTiles.textContent = '';
    lastTile = null;
    var favs = window.MenuConfig.favouriteActivities();
    var isFav = {};
    favs.forEach(function (a) { isFav[a.id] = true; addTile(favTiles, a); });
    window.MenuConfig.enabledActivities().forEach(function (a) {
      if (!isFav[a.id]) { addTile(tiles, a); }
    });
    favHead.hidden = favTiles.hidden = favs.length === 0;
    tiles.hidden = tiles.children.length === 0;
  }
  buildTiles();
  document.addEventListener('menuconfig', buildTiles);
  window.addEventListener('storage', function (e) { if (e.key === 'swa.menu') { buildTiles(); } });

  function unmount() {
    mountToken++;
    window.Analytics.activityEnd();
    window.Playtime.stop();
    if (typeof cleanup === 'function') { cleanup(); }
    cleanup = null;
    currentId = null;
    stage.textContent = '';
  }

  // Renders whatever the URL hash says; hash changes give browser Back for free, no reload.
  function render() {
    var a = byId(location.hash.replace(/^#\/?/, ''));
    // A disabled activity cannot be opened by any route: fall back to the menu.
    if (a && !window.MenuConfig.isEnabled(a.id)) { a = null; }
    if (a && a.id === currentId) { return; }
    unmount();
    if (!a) {
      view.hidden = true;
      menu.hidden = false;
      pushedByApp = false;
      // Restore the menu's scroll position (it collapses while hidden) before focusing without scrolling.
      if (lastTile) { lastTile.focus({ preventScroll: true }); }
      window.scrollTo(0, menuScroll);
      return;
    }
    if (!menu.hidden) { menuScroll = window.pageYOffset || 0; }
    menu.hidden = true;
    view.hidden = false;
    window.scrollTo(0, 0);
    currentId = a.id;
    var expired = window.Playtime.isExpired();
    var shownLater = expired;
    window.Playtime.start(function () {
      // Time is up: stop the activity and show the gentle "later" screen; Back/menu stay usable.
      if (shownLater) { return; } // already shown; don't re-render on every tick
      shownLater = true;
      window.Analytics.activityEnd();
      if (typeof cleanup === 'function') { cleanup(); }
      cleanup = null;
      window.Playtime.renderLater(stage, true);
    });
    // start() calls stop(), which cancels any fade; run renderLater after it so the fade-in survives.
    if (expired) {
      window.Playtime.renderLater(stage);
    } else {
      window.Analytics.activityStart(a.id);
      if (isLoaded(a)) {
        cleanup = a.mount(stage) || null;
      } else {
        // Script is fetched on first open; a stale result (Back, time up, other activity) is ignored.
        var token = mountToken;
        var current = function () { return token === mountToken && !shownLater; };
        say('Chwileczkę…');
        loadActivity(a).then(function () {
          if (current()) { stage.textContent = ''; cleanup = a.mount(stage) || null; }
        }, function () {
          if (current()) { say('Ta zabawa się nie wczytała. Wróć i spróbuj jeszcze raz.'); }
        });
      }
    }
    backBtn.focus();
  }

  backBtn.addEventListener('click', function () {
    // Only go back in history if the app itself pushed this entry; otherwise Back could leave the app.
    if (pushedByApp) { history.back(); return; }
    history.replaceState(null, '', location.pathname + location.search);
    render();
  });
  window.addEventListener('hashchange', render);
  render();

  // Offline support; failure to register must never affect the app.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
