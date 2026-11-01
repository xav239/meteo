// Service worker : l'appli s'ouvre hors connexion et affiche la dernière météo reçue.
// Changer VERSION à chaque mise à jour de l'appli pour forcer le rechargement.
const VERSION = "v1";
const SHELL = `shell-${VERSION}`;
const DATA = "meteo-data";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("shell-") && k !== SHELL).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.hostname.endsWith("open-meteo.com")) {
    // Météo : réseau d'abord, dernière réponse en secours
    e.respondWith(fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(DATA).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request)));
  } else if (url.origin === location.origin) {
    // Appli : réseau d'abord pour avoir les mises à jour, cache si hors ligne
    e.respondWith(fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(SHELL).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request)));
  }
});
