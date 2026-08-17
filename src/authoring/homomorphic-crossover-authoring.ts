import { kpHomomorphicCrossoverCallerDeclarations } from
  "../animation/homomorphic-crossover-caller-declarations.ts";
import type { KpLlmPromotedOperationAuthoringDefinition } from
  "../animation/llm-semantic-motion-operation-authoring.ts";
import { kpCanonicalHomomorphicCausalPhaseGrammar } from
  "../domain-ir/homomorphic-causal-phases.ts";
import type { KpCanonicalOperationRole } from
  "../semantic/canonical-operation.ts";

export const kpHomomorphicCrossoverAuthoringAuthorityId =
  "authoring.equation.log-homomorphism.v1" as const;

export function createKpHomomorphicCrossoverAuthoringOperations():
readonly KpLlmPromotedOperationAuthoringDefinition[] {
  return Object.freeze([
    operation({
      operationId: "kp.semantic-motion.log-product",
      summary:
        "Decompose one logarithm of an ordered product into one logarithm application per persistent factor.",
      transformType: "logProductDecomposition",
      roles: [
        role("source-application", "source", "exactly-one"),
        role("target-applications", "target", "one-or-more"),
        role("source-operator", "source", "exactly-one"),
        role("target-operators", "target", "one-or-more"),
        role("source-arguments", "source", "one-or-more"),
        role("target-arguments", "target", "one-or-more"),
        role("source-shells", "source", "one-or-more", "structural-artifact"),
        role("target-shells", "target", "one-or-more", "structural-artifact"),
        role("source-product", "source", "exactly-one"),
        role("target-sum", "target", "exactly-one"),
        role("connector", "target", "one-or-more", "structural-artifact")
      ],
      canonicalComposition: [
        "kp.core.persist",
        "kp.core.fan-out",
        "kp.core.wrap"
      ],
      allowedLineageRelations: [
        "role-change",
        "fan-out",
        "introduction",
        "artifact"
      ],
      pacing: { kind: "per-descendant", unitRoleId: "target-applications" },
      reverse: {
        validity: "authored-history-only",
        choreographyKind: "fusion",
        causalEmphasis: "junction"
      },
      cost: {
        tokenRoleIds: ["source-arguments", "target-arguments"],
        simultaneousGroupRoleIds: ["target-applications", "connector"],
        fragmentRoleIds: ["source-shells", "target-shells", "connector"],
        shadowPolicy: "optional",
        threeDPolicy: "none"
      },
      semanticAuthorityId: "law.logarithm.product"
    }),
    operation({
      operationId: "kp.semantic-motion.quotient",
      summary:
        "Fuse two logarithm applications into one logarithm whose persistent arguments take numerator and denominator roles.",
      transformType: "logQuotientFusion",
      roles: [
        role("source-operators", "source", "one-or-more"),
        role("source-arguments", "source", "one-or-more"),
        role("target-operator", "target", "exactly-one"),
        role("target-arguments", "target", "one-or-more")
      ],
      canonicalComposition: [
        "kp.core.persist",
        "kp.core.merge",
        "kp.core.wrap"
      ],
      allowedLineageRelations: [
        "role-change",
        "fan-in",
        "removal",
        "introduction"
      ],
      pacing: { kind: "single" },
      reverse: {
        validity: "authored-history-only",
        choreographyKind: "fission",
        causalEmphasis: "junction"
      },
      cost: {
        tokenRoleIds: ["source-arguments", "target-arguments"],
        simultaneousGroupRoleIds: ["source-operators", "target-operator"],
        fragmentRoleIds: ["source-operators", "target-operator"],
        shadowPolicy: "optional",
        threeDPolicy: "none"
      },
      semanticAuthorityId: "law.logarithm.quotient"
    })
  ]);
}

function operation(input: {
  readonly operationId: string;
  readonly summary: string;
  readonly transformType: string;
  readonly roles: readonly KpCanonicalOperationRole[];
  readonly canonicalComposition:
    KpLlmPromotedOperationAuthoringDefinition["canonicalComposition"];
  readonly allowedLineageRelations:
    KpLlmPromotedOperationAuthoringDefinition["allowedLineageRelations"];
  readonly pacing: KpLlmPromotedOperationAuthoringDefinition["pacing"];
  readonly reverse: KpLlmPromotedOperationAuthoringDefinition["reverse"];
  readonly cost: KpLlmPromotedOperationAuthoringDefinition["cost"];
  readonly semanticAuthorityId: string;
}): KpLlmPromotedOperationAuthoringDefinition {
  const callers = kpHomomorphicCrossoverCallerDeclarations.filter(
    ({ semanticMotionOperationId }) =>
      semanticMotionOperationId === input.operationId
  );
  const first = callers[0];
  if (first === undefined) {
    throw new Error(`Homomorphic authoring operation ${input.operationId} has no caller.`);
  }
  return Object.freeze({
    operationId: input.operationId,
    operationPack: Object.freeze({
      packId: "equation-pack.homomorphic-crossover",
      version: "1.0.0"
    }),
    summary: input.summary,
    transformType: input.transformType,
    canonicalComposition: Object.freeze([...input.canonicalComposition]),
    roles: Object.freeze(input.roles.map((value) => Object.freeze({ ...value }))),
    allowedLineageRelations: Object.freeze([
      ...input.allowedLineageRelations
    ]),
    ownershipMode: "fission-fusion" as const,
    pacing: Object.freeze({ ...input.pacing }),
    reverse: Object.freeze({ ...input.reverse }),
    cost: Object.freeze({
      ...input.cost,
      tokenRoleIds: Object.freeze([...input.cost.tokenRoleIds]),
      simultaneousGroupRoleIds: Object.freeze([
        ...input.cost.simultaneousGroupRoleIds
      ]),
      fragmentRoleIds: Object.freeze([...input.cost.fragmentRoleIds])
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
      operationKind: first.operationKind,
      recipeId: first.recipeId,
      semanticAuthorityIds: Object.freeze([input.semanticAuthorityId]),
      callerIds: Object.freeze(callers.map(({ callerId }) => callerId))
    })
  });
}

function role(
  id: string,
  endpoint: "source" | "target",
  cardinality: "exactly-one" | "one-or-more",
  kind: "semantic-entity" | "structural-artifact" = "semantic-entity"
): KpCanonicalOperationRole {
  return Object.freeze({
    id,
    endpoint,
    kind,
    cardinality,
    summary: `${endpoint} ${kind} role ${id}`
  });
}
