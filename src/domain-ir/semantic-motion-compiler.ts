import {
  compileKpSemanticMotionChoreography,
  type KpCompiledSemanticMotionChoreography
} from "./semantic-motion-choreography-compiler.ts";
import type {
  KpSemanticMotionCompilerExplicitStaticV1,
  KpSemanticMotionCompilerHumanReviewV1,
  KpSemanticMotionCompilerRepairRequiredV1,
  KpSemanticMotionCompilerRequestV1
} from "./semantic-motion-compiler-contract.ts";
import {
  validateKpSemanticMotionCorrespondenceAndProvenance
} from "./semantic-motion-correspondence-validator.ts";
import {
  validateKpSemanticMotionEndpointsAndFrontier,
  type KpSemanticMotionSourceAuthorityV1
} from "./semantic-motion-endpoint-validator.ts";
import {
  compileKpSemanticMotionLifecycle
} from "./semantic-motion-lifecycle-ownership.ts";
import {
  compileKpSemanticMotionPrecedence,
  type KpSemanticMotionPrecedenceSpec
} from "./semantic-motion-precedence-compiler.ts";
import {
  resolveKpSemanticMotionRecipe
} from "./semantic-motion-recipe-resolver.ts";
import {
  compileKpSemanticMotionRoleCohorts,
  type KpSemanticMotionOperationStructureContract
} from "./semantic-motion-role-cohort-compiler.ts";

export interface KpCompiledSemanticMotionResult {
  readonly status: "compiled";
  readonly choreography: KpCompiledSemanticMotionChoreography;
}

export type KpSemanticMotionCompileResult =
  | KpCompiledSemanticMotionResult
  | KpSemanticMotionCompilerRepairRequiredV1
  | KpSemanticMotionCompilerExplicitStaticV1
  | KpSemanticMotionCompilerHumanReviewV1;

/**
 * This is the only executable front door: callers provide semantic truth and
 * family contracts, while every authority-bearing validation remains ordered
 * inside the compiler boundary.
 */
export function compileKpSemanticMotion(input: {
  readonly request: KpSemanticMotionCompilerRequestV1;
  readonly source: KpSemanticMotionSourceAuthorityV1;
  readonly structureContract: KpSemanticMotionOperationStructureContract;
  readonly precedenceSpec: KpSemanticMotionPrecedenceSpec;
}): KpSemanticMotionCompileResult {
  const endpoints = validateKpSemanticMotionEndpointsAndFrontier(input);
  if (endpoints.status !== "verified") return endpoints;

  const provenance = validateKpSemanticMotionCorrespondenceAndProvenance({
    request: input.request,
    source: input.source,
    endpointFrontier: endpoints.endpointFrontier
  });
  if (provenance.status !== "verified") return provenance;

  const lifecycle = compileKpSemanticMotionLifecycle({
    request: input.request,
    provenance: provenance.provenance
  });
  if (lifecycle.status !== "verified") return lifecycle;

  const structure = compileKpSemanticMotionRoleCohorts({
    request: input.request,
    lifecycle: lifecycle.lifecycle,
    contract: input.structureContract
  });
  if (structure.status !== "verified") return structure;

  const precedence = compileKpSemanticMotionPrecedence({
    request: input.request,
    structure: structure.structure,
    spec: input.precedenceSpec
  });
  if (precedence.status !== "verified") return precedence;

  const recipe = resolveKpSemanticMotionRecipe(precedence.precedence);
  if (recipe.status !== "resolved") return recipe;

  return Object.freeze({
    status: "compiled" as const,
    choreography: compileKpSemanticMotionChoreography(recipe.resolution)
  });
}
