import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpMatrixVectorCompositionChoreography,
  sampleKpMatrixVectorCompositionChoreography
} from "../src/animation/matrix-vector-composition-choreography.ts";
import { createKpEditorAnimationLibrary } from
  "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from
  "../src/editor/animation-player-state.ts";
import { createKpEditorEquationStageFrame } from
  "../src/editor/equation-surface-adapter.ts";

const animationId =
  "animation.generated.linear-algebra.matrix-vector.two-by-two";
const catalog = createKpAnimationAssets();
const animation = catalog.find(({ id }) => id === animationId)!;
const descriptor = createKpEditorAnimationLibrary().find(
  (candidate) => candidate.animationId === animationId
)!;
const choreography = createKpMatrixVectorCompositionChoreography(animation);

test("rank-6 baseline preserves row-ranked dot-product pacing", () => {
  assert.deepEqual({
    duration: choreography.rendererPlan.semanticDurationMs,
    actions: choreography.rendererPlan.semanticActionCount,
    structure: [
      choreography.rendererPlan.structureRevealStart,
      choreography.rendererPlan.structureRevealEnd
    ],
    release: [
      choreography.rendererPlan.sourceReleaseStart,
      choreography.rendererPlan.sourceReleaseEnd
    ],
    rows: choreography.rows.map((row) => ({
      semanticIndex: row.semanticIndex,
      start: row.start,
      end: row.end,
      rowValues: row.rowValues,
      vectorValues: row.vectorValues,
      result: row.result,
      rowLatex: row.rowLatex
    }))
  }, {
    duration: 2_400,
    actions: 2,
    structure: [0.02, 1 / 12],
    release: [11 / 12, 1],
    rows: [
      {
        semanticIndex: 0,
        start: 1 / 12,
        end: 1 / 2,
        rowValues: [2, 1],
        vectorValues: [4, 5],
        result: 13,
        rowLatex: String.raw`2 \times 4 + 1 \times 5 = 13`
      },
      {
        semanticIndex: 1,
        start: 1 / 2,
        end: 11 / 12,
        rowValues: [0, 3],
        vectorValues: [4, 5],
        result: 15,
        rowLatex: String.raw`0 \times 4 + 3 \times 5 = 15`
      }
    ]
  });
  assert.equal(choreography.traversal.policy, "ranked-index");
  assert.equal(
    choreography.traversal.authorityId,
    "kp.linear-algebra.matrix-vector#row-dot-products"
  );
  assert.deepEqual(choreography.traversal.ranks.map(({ rank }) => rank), [0, 1]);
  assert.equal(choreography.propagation.promotable, true);
  assert.deepEqual(choreography.propagation.diagnostics, []);
});

test("rank-6 baseline preserves start midpoint and settlement frames", () => {
  const sample = (progress: number) =>
    sampleKpMatrixVectorCompositionChoreography({
      choreography,
      progress,
      direction: "forward",
      accessibilityMode: "full"
    }).motion;

  const start = sample(0);
  assert.deepEqual(start.rows.map(({ status }) => status), [
    "upcoming",
    "upcoming"
  ]);
  assert.equal(start.activeRowIndex, undefined);
  assert.equal(start.sourceOpacity, 1);
  assert.equal(start.structureRevealProgress, 0);

  const firstAct = sample(1 / 4);
  assert.equal(firstAct.activeRowIndex, 0);
  assert.deepEqual(firstAct.rows.map(({ status }) => status), [
    "active",
    "upcoming"
  ]);
  assert.equal(firstAct.rows[0]?.localProgress, 0.4);
  assert.equal(firstAct.rows[0]?.calculationOpacity, 1);

  const handoff = sample(1 / 2);
  assert.equal(handoff.activeRowIndex, 1);
  assert.deepEqual(handoff.rows.map(({ status }) => status), [
    "resolved",
    "active"
  ]);
  assert.equal(handoff.rows[0]?.resultRevealProgress, 1);
  assert.equal(handoff.rows[1]?.localProgress, 0);

  const end = sample(1);
  assert.deepEqual(end.rows.map(({ status }) => status), [
    "resolved",
    "resolved"
  ]);
  assert.deepEqual(end.rows.map(({ resultRevealProgress }) =>
    resultRevealProgress), [1, 1]);
  assert.equal(end.sourceOpacity, 0);
  assert.equal(end.targetSettlementProgress, 1);

  const rewind = sampleKpMatrixVectorCompositionChoreography({
    choreography,
    progress: 3 / 4,
    direction: "rewind",
    accessibilityMode: "full"
  }).motion;
  assert.deepEqual(rewind, firstAct);
});

test("rank-6 visible baseline exposes one exact row overlay and narration", async () => {
  const frame = (progress: number) => createKpEditorEquationStageFrame({
    animation,
    state: createKpEditorAnimationPlayerState({
      descriptor,
      animation,
      catalog,
      progress
    })
  });
  assert.deepEqual(
    frame(0).matrixVectorComposition?.frame.motion.rows.map(
      ({ status }) => status
    ),
    ["upcoming", "upcoming"]
  );
  assert.deepEqual(
    frame(0.5).matrixVectorComposition?.frame.motion.rows.map(
      ({ status }) => status
    ),
    ["resolved", "active"]
  );
  assert.deepEqual(
    frame(1).matrixVectorComposition?.frame.motion.rows.map(
      ({ resultRevealProgress }) => resultRevealProgress
    ),
    [1, 1]
  );

  const adapter = await readFile("src/editor/equation-surface-adapter.ts", "utf8");
  for (const contract of [
    "data-kp-editor-matrix-vector-overlay",
    "data-kp-editor-matrix-vector-row",
    "data-kp-editor-matrix-vector-intermediate-object-id",
    "kpEditorMatrixVectorRowStatus",
    "kpEditorMatrixVectorResult",
    "renderLatexToHtml(row.rowLatex, { displayMode: false })",
    "Each resolved component persists while the next matrix row meets the vector."
  ]) {
    assert.ok(adapter.includes(contract), `missing visible contract ${contract}`);
  }
});
