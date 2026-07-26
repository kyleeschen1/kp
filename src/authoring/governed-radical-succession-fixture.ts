import {
  createExponentRadicalRewriteAnimationAsset,
  defaultExponentRadicalRewriteFixtureId
} from "../animation/exponent-radical-adapter.ts";
import {
  resolveKpRadicalFragmentSemantics,
  type KpRadicalFragmentSemantics
} from "../semantic/radical-fragment-semantics.ts";
import {
  compileKpGovernedCanonicalConstruction,
  type KpGovernedConstructionSourceAuthority,
  type KpVerifiedGovernedCanonicalConstruction
} from "./governed-canonical-construction-compiler.ts";
import {
  kpGovernedRadicalRevisionId
} from "./governed-exponent-radical-promotion.ts";
import {
  createKpGovernedCanonicalConstructionRequest,
  type KpGovernedCanonicalConstructionRequest
} from "./governed-semantic-request.ts";

export interface KpGovernedRadicalSuccessionFixture {
  readonly id: "fixture.governed.radical-succession.v1";
  readonly predecessorRequestId: "request.governed.radical.rewrite.v1";
  readonly authority: KpGovernedConstructionSourceAuthority;
  readonly request: KpGovernedCanonicalConstructionRequest;
  readonly compilation: KpVerifiedGovernedCanonicalConstruction;
  readonly fragments: KpRadicalFragmentSemantics;
}

export function createKpGovernedRadicalSuccessionFixture():
  KpGovernedRadicalSuccessionFixture {
  const animation = createExponentRadicalRewriteAnimationAsset();
  const operation = animation.transformations.find(
    ({ transformType }) => transformType === "rewritePowerAsRoot"
  );
  if (operation === undefined) {
    throw new Error("Canonical radical animation is missing its rewrite.");
  }
  const operationPacks = [
    { packId: "kp.core", version: "1.0.0" },
    { packId: "kp.algebra", version: "0.1.0" }
  ] as const;
  const authority: KpGovernedConstructionSourceAuthority = {
    sourceId: defaultExponentRadicalRewriteFixtureId,
    revisionId: kpGovernedRadicalRevisionId,
    operationPacks,
    animation
  };
  const objectIds = [
    ...operation.sourceObjectIds,
    ...operation.targetObjectIds
  ];
  const request = createKpGovernedCanonicalConstructionRequest({
    schemaVersion: "kp.governed-semantic-authoring-request.v2",
    id: "request.governed.radical-succession.v2",
    source: {
      kind: "verified-semantic-source",
      sourceId: authority.sourceId,
      revisionId: authority.revisionId,
      operationPacks
    },
    approvedObjectIds: objectIds,
    approvedOperationIds: [operation.id],
    explanationPurpose: {
      kind: "transmit",
      objectIds,
      operationIds: [operation.id]
    },
    detailLevel: "complete",
    compositionIntent: {
      kind: "sequence",
      operationIds: [operation.id]
    }
  });
  return deepFreeze({
    id: "fixture.governed.radical-succession.v1" as const,
    predecessorRequestId:
      "request.governed.radical.rewrite.v1" as const,
    authority,
    request,
    compilation: compileKpGovernedCanonicalConstruction({
      request,
      authority
    }),
    fragments: resolveKpRadicalFragmentSemantics(operation)
  });
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
