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
    { id: 'pociag', name: 'Mały Pociąg',
      icon: svg('<rect x="10" y="28" width="14" height="14" rx="3" fill="#f7a8c9"/><rect x="26" y="28" width="14" height="14" rx="3" fill="#a9d6f2"/><rect x="42" y="22" width="12" height="20" rx="3" fill="#9ed8c6"/><circle cx="17" cy="46" r="3" fill="#5b5675"/><circle cx="33" cy="46" r="3" fill="#5b5675"/><circle cx="48" cy="46" r="3" fill="#5b5675"/><path d="M8 50h48" stroke="#8a84a8" stroke-width="2"/><circle cx="46" cy="14" r="4" fill="#fff"/>', '#dff1fb') },
    { id: 'banki', name: 'Bańki Mydlane',
      icon: svg('<circle cx="26" cy="34" r="13" fill="#fff" fill-opacity=".55" stroke="#b7deff" stroke-width="2.5"/><circle cx="46" cy="22" r="8" fill="#fff" fill-opacity=".55" stroke="#f7a8c9" stroke-width="2.5"/><circle cx="44" cy="46" r="5" fill="#fff" fill-opacity=".55" stroke="#c8ffe2" stroke-width="2"/><path d="M20 29a8 8 0 0 1 6-4" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>', '#d8ecfb') },
    { id: 'dobranoc', name: 'Dobranoc',
      icon: svg('<rect x="14" y="30" width="36" height="26" rx="4" fill="#f6dcc8"/><path d="M10 32L32 14l22 18z" fill="#c9a0c0"/><rect x="20" y="36" width="10" height="10" rx="2" fill="#ffe9a8"/><rect x="36" y="36" width="10" height="10" rx="2" fill="#7d86b8"/><circle cx="50" cy="14" r="5" fill="#ffe9a8"/>', '#b9b3e0') },
    { id: 'deszczyk', name: 'Deszczyk i Tęcza',
      icon: svg('<g fill="#fff"><circle cx="24" cy="26" r="9"/><circle cx="35" cy="22" r="11"/><circle cx="45" cy="27" r="8"/><rect x="18" y="26" width="34" height="8" rx="4"/></g><path d="M25 40v6M35 41v7M45 40v6" stroke="#8ec5ea" stroke-width="3" stroke-linecap="round"/><path d="M14 56a18 18 0 0 1 36 0" fill="none" stroke="#f7b6c2" stroke-width="3" opacity=".8"/>', '#cfeaf7') },
    { id: 'ksztalty', name: 'Kolorowe Kształty',
      icon: svg('<circle cx="20" cy="22" r="8" fill="#f7a8c9"/><rect x="36" y="14" width="16" height="16" rx="4" fill="#a8d8f0"/><path d="M32 52l-10-17h20z" fill="#ffd98a" stroke="#ffd98a" stroke-width="3" stroke-linejoin="round"/>', '#fdf0d5') },
    { id: 'farma', name: 'Zwierzątka na Farmie',
      icon: svg('<rect x="10" y="30" width="44" height="28" rx="4" fill="#f6c9b0"/><path d="M6 32L32 12l26 20z" fill="#d9b99b"/><rect x="26" y="40" width="12" height="18" rx="3" fill="#fbe7c8"/><circle cx="52" cy="50" r="7" fill="#fbf7ff" stroke="#c9b8f2" stroke-width="2"/>', '#e3f1d9') },
    { id: 'policz-razem', name: 'Policz Razem',
      icon: svg('<circle cx="20" cy="26" r="9" fill="#c4e8a0"/><circle cx="44" cy="26" r="9" fill="#c4e8a0"/><circle cx="32" cy="44" r="9" fill="#c4e8a0"/><g fill="#f7a8c9"><circle cx="16" cy="56" r="3"/><circle cx="26" cy="56" r="3"/><circle cx="36" cy="56" r="3"/></g>', '#fdf0d5') },
    { id: 'duze-i-male', name: 'Duże i Małe',
      icon: svg('<path d="M4 34L20 18l16 16z" fill="#b9b3e0"/><rect x="7" y="34" width="26" height="20" rx="3" fill="#f6c9b0"/><path d="M38 46l9-9 9 9z" fill="#b9b3e0"/><rect x="40" y="46" width="14" height="8" rx="2" fill="#cfe3f7"/>', '#fdf0d5') }
  ];
  list.forEach(function (a) { a.mount = placeholder(a); });
  window.ACTIVITIES = list;
})();
