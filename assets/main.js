/* Generaltrade Licencie – základné UI: theme toggle, cookie banner, rok v päte */
(function () {
  // 1) Theme toggle
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  const stored = localStorage.getItem('gt-theme');
  let theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.setAttribute('data-theme', theme);

  function renderIcon() {
    if (!toggle) return;
    toggle.innerHTML = theme === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>';
  }
  renderIcon();
  if (toggle) {
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      localStorage.setItem('gt-theme', theme);
      renderIcon();
    });
  }

  // 2) Year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // 3) Cookie banner – consent-mode style (analytics len so súhlasom)
  const COOKIE_KEY = 'gt-cookie-consent';
  const banner = document.getElementById('cookie-banner');
  const consent = localStorage.getItem(COOKIE_KEY);

  function showBanner() {
    if (banner) banner.hidden = false;
  }
  function hideBanner() {
    if (banner) banner.hidden = true;
  }

  if (!consent) {
    // počkáme, kým doloží zvyšok stránky
    setTimeout(showBanner, 600);
  } else if (consent === 'accept') {
    window.dispatchEvent(new CustomEvent('gt:consent', { detail: 'accept' }));
  }

  document.querySelectorAll('[data-cookie]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const value = e.currentTarget.getAttribute('data-cookie');
      localStorage.setItem(COOKIE_KEY, value);
      hideBanner();
      window.dispatchEvent(new CustomEvent('gt:consent', { detail: value }));
    });
  });

  // Nech používateľ vie cookie nastavenia kedykoľvek zmeniť
  window.openCookieSettings = function () {
    localStorage.removeItem(COOKIE_KEY);
    showBanner();
  };
})();
