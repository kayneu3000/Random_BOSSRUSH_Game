/* REPLAY-VIDEOS (Hugo #57): Jeder Kampf wird automatisch mitaufgegenommen.
   Gespeichert wird NUR der Versuch, in dem du den Boss besiegst — pro Boss das
   letzte Sieges-Video. In der Lobby abspielbar ("DEINE SIEGE ALS VIDEO").
   Alles feature-detected: Ohne MediaRecorder/captureStream (alte Safari)
   bleibt das Spiel unberuehrt, ohne indexedDB landen die Videos nur im
   Sitzungs-Speicher. */
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

let rec = null, chunks = [], activeBoss = '';

/* Fallback-Speicher (Sitzung), falls indexedDB fehlt */
const memStore = new Map(); // boss -> { blob, ts }

function openDb() {
 return new Promise((resolve, reject) => {
  if (typeof indexedDB === 'undefined') { reject(new Error('no idb')); return }
  const req = indexedDB.open('bossrushReplays', 1);
  req.onupgradeneeded = () => { try { req.result.createObjectStore('wins', { keyPath: 'boss' }) } catch (e) { reject(e); return } };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error || new Error('idb error'))
 })
}

async function saveReplay(boss, blob) {
 const entry = { boss, blob, ts: Date.now() };
 memStore.set(boss, entry); /* immer: Fallback + Sofort-Verfuegbarkeit */
 try {
  const db = await openDb();
  await new Promise((res, rej) => {
   const tx = db.transaction('wins', 'readwrite');
   tx.objectStore('wins').put(entry);
   tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error)
  })
 } catch (e) { /* Sitzungs-Speicher reicht */ }
 refreshReplayUI()
}

export async function listReplays() {
 try {
  const db = await openDb();
  return await new Promise((res, rej) => {
   const tx = db.transaction('wins', 'readonly');
   const rq = tx.objectStore('wins').getAll();
   rq.onsuccess = () => res(rq.result || []); rq.onerror = () => rej(rq.error)
  })
 } catch (e) {
  return [...memStore.values()]
 }
}

export async function replayPlay(boss) {
 try {
  let blob = null;
  try {
   const db = await openDb();
   blob = await new Promise((res, rej) => {
    const tx = db.transaction('wins', 'readonly');
    const rq = tx.objectStore('wins').get(boss);
    rq.onsuccess = () => res(rq.result && rq.result.blob); rq.onerror = () => rej(rq.error)
   })
  } catch (e) { /* Fallback unten */ }
  if (!blob) blob = memStore.get(boss) && memStore.get(boss).blob;
  if (!blob) return;
  const view = $('replayView'), video = $('replayVideo');
  if (!view || !video) return;
  if (video.src) { try { URL.revokeObjectURL(video.src) } catch (e) { } }
  video.src = URL.createObjectURL(blob);
  view.style.display = 'flex';
  try { await video.play() } catch (e) { /* Nutzer tippt Play selbst */ }
 } catch (e) { /* Video-Anzeige darf niemals das Spiel kaputtmachen */ }
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
  const stream = canvas.captureStream(30);
  rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 2500000 } : undefined);
  chunks = []; activeBoss = boss || 'boss';
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data) };
  rec.onerror = () => { rec = null };
  rec.start(1500)
 } catch (e) { rec = null; activeBoss = '' }
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
}

/* Niederlage/Neustart: Aufnahme verwerfen */
export function replayDiscard() {
 if (rec) { try { rec.onstop = null; rec.stop() } catch (e) { } }
 rec = null; chunks = []; activeBoss = ''
}

const REPLAY_NAMES = { shadow: 'TUTORIAL', slime: 'SLIME', dragon: 'DRACHE', gunball: 'GUNBALL', snake: 'SNAKE', plant: 'PLANT' };

/* Lobby-Liste "DEINE SIEGE ALS VIDEO" neu bauen (nur bei Aenderung) */
let lastSig = '';
export async function refreshReplayUI() {
 const box = $('replayBox');
 if (!box) return;
 const list = await listReplays();
 const sig = list.map(r => r.boss).sort().join(',');
 if (sig === lastSig) return;
 lastSig = sig;
 try {
  while (box.firstChild) box.removeChild(box.firstChild);
  for (const r of list) {
   const btn = document.createElement('button');
   btn.className = 'replayBtn';
   btn.textContent = '\u25B6 VIDEO: ' + (REPLAY_NAMES[r.boss] || String(r.boss).toUpperCase());
   btn.onclick = () => replayPlay(r.boss);
   box.appendChild(btn)
  }
  if (!list.length) {
   const hint = document.createElement('div');
   hint.className = 'replayHint';
   hint.textContent = 'Besiege einen Boss \u2014 sein Sieges-Video erscheint hier automatisch!';
   box.appendChild(hint)
  }
 } catch (e) { /* Lobby-Hilfe darf nie blockieren */ }
}
