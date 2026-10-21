(function () {
  var menu = document.getElementById('menu-view');
  var view = document.getElementById('activity-view');
  var stage = document.getElementById('stage');
  var tiles = document.getElementById('tiles');
  var backBtn = document.getElementById('back');
  var cleanup = null;
  var currentId = null;

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
      if (location.hash !== '#' + a.id) { location.hash = a.id; }
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
      return;
    }
    menu.hidden = true;
    view.hidden = false;
    currentId = a.id;
    cleanup = a.mount(stage) || null;
    backBtn.focus();
  }

  backBtn.addEventListener('click', function () {
    if (history.length > 1 && currentId) { history.back(); } else { location.hash = ''; }
  });
  window.addEventListener('hashchange', render);
  render();
})();
