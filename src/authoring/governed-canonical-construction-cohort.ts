import {
  createKpGovernedExponentAbsorptionFixture
} from "./governed-exponent-absorption-fixture.ts";
import {
  createKpGovernedFractionSplitMergeVariation
} from "./governed-fraction-split-merge-variation.ts";
import {
  createKpGovernedRadicalSuccessionFixture
} from "./governed-radical-succession-fixture.ts";
import type {
  KpGovernedConstructionSourceAuthority,
  KpVerifiedGovernedCanonicalConstruction
} from "./governed-canonical-construction-compiler.ts";
import type {
  KpGovernedCanonicalConstructionRequest
} from "./governed-semantic-request.ts";

export const kpGovernedCanonicalConstructionCohortPolicy = Object.freeze({
  id: "policy.governed-canonical-construction-cohort.v1",
  requestSchemaVersion: "kp.governed-semantic-authoring-request.v2",
  compilationKind: "verified-governed-canonical-construction",
  constructionKind: "canonical-animation-construction",
  rendererSessionKind: "native-katex-renderer-session",
  fixtureSourceFiles: Object.freeze([
    "src/authoring/governed-fraction-split-merge-variation.ts",
    "src/authoring/governed-exponent-absorption-fixture.ts",
    "src/authoring/governed-radical-succession-fixture.ts"
  ]),
  maximumFixtureModules: 3,
  maximumFixtureSourceBytes: 13_000,
  maximumMemberPayloadBytes: 20_000,
  maximumCohortPayloadBytes: 35_000
} as const);

export type KpGovernedCanonicalConstructionCohortMemberId =
  | "fraction-split-merge"
  | "exponent-absorption"
  | "radical-succession";

export interface KpGovernedCanonicalConstructionCohortMember {
  readonly id: KpGovernedCanonicalConstructionCohortMemberId;
  readonly fixtureId: string;
  readonly authority: KpGovernedConstructionSourceAuthority;
  readonly request: KpGovernedCanonicalConstructionRequest;
  readonly compilation: KpVerifiedGovernedCanonicalConstruction;
}

/**
 * This list is the governed construction seam shared by all promoted
 * variations. It deliberately ends before renderer selection so authoring
 * providers cannot acquire presentation authority.
 */
export function createKpGovernedCanonicalConstructionCohort():
  readonly KpGovernedCanonicalConstructionCohortMember[] {
  const fraction = createKpGovernedFractionSplitMergeVariation();
  const exponent = createKpGovernedExponentAbsorptionFixture();
  const radical = createKpGovernedRadicalSuccessionFixture();
  return deepFreeze([
    member("fraction-split-merge", fraction),
    member("exponent-absorption", exponent),
    member("radical-succession", radical)
  ]);
}

function member(
  id: KpGovernedCanonicalConstructionCohortMemberId,
  fixture: {
    readonly id: string;
    readonly authority: KpGovernedConstructionSourceAuthority;
    readonly request: KpGovernedCanonicalConstructionRequest;
    readonly compilation: KpVerifiedGovernedCanonicalConstruction;
  }
): KpGovernedCanonicalConstructionCohortMember {
  return {
    id,
    fixtureId: fixture.id,
    authority: fixture.authority,
    request: fixture.request,
    compilation: fixture.compilation
  };
}

function deepFreeze<T>(value: T): T {
  if (
    value === null ||
    typeof value !== "object" ||
    Object.isFrozen(value)
  ) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}
