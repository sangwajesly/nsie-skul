// Service Worker for Nsei Sukul Offline Support & Sukul Hub LAN Sync
const STATIC_CACHE = "nsei-static-v6";
const PAGES_CACHE = "nsei-pages-v6";

// Essential standalone assets pre-cached on service worker install
const PRECACHE_ASSETS = [
  "/offline.html",
  "/icon.svg",
  "/login"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[PWA SW] Pre-cache warning:", err);
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

  // 0. Only cache standard http/https schemes (ignore chrome-extension:, moz-extension:, etc.)
  if (!url.protocol.startsWith("http")) return;

  // 1. Never intercept local School Hub API calls, LAN IP calls, or dynamic manifests
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/manifest.webmanifest" ||
    url.hostname.startsWith("192.168.") ||
    url.hostname.startsWith("10.") ||
    url.hostname.endsWith(".local")
  ) {
    return; // Pass through to server directly
  }

  // 2. Cache-First / Stale-While-Revalidate for Next.js Static Assets & Chunks (_next/static/**)
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

  // 3. Next.js React Server Component (RSC) requests when navigating client-side
  if (url.searchParams.has("_rsc") || event.request.headers.get("RSC") === "1") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Return 503 to signal Next.js router to fallback to full browser navigation (which will hit offline.html or cached HTML)
        return new Response(null, { status: 503, statusText: "Offline" });
      })
    );
    return;
  }

  // 4. For all other API calls, skip cache
  if (url.pathname.startsWith("/api/")) return;

  // 5. HTML Navigation Requests (Network-First with Cache Fallback)
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
          // When offline: check if specific requested page is in cache
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;

          // Check if marks page is cached
          const marksCached = await caches.match("/dashboard/academics/marks");
          if (marksCached && url.pathname.includes("/marks")) return marksCached;

          const dashboardCached = await caches.match("/dashboard");
          if (dashboardCached && url.pathname.startsWith("/dashboard")) return dashboardCached;

          // Fallback to offline interactive workspace shell
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
