/* ------------------------------------------------------------------
 * app.js — ตรรกะการแสดงผลและการเก็บความคืบหน้า
 * ------------------------------------------------------------------ */
(function () {
  "use strict";

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- storage ---------- */
  const KEY = "iud-app-v1";
  let state = { doneSteps: [], rubric: {}, theme: null, quizBest: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch (e) { /* โหมดส่วนตัว หรือปิดการเก็บข้อมูล — ใช้ค่าเริ่มต้น */ }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------- theme ---------- */
  if (state.theme) document.documentElement.setAttribute("data-theme", state.theme);
  $("#themeBtn").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const isDark = cur ? cur === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    state.theme = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", state.theme);
    save();
  });

  /* ---------- tabs ---------- */
  $("#tabbar").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    $$("#tabbar button").forEach((x) => x.classList.toggle("on", x === b));
    $$(".view").forEach((v) => v.classList.toggle("on", v.id === "v-" + b.dataset.v));
    window.scrollTo({ top: 0 });
  });

  /* ---------- accordion (มอบหมายเหตุการณ์ครั้งเดียว) ---------- */
  document.addEventListener("click", (e) => {
    const h = e.target.closest(".acc-head");
    if (!h) return;
    const acc = h.closest(".acc");
    const open = acc.classList.toggle("open");
    h.setAttribute("aria-expanded", String(open));
  });

  /* =========================================================
     มุมมองที่ 1 — เรียนรู้
     ========================================================= */
  function renderBlock(b) {
    if (b.type === "table") {
      return '<div class="blk tablewrap"><table><thead><tr>' +
        b.head.map((h) => "<th>" + h + "</th>").join("") +
        "</tr></thead><tbody>" +
        b.rows.map((r) => "<tr>" + r.map((c) => "<td>" + c + "</td>").join("") + "</tr>").join("") +
        "</tbody></table></div>";
    }
    if (b.type === "list") {
      return '<div class="blk"><ul>' + b.items.map((i) => "<li>" + i + "</li>").join("") + "</ul></div>";
    }
    if (b.type === "callout") {
      return '<div class="blk callout ' + b.tone + '"><span class="ct">' + b.title + "</span>" + b.text + "</div>";
    }
    if (b.type === "checklist") {
      return '<div class="blk"><div class="sub-lb">' + b.title + '</div><ul class="mini-check">' +
        b.items.map((i) => "<li>" + i + "</li>").join("") + "</ul></div>";
    }
    return "";
  }

  function renderLearn() {
    let h = '<div class="card card-pad">' +
      '<h2 style="font-size:17px;margin-bottom:6px">ก่อนเริ่มฝึก</h2>' +
      '<p class="note">แอปนี้ใช้ประกอบการฝึกหัตถการกับหุ่นจำลองและภายใต้การกำกับของอาจารย์ ' +
      'ไม่ใช้แทนการตัดสินใจทางคลินิกหรือแนวปฏิบัติของสถาบัน ' +
      'แตะหัวข้อเพื่อเปิดอ่าน ความคืบหน้าและคะแนนจะถูกเก็บไว้ในเครื่องของคุณเท่านั้น</p></div>';

    h += '<div class="sec-title">พื้นฐานที่ต้องรู้ก่อนลงมือ</div>';
    CONTENT.learn.forEach((sec) => {
      h += '<div class="card acc"><button class="acc-head" aria-expanded="false">' +
        '<span class="ic">' + sec.icon + '</span>' +
        '<span class="tx">' + esc(sec.title) + "</span>" +
        '<span class="ch">▾</span></button>' +
        '<div class="acc-body">' + sec.blocks.map(renderBlock).join("") + "</div></div>";
    });

    h += '<div class="card card-pad"><div class="sub-lb">แหล่งอ้างอิงเนื้อหา</div>' +
      '<p class="ref">WHO Medical Eligibility Criteria for Contraceptive Use, 5th ed.</p>' +
      '<p class="ref">WHO Selected Practice Recommendations for Contraceptive Use, 3rd ed.</p>' +
      '<p class="ref">CDC U.S. Selected Practice Recommendations for Contraceptive Use</p>' +
      '<p class="ref">แนวทางการให้บริการคุมกำเนิด สำนักอนามัยการเจริญพันธุ์ กรมอนามัย</p>' +
      '<p class="note" style="margin-top:8px">ตรวจสอบเทียบกับแนวปฏิบัติล่าสุดของโรงพยาบาลที่ปฏิบัติงานเสมอ</p></div>';

    $("#v-learn").innerHTML = h;
  }

  /* =========================================================
     มุมมองที่ 2 — ขั้นตอนหัตถการ
     ========================================================= */
  let phaseFilter = "all";

  function stepHTML(s) {
    const done = state.doneSteps.indexOf(s.id) !== -1;
    const ph = CONTENT.phases.filter((p) => p.id === s.phase)[0];
    let b = '<span class="phase-tag">' + ph.name + "</span>" +
      '<ul class="do-list">' + s.do.map((d) => "<li>" + d + "</li>").join("") + "</ul>";
    if (s.diagram && DIAGRAMS[s.diagram]) b += '<div class="figure">' + DIAGRAMS[s.diagram] + "</div>";
    b += '<div class="why"><span class="lb">ทำไมต้องทำแบบนี้</span>' + s.why + "</div>";
    b += '<div class="pit"><span class="lb">จุดที่มักพลาด</span>' + s.pitfall + "</div>";
    b += '<div class="stepfoot"><button class="btn ' + (done ? "ghost" : "primary") +
      '" data-done="' + s.id + '">' + (done ? "◻ ยกเลิกเครื่องหมาย" : "✓ ทำขั้นตอนนี้แล้ว") + "</button></div>";

    return '<div class="card acc step' + (done ? " done" : "") + '" data-step="' + s.id + '">' +
      '<button class="acc-head" aria-expanded="false">' +
      '<span class="num">' + (done ? "✓" : s.id) + "</span>" +
      '<span class="tx">' + esc(s.title) + "</span>" +
      '<span class="ch">▾</span></button>' +
      '<div class="acc-body">' + b + "</div></div>";
  }

  function renderSteps() {
    const list = CONTENT.steps.filter((s) => phaseFilter === "all" || s.phase === phaseFilter);
    const pct = Math.round((state.doneSteps.length / CONTENT.steps.length) * 100);

    let h = '<div class="card"><div class="prog">' +
      '<div class="bar"><span style="width:' + pct + '%"></span></div>' +
      '<div class="pct">' + state.doneSteps.length + "/" + CONTENT.steps.length + "</div>" +
      '</div><div style="padding:0 14px 12px"><button class="btn ghost small" id="resetSteps">ล้างความคืบหน้า</button></div></div>';

    h += '<div class="phasebar"><button class="chip' + (phaseFilter === "all" ? " on" : "") +
      '" data-ph="all">ทั้งหมด</button>' +
      CONTENT.phases.map((p) => '<button class="chip' + (phaseFilter === p.id ? " on" : "") +
        '" data-ph="' + p.id + '">' + p.name + "</button>").join("") + "</div>";

    h += list.map(stepHTML).join("");
    $("#v-steps").innerHTML = h;
  }

  $("#v-steps").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) { phaseFilter = chip.dataset.ph; renderSteps(); return; }

    if (e.target.id === "resetSteps") {
      state.doneSteps = []; save(); renderSteps(); return;
    }

    const d = e.target.closest("[data-done]");
    if (d) {
      const id = Number(d.dataset.done);
      const i = state.doneSteps.indexOf(id);
      if (i === -1) state.doneSteps.push(id); else state.doneSteps.splice(i, 1);
      save();
      const openIds = $$("#v-steps .acc.open").map((a) => a.dataset.step);
      renderSteps();
      openIds.forEach((sid) => {
        const el = $('#v-steps .step[data-step="' + sid + '"]');
        if (el) el.classList.add("open");
      });
    }
  });

  /* =========================================================
     มุมมองที่ 3 — ปัญหาและภาวะแทรกซ้อน
     ========================================================= */
  function renderTrouble() {
    let h = '<div class="card card-pad"><span class="ct" style="font-weight:700">' +
      CONTENT.pains.title + '</span><ul class="pains">' +
      CONTENT.pains.items.map((p) =>
        '<li><span class="k">' + p[0] + "</span><div><div>" + p[2] +
        '</div><div class="en">' + p[1] + "</div></div></li>").join("") +
      "</ul></div>";

    h += '<div class="sec-title">แก้ปัญหาระหว่างทำและภาวะแทรกซ้อน</div>';
    CONTENT.troubles.forEach((t) => {
      let b = '<span class="tag">' + t.tag + "</span>" +
        '<p class="note">' + t.when + "</p>" +
        '<div class="sub-lb">สิ่งที่พบ</div><ul class="blk">' +
        t.signs.map((s) => "<li>" + s + "</li>").join("") + "</ul>" +
        '<div class="sub-lb">การจัดการ</div><ul class="do-list">' +
        t.manage.map((s) => "<li>" + s + "</li>").join("") + "</ul>";
      h += '<div class="card acc"><button class="acc-head" aria-expanded="false">' +
        '<span class="ic">🔎</span><span class="tx">' + esc(t.title) + "</span>" +
        '<span class="ch">▾</span></button><div class="acc-body">' + b + "</div></div>";
    });
    $("#v-trouble").innerHTML = h;
  }

  /* =========================================================
     มุมมองที่ 4 — แบบประเมินทักษะ
     ========================================================= */
  function rubricKey(g, i) { return g + "-" + i; }

  function rubricStats() {
    let total = 0, max = 0, missedCritical = 0, rated = 0, items = 0;
    CONTENT.rubric.groups.forEach((g, gi) => {
      g.items.forEach((it, ii) => {
        items++;
        max += 2;
        const v = state.rubric[rubricKey(gi, ii)];
        if (v !== undefined) { total += v; rated++; }
        if (it.critical && v !== undefined && v < 2) missedCritical++;
      });
    });
    return { total: total, max: max, missedCritical: missedCritical, rated: rated, items: items };
  }

  function renderRubric() {
    const st = rubricStats();
    const pct = st.max ? Math.round((st.total / st.max) * 100) : 0;
    const verdict = st.rated < st.items
      ? { t: "ยังประเมินไม่ครบ (" + st.rated + "/" + st.items + " ข้อ)", tone: "info" }
      : st.missedCritical > 0
        ? { t: "ยังไม่ผ่าน — มีข้อสำคัญ (critical) ที่ทำไม่ถูกต้อง " + st.missedCritical + " ข้อ", tone: "danger" }
        : pct >= 80
          ? { t: "ผ่านเกณฑ์ — คะแนน " + pct + "%", tone: "good" }
          : { t: "ยังไม่ผ่านเกณฑ์ — ต้องได้ตั้งแต่ 80% ขึ้นไป (ได้ " + pct + "%)", tone: "warn" };

    let h = '<div class="card card-pad">' +
      '<h2 style="font-size:17px;margin-bottom:6px">แบบประเมินทักษะหัตถการ</h2>' +
      '<p class="note">ใช้ได้ทั้งการประเมินตนเองหลังฝึกกับหุ่น และให้อาจารย์ประเมินแบบ DOPS ' +
      'ข้อที่ติดป้าย <b>critical</b> คือข้อที่ถ้าทำไม่ถูกต้องถือว่ายังไม่ผ่าน แม้คะแนนรวมจะสูง</p></div>';

    h += '<div class="card"><div class="prog"><div class="bar"><span style="width:' + pct + '%"></span></div>' +
      '<div class="pct">' + st.total + "/" + st.max + "</div></div>" +
      '<div style="padding:0 14px 12px"><div class="callout ' + verdict.tone + '">' + verdict.t + "</div>" +
      '<button class="btn ghost small" id="resetRubric" style="margin-top:10px">ล้างผลประเมิน</button></div></div>';

    CONTENT.rubric.groups.forEach((g, gi) => {
      const gTotal = g.items.reduce((a, _, ii) => a + (state.rubric[rubricKey(gi, ii)] || 0), 0);
      h += '<div class="card"><div class="group-head">' + esc(g.name) +
        "<span>" + gTotal + "/" + g.items.length * 2 + "</span></div>";
      g.items.forEach((it, ii) => {
        const v = state.rubric[rubricKey(gi, ii)];
        h += '<div class="rub-item"><div class="lbl">' +
          (it.critical ? '<span class="crit">critical</span>' : "") +
          "<span>" + esc(it.t) + "</span></div><div class=\"rate\">" +
          CONTENT.rubric.scale.map((s) =>
            '<button data-v="' + s.v + '" data-k="' + rubricKey(gi, ii) + '"' +
            (v === s.v ? ' class="on"' : "") + ' title="' + esc(s.hint) + '">' + s.label + "</button>").join("") +
          "</div></div>";
      });
      h += "</div>";
    });

    $("#v-rubric").innerHTML = h;
  }

  $("#v-rubric").addEventListener("click", (e) => {
    if (e.target.id === "resetRubric") { state.rubric = {}; save(); renderRubric(); return; }
    const b = e.target.closest("[data-k]");
    if (!b) return;
    const k = b.dataset.k, v = Number(b.dataset.v);
    if (state.rubric[k] === v) delete state.rubric[k]; else state.rubric[k] = v;
    save();
    const y = window.scrollY;
    renderRubric();
    window.scrollTo({ top: y });
  });

  /* =========================================================
     มุมมองที่ 5 — ควิซ
     ========================================================= */
  let quiz = { order: [], idx: 0, score: 0, answered: false };

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function startQuiz() {
    quiz = { order: shuffle(CONTENT.quiz.map((_, i) => i)), idx: 0, score: 0, answered: false };
    renderQuiz();
  }

  function renderQuiz() {
    const v = $("#v-quiz");

    if (quiz.idx >= quiz.order.length) {
      const pct = Math.round((quiz.score / quiz.order.length) * 100);
      if (state.quizBest === null || pct > state.quizBest) { state.quizBest = pct; save(); }
      v.innerHTML = '<div class="card score">' +
        '<div class="big">' + pct + "%</div>" +
        '<div class="sub">ตอบถูก ' + quiz.score + " จาก " + quiz.order.length + " ข้อ" +
        (state.quizBest !== null ? " • สถิติสูงสุด " + state.quizBest + "%" : "") + "</div>" +
        '<div class="callout ' + (pct >= 80 ? "good" : pct >= 60 ? "warn" : "danger") + '">' +
        (pct >= 80 ? "พร้อมลงฝึกกับหุ่นจำลองแล้ว" :
          pct >= 60 ? "ทบทวนหัวข้อที่ตอบผิดอีกครั้งก่อนลงฝึก" :
            "ควรกลับไปอ่านหมวดเรียนรู้และขั้นตอนหัตถการให้ครบก่อน") + "</div>" +
        '<button class="btn primary" id="againBtn" style="margin-top:14px">เริ่มทำใหม่</button></div>';
      return;
    }

    const q = CONTENT.quiz[quiz.order[quiz.idx]];
    v.innerHTML = '<div class="card card-pad">' +
      '<div class="qmeta"><span>ข้อ ' + (quiz.idx + 1) + " / " + quiz.order.length + "</span>" +
      "<span>ถูก " + quiz.score + " ข้อ</span></div>" +
      '<div class="qtext">' + esc(q.q) + "</div>" +
      q.choices.map((c, i) => '<button class="opt" data-i="' + i + '">' + esc(c) + "</button>").join("") +
      '<div id="expBox"></div></div>';
  }

  $("#v-quiz").addEventListener("click", (e) => {
    if (e.target.id === "againBtn") { startQuiz(); window.scrollTo({ top: 0 }); return; }
    if (e.target.id === "nextBtn") {
      quiz.idx++; quiz.answered = false; renderQuiz(); window.scrollTo({ top: 0 }); return;
    }
    const opt = e.target.closest(".opt");
    if (!opt || quiz.answered) return;

    quiz.answered = true;
    const q = CONTENT.quiz[quiz.order[quiz.idx]];
    const picked = Number(opt.dataset.i);
    if (picked === q.a) quiz.score++;

    $$("#v-quiz .opt").forEach((b, i) => {
      b.disabled = true;
      if (i === q.a) b.classList.add("correct");
      else if (i === picked) b.classList.add("wrong");
    });
    $("#expBox").innerHTML = '<div class="exp"><span class="lb">' +
      (picked === q.a ? "ถูกต้อง" : "ยังไม่ถูก") + "</span>" + q.exp + "</div>" +
      '<button class="btn primary" id="nextBtn" style="margin-top:12px">' +
      (quiz.idx + 1 >= quiz.order.length ? "ดูผลคะแนน" : "ข้อถัดไป") + "</button>";
  });

  /* ---------- boot ---------- */
  renderLearn();
  renderSteps();
  renderTrouble();
  renderRubric();
  startQuiz();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
