const CACHE = 'pm-v3';
const TILES = 'pm-tiles-v1';
const CORE = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  'vendor/ol.js',
  'vendor/ol.css',
  'data/prime.json',
  'data/humble.json',
  'data/selenea.json',
  'data/aqualis.json',
  'data/toxicity.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE && k !== TILES).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

async function trimTiles() {
  const cache = await caches.open(TILES);
  const keys = await cache.keys();
  if (keys.length <= 1200) return;
  for (let i = 0; i < keys.length - 1000; i++) await cache.delete(keys[i]);
}

async function tileResponse(req) {
  const cache = await caches.open(TILES);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && (res.ok || res.type === 'opaque')) {
      cache.put(req, res.clone()).then(trimTiles).catch(() => {});
    }
    return res;
  } catch (err) {
    return hit || Response.error();
  }
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  const tileHost = url.hostname === 'map.fistshake.net' ||
    url.hostname === 'wsrv.nl' || url.hostname === 'images.weserv.nl';
  if (tileHost && decodeURIComponent(url.href).indexOf('/Tiles/') >= 0) {
    e.respondWith(tileResponse(e.request));
    return;
  }

  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res && res.ok) {
          const cp = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, cp)).catch(() => {});
        }
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('./');
        return Response.error();
      });
    })
  );
});
