import { state } from "./state.js";

export const canvas = document.getElementById('canvas');
export const ctx = canvas.getContext('2d');

let lastBW = 0, lastBH = 0;

// Schwarzer Bildschirm auf iPad Safari: clientWidth kann (kurzzeitig) 0/NaN sein,
// wenn das Layout nach dem Anzeigen des Spiels noch nicht fertig ist.
// canvas.width = 0 => Canvas bleibt schwarz/transparent, OHNE Fehlermeldung.
// Deshalb: immer definierte Groesse erzwingen (nie 0, nie NaN) und die
// Canvas-Bitmap nur NEU anlegen, wenn sich die Groesse wirklich aendert
// (jede Neuanlage loescht kurz den Inhalt -> Flackern beim Kampfstart).
export function resizeCanvas(){
 state.dpr = Math.min(Number(window.devicePixelRatio) || 1, 2);
 state.W = Math.floor(canvas.clientWidth) || Math.floor(canvas.offsetWidth) || Math.floor(window.innerWidth) || 960;
 state.H = Math.floor(canvas.clientHeight) || Math.floor(canvas.offsetHeight) || Math.floor(window.innerHeight) || 540;
 if (!Number.isFinite(state.W) || state.W < 1) state.W = 960;
 if (!Number.isFinite(state.H) || state.H < 1) state.H = 540;
 const bw = Math.max(1, Math.floor(state.W * state.dpr));
 const bh = Math.max(1, Math.floor(state.H * state.dpr));
 if (bw !== lastBW || bh !== lastBH || canvas.width !== bw || canvas.height !== bh) {
  canvas.width = bw; canvas.height = bh;
  lastBW = bw; lastBH = bh;
 }
 ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0)
}

// Zwangszuruecksetzen der Canvas-Bitmap: iPad-Safari kann die Zeichenflaeche
// unter GPU-Speicherdruck stilllegen (Bild schwarz, JS laeuft weiter).
// Neu anlegen erzwingt frischen Speicher — das Spiel malt naechste Frame sofort weiter.
export function forceCanvasRealloc(){
 try{
  const bw=Math.max(1,Math.floor((state.W||960)*(state.dpr||1)));
  const bh=Math.max(1,Math.floor((state.H||540)*(state.dpr||1)));
  canvas.width=1;canvas.height=1;
  canvas.width=bw;canvas.height=bh;
  lastBW=0;lastBH=0
 }catch(e){}
}

// DOM-Schubs: Canvas aus dem DOM nehmen und an exakt derselben Stelle wieder
// einhaengen. Das zwingt iPad-Safari, die Compositing-Schicht neu zu bauen —
// gegen den Bug "Canvas-Inhalt alive, Bildschirm trotzdem schwarz".
export function repairCanvas(){
 try{
  const p=canvas.parentNode;
  if(p&&p.removeChild&&canvas.nextSibling!==undefined){
   const ref=canvas.nextSibling;
   p.removeChild(canvas);
   p.insertBefore(canvas,ref)
  }
 }catch(e){/* Reparatur darf niemals abstuerzen */}
 forceCanvasRealloc()
}
