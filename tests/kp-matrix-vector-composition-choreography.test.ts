import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpMatrixVectorCompositionChoreography,
  sampleKpMatrixVectorCompositionChoreography
} from "../src/animation/matrix-vector-composition-choreography.ts";
import type { KpMeasuredEquationTransitionGeometry } from "../src/rendering/equation-motion-dom.ts";
import { sampleKpEquationTokenMotion } from "../src/rendering/semantic-equation-token-renderer.ts";

const animation = createKpAnimationAssets().find(
  (candidate) =>
    candidate.id ===
    "animation.generated.linear-algebra.matrix-vector.two-by-two"
)!;
const choreography = createKpMatrixVectorCompositionChoreography(animation);

test("matrix-vector rows are authored semantic dot-product representations", () => {
  assert.deepEqual(
    choreography.rows.map((row) => ({
      semanticIndex: row.semanticIndex,
      rowLatex: row.rowLatex,
      result: row.result,
      intermediateObjectId: row.intermediateObjectId
    })),
    [
      {
        semanticIndex: 0,
        rowLatex: "2 \\times 4 + 1 \\times 5 = 13",
        result: 13,
        intermediateObjectId:
          `${animation.bundle.objects[0]!.id}.intermediate.row-dot-product.0`
      },
      {
        semanticIndex: 1,
        rowLatex: "0 \\times 4 + 3 \\times 5 = 15",
        result: 15,
        intermediateObjectId:
          `${animation.bundle.objects[0]!.id}.intermediate.row-dot-product.1`
      }
    ]
  );
  assert.deepEqual(
    choreography.traversal.participants.map(
      (participant) => participant.semanticIndex
    ),
    [0, 1]
  );
  assert.ok(choreography.rows[0]!.start < choreography.rows[1]!.start);
  assert.ok(choreography.rows[0]!.end < choreography.rows[1]!.end);
});

test("matrix-vector choreography refuses renderer-invented row calculations", () => {
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
    () => createKpMatrixVectorCompositionChoreography(withoutIntermediates),
    /requires selectors and an authored row-dot-product representation/
  );
});

test("matrix-vector components resolve in row order and then persist", () => {
  const firstResolvedProgress = choreography.rows[0]!.end;
  const firstResolved = sampleKpMatrixVectorCompositionChoreography({
    choreography,
    progress: firstResolvedProgress,
    direction: "forward",
    accessibilityMode: "full"
  });
  assert.equal(firstResolved.motion.rows[0]!.status, "resolved");
  assert.equal(firstResolved.motion.rows[0]!.resultRevealProgress, 1);
  assert.ok(firstResolved.motion.rows[1]!.resultRevealProgress < 1);

  const end = sampleKpMatrixVectorCompositionChoreography({
    choreography,
    progress: 1,
    direction: "forward",
    accessibilityMode: "full"
  });
  assert.deepEqual(
    end.motion.rows.map((row) => [row.status, row.resultRevealProgress]),
    [["resolved", 1], ["resolved", 1]]
  );
  assert.equal(end.motion.sourceOpacity, 0);
  assert.ok(end.focusFrames.every((focus) => focus.frame.attentionProgress === 0));
});

test("matrix-vector composition has exact semantic rewind", () => {
  const forward = sampleKpMatrixVectorCompositionChoreography({
    choreography,
    progress: 0.37,
    direction: "forward",
    accessibilityMode: "full"
  });
  const rewind = sampleKpMatrixVectorCompositionChoreography({
    choreography,
    progress: 0.63,
    direction: "rewind",
    accessibilityMode: "full"
  });
  assert.deepEqual(rewind, forward);
});

test("matrix-vector token sampler reveals each target entry without scaling the structure", () => {
  const firstResolved = sampleKpEquationTokenMotion(
    geometry(),
    choreography.rows[0]!.end
  );
  const targetEntries = firstResolved.tokens.filter((token) =>
    token.side === "target" && token.motionId.startsWith("result.")
  );
  assert.equal(targetEntries[0]!.pose.opacity, 1);
  assert.ok(targetEntries[1]!.pose.opacity < 1);
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
  const sourceSelectorIds = [
    ...choreography.rows.flatMap((row) => row.matrixSelectorIds),
    ...choreography.rows[0]!.vectorSelectorIds,
    `${animation.bundle.objects[0]!.id}.matrix.left-bracket`,
    `${animation.bundle.objects[0]!.id}.matrix.right-bracket`,
    `${animation.bundle.objects[0]!.id}.vector.left-bracket`,
    `${animation.bundle.objects[0]!.id}.vector.right-bracket`
  ];
  const sourceMotionIds = sourceSelectorIds.map((_selector, index) => `source.${index}`);
  const targetSelectorIds = [
    ...choreography.rows.map((row) => row.resultSelectorId),
    `${animation.bundle.objects.at(-1)!.id}.result.left-bracket`,
    `${animation.bundle.objects.at(-1)!.id}.result.right-bracket`
  ];
  const targetMotionIds = ["result.0", "result.1", "target.left", "target.right"];
  return {
    transitionId: "transition.matrix-vector",
    matrixVectorCompositionPlan: choreography.rendererPlan,
    sourceTokens: sourceMotionIds.map((motionId, index) =>
      token(motionId, 10 + (index % 4) * 14, 10 + Math.floor(index / 4) * 20)
    ),
    targetTokens: targetMotionIds.map((motionId, index) =>
      token(motionId, 80 + (index % 2) * 14, 20 + Math.floor(index / 2) * 20)
    ),
    relations: [
      {
        recordId: "inputs-consumed",
        lifecycle: "exit",
        source: {
          selectorIds: sourceSelectorIds,
          motionIds: sourceMotionIds,
          bounds: { left: 10, top: 10, width: 68, height: 58 }
        }
      },
      {
        recordId: "results-enter",
        lifecycle: "enter",
        target: {
          selectorIds: targetSelectorIds,
          motionIds: targetMotionIds,
          bounds: { left: 80, top: 20, width: 30, height: 38 }
        }
      }
    ]
  };
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
