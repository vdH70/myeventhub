// Thomas 06.11.2026 (PageSpeed): Die fertige erste Ansicht in index.html gilt nur an ihrem Erstellungstag.
// An allen anderen Tagen lud die Startseite sofort den ganzen Katalog (daten/katalog.js, ~12 MB / 2 MB gzip)
// -> PageSpeed Handy ~47 statt ~98. Dieses Skript erneuert die erste Ansicht für den heutigen Tag (deutsche Zeit),
// ohne den Katalog oder sonst etwas zu ändern. Läuft täglich kurz nach Mitternacht per GitHub Actions
// (.github/workflows/vorschau-taeglich.yml) und kostet kein Claude-Kontingent.
// Aufruf: node tools/vorschau-taeglich.js <Ordner mit index.html> [JJJJ-MM-TT]
// Sicherheitsprüfungen: (1) Mit dem alten Datum muss das Hauptskript genau die vorhandene Ansicht bauen,
// sonst bricht es ab (index.html bleibt unverändert). (2) Nach dem Tausch wird die neue Datei mit dem neuen
// Datum geprüft: Vorschau wird gezeigt und das Hauptskript baut genau dieselbe Ansicht.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const IDS = ['stand', 'ranges', 'cats', 'cityfilter', 'resultcount', 'list'];
const berlinToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());

(async () => {
  const dir = path.resolve(process.argv[2] || '.'), f = path.join(dir, 'index.html');
  const want = process.argv[3] || berlinToday();
  const s = fs.readFileSync(f, 'utf8');
  const m = s.match(/<script type="application\/json" id="ezpre">\{"d":"(\d{4}-\d\d-\d\d)"\}<\/script>/);
  if (!m || !s.includes('id="ezmain"')) { console.log('Vorschau: keine erste Ansicht in index.html, nichts zu tun'); return; }
  const old = m[1];
  if (old === want) { console.log('Vorschau: schon aktuell (' + want + ')'); return; }
  const b = await chromium.launch();
  // Seite mit festem Datum (12:00 deutsche Zeit) öffnen; force = Termindaten sofort laden und Hauptskript ausführen
  const grab = async (file, day, force) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, timezoneId: 'Europe/Berlin', locale: 'de-DE' });
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.clock.setFixedTime(new Date(day + 'T12:00:00+01:00'));
    await p.addInitScript(([ids, force]) => {
      const snap = () => { const o = {}; ids.forEach(id => { const e = document.getElementById(id); o[id] = e ? e.innerHTML : null; }); return o; };
      if (force) { window.__ezForce = true; document.addEventListener('ez-main-done', () => { window.__built = snap(); }, { once: true }); }
      document.addEventListener('DOMContentLoaded', () => { window.__dcl = { h: snap(), pre: !!window.__ezpreShown }; }, { once: true });
    }, [IDS, force]);
    await p.goto('file://' + file + '?' + Date.now());
    await p.waitForFunction(f => f ? window.__built : window.__dcl, force, { timeout: 120000 });
    const r = await p.evaluate(() => ({ dcl: window.__dcl, built: window.__built || null }));
    await c.close(); if (errs.length) throw new Error('JS-Fehler: ' + errs[0]); return r;
  };
  const tmp = path.join(dir, '.vorschau-neu.html');
  try {
    // (1) alte Ansicht so, wie sie im HTML steht, und Gegenprobe mit altem Datum
    const a = await grab(f, old, true);
    if (!a.dcl.pre) throw new Error('alte Vorschau wird am ' + old + ' nicht gezeigt');
    const diff1 = IDS.filter(id => a.built[id] !== a.dcl.h[id]);
    if (diff1.length) throw new Error('Gegenprobe alt: Hauptskript baut andere Ansicht (' + diff1.join(',') + ')');
    // neue Ansicht für den gewünschten Tag
    const n = await grab(f, want, true);
    for (const id of IDS) if (n.built[id] == null || (!n.built[id] && id !== 'resultcount')) throw new Error('leer: ' + id);
    if (!/<details class="ev|class="ezhint"/.test(n.built.list)) throw new Error('weder Termine noch Hinweis in der Liste');
    let s2 = s;
    for (const id of IDS) {
      const o = a.dcl.h[id], k = s2.split(o).length - 1;
      const open = new RegExp('id="' + id + '"[^>]*>');
      const mm = s2.match(new RegExp('id="' + id + '"[^>]*>'));
      if (!mm) throw new Error('Ziel fehlt: ' + id);
      const at = mm.index + mm[0].length;
      if (s2.substr(at, o.length) !== o) throw new Error('alte Ansicht nicht zeichengleich im HTML: ' + id + ' (' + k + ')');
      s2 = s2.slice(0, at) + n.built[id] + s2.slice(at + o.length);
    }
    const rx = new RegExp('(\\{"d":"|t===")' + old + '"', 'g');
    const cnt = (s2.match(rx) || []).length;
    if (cnt !== 2) throw new Error('Datumsstellen: ' + cnt + ' statt 2');
    s2 = s2.replace(rx, '$1' + want + '"');
    fs.writeFileSync(tmp, s2);
    // (2) Prüfung der neuen Datei
    const v = await grab(tmp, want, true);
    const diff2 = IDS.filter(id => v.built[id] !== n.built[id] || v.dcl.h[id] !== n.built[id]);
    if (!v.dcl.pre || diff2.length) throw new Error('Prüfung neu: ' + (!v.dcl.pre ? 'Vorschau nicht gezeigt' : 'anders: ' + diff2.join(',')));
    fs.renameSync(tmp, f);
    console.log('Vorschau erneuert: ' + old + ' -> ' + want);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch (_) {}
    console.log('Vorschau NICHT erneuert: ' + e.message); process.exitCode = 1;
  }
  await b.close();
})();
