import { state } from "./state.js";

export const canvas = document.getElementById('canvas');
export const ctx = canvas.getContext('2d');

export function resizeCanvas(){
 state.dpr = Math.min(devicePixelRatio || 1, 2);
 state.W = canvas.clientWidth; state.H = canvas.clientHeight;
 canvas.width = state.W * state.dpr; canvas.height = state.H * state.dpr;
 ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0)
}
