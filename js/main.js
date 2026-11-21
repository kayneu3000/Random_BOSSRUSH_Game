import { state } from "./state.js";
import { MAP, classes } from "./config.js";
import { $ } from "./utils.js";
import { loadUnlocks, applyUnlocksToUI, attachUI, showGameMessage, endGame, updateHUD } from "./ui.js";
import { attachInput, getInput } from "./input.js";
import { attack, updateEmber } from "./combat.js";
import { createHealerSlimes, updateCompanions, damagePlayer, updateVisualEffects } from "./entities.js";
import { createSlime, updateSlime } from "./bosses/slime.js";
import { createDragon, createTowers, updateDragon, updateTowerBeams } from "./bosses/dragon.js";
import { createGunball, updateGunball } from "./bosses/gunball.js";
import { updatePlayerProjectiles, updateEnemyProjectiles, updateFireTrails } from "./projectiles.js";
import { resizeCanvas } from "./canvas.js";
import { draw } from "./render.js";
import { attachConsole, spawnNextBossRush } from "./console.js";

window.addEventListener('resize', resizeCanvas);
loadUnlocks();
applyUnlocksToUI();
attachUI({ startGame });
attachInput();
attachConsole(startGame);

function startGame() {
 const s = state;
 s.isAdmin = s.selected === 'admin' || s.adminMode;
 if (s.isAdmin) s.selected = s.adminBaseClass;
 const c = classes[s.selected];
 s.player = { x: MAP.w/2, y: MAP.h/2+350, r: 17, hp: c.hp, maxHp: c.hp, speed: c.speed, angle: -Math.PI/2, weaponAngle: 0 };
 s.bosses = []; s.projectiles = []; s.enemyProjectiles = []; s.particles = []; s.effects = []; s.companions = []; s.infernoTowers = []; s.fireTrails = [];
 s.kills = 0; $('kills').textContent = '0 besiegt';
 s.elapsed = 0; s.attackTimer = 0; s.dashTimer = 0; s.dashDuration = 0; s.invuln = 0; s.screenShake = 0; s.spawnId = 0;
 s.finished = false; s.paused = false; s.camera = { x: 0, y: 0 };
 s.peace = false; s.brutal = false; s.friendlyFire = false; s.invincible = false; s.timeFreeze = false; s.dmgMultiplier = 1; s.bossRushQueue = []; s.arena = { w: MAP.w, h: MAP.h };
 s.emberBeamTimer = 0; s.emberCooldown = 0; s.emberTick = 0; s.emberBeamAngle = s.player.angle;
 s.healerHealCooldown = 0; s.gunnerAmmo = 5; s.gunnerReload = 0; s.gunnerShotTimer = 0;
 s.message = { text: '', until: Infinity };

 $('game').classList.toggle('dragonTheme', s.selectedBoss === 'dragon');
 $('game').classList.toggle('slimeTheme', s.selectedBoss === 'slime');
 $('game').classList.toggle('gunballTheme', s.selectedBoss === 'gunball');
 $('game').classList.toggle('emberTheme', s.selected === 'ember');

 if (s.selectedBoss === 'dragon') {
  createDragon(MAP.w/2, MAP.h/2-200); createTowers();
  $('bossName').textContent = 'FEUERDRACHE'; $('huntTitle').textContent = 'DRAGON FIGHT';
  showGameMessage('DIE INFERNO-TÜRME ERWACHEN', 2.2)
 } else if (s.selectedBoss === 'gunball') {
  createGunball(MAP.w/2, MAP.h/2-200);
  $('bossName').textContent = 'GUNBALL'; $('huntTitle').textContent = 'GUNBALL HUNT';
  showGameMessage('GUNBALL AKTIVIERT!', 2.2)
 } else {
  createSlime(MAP.w/2, MAP.h/2-200, 0);
  $('bossName').textContent = 'SLIME'; $('huntTitle').textContent = 'SLIME HUNT';
  showGameMessage('DER BLAUE SLIME', 2.2)
 }

 if (s.selected === 'healer') createHealerSlimes();

 $('className').textContent = (s.isAdmin ? 'ADMIN · ' : '') + c.name;
 $('attackIcon').textContent = s.selected === 'ember' ? '🐲' : s.selected === 'gunner' ? '🔫' : c.icon;
 $('attackLabel').textContent = s.selected === 'ember' ? 'FEUERSTRAHL' : s.selected === 'gunner' ? 'SCHUSS' : 'ANGRIFF';
 $('attackBtn').style.display = s.selected === 'healer' ? 'none' : 'flex';
 $('healBtn').style.display = s.selected === 'healer' ? 'flex' : 'none';
 $('cmdBtn').style.display = s.isAdmin ? 'flex' : 'none';
 $('overlay').style.display = 'none'; $('resume').style.display = 'block'; $('game').style.display = 'block';
 document.querySelectorAll('.screen').forEach(x => x.classList.remove('active'));

 resizeCanvas();
 s.gameRunning = true; s.last = performance.now();
 requestAnimationFrame(loop)
}

