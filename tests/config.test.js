import test from 'node:test';
import assert from 'node:assert/strict';
import { SLIME_HP, SLIME_R, SLIME_SPEED, SLIME_DASH, SLIME_DMG } from '../js/config.js';

let BULLET_STATS, gunballWeak, gunballMedium, gunballStrong;
await import('../js/config.js').then(m => {
  BULLET_STATS = m.BULLET_STATS;
  gunballWeak = m.gunballWeak;
  gunballMedium = m.gunballMedium;
  gunballStrong = m.gunballStrong;
});

test('slime tables have exactly 5 tiers with positive values', () => {
  for (const table of [SLIME_HP, SLIME_R, SLIME_SPEED, SLIME_DASH, SLIME_DMG]) {
    assert.equal(table.length, 5);
    for (const v of table) assert.ok(Number.isFinite(v) && v > 0);
  }
});

test('every pooled gunball bullet type has BULLET_STATS', () => {
  for (const type of [...gunballWeak, ...gunballMedium, ...gunballStrong]) {
    assert.ok(BULLET_STATS[type], `missing BULLET_STATS for "${type}"`);
  }
});

test('BULLET_STATS entries are internally consistent', () => {
  for (const [type, s] of Object.entries(BULLET_STATS)) {
    assert.ok(s.r > 0, `${type}.r`);
    assert.ok(s.damage > 0, `${type}.damage`);
    assert.ok(s.life > 0 || s.life === Infinity, `${type}.life`);
  }
});
