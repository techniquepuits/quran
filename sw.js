self.addEventListener('install', (e) => {
    console.log('Service Worker: Installed');
});

self.addEventListener('activate', (e) => {
    console.log('Service Worker: Activated');
});

self.addEventListener('fetch', (e) => {
    // تمرير الطلبات بشكل طبيعي عبر الشبكة
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});