import test from 'node:test';
import assert from 'node:assert/strict';

function makeElement(id) {
  return {
    id,
    textContent: '',
    innerHTML: '',
    style: {},
    dataset: {},
    width: 0,
    height: 0,
    clientWidth: 800,
    clientHeight: 600,
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    setPointerCapture() {},
    onclick: null,
    querySelector: () => makeElement(id + '::child'),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 200 })
  };
}

function makeCtx() {
  return new Proxy(
    {},
    {
      get(_t, key) {
        if (key === 'createLinearGradient' || key === 'createRadialGradient') {
          return () => ({ addColorStop() {} });
        }
        return () => undefined;
      },
      set() { return true; }
    }
  );
}

const store = new Map();
const elements = new Map();
const registerElement = id => {
  if (!elements.has(id)) {
    const el = makeElement(id);
    if (id === 'canvas') el.getContext = () => makeCtx();
    elements.set(id, el);
  }
  return elements.get(id);
};

globalThis.document = {
  getElementById: registerElement,
  querySelectorAll: () => [],
  createElement: () => makeElement('created'),
  body: makeElement('body')
};
globalThis.window = { addEventListener() {}, removeEventListener() {} };
globalThis.devicePixelRatio = 1;
globalThis.requestAnimationFrame = () => 0;
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); }
};

const { state } = await import('../js/state.js');
const { startGame, update } = await import('../js/main.js');
const { attack } = await import('../js/combat.js');
const { damageBoss } = await import('../js/entities.js');
const { endGame } = await import('../js/ui.js');

test('startGame bootstraps a slime boss fight for the archer', () => {
  state.selected = 'archer';
  state.selectedBoss = 'slime';
  startGame();
  assert.ok(state.player, 'player exists');
  assert.equal(state.player.maxHp, 100);
  assert.equal(state.bosses.length, 1);
  assert.equal(state.bosses[0].type, 'slime');
  assert.equal(state.gameRunning, true);
  assert.equal(state.finished, false);
});

test('game loop is stable over 120 frames', () => {
  state.keys.KeyJ = false;
  state.keys.Space = false;
  for (let i = 0; i < 120 && !state.finished; i++) update(1 / 60);
  assert.ok(state.elapsed > 0.5);
  assert.ok(state.bosses.some(b => b.alive) || state.finished);
});

test('archer attack spawns a projectile when near the boss', () => {
  const boss = state.bosses.find(b => b.alive);
  assert.ok(boss);
  const before = state.projectiles.length;
  attack();
  assert.equal(state.projectiles.length, before + 1);
});

test('damageBoss reduces boss hp without splitting early', () => {
  const boss = state.bosses.find(b => b.alive && b.type === 'slime');
  assert.ok(boss);
  const hpBefore = boss.hp;
  damageBoss(boss, 50);
  assert.equal(boss.hp, hpBefore - 50);
  assert.ok(boss.alive);
});

test('losing the fight runs endGame(false) without throwing', () => {
  state.player.hp = 0;
  endGame(false);
  assert.equal(state.finished, true);
  assert.equal(state.paused, true);
});

test('winning the fight persists the healer unlock', () => {
  state.selected = 'archer';
  state.selectedBoss = 'slime';
  state.finished = false;
  state.paused = false;
  state.bosses = [];
  endGame(true);
  const saved = JSON.parse(store.get('bossrushUnlocks'));
  assert.equal(saved.healer, true);
});

test('dragon and gunball rendering paths run without throwing', async () => {
  const { draw } = await import('../js/render.js');
  state.selected = 'archer';
  state.selectedBoss = 'gunball';
  startGame();
  for (let i = 0; i < 20 && !state.finished; i++) update(1 / 60);
  state.bosses = [];
  state.bosses.push({ id: 1, type: 'gunball', x: 400, y: 300, r: 82, hp: 1000, maxHp: 1000, alive: true, angle: 0, rotation: 1.3, flash: 0.2, mode: 'attacking', phaseTimer: 5, weaponIndex: 0, weaponTimer: 0, fireTimer: 0, attackCooldown: 0, attackName: '', wobble: 0 });
  state.player.x = 500;
  state.player.y = 320;
  draw();
  state.bosses[0].mode = 'vulnerable';
  draw();
  state.selectedBoss = 'dragon';
  state.bosses[0] = { id: 2, type: 'dragon', x: 400, y: 300, r: 78, hp: 750, maxHp: 750, alive: true, angle: -0.6, rotation: 0, flash: 0.5, wobble: 0.5, mode: 'beamCharge', beamAngle: -0.6, beamCharge: 1 };
  draw();
  state.bosses[0].mode = 'beamActive';
  draw();
  state.bosses[0].mode = 'exhausted';
  draw();
  state.bosses[0].mode = 'guarded';
  draw();
  assert.ok(state.bosses[0].alive);
});

