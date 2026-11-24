/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

// Works at "/" or under a sub-path such as GitHub Pages' "/civicxindo/".
const SCOPE = new URL(self.registration.scope).pathname;

// App shell, fonts and icons.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation: serve the precached shell for every in-app route.
registerRoute(new NavigationRoute(createHandlerBoundToURL(SCOPE + "index.html"), { denylist: [/^\/api\//, /\.[a-z0-9]+$/i] }));

// Scheme lists and details: show cached data instantly, refresh in the background.
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/schemes") || url.pathname.startsWith("/data/"),
  new StaleWhileRevalidate({ cacheName: "cx-schemes", plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 86400 })] }),
);

// Application status must be fresh when online, cached as fallback when offline.
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/applications") || url.pathname.startsWith("/api/status"),
  new NetworkFirst({ cacheName: "cx-status", networkTimeoutSeconds: 4, plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })] }),
);

// Images and lazily-loaded chunks: cache first.
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({ cacheName: "cx-images", plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 30 * 86400 })] }),
);
registerRoute(
  ({ request, url }) => request.destination === "script" && url.pathname.startsWith(SCOPE + "assets/"),
  new CacheFirst({ cacheName: "cx-chunks", plugins: [new ExpirationPlugin({ maxEntries: 60 })] }),
);

// Branded offline fallback.
setCatchHandler(async ({ request }) => {
  if (request.destination === "document") return (await matchPrecache(SCOPE + "offline.html")) ?? Response.error();
  return Response.error();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// Background Sync: wake open windows to send queued submissions (data lives in IndexedDB owned by the app).
self.addEventListener("sync", (event: Event) => {
  const e = event as Event & { tag: string; waitUntil(p: Promise<unknown>): void };
  if (e.tag === "cx-queue") {
    e.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => clients.forEach((c) => c.postMessage({ type: "FLUSH_QUEUE" }))),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || SCOPE + "track";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const c = clients[0] as WindowClient | undefined;
      if (c) {
        c.navigate(link).catch(() => undefined);
        return c.focus();
      }
      return self.clients.openWindow(link);
    }),
  );
});
