import assert from "node:assert/strict";
import test from "node:test";

import {
  inspectKpEditorEquationMaterialContinuity
} from "../src/editor/equation-material-continuity-inspector.ts";

test("inspector reports persistent ownership and an active artifact bundle", () => {
  const inspection = inspectKpEditorEquationMaterialContinuity({
    ownerIds: ["radical.base"],
    fragmentRoles: [
      "radical-hook",
      "radical-overbar",
      "radical-numerator",
      "radical-denominator"
    ],
    motionIdentityIds: [
      "radical-rewrite.base-radicand",
      "radical-rewrite.root-notation.radical-hook"
    ],
    materialContinuantCount: 5,
    structuralFragmentCount: 2,
    bundleAnchor: "82.4,37.1",
    semanticProgress: 0.58
  });

  assert.equal(inspection.mode, "persistent-owners-and-bundle");
  assert.equal(inspection.ownershipLabel, "1 owner · 2 motion identities");
  assert.equal(inspection.bundleLabel, "4 fragments → 82.4,37.1");
  assert.equal(inspection.settlementLabel, "material fragments");
  assert.equal(
    inspection.eligibilityLabel,
    "5 continuants · 2 structural exemptions"
  );
});

test("inspector distinguishes native handoff from settled geometry", () => {
  const snapshot = {
    ownerIds: ["radical.base"],
    fragmentRoles: ["radical-hook"],
    motionIdentityIds: ["radical-rewrite.base-radicand"],
    materialContinuantCount: 1,
    structuralFragmentCount: 1,
    bundleAnchor: "40,20",
    semanticProgress: 0.92
  } as const;

  assert.equal(
    inspectKpEditorEquationMaterialContinuity({
      ...snapshot,
      nativeSettlementProgress: 0.5
    }).settlementLabel,
    "native handoff"
  );
  assert.equal(
    inspectKpEditorEquationMaterialContinuity({
      ...snapshot,
      nativeSettlementProgress: 1
    }).settlementLabel,
    "native geometry"
  );
  assert.equal(
    inspectKpEditorEquationMaterialContinuity({
      ...snapshot,
      nativeSettlementProgress: 0,
      nativeSettlementPhase: "native-handoff"
    }).settlementLabel,
    "native handoff"
  );
});

test("linear continuity reports persistent owners without a bundle", () => {
  const inspection = inspectKpEditorEquationMaterialContinuity({
    ownerIds: ["linear-solve.lhs.x", "linear-solve.equals"],
    fragmentRoles: [],
    motionIdentityIds: ["linear-solve.lhs.x", "linear-solve.equals"],
    materialContinuantCount: 4,
    structuralFragmentCount: 0,
    semanticProgress: 0.5
  });

  assert.equal(inspection.mode, "persistent-owners");
  assert.equal(inspection.bundleLabel, "none");
  assert.equal(inspection.settlementLabel, "not applicable");
});
