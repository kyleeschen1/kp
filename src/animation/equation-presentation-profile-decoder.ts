import type { KpAnimationAsset } from "./asset.ts";
import {
  createKpEquationPresentationProfileV1,
  kpEquationBranchPresentationStrategies,
  kpEquationCancellationPresentationRecipes,
  kpEquationContinuantPresentationRecipes,
  kpEquationDepthPresentationRecipes,
  kpEquationMotionPresentationRecipes,
  kpEquationNativeHandoffRecipes,
  kpEquationSuccessorPresentationRecipes,
  kpEquationZeroWitnessPresentationRecipes,
  validateKpEquationPresentationProfileV1,
  type KpEquationContinuantPresentationRecipe,
  type KpEquationDepthPresentationRecipe,
  type KpEquationMotionPresentationRecipe,
  type KpEquationNativeHandoffRecipe,
  type KpEquationPresentationProfileV1,
  type KpEquationSuccessorPresentationRecipe,
  type KpEquationZeroWitnessPresentationRecipe
} from "./equation-presentation-profile.ts";
import type {
  KpEquationCancellationPresentationRecipe,
  KpCancellationPresentationResolver
} from "./cancellation-presentation-contract.ts";
import type {
  KpBalancedBranchPresentationStrategy
} from "./equation-balanced-branch-scheduling.ts";
import {
  inferKpCancellationPresentationIntent,
  kpCancellationOperationIdForTransformType,
  kpCancellationTeachingGoalMetadataKey,
  type KpCancellationTeachingGoal
} from "../semantic/cancellation-presentation-authoring.ts";

export const kpLegacyEquationPresentationMetadataKeys = [
  "equationMotionPresentationRecipe",
  "equationNativeHandoffRecipe",
  "equationCancellationPresentationRecipe",
  "equationZeroWitnessPresentationRecipe",
  "equationSuccessorPresentationRecipe",
  "equationDepthPresentationRecipe",
  "equationContinuantPresentationRecipe",
  "equationBranchPresentationStrategy"
] as const;

export type KpLegacyEquationPresentationMetadataKey =
  typeof kpLegacyEquationPresentationMetadataKeys[number];

export interface KpDecodedLegacyEquationPresentationMetadata {
  readonly presentKeys: readonly KpLegacyEquationPresentationMetadataKey[];
  readonly teachingGoalPresent: boolean;
  readonly motion?: KpEquationMotionPresentationRecipe | undefined;
  readonly nativeHandoff?: KpEquationNativeHandoffRecipe | undefined;
  readonly cancellation?: KpEquationCancellationPresentationRecipe | undefined;
  readonly zeroWitness?: KpEquationZeroWitnessPresentationRecipe | undefined;
  readonly successor?: KpEquationSuccessorPresentationRecipe | undefined;
  readonly depth?: KpEquationDepthPresentationRecipe | undefined;
  readonly continuants?: KpEquationContinuantPresentationRecipe | undefined;
  readonly branchStrategy?: KpBalancedBranchPresentationStrategy | undefined;
  readonly cancellationTeachingGoal?: KpCancellationTeachingGoal | undefined;
}

export interface KpLegacyEquationPresentationMetadataPresence {
  readonly presentKeys: readonly KpLegacyEquationPresentationMetadataKey[];
  readonly teachingGoalPresent: boolean;
}

export type KpEquationPresentationProfileDiagnosticCode =
  | "legacy-value"
  | "authority-conflict"
  | "profile-invalid"
  | "cancellation-authority"
  | "cancellation-resolution";

export interface KpEquationPresentationProfileDiagnostic {
  readonly path: string;
  readonly code: KpEquationPresentationProfileDiagnosticCode;
  readonly message: string;
}

export type KpLegacyEquationPresentationMetadataDecodeResult =
  | {
      readonly status: "accepted";
      readonly value: KpDecodedLegacyEquationPresentationMetadata;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "rejected";
      readonly diagnostics: readonly KpEquationPresentationProfileDiagnostic[];
    };

export type KpEquationPresentationProfileDecodeResult =
  | {
      readonly status: "accepted";
      readonly source: "typed-profile" | "legacy-metadata";
      readonly profile: KpEquationPresentationProfileV1;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "rejected";
      readonly diagnostics: readonly KpEquationPresentationProfileDiagnostic[];
    };

const semanticMaterialDefaults = {
  motion: "semantic-material-v2",
  nativeHandoff: "crossfade-v1",
  cancellation: "witnessed-annihilation-v1",
  zeroWitness: "embedded-v1",
  successor: "successor-synthesis-v1",
  depth: "flat-v1",
  continuants: "concurrent-v1"
} as const;

const continuityDefaults = {
  motion: "continuity-v1",
  nativeHandoff: "crossfade-v1",
  cancellation: "native-handoff-v1",
  zeroWitness: "none",
  successor: "native-handoff-v1",
  depth: "flat-v1",
  continuants: "concurrent-v1"
} as const;

