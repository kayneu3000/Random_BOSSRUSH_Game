/* SLIME-PARKOUR (Hugo #60): "man kann (falls man slime besiegt) slimes, pakour
   fuer langeweile, spiel, spielen." Ein spannender Parcours im Slime-Arena-Look
   — man spielt den SLIME (in klein): Springen, Federn, kruemelnde Plattformen,
   Saegeblatter, Stacheln, Checkpoints und ein Ziel. Touch-Buttons (iPad!) UND
   Tastatur. Die Logik (createParkourRun/parkourStep) ist DOM-frei testbar. */
import { sfx } from "./audio.js";

export const PK_GRAV = 2400;
export const PK_MOVE = 360;
export const PK_JUMP = 900;
export const PK_W = 4800;
export const PK_H = 1600;

/* ---------- LEVEL: EIN spannender Parcours (nicht mehr Stufen — besser!) ---------- */
function buildLevel() {
 const P = [];
 const solid = (x, y, w, h) => P.push({ kind: 'solid', x, y, w, h });
 const crumble = (x, y, w) => P.push({ kind: 'crumble', x, y, w, h: 26, crumbleT: 0, gone: 0 });
 const spring = (x, y) => P.push({ kind: 'spring', x, y, w: 64, h: 22 });
 const spike = (x, y, w) => P.push({ kind: 'spike', x, y, w, h: 26 });
 const saw = (x, y, ax, ay, range, spd, dir) => P.push({ kind: 'saw', x, y, r: 34, ax, ay, range, spd, dir: dir || 'v', ph: Math.random() * 6.28 });
 const check = (x, y) => P.push({ kind: 'check', x, y, w: 30, h: 90, active: false });

 /* Start-Plateau */
 solid(0, 1240, 460, 360);
 /* Luecke + erste Spruenge */
 solid(560, 1240, 220, 360);
 solid(900, 1130, 180, 470);
 spring(940, 1108); /* Feder auf den hohen Balken */
 solid(1120, 900, 200, 30);
 /* Schwebende Fahre */
 P.push({ kind: 'move', x: 1400, y: 880, w: 150, h: 26, ax: 1400, ay: 880, dx: 330, dy: 0, range: 330, spd: 1.1, ph: 0 });
 /* Kruemel-Bruecke ueber dem Abgrund */
 crumble(1830, 980, 120); crumble(1990, 980, 120); crumble(2150, 980, 120);
 /* CHECKPOINT 1 + fester Boden */
 solid(2340, 1240, 420, 360);
 check(2400, 1150);
 /* Saegeblatt patrouilliert vertikal */
 saw(2860, 1100, 2860, 880, 340, 1.6);
 /* Treppe hoch */
 solid(2560, 1080, 160, 30); solid(2800, 940, 160, 30); solid(3040, 800, 160, 30);
 /* Senkrechte Fahre */
 P.push({ kind: 'move', x: 3280, y: 700, w: 140, h: 26, ax: 3280, ay: 520, dx: 0, dy: 1, range: 380, spd: 1.3, ph: 0 });
 /* Hoher Steg mit Stacheln in der Mitte */
 solid(3560, 660, 420, 30);
 spike(3680, 634, 180);
 /* Feder zur Spitze */
 spring(3920, 638);
 solid(4060, 400, 220, 30);
 /* CHECKPOINT 2 + Finale: zwei Saegeblaetter im Wechsel */
 solid(3560, 1240, 1240, 360);
 check(3640, 1150);
 saw(4100, 1200, 3960, 1140, 280, 2.0, 'h');
 saw(4420, 1200, 4300, 1140, 280, 2.0, 'h');
 solid(4180, 1010, 130, 26); solid(4400, 900, 130, 26);
 /* ZIEL */
 P.push({ kind: 'goal', x: 4600, y: 1240, w: 60, h: 120 });
 return P;
}

function loadBest() {
 try { return parseFloat(localStorage.getItem('bossrushParkourBest')) || 0 } catch (e) { return 0 }
}
function saveBest(t) {
 try { localStorage.setItem('bossrushParkourBest', String(t)) } catch (e) { /* egal */ }
}

export function createParkourRun() {
 return {
  time: 0, deaths: 0, done: false, doneTime: 0, best: loadBest(),
  spawn: { x: 140, y: 1150 },
  p: { x: 140, y: 1150, vx: 0, vy: 0, r: 20, onGround: false, coyote: 0, face: 1, sq: 1, jumpHeld: false, wasAir: false },
  keys: { left: false, right: false, jump: false },
  jumpBuf: 0, prevJump: false,
  cam: { x: 0, y: 0 },
  plats: buildLevel(),
  parts: []
 };
}

