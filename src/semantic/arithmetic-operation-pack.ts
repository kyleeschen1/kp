import {
  kpCanonicalOperationCorePack,
  createKpCanonicalOperationPack
} from "./canonical-operation-pack.ts";
import {
  createKpCanonicalOperationContract
} from "./canonical-operation-contract.ts";
import type {
  KpCanonicalOperationRegistryEntry
} from "./canonical-operation-registry.ts";
import {
  kpOperationEvaluationAuthorityDescriptors
} from "./operation-evaluation-authority.ts";

export const kpArithmeticOperationPack = createKpCanonicalOperationPack({
  id: "kp.arithmetic",
  scope: "shared-domain",
  version: "1.0.0",
  title: "KP direct arithmetic evaluation operations",
  operationIds: kpOperationEvaluationAuthorityDescriptors.flatMap(
    ({ semanticOperationIds }) => semanticOperationIds.filter((id) =>
      id.startsWith("kp.arithmetic."))
  ),
  dependencies: [{
    packId: kpCanonicalOperationCorePack.id,
    version: kpCanonicalOperationCorePack.version
  }]
});

/**
 * Direct arithmetic keeps its mathematical operation identity even though
 * every result shares the same many-to-one material topology. Treating these
 * operations as a bare `kp.core.merge` would erase the distinction between
 * adding, multiplying, subtracting, and dividing before presentation policy
 * has a chance to select the right evaluation authority.
 */
export const kpArithmeticOperationEntries:
readonly KpCanonicalOperationRegistryEntry[] = Object.freeze(
  kpOperationEvaluationAuthorityDescriptors.flatMap((descriptor) =>
    descriptor.semanticOperationIds
      .filter((id) => id.startsWith("kp.arithmetic."))
      .map((id) => Object.freeze({
        id,
        packId: kpArithmeticOperationPack.id,
        canonicalComposition: Object.freeze(["kp.core.merge"] as const),
        sourceTransformType: descriptor.transformationKind,
        authoringSummary:
          `Evaluate a direct ${arithmeticName(id)} while preserving its exact operation identity.`,
        contract: createKpCanonicalOperationContract({
          authority: {
            kind: "transformation-definition",
            refId: `transform-type.${descriptor.transformationKind}`
          },
          roles: [{
            id: "operands-before",
            endpoint: "source",
            kind: "semantic-entity",
            cardinality: "one-or-more",
            summary: "The operands and operator that contribute to the evaluated result."
          }, {
            id: "result-after",
            endpoint: "target",
            kind: "semantic-entity",
            cardinality: "exactly-one",
            summary: "The single semantic result produced by evaluation."
          }],
          lineageRelationIds: ["fan-in"],
          ownershipMode: "fission-fusion",
          lawIds: [`law.arithmetic.constant-${arithmeticName(id)}`],
          witnessIds: [],
          reverse: {
            kind: "one-way",
            interpretation:
              "Rewind restores the authored operands without claiming a unique arithmetic inverse.",
            validity: "authored-history-only",
            choreography: {
              kind: "decompose-successor",
              causalEmphasis: "predecessor",
              narration:
                "The result separates into the exact operands recorded by this evaluation."
            }
          },
          motifRequirementIds: ["motif.kp.core.merge"],
          pacing: { kind: "single" },
          cost: {
            tokenRoleIds: ["operands-before", "result-after"],
            simultaneousGroupRoleIds: ["operands-before"],
            fragmentRoleIds: [],
            shadowPolicy: "optional",
            threeDPolicy: "optional"
          },
          fixtureIds: [`fixture.${id}`]
        })
      } satisfies KpCanonicalOperationRegistryEntry))
  )
);

function arithmeticName(operationId: string):
"sum" | "product" | "difference" | "quotient" {
  switch (operationId) {
    case "kp.arithmetic.add": return "sum";
    case "kp.arithmetic.multiply": return "product";
    case "kp.arithmetic.subtract": return "difference";
    case "kp.arithmetic.divide": return "quotient";
    default: throw new Error(`Unknown direct arithmetic operation ${operationId}.`);
  }
}
