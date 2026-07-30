import assert from "node:assert/strict";
import test from "node:test";

import {
  kpOperationEvaluationExecutableProgramCompiler
} from "../src/animation/operation-evaluation-presentation-registry.ts";
import {
  compareKpOperationEvaluationContinuityTopologies,
  createKpOperationEvaluationContinuityContractDraft,
  kpOperationEvaluationContinuityTopologyDecision,
  type KpOperationEvaluationReferencePaintProfile,
  type KpOperationEvaluationReferencePaintRecording
} from "../src/animation/operation-evaluation-continuity-topology.ts";
import {
  validateAndMintKpPerceptualContinuityContract
} from "../src/animation/perceptual-continuity-contract.ts";
import {
  validateAndMintKpExecutableSuccessorMotifProgram
} from "../src/animation/motifs/executable-successor-motif-program-validator.ts";

const program = kpOperationEvaluationExecutableProgramCompiler.program;
const contractResult = validateAndMintKpPerceptualContinuityContract({
  draft: createKpOperationEvaluationContinuityContractDraft(program),
  program
});
assert.equal(contractResult.status, "verified");
if (contractResult.status !== "verified") {
  throw new Error("Operation-evaluation continuity contract did not mint.");
}
const contract = contractResult.contract;

const fissionProgramResult =
  validateAndMintKpExecutableSuccessorMotifProgram({
    draft: {
      schemaVersion: "kp.executable-successor-motif-program.v1",
      programVersion: "1.0.0",
      id: "kp.motif.identity-fission.topology-boundary-fixture.v1",
      kind: "identity-fission",
      allowedRoles: [
        "source-identity",
        "descendant-identity",
        "continuant-context"
      ],
      phases: [
        {
          id: "orient-source-identity",
          effect: "orient",
          requiredRoles: ["source-identity", "continuant-context"]
        },
        {
          id: "branch-identity",
          effect: "branch-identity",
          requiredRoles: ["source-identity", "descendant-identity"]
        },
        {
          id: "establish-descendants",
          effect: "establish-descendants",
          requiredRoles: ["descendant-identity"]
        },
        {
          id: "settle-descendants",
          effect: "settle",
          requiredRoles: ["descendant-identity", "continuant-context"]
        }
      ],
      lineage: {
        identity: "one-source-to-many-exact-descendants",
        descendantCardinality: "two-or-more",
        context: "identity-preserving"
      },
      context: {
        policy: "preserve-unclaimed-context",
        role: "continuant-context"
      },
      accessibility: {
        narration: "semantic-phase-and-role-summary",
        reducedMotion: "native-checkpoints-with-phase-summary"
      },
      rewind: {
        policy: "exact-phase-reversal",
        restores: "source-roles-lineage-and-context"
      },
      continuity: {
        minimumVisibleInk: "motif-specific",
        intentionalVanish: "forbidden",
        endpointSettlement: "exact-native-source-and-target"
      }
    }
  });
assert.equal(fissionProgramResult.status, "verified");
if (fissionProgramResult.status !== "verified") {
  throw new Error("Fission boundary fixture did not mint.");
}
const fissionProgram = fissionProgramResult.program;

function profile(
  id: string,
  browser: KpOperationEvaluationReferencePaintProfile["browser"],
  viewport: KpOperationEvaluationReferencePaintProfile["viewport"],
  overrides: Partial<KpOperationEvaluationReferencePaintProfile> = {}
): KpOperationEvaluationReferencePaintProfile {
  return {
    id,
    browser,
    viewport,
    deviceScaleFactor: 1,
    sampleCount: 101,
    minimumVisibleInkRatio: 0.31,
    maximumNormalizedGeometryDelta: 0.031,
    maximumNormalizedRasterDelta: 0.044,
    phaseFidelityRatio: 1,
    programRoleCoverageRatio: 1,
    certifiedContactCoverageRatio: 1,
    ownerCoverageRatio: 1,
    ambiguousOwnerCount: 0,
    atomicTransferMismatchCount: 0,
    endpointMetricMismatches: [],
    nativeMutationCount: 0,
    ...overrides
  };
}