function platRect(pl, t) {
 if (pl.kind === 'move') {
  const off = Math.sin(t * pl.spd * Math.PI + pl.ph) * pl.range;
  return { x: pl.ax + pl.dx * off, y: pl.ay + pl.dy * off, w: pl.w, h: pl.h }
 }
 return { x: pl.x, y: pl.y, w: pl.w, h: pl.h }
}

function die(pk) {
 pk.deaths++; sfx('playerHit');
 pk.p.x = pk.spawn.x; pk.p.y = pk.spawn.y; pk.p.vx = 0; pk.p.vy = 0; pk.p.sq = 1;
 for (let i = 0; i < 14; i++)pk.parts.push({ x: pk.p.x, y: pk.p.y, vx: (Math.random() - .5) * 380, vy: -Math.random() * 320, life: .5 })
}

/* ---------- PHYSIK (DOM-frei, testbar) ---------- */
export function parkourStep(pk, dtRaw) {
 if (!Number.isFinite(dtRaw) || dtRaw <= 0) dtRaw = 1 / 60;
 const dt = Math.min(dtRaw, 1 / 30);
 if (pk.done) { pk.doneTime += dt; return }
 pk.time += dt;
 const p = pk.p, k = pk.keys;

 /* Springen: Puffer + Coyote-Zeit (fuehlt sich auf Touch gut an) */
 if (k.jump && !pk.prevJump) pk.jumpBuf = .14;
 pk.prevJump = k.jump;
 pk.jumpBuf = Math.max(0, pk.jumpBuf - dt);
 p.coyote = Math.max(0, p.coyote - dt);
 if (pk.jumpBuf > 0 && (p.onGround || p.coyote > 0)) {
  p.vy = -PK_JUMP; p.onGround = false; p.coyote = 0; pk.jumpBuf = 0; p.sq = .72; sfx('hop')
 }
 /* variable Sprunghoehe: frueher Loslassen = kuerzerer Sprung */
 if (!k.jump && p.vy < -320) p.vy = -320;

 /* Laufen */
 const dir = (k.right ? 1 : 0) - (k.left ? 1 : 0);
 if (dir) { p.vx += dir * 2600 * dt; p.face = dir } else p.vx *= Math.pow(.0008, dt);
 p.vx = Math.max(-PK_MOVE, Math.min(PK_MOVE, p.vx));

 p.vy += PK_GRAV * dt;
 if (p.vy > 1500) p.vy = 1500;
 const wasGround = p.onGround;
 p.onGround = false;

 const pl = pk.plats;
 /* bewegte Saegeblaetter/Fahren positionieren */
 for (const q of pl) {
  if (q.kind === 'move') { const r = platRect(q, pk.time); q.cx = r.x; q.cy = r.y }
  else if (q.kind === 'saw') { const off = Math.sin(pk.time * q.spd + q.ph) * q.range; if (q.dir === 'h') { q.sx = q.ax + off; q.sy = q.ay } else { q.sx = q.ax; q.sy = q.ay + off } }
  else if (q.kind === 'crumble' && q.gone > 0) { q.gone -= dt; if (q.gone <= 0) { q.gone = 0; q.crumbleT = 0 } }
 }

 for (const q of pl) {
  if (q.kind === 'crumble' && q.gone > 0) continue;
  const r = q.kind === 'move' ? { x: q.cx, y: q.cy, w: q.w, h: q.h } : { x: q.x, y: q.y, w: q.w, h: q.h };
  if (q.kind === 'saw') {
   if (Math.hypot(p.x - (q.sx !== undefined ? q.sx : q.ax), p.y - (q.sy !== undefined ? q.sy : q.ay)) < q.r + p.r * .8) die(pk);
   continue
  }
  if (q.kind === 'spike') {
   if (p.x + p.r * .6 > r.x && p.x - p.r * .6 < r.x + r.w && p.y + p.r > r.y && p.y - p.r < r.y + r.h) die(pk);
   continue
  }
  if (q.kind === 'check') {
   if (p.x > r.x - 40 && p.x < r.x + r.w + 40 && Math.abs(p.y - (r.y + r.h / 2)) < 160) {
    if (pk.spawn.x !== r.x) { pk.spawn.x = r.x; pk.spawn.y = r.y + r.h - 40; q.active = true; sfx('seed') }
   }
   continue
  }
  if (q.kind === 'goal') {
   if (p.x + p.r > r.x && p.x - p.r < r.x + r.w && p.y + p.r > r.y && p.y - p.r < r.y + r.h) {
    pk.done = true; pk.doneTime = 0;
    if (!pk.best || pk.time < pk.best) { pk.best = pk.time; saveBest(pk.time) }
    sfx('victory');
    continue
   }
   continue
  }
  /* Plattform-Kollision: nur von oben landen ( klassischer Runner ) */
  const px = p.x, pyPrev = p.y - p.vy * dt; /* vorherige Position */
  if (px + p.r > r.x && px - p.r < r.x + r.w) {
   const top = r.y;
   if (p.vy >= 0 && pyPrev + p.r <= top + 14 && p.y + p.r >= top) {
    p.y = top - p.r;
    if (q.kind === 'spring') { p.vy = -1500; p.sq = .6; sfx('hop') }
    else {
     if (!wasGround && p.vy > 640) p.sq = 1.4; /* Landung squasht */
     p.vy = 0; p.onGround = true; p.coyote = .12;
     if (q.kind === 'crumble') { q.crumbleT += dt; if (q.crumbleT > .38) { q.gone = 2.6; q.crumbleT = 0 } }
    }
   }
  }
 }

 p.x += p.vx * dt; p.y += p.vy * dt;
 p.x = Math.max(p.r, Math.min(PK_W - p.r, p.x));
 /* Squash&Stretch entspannt in Richtung 1 */
 p.sq += (1 - p.sq) * Math.min(1, dt * 9);
 for (const q of pk.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 1400 * dt; q.life -= dt }
 pk.parts = pk.parts.filter(q => q.life > 0);

 /* Absturz = Tod */
 if (p.y > PK_H + 160) die(pk);

 /* Kamera folgt weich */
 const tx = Math.max(0, Math.min(PK_W - 1180, p.x - 470));
 const ty = Math.max(0, Math.min(PK_H - 720, p.y - 400));
 pk.cam.x += (tx - pk.cam.x) * Math.min(1, dt * 5);
 pk.cam.y += (ty - pk.cam.y) * Math.min(1, dt * 5)
}

