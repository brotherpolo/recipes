// Keeps the app itself available offline. Recipe fetches go straight to the network.
const CACHE = "recipe-checklist-v11";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // Network first so updates show up; fall back to the cached copy when offline.
  e.respondWith(
    fetch(new Request(e.request.url, { cache: "no-cache", credentials: "same-origin" })).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(url.pathname.endsWith("/") ? "./" : e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./")))
  );
});
