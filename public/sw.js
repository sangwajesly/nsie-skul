// Service Worker for Nsei Sukul Offline Support
const CACHE_NAME = "nsei-sukul-v3";
const OFFLINE_URLS = [
  "/dashboard",
  "/dashboard/students",
  "/dashboard/academics/marks",
  "/dashboard/finance",
  "/offline.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn("PWA pre-cache non-fatal error:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-first with cache fallback strategy
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip chrome-extension, API calls that shouldn't be cached, or external domains
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses for critical pages
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Return cached page when offline
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        // If HTML navigation, return offline fallback page
        if (event.request.mode === "navigate") {
          const fallback = await caches.match("/offline.html");
          if (fallback) return fallback;
        }

        return new Response("Network offline", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({ "Content-Type": "text/plain" }),
        });
      })
  );
});