function movePlayer(dt) {
 const s = state, c = classes[s.selected];
 if (s.dashDuration > 0) {
  const dv = s.selected === 'sword' ? 1275 : 850;
  s.player.x += s.player.dashX*dv*dt; s.player.y += s.player.dashY*dv*dt
 } else {
  const v = getInput();
  s.player.x += v.x*c.speed*dt; s.player.y += v.y*c.speed*dt;
  if (Math.hypot(v.x, v.y) > .1) s.player.angle = Math.atan2(v.y, v.x)
 }
 s.player.x = Math.max(30, Math.min(s.arena.w-30, s.player.x));
 s.player.y = Math.max(30, Math.min(s.arena.h-30, s.player.y))
}

function updateCamera() {
 const s = state;
 s.camera.x = s.arena.w >= s.W ? Math.max(0, Math.min(s.arena.w-s.W, s.player.x-s.W/2)) : (s.arena.w-s.W)/2;
 s.camera.y = s.arena.h >= s.H ? Math.max(0, Math.min(s.arena.h-s.H, s.player.y-s.H/2)) : (s.arena.h-s.H)/2
}

function update(dt) {
 const s = state;
 if (s.paused || s.finished) return;
 if (s.timeFreeze) {
  movePlayer(dt);
  if (s.keys.KeyJ || s.keys.Space) attack();
  updateCamera();
  updateHUD();
  return
 }
 s.elapsed += dt;
 s.attackTimer = Math.max(0, s.attackTimer-dt); s.dashTimer = Math.max(0, s.dashTimer-dt);
 s.dashDuration = Math.max(0, s.dashDuration-dt); s.invuln = Math.max(0, s.invuln-dt);
 s.healerHealCooldown = Math.max(0, s.healerHealCooldown-dt);
 s.gunnerReload = Math.max(0, s.gunnerReload-dt); s.gunnerShotTimer = Math.max(0, s.gunnerShotTimer-dt);
 if (s.selected === 'gunner' && s.gunnerReload === 0 && s.gunnerAmmo === 0) { s.gunnerAmmo = 5; showGameMessage('GUNNER — GELADEN') }

 movePlayer(dt);
 if (s.keys.KeyJ || s.keys.Space) attack();
 if (s.selected === 'ember') updateEmber(dt);
 updateCompanions(dt);

 for (const b of s.bosses) {
  if (!b.alive) continue;
  if (b.type === 'dragon') { updateDragon(b, dt); continue }
  if (b.type === 'gunball') { updateGunball(b, dt); continue }
  updateSlime(b, dt)
 }

 updateTowerBeams(dt);
 updatePlayerProjectiles(dt);
 updateEnemyProjectiles(dt);
 updateFireTrails(dt);
 updateVisualEffects(dt);

 updateCamera();
 s.screenShake = Math.max(0, s.screenShake-dt*25);
 updateHUD();

 if (s.bossRushQueue.length > 0) {
  if (s.bosses.every(b => !b.alive)) spawnNextBossRush()
 } else if (s.bosses.filter(b => b.alive).length === 0) endGame(true)
}

function loop(now) {
 const s = state;
 if (!s.gameRunning) return;
 const dt = Math.min((now-s.last)/1000, .035); s.last = now;
 if (!s.paused) { update(dt); draw() }
 requestAnimationFrame(loop)
}

export { startGame, update, loop };