function recording(
  overrides: {
    readonly structure?: Partial<
      KpOperationEvaluationReferencePaintRecording["structure"]
    >;
    readonly profiles?:
      readonly KpOperationEvaluationReferencePaintProfile[];
    readonly programId?: string;
  } = {}
): KpOperationEvaluationReferencePaintRecording {
  return {
    schemaVersion:
      "kp.operation-evaluation-reference-paint-recording.v1",
    id: "kp.operation-evaluation.reference.one-plus-two.fixture.v1",
    programId: overrides.programId ?? program.id,
    programVersion: program.programVersion,
    structure: {
      materialInputPaintCount: 2,
      catalystPaintCount: 1,
      resultPaintCount: 1,
      sourceTargetSilhouetteDelta: 0.63,
      sourceTargetStyleCompatible: true,
      structuralPaintCompatible: true,
      existingMaterialCarrierAvailable: true,
      ...overrides.structure
    },
    profiles: overrides.profiles ?? [
      profile("chromium.wide.dpr1", "chromium", "wide"),
      profile("chromium.phone.dpr1", "chromium", "phone", {
        minimumVisibleInkRatio: 0.29,
        maximumNormalizedGeometryDelta: 0.036,
        maximumNormalizedRasterDelta: 0.049
      }),
      profile("firefox.wide.dpr1", "firefox", "wide", {
        minimumVisibleInkRatio: 0.3,
        maximumNormalizedRasterDelta: 0.052
      }),
      profile("firefox.phone.dpr1", "firefox", "phone", {
        minimumVisibleInkRatio: 0.28,
        maximumNormalizedGeometryDelta: 0.039,
        maximumNormalizedRasterDelta: 0.056
      }),
      profile("webkit.wide.dpr1", "webkit", "wide", {
        minimumVisibleInkRatio: 0.27,
        maximumNormalizedRasterDelta: 0.058
      }),
      profile("webkit.phone.dpr1", "webkit", "phone", {
        minimumVisibleInkRatio: 0.25,
        maximumNormalizedGeometryDelta: 0.041,
        maximumNormalizedRasterDelta: 0.061
      })
    ],
    semanticAuthority: {
      phaseAndRoleTruth: "executable-program",
      paintMeasurements: "diagnostic-evidence-only"
    }
  };
}

test("many-to-one evaluation selects bounded semantic-contact co-presence", () => {
  const comparison = compareKpOperationEvaluationContinuityTopologies({
    program,
    contract,
    recording: recording()
  });

  assert.equal(
    comparison.selectedTopology,
    "bounded-semantic-contact-co-presence"
  );
  assert.equal(
    comparison.selectedTopology,
    kpOperationEvaluationContinuityTopologyDecision.selectedTopology
  );
  assert.equal(
    kpOperationEvaluationContinuityTopologyDecision.selectionRule,
    "preserve-program-roles-then-minimize-added-paint-owners"
  );
  assert.deepEqual(
    comparison.candidates.map((candidate) => ({
      id: candidate.id,
      status: candidate.status,
      addedPaintOwnerCount: candidate.addedPaintOwnerCount
    })),
    [{
      id: "target-style-reverse-flip",
      status: "ineligible",
      addedPaintOwnerCount: 0
    }, {
      id: "bounded-semantic-contact-co-presence",
      status: "eligible",
      addedPaintOwnerCount: 0
    }, {
      id: "visible-motif-owned-carrier",
      status: "eligible",
      addedPaintOwnerCount: 1
    }]
  );
  assert.equal(Object.isFrozen(comparison), true);
  assert.equal(Object.isFrozen(comparison.candidates), true);
});

test("operation-evaluation comparison rejects another verified motif family", () => {
  const comparison = compareKpOperationEvaluationContinuityTopologies({
    program: fissionProgram,
    contract,
    recording: recording({
      programId: fissionProgram.id
    })
  });

  assert.equal(comparison.selectedTopology, null);
  assert.deepEqual(comparison.candidates, []);
  assert.ok(comparison.diagnostics.some(
    ({ code }) => code === "recording.program.kind"
  ));
});

test("exclusive reverse FLIP cannot erase contributor and catalyst roles", () => {
  const comparison = compareKpOperationEvaluationContinuityTopologies({
    program,
    contract,
    recording: recording()
  });
  const reverseFlip = comparison.candidates[0]!;
  const codes = reverseFlip.diagnostics.map(({ code }) => code);

  assert.equal(reverseFlip.preservesReferenceChoreography, false);
  assert.equal(reverseFlip.programRoleCoverageRatio, 1 / 3);
  assert.equal(reverseFlip.maximumNormalizedRasterDelta, 0.63);
  assert.ok(codes.includes("candidate.lineage-cardinality"));
  assert.ok(codes.includes("candidate.program-role-coverage"));
  assert.ok(codes.includes("candidate.raster-delta"));
});

test("the visible carrier remains a bounded fallback, not the chosen extra owner", () => {
  const comparison = compareKpOperationEvaluationContinuityTopologies({
    program,
    contract,
    recording: recording()
  });
  const coPresence = comparison.candidates[1]!;
  const carrier = comparison.candidates[2]!;

  assert.equal(coPresence.status, "eligible");
  assert.equal(carrier.status, "eligible");
  assert.equal(coPresence.maximumNormalizedRasterDelta,
    carrier.maximumNormalizedRasterDelta);
  assert.equal(coPresence.programRoleCoverageRatio,
    carrier.programRoleCoverageRatio);
  assert.equal(coPresence.addedPaintOwnerCount, 0);
  assert.equal(carrier.addedPaintOwnerCount, 1);
  assert.ok(
    coPresence.estimatedPaintAtomsPerFrame <
      carrier.estimatedPaintAtomsPerFrame
  );
});

