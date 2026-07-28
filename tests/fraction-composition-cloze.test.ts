import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionSolutionClozeProjection
} from "../src/animation/fraction-composition-cloze.ts";
import {
  kpFractionCompositionPreservationManifest as manifest
} from "../src/reader/compiler/fraction-composition-preservation-manifest.ts";

test("fraction solution Cloze hides only the certified final value", () => {
  const projection = createKpFractionCompositionSolutionClozeProjection();

  assert.equal(projection.cardId, manifest.learningArtifacts.clozeCardId);
  assert.equal(projection.interactionKind, "cloze");
  assert.deepEqual(projection.objectIds, ["fraction-solve.state.solved"]);
  assert.deepEqual(projection.hiddenSelectorIds, ["solved.right"]);
  assert.deepEqual(
    projection.transformationIds,
    ["fraction-solve.step.simplify-solution"]
  );
  assert.deepEqual(projection.answer, {
    kind: "selector",
    value: "solved.right"
  });
  assert.deepEqual(projection.diagnostics, []);
});

test("fraction Cloze carries semantic authority but no paint or fold state", () => {
  const serialized = JSON.stringify(
    createKpFractionCompositionSolutionClozeProjection()
  );

  assert.equal(serialized.includes("foldMode"), false);
  assert.equal(serialized.includes("element"), false);
  assert.equal(serialized.includes("leftPx"), false);
  assert.equal(serialized.includes("topPx"), false);
  assert.equal(serialized.includes("whole-equation-fade"), false);
});
