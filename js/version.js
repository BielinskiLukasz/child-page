// The one place the application version is defined (keep CHANGELOG.md and the README version line in step).
// Shown only in the parent-gated Settings, never in the menu or in activities.
(function () {
  window.APP_VERSION = '1.0.0';
  var el = document.getElementById('app-version');
  if (el) el.textContent = 'Wersja ' + window.APP_VERSION;
})();
