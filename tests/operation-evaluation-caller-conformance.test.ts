import assert from "node:assert/strict";
import test from "node:test";

import {
  kpBoundedSemanticContactPaintContinuityCompiler,
  kpOperationEvaluationExecutableProgramCompiler,
  kpSuccessorSynthesisPresentationPlanCompiler
} from "../src/animation/operation-evaluation-presentation-registry.ts";
import {
  createKpFivePlusTwoEvaluationAnimationAsset,
  createKpOnePlusTwoEvaluationAnimationAsset,
  createKpThreeSixthsEvaluationAnimationAsset
} from "../src/animation/operation-evaluation-adapter.ts";
import {
  certifyKpOperationEvaluationCallerCohort,
  generateKpOperationEvaluationCallerConformanceManifest,
  isKpOperationEvaluationCallerConformanceManifest,
  type KpOperationEvaluationCallerAssetCohort
} from "../src/architecture/operation-evaluation-caller-conformance.ts";
import {
  resolveKpExecutableSuccessorMotifProgramRoute
} from "../src/reader/renderers/executable-successor-motif-program-adapter.ts";

test("three real callers generate one shared executable authority manifest", () => {
  const manifest =
    generateKpOperationEvaluationCallerConformanceManifest();

  assert.equal(
    isKpOperationEvaluationCallerConformanceManifest(manifest),
    true
  );
  assert.equal(manifest.callerCount, 3);
  assert.equal(
    manifest.program,
    kpOperationEvaluationExecutableProgramCompiler.program
  );
  assert.equal(
    manifest.route,
    resolveKpExecutableSuccessorMotifProgramRoute(manifest.program)
  );
  assert.equal(
    manifest.route.primitiveRoute,
    "native-katex-successor-synthesis"
  );
  assert.deepEqual(manifest.sharedCompilerAuthority, {
    planCompilerId: kpSuccessorSynthesisPresentationPlanCompiler.id,
    planCompilerVersion:
      kpSuccessorSynthesisPresentationPlanCompiler.version,
    executableProgramCompilerId:
      kpOperationEvaluationExecutableProgramCompiler.id,
    executableProgramCompilerVersion:
      kpOperationEvaluationExecutableProgramCompiler.version,
    paintContinuityCompilerId:
      kpBoundedSemanticContactPaintContinuityCompiler.id,
    paintContinuityCompilerVersion:
      kpBoundedSemanticContactPaintContinuityCompiler.version
  });
  assert.deepEqual(
    manifest.callers.map(({ sourceLatex, targetLatex }) => [
      sourceLatex,
      targetLatex
    ]),
    [
      ["1 + 2", "3"],
      ["5 + 2", "7"],
      ["\\frac{3}{6}", "\\frac{1}{2}"]
    ]
  );
});

test("every caller proves exact roles, lineage, continuity, and phase fidelity", () => {
  const manifest =
    generateKpOperationEvaluationCallerConformanceManifest();
  const forwardPhaseIds = manifest.program.phases.map(({ id }) => id);

  for (const caller of manifest.callers) {
    assert.ok(caller.materialInputAnnotationIds.length > 0);
    assert.ok(caller.catalystAnnotationIds.length > 0);
    assert.ok(caller.resultAnnotationIds.length > 0);
    assert.deepEqual(
      new Set(caller.lineageSourceAnnotationIds),
      new Set(caller.materialInputAnnotationIds)
    );
    assert.deepEqual(
      new Set(caller.lineageTargetAnnotationIds),
      new Set(caller.resultAnnotationIds)
    );
    assert.ok(caller.catalystAnnotationIds.every(
      (id) => !caller.lineageSourceAnnotationIds.includes(id)
    ));
    assert.deepEqual(caller.continuity, {
      topology: "bounded-semantic-contact-co-presence",
      nonZeroPaint: "opaque",
      endpointSettlement: "native-source-and-target",
      visibilityKind: "continuous-visible-ink",
      minimumVisibleInkRatio: 0.18
    });
    assert.deepEqual(
      caller.forwardPhases.map(({ phaseId }) => phaseId),
      forwardPhaseIds
    );
    assert.deepEqual(
      caller.rewindPhases.map(({ phaseId }) => phaseId),
      [...forwardPhaseIds].reverse()
    );
    assert.ok(caller.forwardPhases.every(
      ({ phaseId, sampledActivePhaseId }) =>
        phaseId === sampledActivePhaseId
    ));
    assert.ok(caller.rewindPhases.every(
      ({ phaseId, sampledActivePhaseId }) =>
        phaseId === sampledActivePhaseId
    ));
  }
});

test("unsupported evaluation remains an honest non-animated checkpoint", () => {
  const manifest =
    generateKpOperationEvaluationCallerConformanceManifest();

  assert.deepEqual(manifest.unsupportedFallback, {
    resolutionStatus: "unknown-operation",
    planKind: "explicit-static-checkpoint",
    reason: "unsupported-presentation"
  });
});

test("names, copied snapshots, and incomplete lineage cannot certify", () => {
  const real =
    generateKpOperationEvaluationCallerConformanceManifest();
  assert.equal(
    isKpOperationEvaluationCallerConformanceManifest(
      JSON.parse(JSON.stringify(real))
    ),
    false
  );

  const one = createKpOnePlusTwoEvaluationAnimationAsset();
  const five = createKpFivePlusTwoEvaluationAnimationAsset();
  const quotient = createKpThreeSixthsEvaluationAnimationAsset();
  const namesOnly = [
    { id: one.id },
    { id: five.id },
    { id: quotient.id }
  ] as unknown as KpOperationEvaluationCallerAssetCohort;
  assert.throws(
    () => certifyKpOperationEvaluationCallerCohort(namesOnly)
  );

  const transformation = one.transformations[0]!;
  const record = transformation.correspondenceMap!.records[0]!;
  const incomplete = {
    ...one,
    transformations: [{
      ...transformation,
      correspondenceMap: {
        ...transformation.correspondenceMap!,
        records: [{
          ...record,
          sourceSelectorIds: record.sourceSelectorIds.slice(0, 2)
        }]
      }
    }]
  };
  assert.throws(
    () => certifyKpOperationEvaluationCallerCohort([
      incomplete,
      five,
      quotient
    ]),
    /semantic successor synthesis|source role coverage/
  );
});

test("the generated manifest cannot author renderer or caller choreography", () => {
  const serialized = JSON.stringify(
    generateKpOperationEvaluationCallerConformanceManifest()
  );

  for (const forbidden of [
    "pixel-geometry",
    "keyframes",
    "path-family",
    "handoff-progress",
    "scheduler",
    "\"opacity\""
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});
