import {
  createKpHomomorphicFusionChoreography,
  type KpHomomorphicFusionChoreography
} from "./equation-operation-choreography.ts";
import {
  kpCanonicalCompiledLogQuotientOperation
} from "../semantic/log-quotient-transformation-compiler.ts";
import {
  compileKpFunctionWrapInvocationGroup
} from "./function-wrap-invocation.ts";

export const kpCanonicalLogQuotientFunctionWrapInvocationGroup =
  compileKpFunctionWrapInvocationGroup({
    id: kpCanonicalCompiledLogQuotientOperation.transformation.id,
    branches: [{
      id: "function-wrap-branch.log-quotient.target",
      semanticObjectId: "semantic.log-quotient.wrapper.fused",
      sourceArgumentEntityIds: [
        "source.left.argument.x",
        "source.right.argument.y"
      ],
      targetArgumentEntityIds: [
        "target.numerator.x",
        "target.denominator.y"
      ],
      functionEntityIds: ["target.log", "target.log.operator"],
      enclosureEntityRoles: [
        { entityId: "target.log.open", side: "leading" },
        { entityId: "target.log.close", side: "trailing" }
      ]
    }]
  });

/**
 * Binds the quotient-law exemplar to the provisional homomorphic-fusion
 * grammar. The grammar can be pressure-tested by later linear-map and
 * differential-operator callers without making this timing a global law.
 */
export function createKpCanonicalLogQuotientHomomorphicFusionChoreography(
  direction: "forward" | "rewind" = "forward"
): KpHomomorphicFusionChoreography {
  return createKpHomomorphicFusionChoreography({
    transformation:
      kpCanonicalCompiledLogQuotientOperation.transformation,
    direction,
    targetFunctionWrap:
      kpCanonicalLogQuotientFunctionWrapInvocationGroup,
    operatorApplicationFusionRecordId:
      "correspondence.log-quotient.application-fusion",
    operatorGlyphFusionRecordId:
      "correspondence.log-quotient.operator-fusion",
    argumentTransfers: [
      {
        id: "argument.left-to-numerator",
        role: "left",
        relationRecordId: "correspondence.log-quotient.x-to-numerator",
        route: "arc-above"
      },
      {
        id: "argument.right-to-denominator",
        role: "right",
        relationRecordId: "correspondence.log-quotient.y-to-denominator",
        route: "arc-below"
      }
    ],
    connectorDerivationRecordId:
      "correspondence.log-quotient.difference-derives-quotient",
    forbiddenConnectorIdentityPairs: [{
      sourceEntityId: "source.subtract",
      targetEntityId: "target.quotient.bar"
    }],
    sourceEnclosureRetirementRecordId:
      "correspondence.log-quotient.retire-source-enclosures",
    targetStructureEntries: [
      {
        relationRecordId:
          "correspondence.log-quotient.introduce-fraction-bar",
        entryWindow: { start: 0.72, end: 0.86 }
      },
      {
        relationRecordId:
          "correspondence.log-quotient.introduce-target-enclosure",
        entryWindow: { start: 0.78, end: 0.94 }
      }
    ],
    operatorFusionWindow: { start: 0.18, end: 0.7 },
    argumentTransferWindow: { start: 0.16, end: 0.7 },
    connectorRetirementWindow: { start: 0.1, end: 0.15 },
    sourceRetirementWindow: { start: 0.03, end: 0.1 }
  });
}

export const kpCanonicalLogQuotientHomomorphicFusionChoreography =
  createKpCanonicalLogQuotientHomomorphicFusionChoreography();
