const CACHE_NAME = 'quickscout-pwa-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './libs/jspdf.umd.min.js',
  './libs/jspdf.plugin.autotable.min.js',
  './assets/images/app_icon.png',
  './assets/images/app_icon_192.png',
  './assets/images/app_icon_512.png',
  './assets/images/bkg_sost.png',
  './assets/images/btn_menu.png',
  './assets/images/btn_report_large.png',
  './assets/images/errore_avversari.png',
  './assets/images/punto_avversari.png',
  './assets/images/possesso_palla.png',
  './assets/images/timeout_0.png',
  './assets/images/timeout_1.png',
  './assets/images/timeout_2.png',
  './assets/images/totale_ruota_5.png',
  './assets/images/linee_cerchio.png',
  './assets/images/icona_battuta.png',
  './assets/images/icona_ricezione.png',
  './assets/images/icona_alzata.png',
  './assets/images/icona_attacco.png',
  './assets/images/icona_muro.png',
  './assets/images/icona_difesa.png',
  './assets/images/icona_alzata_report.png',
  './assets/images/icona_attacco_report.png',
  './assets/images/icona_battuta_report.png',
  './assets/images/icona_difesa_report.png',
  './assets/images/icona_muro_report.png',
  './assets/images/icona_ricezione_report.png',
  './assets/images/punto_grafico_alzata_stampa.png',
  './assets/images/punto_grafico_attacco_stampa.png',
  './assets/images/punto_grafico_battuta_stampa.png',
  './assets/images/punto_grafico_difesa_stampa.png',
  './assets/images/punto_grafico_muro_stampa.png',
  './assets/images/punto_grafico_ricezione_stampa.png',
  './assets/images/logo_pdf.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback offline
        return caches.match('./index.html');
      });
    })
  );
});
