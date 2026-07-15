import assert from "node:assert/strict";
import test from "node:test";

import {
  symbolicManipulationFamilyById
} from "../src/animation/symbolic-manipulation-family-registry.ts";
import {
  createKpSymbolicPausedFrameDrillDown
} from "../src/animation/symbolic-paused-frame-drilldown.ts";

test("symbolic paused frame exposes matrix cell decomposition context", () => {
  const family = symbolicManipulationFamilyById(
    "family.linear-algebra.matrix-matrix-composition"
  );
  assert.ok(family);

  const drillDown = createKpSymbolicPausedFrameDrillDown({
    family,
    runtimeSampleId: "sample.animation.matrix-matrix.basic",
    selectedTransformationDefinitionId:
      "definition.symbolic.linear-algebra.cell-dot-products",
    question: "How does this output cell come from one row and one column?"
  });

  assert.equal(drillDown.kind, "symbolic-paused-frame-drilldown");
  assert.equal(drillDown.animationId, "animation.matrix-matrix.basic");
  assert.equal(drillDown.selectedTransformation?.transformType, "cellDotProducts");
  assert.deepEqual(
    drillDown.correspondenceRows.slice(0, 2).map((row) => ({
      source: `${row.sourceObjectRole}.${row.sourceSelectorRole}`,
      sourceKind: row.sourceSelectorKind,
      target: `${row.targetObjectRole}.${row.targetSelectorRole}`,
      targetKind: row.targetSelectorKind
    })),
    [
      {
        source: "matrixMatrix.before.left.row",
        sourceKind: "matrix-row",
        target: "matrixMatrix.after.cell.dot.product",
        targetKind: "dot-product"
      },
      {
        source: "matrixMatrix.before.right.column",
        sourceKind: "matrix-column",
        target: "matrixMatrix.after.cell.dot.product",
        targetKind: "dot-product"
      }
    ]
  );
  assert.deepEqual(drillDown.visualMotifIds, [
    "motif.linear-algebra.matrix-matrix.cell-dot-grid"
  ]);
  assert.deepEqual(drillDown.graphEquivalentIds, [
    "graph.linear-algebra.matrix-matrix.linear-map-composition"
  ]);
  assert.deepEqual(drillDown.generatedProblemHookIds, [
    "hook.generated.linear-algebra-matrix-matrix"
  ]);
  assert.deepEqual(drillDown.flashcardHookIds, [
    "hook.flashcard.linear-algebra.matrix-matrix.cell"
  ]);
  assert.deepEqual(drillDown.blueprint.suggestedTransformTypes, [
    "focusCorrespondence",
    "cell-dot-grid",
    "explainAssumptions",
    "restoreParentFrame"
  ]);
  assert.ok(
    drillDown.promptFacts.includes(
      "correspondence:matrixMatrix.before.left.row->matrixMatrix.after.cell.dot.product"
    )
  );
  assert.deepEqual(drillDown.diagnostics, []);
});

test("symbolic paused frame reports missing sample and transformation context", () => {
  const family = symbolicManipulationFamilyById("family.algebra.both-sides");
  assert.ok(family);

  const drillDown = createKpSymbolicPausedFrameDrillDown({
    family,
    runtimeSampleId: "sample.missing",
    selectedTransformationDefinitionId: "definition.missing"
  });

  assert.equal(drillDown.animationId, undefined);
  assert.equal(drillDown.selectedTransformation, undefined);
  assert.deepEqual(
    drillDown.diagnostics.map((diagnostic) => [
      diagnostic.code,
      diagnostic.path
    ]),
    [
      ["symbolic-drilldown.runtime-sample-missing", "runtimeSampleId"],
      [
        "symbolic-drilldown.transformation-definition-missing",
        "selectedTransformationDefinitionId"
      ]
    ]
  );
});