/* ---------- ZEICHNEN (Slime-Arena-Look) ---------- */
export function parkourDraw(g, pk, W, H) {
 const s = pk, p = s.p;
 g.setTransform(1, 0, 0, 1, 0, 0);
 g.clearRect(0, 0, W, H);
 /* Himmel + Checker wie die Slime-Arena */
 g.fillStyle = '#63dff5'; g.fillRect(0, 0, W, H);
 const step = 100;
 const x0 = Math.floor(s.cam.x / step) * step, y0 = Math.floor(s.cam.y / step) * step;
 for (let x = x0; x < s.cam.x + W; x += step) for (let y = y0; y < s.cam.y + H; y += step) {
  const sx = x - s.cam.x, sy = y - s.cam.y;
  g.fillStyle = ((x / step + y / step) % 2 === 0) ? '#83efff' : '#55cce9';
  g.fillRect(sx, sy, step, step)
 }
 g.save(); g.translate(-s.cam.x, -s.cam.y);
 /* Plattformen */
 for (const q of s.plats) {
  if (q.kind === 'saw') {
   const sx = q.sx !== undefined ? q.sx : q.ax, sy = q.sy !== undefined ? q.sy : q.ay;
   g.save(); g.translate(sx, sy); g.rotate(s.time * 9);
   g.fillStyle = '#c7ccd8'; g.beginPath(); g.arc(0, 0, q.r, 0, Math.PI * 2); g.fill();
   g.fillStyle = '#7c8496';
   for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; g.beginPath(); g.moveTo(Math.cos(a) * q.r, Math.sin(a) * q.r); g.lineTo(Math.cos(a + .22) * (q.r + 12), Math.sin(a + .22) * (q.r + 12)); g.lineTo(Math.cos(a + .44) * q.r, Math.sin(a + .44) * q.r); g.closePath(); g.fill() }
   g.fillStyle = '#3a4152'; g.beginPath(); g.arc(0, 0, q.r * .3, 0, Math.PI * 2); g.fill();
   g.restore(); continue
  }
  if (q.kind === 'spike') {
   g.fillStyle = '#ff3b2f';
   for (let sx = q.x; sx < q.x + q.w - 4; sx += 18) { g.beginPath(); g.moveTo(sx, q.y + q.h); g.lineTo(sx + 9, q.y - 6); g.lineTo(sx + 18, q.y + q.h); g.closePath(); g.fill() }
   continue
  }
  if (q.kind === 'check') {
   g.fillStyle = q.active ? '#41e07c' : '#b9c7d4'; g.fillRect(q.x, q.y - 40, 5, q.h);
   g.fillStyle = q.active ? '#41e07c' : '#8fb6c9'; g.beginPath(); g.moveTo(q.x + 5, q.y - 40); g.lineTo(q.x + 34, q.y - 28); g.lineTo(q.x + 5, q.y - 14); g.closePath(); g.fill();
   continue
  }
  if (q.kind === 'goal') {
   g.fillStyle = '#1c7a2e'; g.fillRect(q.x + 24, q.y - 60, 7, q.h + 60);
   g.fillStyle = '#ffe14d'; g.beginPath(); g.moveTo(q.x + 31, q.y - 60); g.lineTo(q.x + 96, q.y - 36); g.lineTo(q.x + 31, q.y - 10); g.closePath(); g.fill();
   g.fillStyle = '#8cf838'; g.font = 'bold 15px Arial'; g.fillText('ZIEL', q.x - 8, q.y - 72);
   continue
  }
  if (q.kind === 'crumble') {
   if (q.gone > 0) continue;
   g.fillStyle = q.crumbleT > 0 ? '#c9a06a' : '#a37c4e';
   g.fillRect(q.x, q.y, q.w, q.h);
   g.strokeStyle = '#6d4f2c'; g.lineWidth = 2; g.strokeRect(q.x, q.y, q.w, q.h);
   if (q.crumbleT > 0) { g.strokeStyle = '#3a2410'; g.beginPath(); g.moveTo(q.x + q.w * .3, q.y); g.lineTo(q.x + q.w * .45, q.y + q.h); g.moveTo(q.x + q.w * .7, q.y); g.lineTo(q.x + q.w * .6, q.y + q.h); g.stroke() }
   continue
  }
  if (q.kind === 'spring') {
   g.fillStyle = '#ff8b2e'; g.fillRect(q.x, q.y + 8, q.w, q.h - 8);
   g.fillStyle = '#ffd23e'; g.fillRect(q.x + 6, q.y, q.w - 12, 9);
   continue
  }
  if (q.kind === 'move') {
   const qx = q.cx !== undefined ? q.cx : q.ax, qy = q.cy !== undefined ? q.cy : q.ay;
   g.fillStyle = '#2a5f86'; g.fillRect(qx, qy, q.w, q.h);
   g.fillStyle = '#7fd4ff'; g.fillRect(qx, qy, q.w, 6);
   continue
  }
  /* solid */
  g.fillStyle = '#1d4f74'; g.fillRect(q.x, q.y, q.w, q.h);
  g.fillStyle = '#3d84b8'; g.fillRect(q.x, q.y, q.w, 7)
 }
 /* Partikel */
 for (const q of s.parts) { g.globalAlpha = Math.max(0, q.life * 2); g.fillStyle = '#b8ffff'; g.beginPath(); g.arc(q.x, q.y, 4, 0, Math.PI * 2); g.fill() }
 g.globalAlpha = 1;
 /* Der kleine SLIME — Squash&Stretch, Augen schauen in Laufrichtung */
 const sx = 1 / p.sq, sy = p.sq, r = p.r;
 g.fillStyle = '#06131d55'; g.beginPath(); g.ellipse(p.x, p.y + r * .8, r * 1.05, r * .3, 0, 0, Math.PI * 2); g.fill();
 g.save(); g.translate(p.x, p.y + r * (1 - p.sq) * .9); g.scale(sx, sy);
 const grad = g.createLinearGradient(-r, -r, r, r); grad.addColorStop(0, '#b8ffff'); grad.addColorStop(.4, '#41d9f4'); grad.addColorStop(1, '#087fca');
 g.fillStyle = grad; g.beginPath();
 g.moveTo(-r, r * .5); g.bezierCurveTo(-r * 1.1, -r * .1, -r * .6, -r * .95, 0, -r * .9); g.bezierCurveTo(r * .7, -r, r * 1.1, -r * .2, r, r * .5);
 g.quadraticCurveTo(r * .6, r * .75, 0, r * .7); g.quadraticCurveTo(-r * .6, r * .75, -r, r * .5); g.fill();
 g.fillStyle = '#06314d';
 g.beginPath(); g.arc(p.face * r * .32 - r * .12, -r * .05, r * .12, 0, Math.PI * 2); g.fill();
 g.beginPath(); g.arc(p.face * r * .32 + r * .22, -r * .05, r * .12, 0, Math.PI * 2); g.fill();
 g.restore();
 g.restore();
 /* Ziel-Banner */
 if (s.done) {
  g.fillStyle = 'rgba(6,14,25,.78)'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#8cf838'; g.textAlign = 'center'; g.font = 'bold 54px Arial';
  g.fillText('PARKOUR GESCHAFFT!', W / 2, H / 2 - 30);
  g.fillStyle = '#dff3ff'; g.font = 'bold 26px Arial';
  g.fillText('Zeit: ' + s.time.toFixed(1) + 's \u00b7 Tode: ' + s.deaths + ' \u00b7 Bestzeit: ' + (s.best ? s.best.toFixed(1) + 's' : '\u2014'), W / 2, H / 2 + 16)
 }
}

