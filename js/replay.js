/* REPLAY-VIDEOTHEK (Hugo #59): UNENDLICH viele Sieges-Videos!
   Jeder Kampf wird automatisch mitaufgenommen (nur der Sieg wird gesichert),
   und JEDES Sieges-Video bleibt — nicht mehr nur das letzte pro Boss. Die
   Lobby listet alle mit Boss-Name + Datum, jedes mit Loesch-Button (Papierkorb),
   damit Hugo den Speicher selbst verwalten kann. Datenbank: IndexedDB (v2,
   migriert automatisch die alten Einzel-Videos), Fallback: Sitzungs-Speicher.
   Alles feature-detected: Ohne MediaRecorder/captureStream bleibt das Spiel
   unberuehrt. */
import { $ } from "./utils.js";

const MIME_CANDIDATES = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

function pickMime() {
 if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
 for (const m of MIME_CANDIDATES) { try { if (MediaRecorder.isTypeSupported(m)) return m } catch (e) { /* weiterprobieren */ } }
 return ''
}

/* Lazy geprueft (nicht beim Import eingefroren): Test-Stubs und spaet
   geladene Browser bekommen so eine faire Chance */
export function replaySupported() {
 return typeof MediaRecorder !== 'undefined'
 && typeof MediaRecorder.isTypeSupported === 'function'
 && typeof Blob !== 'undefined'
}

let rec = null, chunks = [], activeBoss = '', activeStream = null;

/* IDB kann im privaten Safari haengen — immer mit Timeout race'n */
function withTimeout(p, ms) {
 return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
}

/* Fallback-Speicher (Sitzung), falls indexedDB fehlt: boss -> [entries] */
const memStore = new Map();

function memAdd(entry) {
 if (!memStore.has(entry.boss)) memStore.set(entry.boss, []);
 memStore.get(entry.boss).push(entry)
}
function memRemove(id) {
 for (const [boss, arr] of memStore) {
  const i = arr.findIndex(e => e.id === id);
  if (i >= 0) { arr.splice(i, 1); if (!arr.length) memStore.delete(boss); return }
 }
}
function memAll() {
 const all = [];
 for (const arr of memStore.values()) all.push(...arr);
 return all.sort((a, b) => (b.ts || 0) - (a.ts || 0))
}

function openDb() {
 return new Promise((resolve, reject) => {
  if (typeof indexedDB === 'undefined') { reject(new Error('no idb')); return }
  const req = indexedDB.open('bossrushReplays', 2); /* v2: VIDEOTHEK (Hugo #59) */
  req.onupgradeneeded = () => {
   const db = req.result, tx = req.transaction;
   try {
    if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos', { keyPath: 'id' });
    /* Migration v1 -> v2: das alte "letztes-Video-pro-Boss"-Fach umziehen */
    if (db.objectStoreNames.contains('wins')) {
     const gr = tx.objectStore('wins').getAll();
     gr.onsuccess = () => {
      try {
       const vs = tx.objectStore('videos');
       for (const w of (gr.result || [])) if (w && w.blob) vs.put({ id: w.boss + '-' + (w.ts || 0), boss: w.boss, blob: w.blob, ts: w.ts || 0 });
       db.deleteObjectStore('wins')
      } catch (e) { /* Migration ist best effort */ }
     }
    }
   } catch (e) { try { reject(e) } catch (e2) { } }
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error || new Error('idb error'))
 })
}

async function saveReplay(boss, blob) {
 const entry = { id: boss + '-' + Date.now(), boss, blob, ts: Date.now() };
 memAdd(entry); /* immer: Fallback + Sofort-Verfuegbarkeit */
 try {
  const db = await withTimeout(openDb(), 800);
  await withTimeout(new Promise((res, rej) => {
   const tx = db.transaction('videos', 'readwrite');
   tx.objectStore('videos').put(entry); /* UNENDLICH viele: jedes Video bleibt */
   tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error)
  }), 800)
 } catch (e) { /* Sitzungs-Speicher reicht (Quota etc.) */ }
 refreshReplayUI()
}

export async function listReplays() {
 try {
  const db = await withTimeout(openDb(), 800);
  const rows = await withTimeout(new Promise((res, rej) => {
   const tx = db.transaction('videos', 'readonly');
   const rq = tx.objectStore('videos').getAll();
   rq.onsuccess = () => res(rq.result || []); rq.onerror = () => rej(rq.error)
  }), 800);
  /* DB + Sitzungs-Videos (falls IDB schief lief) zusammen, neueste zuerst */
  const seen = new Set((rows || []).map(r => r.id));
  return [...(rows || []), ...memAll().filter(e => !seen.has(e.id))].sort((a, b) => (b.ts || 0) - (a.ts || 0))
 } catch (e) {
  return memAll()
 }
}

export async function replayPlay(id) {
 /* Kein autoplay (Hugo #58): Overlay + Quelle SOFORT, Play tippt der Nutzer */
 try {
  const view = $('replayView'), video = $('replayVideo');
  if (!view || !video) return;
  let entry = memAll().find(e => e.id === id) || null;
  if (!entry) {
   try { entry = await withTimeout(loadEntryFromDb(id), 900) } catch (e) { /* dann halt nichts */ }
  }
  if (!entry || !entry.blob) return;
  try { if (video.src) URL.revokeObjectURL(video.src) } catch (e) { }
  video.src = URL.createObjectURL(entry.blob);
  view.style.display = 'flex'
 } catch (e) { /* Video-Anzeige darf niemals das Spiel kaputtmachen */ }
}

