import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpRational
} from "../domains/math/exact-rational.ts";
import {
  sampleKpExactFractionQuantityNeutralFrame
} from "../src/animation/exact-fraction-quantity-neutral-frame.ts";
import {
  projectKpExactFractionQuantityNumberLine,
  renderKpExactFractionQuantityNumberLineSvg,
  sampleKpExactFractionQuantityNumberLine
} from "../src/rendering/exact-fraction-quantity-number-line-projection.ts";

test("number-line ticks own exact rational positions before pixels", () => {
  const frame = sampleKpExactFractionQuantityNumberLine({ progress: 0 });

  assert.deepEqual(
    frame.ticks.map(({ exactPosition }) => exactPosition),
    [
      createKpRational(0n, 6n),
      createKpRational(1n, 6n),
      createKpRational(2n, 6n),
      createKpRational(3n, 6n),
      createKpRational(4n, 6n),
      createKpRational(5n, 6n),
      createKpRational(6n, 6n)
    ]
  );
  assert.deepEqual(frame.ticks.map(({ x }) => x), [
    30, 80, 130, 180, 230, 280, 330
  ]);
  assert.deepEqual(frame.ticks.map(({ label }) => label), [
    "0", "1/6", "2/6", "1/2", "4/6", "5/6", "1"
  ]);
});

test("number-line addition composes adjacent exact contributor spans", () => {
  const frame = sampleKpExactFractionQuantityNumberLine({ progress: 0.18 });

  assert.deepEqual(frame.contributorSpans, [
    {
      selectionId: "selection.addend.one-third",
      atomicPartIds: [
        "part.unit-sixth.0",
        "part.unit-sixth.1"
      ],
      exactStart: createKpRational(0n, 6n),
      exactEnd: createKpRational(2n, 6n),
      x1: 30,
      x2: 130
    },
    {
      selectionId: "selection.addend.one-sixth",
      atomicPartIds: ["part.unit-sixth.2"],
      exactStart: createKpRational(2n, 6n),
      exactEnd: createKpRational(3n, 6n),
      x1: 130,
      x2: 180
    }
  ]);
  assert.deepEqual(frame.exactEndpoint, createKpRational(1n, 2n));
  assert.equal(frame.endpointX, 180);
});

test("number-line intervals retain atomic contributor identity through fusion", () => {
  const frame = sampleKpExactFractionQuantityNumberLine({ progress: 0.72 });
  const selected = frame.intervals.filter(({ selected }) => selected);

  assert.deepEqual(
    selected.map(({ atomicPartId, exactStart, exactEnd, lifecycle }) => ({
      atomicPartId,
      exactStart,
      exactEnd,
      lifecycle
    })),
    [
      {
        atomicPartId: "part.unit-sixth.0",
        exactStart: createKpRational(0n, 6n),
        exactEnd: createKpRational(1n, 6n),
        lifecycle: "fusion"
      },
      {
        atomicPartId: "part.unit-sixth.1",
        exactStart: createKpRational(1n, 6n),
        exactEnd: createKpRational(2n, 6n),
        lifecycle: "fusion"
      },
      {
        atomicPartId: "part.unit-sixth.2",
        exactStart: createKpRational(2n, 6n),
        exactEnd: createKpRational(3n, 6n),
        lifecycle: "fusion"
      }
    ]
  );
});

test("number-line SVG and frame are deterministic across direction", () => {
  const forward = projectKpExactFractionQuantityNumberLine(
    sampleKpExactFractionQuantityNeutralFrame({
      progress: 0.72,
      direction: "forward"
    })
  );
  const rewind = projectKpExactFractionQuantityNumberLine(
    sampleKpExactFractionQuantityNeutralFrame({
      progress: 0.72,
      direction: "rewind"
    })
  );
  const first = renderKpExactFractionQuantityNumberLineSvg(forward);

  assert.deepEqual(forward, rewind);
  assert.equal(
    first,
    renderKpExactFractionQuantityNumberLineSvg(rewind)
  );
  assert.equal((first.match(/data-kp-atomic-part-id=/gu) ?? []).length, 6);
  assert.equal((first.match(/data-kp-number-line-tick-id=/gu) ?? []).length, 7);
  assert.match(first, /data-kp-number-line-endpoint="true" cx="180"/);
  assert.equal(first.includes("opacity"), false);
});
