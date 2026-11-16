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
  // Klicks (Thomas 16.11.2026): Reiter und Links, nur Sammelname bzw. Website + Pfad ohne ?…, keine Personendaten
  function ziel(el) {
    var t = el.closest && el.closest('[data-tab],a[href]'); if (!t) return '';
    if (t.hasAttribute('data-tab')) return 'Reiter: ' + t.getAttribute('data-tab');
    var h = t.getAttribute('href') || '', u;
    if (/^webcal:|\.ics(\?|$)/i.test(h)) return 'Kalender-Datei (iPhone/Outlook)';
    if (/^mailto:/i.test(h)) return 'E-Mail-Link';
    if (/^tel:/i.test(h)) return 'Telefon-Link';
    try { u = new URL(h, location.href); } catch (x) { return ''; }
    if (!/^https?:$/.test(u.protocol)) return '';
    var host = u.hostname.replace(/^www\./, '');
    if (/(^|\.)myeventhub\.de$/i.test(host)) return ''; // eigene Seiten zählen als Seitenaufruf
    if (/google\.[a-z.]+$/.test(host) && /^\/maps/.test(u.pathname)) return 'Google Maps';
    if (/^calendar\.google\./.test(host) || (/google\.[a-z.]+$/.test(host) && /^\/calendar/.test(u.pathname))) return 'Google Kalender';
    if (/(^|\.)(wa\.me|whatsapp\.com)$/.test(host)) return 'WhatsApp';
    if (/(^|\.)outlook\.(live|office)\.com$/.test(host)) return 'Outlook-Kalender';
    return (host + u.pathname).slice(0, 160);
  }
  document.addEventListener('click', function (ev) {
    try {
      var z = ziel(ev.target); if (!z) return;
      var d = JSON.stringify({ k: z, p: location.pathname });
      if (navigator.sendBeacon) navigator.sendBeacon(W + '/h', d);
      else fetch(W + '/h', { method: 'POST', body: d, keepalive: true, mode: 'no-cors' });
    } catch (x) {}
  }, true);
})();
