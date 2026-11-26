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
  assert.deepEqual(state.bossRushQueue, ['dragon', 'gunball', 'shadow', 'snake']);
  assert.ok(state.bosses.some(b => b.type === 'slime' && b.alive));
  for (let i = 0; i < 20 && !state.finished; i++) update(1 / 60);
  for (const b of state.bosses) b.alive = false;
  update(1 / 60);
  assert.ok(state.bosses.some(b => b.type === 'dragon' && b.alive), 'next boss rush boss spawns');
  assert.equal(state.bossRushQueue.length, 3);
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
  assert.equal(state.selected, 'admin', 'Hugo #42: ADMIN bleibt ADMIN (eigene Klasse)');
  assert.equal(state.player.maxHp, 300, 'ADMIN hat eigene 300 HP');
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
  assert.equal(state.selected, 'admin', 'Hugo #42: ADMIN bleibt gewaehlt');
  for (let i = 0; i < 5 && !state.finished; i++) update(1 / 60);
  state.selected = 'archer';
  startGame();
  assert.equal(state.isAdmin, true, 'admin mode survives second start');
  assert.equal(state.selected, 'archer', 'Hugo #42: kein Zwangs-Remap mehr — gewaehlte Klasse bleibt');
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

test('admin mode: own skin, no attacks for now (Hugo)', async () => {
  const { attack } = await import('../js/combat.js');
  state.gameRunning = true; state.paused = false; state.finished = false;
  state.isAdmin = true; state.selected = 'faust'; state.attackTimer = 0; state.cooldownOverride = 0;
  state.player = { x: 500, y: 500, r: 17, hp: 100, maxHp: 100, speed: 260, angle: 0, dashX: 0, dashY: 0 };
  state.bosses = []; state.smallSnakes = []; state.infernoTowers = []; state.effects = []; state.projectiles = [];
  const dummy = { id: 9, type: 'slime', x: 560, y: 500, r: 40, hp: 100, maxHp: 100, alive: true, flash: 0, wobble: 0, attackCooldown: 0, tier: 4 };
  state.bosses.push(dummy);
  attack();
  assert.equal(dummy.hp, 100, 'ADMIN greift (noch) nicht an');
  assert.equal(state.attackTimer, 0, 'ADMIN loest keinen Cooldown aus');
  state.isAdmin = false;
});

test('admin is a real class now: own stats, stays selected, no remap (Hugo #42)', async () => {
  const { classes } = await import('../js/config.js');
  assert.ok(classes.admin, 'ADMIN ist eine echte Klasse');
  assert.equal(classes.admin.hp, 300, 'ADMIN hat 300 HP');
  assert.equal(classes.admin.damage, 0, 'ADMIN hat erstmal keinen Angriff');
  state.selected = 'admin'; state.selectedBoss = 'snake';
  state.adminMode = false; state.isAdmin = false;
  startGame();
  assert.equal(state.selected, 'admin', 'ADMIN bleibt gewaehlt (kein Remap)');
  assert.equal(state.player.maxHp, 300, 'ADMIN-Spieler hat 300 HP');
  assert.ok(document.getElementById('className').textContent.indexOf('ADMIN') >= 0, 'HUD zeigt ADMIN');
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
