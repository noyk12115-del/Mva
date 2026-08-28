/* Service worker — ใช้งานออฟไลน์ได้ และรับเนื้อหาใหม่อัตโนมัติเมื่อมีการอัปเดต
   กลยุทธ์: stale-while-revalidate — คืนไฟล์จากแคชทันทีเพื่อความเร็ว
   แล้วดึงตัวใหม่มาเก็บไว้เบื้องหลัง ผู้ใช้จะได้เวอร์ชันใหม่ในการเปิดครั้งถัดไป */
var CACHE = "mva-trainer-v2";
var ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./assets/css/style.css", "./assets/js/app.js",
  "./assets/js/data/lessons.js", "./assets/js/data/checklist.js", "./assets/js/data/quiz.js",
  "./assets/js/data/cases.js", "./assets/js/data/reference.js",
  "./assets/icons/icon.svg", "./assets/icons/icon-192.png", "./assets/icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return Promise.all(ASSETS.map(function (u) { return c.add(u).catch(function () {}); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;          /* ไม่ยุ่งกับปลายทางภายนอก */
  if (req.headers.get("range")) return;                      /* ปล่อยคำขอแบบช่วงข้อมูลไปตามปกติ */

  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone());
          return res;
        }).catch(function () { return null; });

        if (hit) return hit;                                 /* มีในแคช คืนทันที แล้วอัปเดตเบื้องหลัง */
        return net.then(function (res) {
          if (res) return res;
          if (req.mode === "navigate") return cache.match("./index.html");
          return new Response("ออฟไลน์และไม่มีไฟล์นี้ในแคช", {
            status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        });
      });
    })
  );
});
