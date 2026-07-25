import assert from "node:assert/strict";
import test from "node:test";

import { reportKpGlyphReconciliationBackendCapabilities } from "../src/animation/semantic-glyph-reconciliation-capabilities.ts";
import { createKpFractionSplitGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-cases.ts";
import { compileKpGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-compiler.ts";
import { checkCorrespondenceMapRewindLaw } from "../src/semantic/correspondence.ts";
import {
  createNumeratorSplitMergeEquationKpAsset,
  numeratorSplitMergeEquationAssetIds
} from "../src/semantic/numerator-split-merge-equation-asset.ts";

test("inverse fraction split fixture retains governed source and target identity", () => {
  const asset = createNumeratorSplitMergeEquationKpAsset();
  const canonical = asset.transformations.find(({ id }) =>
    id === numeratorSplitMergeEquationAssetIds.splitTransform
  )!;
  const denominatorFanOut = canonical.correspondenceMap!.records.find(
    ({ id }) => id === "denominator-copies"
  )!;
  const fixture = createKpFractionSplitGlyphReconciliationCase();

  assert.equal(
    fixture.execution.transformationId,
    numeratorSplitMergeEquationAssetIds.splitTransform
  );
  assert.equal(fixture.execution.operationSpecId, "kp.core.fan-out");
  assert.deepEqual(
    fixture.execution.lineageGraph.sourceEntityIds,
    denominatorFanOut.sourceSelectorIds
  );
  assert.deepEqual(
    fixture.execution.lineageGraph.targetEntityIds,
    denominatorFanOut.targetSelectorIds
  );
  assert.deepEqual(fixture.execution.correspondenceMap.records, [
    denominatorFanOut
  ]);
  assert.deepEqual(checkCorrespondenceMapRewindLaw(
    fixture.execution.correspondenceMap
  ), []);
  assert.equal(canonical.lawRefs?.[0]?.id, "law.algebra.fraction-sum-split");
  assert.equal(Object.isFrozen(fixture), true);
});

test("inverse fraction split compiles through existing multiplicity and policy", async () => {
  const fixture = createKpFractionSplitGlyphReconciliationCase();
  const compiled = await compileKpGlyphReconciliationCase(fixture);

  assert.equal(compiled.matches.multiplicity.length, 1);
  assert.equal(compiled.matches.multiplicity[0]?.kind, "split");
  assert.equal(compiled.matches.ambiguities.length, 0);
  assert.equal(compiled.plan.steps[0]?.disposition, "group-reconcile");
  assert.equal(compiled.schedule.motions.length, 2);
  assert.equal(compiled.schedule.usedOperationSpecificPolicy, false);
  assert.ok(compiled.schedule.motions.every(({ status }) => status === "direct"));
});

test("inverse fraction split fixture closes static and headless capabilities", () => {
  const fixture = createKpFractionSplitGlyphReconciliationCase();

  for (const backendId of ["static-js", "headless"] as const) {
    const report = reportKpGlyphReconciliationBackendCapabilities({
      backendId,
      requiredCapabilities: fixture.requiredCapabilities
    });
    assert.equal(report.runtimeDependencies, "none");
    assert.equal(
      report.capabilities.some(({ disposition }) =>
        disposition === "rejected"
      ),
      false
    );
  }
});
