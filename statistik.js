/* my Event Hub – Besucherzahl (Thomas 13.11.2026). Ohne Cookies, ohne Speicher im Browser, ohne IP-Adresse:
   gesendet werden nur die aufgerufene Seite, ob es ein neuer Besuch ist und bei neuen Besuchen der Name der Website, von der man kam. Details: Datenschutzerklärung. */
(function () {
  var W = 'https://myeventhub-statistik.patient-disk-2848.workers.dev'; // Adresse des Statistik-Workers; leer = Zählung aus
  if (!W || !/(^|\.)myeventhub\.de$/i.test(location.hostname) || navigator.webdriver) return;
  try {
    var n = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    var intern = /^https?:\/\/([a-z0-9-]+\.)?myeventhub\.de(\/|$)/i.test(document.referrer || '');
    var neu = (!n || n.type === 'navigate') && !intern; // Neuladen, Zurück-Taste und Klicks innerhalb der Seite = kein neuer Besuch
    var rh = ''; try { rh = document.referrer && !intern ? new URL(document.referrer).hostname : ''; } catch (x) {}
    var d = JSON.stringify({ e: neu ? 1 : 0, p: location.pathname, r: neu ? rh : '' }); // nur Seite + Name der Herkunfts-Website, nie die volle Adresse
    if (navigator.sendBeacon) navigator.sendBeacon(W + '/h', d);
    else fetch(W + '/h', { method: 'POST', body: d, keepalive: true, mode: 'no-cors' });
  } catch (e) {}
})();
