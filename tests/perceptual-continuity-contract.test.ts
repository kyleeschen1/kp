import assert from "node:assert/strict";
import test from "node:test";

import {
  kpOperationEvaluationExecutableProgramCompiler
} from "../src/animation/operation-evaluation-presentation-registry.ts";
import {
  evaluateKpPerceptualContinuityEvidence,
  isKpVerifiedPerceptualContinuityContract,
  kpPerceptualContinuityEndpointMetrics,
  validateAndMintKpPerceptualContinuityContract,
  type KpPerceptualContinuityContractDraft,
  type KpPerceptualContinuitySample,
  type KpPerceptualContinuityTrace,
  type KpVerifiedPerceptualContinuityContract
} from "../src/animation/perceptual-continuity-contract.ts";
import type {
  KpVerifiedExecutableSuccessorMotifProgram
} from "../src/animation/motifs/executable-successor-motif-program.ts";

const program = kpOperationEvaluationExecutableProgramCompiler.program;

function draft(): KpPerceptualContinuityContractDraft {
  return {
    schemaVersion: "kp.perceptual-continuity-contract.v1",
    id: "kp.perceptual-continuity.operation-evaluation.v1",
    programId: program.id,
    programVersion: program.programVersion,
    programKind: program.kind,
    visibility: {
      kind: "continuous-visible-ink",
      minimumVisibleInkRatio: 0.18
    },
    adjacentFrameBudgets: {
      maximumNormalizedGeometryDelta: 0.08,
      maximumNormalizedRasterDelta: 0.1
    },
    ownerCoverage: {
      requiredCoverageRatio: 1,
      maximumAmbiguousOwnerCount: 0,
      maximumAtomicTransferMismatchCount: 0
    },
    endpointEquivalence: {
      settlement: "exact-native-source-and-target",
      requiredMetrics: kpPerceptualContinuityEndpointMetrics
    },
    invariance: {
      directions: ["forward", "rewind"],
      samplingModes: ["direct-seek", "natural-playback", "replay"],
      browsers: ["chromium", "firefox", "webkit"],
      viewports: ["wide", "phone"],
      deviceScaleFactors: [1, 2]
    },
    evidenceBudget: {
      maximumTraceCount: 72,
      maximumSamplesPerTrace: 257,
      maximumTotalSamples: 18_504
    },
    semanticAuthority: {
      identity: "program-roles-and-lineage",
      measurements: "current-frame-observation-only",
      rasterHistory: "never-semantic-authority"
    }
  };
}

