import assert from "node:assert/strict";
import test from "node:test";
import { createKpFractionCompositionEquationAsset } from "../src/semantic/fraction-composition-equation-asset.ts";
import { projectKpSymbolicInspectionOccurrences } from "../src/semantic/symbolic-inspection-occurrences.ts";

test("equal factor glyphs retain separate occurrences and owning endpoints", () => {
  const asset = createKpFractionCompositionEquationAsset();
  const input = { assetId: asset.bundle.id, bundle: asset.bundle, transformation: asset.transformations[0]!, sourceRevision: "a", targetRevision: "b" };
  const occurrences = projectKpSymbolicInspectionOccurrences(input);
  const copies = occurrences.filter(item => item.side === "target" && item.selectorId.endsWith(".numerator"));
  assert.equal(copies.length, 2);
  assert.equal(copies[0]!.label, copies[1]!.label);
  assert.notEqual(copies[0]!.selectorId, copies[1]!.selectorId);
  assert.ok(occurrences.some(item => item.kind === "artifact"));
  assert.equal(occurrences.find(item => item.side === "source")!.provenance!.sourceIds[0], asset.sourceTraceId);
  assert.ok(Object.isFrozen(occurrences[0]!.provenance!.sourceIds));
  assert.equal("entityId" in occurrences[0]!, false);
});
test("occurrence projection cannot bypass malformed source validation", () => {
  const asset = createKpFractionCompositionEquationAsset();
  assert.throws(() => projectKpSymbolicInspectionOccurrences({ assetId: asset.bundle.id, bundle: asset.bundle,
    transformation: { ...asset.transformations[0]!, targetObjectIds: ["missing"] }, sourceRevision: "a", targetRevision: "b" }), /missing/);
});