async function loadEntryFromDb(id) {
 const db = await openDb();
 return new Promise((res, rej) => {
  const tx = db.transaction('videos', 'readonly');
  const rq = tx.objectStore('videos').get(id);
  rq.onsuccess = () => res(rq.result || null); rq.onerror = () => rej(rq.error)
 })
}

/* VIDEO-PAPIERKORB (Hugo #59): ein Video aus der VIDEOTHEK loeschen */
export async function deleteReplay(id) {
 memRemove(id);
 try {
  const db = await withTimeout(openDb(), 800);
  await withTimeout(new Promise((res, rej) => {
   const tx = db.transaction('videos', 'readwrite');
   tx.objectStore('videos').delete(id);
   tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error)
  }), 800)
 } catch (e) { /* Sitzungs-Speicher ist schon sauber */ }
 refreshReplayUI()
}

export function replayClose() {
 const view = $('replayView'), video = $('replayVideo');
 if (video) { try { video.pause() } catch (e) { } }
 if (view) view.style.display = 'none'
}

/* Aufnahme starten: bei jedem Kampfstart (startGame). Nur der SIEG wird
   gespeichert, Niederlagen/Discards landen im Papierkorb. */
export function replayStart(boss, canvas) {
 replayDiscard();
 if (!replaySupported() || !canvas || typeof canvas.captureStream !== 'function') return;
 try {
  const mime = pickMime();
  /* ANTI-LAG (Hugo #58): 12 fps + schlanke Bitrate — Aufnahme darf dem Kampf
     niemals spuerbar Performance kosten */
  const stream = canvas.captureStream(12);
  activeStream = stream;
  rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 1200000 } : undefined);
  chunks = []; activeBoss = boss || 'boss';
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data) };
  rec.onerror = () => { rec = null };
  rec.start(1500)
 } catch (e) { rec = null; activeBoss = '' }
}

function releaseStream() {
 try { if (activeStream) activeStream.getTracks().forEach(t => t.stop()) } catch (e) { /* egal */ }
 activeStream = null
}

/* Sieg: Aufnahme anhalten und als Sieges-Video sichern */
export function replayWin() {
 if (!rec) { activeBoss = ''; return }
 const boss = activeBoss, recorder = rec;
 rec = null; activeBoss = '';
 try {
  recorder.onstop = () => {
   try {
    if (!chunks.length) return;
    const blob = new Blob(chunks, { type: recorder.mimeType || 'video/mp4' });
    saveReplay(boss, blob)
   } catch (e) { /* speichern darf nicht explodieren */ }
  };
  recorder.stop()
 } catch (e) { rec = null }
 releaseStream()
}

/* Niederlage/Neustart: Aufnahme verwerfen */
export function replayDiscard() {
 if (rec) { try { rec.onstop = null; rec.stop() } catch (e) { } }
 rec = null; chunks = []; activeBoss = '';
 releaseStream()
}

const REPLAY_NAMES = { shadow: 'TUTORIAL', slime: 'SLIME', dragon: 'DRACHE', gunball: 'GUNBALL', snake: 'SNAKE', plant: 'PLANT' };

function fmtTs(ts) {
 try {
  const d = new Date(ts), p = n => String(n).padStart(2, '0');
  return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '. ' + p(d.getHours()) + ':' + p(d.getMinutes())
 } catch (e) { return '' }
}

/* VIDEOTHEK (Hugo #59): ALLE Sieges-Videos, neueste zuerst, mit Loesch-Button.
   Neu bauen nur bei echter Aenderung (kein DOM-Churn). */
let lastSig = '';
export async function refreshReplayUI() {
 const box = $('replayBox');
 if (!box) return;
 const list = await listReplays();
 const sig = list.map(r => r.id).join(',');
 if (sig === lastSig) return;
 lastSig = sig;
 try {
  while (box.firstChild) box.removeChild(box.firstChild);
  for (const r of list) {
   const row = document.createElement('div'); row.className = 'replayRow';
   const btn = document.createElement('button');
   btn.className = 'replayBtn';
   btn.textContent = '\u25B6 ' + (REPLAY_NAMES[r.boss] || String(r.boss).toUpperCase()) + (r.ts ? ' \u00b7 ' + fmtTs(r.ts) : '');
   const id = r.id;
   btn.onclick = () => replayPlay(id);
   row.appendChild(btn);
   const del = document.createElement('button');
   del.className = 'replayDel';
   del.textContent = '\u2716';
   del.title = 'Video l\u00f6schen';
   del.onclick = () => deleteReplay(id);
   row.appendChild(del);
   box.appendChild(row)
  }
  if (!list.length) {
   const hint = document.createElement('div');
   hint.className = 'replayHint';
   hint.textContent = 'Besiege einen Boss \u2014 sein Sieges-Video erscheint hier automatisch!';
   box.appendChild(hint)
  }
 } catch (e) { /* Lobby-Hilfe darf nie blockieren */ }
}
