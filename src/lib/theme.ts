(function () {
  var stored = null;
  try { stored = localStorage.getItem('mjh-theme'); } catch (e) { /* ignore */ }
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
  if (theme === 'dark') document.documentElement.classList.add('dark');
  window.__mjhTheme = theme;
})();