test("reverse FLIP remains available for a genuinely one-to-one paint lineage", () => {
  const oneToOne = recording({
    structure: {
      materialInputPaintCount: 1,
      catalystPaintCount: 0,
      resultPaintCount: 1,
      sourceTargetSilhouetteDelta: 0.04
    }
  });
  const comparison = compareKpOperationEvaluationContinuityTopologies({
    program,
    contract,
    recording: oneToOne
  });

  assert.equal(comparison.candidates[0]!.status, "eligible");
  assert.equal(
    comparison.selectedTopology,
    "target-style-reverse-flip"
  );
});

test("uncertified contact and unavailable carrier leave no generic candidate", () => {
  const profiles = recording().profiles.map((item) => ({
    ...item,
    certifiedContactCoverageRatio: 0.75
  }));
  const comparison = compareKpOperationEvaluationContinuityTopologies({
    program,
    contract,
    recording: recording({
      structure: { existingMaterialCarrierAvailable: false },
      profiles
    })
  });

  assert.equal(comparison.selectedTopology, null);
  assert.ok(comparison.candidates[1]!.diagnostics.some(
    ({ code }) => code === "candidate.semantic-contact"
  ));
  assert.ok(comparison.candidates[2]!.diagnostics.some(
    ({ code }) => code === "candidate.carrier-unavailable"
  ));
  assert.equal(
    comparison.diagnostics[0]?.code,
    "comparison.no-generic-candidate"
  );
});

test("measured continuity failures reject every topology generically", () => {
  const profiles = recording().profiles.map((item) => ({
    ...item,
    minimumVisibleInkRatio: 0.1,
    maximumNormalizedGeometryDelta: 0.2,
    maximumNormalizedRasterDelta: 0.3,
    ownerCoverageRatio: 0.9,
    ambiguousOwnerCount: 1,
    atomicTransferMismatchCount: 1,
    endpointMetricMismatches: ["font", "baseline"] as const,
    nativeMutationCount: 1
  }));
  const comparison = compareKpOperationEvaluationContinuityTopologies({
    program,
    contract,
    recording: recording({ profiles })
  });

  assert.equal(comparison.selectedTopology, null);
  for (const candidate of comparison.candidates) {
    const codes = new Set(candidate.diagnostics.map(({ code }) => code));
    for (const code of [
      "candidate.visible-ink-floor",
      "candidate.geometry-delta",
      "candidate.raster-delta",
      "candidate.owner-coverage",
      "candidate.owner-conflict",
      "candidate.owner-transfer",
      "candidate.endpoint-mismatch",
      "candidate.native-mutation"
    ] as const) {
      assert.equal(codes.has(code), true, `${candidate.id}:${code}`);
    }
  }
});

test("program drift, duplicate profiles, and invalid numbers fail before selection", () => {
  const malformed = {
    ...recording({ programId: "kp.executable-program.drift" }),
    profiles: [
      profile("duplicate", "chromium", "wide"),
      profile("duplicate", "chromium", "wide", {
        maximumNormalizedRasterDelta: Number.NaN
      })
    ]
  };
  const comparison = compareKpOperationEvaluationContinuityTopologies({
    program,
    contract,
    recording: malformed
  });
  const codes = comparison.diagnostics.map(({ code }) => code);

  assert.equal(comparison.selectedTopology, null);
  assert.deepEqual(comparison.candidates, []);
  assert.ok(codes.includes("recording.program.mismatch"));
  assert.ok(codes.includes("recording.profile.duplicate"));
  assert.ok(codes.includes("recording.profile.invalid"));
});

test("comparison is permutation deterministic and bounded", () => {
  const original = recording();
  const reversed = {
    ...original,
    profiles: [...original.profiles].reverse()
  };
  const first = compareKpOperationEvaluationContinuityTopologies({
    program,
    contract,
    recording: original
  });
  const second = compareKpOperationEvaluationContinuityTopologies({
    program,
    contract,
    recording: reversed
  });
  assert.deepEqual(second, first);

  const startedAt = performance.now();
  for (let index = 0; index < 5_000; index += 1) {
    compareKpOperationEvaluationContinuityTopologies({
      program,
      contract,
      recording: original
    });
  }
  assert.ok(
    performance.now() - startedAt < 2_000,
    "5,000 pure topology comparisons should remain bounded"
  );
});
