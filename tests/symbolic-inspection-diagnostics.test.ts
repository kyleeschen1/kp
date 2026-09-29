import assert from "node:assert/strict";
import test from "node:test";
import { createKpFractionCompositionEquationAsset } from "../src/semantic/fraction-composition-equation-asset.ts";
import { createKpLawfulFractionSolveMacro } from "../src/semantic/fraction-solve-macro.ts";
import { projectKpSymbolicInspectionEvidence } from "../src/semantic/symbolic-inspection-evidence.ts";
import { describeKpSymbolicInspectionValidity } from "../src/semantic/symbolic-inspection-diagnostics.ts";

test("unknown assumptions stay unknown even when a named law declares strict checking", () => {
  const asset = createKpFractionCompositionEquationAsset();
  const evidence = projectKpSymbolicInspectionEvidence({ assetId: asset.bundle.id, bundle: asset.bundle,
    transformation: { ...asset.transformations[0]!, assumptions: ["The parameter is nonzero."], lawRefs: [{ id: "authored-law", level: "strict" }] },
    sourceRevision: "a", targetRevision: "b" });
  const result = describeKpSymbolicInspectionValidity(evidence);
  assert.equal(result.status, "conditions-unchecked");
  assert.deepEqual(result.assumptions, ["The parameter is nonzero."]);
  assert.match(result.limitation, /do not prove mathematical equivalence/);
  assert.equal("apply" in result, false);
});
test("invalid construction remains an error, not a conditional warning", () => {
  const asset = createKpFractionCompositionEquationAsset();
  const input = { assetId: asset.bundle.id, bundle: asset.bundle, transformation: asset.transformations[0]!, sourceRevision: "a", targetRevision: "b" };
  for (const ids of [[], [input.transformation.sourceObjectIds[0]!, input.transformation.sourceObjectIds[0]!]]) {
    assert.throws(() => projectKpSymbolicInspectionEvidence({ ...input, transformation: { ...input.transformation, sourceObjectIds: ids } }), /nonempty and unique/);
  }
  assert.throws(() => createKpLawfulFractionSolveMacro({ finalValue: 10 }), /changes the solution/);
});
