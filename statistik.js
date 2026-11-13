/* my Event Hub – Besucherzählung (Thomas 13.11.2026). Ohne Cookies, ohne Speicher im Browser, ohne IP-Adresse:
   gesendet werden nur die aufgerufene Seite und die Website, von der man kam. Details: Datenschutzerklärung. */
(function () {
  var W = ''; // Adresse des Statistik-Workers; leer = Zählung aus
  if (!W || !/(^|\.)myeventhub\.de$/i.test(location.hostname) || navigator.webdriver) return;
  try {
    var n = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    var neu = !n || n.type === 'navigate'; // Neuladen und Zurück-Taste zählen nicht als neuer Besuch
    var d = JSON.stringify({ p: location.pathname, r: document.referrer || '', e: neu ? 1 : 0 });
    if (navigator.sendBeacon) navigator.sendBeacon(W + '/h', d);
    else fetch(W + '/h', { method: 'POST', body: d, keepalive: true, mode: 'no-cors' });
  } catch (e) {}
})();
