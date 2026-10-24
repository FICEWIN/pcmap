'use strict';
// خريطة الكوكب — تطبيق دبابيس مستقل للعبتها The Planet Crafter (تصميم وكود خاص بنا)
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&','<':'<','>':'>','"':'"',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const CATS = {
  crate: { n: 'صناديق', c: '#e9a71d' },
  ore:   { n: 'معادن',  c: '#4aa3ff' },
  cave:  { n: 'مغاور',  c: '#b26cff' },
  base:  { n: 'قاعدة',  c: '#38d17f' },
  wreck: { n: 'حطام',   c: '#ff5f56' },
  other: { n: 'آخر',    c: '#9fb0c3' }
};

// ---------- الحالة والتخزين ----------
const DEF = { cal: null, pins: [], hidden: [], imgName: '', seq: 0 };
let S = load();
function load() {
  try {
    const d = JSON.parse(localStorage.getItem('pc_state') || 'null');
    if (d && Array.isArray(d.pins)) {
      if (!Array.isArray(d.hidden)) d.hidden = [];
      return d;
    }
  } catch {}
  return JSON.parse(JSON.stringify(DEF));
}
function save() { try { localStorage.setItem('pc_state', JSON.stringify(S)); } catch {} }

// قاعدة بيانات الصورة (IndexedDB)
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('pcmap', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('imgs');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbPut(rec) {
  try {
    const db = await idb();
    await new Promise((res, rej) => {
      const t = db.transaction('imgs', 'readwrite').objectStore('imgs').put(rec, 'map');
      t.onsuccess = res; t.onerror = () => rej(t.error);
    });
  } catch {}
}
async function idbGet() {
  try {
    const db = await idb();
    return await new Promise((res) => {
      const t = db.transaction('imgs').objectStore('imgs').get('map');
      t.onsuccess = () => res(t.result); t.onerror = () => res(null);
    });
  } catch { return null; }
}

// ---------- اللوحة والرؤية ----------
const cv = $('#cv'), ctx = cv.getContext('2d');
let img = null, iw = 0, ih = 0, needDraw = true;
let view = { s: 1, ox: 0, oy: 0 };
let mode = 'normal'; // normal | add | cal | measure
let selId = null;
let mPts = [];       // نقاط القياس
let calBackup = null;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  cv.width = Math.floor(cv.clientWidth * dpr);
  cv.height = Math.floor(cv.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  needDraw = true;
}
window.addEventListener('resize', resize);

function fitView() {
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!img || !w) return;
  const pad = 24;
  view.s = clamp(Math.min((w - pad * 2) / iw, (h - pad * 2) / ih), 0.05, 20);
  view.ox = (w - iw * view.s) / 2;
  view.oy = (h - ih * view.s) / 2;
  needDraw = true;
}

function loop() {
  if (needDraw) { needDraw = false; draw(); }
  requestAnimationFrame(loop);
}

// ---------- المعايرة (إحداثيات اللعبة) ----------
function calInfo() {
  const c = S.cal;
  if (!c || !c.done) return null;
  const mx = c.m2x - c.m1x, my = c.m2y - c.m1y;
  const dx = c.g1x - c.g2x, dz = c.g1z - c.g2z;
  let ax = null, ay = null, bx = 0, by = 0;
  if (Math.abs(mx) > 0.0001) { ax = dx / mx; bx = c.g1x - ax * c.m1x; }
  if (Math.abs(my) > 0.0001) { ay = dz / my; by = c.g1z - ay * c.m1y; }
  if (ax == null && ay == null) return null;
  if (ax == null) ax = ay;
  if (ay == null) ay = ax;
  return { ax, ay, bx, by };
}
function mapToGame(lx, ly) {
  const ci = calInfo();
  if (!ci) return null;
  return { x: lx * ci.ax + ci.bx, z: ly * ci.ay + ci.by };
}
function gameToMap(gx, gz) {
  const ci = calInfo();
  if (!ci) return null;
  return { x: (gx - ci.bx) / ci.ax, y: (gz - ci.by) / ci.ay };
}
const fmtN = n => (Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(1));

