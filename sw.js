// sw.js - النسخة المحدثة للتنظيف الإجباري للنسخ القديمة
const CACHE_NAME = 'ibn-badis-v2.0';

self.addEventListener('install', (e) => {
    console.log('Service Worker: Installing new version...');
    // تخطي التรอي والتثبيت الفوري للنسخة الجديدة
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    console.log('Service Worker: Activating and cleaning old caches...');
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request)
            .then((networkResponse) => {
                return networkResponse;
            })
            .catch(() => {
                return caches.match(e.request);
            })
    );
});