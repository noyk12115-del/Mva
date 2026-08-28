/* Service worker — ทำให้แอปเปิดใช้งานได้แม้ออฟไลน์ */
var CACHE = "mva-trainer-v1";
var ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./assets/css/style.css", "./assets/js/app.js",
  "./assets/js/data/lessons.js", "./assets/js/data/checklist.js", "./assets/js/data/quiz.js",
  "./assets/js/data/cases.js", "./assets/js/data/reference.js",
  "./assets/icons/icon.svg", "./assets/icons/icon-192.png", "./assets/icons/icon-512.png"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
        return res;
      }).catch(function () { return caches.match("./index.html"); });
    })
  );
});
