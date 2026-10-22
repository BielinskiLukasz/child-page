// Registry of activities. Each activity: { id, name, icon (SVG markup), mount(container) -> optional cleanup }.
// Activity issues replace the placeholder `mount` with the real implementation.
(function () {
  function svg(inner, fill) {
    return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<circle cx="32" cy="32" r="30" fill="' + fill + '"/>' + inner + '</svg>';
  }
  function placeholder(activity) {
    return function (container) {
      container.innerHTML = '<div>' + activity.icon + '<h2></h2><p>Już wkrótce!</p></div>';
      container.querySelector('h2').textContent = activity.name;
    };
  }
  var list = [
    { id: 'akwarium', name: 'Akwarium Artura',
      icon: svg('<ellipse cx="30" cy="32" rx="14" ry="9" fill="#ffb7a5"/><path d="M44 32l10-8v16z" fill="#ffb7a5"/><circle cx="22" cy="30" r="2" fill="#5b5675"/>', '#cfeaf7') },
    { id: 'ogrod', name: 'Magiczny Ogród',
      icon: svg('<path d="M32 50V32" stroke="#7fbf8f" stroke-width="4"/><circle cx="32" cy="26" r="9" fill="#f7a8c9"/><circle cx="32" cy="26" r="4" fill="#ffe9a8"/>', '#e2f3dc') },
    { id: 'niebo', name: 'Nocne Niebo',
      icon: svg('<path d="M36 14a18 18 0 1 0 14 28A15 15 0 0 1 36 14z" fill="#ffe9a8"/><circle cx="20" cy="20" r="2" fill="#fff"/><circle cx="48" cy="46" r="2" fill="#fff"/>', '#b9b3e0') },
    { id: 'dzien-i-noc', name: 'Dzień i Noc',
      icon: svg('<path d="M32 2a30 30 0 0 0 0 60z" fill="#b9b3e0"/><circle cx="20" cy="32" r="9" fill="#ffe08a"/><circle cx="46" cy="30" r="6" fill="#fff"/>', '#cfeaf7') },
    { id: 'motyle', name: 'Ogród Motyli',
      icon: svg('<ellipse cx="22" cy="28" rx="10" ry="12" fill="#f7a8c9"/><ellipse cx="42" cy="28" rx="10" ry="12" fill="#c9b8f2"/><rect x="30" y="20" width="4" height="26" rx="2" fill="#5b5675"/>', '#fdf0d5') },
    { id: 'malowanie', name: 'Malowanie Światłem',
      icon: svg('<path d="M14 40q10-24 20-4t16-14" fill="none" stroke="#ffb7a5" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="22" r="4" fill="#ffe9a8"/>', '#e6e0f7') },
    { id: 'ksztalty', name: 'Kolorowe Kształty',
      icon: svg('<circle cx="20" cy="22" r="8" fill="#f7a8c9"/><rect x="36" y="14" width="16" height="16" rx="4" fill="#a8d8f0"/><path d="M32 52l-10-17h20z" fill="#ffd98a" stroke="#ffd98a" stroke-width="3" stroke-linejoin="round"/>', '#fdf0d5') }
  ];
  list.forEach(function (a) { a.mount = placeholder(a); });
  window.ACTIVITIES = list;
})();
