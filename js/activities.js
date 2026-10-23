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
    { id: 'ubierz-misia', name: 'Ubierz Misia',
      icon: svg('<circle cx="19" cy="22" r="7" fill="#d9a77a"/><circle cx="45" cy="22" r="7" fill="#d9a77a"/><circle cx="32" cy="36" r="18" fill="#d9a77a"/><ellipse cx="32" cy="42" rx="8" ry="6" fill="#f1d3b3"/><circle cx="26" cy="33" r="2" fill="#5b5675"/><circle cx="38" cy="33" r="2" fill="#5b5675"/><ellipse cx="32" cy="40" rx="3" ry="2" fill="#5b5675"/><ellipse cx="32" cy="22" rx="22" ry="5" fill="#ffd98a"/><path d="M18 22Q18 8 32 8Q46 8 46 22Z" fill="#ffe3a0"/>', '#fdf0d5') },
    { id: 'przeciwienstwa', name: 'Przeciwieństwa',
      icon: svg('<rect x="10" y="14" width="20" height="34" rx="3" fill="#c9a0c0"/><path d="M30 14l10 5v30l-10-1z" fill="#f3d9a8"/><circle cx="46" cy="22" r="8" fill="#f7a8c9"/><path d="M46 30v10" stroke="#8a84a8" stroke-width="2"/><path d="M30 56h28" stroke="#cfeab4" stroke-width="4" stroke-linecap="round"/>', '#e6e0f7') },
    { id: 'co-nie-pasuje', name: 'Co nie Pasuje?',
      icon: svg('<circle cx="14" cy="32" r="9" fill="#f7a8a8"/><circle cx="34" cy="32" r="9" fill="#f7a8a8"/><rect x="44" y="22" width="18" height="20" rx="5" fill="#a8d8f0"/><circle cx="52" cy="14" r="4" fill="#fff3b8"/>', '#fdf0d5') },
    { id: 'literki', name: 'Literki',
      icon: svg('<rect x="8" y="12" width="48" height="40" rx="8" fill="#fff"/><text x="32" y="42" text-anchor="middle" font-size="26" font-weight="800" fill="#8f7fd1" font-family="sans-serif">Aa</text>', '#fdf0d5') },
    { id: 'sciezka', name: 'Ścieżka',
      icon: svg('<path d="M12 50q14-4 14-16t14-8q14 4 12-10" fill="none" stroke="#fbf3dc" stroke-width="12" stroke-linecap="round"/><path d="M12 50q14-4 14-16" fill="none" stroke="#f9d6e4" stroke-width="7" stroke-linecap="round"/><circle cx="20" cy="42" r="6" fill="#f3c7a6"/><circle cx="52" cy="16" r="6" fill="#f7b6d2"/><circle cx="52" cy="16" r="2.5" fill="#ffe9a8"/>', '#e6f3e0') },
    { id: 'wzorki', name: 'Wzorki',
      icon: svg('<path d="M8 32h48" stroke="#d9d0ee" stroke-width="3"/><circle cx="14" cy="32" r="8" fill="#f7a8c9"/><rect x="24" y="24" width="16" height="16" rx="4" fill="#a8d8f0"/><circle cx="50" cy="32" r="8" fill="#f7a8c9"/><circle cx="32" cy="52" r="7" fill="#fff" fill-opacity=".6" stroke="#c9bde8" stroke-width="2" stroke-dasharray="3 3"/>', '#e6e0f7') },
    { id: 'chowany', name: 'Zabawa w chowanego',
      icon: svg('<g fill="#9fd4a8"><circle cx="22" cy="42" r="14"/><circle cx="38" cy="38" r="17"/><circle cx="50" cy="44" r="12"/><rect x="10" y="44" width="50" height="16" rx="8"/></g><ellipse cx="28" cy="20" rx="4" ry="10" fill="#fbf7ff"/><ellipse cx="40" cy="20" rx="4" ry="10" fill="#fbf7ff"/><circle cx="52" cy="14" r="6" fill="#ffe9a8"/>', '#e3f1d9') },
    { id: 'koraliki', name: 'Koraliki',
      icon: svg('<path d="M6 40Q32 26 58 40" fill="none" stroke="#c9a0c0" stroke-width="3" stroke-linecap="round"/><circle cx="14" cy="38" r="7" fill="#f7a8c9"/><rect x="23" y="34" width="12" height="12" rx="4" fill="#a8d8f0"/><circle cx="43" cy="38" r="6" fill="#ffe08a"/><circle cx="53" cy="40" r="5" fill="#bfe6b4"/><circle cx="32" cy="54" r="5" fill="#c9b8f2"/>', '#fdf0d5') },
    { id: 'duze-i-male', name: 'Duże i Małe',
      icon: svg('<path d="M4 34L20 18l16 16z" fill="#b9b3e0"/><rect x="7" y="34" width="26" height="20" rx="3" fill="#f6c9b0"/><path d="M38 46l9-9 9 9z" fill="#b9b3e0"/><rect x="40" y="46" width="14" height="8" rx="2" fill="#cfe3f7"/>', '#fdf0d5') },
    { id: 'myjnia', name: 'Myjnia',
      icon: svg('<path d="M10 42Q10 32 22 30L28 20Q31 17 36 17H44Q49 17 52 22L56 30Q60 32 60 42V46H10Z" fill="#f7a8c9"/><circle cx="22" cy="48" r="6" fill="#8a84a8"/><circle cx="48" cy="48" r="6" fill="#8a84a8"/><circle cx="46" cy="10" r="5" fill="#fff" fill-opacity=".8" stroke="#b7deff" stroke-width="2"/><circle cx="54" cy="18" r="3" fill="#fff" fill-opacity=".8" stroke="#b7deff" stroke-width="2"/>', '#d8ecfb') }
  ];
  list.forEach(function (a) { a.mount = placeholder(a); });
  window.ACTIVITIES = list;
})();
