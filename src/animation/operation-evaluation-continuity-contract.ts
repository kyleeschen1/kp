import type {
  KpVerifiedExecutableSuccessorMotifProgram
} from "./motifs/executable-successor-motif-program.ts";
import {
  kpPerceptualContinuityEndpointMetrics,
  type KpPerceptualContinuityContractDraft
} from "./perceptual-continuity-contract-authority.ts";

/**
 * The thresholds are runtime data, while topology comparison is authoring
 * machinery. Keeping the draft here lets the canonical artifact retain the
 * approved contract without loading paint-recording diagnostics in readers.
 */
export function createKpOperationEvaluationContinuityContractDraft(
  program: KpVerifiedExecutableSuccessorMotifProgram
): KpPerceptualContinuityContractDraft {
  return Object.freeze({
    schemaVersion: "kp.perceptual-continuity-contract.v1",
    id: "kp.perceptual-continuity.operation-evaluation.v1",
    programId: program.id,
    programVersion: program.programVersion,
    programKind: program.kind,
    visibility: Object.freeze({
      kind: "continuous-visible-ink",
      minimumVisibleInkRatio: 0.18
    }),
    adjacentFrameBudgets: Object.freeze({
      maximumNormalizedGeometryDelta: 0.08,
      maximumNormalizedRasterDelta: 0.1
    }),
    ownerCoverage: Object.freeze({
      requiredCoverageRatio: 1,
      maximumAmbiguousOwnerCount: 0,
      maximumAtomicTransferMismatchCount: 0
    }),
    endpointEquivalence: Object.freeze({
      settlement: "exact-native-source-and-target",
      requiredMetrics: kpPerceptualContinuityEndpointMetrics
    }),
    invariance: Object.freeze({
      directions: Object.freeze(["forward", "rewind"] as const),
      samplingModes: Object.freeze([
        "direct-seek",
        "natural-playback",
        "replay"
      ] as const),
      browsers: Object.freeze([
        "chromium",
        "firefox",
        "webkit"
      ] as const),
      viewports: Object.freeze(["wide", "phone"] as const),
      deviceScaleFactors: Object.freeze([1, 2] as const)
    }),
    evidenceBudget: Object.freeze({
      maximumTraceCount: 72,
      maximumSamplesPerTrace: 257,
      maximumTotalSamples: 18_504
    }),
    semanticAuthority: Object.freeze({
      identity: "program-roles-and-lineage",
      measurements: "current-frame-observation-only",
      rasterHistory: "never-semantic-authority"
    })
  });
}
