import {
  createKpHomomorphicFusionChoreography,
  type KpHomomorphicFusionChoreography
} from "./equation-operation-choreography.ts";
import {
  kpCanonicalCompiledLogQuotientOperation
} from "../semantic/log-quotient-transformation-compiler.ts";

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
    connectorRetirementWindow: { start: 0.12, end: 0.15 },
    sourceRetirementWindow: { start: 0.03, end: 0.13 }
  });
}

export const kpCanonicalLogQuotientHomomorphicFusionChoreography =
  createKpCanonicalLogQuotientHomomorphicFusionChoreography();
