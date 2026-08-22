import {
  kpHomomorphicCausalPhaseIds,
  type KpHomomorphicCausalPhaseId
} from "../domain-ir/homomorphic-causal-phases.ts";
import {
  kpCanonicalLogProductSemanticMotionRequest
} from "../semantic/log-product-semantic-motion.ts";
import type {
  KpLogProductMaterialRoleId,
  KpLogProductMaterialVerb
} from "./log-product-material-depth-roles.ts";

export interface KpLogProductMaterialPhaseInstruction {
  readonly phaseId: KpHomomorphicCausalPhaseId;
  readonly verb: KpLogProductMaterialVerb;
}

export interface KpLogProductMaterialRoleBinding {
  readonly id: string;
  readonly roleId: KpLogProductMaterialRoleId;
  readonly entityIds: readonly string[];
  readonly phaseInstructions: readonly KpLogProductMaterialPhaseInstruction[];
}

const semanticRoleBindings =
  kpCanonicalLogProductSemanticMotionRequest.operation.roleBindings;

function entities(...roleIds: readonly string[]): readonly string[] {
  return Object.freeze(roleIds.flatMap((roleId) => {
    const entityIds = semanticRoleBindings[roleId];
    if (entityIds === undefined || entityIds.length === 0) {
      throw new Error(`Missing canonical log-product role binding ${roleId}.`);
    }
    return entityIds;
  }));
}

function instruction(
  phaseId: KpHomomorphicCausalPhaseId,
  verb: KpLogProductMaterialVerb
): KpLogProductMaterialPhaseInstruction {
  return Object.freeze({ phaseId, verb });
}

function binding(
  suffix: string,
  roleId: KpLogProductMaterialRoleId,
  entityIds: readonly string[],
  phaseInstructions: readonly KpLogProductMaterialPhaseInstruction[]
): KpLogProductMaterialRoleBinding {
  return Object.freeze({
    id: `binding.material.log-product.${suffix}`,
    roleId,
    entityIds: Object.freeze([...entityIds]),
    phaseInstructions: Object.freeze([...phaseInstructions])
  });
}

// These bindings consume authored semantic roles and causal phases. They never
// infer meaning from rendered glyph equality or document structure.
export const kpCanonicalLogProductMaterialRoleBindings = Object.freeze([
  binding(
    "source-application",
    "role.material.log-product.source-application",
    entities("source-operator", "source-shells"),
    [
      instruction(kpHomomorphicCausalPhaseIds.orient, "activate"),
      instruction(
        kpHomomorphicCausalPhaseIds.releaseSourceSyntax,
        "withdraw"
      )
    ]
  ),
  binding(
    "source-relation",
    "role.material.log-product.source-relation",
    entities("source-product"),
    [
      instruction(kpHomomorphicCausalPhaseIds.orient, "activate"),
      instruction(
        kpHomomorphicCausalPhaseIds.releaseSourceSyntax,
        "release"
      ),
      instruction(kpHomomorphicCausalPhaseIds.transferPayload, "withdraw")
    ]
  ),
  binding(
    "persistent-factors",
    "role.material.log-product.persistent-factor",
    entities("source-arguments", "target-arguments"),
    [
      instruction(
        kpHomomorphicCausalPhaseIds.releaseSourceSyntax,
        "release"
      ),
      instruction(kpHomomorphicCausalPhaseIds.transferPayload, "transport"),
      instruction(kpHomomorphicCausalPhaseIds.settleTarget, "settle")
    ]
  ),
  binding(
    "target-enclosures",
    "role.material.log-product.target-enclosure",
    entities("target-shells"),
    [
      instruction(
        kpHomomorphicCausalPhaseIds.receiveTargetApplications,
        "receive"
      ),
      instruction(kpHomomorphicCausalPhaseIds.settleTarget, "settle")
    ]
  ),
  binding(
    "target-application-syntax",
    "role.material.log-product.target-application-syntax",
    entities("target-operators"),
    [
      instruction(
        kpHomomorphicCausalPhaseIds.receiveTargetApplications,
        "resolve"
      ),
      instruction(kpHomomorphicCausalPhaseIds.settleTarget, "settle")
    ]
  ),
  binding(
    "target-relation",
    "role.material.log-product.target-relation",
    entities("target-sum", "connector"),
    [
      instruction(
        kpHomomorphicCausalPhaseIds.resolveTargetConnector,
        "resolve"
      ),
      instruction(kpHomomorphicCausalPhaseIds.settleTarget, "settle")
    ]
  )
] as const satisfies readonly KpLogProductMaterialRoleBinding[]);

