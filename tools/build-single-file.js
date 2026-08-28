/* รวมทุกไฟล์ของแอปเป็น HTML ไฟล์เดียว
   ใช้สำหรับเผยแพร่เป็น Artifact หรือส่งไฟล์เดียวให้เปิดได้ทันที
   วิธีใช้: node tools/build-single-file.js */
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var read = function (p) { return fs.readFileSync(path.join(root, p), "utf8"); };

var css = read("assets/css/style.css");
var html = read("index.html");
var scripts = [
  "assets/js/data/lessons.js", "assets/js/data/checklist.js", "assets/js/data/quiz.js",
  "assets/js/data/cases.js", "assets/js/data/reference.js", "assets/js/app.js"
].map(read).join("\n\n");

/* ตัดการลงทะเบียน service worker ออก เพราะไฟล์เดียวไม่มี sw.js ให้โหลด */
scripts = scripts.replace(
  /\n\s*if \("serviceWorker" in navigator[\s\S]*?\n\s*\}\n/,
  "\n"
);

/* ดึงเฉพาะเนื้อหาในส่วน body และตัดแท็กที่อ้างไฟล์ภายนอกออก */
var body = html.split("<body>")[1].split("</body>")[0]
  .replace(/\s*<script src="[^"]*"><\/script>/g, "")
  .trim();

var title = "MVA Trainer";

/* ฟอนต์อยู่ท้ายไฟล์โดยตั้งใจ — สไตล์ชีตที่ยังโหลดไม่เสร็จจะบล็อกการรันสคริปต์ที่อยู่ถัดจากมัน
   ถ้าวางไว้ด้านบนแล้วเครือข่ายช้าหรือเข้าโฮสต์ฟอนต์ไม่ได้ ผู้ใช้จะเห็นหน้าว่างจนกว่าจะหมดเวลา
   วางไว้ท้ายสุดทำให้แอปทำงานทันทีด้วยฟอนต์ของเครื่อง แล้วค่อยเปลี่ยนเป็นฟอนต์ที่โหลดมาได้ภายหลัง */
var out = [
  '<meta charset="utf-8">',
  "<title>" + title + "</title>",
  "<style>",
  css,
  "</style>",
  body,
  "<script>",
  scripts,
  "<\/script>",
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700;800&display=swap">'
].join("\n");

var dest = path.join(root, "dist", "mva-trainer.html");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out, "utf8");
console.log("เขียนไฟล์แล้ว: dist/mva-trainer.html  (" + (out.length / 1024).toFixed(0) + " KB)");
if (/<script src=/.test(out)) throw new Error("ยังมีการอ้างไฟล์ภายนอกหลงเหลือ");
if (/serviceWorker/.test(out)) throw new Error("ยังมีการลงทะเบียน service worker หลงเหลือ");
