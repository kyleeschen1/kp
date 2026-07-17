import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpMatrixMatrixCompositionChoreography,
  sampleKpMatrixMatrixCompositionChoreography
} from "../src/animation/matrix-matrix-composition-choreography.ts";
import { createKpMatrixMatrixSemanticDuration } from "../src/animation/matrix-matrix-semantic-duration.ts";
import type { KpMeasuredEquationTransitionGeometry } from "../src/rendering/equation-motion-dom.ts";
import { sampleKpEquationTokenMotion } from "../src/rendering/semantic-equation-token-renderer.ts";

const animation = createKpAnimationAssets().find(
  (candidate) =>
    candidate.id ===
    "animation.generated.linear-algebra.matrix-matrix.two-by-two"
)!;
const choreography = createKpMatrixMatrixCompositionChoreography(animation);

test("matrix-matrix duration multiplies with cell work instead of accelerating", () => {
  const sixCells = createKpMatrixMatrixSemanticDuration({
    id: "matrix-matrix.six-cells",
    cellCount: 6
  });
  assert.equal(sixCells.work.policy, "long-form");
  assert.equal(sixCells.work.segments.length, 6);
  assert.equal(sixCells.work.totalDurationMs, 6_000);
  assert.equal(sixCells.totalDurationMs, 6_400);
});

test("matrix product cells are authored row-column dot-product representations", () => {
  assert.equal(choreography.rendererPlan.semanticDurationMs, 4_400);
  assert.equal(choreography.rendererPlan.semanticActionCount, 4);
  assert.deepEqual(
    choreography.cells.map((cell) => Math.round((cell.end - cell.start) * 4_400)),
    [1_000, 1_000, 1_000, 1_000]
  );
  assert.deepEqual(
    choreography.cells.map((cell) => ({
      index: cell.semanticIndex,
      coordinate: [cell.rowIndex, cell.columnIndex],
      cellLatex: cell.cellLatex,
      result: cell.result
    })),
    [
      { index: 0, coordinate: [0, 0], cellLatex: "1 \\times 2 + 2 \\times 1 = 4", result: 4 },
      { index: 1, coordinate: [0, 1], cellLatex: "1 \\times 0 + 2 \\times 2 = 4", result: 4 },
      { index: 2, coordinate: [1, 0], cellLatex: "3 \\times 2 + 4 \\times 1 = 10", result: 10 },
      { index: 3, coordinate: [1, 1], cellLatex: "3 \\times 0 + 4 \\times 2 = 8", result: 8 }
    ]
  );
  assert.deepEqual(
    choreography.traversal.participants.map(
      (participant) => participant.semanticIndex
    ),
    [0, 1, 2, 3]
  );
  assert.ok(choreography.cells.every((cell, index, cells) =>
    index === 0 || cell.start > cells[index - 1]!.start
  ));
});

test("matrix-matrix choreography refuses renderer-invented cell calculations", () => {
  const withoutIntermediates = {
    ...animation,
    bundle: {
      ...animation.bundle,
      objects: animation.bundle.objects.filter((object) =>
        typeof object.value !== "object" ||
        object.value === null ||
        !("representation" in object.value)
      )
    }
  };
  assert.throws(
    () => createKpMatrixMatrixCompositionChoreography(withoutIntermediates),
    /requires an exact authored row-column representation/
  );
});

test("matrix product entries resolve in cell order and persist", () => {
  const firstResolved = sampleKpMatrixMatrixCompositionChoreography({
    choreography,
    progress: choreography.cells[0]!.end,
    direction: "forward",
    accessibilityMode: "full"
  });
  assert.equal(firstResolved.motion.cells[0]!.status, "resolved");
  assert.equal(firstResolved.motion.cells[0]!.resultRevealProgress, 1);
  assert.ok(firstResolved.motion.cells[1]!.resultRevealProgress < 1);

  const end = sampleKpMatrixMatrixCompositionChoreography({
    choreography,
    progress: 1,
    direction: "forward",
    accessibilityMode: "full"
  });
  assert.deepEqual(
    end.motion.cells.map((cell) => [cell.status, cell.resultRevealProgress]),
    [["resolved", 1], ["resolved", 1], ["resolved", 1], ["resolved", 1]]
  );
  assert.equal(end.motion.sourceOpacity, 0);
  assert.ok(end.focusFrames.every((focus) => focus.frame.attentionProgress === 0));
});