export function decodeKpLegacyEquationPresentationMetadata(
  metadata: Readonly<Record<string, unknown>> | undefined
): KpLegacyEquationPresentationMetadataDecodeResult {
  const diagnostics: KpEquationPresentationProfileDiagnostic[] = [];
  const presence = inspectKpLegacyEquationPresentationMetadataPresence(
    metadata
  );
  const teachingGoalValue = metadata?.[kpCancellationTeachingGoalMetadataKey];
  const value: KpDecodedLegacyEquationPresentationMetadata = {
    ...presence,
    ...readOptional(
      metadata,
      "equationMotionPresentationRecipe",
      "motion",
      kpEquationMotionPresentationRecipes,
      diagnostics
    ),
    ...readOptional(
      metadata,
      "equationNativeHandoffRecipe",
      "nativeHandoff",
      kpEquationNativeHandoffRecipes,
      diagnostics
    ),
    ...readOptional(
      metadata,
      "equationCancellationPresentationRecipe",
      "cancellation",
      kpEquationCancellationPresentationRecipes,
      diagnostics
    ),
    ...readOptional(
      metadata,
      "equationZeroWitnessPresentationRecipe",
      "zeroWitness",
      kpEquationZeroWitnessPresentationRecipes,
      diagnostics
    ),
    ...readOptional(
      metadata,
      "equationSuccessorPresentationRecipe",
      "successor",
      kpEquationSuccessorPresentationRecipes,
      diagnostics
    ),
    ...readOptional(
      metadata,
      "equationDepthPresentationRecipe",
      "depth",
      kpEquationDepthPresentationRecipes,
      diagnostics
    ),
    ...readOptional(
      metadata,
      "equationContinuantPresentationRecipe",
      "continuants",
      kpEquationContinuantPresentationRecipes,
      diagnostics
    ),
    ...readOptional(
      metadata,
      "equationBranchPresentationStrategy",
      "branchStrategy",
      kpEquationBranchPresentationStrategies,
      diagnostics
    ),
    ...readTeachingGoal(teachingGoalValue, diagnostics)
  };

  if (
    value.cancellationTeachingGoal !== undefined &&
    value.cancellation !== undefined
  ) {
    diagnostics.push(diagnostic(
      "$.metadata.equationCancellationPresentationRecipe",
      "authority-conflict",
      "Cancellation authoring cannot combine a teaching goal with a renderer recipe id."
    ));
  }
  return diagnostics.length === 0
    ? {
        status: "accepted",
        value: Object.freeze({
          ...value,
          presentKeys: Object.freeze([...presence.presentKeys])
        }),
        diagnostics: []
      }
    : { status: "rejected", diagnostics: Object.freeze(diagnostics) };
}

export function inspectKpLegacyEquationPresentationMetadataPresence(
  metadata: Readonly<Record<string, unknown>> | undefined
): KpLegacyEquationPresentationMetadataPresence {
  return Object.freeze({
    presentKeys: Object.freeze(
      kpLegacyEquationPresentationMetadataKeys.filter(
        (key) => metadata?.[key] !== undefined
      )
    ),
    teachingGoalPresent:
      metadata?.[kpCancellationTeachingGoalMetadataKey] !== undefined
  });
}

export function requireKpLegacyEquationPresentationMetadata(
  metadata: Readonly<Record<string, unknown>> | undefined
): KpDecodedLegacyEquationPresentationMetadata {
  const result = decodeKpLegacyEquationPresentationMetadata(metadata);
  if (result.status === "rejected") {
    throw new Error(result.diagnostics.map(({ message }) => message).join(" "));
  }
  return result.value;
}

export function decodeKpEquationPresentationProfile(input: {
  readonly animation: KpAnimationAsset;
  readonly authoredProfile?: KpEquationPresentationProfileV1 | undefined;
  readonly resolveCancellation: KpCancellationPresentationResolver;
}): KpEquationPresentationProfileDecodeResult {
  const legacy = decodeKpLegacyEquationPresentationMetadata(
    input.animation.metadata
  );
  if (input.authoredProfile !== undefined) {
    const presence = inspectKpLegacyEquationPresentationMetadataPresence(
      input.animation.metadata
    );
    const authorityPresent =
      presence.presentKeys.length > 0 || presence.teachingGoalPresent;
    if (authorityPresent) {
      return rejected(diagnostic(
        "$.presentationProfile",
        "authority-conflict",
        `Animation ${input.animation.id} cannot combine a typed presentation profile with legacy presentation metadata.`
      ));
    }
    const profileIssues = validateKpEquationPresentationProfileV1(
      input.authoredProfile
    );
    if (profileIssues.length > 0) {
      return {
        status: "rejected",
        diagnostics: Object.freeze(profileIssues.map((candidate) => diagnostic(
          candidate.path,
          "profile-invalid",
          candidate.message
        )))
      };
    }
    return {
      status: "accepted",
      source: "typed-profile",
      profile: input.authoredProfile,
      diagnostics: []
    };
  }
  if (legacy.status === "rejected") return legacy;

  const baseline = legacy.value.motion === "continuity-v1"
    ? continuityDefaults
    : semanticMaterialDefaults;
  const cancellation = resolveCancellationRecipe({
    animation: input.animation,
    metadata: legacy.value,
    fallback: baseline.cancellation,
    resolveCancellation: input.resolveCancellation
  });
  if (cancellation.status === "rejected") return cancellation;

  return {
    status: "accepted",
    source: "legacy-metadata",
    profile: createKpEquationPresentationProfileV1({
      payload: {
        kind: "equation-presentation",
        motion: legacy.value.motion ?? baseline.motion,
        nativeHandoff:
          legacy.value.nativeHandoff ?? baseline.nativeHandoff,
        cancellation: cancellation.recipe,
        zeroWitness: legacy.value.zeroWitness ?? baseline.zeroWitness,
        successor: legacy.value.successor ?? baseline.successor,
        depth: legacy.value.depth ?? baseline.depth,
        continuants: legacy.value.continuants ?? baseline.continuants,
        ...(legacy.value.branchStrategy === undefined
          ? {}
          : { branchStrategy: legacy.value.branchStrategy })
      }
    }),
    diagnostics: []
  };
}

