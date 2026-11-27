import assert from "node:assert/strict";
import test from "node:test";
import { createSaddlePlayback, prepareSaddleAnimation, sampleSaddleAnimation } from "../src/animation-player/public-api.ts";
import { createSaddleGeometry } from "../src/animation-player/geometry.ts";
import { evaluateSaddleSurface } from "../src/math/surface-examples.ts";
import type { KpReaderTimelinePlaybackScheduler } from "../src/reader/runtime/timeline-playback-clock.ts";

function timer() {
  let now = 0, id = 0;
  const callbacks = new Map<number, (time: number) => void>();
  const scheduler: KpReaderTimelinePlaybackScheduler = {
    now: () => now,
    request(callback) { callbacks.set(++id, callback); return id; },
    cancel(handle) { callbacks.delete(handle); }
  };
  return { scheduler, pending: () => callbacks.size, advance(ms: number) {
    now += ms; const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(callback => callback(now));
  } };
}

test("one prepared artifact retains semantic identity through arbitrary seeks and exact endpoints", () => {
  const artifact = prepareSaddleAnimation();
  const source = sampleSaddleAnimation(artifact, 0);
  for (const progress of [1, .53, .17, .8, 0]) {
    const frame = sampleSaddleAnimation(artifact, progress);
    assert.equal(frame.denominator, 4 + 4 * progress);
    assert.equal(frame.surfaceIdentityId, source.surfaceIdentityId);
    assert.equal(frame.cameraStateId, source.cameraStateId);
    assert.deepEqual(frame.witnesses.map(point => point.id), source.witnesses.map(point => point.id));
    for (const point of frame.witnesses)
      assert.ok(Math.abs(point.z - evaluateSaddleSurface(point) * 4 / frame.denominator) < 1e-6);
  }
  for (const progress of [NaN, Infinity, -1, 1.01])
    assert.throws(() => sampleSaddleAnimation(artifact, progress), /Progress/);
});

test("two players share an artifact but keep independent clocks and source-to-target positions", () => {
  const artifact = prepareSaddleAnimation(), time = timer(), otherTime = timer();
  const article = createSaddlePlayback(artifact, { scheduler: time.scheduler });
  const card = createSaddlePlayback(artifact, { scheduler: otherTime.scheduler, initialProgress: 1 });
  article.play(); time.advance(artifact.durationMs / 2);
  assert.equal(article.snapshot().progress, .5);
  assert.equal(card.snapshot().progress, 1);
  article.play("rewind"); time.advance(artifact.durationMs / 4);
  assert.equal(article.snapshot().progress, .25);
  assert.equal(article.snapshot().frame.denominator, 5);
  assert.equal(card.snapshot().frame.denominator, 8);
  time.advance(artifact.durationMs);
  assert.equal(article.snapshot().progress, 0);
  assert.equal(time.pending(), 0);
  card.play("rewind"); otherTime.advance(artifact.durationMs);
  assert.equal(card.snapshot().progress, 0);
  article.dispose(); card.dispose();
});

test("seek interrupts pending motion and dispose is idempotent with no retained callbacks", () => {
  const artifact = prepareSaddleAnimation(), time = timer();
  const player = createSaddlePlayback(artifact, { scheduler: time.scheduler });
  let notifications = 0;
  player.subscribe(() => { notifications++; });
  player.play(); assert.equal(time.pending(), 1);
  player.seek(.37); assert.equal(time.pending(), 0);
  time.advance(artifact.durationMs); assert.equal(player.snapshot().progress, .37);
  player.play(); player.dispose(); player.dispose();
  const stopped = notifications; time.advance(artifact.durationMs);
  assert.equal(time.pending(), 0); assert.equal(notifications, stopped);
  assert.throws(() => player.play(), /disposed/);
  assert.throws(() => player.seek(0), /disposed/);
});

test("pausing retains the exact position and restarting forward reaches the native endpoint", () => {
  const artifact = prepareSaddleAnimation(), time = timer();
  const player = createSaddlePlayback(artifact, { scheduler: time.scheduler });
  player.play(); time.advance(400); player.pause();
  const paused = player.snapshot();
  time.advance(5000); assert.deepEqual(player.snapshot(), paused);
  player.play(); time.advance(5000);
  assert.equal(player.snapshot().progress, 1);
  assert.equal(player.snapshot().frame.denominator, 8);
  assert.equal(time.pending(), 0);
  player.dispose();
});

test("shared retained geometry keeps original resolution and domain-owned heights", () => {
  const geometry = createSaddleGeometry();
  assert.equal(geometry.vertexCount, 9409);
  assert.equal(geometry.indices.length / 3, 18432);
  for (let offset = 0; offset < geometry.vertices.length; offset += 5) {
    const x = geometry.vertices[offset]!, y = geometry.vertices[offset + 1]!;
    assert.ok(Math.abs(geometry.vertices[offset + 2]! - evaluateSaddleSurface({ x, y })) < 1e-6);
  }
});
