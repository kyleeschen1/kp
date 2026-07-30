import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import test from "node:test";

import {
  compileKpExecutableMotifContinuity,
  isKpExecutableMotifContinuityProgram,
  kpExecutableMotifContinuityCompatibility,
  type KpExecutableMotifContinuityTopology
} from "../src/animation/motifs/executable-motif-continuity-compiler.ts";
import type {
  KpExecutableSuccessorMotifProgramDraft,
  KpVerifiedExecutableSuccessorMotifProgram
} from "../src/animation/motifs/executable-successor-motif-program.ts";
import {
  validateAndMintKpExecutableSuccessorMotifProgram
} from "../src/animation/motifs/executable-successor-motif-program-validator.ts";
import {
  kpPerceptualContinuityEndpointMetrics,
  validateAndMintKpPerceptualContinuityContract,
  type KpVerifiedPerceptualContinuityContract
} from "../src/animation/perceptual-continuity-contract.ts";

function commonFields() {
  return {
    schemaVersion: "kp.executable-successor-motif-program.v1",
    programVersion: "1.0.0",
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
  } as const;
}

function operationDraft(): KpExecutableSuccessorMotifProgramDraft {
  return {
    ...commonFields(),
    id: "kp.motif.operation-evaluation.continuity-compiler-fixture.v1",
    kind: "operation-evaluation",
    allowedRoles: [
      "material-input",
      "causal-catalyst",
      "result-material",
      "continuant-context"
    ],
    phases: [
      {
        id: "orient-contributors",
        effect: "orient",
        requiredRoles: [
          "material-input",
          "causal-catalyst",
          "continuant-context"
        ]
      },
      {
        id: "gather-contributors",
        effect: "converge",
        requiredRoles: ["material-input", "causal-catalyst"]
      },
      {
        id: "recognize-result",
        effect: "recognize-result",
        requiredRoles: [
          "material-input",
          "causal-catalyst",
          "result-material"
        ]
      },
      {
        id: "settle-result",
        effect: "settle",
        requiredRoles: ["result-material", "continuant-context"]
      }
    ],
    lineage: {
      material: "many-inputs-to-one-result",
      catalyst: "participates-without-result-lineage",
      context: "identity-preserving"
    }
  };
}

function fissionDraft(): KpExecutableSuccessorMotifProgramDraft {
  return {
    ...commonFields(),
    id: "kp.motif.identity-fission.continuity-compiler-fixture.v1",
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
    }
  };
}

function fusionDraft(): KpExecutableSuccessorMotifProgramDraft {
  return {
    ...commonFields(),
    id: "kp.motif.identity-fusion.continuity-compiler-fixture.v1",
    kind: "identity-fusion",
    allowedRoles: [
      "contributor-identity",
      "result-identity",
      "continuant-context"
    ],
    phases: [
      {
        id: "orient-contributor-identities",
        effect: "orient",
        requiredRoles: ["contributor-identity", "continuant-context"]
      },
      {
        id: "gather-identities",
        effect: "gather-identities",
        requiredRoles: ["contributor-identity", "result-identity"]
      },
      {
        id: "establish-ancestor",
        effect: "establish-ancestor",
        requiredRoles: ["contributor-identity", "result-identity"]
      },
      {
        id: "settle-ancestor",
        effect: "settle",
        requiredRoles: ["result-identity", "continuant-context"]
      }
    ],
    lineage: {
      identity: "many-contributors-to-one-exact-ancestor",
      contributorCardinality: "two-or-more",
      context: "identity-preserving"
    }
  };
}

function mintProgram(
  draft: KpExecutableSuccessorMotifProgramDraft
): KpVerifiedExecutableSuccessorMotifProgram {
  const result = validateAndMintKpExecutableSuccessorMotifProgram({ draft });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") {
    throw new Error("Executable motif fixture did not mint.");
  }
  return result.program;
}

