/* ------------------------------------------------------------------
 * diagrams.js — ภาพประกอบ SVG แบบ inline (ปรับสีตามธีมด้วย CSS)
 * เป็นภาพเชิงแผนภาพเพื่อสื่อหลักการ ไม่ใช่ภาพกายวิภาคตามสัดส่วนจริง
 * ------------------------------------------------------------------ */

const DIAGRAMS = {};

/* มดลูกคว่ำหน้า vs คว่ำหลัง — ทิศทางที่ต้องสอดเครื่องมือ */
DIAGRAMS["uterus-position"] = `
<svg viewBox="0 0 340 190" role="img" aria-label="เปรียบเทียบมดลูกคว่ำหน้าและคว่ำหลัง พร้อมทิศทางการสอดเครื่องมือ">
  <g class="dg">
    <text class="dg-title" x="80" y="16" text-anchor="middle">Anteverted (คว่ำหน้า)</text>
    <path class="dg-organ" d="M52 96 q-10 -44 30 -56 q42 -12 56 22 q10 30 -18 44 q-22 11 -40 6 z"/>
    <path class="dg-canal" d="M52 96 q14 20 30 30"/>
    <path class="dg-cervix" d="M74 118 l22 22 q6 8 -4 14 q-12 6 -20 -4 l-16 -20 z"/>
    <path class="dg-arrow" d="M74 154 q4 -22 22 -36 q22 -18 34 -34" marker-end="url(#dgArrow)"/>
    <text class="dg-note" x="80" y="182" text-anchor="middle">ปลายมดลูกชี้ไปทางหน้าท้อง</text>

    <line class="dg-div" x1="170" y1="24" x2="170" y2="170"/>

    <text class="dg-title" x="256" y="16" text-anchor="middle">Retroverted (คว่ำหลัง)</text>
    <path class="dg-organ" d="M290 74 q26 26 -2 48 q-30 22 -60 6 q-26 -16 -14 -40 q14 -24 44 -22 z"/>
    <path class="dg-canal" d="M226 90 q6 22 22 32"/>
    <path class="dg-cervix" d="M242 122 l20 22 q6 8 -4 14 q-12 6 -20 -4 l-14 -20 z"/>
    <path class="dg-arrow" d="M244 156 q-2 -22 -8 -38 q-8 -20 -22 -30" marker-end="url(#dgArrow)"/>
    <text class="dg-note" x="256" y="182" text-anchor="middle">ต้องสอดไปทางด้านหลัง มิฉะนั้นทะลุ</text>
  </g>
  <defs>
    <marker id="dgArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path class="dg-arrowhead" d="M0 0 L10 5 L0 10 z"/>
    </marker>
  </defs>
</svg>`;

/* ตำแหน่งหนีบ tenaculum บนปากมดลูก */
DIAGRAMS["tenaculum-clock"] = `
<svg viewBox="0 0 300 190" role="img" aria-label="ตำแหน่งหนีบ tenaculum ที่ปากมดลูก ตำแหน่ง 10 และ 2 นาฬิกา">
  <g class="dg">
    <circle class="dg-organ" cx="100" cy="95" r="68"/>
    <ellipse class="dg-os" cx="100" cy="95" rx="9" ry="16"/>
    <text class="dg-tick" x="100" y="40" text-anchor="middle">12</text>
    <text class="dg-tick" x="155" y="99" text-anchor="middle">3</text>
    <text class="dg-tick" x="116" y="156" text-anchor="middle">6</text>
    <text class="dg-tick" x="45" y="99" text-anchor="middle">9</text>
    <circle class="dg-mark" cx="66" cy="61" r="8"/>
    <circle class="dg-mark" cx="134" cy="61" r="8"/>
    <text class="dg-marklabel" x="66" y="65" text-anchor="middle">10</text>
    <text class="dg-marklabel" x="134" y="65" text-anchor="middle">2</text>
    <path class="dg-arrow" d="M100 112 q-8 40 -30 62" marker-end="url(#dgArrow2)"/>
    <text class="dg-note" x="52" y="182" text-anchor="middle">แรงดึง</text>
    <text class="dg-note" x="228" y="60" text-anchor="middle">หนีบที่ริมฝีปากบน</text>
    <text class="dg-note" x="228" y="78" text-anchor="middle">ตำแหน่ง 10 และ 2 นาฬิกา</text>
    <text class="dg-note dg-strong" x="228" y="108" text-anchor="middle">ดึงรั้งค้างไว้</text>
    <text class="dg-note" x="228" y="126" text-anchor="middle">ตลอดการสอดเครื่องมือ</text>
  </g>
  <defs>
    <marker id="dgArrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path class="dg-arrowhead" d="M0 0 L10 5 L0 10 z"/>
    </marker>
  </defs>
</svg>`;