/* ---------- DOM-ANBINDUNG (Touch + Tastatur, iPad-sicher) ---------- */
let active = false, raf = 0, run = null, cv = null, g = null, last = 0, bound = false;

export function parkourActive() { return active }
export function parkourRun() { return run }

function onKey(e, down) {
 if (!active) return;
 const c = e.code;
 if (c === 'ArrowLeft' || c === 'KeyA') run.keys.left = down;
 if (c === 'ArrowRight' || c === 'KeyD') run.keys.right = down;
 if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW') { run.keys.jump = down; e.preventDefault() }
}
const kd = e => onKey(e, true), ku = e => onKey(e, false);

function bindOnce() {
 if (bound) return; bound = true;
 window.addEventListener('keydown', kd);
 window.addEventListener('keyup', ku)
}

function frame(now) {
 if (!active) return;
 let dt = (now - last) / 1000; last = now;
 if (!Number.isFinite(dt) || dt <= 0) dt = 1 / 60;
 dt = Math.min(dt, 1 / 30);
 parkourStep(run, dt);
 try {
  const W = cv.width, H = cv.height;
  parkourDraw(g, run, W, H);
  const tEl = document.getElementById('pkTime'), dEl = document.getElementById('pkDeaths'), bEl = document.getElementById('pkBestWrap');
  if (tEl && tEl.textContent !== run.time.toFixed(1) + 's') tEl.textContent = run.time.toFixed(1) + 's';
  if (dEl && dEl.textContent !== String(run.deaths)) dEl.textContent = String(run.deaths);
  if (bEl && run.best && bEl.textContent !== run.best.toFixed(1) + 's') bEl.textContent = run.best.toFixed(1) + 's'
 } catch (e) { /* Zeichnen darf nie den Lauf killen */ }
 raf = requestAnimationFrame(frame)
}

