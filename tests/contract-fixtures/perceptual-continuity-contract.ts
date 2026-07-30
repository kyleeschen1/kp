import type {
  KpPerceptualContinuityContractDraft,
  KpPerceptualContinuitySample
} from "../../src/animation/perceptual-continuity-contract.ts";

const topology: KpPerceptualContinuityContractDraft = {
  schemaVersion: "kp.perceptual-continuity-contract.v1",
  id: "contract.invalid-topology",
  programId: "program.test",
  programVersion: "1.0.0",
  programKind: "operation-evaluation",
  visibility: {
    kind: "continuous-visible-ink",
    minimumVisibleInkRatio: 0.2
  },
  adjacentFrameBudgets: {
    maximumNormalizedGeometryDelta: 0.1,
    maximumNormalizedRasterDelta: 0.1
  },
  ownerCoverage: {
    requiredCoverageRatio: 1,
    maximumAmbiguousOwnerCount: 0,
    maximumAtomicTransferMismatchCount: 0
  },
  endpointEquivalence: {
    settlement: "exact-native-source-and-target",
    requiredMetrics: [
      "paint-geometry",
      "computed-style",
      "font",
      "baseline",
      "inner-paint",
      "structural-rule",
      "silhouette"
    ]
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
  },
  // @ts-expect-error Contracts constrain evidence but cannot choose topology.
  transferTopology: "shared-zero-area-junction"
};

const sample: KpPerceptualContinuitySample = {
  progress: 0.5,
  phaseId: "recognize-result",
  visibleInkRatio: 0.4,
  normalizedGeometryDeltaFromPrevious: 0.02,
  normalizedRasterDeltaFromPrevious: 0.03,
  ownerCoverageRatio: 1,
  ambiguousOwnerCount: 0,
  atomicTransferMismatchCount: 0,
  endpoint: "none",
  endpointMetricMismatches: [],
  // @ts-expect-error Raw raster history is evidence-provider state, not a sample.
  pixelHistory: [0, 1]
};

void [topology, sample];
