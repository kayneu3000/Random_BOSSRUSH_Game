import test from 'node:test';
import assert from 'node:assert/strict';
import { pointSegmentDistance, rayMapLength } from '../js/utils.js';

test('pointSegmentDistance returns 0 for a point on the segment', () => {
  assert.equal(pointSegmentDistance(5, 0, 0, 0, 10, 0), 0);
});

test('pointSegmentDistance returns perpendicular distance', () => {
  assert.ok(Math.abs(pointSegmentDistance(5, 3, 0, 0, 10, 0) - 3) < 1e-9);
});

test('pointSegmentDistance clamps to nearest endpoint', () => {
  assert.ok(Math.abs(pointSegmentDistance(-4, 0, 0, 0, 10, 0) - 4) < 1e-9);
  assert.ok(Math.abs(pointSegmentDistance(14, 0, 0, 0, 10, 0) - 4) < 1e-9);
});

test('rayMapLength returns a positive, finite length', () => {
  const l = rayMapLength(100, 100, 0.7);
  assert.ok(Number.isFinite(l) && l > 0);
});

test('rayMapLength clamps a ray leaving the map to 0', () => {
  assert.equal(rayMapLength(-50, 500, Math.PI), 0);
});

test('rayMapLength returns a short ray into a map wall', () => {
  const l = rayMapLength(5, 500, Math.PI);
  assert.ok(Number.isFinite(l) && l < 10);
});
