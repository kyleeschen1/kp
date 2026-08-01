import type {
  KpExecutableSuccessorMotifProgramKind
} from "./motifs/executable-successor-motif-program.ts";
import {
  type KpPerceptualContinuityEndpointMetric
} from "./perceptual-continuity-metrics.ts";

export {
  kpPerceptualContinuityEndpointMetrics
} from "./perceptual-continuity-metrics.ts";
export type {
  KpPerceptualContinuityEndpointMetric
} from "./perceptual-continuity-metrics.ts";

const kpPerceptualContinuityContractAuthority = Symbol(
  "kp.perceptual-continuity-contract"
);
const verifiedContracts = new WeakSet<object>();

export type KpPerceptualContinuityDirection = "forward" | "rewind";
export type KpPerceptualContinuitySamplingMode =
  | "direct-seek"
  | "natural-playback"
  | "replay";
export type KpPerceptualContinuityBrowser =
  | "chromium"
  | "firefox"
  | "webkit";
export type KpPerceptualContinuityViewport = "wide" | "phone";

export type KpPerceptualContinuityVisibilityPolicy =
  | {
      readonly kind: "continuous-visible-ink";
      readonly minimumVisibleInkRatio: number;
    }
  | {
      readonly kind: "intentional-vanish";
      readonly minimumVisibleInkRatio: number;
      readonly authorizedPhaseId: string;
    };

export interface KpPerceptualContinuityContractDraft {
  readonly schemaVersion: "kp.perceptual-continuity-contract.v1";
  readonly id: string;
  readonly programId: string;
  readonly programVersion: string;
  readonly programKind: KpExecutableSuccessorMotifProgramKind;
  readonly visibility: KpPerceptualContinuityVisibilityPolicy;
  readonly adjacentFrameBudgets: {
    readonly maximumNormalizedGeometryDelta: number;
    readonly maximumNormalizedRasterDelta: number;
  };
  readonly ownerCoverage: {
    readonly requiredCoverageRatio: 1;
    readonly maximumAmbiguousOwnerCount: 0;
    readonly maximumAtomicTransferMismatchCount: 0;
  };
  readonly endpointEquivalence: {
    readonly settlement: "exact-native-source-and-target";
    readonly requiredMetrics:
      readonly KpPerceptualContinuityEndpointMetric[];
  };
  readonly invariance: {
    readonly directions: readonly KpPerceptualContinuityDirection[];
    readonly samplingModes: readonly KpPerceptualContinuitySamplingMode[];
    readonly browsers: readonly KpPerceptualContinuityBrowser[];
    readonly viewports: readonly KpPerceptualContinuityViewport[];
    readonly deviceScaleFactors: readonly number[];
  };
  readonly evidenceBudget: {
    readonly maximumTraceCount: number;
    readonly maximumSamplesPerTrace: number;
    readonly maximumTotalSamples: number;
  };
  readonly semanticAuthority: {
    readonly identity: "program-roles-and-lineage";
    readonly measurements: "current-frame-observation-only";
    readonly rasterHistory: "never-semantic-authority";
  };
}

export interface KpVerifiedPerceptualContinuityContract extends
KpPerceptualContinuityContractDraft {
  readonly phaseIds: readonly string[];
  readonly [kpPerceptualContinuityContractAuthority]: true;
}

/**
 * Registers a fully frozen contract after exhaustive validation or closed
 * canonical construction. Architecture checks keep this nominal mint out of
 * ordinary authoring and reader code.
 */
export function registerKpVerifiedPerceptualContinuityContractAuthority(
  input: KpPerceptualContinuityContractDraft & {
    readonly phaseIds: readonly string[];
  }
): KpVerifiedPerceptualContinuityContract {
  const contract = Object.freeze({
    ...input,
    [kpPerceptualContinuityContractAuthority]: true as const
  }) as KpVerifiedPerceptualContinuityContract;
  verifiedContracts.add(contract);
  return contract;
}

export function isKpVerifiedPerceptualContinuityContract(
  value: unknown
): value is KpVerifiedPerceptualContinuityContract {
  return (
    typeof value === "object" &&
    value !== null &&
    verifiedContracts.has(value)
  );
}
