import {
  createExponentExpansionAnimationAsset,
  defaultExponentExpansionFixtureId
} from "../animation/exponent-radical-adapter.ts";
import {
  compileKpGovernedCanonicalConstruction,
  type KpGovernedConstructionSourceAuthority,
  type KpVerifiedGovernedCanonicalConstruction
} from "./governed-canonical-construction-compiler.ts";
import {
  kpGovernedExponentRevisionId
} from "./governed-exponent-radical-promotion.ts";
import {
  createKpGovernedCanonicalConstructionRequest,
  type KpGovernedCanonicalConstructionRequest
} from "./governed-semantic-request.ts";

export interface KpGovernedExponentAbsorptionFixture {
  readonly id: "fixture.governed.exponent-absorption.v1";
  readonly predecessorRequestId: "request.governed.exponent.unwrap-unit.v1";
  readonly authority: KpGovernedConstructionSourceAuthority;
  readonly request: KpGovernedCanonicalConstructionRequest;
  readonly compilation: KpVerifiedGovernedCanonicalConstruction;
}

/**
 * Carries the already-governed unit-exponent decision into the v2 canonical
 * construction. The fixture selects verified refs only; elimination behavior
 * remains owned by the shared material and renderer-session compilers.
 */
export function createKpGovernedExponentAbsorptionFixture():
  KpGovernedExponentAbsorptionFixture {
  const animation = createExponentExpansionAnimationAsset();
  const operation = animation.transformations.find(
    ({ transformType }) => transformType === "unwrapUnitExponent"
  );
  if (operation === undefined) {
    throw new Error("Canonical exponent animation is missing unit absorption.");
  }
  const operationPacks = [
    { packId: "kp.core", version: "1.0.0" },
    { packId: "kp.algebra", version: "0.1.0" }
  ] as const;
  const authority: KpGovernedConstructionSourceAuthority = {
    sourceId: defaultExponentExpansionFixtureId,
    revisionId: kpGovernedExponentRevisionId,
    operationPacks,
    animation
  };
  const objectIds = [
    ...operation.sourceObjectIds,
    ...operation.targetObjectIds
  ];
  const request = createKpGovernedCanonicalConstructionRequest({
    schemaVersion: "kp.governed-semantic-authoring-request.v2",
    id: "request.governed.exponent-absorption.v2",
    source: {
      kind: "verified-semantic-source",
      sourceId: authority.sourceId,
      revisionId: authority.revisionId,
      operationPacks
    },
    approvedObjectIds: objectIds,
    approvedOperationIds: [operation.id],
    explanationPurpose: {
      kind: "cause",
      objectIds,
      operationIds: [operation.id]
    },
    detailLevel: "key-steps",
    compositionIntent: {
      kind: "sequence",
      operationIds: [operation.id]
    }
  });
  return deepFreeze({
    id: "fixture.governed.exponent-absorption.v1" as const,
    predecessorRequestId:
      "request.governed.exponent.unwrap-unit.v1" as const,
    authority,
    request,
    compilation: compileKpGovernedCanonicalConstruction({
      request,
      authority
    })
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
