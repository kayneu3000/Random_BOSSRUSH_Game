import test from 'node:test';
import assert from 'node:assert/strict';

function makeElement(id) {
  return {
    id,
    textContent: '',
    innerHTML: '',
    className: '',
    children: [],
    style: {},
    get firstChild() { return this.children[0] || null; },
    appendChild(child) { this.children.push(child); return child; },
    replaceChildren(...kids) { this.children = kids.slice(); },
    removeChild(child) { this.children = this.children.filter(c => c !== child); return child; },
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
  let depth = 0;
  return new Proxy(
    {},
    {
      get(_t, key) {
        if (key === '__stackDepth') return depth;
        if (key === 'save') return () => { depth++; };
        if (key === 'restore') return () => { depth = Math.max(0, depth - 1); };
        if (key === 'createLinearGradient' || key === 'createRadialGradient') {
          return () => ({ addColorStop() {} });
        }
        return () => undefined;
      },
      set() { return true; }
    }
  );
}

const canvasEl = () => document.getElementById('canvas');

const store = new Map();
const elements = new Map();
const registerElement = id => {
  if (!elements.has(id)) {
    const el = makeElement(id);
    if (id === 'canvas') { const c = makeCtx(); el.getContext = () => c; }
    elements.set(id, el);
  }
  return elements.get(id);
};

globalThis.document = {
  getElementById: registerElement,
  querySelectorAll: () => [],
  createElement: () => makeElement('created'),
  addEventListener() {},
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
  assert.deepEqual(state.bossRushQueue, ['dragon', 'gunball', 'shadow', 'snake', 'plant']);
  assert.ok(state.bosses.some(b => b.type === 'slime' && b.alive));
  for (let i = 0; i < 20 && !state.finished; i++) update(1 / 60);
  for (const b of state.bosses) b.alive = false;
  update(1 / 60);
  assert.ok(state.bosses.some(b => b.type === 'dragon' && b.alive), 'next boss rush boss spawns');
  assert.equal(state.bossRushQueue.length, 4);
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
  assert.equal(state.selected, 'gunner', 'Hugo #46: Admin remappt auf Basisklasse (wie frueher)');
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
  assert.equal(state.selected, 'tank', 'Hugo #46: Admin remappt auf Basisklasse (wie frueher)');
  for (let i = 0; i < 5 && !state.finished; i++) update(1 / 60);
  state.selected = 'archer';
  startGame();
  assert.equal(state.isAdmin, true, 'admin mode survives second start');
  assert.equal(state.selected, 'archer', 'gewaehlte Klasse bleibt (isAdmin + adminMode)');
  state.adminMode = false;
  state.isAdmin = false;
  state.selected = 'archer';
  startGame();
  assert.equal(state.isAdmin, false, 'normal class pick disables admin');
});
test('snake: food destruction costs NOTHING — only the 7s hunger rule bites (Hugo #44)', async () => {
  const { createSnake, updateSnake, damageSmallSnake } = await import('../js/bosses/snake.js');
  const { damageBoss } = await import('../js/entities.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.notMe = false; state.peace = false; state.dmgMultiplier = 1; state.invincible = false;
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = []; state.infernoTowers = []; state.fireTrails = []; state.projectiles = [];
  createSnake(500, 300);
  const sn = state.bosses.find(b => b.type === 'snake');
  const sk = state.bosses.find(b => b.type === 'snakeSkin');
  sk.alive = false;
  assert.equal(sn.segments, 8, 'snake starts with 8 segments');
  assert.equal(sn.maxHp, 1000, 'HUGO-Skala: Leiste ist immer 10 Zehntel');
  damageBoss(sn, 50);
  assert.equal(sn.hp, 800, 'snake is immune to direct hits (8/10 Leiste)');
  state.player = { x: sn.x + 400, y: sn.y, r: 17, hp: 100, maxHp: 100, speed: 260, angle: 0 };
  sn.appleTimer = 99; /* kein Nachschub */
  state.smallSnakes.push({ id: 999, type: 'smallSnake', x: sn.x + 500, y: sn.y, r: 14, hp: 60, maxHp: 60, alive: true, destroyed: false, wobble: 0, dir: 0, turnTimer: 1 });
  damageSmallSnake(state.smallSnakes[0], 999);
  assert.equal(sn.segments, 8, 'HUGO #44: Essen zerstoeren kostet Snake NICHTS');
  assert.equal(sn.hp, 800, 'Leiste bleibt 8/10');
  /* 7 Sekunden NICHTS gefressen -> erst jetzt -1/10 */
  sn.hungerTimer = 0;
  for (let i = 0; i < 421; i++) updateSnake(sn, 1 / 60); /* 421: float-sicher ueber 7s */
  assert.equal(sn.segments, 7, 'nach 7s ohne Fressen: -1/10 Leiste');
  assert.equal(sn.alive, true, 'Snake lebt noch');
  /* 8 Hunger-Schlaege insgesamt = Snake besiegt (nur noch Kopf) */
  for (let i = 0; i < 8; i++) { sn.hungerTimer = 0; updateSnake(sn, 7); }
  assert.equal(sn.segments, 0);
  assert.equal(sn.alive, false, 'Snake-Sieg durch Hunger (nur noch Kopf)');
  assert.ok(state.finished, 'Sieg wird ausgeloest');
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = []; state.fireTrails = [];
});

test('the snake itself no longer attacks the player', async () => {
  const { createSnake, updateSnake } = await import('../js/bosses/snake.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.notMe = false; state.peace = false; state.invincible = false; state.dmgMultiplier = 1;
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = []; state.infernoTowers = []; state.fireTrails = [];
  createSnake(500, 300);
  const sn = state.bosses.find(b => b.type === 'snake');
  const sk = state.bosses.find(b => b.type === 'snakeSkin');
  sk.alive = false;
  state.player = { x: sn.x, y: sn.y, r: 17, hp: 100, maxHp: 100, speed: 260, angle: 0 };
  state.invuln = 0; sn.appleTimer = 99; sn.attackCooldown = 0;
  const hp0 = state.player.hp;
  for (let i = 0; i < 120; i++) updateSnake(sn, 1 / 60);
  assert.equal(state.player.hp, hp0, 'the snake itself never damages the player');
  assert.equal(state.enemyProjectiles.filter(p => p.type === 'venom').length, 0, 'the snake itself never spits venom');
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = [];
});

test('the skin hunts the player: venom, tail strike and contact damage', async () => {
  const { createSnake } = await import('../js/bosses/snake.js');
  const { updateSnakeSkin } = await import('../js/bosses/snakeSkin.js');
  const { damageBoss } = await import('../js/entities.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.notMe = false; state.peace = false; state.invincible = false; state.dmgMultiplier = 1;
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = []; state.infernoTowers = []; state.fireTrails = [];
  createSnake(500, 300);
  const sk = state.bosses.find(b => b.type === 'snakeSkin');
  state.player = { x: sk.x + 30, y: sk.y, r: 17, hp: 100, maxHp: 100, speed: 260, angle: 0 };
  state.invuln = 0;
  sk.venomCooldown = 0; sk.attackCooldown = 0;
  const hp0 = state.player.hp;
  updateSnakeSkin(sk, 1 / 60);
  assert.ok(state.enemyProjectiles.some(p => p.type === 'venom'), 'the skin shoots venom at the player');
  assert.ok(state.player.hp < hp0, 'the tail strike hurts on contact');
  assert.equal(sk.attackCooldown, 1, 'the tail strike has a 1s cooldown');
  damageBoss(sk, 120);
  assert.equal(sk.hp, 380, 'the skin is vulnerable to direct hits');
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = [];
});

test('the skin orbits and periodically sprints at the player', async () => {
  const { createSnakeSkin, updateSnakeSkin } = await import('../js/bosses/snakeSkin.js');
  const { damageBoss } = await import('../js/entities.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.notMe = false; state.peace = false; state.invincible = false; state.dmgMultiplier = 1;
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = []; state.infernoTowers = []; state.fireTrails = [];
  createSnakeSkin(600, 300);
  const sk = state.bosses.find(b => b.type === 'snakeSkin');
  assert.equal(sk.hp, 500, 'the skin has 500 hp');
  state.player = { x: sk.x + 240, y: sk.y, r: 17, hp: 100, maxHp: 100, speed: 260, angle: 0 };
  state.invuln = 0;
  sk.venomCooldown = 99; sk.sprintCooldown = 0; sk.mode = 'circle';
  updateSnakeSkin(sk, 1 / 60);
  assert.equal(sk.mode, 'sprint', 'after its cooldown the skin sprints toward the player');
  assert.ok(Math.abs(sk.sprintDx - 1) < .01 && Math.abs(sk.sprintDy) < .01, 'the sprint aims at the player');
  sk.mode = 'circle'; sk.sprintTimer = 0;
  const a0 = Math.atan2(sk.y - state.player.y, sk.x - state.player.x);
  sk.venomCooldown = 0;
  updateSnakeSkin(sk, 1 / 60);
  const a1 = Math.atan2(sk.y - state.player.y, sk.x - state.player.x);
  assert.ok(Math.abs(Math.sin(a1 - a0)) > .01, 'the skin circles around the player');
  assert.ok(state.enemyProjectiles.some(p => p.type === 'venom'), 'venom fires in circle mode too');
  const sn2 = state.bosses.find(b => b.type === 'snake');
  damageBoss(sk, 9999);
  assert.equal(sk.alive, false, 'the skin dies to direct hits');
  assert.equal(sn2, undefined, 'no snake is needed for a standalone skin');
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = [];
});

test('a destroyed skin respawns 15 seconds later near the snake', async () => {
  const { createSnake, updateSnake } = await import('../js/bosses/snake.js');
  const { damageBoss } = await import('../js/entities.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.notMe = false; state.peace = false; state.dmgMultiplier = 1;
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = []; state.infernoTowers = []; state.fireTrails = [];
  createSnake(500, 300);
  const sn = state.bosses.find(b => b.type === 'snake');
  const sk = state.bosses.find(b => b.type === 'snakeSkin');
  assert.equal(sn.skinRespawn, -1, 'no respawn is running at the start');
  damageBoss(sk, 9999);
  assert.equal(sk.alive, false, 'the skin dies');
  assert.equal(sn.skinRespawn, 15, 'a 15 second respawn timer starts');
  for (let i = 0; i < 60 * 8 && sn.skinRespawn > 0; i++) updateSnake(sn, 1 / 60);
  assert.ok(Math.abs(sn.skinRespawn - 7) < .05, '8 seconds later the skin is still gone');
  assert.ok(!state.bosses.some(b => b.type === 'snakeSkin' && b.alive), 'no early respawn');
  for (let i = 0; i < 60 * 9 && sn.skinRespawn > 0; i++) updateSnake(sn, 1 / 60);
  assert.equal(sn.skinRespawn, -1, 'the respawn timer finished');
  assert.ok(state.bosses.some(b => b.type === 'snakeSkin' && b.alive), 'a new skin spawned');
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = [];
});

test('snake eats small snakes to grow', async () => {
  const { createSnake, updateSnake } = await import('../js/bosses/snake.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.notMe = false; state.peace = true; state.dmgMultiplier = 1;
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = []; state.infernoTowers = []; state.fireTrails = [];
  createSnake(500, 300);
  const sn = state.bosses.find(b => b.type === 'snake');
  state.smallSnakes.push({ x: sn.x, y: sn.y, r: 20, hp: 60, maxHp: 60, wobble: 0, dir: 0, turnTimer: 9, destroyed: false });
  const segs0 = sn.segments, hp0 = sn.hp;
  updateSnake(sn, 1 / 60);
  assert.equal(sn.segments, segs0 + 1, 'eating a small snake adds a segment');
  assert.equal(sn.maxHp, 1000, 'maxHp stays on the fixed 10-tenths scale');
  assert.equal(sn.hp, hp0 + 100, 'HUGO-Skala: +1/10 Leiste pro gegessener Schlange');
  assert.equal(state.smallSnakes[0].destroyed, true, 'the small snake was eaten');
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = [];
});

test('snake fight boots via lobby data and shows the HUD for snake and skin', async () => {
  state.selected = 'archer'; state.selectedBoss = 'snake';
  state.unlocks = { healer: true, ember: true, gunner: true, admin: false };
  state.adminMode = false; state.isAdmin = false;
  startGame();
  assert.ok(state.bosses.some(b => b.type === 'snake' && b.alive), 'snake fight spawns');
  assert.ok(state.bosses.some(b => b.type === 'snakeSkin' && b.alive), 'the skin spawns with the fight');
  const { updateHUD } = await import('../js/ui.js');
  updateHUD();
  assert.equal(document.getElementById('bossName').textContent, 'Snake + DIE HAUT');
  const bars = document.getElementById('bossBars').children;
  assert.equal(bars.length, 2, 'the snake and the skin each get a bar');
  assert.equal(bars[0].children[0].textContent, 'Snake', 'the snake bar is labeled Snake');
  assert.equal(bars[1].children[0].textContent, 'DIE HAUT', 'the skin bar is labeled DIE HAUT');
  const sk = state.bosses.find(b => b.type === 'snakeSkin');
  sk.alive = false;
  updateHUD();
  assert.equal(document.getElementById('bossName').textContent, 'Snake');
  assert.ok(document.getElementById('bossCount').textContent.includes('SEGMENTE'), 'segment hud is shown');
  state.bosses = []; state.smallSnakes = [];
});

test('boss bars: one per boss including the skin (HAUT-HUD, sichtbarer Schaden)', async () => {
  const { createSnakeSkin } = await import('../js/bosses/snakeSkin.js');
  const { createSlime } = await import('../js/bosses/slime.js');
  const { updateHUD } = await import('../js/ui.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = []; state.infernoTowers = []; state.fireTrails = [];
  state.peace = false; state.notMe = false; state.duel = undefined; state.duelTargets = undefined;
  createSnakeSkin(600, 300);
  updateHUD();
  assert.equal(document.getElementById('bossName').textContent, 'DIE HAUT', 'skin name is still shown');
  assert.equal(document.getElementById('bossBars').children.length, 1, 'the skin gets its own bar (HAUT-HUD)');
  assert.equal(document.getElementById('bossBars').children[0].children[0].textContent, 'DIE HAUT');
  createSlime(400, 300, 1);
  const { createSnake } = await import('../js/bosses/snake.js');
  createSnake(500, 300);
  updateHUD();
  const labels = document.getElementById('bossBars').children.map(r => r.children[0].textContent);
  assert.deepEqual(labels.filter(l => l === 'SLIME').length, 1, 'each boss gets exactly one bar');
  assert.deepEqual(labels.filter(l => l === 'Snake').length, 1, 'the snake bar is labeled Snake');
  // createSnake zieht automatisch eine eigene Haut nach -> 2 Haut-Leisten im Test
  assert.deepEqual(labels.filter(l => l === 'DIE HAUT').length, 2, 'every skin gets her own bar');
  assert.ok(document.getElementById('bossCount').textContent.includes('BOSSE AKTIV'), 'multi-boss count shown');
  state.bosses = []; state.smallSnakes = [];
});

test('snake stays locked until slime, dragon and gunball are defeated', () => {
  state.unlocks.healer = true; state.unlocks.ember = true; state.unlocks.gunner = true;
  const el = document.getElementById('selectSnake');
  state.selectedBoss = 'shadow';
  el.onclick();
  assert.equal(state.selectedBoss, 'snake', 'unlocked after three wins');
  state.unlocks.gunner = false;
  state.selectedBoss = 'shadow';
  el.onclick();
  assert.equal(state.selectedBoss, 'shadow', 'locked without all three wins');
  state.unlocks.gunner = true;
  state.bosses = []; state.smallSnakes = [];
});

test('snake, skin and small snake rendering paths run without throwing', async () => {
  const { draw } = await import('../js/render.js');
  const { createSnake } = await import('../js/bosses/snake.js');
  state.gameRunning = true; state.paused = false; state.finished = false; state.notMe = false;
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = []; state.infernoTowers = []; state.fireTrails = [];
  state.selected = 'archer'; state.selectedBoss = 'snake'; state.peace = false;
  createSnake(400, 300);
  state.smallSnakes.push({ x: 520, y: 260, r: 20, hp: 60, maxHp: 60, wobble: 1, dir: 1, turnTimer: 9, destroyed: false });
  const sn = state.bosses.find(b => b.type === 'snake');
  sn.trail = [{ x: 380, y: 300 }, { x: 360, y: 300 }];
  state.player = { x: 640, y: 420, r: 17, speed: 260, angle: 0 };
  for (let i = 0; i < 20 && !state.finished; i++) update(1 / 60);
  draw();
  const sk = state.bosses.find(b => b.type === 'snakeSkin');
  sk.mode = 'sprint';
  draw();
  assert.ok(sn.alive && sk.alive);
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = [];
});

test('snake looks around instead of staring at the player constantly', async () => {
  const { createSnake, updateSnake } = await import('../js/bosses/snake.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.notMe = false; state.peace = true; state.dmgMultiplier = 1;
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = []; state.infernoTowers = []; state.fireTrails = [];
  createSnake(500, 300);
  const sn = state.bosses.find(b => b.type === 'snake');
  const sk = state.bosses.find(b => b.type === 'snakeSkin');
  sk.alive = false;
  state.player = { x: sn.x, y: sn.y - 500, r: 17, hp: 100, maxHp: 100, speed: 260, angle: 0 };
  sn.faceAngle = 0; sn.faceTarget = 0; sn.faceTimer = 99; sn.wanderAngle = -Math.PI / 2; sn.appleTimer = 99;
  updateSnake(sn, 1 / 60);
  assert.equal(sn.faceAngle, 0, 'no re-lock while the look timer runs');
  const realRandom = Math.random;
  Math.random = () => 0.5;
  try {
    sn.wanderAngle = -Math.PI / 2;
    sn.faceTimer = 0;
    updateSnake(sn, 1 / 60);
    assert.ok(Math.abs(sn.faceTarget - (-Math.PI / 2)) < 0.01, 're-lock aims along the travel direction');
    for (let i = 0; i < 120; i++) updateSnake(sn, 1 / 60);
    assert.ok(Math.abs(Math.atan2(Math.sin(sn.faceAngle + Math.PI / 2), Math.cos(sn.faceAngle + Math.PI / 2))) < .3, 'face angle rotates toward the look target');
  } finally {
    Math.random = realRandom;
  }
  state.bosses = []; state.smallSnakes = []; state.enemyProjectiles = [];
});

test('resizeCanvas haertet 0/NaN-Groesse (schwarzer-Bildschirm-Fix)', async () => {
  const { resizeCanvas } = await import('../js/canvas.js');
  const prevW = canvasEl().clientWidth, prevH = canvasEl().clientHeight;
  try {
    canvasEl().clientWidth = 0; canvasEl().clientHeight = 0;
    resizeCanvas();
    assert.ok(Number.isFinite(state.W) && state.W >= 1, 'state.W ist >= 1');
    assert.ok(Number.isFinite(state.H) && state.H >= 1, 'state.H ist >= 1');
    assert.ok(canvasEl().width >= 1 && canvasEl().height >= 1, 'canvas Backing-Store niemals 0');
  } finally {
    canvasEl().clientWidth = prevW; canvasEl().clientHeight = prevH;
    resizeCanvas();
  }
});

test('showErrBox schreibt Fehler sichtbar ins Diagnose-Banner', async () => {
  const { showErrBox } = await import('../js/ui.js');
  showErrBox(new Error('Test-BUG-XYZ'));
  const box = document.getElementById('errBox');
  assert.ok(String(box.textContent).includes('Test-BUG-XYZ'), 'Banner enthaelt Meldung');
  box.textContent = ''; box.style.display = 'none';
});

test('CANVAS-WACHE: draw() hinterlaesst keinen save/restore-Stack (schwarzer-Bildschirm-Regression drawSkin)', async () => {
  state.selected = 'faust'; state.selectedBoss = 'snake';
  state.unlocks = { healer: true, ember: true, gunner: true, admin: false };
  state.adminMode = false; state.isAdmin = false;
  startGame();
  const { update } = await import('../js/main.js');
  const { draw } = await import('../js/render.js');
  const { updateHUD } = await import('../js/ui.js');
  const ctx = (await import('../js/canvas.js')).ctx;
  const dt = 1 / 60;
  for (let f = 0; f < 90; f++) {
    state.keys.KeyW = f % 6 < 3; state.keys.KeyD = f % 8 < 4;
    update(dt); updateHUD(); draw();
    assert.equal(ctx.__stackDepth, 0, 'Frame ' + f + ': draw() leakte einen Canvas-State (save/restore-Imbalance)');
  }
  const sk = state.bosses.find(b => b.type === 'snakeSkin');
  if (sk) sk.alive = false;
  for (let f = 0; f < 30; f++) {
    update(dt); updateHUD(); draw();
    assert.equal(ctx.__stackDepth, 0, 'Skin-Tod-Frame ' + f + ': Imbalance');
  }
  state.bosses = []; state.smallSnakes = [];
});

test('the whip class: 220 hp, long line attack, 0.5s cooldown, 30 damage (Hugo)', async () => {
  const { attack } = await import('../js/combat.js');
  const { classes } = await import('../js/config.js');
  const w = classes.whip;
  assert.equal(w.hp, 220, 'Peitsche hat 220 HP');
  assert.equal(w.damage, 40, 'Peitsche macht 40 Schaden');
  assert.equal(w.cool, .5, 'Peitsche hat 0,5s Angriffscooldown');
  assert.equal(w.speed, 270, 'Peitsche ist etwas schneller als normale Klassen');
  assert.ok(w.line, 'Peitsche greift in einer Linie an');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.selected = 'whip'; state.attackTimer = 0; state.cooldownOverride = 0;
  state.notMe = false; state.peace = false; state.invincible = false; state.dmgMultiplier = 1;
  state.player = { x: 500, y: 500, r: 17, hp: 220, maxHp: 220, speed: w.speed, angle: 0, dashX: 0, dashY: 0 };
  state.bosses = []; state.smallSnakes = []; state.infernoTowers = []; state.enemyProjectiles = []; state.fireTrails = []; state.projectiles = []; state.effects = [];
  const onLine = { id: 1, type: 'slime', x: 700, y: 502, r: 40, hp: 100, maxHp: 100, alive: true, flash: 0, wobble: 0, attackCooldown: 0, tier: 4 };
  const offLine = { id: 2, type: 'slime', x: 640, y: 640, r: 40, hp: 100, maxHp: 100, alive: true, flash: 0, wobble: 0, attackCooldown: 0, tier: 4 };
  const farAway = { id: 3, type: 'slime', x: 900, y: 500, r: 40, hp: 100, maxHp: 100, alive: true, flash: 0, wobble: 0, attackCooldown: 0, tier: 4 };
  state.bosses.push(onLine, offLine, farAway);
  attack();
  assert.equal(onLine.hp, 60, 'Peitsche trifft das Ziel in der Linie (40 Schaden)');
  assert.equal(offLine.hp, 100, 'Peitsche trifft Ziele neben der Linie NICHT');
  assert.equal(farAway.hp, 100, 'Peitsche trifft Ziele ausserhalb der Reichweite NICHT');
  assert.ok(Math.abs(state.attackTimer - .5) < 1e-9, '0,5s Cooldown gesetzt');
  assert.ok(state.effects.some(e => e.type === 'slash' && e.weapon === 'whip'), 'Peitschen-Schlag-Effekt sichtbar');
});

test('the whip class is locked until the snake is beaten (Hugo)', async () => {
  const { state } = await import('../js/state.js');
  assert.ok(!state.unlocks.whip, 'Peitsche startet gesperrt');
  state.unlocks.whip = true; // Simulierte Snake-Sieg-Freischaltung
  assert.equal(state.unlocks.whip, true);
  state.unlocks.whip = false;
});

test('admin attacks like before — no special skin anymore (Hugo #46 WIE-FRUEHER)', async () => {
  const { attack } = await import('../js/combat.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.isAdmin = true; state.selected = 'faust'; state.attackTimer = 0; state.cooldownOverride = 0;
  state.notMe = false; state.peace = false; state.invincible = false; state.dmgMultiplier = 1;
  state.player = { x: 500, y: 500, r: 17, hp: 100, maxHp: 100, speed: 260, angle: 0, dashX: 0, dashY: 0 };
  state.bosses = []; state.smallSnakes = []; state.infernoTowers = []; state.effects = []; state.projectiles = [];
  const dummy = { id: 9, type: 'slime', x: 560, y: 500, r: 40, hp: 100, maxHp: 100, alive: true, flash: 0, wobble: 0, attackCooldown: 0, tier: 4 };
  state.bosses.push(dummy);
  attack();
  assert.equal(dummy.hp, 90, 'ADMIN greift wie eine normale Klasse an (Faust 10)');
  state.isAdmin = false;
});

test('admin has NO own class anymore: remaps to base class (Hugo #46 WIE-FRUEHER)', async () => {
  const { classes } = await import('../js/config.js');
  assert.ok(!classes.admin, 'ADMIN ist keine eigene Klasse mehr (kein Eigen-Design)');
  state.selected = 'admin'; state.selectedBoss = 'snake';
  state.adminMode = false; state.isAdmin = false;
  state.adminBaseClass = 'archer';
  startGame();
  assert.equal(state.isAdmin, true, 'Admin-Modus aktiv');
  assert.equal(state.selected, 'archer', 'Admin spielt als Basisklasse (Bogen)');
  assert.equal(state.player.maxHp, 100, 'Basisklassen-HP (kein 300-HP-Eigen-Design)');
  assert.ok(document.getElementById('className').textContent.indexOf('ADMIN') >= 0, 'HUD zeigt ADMIN · Basisklasse');
  state.isAdmin = false;
});

test('snake hunger: 7s ohne Essen kostet ein Zehntel (Hugo #43)', async () => {
  const { updateSnake } = await import('../js/bosses/snake.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.isAdmin = false; state.selected = 'faust'; state.selectedBoss = 'snake';
  state.dmgMultiplier = 1; state.notMe = false; state.peace = false; state.invincible = false;
  state.screenShake = 0; state.kills = 0;
  const snake = { id: 21, type: 'snake', x: 500, y: 500, r: 40, hp: 800, maxHp: 1000, alive: true, flash: 0, wobble: 0, segments: 8, trail: [], appleTimer: 100, hungerTimer: 0, skinRespawn: -1, attackCooldown: 0, faceAngle: 0, faceTarget: 0, faceTimer: 1, wanderAngle: 0 };
  state.bosses = [snake]; state.smallSnakes = []; state.effects = []; state.projectiles = []; state.infernoTowers = []; state.fireTrails = [];
  for (let i = 0; i < 6; i++) updateSnake(snake, 1);
  assert.equal(snake.segments, 8, 'Nach 6 Sekunden Hunger noch 8 Segmente');
  updateSnake(snake, 1);
  assert.equal(snake.segments, 7, 'Nach 7 Sekunden ohne Essen: 1 Segment verloren');
  assert.equal(snake.hp, 700, 'hp folgt der Zehntel-Skala (700/1000)');
  assert.equal(snake.hungerTimer, 0, 'Hunger-Timer resettet nach dem Hunger-Schlag');
  // Fang einer kleinen Schlange resettet den Hunger-Timer (+1/10 geheilt)
  snake.hungerTimer = 6.9;
  state.smallSnakes = [{ id: 22, type: 'smallSnake', x: snake.x, y: snake.y, r: 14, hp: 60, maxHp: 60, alive: true, destroyed: false, wobble: 0, dir: 0, turnTimer: 1 }];
  updateSnake(snake, 1);
  assert.equal(snake.segments, 8, 'Fang heilt ein Segment (+1/10)');
  assert.ok(snake.hungerTimer < 7, 'Fang resettet den Hunger-Timer');
  state.bosses = []; state.smallSnakes = [];
});

/* ---------- PLANT + SAUGER (Hugo #47) ---------- */

test('sauger class + plant constants exist per Hugo spec (#47/#49)', async () => {
  const { classes, PLANT_HP, MINI_PLANT_HP, MINI_PLANT_RANGE, ACID_POOL_LIFE } = await import('../js/config.js');
  const sg = classes.sauger;
  assert.ok(sg, 'SAUGER-Klasse existiert');
  assert.equal(sg.hp, 250, 'Sauger hat 250 HP');
  assert.equal(sg.cool, 2, 'Sauger hat 2s Cooldown');
  assert.equal(sg.damage, 40, 'Sauger macht MEHR Schaden (Hugo #49)');
  assert.ok(sg.pull, 'Sauger zieht Gegner an');
  assert.equal(PLANT_HP, 1300, 'Plant hat 1300 HP, dafuer IMMER angreifbar (Hugo #55)');
  assert.equal(MINI_PLANT_HP, 60, 'Mini-Fresspflanzen haben JE 60 HP (Hugo #49)');
  assert.equal(MINI_PLANT_RANGE, 110, 'Minis haben etwas kleinere Reichweite (Hugo #50)');
  assert.equal(ACID_POOL_LIFE, 6, 'Saeure-Pfuetzen bleiben 6s liegen');
});

test('plant fight boots: rooted boss with 700 hp, arrays reset, frames stable', async () => {
  state.selected = 'faust'; state.selectedBoss = 'plant';
  state.isAdmin = false; state.adminMode = false;
  state.acidPools = [{x:0,y:0,life:1,r:10,tick:0}]; state.miniPlants = [{x:0,y:0,hp:60,maxHp:60,r:10,biteCd:1,wobble:0}]; state.shockwaves = [{x:0,y:0,r:10,speed:10,life:1,hit:false}];
  state.vineSweeps = [{x:0,y:0,a0:0,a1:1,t:0,dur:1,delay:0,hit:false,dmg:14,curAng:0,len:0}]; state.craters = [{x:0,y:0,r:50,life:20,max:20}];
  startGame();
  assert.equal(state.bosses.length, 1);
  const b = state.bosses[0];
  assert.equal(b.type, 'plant', 'Plant spawn im Plant-Fight');
  assert.equal(b.hp, 1300, 'Plant hat 1300 HP (Hugo #55)');
  assert.equal(b.maxHp, 1300, 'Plant maxHp 1300');
  assert.ok(state.acidPools.length === 0 && state.miniPlants.length === 0 && state.shockwaves.length === 0, 'Pfuetzen/Minis/Wellen werden beim Start geleert');
  assert.ok(state.vineSweeps.length === 0 && state.craters.length === 0, 'Ranken-Schwaenge/Krater werden beim Start geleert (Hugo #49)');
  assert.equal(state.player.stuckTimer, 0, 'HUGO-BUG #50: stuckTimer MUSS initialisiert sein (sonst faengt die Zunge NIE)');
  assert.equal(state.player.flingT, 0, 'flingT initialisiert (Schleuder-Physik)');
  state.keys.KeyJ = false; state.keys.Space = false;
  for (let i = 0; i < 180 && !state.finished; i++) update(1/60);
  assert.ok(state.elapsed > 1, 'Plant-Fight laeuft stabil');
  assert.ok(state.bosses.some(b => b.alive) || state.finished);
  state.bosses = []; state.finished = true; state.gameRunning = false;
});

test('plant IMMER angreifbar, 1300 HP, greift DIE GANZE ZEIT an (Hugo #55)', async () => {
  const { updatePlant, plantSurviveHit } = await import('../js/bosses/plant.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.dmgMultiplier = 1; state.notMe = false; state.peace = false; state.invincible = false; state.invuln = 0;
  state.player = { x: 900, y: 300, r: 17, hp: 999, maxHp: 999, speed: 200, angle: 0, dashX: 0, dashY: 0, stuckTimer: 0 };
  state.acidPools = []; state.miniPlants = []; state.shockwaves = []; state.enemyProjectiles = [];
  const b = { id: 31, type: 'plant', x: 600, y: 300, r: 62, hp: 1300, maxHp: 1300, alive: true, flash: 0, wobble: 0, burrowed: false, burrowSub: 0, mouthOpen: 0, chew: 0, vineTimer: 99, acidSpitTimer: 99, seedTimer: 99, tongueTimer: 99, beamTimer: 99, burrowTimer: 99, screamTimer: 99, biteTimer: 0, beamCharge: 0, beamFire: 0, beamAngle: 0, tongue: { active: false, mode: 'out', t: 0, x: 0, y: 0, ex: 0, ey: 0, dir: 1, edge: '', caught: false }, faceAngle: 0, attackCooldown: 0 };
  state.bosses = [b]; state.effects = []; state.particles = [];
  /* kein Schild mehr: DEINE Angriffe treffen IMMER */
  damageBoss(b, 40);
  assert.equal(b.hp, 1260, 'IMMER angreifbar: jeder Treffer zaehlt (Hugo #55)');
  plantSurviveHit(b); /* no-op */
  assert.equal(b.hp, 1260, 'plantSurviveHit ist jetzt no-op');
  /* sie greift DIE GANZE ZEIT an: nach 5s (kein Cooldown-Stop mehr) kamen Attacken */
  b.vineTimer = .2; b.biteTimer = 99;
  for (let i = 0; i < 360 && !state.finished; i++) updatePlant(b, 1/60);
  assert.ok(b.vineTimer < 7, 'sie greift ohne Schild-PAUSE weiter an (Ranken kommen wieder)') ;
  state.bosses = [];
});

test('mini plants: STATIONAER, grosse Reichweite, je 60 HP, unendlich da (Hugo #49)', async () => {
  const { createMiniPlant, updateMiniPlants, damageMiniPlant } = await import('../js/bosses/plant.js');
  const { MINI_PLANT_HP } = await import('../js/config.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.invincible = false; state.peace = false; state.invuln = 0; state.brutal = false; state.selected = 'faust';
  state.player = { x: 505, y: 505, r: 17, hp: 500, maxHp: 500, speed: 200, angle: 0, dashX: 0, dashY: 0, stuckTimer: 0 };
  state.miniPlants = []; state.effects = []; state.particles = []; state.bosses = [];
  createMiniPlant(505, 505);
  assert.equal(state.miniPlants.length, 1, 'Samen wird zur Mini-Fresspflanze');
  const a = state.miniPlants[0];
  assert.equal(a.hp, MINI_PLANT_HP, '60 HP pro Mini-Fresspflanze');
  const x0 = a.x, y0 = a.y;
  for (let i = 0; i < 60; i++) updateMiniPlants(1/60);
  assert.equal(a.x, x0, 'Mini bleibt auf der Stelle (x)');
  assert.equal(a.y, y0, 'Mini bleibt auf der Stelle (y)');
  /* Etwas KLEINERE Reichweite (Hugo #50): bei 150px NICHT mehr, bei 100px ja */
  state.player.x = 505; state.player.y = 505 - 150; state.player.hp = 500;
  state.invuln = 0; a.biteCd = 0;
  const hpFar = state.player.hp;
  updateMiniPlants(1/60);
  assert.equal(state.player.hp, hpFar, '150px: ausser Reichweite');
  state.player.y = 505 - 100; state.player.hp = 500; state.invuln = 0; a.biteCd = 0;
  const hp0 = state.player.hp;
  updateMiniPlants(1/60);
  assert.ok(state.player.hp < hp0, '100px: Biss trifft');
  /* Toetbar: 60 Schaden -> weg */
  damageMiniPlant(a, 60);
  updateMiniPlants(1/60);
  assert.equal(state.miniPlants.length, 0, '60 Schaden = Mini ist tot');
  /* UNENDLICH lange da: auch nach 20 Sekunden noch da */
  createMiniPlant(505, 505);
  for (let i = 0; i < 20; i++) updateMiniPlants(1);
  assert.equal(state.miniPlants.length, 1, 'unendlich lange da — kein Ablauf-Timer mehr');
  /* Spieler-Projektile treffen Minis */
  const { updatePlayerProjectiles } = await import('../js/projectiles.js');
  const a2 = state.miniPlants[0];
  state.projectiles = [{ x: a2.x, y: a2.y, vx: 0, vy: 0, life: .5, r: 7, damage: 30 }];
  updatePlayerProjectiles(1/60);
  assert.equal(a2.hp, 30, 'Spieler-Projektile schaden Minis');
  state.miniPlants = []; state.projectiles = [];
});

test('acid pools: tick damage while standing in them, evaporate after 6s', async () => {
  const { updateAcidPools } = await import('../js/bosses/plant.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.invincible = false; state.peace = false; state.invuln = 0; state.brutal = false; state.selected = 'faust';
  state.player = { x: 500, y: 500, r: 17, hp: 200, maxHp: 200, speed: 200, angle: 0, dashX: 0, dashY: 0, stuckTimer: 0 };
  state.acidPools = [{ x: 505, y: 505, r: 34, life: 6, tick: 0 }]; state.particles = [];
  const hp0 = state.player.hp;
  updateAcidPools(0.1);
  assert.ok(state.player.hp < hp0, 'Saeure in der Pfuetze brennt');
  state.player.invuln = 0;
  for (let i = 0; i < 70; i++) { state.invuln = 0; updateAcidPools(0.1) } /* 7 Sekunden */
  assert.equal(state.acidPools.length, 0, 'Pfuetze verdunstet nach ACID_POOL_LIFE');
});

test('sauger pull: moving boss is dragged, grabbed (stun + damage) and flung; rooted plant only takes damage', async () => {
  const { updatePulls, updateCraters } = await import('../js/combat.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.selected = 'sauger'; state.attackTimer = 0; state.cooldownOverride = 0;
  state.notMe = false; state.peace = false; state.invincible = false; state.dmgMultiplier = 1;
  state.player = { x: 500, y: 500, r: 17, hp: 250, maxHp: 250, speed: 245, angle: 0, dashX: 0, dashY: 0, stuckTimer: 0 };
  state.bosses = []; state.smallSnakes = []; state.infernoTowers = []; state.effects = []; state.projectiles = []; state.craters = []; state.miniPlants = [];
  const mover = { id: 41, type: 'slime', x: 700, y: 500, r: 40, hp: 200, maxHp: 200, alive: true, flash: 0, wobble: 0, attackCooldown: 0, tier: 4 };
  state.bosses.push(mover);
  attack();
  assert.ok(mover.saugerPull, 'beweglicher Gegner wird angesaugt');
  let winds = 0, spirals = 0, biteFx = null;
  for (let i = 0; i < 60 && mover.saugerPull; i++) {
    updatePulls(1/60);
    winds += state.effects.filter(e => e.type === 'suckWind').length;
    spirals += state.effects.filter(e => e.type === 'suckSpiral').length;
    if (!biteFx) { const sb = state.effects.find(e => e.type === 'saugerBite'); if (sb) biteFx = sb; }
    state.effects = [];
  }
  assert.ok(!mover.saugerPull, 'Griff abgeschlossen');
  assert.ok(winds > 0, 'SICHTBARE Saug-Wind-Wellen (Hugo #49)');
  assert.ok(spirals > 0, 'SPIRAL-Wind-Partikel kreisen um den Gegner (Hugo #56)');
  assert.ok(biteFx && biteFx.sx != null, 'AUSGESTRECKTER HALS: Biss-Effekt mit Hand-Anker (Hugo #56)');
  assert.ok(mover.hp < 200, 'Gegner nimmt Griff-Schaden (45 + 30)');
  assert.ok(mover.stunTimer > 0, 'Gegner kann kurz keinen Schaden machen');
  assert.ok(mover.flinging && Math.hypot(mover.kbx, mover.kby) > 0, 'echter Schleuder-Flug statt Teleport (Hugo #49)');
  assert.ok(mover.kbx < 0, 'HINTER SICH geschleudert (entgegen Blickrichtung, Hugo #50)'); /* Spieler schaut nach +x */
  assert.ok(mover.flingV0 > 0, 'flingV0 fuer BOGEN-Flug gesetzt (Hugo #56)');
  updateCraters(1/60);
  assert.ok(mover.arcLift > 0, 'BOGEN: Koerper steigt im Flug (arcLift, Hugo #56)');
  let cratered = false, crashFx = false;
  for (let i = 0; i < 240; i++) { updateCraters(1/60); if (state.effects.some(e => e.type === 'crashImpact')) crashFx = true; if (state.craters.length) { cratered = true; break } }
  assert.ok(cratered, 'Aufprall hinterlaesst einen KRATER (Hugo #49)');
  assert.ok(crashFx, 'EINSCHLAG-Effekt beim Aufprall (Hugo #56)');
  assert.equal(mover.arcLift, 0, 'Schatten am Ende wieder normal (Hugo #56)');
  assert.ok(mover.stunTimer > 0, 'Gegner liegt kurz betaebt im Krater (Hugo #56)');
  assert.ok(!mover.flinging, 'Flug endet am Stillstand');
  // unbeweglicher Boss: PFLANZE bekommt nur Schaden, kein Pull (Hugo #55: immer angreifbar!)
  state.selected = 'sauger'; state.attackTimer = 0;
  const plant = { id: 42, type: 'plant', x: 700, y: 500, r: 62, hp: 1300, maxHp: 1300, alive: true, flash: 0, wobble: 0, burrowed: false, tongue: { active: false } };
  state.bosses = [plant];
  attack();
  assert.ok(!plant.saugerPull, 'unbewegliche Pflanze wird NICHT gezogen');
  assert.ok(plant.hp < 1300, 'Sauger-Schaden landet JETZT IMMER bei der Pflanze (Hugo #55)');
  state.bosses = [];
});

test('ranken SCHWINGEN bis zum Maprand und schlagen auf der ganzen Linie (Hugo #49)', async () => {
  const { updateVineSweeps } = await import('../js/bosses/plant.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.invincible = false; state.peace = false; state.invuln = 0; state.brutal = false; state.dashDuration = 0;
  state.player = { x: 900, y: 500, r: 17, hp: 200, maxHp: 200, speed: 200, angle: 0, dashX: 0, dashY: 0, stuckTimer: 0, dashDuration: 0 };
  state.vineSweeps = []; state.bosses = []; state.particles = []; state.effects = [];
  const b = { id: 51, type: 'plant', x: 600, y: 500, r: 62, hp: 1300, maxHp: 1300, alive: true, flash: 0, wobble: 0, burrowed: false, tongue: { active: false }, beamCharge: 0, beamFire: 0 }; /* Schild entfernt (Hugo #55) */
  state.bosses = [b];
  state.vineSweeps.push({ x: 600, y: 500, a0: -0.02, a1: 0.02, t: 0, dur: .6, delay: 0, hit: false, dmg: 14, curAng: 0, len: 0 });
  const hp0 = state.player.hp;
  updateVineSweeps(1/60);
  assert.ok(state.player.hp < hp0, 'Ranke SCHLAEGT zu');
  const v = state.vineSweeps[0];
  assert.ok(v.len > 1000, 'Ranke reicht BIS ZUM MAPRAND');
  /* VORWARNUNG: waehrend der Delay-Phase trifft noch nichts (Hugo #50) */
  state.invuln = 0; state.dashDuration = 0; state.player.hp = 200; state.player.x = 900;
  const vw = { x: 600, y: 500, a0: -0.02, a1: 0.02, t: 0, dur: 1.05, delay: .6, hit: false, dmg: 14, curAng: 0, len: 0 };
  state.vineSweeps = [vw];
  const hpW = state.player.hp;
  updateVineSweeps(1/60);
  assert.equal(state.player.hp, hpW, 'Vorwarnung: blinkende Linien, aber noch kein Treffer');
  assert.ok(vw.delay < .6, 'Vorwarnung laeuft ab');
  /* Dash = sicher */
  state.invuln = 0; state.dashDuration = .2;
  const v2 = { x: 600, y: 500, a0: -0.02, a1: 0.02, t: 0, dur: .6, delay: 0, hit: false, dmg: 14, curAng: 0, len: 0 };
  state.vineSweeps = [v2];
  const hp1 = state.player.hp;
  updateVineSweeps(1/60);
  assert.equal(state.player.hp, hp1, 'waehrend des Dashes trifft die Ranke NICHT');
  state.vineSweeps = []; state.bosses = [];
});

test('schallwelle macht Schaden (Hugo #49: dashDuration-Bug behoben)', async () => {
  const { updateShockwaves } = await import('../js/bosses/plant.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.invincible = false; state.peace = false; state.invuln = 0; state.dashDuration = 0;
  state.player = { x: 500, y: 500, r: 17, hp: 200, maxHp: 200, speed: 200, angle: 0, dashX: 0, dashY: 0, stuckTimer: 0, dashDuration: 0 };
  state.shockwaves = [{ x: 500, y: 400, r: 95, speed: 100, life: 2, hit: false }];
  state.bosses = []; state.particles = [];
  const hp0 = state.player.hp;
  updateShockwaves(1/60);
  assert.ok(state.player.hp < hp0, 'Schallwelle trifft endlich (frueher: NIE Schaden)');
  /* Dash = drueber -> kein Treffer */
  state.shockwaves = [{ x: 500, y: 400, r: 95, speed: 100, life: 2, hit: false }];
  const hp1 = state.player.hp;
  state.dashDuration = .2;
  updateShockwaves(1/60);
  assert.equal(state.player.hp, hp1, 'drueber dashen ist sicher');
  state.shockwaves = [];
});

test('zunge: GANZE Zunge faengt + schleudert wie Sauger (Hugo #50)', async () => {
  const { updatePlant } = await import('../js/bosses/plant.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.invincible = false; state.peace = false; state.invuln = 0; state.brutal = false;
  state.player = { x: 900, y: 500, r: 17, hp: 200, maxHp: 200, speed: 200, angle: 0, dashX: 0, dashY: 0, stuckTimer: 0, flingX: 0, flingY: 0, flingT: 0 };
  state.vineSweeps = []; state.bosses = []; state.particles = []; state.effects = []; state.acidPools = []; state.miniPlants = []; state.shockwaves = []; state.enemyProjectiles = [];
  const b = { id: 61, type: 'plant', x: 600, y: 500, r: 62, hp: 700, maxHp: 700, alive: true, flash: 0, wobble: 0, shieldHits: 0, vulnerable: false, vulnTimer: 0, burrowed: false, burrowSub: 0, mouthOpen: 0, chew: 0, vineTimer: 99, acidSpitTimer: 99, seedTimer: 99, tongueTimer: 99, beamTimer: 99, burrowTimer: 99, screamTimer: 99, biteTimer: 0, beamCharge: 0, beamFire: 0, beamAngle: 0, tongue: { active: true, mode: 'sweep', t: 2, x: 1200, y: 500, ex: 1200, ey: 500, dir: 1, edge: 'right', caught: false }, faceAngle: 0, attackCooldown: 0 };
  state.bosses = [b];
  updatePlant(b, 1/60);
  assert.ok(b.tongue.caught, 'MITTE der Zunge faengt (nicht nur Spitze, Hugo #50)');
  assert.ok(state.player.stuckTimer > 0, 'fest geklebt');
  assert.ok(Math.abs(state.player.x - 900) < 40, 'klebt am eigenen Punkt, wird nicht zur Spitze gezerrt');
  updatePlant(b, 2.4); /* Swing endet */
  assert.ok(state.player.flingT > 0, 'WEGGESCHLEUDERT wie bei Sauger (echter Flug)');
  assert.ok(state.player.hp < 200, 'Schleuder-Schaden');
  assert.ok(state.player.x < 1400, 'KEIN Spiegel-Teleport zur anderen Map-Seite mehr');
  state.bosses = [];
});

test('beating PLANT unlocks the SAUGER class (Hugo #47)', async () => {
  state.unlocks.sauger = false; state.selectedBoss = 'plant'; state.selectedBoss = 'plant';
  state.kills = 0; state.bosses = []; state.player = { hp: 250, maxHp: 250 };
  endGame(true);
  assert.equal(state.unlocks.sauger, true, 'SAUGER freigeschaltet');
  assert.ok(document.getElementById('overlayText').textContent.indexOf('SAUGER') >= 0, 'Sieg-Text nennt SAUGER');
  state.unlocks.sauger = false;
});

test('KLASSEN-GRUPPEN in der Auswahl: ADMIN oben, dann STARTER, LEVEL 1, LEVEL 2 (Hugo #52)', async () => {
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const seq = [...html.matchAll(/classGroupHead">([A-Z 0-9]+)<|data-class="([a-z]+)"/g)]
    .map(m => m[1] ? 'HEAD:' + m[1].trim() : 'CARD:' + m[2])
    .filter(s => s.startsWith('HEAD:') || ['admin','faust','sword','archer','tank','assassin','ember','gunner','healer','whip','sauger'].includes(s.slice(5)));
  assert.deepEqual(seq, [
    'HEAD:ADMIN', 'CARD:admin',
    'HEAD:STARTER', 'CARD:faust', 'CARD:archer', 'CARD:sword', 'CARD:tank', 'CARD:assassin',
    'HEAD:LEVEL 1', 'CARD:healer', 'CARD:ember', 'CARD:gunner',
    'HEAD:LEVEL 2', 'CARD:whip', 'CARD:sauger'
  ], 'Klassen-Reihenfolge in BOSS-Reihenfolge: ADMIN / STARTER (Schlaeger->Bogen->Schwert->Tank->Assassin) / LEVEL 1 (Healer->Ember->Gunner) / LEVEL 2 (Peitsche->Sauger) (Hugo #53)');
});

test('PLANT-Cooldowns deutlich groesser (Hugo #52)', async () => {
  const { createPlant } = await import('../js/bosses/plant.js');
  const { readFileSync } = await import('node:fs');
  createPlant(900, 400);
  const b = state.bosses[state.bosses.length - 1];
  assert.ok(b && b.type === 'plant', 'createPlant hat den Boss erzeugt');
  assert.ok(b.vineTimer >= 7, 'Ranken-CD 7 SEKUNDEN (Hugo #53)');
  assert.ok(b.acidSpitTimer >= 5.5, 'acid Start-CD >= 5.5');
  assert.ok(b.seedTimer >= 5.5, 'seed Start-CD >= 5.5');
  assert.ok(b.tongueTimer >= 9, 'tongue Start-CD >= 9');
  assert.ok(b.beamTimer >= 12, 'beam Start-CD >= 12');
  assert.ok(b.burrowTimer >= 18, 'burrow Start-CD >= 18');
  assert.ok(b.screamTimer >= 12, 'scream Start-CD >= 12');
  /* Schaden runter (Hugo #53) */
  const psrc = readFileSync(new URL('../js/bosses/plant.js', import.meta.url), 'utf8');
  assert.ok(psrc.includes('dmg:10'), 'Ranken-Sweep 14->10');
  assert.ok(psrc.includes('plantAttackDamage(b,16)'), 'Biss 22->16');
  assert.ok(psrc.includes('damagePlayer(18)'), 'Schallwelle 25->18');
  assert.ok(psrc.includes('damagePlayer(25);state.invuln=1'), 'Zungen-Schleuder 35->25');
  assert.ok(psrc.includes('plantAttackDamage(b,22)'), 'Saeurestrahl 30->22');
  assert.ok(psrc.includes('poolDmg:7'), 'Saeure-Pfuetzen 9->7');
  assert.ok(psrc.includes('damagePlayer(6)'), 'Mini-Biss 8->6');
  assert.ok(!psrc.includes('damagePlayer(35)'), 'kein 35er-Schaden mehr');
  assert.ok(!psrc.includes('damagePlayer(8);'), 'kein 8er-Mini-Biss mehr');
});

test('ZUNGE VORGEWARNT (Hugo #54): warn-Phase mit blinkender Linie, dann schiesst sie LOS', async () => {
  const { updatePlant } = await import('../js/bosses/plant.js');
  state.bosses = []; state.vineSweeps = []; state.craters = []; state.miniPlants = []; state.acidPools = []; state.enemyProjectiles = []; state.shockwaves = []; state.effects = []; state.particles = [];
  const b = { id: 71, type: 'plant', x: 600, y: 500, r: 62, hp: 700, maxHp: 700, alive: true, flash: 0, wobble: 0, shieldHits: 0, vulnerable: false, vulnTimer: 0, burrowed: false, burrowSub: 0, mouthOpen: 0, chew: 0, vineTimer: 99, acidSpitTimer: 99, seedTimer: 99, tongueTimer: .01, beamTimer: 99, burrowTimer: 99, screamTimer: 99, biteTimer: 0, beamCharge: 0, beamFire: 0, beamAngle: 0, tongue: { active: false, mode: 'out', t: 0, x: 0, y: 0, ex: 0, ey: 0, dir: 1, edge: '', caught: false }, faceAngle: 0, attackCooldown: 0 };
  state.bosses.push(b);
  updatePlant(b, 1/60);
  assert.ok(b.tongue.active && b.tongue.mode === 'warn', 'Zunge startet in VORWARN-Phase');
  assert.ok(b.tongue.warnT > 0, 'warnT gesetzt');
  /* Spieler AUF der Ziel-Linie — aber die Warnung klebt noch NICHT */
  state.player.x = 600 + (b.tongue.ex - 600) * .5; state.player.y = 500 + (b.tongue.ey - 500) * .5;
  state.player.stuckTimer = 0; state.invuln = 0;
  updatePlant(b, .3);
  assert.ok(!b.tongue.caught && (state.player.stuckTimer || 0) === 0, 'Vorwarnung klebt NOCH NICHT');
  updatePlant(b, .5); /* 0.7s Warnung abgelaufen */
  assert.equal(b.tongue.mode, 'out', 'nach der Warnung schiesst die Zunge LOS');
  assert.ok(b.tongue.t > 0, 'Ausfahren laeuft');
  state.bosses = [];
});
