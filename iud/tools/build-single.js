#!/usr/bin/env node
/* ------------------------------------------------------------------
 * build-single.js — รวมแอปทั้งหมดให้เหลือไฟล์ HTML ไฟล์เดียว
 *
 *   node iud/tools/build-single.js
 *   → iud/dist/iud-single.html
 *
 * ไฟล์ผลลัพธ์เปิดได้ด้วยการดับเบิลคลิก ส่งทางแชทหรืออัปขึ้น LMS ได้เลย
 * โดยไม่ต้องมีเซิร์ฟเวอร์ (แลกกับการไม่มี service worker จึงไม่มีแคชออฟไลน์
 * แบบอัตโนมัติ แต่ตัวไฟล์อยู่ในเครื่องอยู่แล้วจึงเปิดซ้ำได้เสมอ)
 * ------------------------------------------------------------------ */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const html = read("index.html");
const css = read("assets/css/style.css");
const js = ["assets/js/content.js", "assets/js/diagrams.js", "assets/js/app.js"]
  .map(read)
  .join("\n\n")
  // ไม่มี sw.js ในไฟล์เดี่ยว จึงตัดการลงทะเบียน service worker ออก
  .replace(/\n\s*if \("serviceWorker" in navigator\)[\s\S]*?\n  \}\n/, "\n");

const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
if (!bodyMatch) throw new Error("หา <body> ใน index.html ไม่พบ");
const markup = bodyMatch[1].replace(/\s*<script src="[^"]*"><\/script>/g, "").trim();

const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
const title = titleMatch ? titleMatch[1] : "การใส่ห่วงอนามัย";

const out = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#b3235c">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
<body>
${markup}
<script>
${js}
</script>
</body>
</html>
`;

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
const dest = path.join(root, "dist", "iud-single.html");
fs.writeFileSync(dest, out);
console.log("สร้างไฟล์เดียวเรียบร้อย:", path.relative(process.cwd(), dest),
  "(" + Math.round(out.length / 1024) + " KB)");
