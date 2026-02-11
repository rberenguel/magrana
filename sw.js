const CACHE_NAME = "magrana-cache-v0.1.4";
const CACHE_FILES = [
  "./dict/dictionary.json",
  "./favicon.ico",
  "./fonts/InterDisplay-Bold.woff2",
  "./fonts/InterDisplay-Italic.woff2",
  "./fonts/InterDisplay-Regular.woff2",
  "./fonts/iconoir/iconoir.css",
  "./fonts/iconoir/iconoir.woff2",
  "./fonts/inter.css",
  "./game.js",
  "./haptic.js",
  "./icon.png",
  "./index.html",
  "./manifest.json",
  "./style.css",
  "./trophies.js",
];

// Install event: opens a cache and adds the core files to it.
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log("Cache opened. Caching files...");

        for (const url of CACHE_FILES) {
          try {
            await cache.add(url);
          } catch (error) {
            console.error(`Failed to cache: ${url}`, error);
            // If one file fails, you might want the whole installation to fail.
            // Re-throwing the error will cause the service worker installation to fail.
            throw error;
          }
        }

        console.log("All files cached successfully.");
        // Activate immediately, don't wait for tabs to close
        return self.skipWaiting();
      } catch (error) {
        console.error("Service worker installation failed:", error);
      }
    })(),
  );
});

// Fetch event: serves assets from cache if available, otherwise fetches from network.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request);
    }),
  );
});

// Activate event: cleans up old caches.
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      ).then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      });
    }),
  );
});
