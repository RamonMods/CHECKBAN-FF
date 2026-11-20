/* --- Service worker do CheckBan (PWA): cache dos assets estáticos. --- */
const CACHE = "checkban-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./checkban/",
  "./checkban/index.html",
  "./styles.css",
  "./site.css",
  "./checkban/checkban.css",
  "./app.js",
  "./checkban/checkban.js",
  "./manifest.json",
  "./assets/favicon.svg",
  "./assets/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // API: sempre rede
  if (url.pathname.startsWith("/checkban") && url.searchParams.has("uid")) {
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        if (resp.ok && url.origin === self.location.origin) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