function draw() {
  const w = cv.clientWidth, h = cv.clientHeight;
  ctx.clearRect(0, 0, w, h);
  const gs = 120;
  ctx.strokeStyle = 'rgba(120,170,200,.07)';
  ctx.lineWidth = 1;
  for (let x = Math.ceil(view.ox / gs) * gs; x < w; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = Math.ceil(view.oy / gs) * gs; y < h; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  if (img) {
    ctx.drawImage(img, view.ox, view.oy, iw * view.s, ih * view.s);
    ctx.strokeStyle = 'rgba(255,122,61,.35)';
    ctx.strokeRect(view.ox - .5, view.oy - .5, iw * view.s + 1, ih * view.s + 1);
  }
  if (mode === 'measure' && mPts.length === 2) {
    const a = mToS(mPts[0]), b = mToS(mPts[1]);
    ctx.strokeStyle = '#ff7a3d'; ctx.setLineDash([6, 5]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.setLineDash([]);
  }
  const q = ($('#search').value || '').trim().toLowerCase();
  for (const p of S.pins) {
    if (S.hidden.includes(p.cat)) continue;
    if (q && !(p.name + ' ' + (p.note || '') + ' ' + (CATS[p.cat] || CATS.other).n).toLowerCase().includes(q)) continue;
    const sp = mToS({ x: p.px, y: p.py });
    const r = clamp(5 + 3 * Math.sqrt(view.s), 7, 14);
    if (sp.x < -40 || sp.y < -40 || sp.x > w + 40 || sp.y > h + 40) continue;
    ctx.beginPath(); ctx.arc(sp.x, sp.y, r, 0, 7);
    ctx.fillStyle = (CATS[p.cat] || CATS.other).c; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#050b12'; ctx.stroke();
    if (selId === p.id) { ctx.beginPath(); ctx.arc(sp.x, sp.y, r + 5, 0, 7); ctx.strokeStyle = '#ff7a3d'; ctx.lineWidth = 2.5; ctx.stroke(); }
    if (view.s > 1.4 || mode === 'measure') {
      ctx.font = '600 11px Segoe UI, Tahoma';
      ctx.textAlign = 'center';
      const tw = ctx.measureText(p.name).width + 8;
      ctx.fillStyle = 'rgba(3,10,16,.75)';
      ctx.fillRect(sp.x - tw / 2, sp.y + r + 3, tw, 15);
      ctx.fillStyle = '#fff';
      ctx.fillText(p.name, sp.x, sp.y + r + 14);
    }
  }
  if (mode === 'measure' && mPts.length === 2) {
    const a = mToS(mPts[0]), b = mToS(mPts[1]);
    const g1 = mapToGame(mPts[0].x, mPts[0].y), g2 = mapToGame(mPts[1].x, mPts[1].y);
    const label = (g1 && g2) ? fmtN(Math.hypot(g2.x - g1.x, g2.z - g1.z)) + ' م' : Math.round(Math.hypot(mPts[1].x - mPts[0].x, mPts[1].y - mPts[0].y)) + ' بكسل';
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 18;
    ctx.font = '900 13px Segoe UI, Tahoma';
    const tw = ctx.measureText(label).width + 12;
    ctx.fillStyle = '#ff7a3d'; ctx.fillRect(mx - tw / 2, my - 10, tw, 20);
    ctx.fillStyle = '#1c0f06'; ctx.textAlign = 'center'; ctx.fillText(label, mx, my + 4);
  }
  if (mode === 'cal' && S.cal && !S.cal.done && S.cal.m1x != null && S.cal.g1x != null) {
    dot(mToS({ x: S.cal.m1x, y: S.cal.m1y }), '#38d17f');
  }
  if (mode === 'cal' && S.cal && !S.cal.done && S.cal.m1x != null && S.cal.g1x == null) {
    dot(mToS({ x: S.cal.m1x, y: S.cal.m1y }), '#ff7a3d');
  }
}

function dot(p, color) {
  ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, 7);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = '#050b12'; ctx.stroke();
}

const sToM = (x, y) => ({ x: (x - view.ox) / view.s, y: (y - view.oy) / view.s });
const mToS = p => ({ x: p.x * view.s + view.ox, y: p.y * view.s + view.oy });

// ---------- الإدخال ----------
const ptrs = new Map();
let panLast = null, pinch0 = null;
let down0 = null, moved = false, pressTimer = null, dragPin = null, suppress = 0;

cv.addEventListener('wheel', e => {
  e.preventDefault();
  const r = cv.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  const k = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  const before = sToM(mx, my);
  view.s = clamp(view.s * k, 0.05, 40);
  view.ox = mx - before.x * view.s;
  view.oy = my - before.y * view.s;
  needDraw = true;
}, { passive: false });

cv.addEventListener('contextmenu', e => e.preventDefault());

cv.addEventListener('pointerdown', e => {
  try { cv.setPointerCapture(e.pointerId); } catch {}
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) {
    clearPress();
    const p = [...ptrs.values()];
    pinch0 = { d: Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y), s: view.s };
    panLast = null; down0 = null;
  } else if (ptrs.size === 1) {
    down0 = { x: e.clientX, y: e.clientY, t: Date.now() };
    moved = false; dragPin = null;
    const r = cv.getBoundingClientRect();
    const hit = hitPin(e.clientX - r.left, e.clientY - r.top);
    if (hit && mode === 'normal') dragPin = hit.id;
    if (e.pointerType !== 'mouse') {
      clearPress();
      pressTimer = setTimeout(() => {
        if (!moved && mode === 'normal' && !dragPin) {
          const mp = sToM(e.clientX - r.left, e.clientY - r.top);
          addPin(mp);
          suppress = Date.now();
        }
      }, 550);
    }
  }
});
function clearPress() { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } }

