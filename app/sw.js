/* BloomGoal Coach — Hintergrunddienst (Service Worker)
   © 2026 Maria Schmidt · bloomgoal.de

   Aufgabe: Die App soll auch ohne Internetverbindung starten.

   Wichtige Entscheidung: Es wird IMMER zuerst das Netz gefragt und erst
   bei Misserfolg der Zwischenspeicher benutzt. Andersherum wäre schneller,
   aber dann würden deine Nutzer eine alte Fassung behalten, nachdem du
   eine neue hochgeladen hast. Das ist der häufigste Fehler bei
   Hintergrunddiensten und wäre hier besonders ärgerlich.

   Nach jeder neuen Fassung der App die Zahl in VERSION erhöhen.
*/

const VERSION = 1;
const CACHE   = 'bloomgoal-v' + VERSION;

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

/* Beim Einrichten alles einzeln ablegen. Einzeln deshalb, weil ein
   fehlendes Symbol sonst den gesamten Vorgang scheitern ließe. */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

/* Alte Zwischenspeicher aufräumen, sobald eine neue Fassung übernimmt. */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(namen => Promise.all(
        namen.filter(n => n !== CACHE).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const anfrage = e.request;

  /* Nur einfache Abrufe behandeln, und nichts von fremden Servern. */
  if (anfrage.method !== 'GET') return;
  if (new URL(anfrage.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(anfrage)
      .then(antwort => {
        /* Erfolgreiche Antworten für den Notfall mitschreiben. */
        if (antwort && antwort.status === 200 && antwort.type === 'basic') {
          const kopie = antwort.clone();
          caches.open(CACHE).then(c => c.put(anfrage, kopie)).catch(() => {});
        }
        return antwort;
      })
      .catch(() =>
        caches.match(anfrage).then(treffer => treffer || caches.match('./index.html'))
      )
  );
});
