const CACHE_NAME = 'pwa-cache-v1';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png',
    './icons/apple-touch-icon.png',
    './imagenes/carrusel/foto1.jpg',
    './imagenes/carrusel/foto2.jpg',
    './imagenes/carrusel/foto3.jpg',
    './imagenes/juegos/Call of duty.jpeg',
    './imagenes/juegos/Efootball.jpg',
    './imagenes/juegos/Left-4-dead1.webp',
    './imagenes/juegos/Mortal Kombat.jpg',
    './imagenes/juegos/left 4 dead 2.jpeg',
    './imagenes/juegos/resident evil.jpg',
    './imagenes/logos/facebook.webp',
    './imagenes/logos/github.jpg',
    './imagenes/logos/instagram.png',
    './imagenes/musica/musica1.jpg',
    './imagenes/musica/musica2.jpg',
    './imagenes/musica/musica3.jpg',
    './imagenes/musica/musica4.jpg'
];

const EXTERNAL_ASSETS = [
    'https://code.jquery.com/jquery-3.7.1.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap'
];

const EXTERNAL_HOSTS = [
    'code.jquery.com',
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            await cache.addAll(ASSETS_TO_CACHE.map(encodeURI));
            await Promise.all(
                EXTERNAL_ASSETS.map(async url => {
                    try {
                        const response = await fetch(new Request(url, { mode: 'no-cors' }));
                        await cache.put(url, response);
                    } catch (error) {
                        return;
                    }
                })
            );
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(names => Promise.all(
                names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
    }
    return response;
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;

        if (request.mode === 'navigate') {
            const home = await caches.match('./index.html');
            if (home) return home;
        }

        return new Response('Sin conexión', { status: 503, statusText: 'Sin conexión' });
    }
}

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (request.headers.has('range') || /\.(mp3|ogg|wav|m4a)$/i.test(url.pathname)) return;

    if (url.origin === self.location.origin) {
        if (request.destination === 'image') {
            event.respondWith(cacheFirst(request));
        } else {
            event.respondWith(networkFirst(request));
        }
        return;
    }

    if (EXTERNAL_HOSTS.includes(url.hostname)) {
        event.respondWith(cacheFirst(request));
    }
});
