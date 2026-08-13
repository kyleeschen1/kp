import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import {
  compileKpGovernedCanonicalConstruction,
  createKpGovernedCanonicalCompoundConstruction,
  createKpGovernedCanonicalConstructionRequest,
  createKpGovernedFractionSplitMergeVariation,
  KpGovernedConstructionVerificationError,
  planKpGovernedConstructionRepairs,
  projectKpGovernedCanonicalConstructionCohort,
  sampleKpGovernedCanonicalCompoundConstruction
} from "../src/authoring/canonical-animation-public-api.ts";
import {
  kpPreExpansionLlmGenerationBenchmark
} from "./fixtures/pre-expansion-llm-generation-benchmark.ts";

test("bounded fresh-process generation measures meet the expansion gate", () => {
  const benchmark = kpPreExpansionLlmGenerationBenchmark;

  assert.deepEqual(benchmark.isolation, {
    freshProcesses: 3,
    conversationHistoryProvided: false,
    repositoryAccess: "read-only",
    maximumFilesPerCase: 6,
    outputConstraint: "structured-json"
  });
  assert.deepEqual(
    benchmark.cases.map(({ outcome }) => outcome),
    ["valid-after-one-repair", "valid-first-pass", "typed-repair-gap"]
  );
  assert.ok(benchmark.cases.every(({ validAfterOneTypedRepair }) =>
    validAfterOneTypedRepair
  ));
  assert.ok(benchmark.cases.every(({ obsoleteApiSelections }) =>
    obsoleteApiSelections === 0
  ));
  assert.ok(benchmark.cases.every(({ silentFallbacks }) =>
    silentFallbacks === 0
  ));
  assert.ok(benchmark.cases.every(({ filesRead }) => filesRead <= 6));
  assert.deepEqual(
    benchmark.cases.map(({ selfReportedMetadataAccurate }) =>
      selfReportedMetadataAccurate
    ),
    [false, true, true]
  );
});

test("existing-operation variation retains exact endpoints, rewind, and projections", () => {
  const variation = createKpGovernedFractionSplitMergeVariation();
  const [source, target] = variation.authority.animation.bundle.objects;
  const [split, merge] = variation.authority.animation.transformations;
  const projection = projectKpGovernedCanonicalConstructionCohort();

  assert.deepEqual(split?.sourceObjectIds, [source?.id]);
  assert.deepEqual(split?.targetObjectIds, [target?.id]);
  assert.deepEqual(merge?.sourceObjectIds, [target?.id]);
  assert.deepEqual(merge?.targetObjectIds, [source?.id]);
  assert.deepEqual(
    variation.equalityCertificate.source,
    variation.equalityCertificate.target
  );
  assert.equal(
    checkKpAnimationAssetSeekRewindLaw(variation.authority.animation).passed,
    true
  );
  assert.ok(projection.targets.some(({ kind, artifactIds }) =>
    kind === "static-js" &&
    artifactIds.includes(variation.compilation.construction.id)
  ));
  assert.ok(projection.targets.some(({ kind, artifactIds }) =>
    kind === "static-step" &&
    artifactIds.includes(variation.compilation.construction.id)
  ));
});

test("two-operation composition remains one directly seekable canonical clock", () => {
  const compound = createKpGovernedCanonicalCompoundConstruction();
  const expected = compound.children.flatMap(({ construction }) =>
    construction.operations.map(({ transformationId }) => transformationId)
  );

  assert.ok(expected.length >= 2);
  assert.deepEqual(
    compound.clock.actions.map(({ canonicalOperationId }) =>
      canonicalOperationId
    ),
    expected
  );
  const direct = sampleKpGovernedCanonicalCompoundConstruction(compound, 0.437);
  sampleKpGovernedCanonicalCompoundConstruction(compound, 0.8);
  assert.deepEqual(
    sampleKpGovernedCanonicalCompoundConstruction(compound, 0.437),
    direct
  );
  assert.equal(
    sampleKpGovernedCanonicalCompoundConstruction(compound, 0).localProgress,
    0
  );
  assert.equal(
    sampleKpGovernedCanonicalCompoundConstruction(compound, 1).localProgress,
    1
  );
});

test("unsupported operation returns a typed repair gap and no fallback", () => {
  const fixture = createKpGovernedFractionSplitMergeVariation();
  const unsupportedOperationId = "kp.algebra.teleport-term";
  const request = createKpGovernedCanonicalConstructionRequest({
    ...fixture.request,
    id: "request.benchmark.unsupported-teleport-term.v1",
    approvedOperationIds: [unsupportedOperationId],
    explanationPurpose: {
      ...fixture.request.explanationPurpose,
      operationIds: [unsupportedOperationId]
    },
    compositionIntent: {
      ...fixture.request.compositionIntent,
      operationIds: [unsupportedOperationId]
    }
  });

  assert.throws(
    () => compileKpGovernedCanonicalConstruction({
      request,
      authority: fixture.authority
    }),
    KpGovernedConstructionVerificationError
  );
  const repairs = planKpGovernedConstructionRepairs({
    request,
    authority: fixture.authority
  });
  const operationRepair = repairs.find(({ action }) =>
    action.kind === "choose-approved-operation"
  );
  assert.equal(operationRepair?.action.kind, "choose-approved-operation");
  if (operationRepair?.action.kind !== "choose-approved-operation") return;
  assert.deepEqual(
    operationRepair.action.allowedOperationIds,
    fixture.authority.animation.transformations.map(({ id }) => id).sort()
  );
  assert.equal(
    /fallback|replacement-animation|renderer/i.test(JSON.stringify(repairs)),
    false
  );
});
