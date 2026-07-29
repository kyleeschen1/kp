import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpExactFractionQuantityNeutralFrame
} from "../src/animation/exact-fraction-quantity-neutral-frame.ts";
import {
  projectKpExactFractionQuantityBar
} from "../src/rendering/exact-fraction-quantity-bar-projection.ts";
import {
  projectKpExactFractionQuantityCircle
} from "../src/rendering/exact-fraction-quantity-circle-projection.ts";
import {
  projectKpExactFractionQuantityNumberLine
} from "../src/rendering/exact-fraction-quantity-number-line-projection.ts";
import {
  certifyKpExactFractionQuantitySynchronizedFrame,
  isKpExactFractionQuantitySynchronizedFrame,
  sampleKpExactFractionQuantitySynchronizedFrame
} from "../src/rendering/exact-fraction-quantity-synchronized-projection.ts";
import {
  createKpExactFractionQuantitySymbolicProjection
} from "../src/rendering/exact-fraction-quantity-symbolic-projection.ts";
import {
  createKpExactFractionQuantityTrace
} from "../src/semantic/exact-fraction-quantity-trace.ts";
import {
  isKpExactFractionQuantityViewBundle
} from "../src/semantic/exact-fraction-quantity-view-obligations.ts";

test("one sealed synchronized frame contains every required view", () => {
  const frame = sampleKpExactFractionQuantitySynchronizedFrame({
    progress: 0.72
  });

  assert.ok(isKpExactFractionQuantitySynchronizedFrame(frame));
  assert.ok(isKpExactFractionQuantityViewBundle(frame.viewObligations));
  assert.deepEqual(Object.keys(frame.viewObligations.projections), [
    "symbolic",
    "partitioned-circle",
    "fraction-bar",
    "number-line"
  ]);
  assert.equal(frame.atomicCorrespondences.length, 6);
});

test("selected atomic identities close explicitly across all four views", () => {
  for (const progress of [0, 0.29, 0.5, 0.72, 1]) {
    const frame = sampleKpExactFractionQuantitySynchronizedFrame({ progress });
    for (const correspondence of frame.atomicCorrespondences) {
      assert.ok(correspondence.circleSectorId.length > 0);
      assert.ok(correspondence.barPartId.length > 0);
      assert.ok(correspondence.numberLineIntervalId.length > 0);
      assert.equal(
        correspondence.selected,
        correspondence.semanticSelectionIds.length > 0
      );
      if (correspondence.selected) {
        assert.ok(correspondence.symbolicSelectorIds.length > 0);
      }
    }
  }
});

test("selection correspondence carries focus and transcript references", () => {
  const frame = sampleKpExactFractionQuantitySynchronizedFrame({
    progress: 0.18
  });

  assert.deepEqual(
    frame.selectionCorrespondences.map((selection) => ({
      selectionId: selection.selectionId,
      atomicPartIds: selection.atomicPartIds,
      symbolicSelectorIds: selection.symbolicSelectorIds,
      focused: selection.focused,
      transcriptRefId: selection.transcriptRefId
    })),
    [
      {
        selectionId: "selection.addend.one-third",
        atomicPartIds: [
          "part.unit-sixth.0",
          "part.unit-sixth.1"
        ],
        symbolicSelectorIds: ["symbolic.addend.third.numerator"],
        focused: true,
        transcriptRefId:
          "transcript.selection.selection.addend.one-third"
      },
      {
        selectionId: "selection.addend.one-sixth",
        atomicPartIds: ["part.unit-sixth.2"],
        symbolicSelectorIds: ["symbolic.addend.sixth.numerator"],
        focused: true,
        transcriptRefId:
          "transcript.selection.selection.addend.one-sixth"
      }
    ]
  );
});

test("missing, duplicate, or divergent concrete identities fail closed", () => {
  const input = canonicalInput(0.72);
  assert.throws(
    () => certifyKpExactFractionQuantitySynchronizedFrame({
      ...input,
      bar: {
        ...input.bar,
        parts: input.bar.parts.slice(1)
      }
    }),
    /bar part must contain part\.unit-sixth\.0 exactly once/
  );
  assert.throws(
    () => certifyKpExactFractionQuantitySynchronizedFrame({
      ...input,
      numberLine: {
        ...input.numberLine,
        intervals: Object.freeze([
          input.numberLine.intervals[0]!,
          ...input.numberLine.intervals
        ])
      }
    }),
    /number-line interval must contain part\.unit-sixth\.0 exactly once/
  );
  assert.throws(
    () => certifyKpExactFractionQuantitySynchronizedFrame({
      ...input,
      circle: {
        ...input.circle,
        sectors: Object.freeze(input.circle.sectors.map((sector, index) =>
          index === 0 ? { ...sector, selected: false } : sector
        ))
      }
    }),
    /Concrete view correspondence diverges/
  );
});

test("missing symbolic correspondence fails without color or geometry fallback", () => {
  const input = canonicalInput(0.72);
  const targetStateId = input.neutralFrame.targetStateId;
  const symbolic = {
    ...input.symbolic,
    endpoints: Object.freeze(input.symbolic.endpoints.map((endpoint) =>
      endpoint.stateId === targetStateId
        ? {
            ...endpoint,
            annotated: {
              ...endpoint.annotated,
              annotations: Object.freeze(
                endpoint.annotated.annotations.filter(
                  ({ selectorId }) =>
                    selectorId !== "symbolic.result.numerator"
                )
              )
            }
          }
        : endpoint
    ))
  };

  assert.throws(
    () => certifyKpExactFractionQuantitySynchronizedFrame({
      ...input,
      symbolic
    }),
    /missing symbolic selector/
  );
  const serialized = stringify(
    sampleKpExactFractionQuantitySynchronizedFrame({ progress: 0.72 })
  );
  assert.equal(serialized.includes("color"), false);
  assert.equal(serialized.includes("leftPx"), false);
  assert.equal(serialized.includes("topPx"), false);
});

function canonicalInput(progress: number) {
  const trace = createKpExactFractionQuantityTrace();
  const neutralFrame = sampleKpExactFractionQuantityNeutralFrame({
    progress,
    trace
  });
  return {
    trace,
    neutralFrame,
    symbolic: createKpExactFractionQuantitySymbolicProjection(trace),
    circle: projectKpExactFractionQuantityCircle(neutralFrame),
    bar: projectKpExactFractionQuantityBar(neutralFrame),
    numberLine: projectKpExactFractionQuantityNumberLine(neutralFrame)
  };
}

function stringify(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, entry) => typeof entry === "bigint" ? String(entry) : entry
  );
}
