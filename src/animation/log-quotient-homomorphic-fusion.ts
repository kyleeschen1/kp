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

function window(start: number, end: number) {
  return Object.freeze({ start, end });
}

// Quotient owns its fraction and fusion pacing while consuming the same
// causal grammar as product decomposition.
export const kpLogQuotientHomomorphicFusionTiming = Object.freeze({
  id: "timing.log-quotient.homomorphic-fusion.v1" as const,
  sourceEnclosureRelease: window(0.04, 0.12),
  sourceConnectorRelease: window(0.12, 0.18),
  sourceOperatorContraction: window(0.14, 0.24),
  sourceOperatorRelease: window(0.18, 0.28),
  argumentTransfer: window(0.18, 0.48),
  fractionRuleEntry: window(0.48, 0.58),
  targetEnclosureReception: window(0.5, 0.66),
  // Match the approved product rhythm: derived syntax resolves as one late
  // cohort instead of leaving the logarithm operator absent for a new beat.
  targetOperatorPresence: window(0.54, 0.62),
  targetOperatorExpansion: window(0.55, 0.66)
});

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
        entryWindow: kpLogQuotientHomomorphicFusionTiming.fractionRuleEntry
      },
      {
        relationRecordId:
          "correspondence.log-quotient.introduce-target-enclosure",
        entryWindow:
          kpLogQuotientHomomorphicFusionTiming.targetEnclosureReception
      }
    ],
    operatorVisualHandoff: {
      sourceContractionWindow:
        kpLogQuotientHomomorphicFusionTiming.sourceOperatorContraction,
      sourceReleaseWindow:
        kpLogQuotientHomomorphicFusionTiming.sourceOperatorRelease,
      targetPresenceWindow:
        kpLogQuotientHomomorphicFusionTiming.targetOperatorPresence,
      targetExpansionWindow:
        kpLogQuotientHomomorphicFusionTiming.targetOperatorExpansion
    },
    argumentTransferWindow:
      kpLogQuotientHomomorphicFusionTiming.argumentTransfer,
    connectorRetirementWindow:
      kpLogQuotientHomomorphicFusionTiming.sourceConnectorRelease,
    sourceRetirementWindow:
      kpLogQuotientHomomorphicFusionTiming.sourceEnclosureRelease
  });
}

export const kpCanonicalLogQuotientHomomorphicFusionChoreography =
  createKpCanonicalLogQuotientHomomorphicFusionChoreography();
