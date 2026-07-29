import assert from "node:assert/strict";
import test from "node:test";

import {
  addKpRationals,
  createKpRational,
  equalKpRationals
} from "../domains/math/exact-rational.ts";
import {
  sampleKpExactFractionQuantityNeutralFrame
} from "../src/animation/exact-fraction-quantity-neutral-frame.ts";
import {
  projectKpExactFractionQuantityCircle,
  renderKpExactFractionQuantityCircleSvg,
  sampleKpExactFractionQuantityCircle
} from "../src/rendering/exact-fraction-quantity-circle-projection.ts";

test("circle projection covers one whole with six stable exact sectors", () => {
  const frame = sampleKpExactFractionQuantityCircle({ progress: 0.56 });
  const total = frame.sectors.reduce(
    (sum, { exactMeasure }) => addKpRationals(sum, exactMeasure),
    createKpRational(0n, 1n)
  );

  assert.equal(frame.sectors.length, 6);
  assert.ok(equalKpRationals(total, createKpRational(1n, 1n)));
  assert.deepEqual(
    frame.sectors.map(({ atomicPartId }) => atomicPartId),
    Array.from({ length: 6 }, (_, index) => `part.unit-sixth.${index}`)
  );
  assert.equal(new Set(frame.sectors.map(({ pathData }) => pathData)).size, 6);
});

test("circle selected sectors and contributor mappings come from neutral identity", () => {
  const frame = sampleKpExactFractionQuantityCircle({ progress: 0.72 });
  const selected = frame.sectors.filter(({ selected }) => selected);

  assert.deepEqual(
    selected.map(({ atomicPartId }) => atomicPartId),
    [
      "part.unit-sixth.0",
      "part.unit-sixth.1",
      "part.unit-sixth.2"
    ]
  );
  assert.ok(
    selected.every(({ lifecycle }) => lifecycle === "fusion")
  );
  assert.ok(
    equalKpRationals(
      frame.exactSelectedMeasure,
      createKpRational(1n, 2n)
    )
  );
});

test("circle refinement splits one exact third without changing visible area", () => {
  const frame = sampleKpExactFractionQuantityCircle({ progress: 0.29 });
  const refinement = frame.refinement!;

  assert.equal(refinement.localProgress, 0.5);
  assert.deepEqual(refinement.sourceAtomicPartIds, [
    "part.unit-sixth.0",
    "part.unit-sixth.1"
  ]);
  assert.deepEqual(refinement.targetSectorIds, [
    "circle.sector.part.unit-sixth.0",
    "circle.sector.part.unit-sixth.1"
  ]);
  assert.ok(
    equalKpRationals(refinement.exactMeasure, createKpRational(1n, 3n))
  );
  assert.match(refinement.sourcePathData, /^M 120 80 /);
  assert.match(refinement.dividerPathData, /^M 120 80 L /);
});

test("circle SVG is deterministic and direction independent", () => {
  const forward = projectKpExactFractionQuantityCircle(
    sampleKpExactFractionQuantityNeutralFrame({
      progress: 0.72,
      direction: "forward"
    })
  );
  const rewind = projectKpExactFractionQuantityCircle(
    sampleKpExactFractionQuantityNeutralFrame({
      progress: 0.72,
      direction: "rewind"
    })
  );
  const first = renderKpExactFractionQuantityCircleSvg(forward);
  const second = renderKpExactFractionQuantityCircleSvg(rewind);

  assert.deepEqual(forward, rewind);
  assert.equal(first, second);
  assert.equal(
    (first.match(/data-kp-atomic-part-id=/gu) ?? []).length,
    6
  );
  assert.match(first, /role="img"/);
  const serialized = JSON.stringify(
    forward,
    (_key, value) => typeof value === "bigint" ? String(value) : value
  );
  assert.equal(serialized.includes("direction"), false);
  assert.equal(serialized.includes("opacity"), false);
});

test("circle projection rejects reordered or geometry-inferred identities", () => {
  const neutral = sampleKpExactFractionQuantityNeutralFrame({
    progress: 0.5
  });
  const reordered = {
    ...neutral,
    atomicPartIds: Object.freeze([...neutral.atomicPartIds].reverse())
  };

  assert.throws(
    () => projectKpExactFractionQuantityCircle(reordered),
    /canonical ordered sixth atoms/
  );
});