test('slash effects and particles fade out over time', () => {
  state.selected = 'sword';
  state.selectedBoss = 'slime';
  startGame();
  state.peace = true;
  state.bosses[0].hp = 999999;
  state.effects.push({ type: 'slash', x: 0, y: 0, angle: 0, life: 0.2, r: 50, weapon: 'sword' });
  state.particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 3, color: '#fff' });
  for (let i = 0; i < 40 && !state.finished; i++) update(1 / 60);
  assert.equal(state.effects.length, 0, 'effects are removed when life expires');
  assert.equal(state.particles.length, 0, 'particles are removed when life expires');
});

test('console: class switch, hp/dmg and cheat flags work', async () => {
  const { runCommand } = await import('../js/console.js');
  const { damagePlayer } = await import('../js/entities.js');
  state.selected = 'sword';
  state.selectedBoss = 'slime';
  startGame();
  state.bosses[0].hp = 999999;
  runCommand('gunner');
  assert.equal(state.selected, 'gunner');
  assert.equal(state.player.maxHp, 200);
  runCommand('hp 250');
  assert.equal(state.player.maxHp, 250);
  assert.equal(state.player.hp, 250);
  runCommand('dmg 2');
  assert.equal(state.dmgMultiplier, 2);
  runCommand('invincible');
  assert.equal(state.invincible, true);
  damagePlayer(30);
  assert.equal(state.player.hp, 250, 'invincible blocks damage');
  runCommand('peace');
  assert.equal(state.peace, true);
  runCommand('brutal');
  assert.equal(state.brutal, true);
  assert.equal(state.peace, false);
  assert.equal(state.friendlyFire, true);
  runCommand('friendly fire');
  assert.equal(state.friendlyFire, false);
  runCommand('arena shrink');
  assert.ok(state.arena.w < 2300);
  assert.ok(state.player.x <= state.arena.w - 30);
});

test('console: spawn, duel, boss rush and time freeze work', async () => {
  const { runCommand } = await import('../js/console.js');
  state.selected = 'archer';
  state.selectedBoss = 'slime';
  state.timeFreeze = false;
  startGame();
  runCommand('gunball');
  assert.ok(state.bosses.some(b => b.type === 'gunball' && b.alive));
  runCommand('slime vs dragon', startGame);
  assert.equal(state.bosses.some(b => b.type === 'slime'), true);
  assert.equal(state.bosses.some(b => b.type === 'dragon'), true);
  assert.ok(state.bosses[0].duelTarget, 'duel targets are linked');
  assert.equal(state.peace, true);
  assert.equal(state.friendlyFire, true);
  for (let i = 0; i < 10 && !state.finished; i++) update(1 / 60);
  runCommand('bossrush', startGame);
  assert.deepEqual(state.bossRushQueue, ['dragon', 'gunball', 'shadow']);
  assert.ok(state.bosses.some(b => b.type === 'slime' && b.alive));
  for (let i = 0; i < 20 && !state.finished; i++) update(1 / 60);
  for (const b of state.bosses) b.alive = false;
  update(1 / 60);
  assert.ok(state.bosses.some(b => b.type === 'dragon' && b.alive), 'next boss rush boss spawns');
  assert.equal(state.bossRushQueue.length, 2);
  runCommand('time freeze');
  const t0 = state.elapsed;
  update(1 / 60);
  assert.equal(state.elapsed, t0, 'time is frozen');
  runCommand('time normal');
  update(1 / 60);
  assert.ok(state.elapsed > t0, 'time flows again');
});

test('admin class persists across restarts and console is admin-only by design', async () => {
  const { runCommand } = await import('../js/console.js');
  state.unlocks.admin = true;
  state.selected = 'admin';
  state.adminBaseClass = 'gunner';
  startGame();
  assert.equal(state.isAdmin, true, 'admin session active');
  assert.equal(state.selected, 'gunner', 'admin plays with the stored base class');
  assert.equal(state.player.maxHp, 200);
  runCommand('hp 300');
  assert.equal(state.player.maxHp, 300);
  for (let i = 0; i < 10 && !state.finished; i++) update(1 / 60);
  state.selected = 'gunner';
  state.adminMode = true;
  startGame();
  assert.equal(state.isAdmin, true, 'admin persists on restart');
  assert.equal(state.selected, 'gunner', 'base class survives restart');
  runCommand('sword');
  assert.equal(state.adminBaseClass, 'sword', 'console class switch updates base class');
});

