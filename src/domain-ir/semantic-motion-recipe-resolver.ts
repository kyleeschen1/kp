import {
  createKpSemanticMotionCompilerExplicitStatic,
  createKpSemanticMotionCompilerHumanReview,
  createKpSemanticMotionCompilerRepairRequired
} from "./semantic-motion-compiler-authority.ts";
import type {
  KpSemanticMotionCompilerExplicitStaticV1,
  KpSemanticMotionCompilerHumanReviewV1,
  KpSemanticMotionCompilerRepairRequiredV1
} from "./semantic-motion-compiler-contract.ts";
import {
  isKpVerifiedSemanticMotionPrecedence,
  type KpSemanticMotionEventKind,
  type KpVerifiedSemanticMotionPrecedence
} from "./semantic-motion-precedence-compiler.ts";

export type KpSemanticMotionRecipeCapabilityId =
  | "semantic.clear-source-structure"
  | "semantic.fuse-operator-applications"
  | "semantic.transfer-arguments"
  | "semantic.attach-target-structure"
  | "semantic.reserve-target-members"
  | "semantic.fan-out-factor"
  | "semantic.settle-ordered-products"
  | "semantic.attach-connector"
  | "semantic.establish-inverse-contact"
  | "semantic.retire-inverse-pair"
  | "semantic.compact-survivors"
  | "semantic.settle-native-target";

export type KpSemanticMotionRecipeId =
  | "recipe.semantic-motion.log-quotient-fusion.v1"
  | "recipe.semantic-motion.distribution-fan-out.v1"
  | "recipe.semantic-motion.inverse-cancellation.v1";

interface KpSemanticMotionRecipeDefinition {
  readonly id: KpSemanticMotionRecipeId;
  readonly familyId: string;
  readonly operationId: string;
  readonly roleIds: readonly string[];
  readonly cohortVariants: Readonly<Record<string, string>>;
  readonly eventKinds: readonly KpSemanticMotionEventKind[];
  readonly teachingKinds: readonly ("cause" | "transmit")[];
  readonly capabilityIds: readonly KpSemanticMotionRecipeCapabilityId[];
}

declare const kpSemanticMotionRecipeResolutionAuthority: unique symbol;

export type KpResolvedSemanticMotionRecipe = Readonly<{
  kind: "resolved-semantic-motion-recipe";
  requestId: string;
  recipeId: KpSemanticMotionRecipeId;
  familyId: string;
  capabilityIds: readonly KpSemanticMotionRecipeCapabilityId[];
  precedence: KpVerifiedSemanticMotionPrecedence;
  [kpSemanticMotionRecipeResolutionAuthority]: true;
}>;

export type KpSemanticMotionRecipeResolutionResult =
  | { readonly status: "resolved"; readonly resolution: KpResolvedSemanticMotionRecipe }
  | KpSemanticMotionCompilerRepairRequiredV1
  | KpSemanticMotionCompilerExplicitStaticV1
  | KpSemanticMotionCompilerHumanReviewV1;

const recipeDefinitions: readonly KpSemanticMotionRecipeDefinition[] = Object.freeze([
  recipe({
    id: "recipe.semantic-motion.log-quotient-fusion.v1",
    familyId: "family.semantic-motion.homomorphic-fusion",
    operationId: "kp.semantic-motion.quotient",
    roleIds: ["source-operators", "source-arguments", "target-operator", "target-arguments"],
    cohortVariants: {
      "cohort.quotient.operator-fusion": "log-application-fusion",
      "cohort.quotient.arguments": "quotient-argument-role-change"
    },
    eventKinds: ["orient", "clearance", "departure", "arrival", "attachment", "native-target-ready"],
    teachingKinds: ["cause", "transmit"],
    capabilityIds: [
      "semantic.clear-source-structure",
      "semantic.fuse-operator-applications",
      "semantic.transfer-arguments",
      "semantic.attach-target-structure",
      "semantic.settle-native-target"
    ]
  }),
  recipe({
    id: "recipe.semantic-motion.distribution-fan-out.v1",
    familyId: "family.semantic-motion.distribution",
    operationId: "kp.semantic-motion.distribution",
    roleIds: ["source-factor", "factor-copies", "source-addends", "target-addends", "connector"],
    cohortVariants: {
      "cohort.distribution.factors": "ordered-factor-fan-out",
      "cohort.distribution.addends": "ordered-addend-continuity",
      "cohort.distribution.connector": "connector-axis-local"
    },
    eventKinds: ["orient", "departure", "arrival", "attachment", "settlement", "native-target-ready"],
    teachingKinds: ["cause", "transmit"],
    capabilityIds: [
      "semantic.reserve-target-members",
      "semantic.fan-out-factor",
      "semantic.settle-ordered-products",
      "semantic.attach-connector",
      "semantic.settle-native-target"
    ]
  }),
  recipe({
    id: "recipe.semantic-motion.inverse-cancellation.v1",
    familyId: "family.semantic-motion.cancellation",
    operationId: "kp.semantic-motion.cancellation",
    roleIds: ["inverse-pair", "source-survivors", "target-survivors"],
    cohortVariants: {
      "cohort.cancellation.inverse-pair": "inverse-shared-contact",
      "cohort.cancellation.survivors": "survivor-compaction-local"
    },
    eventKinds: ["orient", "contact", "retirement", "settlement", "native-target-ready"],
    teachingKinds: ["cause", "transmit"],
    capabilityIds: [
      "semantic.establish-inverse-contact",
      "semantic.retire-inverse-pair",
      "semantic.compact-survivors",
      "semantic.settle-native-target"
    ]
  })
]);

