import { kpExponentialHomomorphismCallerDeclarations } from
  "../animation/exponential-homomorphism-caller-declarations.ts";
import type { KpLlmPromotedOperationAuthoringDefinition } from
  "../animation/llm-semantic-motion-operation-authoring.ts";
import { kpCanonicalHomomorphicCausalPhaseGrammar } from
  "../domain-ir/homomorphic-causal-phases.ts";
import type { KpCanonicalOperationRole } from
  "../semantic/canonical-operation.ts";
import type {
  KpExponentialHomomorphismCorrespondenceAuthority,
  KpExponentialOccurrenceRole
} from "../semantic/exponential-homomorphism-correspondence.ts";

export const kpExponentialHomomorphismAuthoringAuthorityId =
  "authoring.equation.exponential-homomorphism.v1" as const;

const operationRoles = Object.freeze([
  role("source-power-application", "source", "exactly-one", "syntax"),
  role("source-base", "source", "exactly-one", "continuant"),
  role("source-exponent-payloads", "source", "one-or-more", "continuant"),
  role("source-superscript-region", "source", "exactly-one", "syntax"),
  role("source-connectors", "source", "one-or-more", "connector"),
  role("target-power-applications", "target", "one-or-more", "syntax"),
  role("target-bases", "target", "one-or-more", "continuant"),
  role("target-exponent-payloads", "target", "one-or-more", "continuant"),
  role("target-superscript-regions", "target", "one-or-more", "syntax"),
  role("target-connectors", "target", "one-or-more", "connector"),
  role("target-combination", "target", "exactly-one", "syntax")
]);

export function createKpExponentialHomomorphismAuthoringOperations():
readonly KpLlmPromotedOperationAuthoringDefinition[] {
  return Object.freeze(kpExponentialHomomorphismCallerDeclarations.map(
    (declaration) => Object.freeze({
      operationId: declaration.operationKind,
      operationPack: Object.freeze({
        packId: "equation-pack.exponential-homomorphism",
        version: "1.0.0"
      }),
      summary: declaration.targetTopology === "lateral-product"
        ? "Distribute a power over an ordered additive exponent into a product of successor powers."
        : "Distribute a power over an ordered subtractive exponent into numerator and denominator successor powers.",
      transformType: declaration.targetTopology === "lateral-product"
        ? "exponentialSumToProduct"
        : "exponentialDifferenceToQuotient",
      canonicalComposition: Object.freeze([
        "kp.core.persist",
        "kp.core.fan-out",
        "kp.core.eliminate",
        "kp.core.introduce"
      ] as const),
      roles: operationRoles,
      allowedLineageRelations: Object.freeze([
        "role-change",
        "fan-out",
        "removal",
        "introduction"
      ] as const),
      ownershipMode: "fission-fusion" as const,
      pacing: Object.freeze({
        kind: "per-descendant" as const,
        unitRoleId: "target-power-applications"
      }),
      reverse: Object.freeze({
        validity: "authored-history-only" as const,
        choreographyKind: "fusion",
        causalEmphasis: "junction"
      }),
      cost: Object.freeze({
        tokenRoleIds: Object.freeze([
          "source-exponent-payloads",
          "target-exponent-payloads"
        ]),
        simultaneousGroupRoleIds: Object.freeze([
          "target-power-applications",
          "target-connectors"
        ]),
        fragmentRoleIds: Object.freeze([
          "source-connectors",
          "target-connectors"
        ]),
        shadowPolicy: "none" as const,
        threeDPolicy: "none" as const
      }),
      explanationDepths: Object.freeze([
        "compact",
        "standard",
        "expanded"
      ] as const),
      visualMotif: "homomorphic-crossover" as const,
      semanticPhaseIds: Object.freeze(
        kpCanonicalHomomorphicCausalPhaseGrammar.phases.map(({ id }) => id)
      ),
      extensionAuthority: Object.freeze({
        operationKind: declaration.operationKind,
        recipeId: declaration.recipeId,
        semanticAuthorityIds: Object.freeze([
          declaration.semanticAuthorityId
        ]),
        callerIds: Object.freeze([declaration.callerId])
      })
    } satisfies KpLlmPromotedOperationAuthoringDefinition)
  ));
}

export function createKpExponentialHomomorphismRoleBindings(
  authority: KpExponentialHomomorphismCorrespondenceAuthority
): Readonly<Record<string, readonly string[]>> {
  return Object.freeze({
    "source-power-application": ids(authority, "source", "power-application"),
    "source-base": ids(authority, "source", "base"),
    "source-exponent-payloads": ids(authority, "source", "exponent-payload"),
    "source-superscript-region": ids(authority, "source", "superscript-region"),
    "source-connectors": ids(authority, "source", "combination-connector"),
    "target-power-applications": ids(authority, "target", "power-application"),
    "target-bases": ids(authority, "target", "base"),
    "target-exponent-payloads": ids(authority, "target", "exponent-payload"),
    "target-superscript-regions": ids(authority, "target", "superscript-region"),
    "target-connectors": ids(authority, "target", "combination-connector"),
    "target-combination": ids(authority, "target", "combination-root")
  });
}

function ids(
  authority: KpExponentialHomomorphismCorrespondenceAuthority,
  endpoint: "source" | "target",
  roleId: KpExponentialOccurrenceRole
): readonly string[] {
  return Object.freeze(authority.occurrences.filter(({ endpoint: side, role }) =>
    side === endpoint && role === roleId
  ).map(({ id }) => id));
}

function role(
  id: string,
  endpoint: "source" | "target",
  cardinality: "exactly-one" | "one-or-more",
  material: "syntax" | "continuant" | "connector"
): KpCanonicalOperationRole {
  return Object.freeze({
    id,
    endpoint,
    cardinality,
    kind: material === "continuant"
      ? "semantic-entity" as const
      : "structural-artifact" as const,
    summary: `${endpoint} ${material} role ${id}`
  });
}