cv.addEventListener('pointermove', e => {
  const r = cv.getBoundingClientRect();
  updStatus(e.clientX - r.left, e.clientY - r.top);
  if (!ptrs.has(e.pointerId)) return;
  const prev = ptrs.get(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2 && pinch0) {
    const p = [...ptrs.values()];
    const d = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y);
    if (d < 5) return;
    const ns = clamp(pinch0.s * (d / pinch0.d), 0.05, 40);
    const cx = (p[0].x + p[1].x) / 2 - r.left, cy = (p[0].y + p[1].y) / 2 - r.top;
    const before = sToM(cx, cy);
    view.ox = cx - before.x * ns;
    view.oy = cy - before.y * ns;
    view.s = ns; needDraw = true;
    return;
  }
  const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
  if (down0 && Math.hypot(e.clientX - down0.x, e.clientY - down0.y) > 8) { moved = true; clearPress(); }
  if (dragPin != null && moved) {
    const mp = sToM(e.clientX - r.left, e.clientY - r.top);
    const pin = S.pins.find(p => p.id === dragPin);
    if (pin) { pin.px = mp.x; pin.py = mp.y; needDraw = true; }
  } else if (down0) {
    view.ox += dx; view.oy += dy; needDraw = true;
  }
});

cv.addEventListener('pointerup', e => {
  clearPress();
  const r = cv.getBoundingClientRect();
  ptrs.delete(e.pointerId);
  if (ptrs.size > 0) { down0 = null; pinch0 = null; return; }
  const dur = down0 ? Date.now() - down0.t : 999;
  const wasDragPin = dragPin; dragPin = null; pinch0 = null;
  try { cv.releasePointerCapture(e.pointerId); } catch {}
  if (moved) {
    if (wasDragPin != null) { save(); renderList(); }
    down0 = null; return;
  }
  if (suppress && Date.now() - suppress < 350) { down0 = null; return; }
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  if (mode === 'add') { addPin(sToM(sx, sy)); down0 = null; return; }
  if (mode === 'measure') {
    const mp = sToM(sx, sy);
    mPts = mPts.length >= 2 ? [mp] : mPts.concat([mp]);
    needDraw = true; down0 = null; return;
  }
  if (mode === 'cal') { calClick(sToM(sx, sy)); down0 = null; return; }
  const hit = hitPin(sx, sy);
  if (hit && dur < 450) { selId = hit.id; openPin(hit.id); needDraw = true; }
  down0 = null;
});

