import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpGlyphReconciliationExperimentLedger,
  validateKpGlyphReconciliationExperimentLedger
} from "../src/animation/semantic-glyph-reconciliation-experiment.ts";

test("glyph reconciliation experiment freezes four falsifiable pressure cases", () => {
  const ledger = kpGlyphReconciliationExperimentLedger;
  assert.deepEqual(validateKpGlyphReconciliationExperimentLedger(ledger), []);
  assert.deepEqual(
    ledger.cases.map(({ relation }) => relation),
    ["one-to-one", "many-to-one", "one-to-many", "crowded-responsive"]
  );
  assert.equal(
    ledger.cases.find(({ relation }) => relation === "many-to-one")
      ?.requiredCapabilities.includes("cloze"),
    true
  );
  assert.equal(
    ledger.cases.find(({ relation }) => relation === "one-to-many")
      ?.requiredCapabilities.includes("branching"),
    true
  );
  assert.deepEqual(
    ledger.cases.find(({ relation }) => relation === "crowded-responsive")
      ?.viewports.map(({ id }) => id),
    ["wide", "phone"]
  );
});

test("experiment budgets are fixed before planner integration", () => {
  assert.deepEqual(kpGlyphReconciliationExperimentLedger.budget, {
    maxPlannerOperations: 10_000,
    maxColdPlanP95Ms: 12,
    maxCachedPlanP95Ms: 2,
    maxFrameSampleP95Ms: 1,
    maxSerializedPlanBytes: 32_768,
    maxRouteGzipGrowthBytes: 12_000
  });
});

test("legacy scheduling policy references decrease from the frozen baseline", () => {
  const { policyBaseline } = kpGlyphReconciliationExperimentLedger;
  const schedulePattern = new RegExp(
    policyBaseline.scheduleModeIds.join("|"),
    "g"
  );
  const referenceCount = policyBaseline.sourceFiles.reduce(
    (total, path) =>
      total + (readFileSync(path, "utf8").match(schedulePattern)?.length ?? 0),
    0
  );
  assert.equal(policyBaseline.sourceFiles.length, 7);
  assert.equal(referenceCount, policyBaseline.sourceReferenceCount - 1);
});

test("experiment has explicit complexity and bespoke-scheduler failure rules", () => {
  const { passCriteria, failCriteria } =
    kpGlyphReconciliationExperimentLedger;
  assert.ok(passCriteria.some((criterion) =>
    criterion.includes("Scheduling policy sites decrease")
  ));
  assert.ok(failCriteria.some((criterion) =>
    criterion.includes("specific scheduler")
  ));
  assert.ok(failCriteria.some((criterion) =>
    criterion.includes("Glyph equality")
  ));
});