/* การวัดความลึกโพรงมดลูก */
DIAGRAMS["sounding"] = `
<svg viewBox="0 0 320 200" role="img" aria-label="การวัดความลึกโพรงมดลูกด้วย uterine sound ค่าปกติ 6 ถึง 9 เซนติเมตร">
  <g class="dg">
    <path class="dg-organ" d="M96 62 q-14 -34 28 -44 q46 -10 62 26 q12 30 -18 46 l-30 16 l-30 -20 z"/>
    <path class="dg-cavity" d="M112 60 q26 -22 60 4 l-30 40 z"/>
    <path class="dg-cervix" d="M128 106 l20 40 q4 10 -8 14 q-14 4 -20 -8 l-14 -34 z"/>
    <path class="dg-tool" d="M124 178 q4 -34 16 -58 q10 -22 20 -46"/>
    <circle class="dg-toolTip" cx="160" cy="74" r="4"/>
    <line class="dg-measure" x1="196" y1="74" x2="196" y2="152"/>
    <line class="dg-measure" x1="188" y1="74" x2="204" y2="74"/>
    <line class="dg-measure" x1="188" y1="152" x2="204" y2="152"/>
    <text class="dg-note dg-strong" x="252" y="106" text-anchor="middle">6–9 ซม.</text>
    <text class="dg-note" x="252" y="124" text-anchor="middle">ยอดมดลูก → external os</text>
    <text class="dg-warn" x="160" y="194" text-anchor="middle">&lt; 6 ซม. = ไม่ใส่ &nbsp;|&nbsp; &gt; 9 ซม. = หาสาเหตุ</text>
  </g>
</svg>`;

/* การตั้ง blue flange */
DIAGRAMS["flange"] = `
<svg viewBox="0 0 330 170" role="img" aria-label="การตั้งตำแหน่ง blue flange ให้เท่ากับความลึกโพรงมดลูก และหันระนาบขนานกับแขนห่วง">
  <g class="dg">
    <line class="dg-tube" x1="40" y1="60" x2="250" y2="60"/>
    <path class="dg-iud" d="M56 60 l0 -22 M56 60 l0 22"/>
    <path class="dg-iud" d="M50 38 l12 0 M50 82 l12 0"/>
    <rect class="dg-flange" x="150" y="42" width="9" height="36" rx="2"/>
    <line class="dg-measure" x1="46" y1="104" x2="154" y2="104"/>
    <line class="dg-measure" x1="46" y1="96" x2="46" y2="112"/>
    <line class="dg-measure" x1="154" y1="96" x2="154" y2="112"/>
    <text class="dg-note dg-strong" x="100" y="126" text-anchor="middle">= ความลึกที่วัดได้จาก sound</text>
    <text class="dg-note" x="256" y="46" text-anchor="start">ด้ามจับ</text>
    <text class="dg-note" x="164" y="34" text-anchor="start">flange</text>
    <text class="dg-note" x="30" y="34" text-anchor="middle">แขนห่วง</text>
    <text class="dg-note dg-strong" x="165" y="152" text-anchor="middle">ระนาบ flange ต้องขนานกับแขนห่วง (แนวนอน)</text>
  </g>
</svg>`;

/* Withdrawal technique 3 จังหวะ */
DIAGRAMS["withdrawal"] = `
<svg viewBox="0 0 360 210" role="img" aria-label="ลำดับสามจังหวะของ withdrawal technique">
  <g class="dg">
    <g>
      <text class="dg-title" x="60" y="18" text-anchor="middle">1. ถอยท่อใส่</text>
      <path class="dg-organ" d="M20 44 q40 -22 80 0 q10 44 -40 62 q-50 -18 -40 -62 z"/>
      <line class="dg-tube" x1="60" y1="130" x2="60" y2="62"/>
      <line class="dg-rod" x1="60" y1="140" x2="60" y2="52"/>
      <path class="dg-iud" d="M42 56 l36 0"/>
      <path class="dg-arrow" d="M78 74 L78 104" marker-end="url(#dgArrow3)"/>
      <text class="dg-note" x="60" y="168" text-anchor="middle">จับแท่งดันนิ่ง</text>
      <text class="dg-note" x="60" y="184" text-anchor="middle">ดึงท่อลง 1–1.5 ซม.</text>
      <text class="dg-note" x="60" y="200" text-anchor="middle">แขนกางออก</text>
    </g>
    <g transform="translate(120,0)">
      <text class="dg-title" x="60" y="18" text-anchor="middle">2. ดันชิดยอดมดลูก</text>
      <path class="dg-organ" d="M20 44 q40 -22 80 0 q10 44 -40 62 q-50 -18 -40 -62 z"/>
      <line class="dg-tube" x1="60" y1="130" x2="60" y2="54"/>
      <line class="dg-rod" x1="60" y1="140" x2="60" y2="52"/>
      <path class="dg-iud" d="M40 50 l40 0"/>
      <path class="dg-arrow" d="M82 96 L82 62" marker-end="url(#dgArrow3)"/>
      <text class="dg-note" x="60" y="168" text-anchor="middle">ดันท่อขึ้นเบา ๆ</text>
      <text class="dg-note" x="60" y="184" text-anchor="middle">ให้ห่วงชิดยอดโพรง</text>
    </g>
    <g transform="translate(240,0)">
      <text class="dg-title" x="60" y="18" text-anchor="middle">3. ถอดเครื่องมือ</text>
      <path class="dg-organ" d="M20 44 q40 -22 80 0 q10 44 -40 62 q-50 -18 -40 -62 z"/>
      <path class="dg-iud" d="M40 50 l40 0 M60 50 l0 34"/>
      <line class="dg-tube" x1="60" y1="130" x2="60" y2="96"/>
      <path class="dg-arrow" d="M84 108 L84 140" marker-end="url(#dgArrow3)"/>
      <text class="dg-note dg-strong" x="60" y="168" text-anchor="middle">ถอดแท่งดันก่อน</text>
      <text class="dg-note" x="60" y="184" text-anchor="middle">แล้วจึงถอนท่อใส่</text>
    </g>
  </g>
  <defs>
    <marker id="dgArrow3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path class="dg-arrowhead" d="M0 0 L10 5 L0 10 z"/>
    </marker>
  </defs>
</svg>`;
