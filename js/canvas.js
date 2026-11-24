import { state } from "./state.js";

export const canvas = document.getElementById('canvas');
export const ctx = canvas.getContext('2d');

// Schwarzer Bildschirm auf iPad Safari: clientWidth kann (kurzzeitig) 0/NaN sein,
// wenn das Layout nach dem Anzeigen des Spiels noch nicht fertig ist.
// canvas.width = 0 => Canvas bleibt schwarz/transparent, OHNE Fehlermeldung.
// Deshalb: immer definierte Groesse erzwingen (nie 0, nie NaN).
export function resizeCanvas(){
 state.dpr = Math.min(Number(window.devicePixelRatio) || 1, 2);
 state.W = Math.floor(canvas.clientWidth) || Math.floor(canvas.offsetWidth) || Math.floor(window.innerWidth) || 960;
 state.H = Math.floor(canvas.clientHeight) || Math.floor(canvas.offsetHeight) || Math.floor(window.innerHeight) || 540;
 if (!Number.isFinite(state.W) || state.W < 1) state.W = 960;
 if (!Number.isFinite(state.H) || state.H < 1) state.H = 540;
 canvas.width = Math.max(1, Math.floor(state.W * state.dpr));
 canvas.height = Math.max(1, Math.floor(state.H * state.dpr));
 ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0)
}
