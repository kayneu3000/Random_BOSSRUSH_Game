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
