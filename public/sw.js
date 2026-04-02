const CACHE_NAME = 'teeup-pwa-v1';
const CORE_ASSETS = [
    '/manifest.json',
    '/app',
    '/icons/icon-192.png',
    '/icons/icon-256.png',
    '/icons/icon-512.png',
    '/icons/icon-600-full.png',
    '/icons/icon-600-transparent-full.png',
    '/icons/icon-800-maskable.png',
    '/image/main1.png',
    '/image/main2.png',
    '/image/main3.png',
    '/image/main4.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(CORE_ASSETS);
            await self.skipWaiting();
        })()
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            );
            await self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) {
        return;
    }
    if (requestUrl.pathname === '/api' || requestUrl.pathname.startsWith('/api/')) {
        return;
    }

    const accept = event.request.headers.get('accept') || '';
    const isDocumentRequest = accept.includes('text/html');

    if (isDocumentRequest) {
        event.respondWith(
            (async () => {
                try {
                    const networkResponse = await fetch(event.request);
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                } catch (error) {
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    throw error;
                }
            })()
        );
        return;
    }

    event.respondWith(
        (async () => {
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }

            const networkResponse = await fetch(event.request);
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, networkResponse.clone());
            return networkResponse;
        })()
    );
});
