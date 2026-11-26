import { state } from "./state.js";

export const canvas = document.getElementById('canvas');
export let ctx = canvas.getContext('2d');
/* Lobby-Vorschauen (Hugo: echte Boss-Bilder) zeichnen kurz auf eine andere
   Canvas. export let = Live-Binding: alle Importeure sehen den Tausch. */
const mainCtx = ctx;
export function beginPreviewCtx(c){ ctx = c }
export function endPreviewCtx(){ ctx = mainCtx }

// Schwarzer Bildschirm auf iPad Safari: clientWidth kann (kurzzeitig) 0/NaN sein,
// wenn das Layout nach dem Anzeigen des Spiels noch nicht fertig ist.
// canvas.width = 0 => Canvas bleibt schwarz/transparent, OHNE Fehlermeldung.
// Deshalb: immer definierte Groesse erzwingen (nie 0, nie NaN).
// SAFARI-PLAN C: dpr=1 halbiert die Bitmap (1180x720 statt 2360x1440).
// Der schwarze Bildschirm blieb trotz heilem Canvas-Speicher und ohne JS-Fehler,
// also entlasten wir die iPad-GPU/Compositor-Seite maximal.
export function resizeCanvas(){
 state.dpr = 1; // Plan C: immer 1 statt window.devicePixelRatio (max 2)
 state.W = Math.floor(canvas.clientWidth) || Math.floor(canvas.offsetWidth) || Math.floor(window.innerWidth) || 960;
 state.H = Math.floor(canvas.clientHeight) || Math.floor(canvas.offsetHeight) || Math.floor(window.innerHeight) || 540;
 if (!Number.isFinite(state.W) || state.W < 1) state.W = 960;
 if (!Number.isFinite(state.H) || state.H < 1) state.H = 540;
 canvas.width = Math.max(1, Math.floor(state.W * state.dpr));
 canvas.height = Math.max(1, Math.floor(state.H * state.dpr));
 ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0)
}