function mintContract(
  program: KpVerifiedExecutableSuccessorMotifProgram
): KpVerifiedPerceptualContinuityContract {
  const result = validateAndMintKpPerceptualContinuityContract({
    program,
    draft: {
      schemaVersion: "kp.perceptual-continuity-contract.v1",
      id: `kp.perceptual-continuity.${program.kind}.compiler-fixture.v1`,
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
    }
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") {
    throw new Error("Perceptual continuity fixture did not mint.");
  }
  return result.contract;
}

const programs = [
  mintProgram(operationDraft()),
  mintProgram(fissionDraft()),
  mintProgram(fusionDraft())
] as const;
const contracts = programs.map(mintContract);

test("closed compatibility matrix compiles all three motif families", () => {
  programs.forEach((program, index) => {
    const result = compileKpExecutableMotifContinuity({
      program,
      contract: contracts[index]!,
      topology: kpExecutableMotifContinuityCompatibility[program.kind]
    });

    assert.equal(result.status, "compiled");
    if (result.status !== "compiled") return;
    assert.equal(
      isKpExecutableMotifContinuityProgram(result.continuityProgram),
      true
    );
    assert.equal(result.continuityProgram.program, program);
    assert.equal(result.continuityProgram.contract, contracts[index]);
    assert.deepEqual(
      result.continuityProgram.forwardPhases.map(({ phaseId }) => phaseId),
      program.phases.map(({ id }) => id)
    );
    assert.deepEqual(
      result.continuityProgram.forwardPhases.map(({ requiredRoles }) =>
        requiredRoles
      ),
      program.phases.map(({ requiredRoles }) => requiredRoles)
    );
    assert.equal(
      result.continuityProgram.visibility.kind,
      "continuous-visible-ink"
    );
  });
});

test("rewind is the exact phase inverse without obligation drift", () => {
  programs.forEach((program, index) => {
    const result = compileKpExecutableMotifContinuity({
      program,
      contract: contracts[index]!,
      topology: kpExecutableMotifContinuityCompatibility[program.kind]
    });
    assert.equal(result.status, "compiled");
    if (result.status !== "compiled") return;

    assert.deepEqual(
      result.continuityProgram.rewindPhases.map(({ phaseId }) => phaseId),
      [...program.phases].reverse().map(({ id }) => id)
    );
    assert.deepEqual(
      result.continuityProgram.rewindPhases
        .map(({ continuityObligation }) => continuityObligation),
      [...result.continuityProgram.forwardPhases]
        .reverse()
        .map(({ continuityObligation }) => continuityObligation)
    );
    assert.deepEqual(
      result.continuityProgram.rewindPhases
        .map(({ executionOrdinal }) => executionOrdinal),
      [0, 1, 2, 3]
    );
  });
});

test("phase obligations preserve motif-specific causality", () => {
  const expected = [
    [
      "preserve-native-source-and-context",
      "maintain-required-role-ink",
      "co-present-contributors-at-certified-contact",
      "settle-exact-native-target-and-context"
    ],
    [
      "preserve-native-source-and-context",
      "co-present-source-and-descendants",
      "co-present-source-and-descendants",
      "settle-exact-native-target-and-context"
    ],
    [
      "preserve-native-source-and-context",
      "co-present-contributors-and-ancestor",
      "co-present-contributors-and-ancestor",
      "settle-exact-native-target-and-context"
    ]
  ] as const;

  programs.forEach((program, index) => {
    const result = compileKpExecutableMotifContinuity({
      program,
      contract: contracts[index]!,
      topology: kpExecutableMotifContinuityCompatibility[program.kind]
    });
    assert.equal(result.status, "compiled");
    if (result.status !== "compiled") return;
    assert.deepEqual(
      result.continuityProgram.forwardPhases
        .map(({ continuityObligation }) => continuityObligation),
      expected[index]
    );
  });
});

test("cross-family and zero-area topologies fail closed", () => {
  const wrongTopologies: readonly KpExecutableMotifContinuityTopology[] = [
    "identity-preserving-branch-co-presence",
    "identity-preserving-gather-co-presence",
    "bounded-semantic-contact-co-presence"
  ];
  programs.forEach((program, index) => {
    const wrong = compileKpExecutableMotifContinuity({
      program,
      contract: contracts[index]!,
      topology: wrongTopologies[index]!
    });
    assert.equal(wrong.status, "invalid");
    if (wrong.status !== "invalid") return;
    assert.ok(wrong.issues.some(
      ({ code }) => code === "compiler.topology.mismatch"
    ));

    const zeroArea = compileKpExecutableMotifContinuity({
      program,
      contract: contracts[index]!,
      topology: "shared-zero-area-junction"
    });
    assert.equal(zeroArea.status, "invalid");
    if (zeroArea.status !== "invalid") return;
    assert.ok(zeroArea.issues.some(
      ({ code }) => code === "compiler.intentional-vanish.required"
    ));
  });
});

test("program-contract drift and copied authority cannot compile", () => {
  const mismatch = compileKpExecutableMotifContinuity({
    program: programs[1],
    contract: contracts[0]!,
    topology: "identity-preserving-branch-co-presence"
  });
  assert.equal(mismatch.status, "invalid");
  if (mismatch.status === "invalid") {
    assert.ok(mismatch.issues.some(
      ({ code }) => code === "compiler.contract.mismatch"
    ));
  }

  const copiedProgram = structuredClone(programs[0]);
  const copiedContract = structuredClone(contracts[0]!);
  const copiedProgramResult = compileKpExecutableMotifContinuity({
    program: copiedProgram,
    contract: contracts[0]!,
    topology: "bounded-semantic-contact-co-presence"
  });
  const copiedContractResult = compileKpExecutableMotifContinuity({
    program: programs[0],
    contract: copiedContract,
    topology: "bounded-semantic-contact-co-presence"
  });
  assert.equal(copiedProgramResult.status, "invalid");
  assert.equal(copiedContractResult.status, "invalid");
});

test("compilation remains deterministic within a bounded cost", () => {
  const startedAt = performance.now();
  for (let index = 0; index < 5_000; index += 1) {
    const result = compileKpExecutableMotifContinuity({
      program: programs[0],
      contract: contracts[0]!,
      topology: "bounded-semantic-contact-co-presence"
    });
    assert.equal(result.status, "compiled");
  }
  const elapsedMs = performance.now() - startedAt;
  assert.ok(elapsedMs < 1_500, `5,000 compilations took ${elapsedMs}ms`);
});