function resolveCancellationRecipe(input: {
  readonly animation: KpAnimationAsset;
  readonly metadata: KpDecodedLegacyEquationPresentationMetadata;
  readonly fallback: KpEquationCancellationPresentationRecipe;
  readonly resolveCancellation: KpCancellationPresentationResolver;
}):
  | { readonly status: "accepted"; readonly recipe: KpEquationCancellationPresentationRecipe }
  | { readonly status: "rejected"; readonly diagnostics: readonly KpEquationPresentationProfileDiagnostic[] } {
  if (input.metadata.cancellationTeachingGoal === undefined) {
    return {
      status: "accepted",
      recipe: input.metadata.cancellation ?? input.fallback
    };
  }
  const operationIds = input.animation.transformations.flatMap(
    (transformation) => {
      const operationId = kpCancellationOperationIdForTransformType(
        transformation.transformType
      );
      return operationId === undefined ? [] : [operationId];
    }
  );
  if (operationIds.length === 0) {
    return rejected(diagnostic(
      "$.metadata.equationCancellationTeachingGoal",
      "cancellation-authority",
      `Animation ${input.animation.id} declares cancellation teaching intent without a cancellation transform.`
    ));
  }
  const recipes: KpEquationCancellationPresentationRecipe[] = [];
  for (const operationId of operationIds) {
    const resolution = input.resolveCancellation({
      intent: inferKpCancellationPresentationIntent({
        operationId,
        teachingGoal: input.metadata.cancellationTeachingGoal
      }),
      topology: { sourceCount: 2, sourceBaselines: "distinct" }
    });
    if (resolution.kind !== "resolved") {
      return rejected(diagnostic(
        "$.metadata.equationCancellationTeachingGoal",
        "cancellation-resolution",
        `Cancellation policy for ${input.animation.id} requires ${resolution.kind}.`
      ));
    }
    recipes.push(resolution.recipe);
  }
  const recipe = recipes[0]!;
  if (recipes.some((candidate) => candidate !== recipe)) {
    return rejected(diagnostic(
      "$.metadata.equationCancellationTeachingGoal",
      "cancellation-resolution",
      `Animation ${input.animation.id} has incompatible cancellation intents.`
    ));
  }
  return { status: "accepted", recipe };
}

function readOptional<
  const TValues extends readonly string[],
  const TOutputKey extends string
>(
  metadata: Readonly<Record<string, unknown>> | undefined,
  metadataKey: KpLegacyEquationPresentationMetadataKey,
  outputKey: TOutputKey,
  allowed: TValues,
  diagnostics: KpEquationPresentationProfileDiagnostic[]
): Partial<Record<TOutputKey, TValues[number]>> {
  const value = metadata?.[metadataKey];
  if (value === undefined) return {};
  if (typeof value === "string" && allowed.includes(value)) {
    return { [outputKey]: value } as Partial<Record<TOutputKey, TValues[number]>>;
  }
  diagnostics.push(diagnostic(
    `$.metadata.${metadataKey}`,
    "legacy-value",
    `Unknown ${metadataKey} recipe ${String(value)}.`
  ));
  return {};
}

function readTeachingGoal(
  value: unknown,
  diagnostics: KpEquationPresentationProfileDiagnostic[]
): { readonly cancellationTeachingGoal?: KpCancellationTeachingGoal | undefined } {
  if (value === undefined) return {};
  if (value === "preserve-flow" || value === "make-identity-visible") {
    return { cancellationTeachingGoal: value };
  }
  diagnostics.push(diagnostic(
    "$.metadata.equationCancellationTeachingGoal",
    "legacy-value",
    `Unknown cancellation teaching goal ${String(value)}.`
  ));
  return {};
}

function rejected(
  value: KpEquationPresentationProfileDiagnostic
): {
  readonly status: "rejected";
  readonly diagnostics: readonly KpEquationPresentationProfileDiagnostic[];
} {
  return { status: "rejected", diagnostics: Object.freeze([value]) };
}

function diagnostic(
  path: string,
  code: KpEquationPresentationProfileDiagnosticCode,
  message: string
): KpEquationPresentationProfileDiagnostic {
  return Object.freeze({ path, code, message });
}
