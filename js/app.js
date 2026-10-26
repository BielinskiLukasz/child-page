(function () {
  var menu = document.getElementById('menu-view');
  var view = document.getElementById('activity-view');
  var stage = document.getElementById('stage');
  var tiles = document.getElementById('tiles');
  var backBtn = document.getElementById('back');
  var cleanup = null;
  var currentId = null;
  var pushedByApp = false;
  var lastTile = null;
  var menuScroll = 0;

  function byId(id) {
    return window.ACTIVITIES.filter(function (a) { return a.id === id; })[0];
  }

  // Tiles are the enabled activities in the parent-configured order (see menu-config.js).
  function buildTiles() {
    tiles.textContent = '';
    lastTile = null;
    window.MenuConfig.enabledActivities().forEach(function (a) {
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
      tiles.appendChild(li);
    });
  }
  buildTiles();
  document.addEventListener('menuconfig', buildTiles);
  window.addEventListener('storage', function (e) { if (e.key === 'swa.menu') { buildTiles(); } });

  function unmount() {
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
      cleanup = a.mount(stage) || null;
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
