import assert from "node:assert/strict";
import test from "node:test";

import {
  kpFractionCompositionPreservationManifest as manifest
} from "../src/reader/compiler/fraction-composition-preservation-manifest.ts";
import {
  createKpLawfulFractionSolveMacro
} from "../src/semantic/fraction-solve-macro.ts";

test("fraction composition manifest freezes every exact state and adjacent step", () => {
  const macro = createKpLawfulFractionSolveMacro();

  assert.equal(macro.id, manifest.macroId);
  assert.deepEqual(
    macro.states.map(({ id }) => id),
    manifest.stateIds
  );
  assert.deepEqual(
    macro.steps.map(({ id, transformType }) => ({ id, transformType })),
    manifest.steps.map(({ id, transformType }) => ({ id, transformType }))
  );
  assert.ok(macro.steps.every((step, index) =>
    step.sourceStateId === manifest.stateIds[index] &&
    step.targetStateId === manifest.stateIds[index + 1]
  ));
});

test("every state retains the exact solution and every step has authority", () => {
  const macro = createKpLawfulFractionSolveMacro();

  assert.ok(macro.states.every(({ verifiedSolution }) =>
    verifiedSolution.numerator === manifest.exactSolution.numerator &&
    verifiedSolution.denominator === manifest.exactSolution.denominator
  ));
  assert.ok(macro.steps.every(({ authorityIds }) => authorityIds.length > 0));
});

test("fraction composition dependencies are exact and acyclic", () => {
  const visited = new Set<string>();
  for (const step of manifest.steps) {
    assert.ok(step.dependencyIds.every((dependencyId) =>
      visited.has(dependencyId)
    ));
    visited.add(step.id);
  }
  assert.equal(visited.size, 13);
});

test("fraction composition freezes fold paint layout and architecture boundaries", () => {
  assert.deepEqual(manifest.foldContract.modes, [
    "expanded",
    "collapsed",
    "automatic",
    "pinned"
  ]);
  assert.equal(manifest.paintContract.structuralFractionOpacity, "opaque-throughout");
  assert.equal(manifest.presentation.layoutAuthority, "certified-equation-stage");
  assert.deepEqual(manifest.preservationBoundary, {
    runtimeClockCount: 1,
    canonicalRendererSessionCount: 1,
    structuralWebglLeaseLimit: 1,
    compositorCoreFrozen: true,
    lifecycleVocabularyFrozen: true,
    schedulerVocabularyFrozen: true,
    operationSpecificGeometryAllowed: false,
    existingCanonicalReadersMustRemainUnchanged: true
  });
});