cv.addEventListener('pointercancel', e => {
  clearPress();
  ptrs.delete(e.pointerId);
  pinch0 = null; down0 = null; dragPin = null;
});

cv.addEventListener('dblclick', e => {
  if (mode !== 'normal') return;
  const r = cv.getBoundingClientRect();
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  if (hitPin(sx, sy)) return; // دوس على دبوس موجود لا يضيف دبوسا
  addPin(sToM(sx, sy));
});

function hitPin(sx, sy) {
  let best = null, bd = 1e9;
  for (const p of S.pins) {
    if (S.hidden.includes(p.cat)) continue;
    const sp = mToS({ x: p.px, y: p.py });
    const d = Math.hypot(sp.x - sx, sp.y - sy);
    const r = clamp(5 + 3 * Math.sqrt(view.s), 7, 14) + 4;
    if (d < r && d < bd) { bd = d; best = p; }
  }
  return best;
}

function addPin(mp) {
  if (!img) { toast('استورد صورة الخريطة أولا'); return; }
  const pin = { id: uid(), name: 'نقطة ' + (S.seq + 1), cat: 'other', note: '', px: +mp.x.toFixed(1), py: +mp.y.toFixed(1) };
  S.seq++; S.pins.push(pin);
  save(); selId = pin.id; needDraw = true; renderList(); openPin(pin.id);
  if (mode === 'add') { mode = 'normal'; $('#btnAdd').classList.remove('on'); }
}

// ---------- المعايرة ----------
function calClick(mp) {
  if (!S.cal || S.cal.done) {
    S.cal = { step: 1, m1x: mp.x, m1y: mp.y };
    calPrompt(
      'النقطة 1 من 2 — اكتب إحداثيات اللعبة (X و Z) لمكان النقطة المختارة على الصورة.',
      'اضغط النقطة الثانية على الخريطة'
    );
  } else if (S.cal.step === 2) {
    S.cal.m2x = mp.x; S.cal.m2y = mp.y;
    calPrompt(
      'النقطة 2 من 2 — اكتب إحداثيات اللعبة للنقطة الثانية.',
      'اكتب إحداثياتها ثم سجّل'
    );
  } else if (S.cal.step === 1 && S.cal.g1x != null) {
    S.cal = { step: 1, m1x: mp.x, m1y: mp.y }; // لم تسجل الأولى بعد
    calPrompt('النقطة 1 من 2 — اكتب إحداثيات اللعبة للنقطة المختارة.', '');
  } else {
    S.cal.m1x = mp.x; S.cal.m1y = mp.y;
    calPrompt('النقطة 1 من 2 — اكتب إحداثيات اللعبة للنقطة المختارة.', '');
  }
  needDraw = true;
}
function calPrompt(msg, next) {
  $('#calStep').textContent = msg;
  $('#calX').value = ''; $('#calZ').value = '';
  openModal('calModal');
  if (next) toast(next);
}
$('#calSave').onclick = () => {
  const gx = parseFloat($('#calX').value), gz = parseFloat($('#calZ').value);
  if (isNaN(gx) || isNaN(gz)) { toast('اكتب الإحداثيين'); return; }
  if (!S.cal || S.cal.m1x == null) return;
  if (S.cal.step === 1) {
    S.cal.g1x = gx; S.cal.g1z = gz; S.cal.step = 2;
    closeModal(true);
    toast('مرر المكان الثاني واضغط عليه');
  } else {
    S.cal.g2x = gx; S.cal.g2z = gz;
    S.cal.done = true; S.cal.step = 0;
    closeModal(true);
    save(); needDraw = true;
    const ci = calInfo();
    mode = 'normal'; $('#btnCal').classList.remove('on');
    toast('تمت المعايرة — ' + fmtN(Math.abs(ci.ax)) + 'م لكل بكسل أفقيا');
  }
};
$('#calSkip').onclick = () => {
  if (calBackup != null) S.cal = calBackup;
  else if (S.cal && !S.cal.done) S.cal = null;
  calBackup = null;
  closeModal(true);
  mode = 'normal'; $('#btnCal').classList.remove('on');
  toast('لغيت المعايرة');
};
$('#calReset').onclick = () => {
  S.cal = null;
  closeModal(true);
  toast('اضغط أول نقطة على الخريطة');
};

