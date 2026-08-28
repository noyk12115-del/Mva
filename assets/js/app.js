/* MVA Trainer — ตัวควบคุมแอปทั้งหมด (ไม่พึ่งไลบรารีภายนอก ทำงานออฟไลน์ได้) */
(function () {
  "use strict";
  var D = window.MVA;
  var KEY = "mva-trainer-v1";

  /* ---------- state ---------- */
  function defaults() {
    return { read: {}, quiz: { seen: {}, wrong: {}, best: 0, attempts: [] },
             checklist: { scores: {}, attempts: [], meta: { student: "", rater: "", date: "" } },
             cards: {}, cases: {}, theme: null, hideInstall: 0 };
  }
  var S = (function () {
    var d = defaults(), o = {};
    try { o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { o = {}; }
    var st = Object.assign(d, o);
    /* ทำให้โครงสร้างย่อยสมบูรณ์เสมอ แม้ข้อมูลเดิมจะไม่มีคีย์เหล่านี้ */
    st.read = st.read && typeof st.read === "object" ? st.read : {};
    st.cards = st.cards && typeof st.cards === "object" ? st.cards : {};
    st.cases = st.cases && typeof st.cases === "object" ? st.cases : {};
    st.quiz = Object.assign({ seen: {}, wrong: {}, best: 0, attempts: [] }, st.quiz || {});
    if (!Array.isArray(st.quiz.attempts)) st.quiz.attempts = [];
    st.checklist = Object.assign({ scores: {}, attempts: [], meta: {} }, st.checklist || {});
    if (!Array.isArray(st.checklist.attempts)) st.checklist.attempts = [];
    st.checklist.meta = Object.assign({ student: "", rater: "", date: "" }, st.checklist.meta || {});
    return st;
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(id) { return document.getElementById(id); }
  function on(sel, ev, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (n) { n.addEventListener(ev, fn); });
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }
  function todayStr() {
    var d = new Date();
    return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) +
           " " + d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  }
  function topicName(t) {
    var l = D.lessons.filter(function (x) { return x.id === t; })[0];
    return l ? l.title : t;
  }

  /* ---------- content block renderer ---------- */
  function block(b) {
    if (typeof b === "string") return "<p>" + esc(b) + "</p>";
    if (b.ul) return "<ul>" + b.ul.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    if (b.ol) return "<ol>" + b.ol.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>";
    if (b.warn) return '<div class="note warn"><b>⚠️ ข้อควรระวัง</b>' + esc(b.warn) + "</div>";
    if (b.tip) return '<div class="note tip"><b>💡 เคล็ดลับสอบ</b>' + esc(b.tip) + "</div>";
    if (b.kv) return '<div class="kv">' + b.kv.map(function (r) {
      return "<div><span>" + esc(r[0]) + "</span><span>" + esc(r[1]) + "</span></div>"; }).join("") + "</div>";
    if (b.table) return '<div class="tablewrap"><table><thead><tr>' +
      b.table.head.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      b.table.rows.map(function (r) {
        return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") +
      "</tbody></table></div>";
    return "";
  }

  /* ---------- การติดตั้งลงหน้าจอมือถือ ---------- */
  var installPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    installPrompt = e;
    if ((location.hash || "#/home").indexOf("home") >= 0) route();
  });
  window.addEventListener("appinstalled", function () { installPrompt = null; route(); });

  function isStandalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
           window.navigator.standalone === true;
  }
  function isIOS() {
    var ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) ||
           (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  function isTouch() {
    return !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  }
  function isEmbedded() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }
  function installCard() {
    if (S.hideInstall || isStandalone() || isEmbedded()) return "";
    if (!installPrompt && !isIOS() && !isTouch()) return "";
    var how = installPrompt
      ? '<div class="btn-row"><button class="btn primary" id="installBtn">ติดตั้งลงหน้าจอ</button></div>'
      : isIOS()
        ? '<div class="note tip"><b>บน iPhone และ iPad</b>กดปุ่มแชร์ที่แถบล่างของ Safari แล้วเลื่อนหาเมนู “เพิ่มไปยังหน้าจอโฮม” (Add to Home Screen)</div>'
        : '<div class="note tip"><b>บน Android</b>กดปุ่มเมนูสามจุดมุมขวาบนของ Chrome แล้วเลือก “ติดตั้งแอป” หรือ “เพิ่มไปยังหน้าจอหลัก”</div>';
    return '<div class="card soft no-print"><h3 style="font-size:15px">📲 ไม่บังคับ — ติดตั้งลงหน้าจอก็ได้</h3>' +
      '<p style="margin:0 0 10px;font-size:14px;color:var(--muted)">ใช้ในเบราว์เซอร์แบบนี้ได้เลยตามปกติ ' +
      "ถ้าติดตั้งลงหน้าจอเพิ่ม จะเปิดได้แม้ไม่มีสัญญาณ และไม่ต้องเปิดลิงก์ใหม่ทุกครั้ง</p>" +
      how +
      '<div class="btn-row">' +
        '<button class="btn ghost" id="hideInstall">ไม่ต้องแสดงอีก</button>' +
      "</div></div>";
  }

  /* ---------- tabs / router ---------- */
  var TABS = [
    { r: "home", t: "หน้าแรก" }, { r: "learn", t: "บทเรียน" }, { r: "steps", t: "ลำดับขั้นตอน" },
    { r: "checklist", t: "เช็กลิสต์ OSCE" }, { r: "quiz", t: "คลังข้อสอบ" }, { r: "cases", t: "กรณีศึกษา" },
    { r: "flash", t: "แฟลชการ์ด" }, { r: "ref", t: "อ้างอิงเร็ว" }
  ];
  function renderTabs(active) {
    el("tabs").innerHTML = TABS.map(function (t) {
      var on = t.r === active;
      return '<button class="tab' + (on ? " active" : "") + '" data-go="#/' + t.r + '"' +
        (on ? ' aria-current="page"' : "") + ">" + esc(t.t) + "</button>";
    }).join("");
  }
  function go(hash) { location.hash = hash; }

  var lastKey = null;
  function route() {
    if (!D || !D.lessons || !D.quiz || !D.checklist || !D.cases || !D.reference) {
      el("view").innerHTML = '<div class="card"><h3>โหลดข้อมูลไม่สำเร็จ</h3>' +
        "<p>ไฟล์เนื้อหาในโฟลเดอร์ assets/js/data/ โหลดไม่ครบ กรุณาตรวจว่าไฟล์ทั้ง 5 ไฟล์อยู่ครบ และเปิดหน้านี้จากโฟลเดอร์เดียวกับ index.html</p></div>";
      return;
    }
    var h = (location.hash || "#/home").replace(/^#\/?/, "");
    h = h.split("?")[0];
    var parts = h.split("/");
    var page = parts[0] || "home";
    renderTabs(page);
    var v = el("view");
    var fn = {
      home: viewHome, learn: function () { return parts[1] ? viewLesson(parts[1]) : viewLearn(); },
      steps: viewSteps, checklist: viewChecklist, quiz: viewQuiz,
      cases: function () { return parts[1] ? viewCase(parts[1]) : viewCases(); },
      flash: viewFlash, ref: viewRef
    }[page] || viewHome;
    v.innerHTML = fn();
    bindCommon();
    if (page === "steps") bindSteps();
    if (page === "checklist") bindChecklist();
    if (page === "quiz") bindQuiz();
    if (page === "cases" && parts[1]) bindCase(parts[1]);
    if (page === "flash") bindFlash();
    if (page === "learn" && parts[1]) bindLesson(parts[1]);
    var key = page + "/" + (parts[1] || "");
    if (key !== lastKey) { window.scrollTo(0, 0); lastKey = key; }
  }
  function bindCommon() {
    on("[data-go]", "click", function (e) { go(e.currentTarget.getAttribute("data-go")); });
    var ib = el("installBtn");
    if (ib) ib.addEventListener("click", function () {
      if (!installPrompt) return;
      installPrompt.prompt();
      var p = installPrompt.userChoice;
      installPrompt = null;
      if (p && p.then) p.then(function () { route(); }, function () { route(); });
      else route();
    });
    var hb = el("hideInstall");
    if (hb) hb.addEventListener("click", function () { S.hideInstall = 1; save(); route(); });
  }

  /* ---------- HOME ---------- */
  function progress() {
    var readN = D.lessons.filter(function (l) { return S.read[l.id]; }).length;
    var seenN = Object.keys(S.quiz.seen).length;
    var wrongN = Object.keys(S.quiz.wrong).length;
    var caseN = Object.keys(S.cases).length;
    var cardN = D.flashcards.filter(function (c) { return S.cards[c.f]; }).length;
    return { readN: readN, seenN: seenN, wrongN: wrongN, caseN: caseN, cardN: cardN };
  }
  function viewHome() {
    var p = progress();
    var last = S.checklist.attempts[S.checklist.attempts.length - 1];
    var lastQ = S.quiz.attempts[S.quiz.attempts.length - 1];
    function statCard(label, now, total, sub) {
      return '<div class="card"><div class="stat"><span>' + esc(label) + "</span><b>" + now + " / " + total + "</b></div>" +
        '<div class="bar"><i style="width:' + pct(now, total) + '%"></i></div>' +
        (sub ? '<p style="margin:8px 0 0;font-size:13px;color:var(--muted)">' + esc(sub) + "</p>" : "") + "</div>";
    }
    return '<div class="page-head"><h2>สวัสดี พร้อมฝึก MVA แล้วหรือยัง</h2>' +
      "<p>แอปนี้รวมทุกอย่างที่ต้องใช้: บทเรียน 10 บท ข้อสอบ " + D.quiz.length + " ข้อ เช็กลิสต์ประเมินทักษะ กรณีศึกษา " +
      D.cases.length + " เคส และการ์ดอ้างอิงหน้างาน</p></div>" +
      '<div class="grid two">' +
        statCard("บทเรียนที่อ่านแล้ว", p.readN, D.lessons.length) +
        statCard("ข้อสอบที่เคยทำ", p.seenN, D.quiz.length, p.wrongN ? "มีข้อที่เคยตอบผิดค้างอยู่ " + p.wrongN + " ข้อ" : "ยังไม่มีข้อที่ค้างผิด") +
        statCard("กรณีศึกษาที่ผ่าน", p.caseN, D.cases.length) +
        statCard("แฟลชการ์ดที่จำได้", p.cardN, D.flashcards.length) +
      "</div>" +
      '<div class="card"><h3>เริ่มตรงนี้</h3><div class="grid two">' +
        tile("📚", "อ่านบทเรียนตามลำดับ", "เริ่มจากภาพรวมจนถึงกฎหมายและการให้คำปรึกษา", "#/learn") +
        tile("🧩", "ฝึกเรียงลำดับ 14 ขั้นตอน", "จำลำดับการทำหัตถการให้ขึ้นใจก่อนลงมือจริง", "#/steps") +
        tile("📝", "สอบจับเวลา", "โหมดเสมือนสอบ พร้อมเฉลยและคำอธิบายรายข้อ", "#/quiz") +
        tile("🩻", "เดินเคสผู้ป่วย", "ตัดสินใจทีละขั้นในสถานการณ์จริง", "#/cases") +
        tile("✅", "ประเมินทักษะด้วยเช็กลิสต์", "ใช้ประเมินตนเองหรือให้อาจารย์ประเมิน พิมพ์เก็บได้", "#/checklist") +
        tile("⚡", "การ์ดอ้างอิงเร็ว", "ตัวเลข ขนาดยา และแนวทางฉุกเฉินที่ต้องใช้หน้างาน", "#/ref") +
      "</div></div>" +
      (lastQ ? '<div class="card"><h3>ผลสอบครั้งล่าสุด</h3><p>' + esc(lastQ.when) + " — ได้ " + lastQ.score + " / " + lastQ.total +
        " (" + pct(lastQ.score, lastQ.total) + "%) โหมด " + esc(lastQ.mode) + "</p>" +
        "<p style=\"color:var(--muted);font-size:13px;margin:0\">คะแนนสูงสุดที่เคยทำได้ " + S.quiz.best + "%</p></div>" : "") +
      (last ? '<div class="card"><h3>ผลประเมินทักษะครั้งล่าสุด</h3><p>' + esc(last.when) + " — " + last.score + " / " + last.max +
        " (" + last.percent + "%) " + (last.passed ? '<span class="pill ok">ผ่าน</span>' : '<span class="pill bad">ยังไม่ผ่าน</span>') + "</p></div>" : "") +
      installCard() +
      '<div class="card no-print"><h3>จัดการข้อมูล</h3><p style="font-size:14px;color:var(--muted);margin:0">' +
      "ความก้าวหน้าถูกบันทึกในเครื่องนี้เท่านั้น หากต้องการเริ่มใหม่ทั้งหมดให้กดปุ่มด้านล่าง</p>" +
      '<div class="btn-row"><button class="btn" id="resetAll">ล้างความก้าวหน้าทั้งหมด</button></div></div>';
  }
  function tile(em, title, sub, href) {
    return '<button class="tile" data-go="' + href + '"><div class="row"><span class="em">' + em +
      "</span><span><b>" + esc(title) + "</b><small>" + esc(sub) + "</small></span></div></button>";
  }

  /* ---------- LEARN ---------- */
  function viewLearn() {
    return '<div class="page-head"><h2>บทเรียน</h2><p>อ่านตามลำดับเพื่อปูพื้น หรือกดเข้าบทที่ต้องการทบทวนก่อนออกตรวจ</p></div>' +
      '<div class="grid two">' + D.lessons.map(function (l) {
        var done = S.read[l.id];
        return '<button class="tile" data-go="#/learn/' + l.id + '"><div class="row"><span class="em">' + l.icon +
          "</span><span><b>" + esc(l.title) + " " + (done ? '<span class="pill ok">อ่านแล้ว</span>' : '<span class="pill gray">' + l.minutes + " นาที</span>") +
          "</b><small>" + esc(l.summary) + "</small></span></div></button>";
      }).join("") + "</div>";
  }
  function viewLesson(id) {
    var i = D.lessons.map(function (l) { return l.id; }).indexOf(id);
    if (i < 0) return '<div class="empty"><p>ไม่พบบทเรียนนี้</p>' +
      '<div class="btn-row" style="justify-content:center"><button class="btn primary" data-go="#/learn">กลับสารบัญบทเรียน</button></div></div>';
    var l = D.lessons[i], prev = D.lessons[i - 1], next = D.lessons[i + 1];
    var related = D.quiz.filter(function (q) { return q.topic === l.id; }).length;
    return '<div class="page-head"><h2>' + l.icon + " " + esc(l.title) + "</h2><p>" + esc(l.summary) + "</p></div>" +
      '<div class="card"><div class="body">' +
        l.sections.map(function (s) {
          return '<div class="h4">' + esc(s.h) + "</div>" + s.body.map(block).join("");
        }).join("") +
        '<div class="pearls"><b>🔑 จุดที่ต้องจำให้ได้</b><ul>' +
          l.pearls.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div>" +
      "</div>" +
      '<div class="btn-row no-print">' +
        '<button class="btn ' + (S.read[l.id] ? "" : "primary") + '" id="markRead" data-id="' + l.id + '">' +
          (S.read[l.id] ? "✓ อ่านแล้ว (กดเพื่อยกเลิก)" : "ทำเครื่องหมายว่าอ่านแล้ว") + "</button>" +
        (related ? '<button class="btn" data-go="#/quiz?topic=' + l.id + '">ทำข้อสอบบทนี้ ' + related + " ข้อ</button>" : "") +
        (prev ? '<button class="btn ghost" data-go="#/learn/' + prev.id + '">← ' + esc(prev.title) + "</button>" : "") +
        (next ? '<button class="btn ghost" data-go="#/learn/' + next.id + '">' + esc(next.title) + " →</button>" : "") +
        '<button class="btn ghost" data-go="#/learn">กลับสารบัญ</button>' +
      "</div></div>";
  }
  function bindLesson() {
    var b = el("markRead");
    if (!b) return;
    b.addEventListener("click", function () {
      var id = b.getAttribute("data-id");
      if (S.read[id]) delete S.read[id]; else S.read[id] = 1;
      save(); route();
    });
  }

  /* ---------- STEPS (ordering drill) ---------- */
  var ORD = null;
  function viewSteps() {
    if (!ORD) ORD = { pool: shuffle(D.steps.map(function (s, i) { return i; })), placed: [], checked: false };
    var done = ORD.placed.length === D.steps.length;
    return '<div class="page-head"><h2>ฝึกเรียงลำดับขั้นตอน MVA</h2>' +
      "<p>กดเลือกขั้นตอนจากกองด้านล่างทีละข้อให้เรียงถูกต้องตั้งแต่ต้นจนจบ กดที่ช่องที่วางแล้วเพื่อเอาออก</p></div>" +
      '<div class="card"><h3>ลำดับที่วางแล้ว (' + ORD.placed.length + " / " + D.steps.length + ")</h3>" +
        (ORD.placed.length ? ORD.placed.map(function (idx, pos) {
          var cls = ORD.checked ? (idx === pos ? " correct" : " wrong") : "";
          return '<div class="slot' + cls + '" data-un="' + pos + '"><span class="n">' + (pos + 1) + "</span><span>" +
            esc(D.steps[idx]) + (ORD.checked && idx !== pos ? '<br><small style="color:var(--bad)">ตำแหน่งที่ถูกต้องคือขั้นที่ ' + (idx + 1) + "</small>" : "") + "</span></div>";
        }).join("") : '<p style="color:var(--muted)">ยังไม่ได้วางขั้นตอนใด</p>') +
        '<div class="btn-row no-print">' +
          '<button class="btn primary" id="checkOrder"' + (done ? "" : " disabled") + ">ตรวจคำตอบ</button>" +
          '<button class="btn" id="resetOrder">เริ่มใหม่</button>' +
          '<button class="btn ghost" id="showOrder">ดูลำดับที่ถูกต้อง</button>' +
        "</div>" +
        (ORD.checked ? '<div class="why"><b>ได้ ' + ORD.placed.filter(function (v, i) { return v === i; }).length +
          " / " + D.steps.length + " ตำแหน่ง</b> — ช่องสีเขียวคือวางถูก ช่องสีแดงมีคำใบ้บอกตำแหน่งที่ควรอยู่</div>" : "") +
      "</div>" +
      (ORD.pool.length ? '<div class="card pool"><h3>กองขั้นตอนที่เหลือ</h3>' +
        ORD.pool.map(function (idx) { return '<button data-pick="' + idx + '">' + esc(D.steps[idx]) + "</button>"; }).join("") + "</div>" : "");
  }
  function bindSteps() {
    on("[data-pick]", "click", function (e) {
      var idx = +e.currentTarget.getAttribute("data-pick");
      ORD.pool = ORD.pool.filter(function (x) { return x !== idx; });
      ORD.placed.push(idx); ORD.checked = false; route();
    });
    on("[data-un]", "click", function (e) {
      var pos = +e.currentTarget.getAttribute("data-un");
      var idx = ORD.placed.splice(pos, 1)[0];
      ORD.pool.push(idx); ORD.checked = false; route();
    });
    var c = el("checkOrder"); if (c) c.addEventListener("click", function () { ORD.checked = true; route(); });
    var r = el("resetOrder"); if (r) r.addEventListener("click", function () { ORD = null; route(); });
    var s = el("showOrder"); if (s) s.addEventListener("click", function () {
      ORD = { pool: [], placed: D.steps.map(function (_, i) { return i; }), checked: true }; route();
    });
  }

  /* ---------- CHECKLIST ---------- */
  function checklistTotals() {
    var C = D.checklist, max = 0, score = 0, criticalFail = [];
    C.sections.forEach(function (sec) {
      sec.items.forEach(function (it) {
        max += 2;
        var v = S.checklist.scores[it.id];
        if (typeof v === "number") score += v;
        if (it.critical && v === 0) criticalFail.push(it.text);
      });
    });
    var percent = pct(score, max);
    return { max: max, score: score, percent: percent, criticalFail: criticalFail,
             passed: percent >= C.passPercent && criticalFail.length === 0 };
  }
  function metaField(k, label) {
    return "<label><span>" + esc(label) + '</span><input class="inp" type="text" data-meta="' + k +
      '" value="' + esc(S.checklist.meta[k] || "") + '" autocomplete="off"></label>';
  }
  function viewChecklist() {
    var C = D.checklist, t = checklistTotals();
    var scored = Object.keys(S.checklist.scores).length;
    var totalItems = C.sections.reduce(function (a, s) { return a + s.items.length; }, 0);
    return '<div class="page-head"><h2>' + esc(C.title) + "</h2>" +
      "<p>ให้คะแนนแต่ละข้อ 0–2 คะแนน เกณฑ์ผ่าน " + C.passPercent + "% และต้องไม่ได้ 0 ในข้อวิกฤต — ใช้ประเมินตนเองหรือให้ผู้ประเมินกรอกแล้วสั่งพิมพ์เก็บ</p></div>" +
      '<div class="card"><h3>ข้อมูลการประเมิน</h3><div class="metagrid">' +
        metaField("student", "ผู้รับการประเมิน") + metaField("rater", "ผู้ประเมิน") +
        metaField("date", "วันที่ / หน่วยงาน") + "</div></div>" +
      '<div class="card"><div class="stat"><span>คะแนนรวม (ให้คะแนนแล้ว ' + scored + " / " + totalItems + " ข้อ)</span><b>" +
        t.score + " / " + t.max + " = " + t.percent + "%</b></div>" +
        '<div class="bar"><i style="width:' + t.percent + '%"></i></div>' +
        '<p style="margin:10px 0 0">' + (t.passed ? '<span class="pill ok">ผ่านเกณฑ์</span>' :
          '<span class="pill bad">ยังไม่ผ่านเกณฑ์</span>') +
        (t.criticalFail.length ? ' <span class="pill warn">ตกข้อวิกฤต ' + t.criticalFail.length + " ข้อ</span>" : "") + "</p>" +
        '<p style="font-size:13px;color:var(--muted);margin:8px 0 0">' + esc(C.note) + "</p>" +
        '<div class="btn-row no-print"><button class="btn primary" id="saveAttempt">บันทึกผลการประเมิน</button>' +
        '<button class="btn" id="printCl">พิมพ์ / บันทึกเป็น PDF</button>' +
        '<button class="btn ghost" id="clearCl">ล้างคะแนน</button></div></div>' +
      C.sections.map(function (sec) {
        return '<div class="card"><h3>' + esc(sec.name) + "</h3>" + sec.items.map(function (it) {
          var v = S.checklist.scores[it.id];
          return '<div class="ci"><div class="t">' + (it.critical ? "⚠️ " : "") + esc(it.text) + "</div>" +
            '<div class="seg">' + C.scale.map(function (sc) {
              return '<button data-item="' + it.id + '" data-val="' + sc.v + '" class="' +
                (v === sc.v ? "on" + (sc.v === 0 ? " z" : "") : "") + '">' + sc.v + " · " + esc(sc.label) + "</button>";
            }).join("") + "</div>" +
            (it.hint ? '<div class="hintline">' + esc(it.hint) + "</div>" : "") + "</div>";
        }).join("") + "</div>";
      }).join("") +
      (S.checklist.attempts.length ? '<div class="card no-print"><h3>ประวัติการประเมิน</h3>' +
        '<div class="tablewrap"><table><thead><tr><th>วันที่</th><th>ผู้รับการประเมิน</th><th>คะแนน</th><th>ร้อยละ</th><th>ผล</th></tr></thead><tbody>' +
        S.checklist.attempts.slice().reverse().map(function (a) {
          return "<tr><td>" + esc(a.when) + "</td><td>" + esc(a.student || "—") + "</td><td>" + a.score + " / " + a.max + "</td><td>" + a.percent + "%</td><td>" +
            (a.passed ? '<span class="pill ok">ผ่าน</span>' : '<span class="pill bad">ไม่ผ่าน</span>') + "</td></tr>";
        }).join("") + "</tbody></table></div></div>" : "");
  }
  function bindChecklist() {
    on("[data-meta]", "input", function (e) {
      S.checklist.meta[e.currentTarget.getAttribute("data-meta")] = e.currentTarget.value;
      save();
    });
    on("[data-item]", "click", function (e) {
      var id = e.currentTarget.getAttribute("data-item"), v = +e.currentTarget.getAttribute("data-val");
      if (S.checklist.scores[id] === v) delete S.checklist.scores[id]; else S.checklist.scores[id] = v;
      save(); route();
    });
    var s = el("saveAttempt"); if (s) s.addEventListener("click", function () {
      var t = checklistTotals();
      S.checklist.attempts.push({ when: todayStr(), score: t.score, max: t.max, percent: t.percent,
                                  passed: t.passed, student: S.checklist.meta.student, rater: S.checklist.meta.rater });
      if (S.checklist.attempts.length > 50) S.checklist.attempts = S.checklist.attempts.slice(-50);
      save(); route();
    });
    var p = el("printCl"); if (p) p.addEventListener("click", function () { window.print(); });
    var c = el("clearCl"); if (c) c.addEventListener("click", function () {
      if (confirm("ล้างคะแนนทั้งหมดในใบประเมินนี้?")) { S.checklist.scores = {}; save(); route(); }
    });
  }

  /* ---------- QUIZ ---------- */
  var QZ = null, TIMER = null;
  function stopTimer() { if (TIMER) { clearInterval(TIMER); TIMER = null; } }
  function viewQuiz() {
    if (QZ && QZ.state === "run") return quizRun();
    if (QZ && QZ.state === "done") return quizResult();
    var preset = (location.hash.split("?")[1] || "").replace("topic=", "");
    if (preset && D.lessons.some(function (l) { return l.id === preset; })) SEL = preset;
    var wrongN = Object.keys(S.quiz.wrong).length;
    if (SEL === "wrong" && !wrongN) SEL = "all";
    if (SEL !== "all" && SEL !== "wrong" && !D.lessons.some(function (l) { return l.id === SEL; })) SEL = "all";
    var topics = D.lessons.map(function (l) {
      var n = D.quiz.filter(function (q) { return q.topic === l.id; }).length;
      return { id: l.id, t: l.title, n: n };
    }).filter(function (x) { return x.n; });
    return '<div class="page-head"><h2>คลังข้อสอบ</h2><p>' + D.quiz.length +
      " ข้อ พร้อมคำอธิบายรายข้อ เลือกโหมดฝึกเพื่อดูเฉลยทันที หรือโหมดสอบเพื่อจับเวลาแล้วเฉลยตอนท้าย</p></div>" +
      '<div class="card"><h3>เลือกหัวข้อ</h3>' +
      '<div class="btn-row"><button class="btn' + (preset ? "" : " primary") + '" data-topic="all">ทุกหัวข้อ (' + D.quiz.length + ")</button>" +
      (wrongN ? '<button class="btn" data-topic="wrong">ทบทวนข้อที่เคยผิด (' + wrongN + ")</button>" : "") +
      topics.map(function (t) {
        return '<button class="btn' + (preset === t.id ? " primary" : "") + '" data-topic="' + t.id + '">' + esc(t.t) + " (" + t.n + ")</button>";
      }).join("") + "</div>" +
      '<p style="font-size:13px;color:var(--muted);margin:12px 0 0">เลือกหัวข้อก่อน แล้วจึงเลือกโหมดด้านล่าง</p>' +
      '<div class="btn-row"><button class="btn primary" id="startPractice">เริ่มโหมดฝึก (เฉลยทันที)</button>' +
      '<button class="btn" id="startExam">เริ่มโหมดสอบจับเวลา</button></div>' +
      '<p id="selInfo" style="font-size:13.5px;margin:10px 0 0"><b>หัวข้อที่เลือก:</b> ' +
      esc(preset ? topicName(preset) : "ทุกหัวข้อ") + "</p></div>" +
      (S.quiz.attempts.length ? '<div class="card"><h3>ประวัติการทำข้อสอบ</h3><div class="tablewrap"><table>' +
        "<thead><tr><th>วันที่</th><th>โหมด</th><th>หัวข้อ</th><th>คะแนน</th></tr></thead><tbody>" +
        S.quiz.attempts.slice(-10).reverse().map(function (a) {
          return "<tr><td>" + esc(a.when) + "</td><td>" + esc(a.mode) + "</td><td>" + esc(a.topic) + "</td><td>" +
            a.score + " / " + a.total + " (" + pct(a.score, a.total) + "%)</td></tr>";
        }).join("") + "</tbody></table></div></div>" : "");
  }
  var SEL = "all";
  function startQuiz(mode) {
    stopTimer();
    var pool;
    if (SEL === "wrong") pool = D.quiz.filter(function (q) { return S.quiz.wrong[q.id]; });
    else if (SEL === "all") pool = D.quiz.slice();
    else pool = D.quiz.filter(function (q) { return q.topic === SEL; });
    if (!pool.length) { alert("ไม่มีข้อสอบในหัวข้อนี้"); return; }
    var qs = shuffle(pool);
    if (mode === "exam") qs = qs.slice(0, Math.min(20, qs.length));
    QZ = { state: "run", mode: mode, topic: SEL === "all" ? "ทุกหัวข้อ" : (SEL === "wrong" ? "ข้อที่เคยผิด" : topicName(SEL)),
           qs: qs, i: 0, ans: [], left: mode === "exam" ? qs.length * 60 : 0 };
    route();
    if (mode === "exam") tick();
  }
  function tick() {
    stopTimer();
    TIMER = setInterval(function () {
      if (!QZ || QZ.state !== "run") { stopTimer(); return; }
      QZ.left--;
      var t = el("clock");
      if (t) t.textContent = fmtTime(QZ.left);
      if (QZ.left <= 0) { stopTimer(); finishQuiz(); }
    }, 1000);
  }
  function fmtTime(s) {
    s = Math.max(0, s);
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }
  function quizRun() {
    var q = QZ.qs[QZ.i], picked = QZ.ans[QZ.i];
    var showAns = QZ.mode === "practice" && picked != null;
    return '<div class="page-head"><h2>' + (QZ.mode === "exam" ? "โหมดสอบจับเวลา" : "โหมดฝึก") + "</h2>" +
      "<p>" + esc(QZ.topic) + "</p></div>" +
      '<div class="card"><div class="qmeta"><span>ข้อ ' + (QZ.i + 1) + " จาก " + QZ.qs.length + "</span>" +
        (QZ.mode === "exam" ? '<span class="pill warn">เหลือเวลา <b id="clock">' + fmtTime(QZ.left) + "</b></span>" :
          '<span class="pill gray">' + esc(topicName(q.topic)) + "</span>") + "</div>" +
      '<div class="bar" style="margin-bottom:14px"><i style="width:' + pct(QZ.i, QZ.qs.length) + '%"></i></div>' +
      "<h3>" + esc(q.q) + "</h3>" +
      q.choices.map(function (c, i) {
        var cls = "choice";
        if (showAns) { if (i === q.answer) cls += " correct"; else if (i === picked) cls += " wrong"; }
        else if (picked === i) cls += " picked";
        return '<button class="' + cls + '" data-pick="' + i + '"' + (showAns ? " disabled" : "") + ">" +
          "<b>" + "กขคง".charAt(i) + ".</b> " + esc(c) + "</button>";
      }).join("") +
      (showAns ? '<div class="why"><b>' + (picked === q.answer ? "✅ ถูกต้อง" : "❌ ยังไม่ถูก คำตอบคือข้อ " + "กขคง".charAt(q.answer)) +
        "</b><br>" + esc(q.why) + "</div>" : "") +
      '<div class="btn-row">' +
        (QZ.i > 0 ? '<button class="btn ghost" id="prevQ">ข้อก่อนหน้า</button>' : "") +
        (QZ.mode === "exam" || showAns ?
          '<button class="btn primary" id="nextQ"' + (picked == null ? " disabled" : "") + ">" +
          (QZ.i === QZ.qs.length - 1 ? "ส่งคำตอบและดูผล" : "ข้อถัดไป") + "</button>" : "") +
        '<button class="btn ghost" id="quitQ">ออกจากชุดนี้</button>' +
      "</div></div>";
  }
  function finishQuiz() {
    stopTimer();
    var score = 0;
    QZ.qs.forEach(function (q, i) {
      var a = QZ.ans[i];
      S.quiz.seen[q.id] = 1;
      if (a === q.answer) { score++; delete S.quiz.wrong[q.id]; }
      else S.quiz.wrong[q.id] = 1;
    });
    QZ.state = "done"; QZ.score = score;
    var p = pct(score, QZ.qs.length);
    if (p > S.quiz.best) S.quiz.best = p;
    S.quiz.attempts.push({ when: todayStr(), mode: QZ.mode === "exam" ? "สอบจับเวลา" : "ฝึก",
                           topic: QZ.topic, score: score, total: QZ.qs.length });
    if (S.quiz.attempts.length > 50) S.quiz.attempts = S.quiz.attempts.slice(-50);
    save(); route();
  }
  function quizResult() {
    var p = pct(QZ.score, QZ.qs.length);
    var verdict = p >= 80 ? { c: "ok", t: "ยอดเยี่ยม พร้อมสอบ" } : p >= 60 ? { c: "warn", t: "พอใช้ ควรทบทวนเพิ่ม" } : { c: "bad", t: "ต้องทบทวนบทเรียนก่อน" };
    return '<div class="page-head"><h2>ผลการทำข้อสอบ</h2><p>' + esc(QZ.topic) + " · โหมด" + (QZ.mode === "exam" ? "สอบจับเวลา" : "ฝึก") + "</p></div>" +
      '<div class="card"><div class="stat"><span>คะแนน</span><b>' + QZ.score + " / " + QZ.qs.length + " = " + p + "%</b></div>" +
      '<div class="bar"><i style="width:' + p + '%"></i></div>' +
      '<p style="margin:10px 0 0"><span class="pill ' + verdict.c + '">' + esc(verdict.t) + "</span></p>" +
      '<div class="btn-row"><button class="btn primary" id="againQ">ทำชุดใหม่</button>' +
      '<button class="btn" data-go="#/learn">กลับไปอ่านบทเรียน</button></div></div>' +
      '<div class="card"><h3>เฉลยและคำอธิบายรายข้อ</h3>' +
      QZ.qs.map(function (q, i) {
        var a = QZ.ans[i], ok = a === q.answer;
        return '<div style="padding:12px 0;border-bottom:1px solid var(--line)">' +
          "<b>" + (i + 1) + ". " + esc(q.q) + "</b><br>" +
          '<span class="pill ' + (ok ? "ok" : "bad") + '">' + (ok ? "ตอบถูก" : "ตอบผิด") + "</span> " +
          '<span style="font-size:14px">คำตอบที่ถูกคือ <b>' + esc(q.choices[q.answer]) + "</b>" +
          (a != null && !ok ? " · ท่านตอบ " + esc(q.choices[a]) : (a == null ? " · ไม่ได้ตอบ" : "")) + "</span>" +
          '<div class="why">' + esc(q.why) + "</div></div>";
      }).join("") + "</div>";
  }
  function bindQuiz() {
    on("[data-topic]", "click", function (e) {
      SEL = e.currentTarget.getAttribute("data-topic");
      Array.prototype.forEach.call(document.querySelectorAll("[data-topic]"), function (n) { n.classList.remove("primary"); });
      e.currentTarget.classList.add("primary");
      var info = el("selInfo");
      if (info) info.innerHTML = "<b>หัวข้อที่เลือก:</b> " +
        esc(SEL === "all" ? "ทุกหัวข้อ" : SEL === "wrong" ? "ข้อที่เคยตอบผิด" : topicName(SEL));
    });
    var sp = el("startPractice"); if (sp) sp.addEventListener("click", function () { startQuiz("practice"); });
    var se = el("startExam"); if (se) se.addEventListener("click", function () { startQuiz("exam"); });
    on("[data-pick]", "click", function (e) {
      var i = +e.currentTarget.getAttribute("data-pick");
      QZ.ans[QZ.i] = i;
      if (QZ.mode === "practice") route();
      else if (QZ.i < QZ.qs.length - 1) { QZ.i++; route(); } else route();
    });
    var n = el("nextQ"); if (n) n.addEventListener("click", function () {
      if (QZ.i === QZ.qs.length - 1) finishQuiz(); else { QZ.i++; route(); }
    });
    var pv = el("prevQ"); if (pv) pv.addEventListener("click", function () { QZ.i--; route(); });
    var qt = el("quitQ"); if (qt) qt.addEventListener("click", function () {
      if (confirm("ออกจากชุดนี้โดยไม่บันทึกคะแนน?")) { stopTimer(); QZ = null; route(); }
    });
    var ag = el("againQ"); if (ag) ag.addEventListener("click", function () { QZ = null; route(); });
  }

  /* ---------- CASES ---------- */
  var CS = null;
  function viewCases() {
    return '<div class="page-head"><h2>กรณีศึกษา</h2><p>ตัดสินใจทีละขั้นเหมือนอยู่หน้าเตียงผู้ป่วย ทุกตัวเลือกมีคำอธิบายว่าทำไมถูกหรือผิด</p></div>' +
      '<div class="grid two">' + D.cases.map(function (c) {
        var done = S.cases[c.id];
        return '<button class="tile" data-go="#/cases/' + c.id + '"><div class="row"><span class="em">🩻</span><span><b>' +
          esc(c.title) + " " + (done ? '<span class="pill ok">ผ่านแล้ว</span>' : '<span class="pill gray">' + esc(c.level) + "</span>") +
          "</b><small>" + esc(c.stem.slice(0, 90)) + "…</small></span></div></button>";
      }).join("") + "</div>";
  }
  function viewCase(id) {
    var c = D.cases.filter(function (x) { return x.id === id; })[0];
    if (!c) return '<div class="empty"><p>ไม่พบกรณีศึกษานี้</p>' +
      '<div class="btn-row" style="justify-content:center"><button class="btn primary" data-go="#/cases">กลับรายการกรณีศึกษา</button></div></div>';
    if (!CS || CS.id !== id) CS = { id: id, i: 0, picks: [] };
    var step = c.steps[CS.i];
    var finished = CS.i >= c.steps.length;
    var head = '<div class="page-head"><h2>' + esc(c.title) + '</h2><p><span class="pill gray">' + esc(c.level) + "</span></p></div>" +
      '<div class="card"><h3>ข้อมูลผู้ป่วย</h3><p>' + esc(c.stem) + "</p>" +
      '<div class="kv">' + c.info.map(function (r) {
        return "<div><span>" + esc(r[0]) + "</span><span>" + esc(r[1]) + "</span></div>"; }).join("") + "</div></div>";
    if (finished) {
      var right = CS.picks.filter(function (p) { return p.ok; }).length;
      return head + '<div class="card"><h3>สรุปผล</h3><p>ตอบถูกในครั้งแรก ' + right + " จาก " + c.steps.length + " ขั้นตอน</p>" +
        '<div class="note tip"><b>💡 บทเรียนจากเคสนี้</b>' + esc(c.takeaway) + "</div>" +
        '<div class="btn-row"><button class="btn primary" id="againCase">เล่นเคสนี้ใหม่</button>' +
        '<button class="btn" data-go="#/cases">เลือกเคสอื่น</button></div></div>';
    }
    var picked = CS.picks[CS.i];
    return head + '<div class="card"><div class="qmeta"><span>ขั้นตอนที่ ' + (CS.i + 1) + " จาก " + c.steps.length + "</span></div>" +
      "<h3>" + esc(step.q) + "</h3>" +
      step.choices.map(function (ch, i) {
        var cls = "choice";
        if (picked) { if (ch.ok) cls += " correct"; else if (picked.i === i) cls += " wrong"; }
        return '<button class="' + cls + '" data-cpick="' + i + '"' + (picked ? " disabled" : "") + ">" + esc(ch.t) + "</button>";
      }).join("") +
      (picked ? '<div class="why"><b>' + (picked.ok ? "✅ ถูกต้อง" : "❌ ยังไม่ใช่ตัวเลือกที่ดีที่สุด") + "</b><br>" +
        esc(step.choices[picked.i].fb) + (picked.ok ? "" : "<br><br><b>คำตอบที่ถูก:</b> " +
        esc(step.choices.filter(function (x) { return x.ok; })[0].t) + " — " +
        esc(step.choices.filter(function (x) { return x.ok; })[0].fb)) + "</div>" +
        '<div class="btn-row"><button class="btn primary" id="nextCase">' +
        (CS.i === c.steps.length - 1 ? "ดูสรุปเคส" : "ขั้นตอนถัดไป") + "</button></div>" : "") +
      "</div>";
  }
  function bindCase(id) {
    var c = D.cases.filter(function (x) { return x.id === id; })[0];
    on("[data-cpick]", "click", function (e) {
      var i = +e.currentTarget.getAttribute("data-cpick");
      CS.picks[CS.i] = { i: i, ok: !!c.steps[CS.i].choices[i].ok };
      route();
    });
    var n = el("nextCase"); if (n) n.addEventListener("click", function () {
      CS.i++;
      if (CS.i >= c.steps.length) { S.cases[id] = 1; save(); }
      route();
    });
    var a = el("againCase"); if (a) a.addEventListener("click", function () { CS = { id: id, i: 0, picks: [] }; route(); });
  }

  /* ---------- FLASHCARDS ---------- */
  var FC = null;
  function viewFlash() {
    if (!FC) FC = { order: shuffle(D.flashcards.map(function (_, i) { return i; })), i: 0, show: false };
    var idx = FC.order[FC.i], card = D.flashcards[idx];
    var known = S.cards[card.f];
    var knownCount = D.flashcards.filter(function (c) { return S.cards[c.f]; }).length;
    return '<div class="page-head"><h2>แฟลชการ์ด</h2><p>กดที่การ์ดเพื่อพลิกดูคำตอบ แล้วบอกว่าจำได้หรือยัง — ระบบจะจำไว้ให้</p></div>' +
      '<div class="card"><div class="qmeta"><span>ใบที่ ' + (FC.i + 1) + " จาก " + FC.order.length + "</span>" +
      '<span class="pill gray">' + esc(topicName(card.topic)) + "</span></div>" +
      '<div class="flash" id="flashCard"><div><div class="q">' + esc(card.f) + "</div>" +
      (FC.show ? '<div class="a">' + esc(card.b) + "</div>" : "<small>กดเพื่อดูคำตอบ</small>") +
      (known ? "<small>✓ เคยทำเครื่องหมายว่าจำได้แล้ว</small>" : "") + "</div></div>" +
      '<div class="btn-row"><button class="btn primary" id="knowIt">จำได้</button>' +
      '<button class="btn" id="againIt">ยังไม่ได้ ขอทวนอีก</button>' +
      '<button class="btn ghost" id="shuffleIt">สลับสำรับใหม่</button></div>' +
      '<div class="bar" style="margin-top:14px"><i style="width:' + pct(knownCount, D.flashcards.length) + '%"></i></div>' +
      '<p style="font-size:13px;color:var(--muted);margin:6px 0 0">จำได้แล้ว ' + knownCount + " จาก " + D.flashcards.length + " ใบ</p></div>";
  }
  function nextCard() { FC.i = (FC.i + 1) % FC.order.length; FC.show = false; route(); }
  function bindFlash() {
    var f = el("flashCard"); if (f) f.addEventListener("click", function () { FC.show = !FC.show; route(); });
    var k = el("knowIt"); if (k) k.addEventListener("click", function () {
      S.cards[D.flashcards[FC.order[FC.i]].f] = 1; save(); nextCard();
    });
    var a = el("againIt"); if (a) a.addEventListener("click", function () {
      delete S.cards[D.flashcards[FC.order[FC.i]].f]; save(); nextCard();
    });
    var s = el("shuffleIt"); if (s) s.addEventListener("click", function () { FC = null; route(); });
  }

  /* ---------- REFERENCE ---------- */
  function viewRef() {
    return '<div class="page-head"><h2>การ์ดอ้างอิงเร็ว</h2><p>เปิดดูหน้างานได้ทันที กดปุ่มพิมพ์เพื่อทำเป็นการ์ดพกติดกระเป๋าเสื้อกาวน์</p>' +
      '<div class="btn-row no-print"><button class="btn" onclick="window.print()">พิมพ์ / บันทึกเป็น PDF</button></div></div>' +
      D.reference.map(function (r) {
        return '<div class="card"><h3>' + r.icon + " " + esc(r.title) + "</h3>" +
          (r.kv ? block({ kv: r.kv }) : "") +
          (r.table ? block({ table: r.table }) : "") +
          (r.list ? block({ ul: r.list }) : "") +
          (r.note ? '<p style="font-size:13.5px;color:var(--muted);margin:0">' + esc(r.note) + "</p>" : "") + "</div>";
      }).join("");
  }

  /* ---------- theme + boot ---------- */
  function applyTheme() {
    if (S.theme) document.documentElement.setAttribute("data-theme", S.theme);
    else document.documentElement.removeAttribute("data-theme");
  }
  function sharePage(btn) {
    var data = { title: "MVA Trainer", text: "แอปทบทวนหัตถการ MVA", url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    var done = function (ok) {
      var old = btn.textContent;
      btn.textContent = ok ? "✓" : "!";
      setTimeout(function () { btn.textContent = old; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(location.href).then(function () { done(true); }, function () { done(false); });
    } else { window.prompt("คัดลอกลิงก์นี้ไปส่งให้นักเรียน", location.href); }
  }
  if (isEmbedded()) el("shareTop").style.display = "none";
  else el("shareTop").addEventListener("click", function () { sharePage(el("shareTop")); });

  function updateThemeBtn() {
    var b = el("themeBtn");
    b.textContent = S.theme === "dark" ? "🌙" : S.theme === "light" ? "☀️" : "◐";
    b.title = "ธีมปัจจุบัน: " + (S.theme === "dark" ? "มืด" : S.theme === "light" ? "สว่าง" : "ตามระบบ") + " — กดเพื่อเปลี่ยน";
  }
  el("themeBtn").addEventListener("click", function () {
    S.theme = S.theme === "dark" ? "light" : S.theme === "light" ? null : "dark";
    save(); applyTheme(); updateThemeBtn();
  });
  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "resetAll") {
      if (confirm("ล้างความก้าวหน้าทั้งหมด (บทเรียน คะแนนสอบ เช็กลิสต์ แฟลชการ์ด)?")) {
        S = defaults(); save(); QZ = null; CS = null; FC = null; ORD = null; SEL = "all";
        stopTimer(); applyTheme(); updateThemeBtn(); lastKey = null; route();
      }
    }
  });
  window.addEventListener("hashchange", route);
  applyTheme();
  updateThemeBtn();
  route();

  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