const resolvedRecipes = new WeakSet<object>();

export function resolveKpSemanticMotionRecipe(
  precedence: KpVerifiedSemanticMotionPrecedence
): KpSemanticMotionRecipeResolutionResult {
  if (!isKpVerifiedSemanticMotionPrecedence(precedence)) {
    throw new Error("Recipe resolution requires original semantic precedence authority.");
  }
  const request = precedence.structure.lifecycle.provenance.endpointFrontier.request;
  const definition = recipeDefinitions.find(({ operationId }) => operationId === precedence.structure.operationId);
  if (definition === undefined) {
    return createKpSemanticMotionCompilerExplicitStatic({
      requestId: request.id,
      reason: "unsupported-operation",
      staticStateId: request.targetState.id,
      issues: [{
        code: "semantic-motion.recipe.unsupported-operation",
        path: "$.operation.operationId",
        message: `No approved semantic-motion recipe supports ${request.operation.operationId}.`
      }]
    });
  }
  const issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][] = [];
  requireExactSet(Object.keys(precedence.structure.roleBindings), definition.roleIds, "roles", issues);
  requireExactMultiset(precedence.events.map(({ kind }) => kind), definition.eventKinds, "events", issues);
  const actualVariants = Object.fromEntries(precedence.structure.cohorts.map(({ id, cohesion }) => [id, cohesion.variantId]));
  if (!sameRecord(actualVariants, definition.cohortVariants)) {
    issues.push({
      code: "semantic-motion.recipe.cohesion-mismatch",
      path: "$.cohorts",
      message: `Operation ${definition.operationId} does not match the approved family-local cohesion variants.`
    });
  }
  if (issues.length > 0) {
    return createKpSemanticMotionCompilerRepairRequired({
      requestId: request.id,
      issues,
      repairTargets: [{ kind: "operation-binding", targetId: request.operation.stepId }]
    });
  }
  if (!definition.teachingKinds.includes(request.teachingIntent.kind as "cause" | "transmit")) {
    return createKpSemanticMotionCompilerHumanReview({
      requestId: request.id,
      reason: "unreviewed-recipe",
      reviewTargetIds: [definition.id, request.operation.stepId],
      issues: [{
        code: "semantic-motion.recipe.teaching-intent",
        path: "$.teachingIntent.kind",
        message: `Recipe ${definition.id} is not reviewed for ${request.teachingIntent.kind} intent.`
      }]
    });
  }
  const resolution = Object.freeze({
    kind: "resolved-semantic-motion-recipe" as const,
    requestId: request.id,
    recipeId: definition.id,
    familyId: definition.familyId,
    capabilityIds: definition.capabilityIds,
    precedence
  }) as KpResolvedSemanticMotionRecipe;
  resolvedRecipes.add(resolution);
  return { status: "resolved", resolution };
}

export function isKpResolvedSemanticMotionRecipe(value: unknown): value is KpResolvedSemanticMotionRecipe {
  return typeof value === "object" && value !== null && resolvedRecipes.has(value);
}

export function kpSemanticMotionRecipeCapabilityMatrix(): readonly Readonly<{
  recipeId: KpSemanticMotionRecipeId;
  familyId: string;
  operationId: string;
  capabilityIds: readonly KpSemanticMotionRecipeCapabilityId[];
}>[] {
  return Object.freeze(recipeDefinitions.map(({ id, familyId, operationId, capabilityIds }) => Object.freeze({
    recipeId: id,
    familyId,
    operationId,
    capabilityIds
  })));
}

function recipe(definition: KpSemanticMotionRecipeDefinition): KpSemanticMotionRecipeDefinition {
  return Object.freeze({
    ...definition,
    roleIds: Object.freeze([...definition.roleIds]),
    cohortVariants: Object.freeze({ ...definition.cohortVariants }),
    eventKinds: Object.freeze([...definition.eventKinds]),
    teachingKinds: Object.freeze([...definition.teachingKinds]),
    capabilityIds: Object.freeze([...definition.capabilityIds])
  });
}

function requireExactSet(
  actual: readonly string[],
  expected: readonly string[],
  field: "roles",
  issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][]
): void {
  if (actual.length !== expected.length || new Set(actual).size !== actual.length || actual.some((value) => !expected.includes(value))) {
    issues.push({
      code: `semantic-motion.recipe.${field}-mismatch`,
      path: `$.${field}`,
      message: `Recipe resolution requires the exact approved ${field} set.`
    });
  }
}

function requireExactMultiset(
  actual: readonly string[],
  expected: readonly string[],
  field: "events",
  issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][]
): void {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  if (actualSorted.length !== expectedSorted.length || actualSorted.some((value, index) => value !== expectedSorted[index])) {
    issues.push({
      code: `semantic-motion.recipe.${field}-mismatch`,
      path: `$.${field}`,
      message: `Recipe resolution requires the exact approved ${field} multiset.`
    });
  }
}

function sameRecord(left: Readonly<Record<string, string>>, right: Readonly<Record<string, string>>): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length && leftKeys.every((key) => left[key] === right[key]);
}