test("matrix-matrix cell traversal has exact semantic rewind", () => {
  const forward = sampleKpMatrixMatrixCompositionChoreography({
    choreography,
    progress: 0.43,
    direction: "forward",
    accessibilityMode: "full"
  });
  const rewind = sampleKpMatrixMatrixCompositionChoreography({
    choreography,
    progress: 0.57,
    direction: "rewind",
    accessibilityMode: "full"
  });
  assert.deepEqual(rewind, forward);
});

test("matrix-matrix sampler reveals native result cells without whole-matrix scaling", () => {
  const firstResolved = sampleKpEquationTokenMotion(
    geometry(),
    choreography.cells[0]!.end
  );
  const targetEntries = firstResolved.tokens.filter((token) =>
    token.side === "target" && token.motionId.startsWith("result.")
  );
  assert.equal(targetEntries[0]!.pose.opacity, 1);
  assert.ok(targetEntries.slice(1).every((token) => token.pose.opacity < 1));
  assert.ok(targetEntries.every((token) => token.pose.scale === 1));

  const end = sampleKpEquationTokenMotion(geometry(), 1);
  assert.ok(
    end.tokens.filter((token) => token.side === "source")
      .every((token) => token.pose.opacity === 0)
  );
  assert.ok(
    end.tokens.filter((token) => token.side === "target")
      .every((token) =>
        token.pose.opacity === 1 &&
        token.pose.x === 0 &&
        token.pose.y === 0 &&
        token.pose.scale === 1
      )
  );
});

function geometry(): KpMeasuredEquationTransitionGeometry {
  const sourceSelectorIds = unique([
    ...choreography.cells.flatMap((cell) => cell.leftSelectorIds),
    ...choreography.cells.flatMap((cell) => cell.rightSelectorIds),
    `${animation.bundle.objects[0]!.id}.left.matrix.left-bracket`,
    `${animation.bundle.objects[0]!.id}.left.matrix.right-bracket`,
    `${animation.bundle.objects[0]!.id}.right.matrix.left-bracket`,
    `${animation.bundle.objects[0]!.id}.right.matrix.right-bracket`
  ]);
  const sourceMotionIds = sourceSelectorIds.map((_selector, index) => `source.${index}`);
  const targetSelectorIds = [
    ...choreography.cells.map((cell) => cell.resultSelectorId),
    `${animation.bundle.objects.at(-1)!.id}.result.matrix.left-bracket`,
    `${animation.bundle.objects.at(-1)!.id}.result.matrix.right-bracket`
  ];
  const targetMotionIds = [
    "result.0",
    "result.1",
    "result.2",
    "result.3",
    "target.left",
    "target.right"
  ];
  return {
    transitionId: "transition.matrix-matrix",
    matrixMatrixCompositionPlan: choreography.rendererPlan,
    sourceTokens: sourceMotionIds.map((motionId, index) =>
      token(motionId, 10 + (index % 4) * 14, 10 + Math.floor(index / 4) * 20)
    ),
    targetTokens: targetMotionIds.map((motionId, index) =>
      token(motionId, 90 + (index % 2) * 14, 20 + Math.floor(index / 2) * 20)
    ),
    relations: [
      {
        recordId: "inputs-consumed",
        lifecycle: "exit",
        source: {
          selectorIds: sourceSelectorIds,
          motionIds: sourceMotionIds,
          bounds: { left: 10, top: 10, width: 82, height: 58 }
        }
      },
      {
        recordId: "results-enter",
        lifecycle: "enter",
        target: {
          selectorIds: targetSelectorIds,
          motionIds: targetMotionIds,
          bounds: { left: 90, top: 20, width: 32, height: 58 }
        }
      }
    ]
  };
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function token(motionId: string, left: number, top: number) {
  const rect = { left, top, width: 12, height: 18 };
  return {
    motionId,
    text: motionId,
    rect,
    localRect: rect,
    element: { style: {}, dataset: {} } as unknown as HTMLElement
  };
}
