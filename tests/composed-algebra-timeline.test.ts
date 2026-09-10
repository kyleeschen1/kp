import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };
import { checkKpComposedAlgebraProof } from "../src/authoring/composed-algebra-proof.ts";
import { resolveKpComposedAlgebraPresentation } from "../src/authoring/composed-algebra-presentation.ts";
import { composeKpEquationOperationAssets } from "../src/animation/compose-equation-operation-assets.ts";
import { compileKpAnimationTransformationPhaseCohorts } from "../src/animation/transformation-phase-cohorts.ts";
import { createKpFocusDeckCheckpointMap } from "../src/tutorial/focus-deck-beat-navigation.ts";
import { createKpReaderTimelinePlaybackClock } from "../src/reader/runtime/timeline-playback-clock.ts";

test("canonical composition keeps exact adjacent states, phase order and unequal operation durations", () => {
  const binding = resolveKpComposedAlgebraPresentation(checkKpComposedAlgebraProof(primary));
  const [a, b] = binding.steps.map(step => step.animation.timeline!.durationMs!);
  const total = binding.animation.timeline!.durationMs!, map = createKpFocusDeckCheckpointMap(binding.checkpointProgress);
  assert.equal(total, a! + b!); assert.equal(map.last, 2);
  assert.equal(map.progressAt(1) * total, a);
  assert.ok(Math.abs((1 - map.progressAt(1)) * total - b!) < 1e-8);
  assert.deepEqual(compileKpAnimationTransformationPhaseCohorts(binding.animation).map(phase => phase.id), binding.steps.map(step => step.animation.transformations[0]!.id));
  assert.deepEqual(binding.animation.bundle.objects.map(object => object.id), primary.states.map(state => state.id));
  for (const position of [0, .25, .99, 1, 1.01, 1.75, 2]) assert.ok(Math.abs(map.positionAt(map.progressAt(position)) - position) < 1e-12);
  let now = 0, pending: ((time: number) => void) | undefined;
  const clock = createKpReaderTimelinePlaybackClock({ id: "composition-test", durationMs: total,
    scheduler: { now: () => now, request: cb => { pending = cb; return 1; }, cancel: () => { pending = undefined; } } });
  clock.play({ direction: "forward", stopAt: map.progressAt(1) });
  now = a! / 2; pending!(now); assert.equal(map.positionAt(clock.getSnapshot().progress), .5);
  now = a!; pending!(now); assert.equal(map.positionAt(clock.getSnapshot().progress), 1);
  clock.play({ direction: "forward", stopAt: 1 });
  now = total; pending!(now); assert.equal(clock.getSnapshot().progress, 1);
  clock.play({ direction: "rewind", stopAt: map.progressAt(1) });
  now += b!; pending!(now); assert.equal(map.positionAt(clock.getSnapshot().progress), 1);
  clock.dispose();
});

test("operation composition rejects reversed or divergent assets instead of inventing a bridge", () => {
  const [a, b] = resolveKpComposedAlgebraPresentation(checkKpComposedAlgebraProof(primary)).steps.map(step => step.animation);
  assert.throws(() => composeKpEquationOperationAssets("wrong", "Wrong", [b!, a!]), /adjacent/);
  const changed = { ...b!, bundle: { ...b!.bundle, objects: b!.bundle.objects.map((object, i) => i ? object : { ...object, title: "drift" }) } };
  assert.throws(() => composeKpEquationOperationAssets("drift", "Drift", [a!, changed]), /content/);
  assert.throws(() => composeKpEquationOperationAssets("untimed", "Untimed", [a!, { ...b!, timeline: undefined }]), /timed/);
});
