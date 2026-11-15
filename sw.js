const CACHE_NAME = 'polyglot-pdf-reader-v3';

self.addEventListener('install', (event) => {
  const scope = self.registration.scope;
  const precacheUrls = [
    scope,
    new URL('index.html', scope).href,
    new URL('manifest.json', scope).href,
    new URL('favicon.svg', scope).href,
    new URL('icon-192.png', scope).href,
    new URL('icon-512.png', scope).href,
  ];

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(precacheUrls);
    }).catch((err) => {
      console.warn('Pre-cache warning:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Vite開発サーバー内部リクエスト、WebSocket、拡張機能等はSWキャッシュ対象外
  if (
    event.request.method !== 'GET' ||
    url.pathname.includes('/@vite') ||
    url.pathname.includes('/@fs') ||
    url.pathname.includes('/__vite') ||
    url.pathname.startsWith('/@') ||
    url.protocol.startsWith('ws') ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  const scope = self.registration.scope;
  const indexUrl = new URL('index.html', scope).href;

  // ナビゲーション（HTMLリクエスト）：ネットワーク優先、オフライン時はキャッシュされたindex.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(indexUrl) || caches.match(scope))
    );
    return;
  }

  // 静的アセット：ネットワーク優先、オフライン時はキャッシュからフォールバック
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