// ---------- قائمة النقاط ----------
function renderList() {
  const q = ($('#search').value || '').trim().toLowerCase();
  $('#cnt').textContent = S.pins.length;
  $('#chips').innerHTML = Object.entries(CATS).map(([k, o]) => {
    const n = S.pins.filter(p => p.cat === k).length;
    const off = S.hidden.includes(k);
    return `<button class="chip ${off ? 'off' : 'on'}" data-cat="${k}" style="color:${o.c}">${o.n} <span class="n">${n}</span></button>`;
  }).join('');
  const arr = S.pins.filter(p => !S.hidden.includes(p.cat))
    .filter(p => !q || (p.name + ' ' + (p.note || '')).toLowerCase().includes(q));
  $('#pinList').innerHTML = arr.reverse().map(p => {
    const g = mapToGame(p.px, p.py);
    const co = g ? `X ${fmtN(g.x)} — Z ${fmtN(g.z)}` : 'بدون معايرة';
    return `<div class="prow ${selId === p.id ? 'sel' : ''}" data-id="${p.id}">
      <span class="pdot" style="background:${(CATS[p.cat] || CATS.other).c}"></span>
      <div class="pmid"><b>${esc(p.name)}</b><small>${co}</small></div>
      <button class="pdelete" data-del="${p.id}">حذف</button>
    </div>`;
  }).join('') || '<p class="tiny" style="padding:.6rem">لا نقاط بعد — اضغط دبوسا على الخريطة أو زر دبوس ثم مكان.</p>';
}
$('#sidebar').addEventListener('click', e => {
  const del = e.target.closest('[data-del]');
  if (del) {
    S.pins = S.pins.filter(p => p.id !== del.dataset.del);
    if (selId === del.dataset.del) selId = null;
    save(); renderList(); needDraw = true;
    return;
  }
  const row = e.target.closest('.prow');
  if (row) {
    selId = row.dataset.id; renderList();
    const p = S.pins.find(x => x.id === selId);
    if (p) {
      view.ox = cv.clientWidth / 2 - p.px * view.s;
      view.oy = cv.clientHeight / 2 - p.py * view.s;
      needDraw = true;
      if (window.innerWidth <= 640) closeSidebar();
    }
  }
  const chip = e.target.closest('[data-cat]');
  if (chip) {
    const c = chip.dataset.cat;
    if (S.hidden.includes(c)) S.hidden = S.hidden.filter(x => x !== c); else S.hidden.push(c);
    save(); renderList(); needDraw = true;
  }
});
$('#search').addEventListener('input', renderList);

function toggleSidebar(force) {
  const sb = $('#sidebar');
  const show = force != null ? force : sb.hidden;
  if (show) {
    sb.style.top = document.getElementById('topbar').offsetHeight + 'px';
    renderList();
  }
  sb.hidden = !show;
}
const closeSidebar = () => toggleSidebar(false);
$('#btnList').onclick = () => toggleSidebar();
$('#sideClose').onclick = closeSidebar;

