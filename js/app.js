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

  function byId(id) {
    return window.ACTIVITIES.filter(function (a) { return a.id === id; })[0];
  }

  window.ACTIVITIES.forEach(function (a) {
    var li = document.createElement('li');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tile';
    btn.innerHTML = a.icon + '<span></span>';
    btn.lastChild.textContent = a.name;
    btn.addEventListener('click', function () {
      lastTile = btn;
      if (location.hash !== '#' + a.id) { pushedByApp = true; location.hash = a.id; }
    });
    li.appendChild(btn);
    tiles.appendChild(li);
  });

  function unmount() {
    if (typeof cleanup === 'function') { cleanup(); }
    cleanup = null;
    currentId = null;
    stage.textContent = '';
  }

  // Renders whatever the URL hash says; hash changes give browser Back for free, no reload.
  function render() {
    var a = byId(location.hash.replace(/^#\/?/, ''));
    if (a && a.id === currentId) { return; }
    unmount();
    if (!a) {
      view.hidden = true;
      menu.hidden = false;
      pushedByApp = false;
      if (lastTile) { lastTile.focus(); }
      return;
    }
    menu.hidden = true;
    view.hidden = false;
    currentId = a.id;
    cleanup = a.mount(stage) || null;
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
})();
