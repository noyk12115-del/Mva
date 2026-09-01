/* service worker — แคชแบบ cache-first เพื่อให้เปิดใช้ได้เมื่อไม่มีสัญญาณ */
const CACHE = "iud-app-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/css/style.css",
  "./assets/js/content.js",
  "./assets/js/diagrams.js",
  "./assets/js/app.js",
  "./assets/img/icon.svg",
  "./assets/img/icon-192.png",
  "./assets/img/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(ASSETS.map((a) => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      // ลบเฉพาะแคชรุ่นเก่าของแอปนี้ — บน origin เดียวกันมีแอปอื่นอยู่ด้วย
      .then((ks) => Promise.all(
        ks.filter((k) => k !== CACHE && k.indexOf("iud-app-") === 0).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        // แคชเฉพาะไฟล์ของแอปเองและฟอนต์ที่โหลดสำเร็จ
        if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