function contract(): KpVerifiedPerceptualContinuityContract {
  const result = validateAndMintKpPerceptualContinuityContract({
    draft: draft(),
    program
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") {
    throw new Error("Perceptual continuity fixture did not mint.");
  }
  return result.contract;
}

const progressPhases = [
  [0, "orient-contributors"],
  [0.25, "gather-contributors"],
  [0.5, "recognize-result"],
  [0.75, "settle-result"],
  [1, "settle-result"]
] as const;

function samples(): readonly KpPerceptualContinuitySample[] {
  return progressPhases.map(([progress, phaseId], index) => ({
    progress,
    phaseId,
    visibleInkRatio: 0.42,
    normalizedGeometryDeltaFromPrevious: index === 0 ? 0 : 0.04,
    normalizedRasterDeltaFromPrevious: index === 0 ? 0 : 0.05,
    ownerCoverageRatio: 1,
    ambiguousOwnerCount: 0,
    atomicTransferMismatchCount: 0,
    endpoint: progress === 0 ? "source" : progress === 1 ? "target" : "none",
    endpointMetricMismatches: []
  }));
}

function traces(): readonly KpPerceptualContinuityTrace[] {
  const result: KpPerceptualContinuityTrace[] = [];
  for (const direction of ["forward", "rewind"] as const) {
    for (const samplingMode of [
      "direct-seek",
      "natural-playback",
      "replay"
    ] as const) {
      for (const browser of ["chromium", "firefox", "webkit"] as const) {
        for (const viewport of ["wide", "phone"] as const) {
          for (const deviceScaleFactor of [1, 2] as const) {
            result.push({
              id: [
                direction,
                samplingMode,
                browser,
                viewport,
                deviceScaleFactor
              ].join("."),
              direction,
              samplingMode,
              browser,
              viewport,
              deviceScaleFactor,
              samples: samples()
            });
          }
        }
      }
    }
  }
  return result;
}

test("one nominal contract fixes renderer-neutral perceptual obligations", () => {
  const verified = contract();

  assert.equal(isKpVerifiedPerceptualContinuityContract(verified), true);
  assert.deepEqual(verified.phaseIds, [
    "orient-contributors",
    "gather-contributors",
    "recognize-result",
    "settle-result"
  ]);
  assert.equal(verified.semanticAuthority.rasterHistory,
    "never-semantic-authority");
  assert.equal(Object.isFrozen(verified), true);
  assert.equal(Object.isFrozen(verified.endpointEquivalence.requiredMetrics),
    true);
  assert.equal(
    isKpVerifiedPerceptualContinuityContract(
      JSON.parse(JSON.stringify(verified))
    ),
    false
  );
});

test("contract validation rejects topology, renderer fields, and false vanish authority", () => {
  const result = validateAndMintKpPerceptualContinuityContract({
    draft: {
      ...draft(),
      visibility: {
        kind: "intentional-vanish",
        minimumVisibleInkRatio: 0.18,
        authorizedPhaseId: "recognize-result"
      },
      transferTopology: "shared-zero-area-junction",
      dom: "<span>3</span>",
      pixelHistory: [0, 1]
    },
    program
  });

  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  assert.deepEqual(
    result.issues.map(({ code }) => code),
    [
      "contract.input.unsupported-field",
      "contract.input.unsupported-field",
      "contract.input.unsupported-field",
      "contract.visibility.program-mismatch"
    ]
  );
});

test("contract binds the exact minted program identity and version", () => {
  const copiedProgram = JSON.parse(JSON.stringify(program)) as
    KpVerifiedExecutableSuccessorMotifProgram;
  const unverified = validateAndMintKpPerceptualContinuityContract({
    draft: draft(),
    program: copiedProgram
  });
  assert.equal(unverified.status, "invalid");
  if (unverified.status === "invalid") {
    assert.equal(unverified.issues[0]?.code, "contract.program.unverified");
  }

  const drifted = validateAndMintKpPerceptualContinuityContract({
    draft: {
      ...draft(),
      programVersion: "2.0.0"
    },
    program
  });
  assert.equal(drifted.status, "invalid");
  if (drifted.status === "invalid") {
    assert.ok(drifted.issues.some(
      ({ code }) => code === "contract.program.mismatch"
    ));
  }
});

test("the bounded 72-trace matrix passes deterministically", () => {
  const verified = contract();
  const evidence = traces();
  const first = evaluateKpPerceptualContinuityEvidence({
    contract: verified,
    traces: evidence
  });
  const second = evaluateKpPerceptualContinuityEvidence({
    contract: verified,
    traces: evidence
  });

  assert.deepEqual(first, second);
  assert.equal(first.passed, true);
  assert.equal(first.expectedTraceCount, 72);
  assert.equal(first.traceCount, 72);
  assert.equal(first.sampleCount, 360);
  assert.deepEqual(first.diagnostics, []);
});

test("numeric evidence rejects blank paint, jumps, ownership gaps, and endpoint drift", () => {
  const evidence = [...traces()];
  const target = evidence[0]!;
  evidence[0] = {
    ...target,
    samples: target.samples.map((sample, index) =>
      index === 2
        ? {
            ...sample,
            phaseId: "settle-result",
            visibleInkRatio: 0.02,
            normalizedGeometryDeltaFromPrevious: 0.4,
            normalizedRasterDeltaFromPrevious: 0.5,
            ownerCoverageRatio: 0.8,
            ambiguousOwnerCount: 1,
            atomicTransferMismatchCount: 1
          }
        : index === target.samples.length - 1
          ? {
              ...sample,
              endpointMetricMismatches: ["font", "baseline"]
            }
          : sample
    )
  };
  const report = evaluateKpPerceptualContinuityEvidence({
    contract: contract(),
    traces: evidence
  });
  const codes = new Set(report.diagnostics.map(({ code }) => code));

  assert.equal(report.passed, false);
  for (const code of [
    "evidence.visible-ink-floor",
    "evidence.geometry-delta",
    "evidence.raster-delta",
    "evidence.owner-coverage",
    "evidence.owner-conflict",
    "evidence.owner-transfer",
    "evidence.endpoint-mismatch",
    "evidence.semantic-sampling-drift"
  ] as const) {
    assert.equal(codes.has(code), true, code);
  }
});

test("missing and duplicate invariant traces fail inside a fixed cost ceiling", () => {
  const evidence = traces();
  const missing = evaluateKpPerceptualContinuityEvidence({
    contract: contract(),
    traces: evidence.slice(1)
  });
  const duplicate = evaluateKpPerceptualContinuityEvidence({
    contract: contract(),
    traces: [...evidence, evidence[0]!]
  });

  assert.ok(missing.diagnostics.some(
    ({ code }) => code === "evidence.trace-missing"
  ));
  assert.ok(duplicate.diagnostics.some(
    ({ code }) => code === "evidence.trace-duplicate"
  ));
  assert.ok(duplicate.diagnostics.some(
    ({ code }) => code === "evidence.trace-budget"
  ));
});
