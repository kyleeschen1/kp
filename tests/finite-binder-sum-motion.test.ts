import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  sampleKpFiniteSumExpansionMotion
} from "../src/animation/finite-sum-expansion-motion.ts";

test("sum motion has exact source and target endpoints", () => {
  const source = sampleKpFiniteSumExpansionMotion(0);
  const target = sampleKpFiniteSumExpansionMotion(1);

  assert.equal(source.endpoint, "source");
  assert.equal(source.sourceScope.presence, 1);
  assert.ok(source.instances.every(({ bodyTransitProgress, bodyPresence }) =>
    bodyTransitProgress === 0 && bodyPresence === 0
  ));
  assert.equal(target.endpoint, "target");
  assert.equal(target.sourceScope.presence, 0);
  assert.ok(target.instances.every((instance) =>
    instance.bodyTransitProgress === 1 &&
    instance.bodyPresence === 1 &&
    instance.referencePresence === 1 &&
    instance.referenceTransitProgress === 1
  ));
  assert.deepEqual(target.instances.map(({ precedingConnectorPresence }) =>
    precedingConnectorPresence
  ), [0, 1, 1]);
});

test("dense arbitrary seeks are deterministic bounded and monotone", () => {
  const samples = Array.from({ length: 1001 }, (_, index) =>
    sampleKpFiniteSumExpansionMotion(index / 1000)
  );
  const reversed = [...samples].reverse().map(({ progress }) =>
    sampleKpFiniteSumExpansionMotion(progress)
  ).reverse();
  assert.deepEqual(samples, reversed);

  for (const [index, frame] of samples.entries()) {
    assert.deepEqual(frame,
      sampleKpFiniteSumExpansionMotion(index / 1000));
    const values = [
      frame.sourceScope.contractionProgress,
      frame.sourceScope.presence,
      frame.sourceReferencePresence,
      ...frame.instances.flatMap((instance) => [
        instance.bodyTransitProgress,
        instance.bodyPresence,
        instance.referenceTransitProgress,
        instance.referencePresence,
        instance.precedingConnectorPresence
      ])
    ];
    assert.ok(values.every((value) => value >= 0 && value <= 1));
    if (index === 0) continue;
    const previous = samples[index - 1]!;
    frame.instances.forEach((instance, ordinal) => {
      assert.ok(instance.bodyTransitProgress >=
        previous.instances[ordinal]!.bodyTransitProgress);
      assert.ok(instance.referencePresence >=
        previous.instances[ordinal]!.referencePresence);
      assert.ok(instance.referenceTransitProgress >=
        previous.instances[ordinal]!.referenceTransitProgress);
      assert.ok(instance.precedingConnectorPresence >=
        previous.instances[ordinal]!.precedingConnectorPresence);
    });
  }
});

test("reduced motion preserves semantic timing without depth contraction", () => {
  for (let index = 0; index <= 100; index += 1) {
    const progress = index / 100;
    const full = sampleKpFiniteSumExpansionMotion(progress, "full");
    const reduced = sampleKpFiniteSumExpansionMotion(progress, "reduced");
    assert.equal(reduced.sourceScope.contractionProgress, 0);
    assert.equal(reduced.sourceScope.presence, full.sourceScope.presence);
    assert.equal(reduced.sourceReferencePresence,
      full.sourceReferencePresence);
    assert.deepEqual(reduced.instances, full.instances);
  }
});

test("static mode chooses exact native endpoints without intermediate paint", () => {
  assert.equal(sampleKpFiniteSumExpansionMotion(0.49, "static").endpoint,
    "source");
  assert.equal(sampleKpFiniteSumExpansionMotion(0.5, "static").endpoint,
    "target");
  assert.equal(sampleKpFiniteSumExpansionMotion(-4).progress, 0);
  assert.equal(sampleKpFiniteSumExpansionMotion(9).progress, 1);
  assert.throws(() => sampleKpFiniteSumExpansionMotion(Number.NaN),
    /must be finite/u);
});

test("motion sampler owns no scheduler or CSS animation", async () => {
  const source = await readFile(
    "src/animation/finite-sum-expansion-motion.ts",
    "utf8"
  );
  assert.doesNotMatch(source,
    /requestAnimationFrame|setTimeout|setInterval|\.animate\(|@keyframes/u);
  assert.doesNotMatch(source, /Date\.now|performance\.now/u);
});
