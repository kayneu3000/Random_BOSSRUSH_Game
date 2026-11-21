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
  state.bosses[0].hp = 999999;
  state.effects.push({ type: 'slash', x: 0, y: 0, angle: 0, life: 0.2, r: 50, weapon: 'sword' });
  state.particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 3, color: '#fff' });
  for (let i = 0; i < 40 && !state.finished; i++) update(1 / 60);
  assert.equal(state.effects.length, 0, 'effects are removed when life expires');
  assert.equal(state.particles.length, 0, 'particles are removed when life expires');
});
