/* SNAKE-SPIEL (Hugo #61): "sollts ein eigenes mini spiel sein, indem man das
   orginelle snake spielt. das beruehmte spiel 'snake'. und keine klasse, die
   richtig kaempft." — Das KLASSISCHE SNAKE: Raster, friss die kleinen Schlangen,
   wachse, stoss nicht an. Mit Hugo-Wunsch-Design: die kleinen Schlangen (Futter)
   sind liebevoll gezeichnet (gekrummelter Koerper, Kopf, Auge, Zunge), die
   Spieler-Schlange im Boss-Snake-Look (dunkelgruen, gelbe Bauchplatten).
   Steuerung: WISCHEN auf dem iPad + Pfeiltasten/WASD. Logik DOM-frei testbar. */
import { sfx } from "./audio.js";

export const SG_COLS = 28;
export const SG_ROWS = 18;
export const SG_START_SPEED = 7;     /* Zuege pro Sekunde */
export const SG_SPEED_GAIN = .35;    /* pro Futter */
export const SG_SPEED_MAX = 16;
export const SG_START_LEN = 3;

function loadBest() {
 try { return parseInt(localStorage.getItem('bossrushSnakeBest')) || 0 } catch (e) { return 0 }
}
function saveBest(v) {
 try { localStorage.setItem('bossrushSnakeBest', String(v)) } catch (e) { /* egal */ }
}

export function createSnakeGame() {
 return {
  cols: SG_COLS, rows: SG_ROWS,
  snake: [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }],
  dir: { x: 1, y: 0 }, queue: [],
  food: null, score: 0, best: loadBest(),
  speed: SG_START_SPEED, acc: 0, tick: 0,
  dead: false, wobble: 0
 };
}

function spawnFood(sg) {
 for (let tries = 0; tries < 400; tries++) {
  const x = 1 + Math.floor(Math.random() * (sg.cols - 2)), y = 1 + Math.floor(Math.random() * (sg.rows - 2));
  if (!sg.snake.some(q => q.x === x && q.y === y)) { sg.food = { x, y, ph: Math.random() * 6.28 }; return }
 }
 sg.food = null /* Brett voll — gewonnen! */
}

function opposite(a, b) { return a.x === -b.x && a.y === -b.y }

/* Richtungswechsel einreihen (Queue verhindert 180°-Doppeltipp in einem Zug) */
export function snakeTurn(sg, dx, dy) {
 const last = sg.queue.length ? sg.queue[sg.queue.length - 1] : sg.dir;
 if (opposite({ x: dx, y: dy }, last)) return;
 if (last.x === dx && last.y === dy) return;
 if (sg.queue.length < 3) sg.queue.push({ x: dx, y: dy })
}

function tick(sg) {
 if (sg.queue.length) sg.dir = sg.queue.shift();
 const head = sg.snake[0], nx = head.x + sg.dir.x, ny = head.y + sg.dir.y;
 /* Wand = aus (klassisch) */
 if (nx < 0 || ny < 0 || nx >= sg.cols || ny >= sg.rows) { die(sg); return }
 /* Sich selbst fressen: der Schwanz, der in DIESEM Zug wegrueckt, zaehlt nicht */
 const body = sg.food && nx === sg.food.x && ny === sg.food.y ? sg.snake : sg.snake.slice(0, -1);
 if (body.some(q => q.x === nx && q.y === ny)) { die(sg); return }
 sg.snake.unshift({ x: nx, y: ny });
 if (sg.food && nx === sg.food.x && ny === sg.food.y) {
  sg.score += 10;
  sg.speed = Math.min(SG_SPEED_MAX, sg.speed + SG_SPEED_GAIN);
  sfx('seed');
  spawnFood(sg)
 } else sg.snake.pop()
}

function die(sg) {
 sg.dead = true; sfx('defeat');
 if (sg.score > sg.best) { sg.best = sg.score; saveBest(sg.best) }
}

/* ---------- PHYSIK (DOM-frei, testbar) ---------- */
export function snakeStep(sg, dtRaw) {
 if (!Number.isFinite(dtRaw) || dtRaw <= 0) dtRaw = 1 / 60;
 const dt = Math.min(dtRaw, 1 / 15);
 sg.wobble += dt;
 if (sg.dead) return;
 if (!sg.food) spawnFood(sg);
 sg.acc += dt;
 const interval = 1 / sg.speed;
 let guard = 0;
 while (sg.acc >= interval && !sg.dead && guard++ < 4) { sg.acc -= interval; tick(sg); sg.tick++ }
}

