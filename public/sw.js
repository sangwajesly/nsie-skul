// Service Worker for Nsei Sukul Offline Support & Sukul Hub LAN Sync
const STATIC_CACHE = "nsei-static-v4";
const PAGES_CACHE = "nsei-pages-v4";

const PRECACHE_ASSETS = [
  "/offline.html",
  "/icon.svg",
  "/dashboard/academics/marks",
  "/dashboard"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[PWA SW] Pre-cache notice:", err);
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
          if (key !== STATIC_CACHE && key !== PAGES_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. Never intercept local School Hub API calls or local Wi-Fi IP calls
  if (
    url.pathname.startsWith("/api/v1/hub/") ||
    url.hostname.startsWith("192.168.") ||
    url.hostname.startsWith("10.") ||
    url.hostname.endsWith(".local")
  ) {
    return; // Pass through to local LAN router directly
  }

  // 2. Cache-First / Stale-While-Revalidate for Next.js Static Assets & Chunks (_next/static/**)
  // This is what makes the React App load and hydrate offline!
  if (url.pathname.startsWith("/_next/static/") || url.pathname.match(/\.(svg|png|jpg|jpeg|webp|woff2?|ico|css|js)$/i)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          // Revalidate in background if online
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
          }).catch(() => {});
          return cachedResponse;
        }

        // Not in cache, fetch from network and store
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          return new Response("", { status: 404 });
        });
      })
    );
    return;
  }

  // 3. For all API calls, skip cache
  if (url.pathname.startsWith("/api/")) return;

  // 4. HTML Navigation Requests (Network-First with Cache Fallback)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(PAGES_CACHE).then((cache) => {
              cache.put(event.request, copy);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // When offline: check if specific page is in cache
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;

          // Check if marks page is cached
          const marksCached = await caches.match("/dashboard/academics/marks");
          if (marksCached && url.pathname.includes("/marks")) return marksCached;

          const dashboardCached = await caches.match("/dashboard");
          if (dashboardCached && url.pathname.startsWith("/dashboard")) return dashboardCached;

          // Fallback to offline.html
          const fallback = await caches.match("/offline.html");
          if (fallback) return fallback;

          return new Response("Application is offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        })
    );
    return;
  }
});