// ---------- نوافذ ----------
function openModal(id) {
  $('#afr').hidden = false;
  $$('.modal').forEach(m => m.style.display = 'none');
  $('#' + id).style.display = '';
}
function closeModal(keepCal) {
  $('#afr').hidden = true;
  if (!keepCal && S.cal && !S.cal.done) {
    if (calBackup != null) S.cal = calBackup;
    else S.cal = null;
    calBackup = null;
  }
  needDraw = true;
}
$('#afr').addEventListener('click', e => { if (e.target === $('#afr')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#afr').hidden) closeModal(); });

$('#pCat').innerHTML = Object.entries(CATS).map(([k, o]) => `<option value="${k}">${esc(o.n)}</option>`).join('');
let openPinId = null;
function openPin(id) {
  const p = S.pins.find(x => x.id === id);
  if (!p) return;
  openPinId = id;
  $('#pName').value = p.name;
  $('#pCat').value = p.cat;
  $('#pNote').value = p.note || '';
  const g = mapToGame(p.px, p.py);
  $('#pMeta').textContent = g ? `X ${fmtN(g.x)} — Z ${fmtN(g.z)}` : 'بكسل: ' + Math.round(p.px) + ',' + Math.round(p.py);
  openModal('pinModal');
  setTimeout(() => { $('#pName').focus(); try { $('#pName').select(); } catch {} }, 60);
}
$('#pSave').onclick = () => {
  const p = S.pins.find(x => x.id === openPinId);
  if (p) {
    p.name = $('#pName').value.trim() || p.name;
    p.cat = $('#pCat').value;
    p.note = $('#pNote').value.trim();
    save(); renderList(); needDraw = true;
  }
  closeModal();
};
$('#pDel').onclick = () => {
  S.pins = S.pins.filter(x => x.id !== openPinId);
  selId = null; save(); renderList(); needDraw = true; closeModal();
};

// ---------- إضافة بالإحداثيات ----------
$('#btnByCoord').onclick = () => {
  if (!calInfo()) { toast('عاير الإحداثيات أولا'); return; }
  $('#cName').value = ''; $('#cX').value = ''; $('#cZ').value = '';
  openModal('coordModal');
  setTimeout(() => $('#cX').focus(), 60);
};
$('#cAdd').onclick = () => {
  const gx = parseFloat($('#cX').value), gz = parseFloat($('#cZ').value);
  if (isNaN(gx) || isNaN(gz)) { toast('اكتب X و Z'); return; }
  const mp = gameToMap(gx, gz);
  if (!mp) { toast('المعايرة غير صالحة'); return; }
  addPinHard(mp, $('#cName').value.trim() || ('C ' + fmtN(gx) + ',' + fmtN(gz)));
  closeModal();
};
function addPinHard(mp, name) {
  if (!img) { toast('استورد صورة الخريطة أولا'); return; }
  S.pins.push({ id: uid(), name, cat: 'other', note: '', px: +mp.x.toFixed(1), py: +mp.y.toFixed(1) });
  S.seq++; save(); renderList(); needDraw = true;
}
$('#cCancel').onclick = () => closeModal();

// ---------- تصدير/استيراد ----------
$('#btnExport').onclick = () => {
  const data = { app: 'pcmap', ver: 1, cal: S.cal, pins: S.pins };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
  a.download = 'pcmap-points.json';
  a.click();
};
$('#btnImportPins').onclick = () => $('#pinsFile').click();
$('#pinsFile').onchange = e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || !Array.isArray(d.pins)) throw 0;
      if (d.cal && d.cal.done) S.cal = d.cal;
      let n = 0;
      for (const p of d.pins) {
        if (p && typeof p.px === 'number' && typeof p.py === 'number') {
          S.pins.push({ id: uid(), name: String(p.name || 'نقطة').slice(0, 40), cat: CATS[p.cat] ? p.cat : 'other', note: String(p.note || '').slice(0, 200), px: p.px, py: p.py });
          S.seq++; n++;
        }
      }
      save(); renderList(); needDraw = true;
      toast('أضفت ' + n + ' نقطة');
    } catch { toast('ملف غير صالح'); }
  };
  r.readAsText(f);
};

