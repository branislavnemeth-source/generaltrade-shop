/*
  Generaltrade Licencie – Google Analytics 4 (consent-aware)
  --------------------------------------------------------
  GA4 sa načíta až po súhlase používateľa cez cookie banner.
  Reálne Measurement ID nastav v <head> ako window.GA_MEASUREMENT_ID = "G-XXXXXXXXXX";
*/
(function () {
  const ID = window.GA_MEASUREMENT_ID;
  const isPlaceholder = !ID || /XXXXXXXXXX/.test(ID);

  function loadGA(measurementId) {
    if (window.__gtGaLoaded) return;
    window.__gtGaLoaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { anonymize_ip: true });
  }

  function maybeLoad() {
    if (isPlaceholder) return; // bez reálneho ID nič nenačítavame
    const consent = localStorage.getItem('gt-cookie-consent');
    if (consent === 'accept') loadGA(ID);
  }

  // Skús načítať pri štarte (ak je súhlas už uložený)
  maybeLoad();
  // a po kliknutí na "Súhlasím so všetkými"
  window.addEventListener('gt:consent', function (e) {
    if (e.detail === 'accept') maybeLoad();
  });
})();
