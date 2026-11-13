/* my Event Hub – Besucherzahl (Thomas 13.11.2026). Ohne Cookies, ohne Speicher im Browser, ohne IP-Adresse:
   gesendet wird nur, ob es ein neuer Besuch ist (von außen gekommen) oder eine weitere Seite. Details: Datenschutzerklärung. */
(function () {
  var W = ''; // Adresse des Statistik-Workers; leer = Zählung aus
  if (!W || !/(^|\.)myeventhub\.de$/i.test(location.hostname) || navigator.webdriver) return;
  try {
    var n = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    var intern = /^https?:\/\/([a-z0-9-]+\.)?myeventhub\.de(\/|$)/i.test(document.referrer || '');
    var neu = (!n || n.type === 'navigate') && !intern; // Neuladen, Zurück-Taste und Klicks innerhalb der Seite = kein neuer Besuch
    var d = JSON.stringify({ e: neu ? 1 : 0 });
    if (navigator.sendBeacon) navigator.sendBeacon(W + '/h', d);
    else fetch(W + '/h', { method: 'POST', body: d, keepalive: true, mode: 'no-cors' });
  } catch (e) {}
})();