// ---------- صورة الخريطة ----------
async function loadImgRecord() {
  const rec = await idbGet();
  if (rec && rec.blob) await setMapImage(rec.blob, rec.name, false);
  else $('#empty').style.display = '';
}
async function setMapImage(blob, name, persist) {
  img = await blobToImg(blob);
  iw = img.naturalWidth; ih = img.naturalHeight;
  S.imgName = name || '';
  if (persist) await idbPut({ blob, name: name || '', ts: Date.now() });
  $('#empty').style.display = 'none';
  fitView();
  needDraw = true;
}
function blobToImg(blob) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = URL.createObjectURL(blob);
  });
}
$('#btnImg').onclick = () => $('#mapFile').click();
$('#btnEmptyImport').onclick = () => $('#mapFile').click();
$('#mapFile').onchange = e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (f) takeImage(f);
};
function takeImage(f) {
  if (!/^image\//.test(f.type)) { toast('اختر ملف صورة'); return; }
  setMapImage(f, f.name, true).then(() => toast('خريطة: ' + (f.name || 'جديدة')));
}
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) takeImage(f);
});

// ---------- أدوات ----------
$('#btnAdd').onclick = () => {
  mode = mode === 'add' ? 'normal' : 'add';
  $('#btnAdd').classList.toggle('on', mode === 'add');
  if (mode === 'add') toast('اضغط الموقع لوضع دبوس');
};
$('#btnMeasure').onclick = () => {
  mode = mode === 'measure' ? 'normal' : 'measure';
  mPts = [];
  $('#btnMeasure').classList.toggle('on', mode === 'measure');
  needDraw = true;
  if (mode === 'measure') toast('اختر نقطتين لقياس المسافة');
};
$('#btnCal').onclick = () => {
  if (mode === 'cal') {
    mode = 'normal'; $('#btnCal').classList.remove('on');
    if (S.cal && !S.cal.done) { if (calBackup != null) S.cal = calBackup; else S.cal = null; calBackup = null; }
    needDraw = true;
    return;
  }
  calBackup = S.cal;
  mode = 'cal';
  $('#btnCal').classList.add('on');
  if (calInfo()) {
    openModal('calModal');
    $('#calStep').textContent = 'المعايرة موجودة. لزيادة معايرة جديدة أعد الضغط على الخريطة أو استخدم زر إعادة الضبط.';
  } else toast('اضغط أول نقطة على الخريطة');
};
$('#btnUndo').onclick = () => {
  if (!S.pins.length) { toast('لا نقاط'); return; }
  const last = S.pins[S.pins.length - 1];
  S.pins.pop(); selId = null;
  save(); renderList(); needDraw = true;
  toast('حذفت: ' + last.name);
};

let tTimer = null, lastMX = null, lastMY = null;
function toast(t) {
  $('#status').textContent = t;
  clearTimeout(tTimer);
  tTimer = setTimeout(() => updStatus(), 2100);
}
function updStatus(sx, sy) {
  if (sx == null) {
    if (lastMX == null) { $('#status').textContent = ''; return; }
    sx = lastMX; sy = lastMY;
  }
  lastMX = sx; lastMY = sy;
  const mp = sToM(sx, sy);
  const g = mapToGame(mp.x, mp.y);
  $('#status').textContent = g ? `X ${fmtN(g.x)} · Z ${fmtN(g.z)}` : `${Math.round(mp.x)}, ${Math.round(mp.y)}`;
}

// ---------- التثبيت والخدمة ----------
(function () {
  let deferred = null;
  const ib = $('#btnInstall');
  const st = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (ib && st) ib.hidden = true;
  window.addEventListener('beforeinstallprompt', e => { if (st) return; e.preventDefault(); deferred = e; ib.hidden = false; });
  if (ib) ib.onclick = async () => { if (!deferred) return; deferred.prompt(); try { await deferred.userChoice; } catch {} deferred = null; ib.hidden = true; };
})();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

// ---------- التشغيل ----------
resize();
renderList();
loadImgRecord();
requestAnimationFrame(loop);