export function startParkour() {
 try {
  cv = document.getElementById('pkCanvas');
  if (!cv || typeof cv.getContext !== 'function') return;
  g = cv.getContext('2d');
  cv.width = Math.max(320, window.innerWidth || 800); cv.height = Math.max(240, window.innerHeight || 600);
  run = createParkourRun();
  run.cam.x = Math.max(0, Math.min(PK_W - cv.width, run.p.x - 470));
  active = true; last = performance.now();
  bindOnce();
  /* Touch-Buttons: pointerdown/up (funktioniert auf iPad Safari + Desktop) */
  const btn = (id, key) => {
   const el = document.getElementById(id);
   if (!el) return;
   el.onpointerdown = e => { e.preventDefault(); run.keys[key] = true; try { el.setPointerCapture(e.pointerId) } catch (err) { } };
   const off = e => { run.keys[key] = false };
   el.onpointerup = off; el.onpointercancel = off; el.onpointerleave = off
  };
  btn('pkLeft', 'left'); btn('pkRight', 'right'); btn('pkJump', 'jump');
  const ex = document.getElementById('pkExit');
  if (ex) ex.onclick = () => stopParkour();
  const r = document.getElementById('pkRestart');
  if (r) r.onclick = () => { run = createParkourRun(); run.cam.x = 0 };
  raf = requestAnimationFrame(frame)
 } catch (e) { active = false }
}

export function stopParkour() {
 active = false;
 try { if (raf) cancelAnimationFrame(raf) } catch (e) { }
 raf = 0;
 try {
  const scr = document.getElementById('parkourScreen');
  if (scr) scr.classList.remove('active');
  const lobby = document.getElementById('lobby');
  if (lobby) lobby.classList.add('active')
 } catch (e) { /* Zurueck zur Lobby ist Kosmetik */ }
 run = null
}