test('duel: dragon and gunball attack despite peace gating', async () => {
  const { createDragon, updateDragon } = await import('../js/bosses/dragon.js');
  const { createGunball, updateGunball } = await import('../js/bosses/gunball.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.bosses = []; state.enemyProjectiles = []; state.fireTrails = []; state.infernoTowers = [];
  state.peace = true; state.friendlyFire = true; state.brutal = false;
  createDragon(400, 300); createGunball(220, 160);
  const d = state.bosses.find(b => b.type === 'dragon'), g = state.bosses.find(b => b.type === 'gunball');
  d.duelTarget = g; g.duelTarget = d;
  d.fireCooldown = 0; d.infernoCooldown = 5; d.attackCooldown = 0;
  updateDragon(d, 1 / 60);
  assert.ok(state.enemyProjectiles.length > 0, 'dragon fires at duel target despite peace');
  g.fireTimer = 0;
  updateGunball(g, 1 / 60);
  assert.ok(state.enemyProjectiles.length > 1, 'gunball fires at duel target despite peace');
  state.peace = false; state.friendlyFire = false; state.bosses = [];
});

test('console commands: speed, cooldown and not me', async () => {
  const { runCommand } = await import('../js/console.js');
  const { attack } = await import('../js/combat.js');
  const { createSlime } = await import('../js/bosses/slime.js');
  const { duelTargetOf } = await import('../js/entities.js');
  state.selected = 'archer'; state.selectedBoss = 'slime';
  state.adminMode = false; state.adminBaseClass = 'archer';
  startGame();
  runCommand('speed 480');
  assert.equal(state.player.speed, 480, 'speed command sets player speed');
  runCommand('cooldown 0.5');
  assert.equal(state.cooldownOverride, 0.5);
  state.bosses = []; createSlime(state.player.x + 120, state.player.y, 0);
  state.projectiles = []; state.attackTimer = 0;
  attack();
  assert.equal(state.attackTimer, 0.5, 'attack uses the cooldown override');
  runCommand('cooldown');
  assert.equal(state.cooldownOverride, 0, 'cooldown without number resets to class default');
  runCommand('not me');
  assert.equal(state.notMe, true);
  const t = duelTargetOf(state.bosses[0]);
  assert.notEqual(t, state.player, 'bosses no longer target the player');
  assert.equal(t.x, state.arena.w / 2, 'bosses aim at the arena center instead');
  runCommand('not me');
  assert.equal(duelTargetOf(state.bosses[0]), state.player);
});

test('boss HUD shows console-spawned bosses and time freeze keeps cooldowns running', async () => {
  const { runCommand } = await import('../js/console.js');
  const { updateHUD } = await import('../js/ui.js');
  const { createDragon } = await import('../js/bosses/dragon.js');
  state.selected = 'archer'; state.selectedBoss = 'slime';
  state.adminMode = false; state.adminBaseClass = 'archer';
  startGame();
  createDragon(state.player.x + 400, state.player.y - 300);
  updateHUD();
  assert.ok(document.getElementById('bossName').textContent.includes('DRACHE'), 'spawned dragon appears in the boss bar');
  assert.ok(document.getElementById('bossCount').textContent.includes('BOSSE AKTIV'), 'combined boss count shown');
  state.friendlyFire = true;
  const d = state.bosses.find(b => b.type === 'dragon');
  const A = state.bosses.find(b => b.type === 'slime');
  A.x = d.x + d.r * 0.6; A.y = d.y; A.attackCooldown = 0; d.attackCooldown = 0;
  const hpA = A.hp, hpD = d.hp;
  update(1 / 60);
  assert.ok(A.hp < hpA && d.hp < hpD, 'bosses damage each other under friendly fire');
  state.friendlyFire = false;
  state.timeFreeze = true; state.attackTimer = 2;
  update(0.5);
  assert.equal(state.attackTimer, 1.5, 'attack cooldown runs during time freeze');
  state.timeFreeze = false;
});

test('faust class exists with tutorial stats', async () => {
  const { classes } = await import('../js/config.js');
  assert.equal(classes.faust.hp, 100);
  assert.equal(classes.faust.damage, 10);
  assert.equal(classes.faust.cool, .5);
  assert.equal(classes.faust.range, 70);
});

test('tutorial: shadow fight spawns with 500 hp and faust class', async () => {
  const { runCommand } = await import('../js/console.js');
  state.gameRunning = true; state.paused = false; state.finished = false; state.peace = false; state.notMe = false;
  state.selected = 'faust'; state.selectedBoss = 'shadow';
  state.adminMode = false; state.adminBaseClass = 'archer';
  startGame();
  assert.ok(state.bosses.some(b => b.type === 'shadow' && b.alive), 'tutorial boss spawns');
  assert.equal(state.bosses.find(b => b.type === 'shadow').maxHp, 500);
  runCommand('shadow');
  assert.equal(state.bosses.filter(b => b.type === 'shadow').length, 2, 'console can spawn extra shadow');
  runCommand('shadow vs gunball', startGame);
  assert.ok(state.bosses.some(b => b.type === 'shadow') && state.bosses.some(b => b.type === 'gunball'), 'duel supports shadow');
  state.bosses = []; state.infernoTowers = []; state.enemyProjectiles = [];
});

test('shadow phases: invulnerable while throwing and tower-guarded', async () => {
  const { createShadow, updateShadow, exhaustShadow } = await import('../js/bosses/shadow.js');
  const { damageBoss } = await import('../js/entities.js');
  state.gameRunning = true; state.paused = false; state.finished = false; state.notMe = false;
  state.bosses = []; state.enemyProjectiles = []; state.infernoTowers = []; state.fireTrails = [];
  createShadow(500, 400);
  const sh = state.bosses[0];
  const hp0 = sh.hp;
  sh.hp = 300; updateShadow(sh, 1 / 60);
  assert.equal(sh.phase, 2);
  assert.equal(sh.mode, 'throwing', 'phase 2 starts throwing');
  sh.fireCooldown = 0; updateShadow(sh, 1 / 60);
  const shurikens = state.enemyProjectiles.filter(p => p.type === 'shuriken');
  assert.ok(shurikens.length > 0, 'shadow throws shurikens');
  assert.ok(shurikens.every(p => p.damage === 5), 'shurikens are easy for beginners');
  sh.throwTimer = .01; updateShadow(sh, 1 / 60);
  assert.equal(sh.mode, 'vulnerable');
  damageBoss(sh, 40);
  assert.ok(sh.hp < 300, 'shadow vulnerable after throwing window');
  sh.hp = 150; updateShadow(sh, 1 / 60);
  assert.equal(sh.phase, 3);
  assert.equal(state.infernoTowers.filter(t => !t.destroyed).length, 4, 'phase 3 spawns 4 towers');
  const hpGuarded = sh.hp;
  damageBoss(sh, 50);
  assert.equal(sh.hp, hpGuarded, 'shadow invulnerable while guarded by towers');
  exhaustShadow();
  damageBoss(sh, 60);
  assert.ok(sh.hp < hpGuarded, 'shadow vulnerable 15s after towers fall');
  state.bosses = []; state.infernoTowers = []; state.enemyProjectiles = [];
  state.peace = false;
});

test('shadow attacks in bursts with a 2s pause', async () => {
  const { createShadow, updateShadow } = await import('../js/bosses/shadow.js');
  state.gameRunning = true; state.paused = false; state.finished = false; state.notMe = false; state.peace = false;
  state.bosses = []; state.enemyProjectiles = []; state.infernoTowers = []; state.fireTrails = [];
  createShadow(500, 400);
  const sh = state.bosses[0];
  sh.mode = 'stalking';
  state.player = { x: sh.x + 120, y: sh.y, r: 17, speed: 260 };
  sh.pauseTimer = 2; sh.fireCooldown = 0; sh.sprintTimer = 0;
  const n0 = state.enemyProjectiles.length;
  let threwDuringPause = false;
  for (let i = 0; i < 60; i++) { updateShadow(sh, 1 / 60); if (state.enemyProjectiles.length > n0) { threwDuringPause = true; break } }
  assert.ok(!threwDuringPause, 'boss rests 2s after attacking');
  for (let i = 0; i < 600 && state.enemyProjectiles.length <= n0; i++) updateShadow(sh, 1 / 60);
  assert.ok(state.enemyProjectiles.length > n0, 'boss attacks again after the pause');
  state.bosses = []; state.infernoTowers = []; state.enemyProjectiles = [];
});

test('admin unlock is never persisted and uses the new code', async () => {
  const { loadUnlocks } = await import('../js/ui.js');
  const { ADMIN_UNLOCK_CODE } = await import('../js/config.js');
  assert.equal(ADMIN_UNLOCK_CODE, 'GH0163XYZ', 'new admin code is active');
  localStorage.setItem('bossrushUnlocks', JSON.stringify({ healer: true, admin: true }));
  state.unlocks.admin = true;
  loadUnlocks();
  assert.equal(state.unlocks.admin, false, 'admin unlock is session-only');
  assert.equal(state.unlocks.healer, true, 'boss unlocks still persist');
});

test('admin mode sticks across lobby/restart until a normal class is picked', async () => {
  state.unlocks.admin = true;
  state.adminMode = true;
  state.isAdmin = false;
  state.selected = 'admin';
  state.adminBaseClass = 'tank';
  startGame();
  assert.equal(state.isAdmin, true);
  assert.equal(state.selected, 'tank');
  for (let i = 0; i < 5 && !state.finished; i++) update(1 / 60);
  state.selected = 'archer';
  startGame();
  assert.equal(state.isAdmin, true, 'admin mode survives second start');
  assert.equal(state.selected, 'tank');
  state.adminMode = false;
  state.isAdmin = false;
  state.selected = 'archer';
  startGame();
  assert.equal(state.isAdmin, false, 'normal class pick disables admin');
});