/* ---------- ZEICHNEN: Boss-Snake-Look + huebsche Mini-Schlangen ---------- */
function rr(g, x, y, w, h, r) {
 g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath()
}

export function snakeDraw(g, sg, W, H) {
 const cell = Math.floor(Math.min(W / sg.cols, H / sg.rows));
 const bw = cell * sg.cols, bh = cell * sg.rows, ox = (W - bw) / 2, oy = (H - bh) / 2;
 g.setTransform(1, 0, 0, 1, 0, 0);
 g.clearRect(0, 0, W, H);
 /* Spielfeld: dunkelgruenes Snake-Arena-Brett mit Schachbrett-Schimmer */
 g.fillStyle = '#04140a'; g.fillRect(0, 0, W, H);
 for (let cx = 0; cx < sg.cols; cx++) for (let cy = 0; cy < sg.rows; cy++) {
  g.fillStyle = (cx + cy) % 2 === 0 ? '#0a1c0d' : '#0c2011';
  g.fillRect(ox + cx * cell, oy + cy * cell, cell, cell)
 }
 g.strokeStyle = '#2e6b21'; g.lineWidth = 4; g.strokeRect(ox - 2, oy - 2, bw + 4, bh + 4);
 g.strokeStyle = '#8cf83833'; g.lineWidth = 1.5; g.strokeRect(ox + 3, oy + 3, bw - 6, bh - 6);

 /* FUTTER: die kleine Schlange — gekruemmt, mit Kopf, Auge und flinker Zunge */
 if (sg.food) {
  const fx = ox + sg.food.x * cell + cell / 2, fy = oy + sg.food.y * cell + cell / 2;
  const r = cell * .34, wig = Math.sin(sg.wobble * 5 + sg.food.ph) * r * .22;
  g.save(); g.translate(fx, fy);
  g.fillStyle = '#04100a77'; g.beginPath(); g.ellipse(2, r * .8, r * 1.25, r * .4, 0, 0, Math.PI * 2); g.fill();
  /* S-gekrummter Koerper */
  g.strokeStyle = '#57a639'; g.lineWidth = r * .62; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-r * 1.5, r * .55 + wig); g.quadraticCurveTo(-r * .5, r * 1.05 + wig, 0, r * .35); g.quadraticCurveTo(r * .5, -r * .35, r * 1.1, -r * .05); g.stroke();
  g.strokeStyle = '#7dff3f'; g.lineWidth = r * .28;
  g.beginPath(); g.moveTo(-r * 1.5, r * .55 + wig); g.quadraticCurveTo(-r * .5, r * 1.05 + wig, 0, r * .35); g.quadraticCurveTo(r * .5, -r * .35, r * 1.1, -r * .05); g.stroke();
  /* Kopf */
  g.fillStyle = '#2e6b21'; g.strokeStyle = '#123a10'; g.lineWidth = 1.5;
  g.beginPath(); g.ellipse(r * 1.25, -r * .1, r * .52, r * .4, -.25, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = '#e9f8ff'; g.beginPath(); g.arc(r * 1.42, -r * .2, r * .12, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0a1c2e'; g.beginPath(); g.arc(r * 1.47, -r * .2, r * .06, 0, Math.PI * 2); g.fill();
  /* flackernde Zunge */
  if (Math.floor(sg.wobble * 4 + sg.food.ph) % 2 === 0) {
   g.strokeStyle = '#ff5a76'; g.lineWidth = Math.max(1, r * .1);
   g.beginPath(); g.moveTo(r * 1.7, -r * .12); g.lineTo(r * 2.15, -r * .12); g.stroke();
   g.beginPath(); g.moveTo(r * 2.15, -r * .12); g.lineTo(r * 2.4, -r * .32); g.moveTo(r * 2.15, -r * .12); g.lineTo(r * 2.4, .08 * r); g.stroke()
  }
  g.restore()
 }

 /* SPIELER-SCHLANGE: Boss-Look — Ringe, Bauchplatten, Kopf mit Augen + Zunge */
 const n = sg.snake.length;
 for (let i = n - 1; i >= 1; i--) {
  const q = sg.snake[i], nx = ox + q.x * cell + cell / 2, ny = oy + q.y * cell + cell / 2;
  const t = i / Math.max(1, n - 1);
  const sr = cell * .46 * (1 - t * .25);
  g.save(); g.translate(nx, ny);
  g.fillStyle = '#04100a66'; g.beginPath(); g.ellipse(cell * .06, sr * .35, sr * 1.05, sr * .6, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = i % 2 === 0 ? '#4f9c2e' : '#57a639';
  g.beginPath(); g.ellipse(0, 0, sr * 1.08, sr * .92, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#cfe98a3d'; g.beginPath(); g.ellipse(-sr * .1, sr * .38, sr * .66, sr * .26, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#123a10aa'; g.lineWidth = Math.max(1, cell * .04);
  g.beginPath(); g.arc(-sr * .25, 0, sr * .48, -.9, .9); g.stroke();
  g.restore()
 }
 const hd = sg.snake[0], hx = ox + hd.x * cell + cell / 2, hy = oy + hd.y * cell + cell / 2, hr = cell * .5;
 const ang = Math.atan2(sg.dir.y, sg.dir.x);
 g.save(); g.translate(hx, hy); g.rotate(ang);
 g.fillStyle = '#04100a66'; g.beginPath(); g.ellipse(cell * .05, hr * .3, hr * 1.05, hr * .6, 0, 0, Math.PI * 2); g.fill();
 g.fillStyle = '#2e6b21'; g.strokeStyle = '#0e2810'; g.lineWidth = 2;
 g.beginPath(); g.ellipse(-hr * .12, 0, hr * 1.05, hr * .82, 0, 0, Math.PI * 2); g.fill(); g.stroke();
 g.fillStyle = '#d7a83e'; g.beginPath(); g.ellipse(-hr * .6, 0, hr * .14, hr * .6, 0, 0, Math.PI * 2); g.fill();
 g.fillStyle = '#57a639'; g.beginPath(); g.ellipse(hr * .2, 0, hr * .55, hr * .5, 0, 0, Math.PI * 2); g.fill(); g.stroke();
 /* Augen */
 g.fillStyle = '#e9f8ff';
 g.beginPath(); g.arc(hr * .32, -hr * .3, hr * .17, 0, Math.PI * 2); g.fill();
 g.beginPath(); g.arc(hr * .32, hr * .3, hr * .17, 0, Math.PI * 2); g.fill();
 g.fillStyle = '#0a1c2e';
 g.beginPath(); g.arc(hr * .4, -hr * .3, hr * .08, 0, Math.PI * 2); g.fill();
 g.beginPath(); g.arc(hr * .4, hr * .3, hr * .08, 0, Math.PI * 2); g.fill();
 /* Zunge */
 if (!sg.dead && Math.floor(sg.wobble * 4) % 2 === 0) {
  g.strokeStyle = '#ff5a76'; g.lineWidth = Math.max(1, cell * .06);
  g.beginPath(); g.moveTo(hr * .78, 0); g.lineTo(hr * 1.25, 0); g.stroke();
  g.beginPath(); g.moveTo(hr * 1.25, 0); g.lineTo(hr * 1.45, -hr * .14); g.moveTo(hr * 1.25, 0); g.lineTo(hr * 1.45, hr * .14); g.stroke()
 }
 g.restore();

 /* Punkte oben links ins Brett */
 g.fillStyle = '#b6ff6e'; g.textAlign = 'left'; g.textBaseline = 'top';
 g.font = 'bold ' + Math.round(cell * .8) + 'px Arial';
 g.fillText(sg.score + ' PUNKTE', ox + cell * .4, oy + cell * .3);

 /* Game-Over-Overlay */
 if (sg.dead) {
  g.fillStyle = 'rgba(4,12,7,.82)'; g.fillRect(ox, oy, bw, bh);
  g.fillStyle = '#ff5a4d'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold ' + Math.round(cell * 1.4) + 'px Arial';
  g.fillText('GAME OVER', W / 2, H / 2 - cell * 1.2);
  g.fillStyle = '#b6ff6e'; g.font = 'bold ' + Math.round(cell * .8) + 'px Arial';
  g.fillText(sg.score + ' PUNKTE \u00b7 REKORD: ' + sg.best, W / 2, H / 2);
  g.fillStyle = '#dff3ff'; g.font = 'bold ' + Math.round(cell * .62) + 'px Arial';
  g.fillText('TIPPEN ODER NEU = NOCHMAL', W / 2, H / 2 + cell * 1.3)
 }
}

/* ---------- DOM-ANBINDUNG (Wischen + Tastatur, iPad-sicher) ---------- */
let active = false, raf = 0, run = null, cv = null, g = null, last = 0, bound = false;

export function snakeGameActive() { return active }

function onKey(e, down) {
 if (!active || !down) return;
 const c = e.code;
 if (c === 'ArrowLeft' || c === 'KeyA') snakeTurn(run, -1, 0);
 else if (c === 'ArrowRight' || c === 'KeyD') snakeTurn(run, 1, 0);
 else if (c === 'ArrowUp' || c === 'KeyW') snakeTurn(run, 0, -1);
 else if (c === 'ArrowDown' || c === 'KeyS') snakeTurn(run, 0, 1);
 else return;
 e.preventDefault()
}
const kd = e => onKey(e, true);

function bindOnce() {
 if (bound) return; bound = true;
 window.addEventListener('keydown', kd)
}

function frame(now) {
 if (!active) return;
 let dt = (now - last) / 1000; last = now;
 if (!Number.isFinite(dt) || dt <= 0) dt = 1 / 60;
 dt = Math.min(dt, 1 / 15);
 snakeStep(run, dt);
 try {
  snakeDraw(g, run, cv.width, cv.height);
  const sc = document.getElementById('sgScore'), bs = document.getElementById('sgBest'), ln = document.getElementById('sgLen');
  if (sc && sc.textContent !== String(run.score)) sc.textContent = String(run.score);
  if (bs && bs.textContent !== String(run.best)) bs.textContent = String(run.best);
  if (ln && ln.textContent !== String(run.snake.length)) ln.textContent = String(run.snake.length)
 } catch (e) { /* Zeichnen darf nie den Lauf killen */ }
 raf = requestAnimationFrame(frame)
}

export function startSnakeGame() {
 try {
  cv = document.getElementById('sgCanvas');
  if (!cv || typeof cv.getContext !== 'function') return;
  g = cv.getContext('2d');
  cv.width = Math.max(320, window.innerWidth || 800); cv.height = Math.max(240, window.innerHeight || 600);
  run = createSnakeGame();
  active = true; last = performance.now();
  bindOnce();
  /* WISCHEN = Richtung (iPad!) — auf dem Canvas, touch-action:none */
  let sx = 0, sy = 0, swiping = false;
  cv.onpointerdown = e => {
   e.preventDefault();
   if (run && run.dead) { run = createSnakeGame() } /* Game Over: tap = neu */
   sx = e.clientX; sy = e.clientY; swiping = true
  };
  cv.onpointermove = e => {
   if (!swiping || !run || run.dead) return;
   const dx = e.clientX - sx, dy = e.clientY - sy;
   if (Math.hypot(dx, dy) < 26) return;
   if (Math.abs(dx) > Math.abs(dy)) snakeTurn(run, dx > 0 ? 1 : -1, 0);
   else snakeTurn(run, 0, dy > 0 ? 1 : -1);
   sx = e.clientX; sy = e.clientY /* Folge-Wische erlauben */
  };
  cv.onpointerup = () => { swiping = false };
  cv.onpointercancel = () => { swiping = false };
  const ex = document.getElementById('sgExit');
  if (ex) ex.onclick = () => stopSnakeGame();
  const rs = document.getElementById('sgRestart');
  if (rs) rs.onclick = () => { run = createSnakeGame() };
  raf = requestAnimationFrame(frame)
 } catch (e) { active = false }
}

export function stopSnakeGame() {
 active = false;
 try { if (raf) cancelAnimationFrame(raf) } catch (e) { }
 raf = 0;
 try {
  const scr = document.getElementById('snakeGameScreen');
  if (scr) scr.classList.remove('active');
  const lobby = document.getElementById('lobby');
  if (lobby) lobby.classList.add('active')
 } catch (e) { /* Kosmetik */ }
 run = null
}
