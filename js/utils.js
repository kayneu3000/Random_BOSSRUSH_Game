import { MAP } from "./config.js";

export const $ = id => document.getElementById(id);

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function rayMapLength(x, y, a) {
 const dx = Math.cos(a), dy = Math.sin(a);
 let dist = Infinity;
 if (dx > 0) dist = Math.min(dist, (MAP.w - x) / dx);
 if (dx < 0) dist = Math.min(dist, (0 - x) / dx);
 if (dy > 0) dist = Math.min(dist, (MAP.h - y) / dy);
 if (dy < 0) dist = Math.min(dist, (0 - y) / dy);
 return Math.max(0, dist);
}

export function pointSegmentDistance(px, py, x1, y1, x2, y2) {
 const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy;
 const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (l || 1)));
 return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
