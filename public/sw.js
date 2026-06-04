// QOAT Service Worker — network-first, offline shell fallback
// Bump CACHE_VERSION on each deploy to force refresh
const CACHE_VERSION = "v1";
const CACHE_NAME = `qoat-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

// ── Install: precache the offline page ───────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)),
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ── Activate: delete stale caches ────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// ── Fetch: network-first, offline fallback for navigation ────────────────────

self.addEventListener("fetch", (event) => {
  // Only handle GET requests from this origin
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Never intercept API routes — they must be fresh
  if (event.request.url.includes("/api/")) return;

  if (event.request.mode === "navigate") {
    // Page navigation: try network, fall back to offline page
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(OFFLINE_URL).then(
          (cached) =>
            cached ??
            new Response("You're offline", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            }),
        ),
      ),
    );
    return;
  }

  // Next.js static assets (_next/static): cache-first after first load
  if (event.request.url.includes("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      }),
    );
  }
});
