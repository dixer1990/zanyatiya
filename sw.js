// Хранит файлы приложения в телефоне, чтобы оно открывалось без интернета.
// Когда интернет есть, тихо скачивает свежую версию — она появится при следующем открытии.
const CACHE = 'uchet-app-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(key, { ignoreSearch: true });
      const fresh = fetch(req).then(res => {
        if (res && res.ok) cache.put(key, res.clone());
        return res;
      }).catch(() => null);
      if (cached) { e.waitUntil(fresh); return cached; }
      return (await fresh) || new Response('Нет сети', { status: 503 });
    })
  );
});
