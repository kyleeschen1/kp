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
  projectKpExactFractionQuantityBar,
  renderKpExactFractionQuantityBarSvg,
  sampleKpExactFractionQuantityBar
} from "../src/rendering/exact-fraction-quantity-bar-projection.ts";
import {
  sampleKpExactFractionQuantityCircle
} from "../src/rendering/exact-fraction-quantity-circle-projection.ts";

test("bar projection conserves one exact unit across responsive intrinsic bounds", () => {
  const frame = sampleKpExactFractionQuantityBar({ progress: 0.56 });
  const total = frame.parts.reduce(
    (sum, { exactMeasure }) => addKpRationals(sum, exactMeasure),
    createKpRational(0n, 1n)
  );

  assert.equal(frame.viewBox, "0 0 360 120");
  assert.equal(frame.preserveAspectRatio, "xMidYMid meet");
  assert.equal(frame.intrinsicAspectRatio, 3);
  assert.equal(frame.parts.length, 6);
  assert.ok(equalKpRationals(total, createKpRational(1n, 1n)));
  assert.deepEqual(
    frame.parts.map(({ x, width }) => [x, width]),
    [
      [30, 50],
      [80, 50],
      [130, 50],
      [180, 50],
      [230, 50],
      [280, 50]
    ]
  );
});

test("bars and circles use identical selected atom and lifecycle mappings", () => {
  for (const progress of [0, 0.29, 0.5, 0.72, 1]) {
    const bar = sampleKpExactFractionQuantityBar({ progress });
    const circle = sampleKpExactFractionQuantityCircle({ progress });
    assert.deepEqual(
      bar.parts.map((part) => ({
        atomicPartId: part.atomicPartId,
        selected: part.selected,
        sourceSelectionIds: part.sourceSelectionIds,
        targetSelectionIds: part.targetSelectionIds,
        lifecycle: part.lifecycle
      })),
      circle.sectors.map((sector) => ({
        atomicPartId: sector.atomicPartId,
        selected: sector.selected,
        sourceSelectionIds: sector.sourceSelectionIds,
        targetSelectionIds: sector.targetSelectionIds,
        lifecycle: sector.lifecycle
      }))
    );
  }
});

test("bar refinement preserves the exact third extent and named children", () => {
  const frame = sampleKpExactFractionQuantityBar({ progress: 0.29 });
  const refinement = frame.refinement!;

  assert.deepEqual(refinement.sourceExtent, {
    x: 30,
    width: 100,
    exactMeasure: createKpRational(1n, 3n)
  });
  assert.deepEqual(refinement.targetPartIds, [
    "bar.part.part.unit-sixth.0",
    "bar.part.part.unit-sixth.1"
  ]);
  assert.equal(refinement.dividerX, 80);
  assert.equal(refinement.localProgress, 0.5);
});

test("bar SVG is deterministic across direction and includes semantic IDs", () => {
  const forward = projectKpExactFractionQuantityBar(
    sampleKpExactFractionQuantityNeutralFrame({
      progress: 0.29,
      direction: "forward"
    })
  );
  const rewind = projectKpExactFractionQuantityBar(
    sampleKpExactFractionQuantityNeutralFrame({
      progress: 0.29,
      direction: "rewind"
    })
  );
  const first = renderKpExactFractionQuantityBarSvg(forward);
  const second = renderKpExactFractionQuantityBarSvg(rewind);

  assert.deepEqual(forward, rewind);
  assert.equal(first, second);
  assert.equal((first.match(/data-kp-atomic-part-id=/gu) ?? []).length, 6);
  assert.match(first, /preserveAspectRatio="xMidYMid meet"/);
  assert.match(first, /data-kp-refinement-divider="true"/);
  assert.equal(first.includes("opacity"), false);
});
