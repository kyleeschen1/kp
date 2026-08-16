declare const kpEquationMotionVocabularyBrand: unique symbol;

export type KpEquationMotionVocabularyKind =
  | "motif"
  | "recipe"
  | "operation"
  | "renderer-capability"
  | "family";

type KpEquationMotionVocabularyId<
  Kind extends KpEquationMotionVocabularyKind
> = string & { readonly [kpEquationMotionVocabularyBrand]: Kind };

export type KpMotifId = KpEquationMotionVocabularyId<"motif">;
export type KpRecipeId = KpEquationMotionVocabularyId<"recipe">;
export type KpOperationKind = KpEquationMotionVocabularyId<"operation">;
export type KpRendererCapabilityId =
  KpEquationMotionVocabularyId<"renderer-capability">;
export type KpFamilyId = KpEquationMotionVocabularyId<"family">;

const idPatterns = Object.freeze({
  motif: /^motif\.[a-z0-9]+(?:[.-][a-z0-9]+)*\.v[1-9][0-9]*$/,
  recipe: /^recipe\.[a-z0-9]+(?:[.-][a-z0-9]+)*\.v[1-9][0-9]*$/,
  operation: /^operation\.[a-z0-9]+(?:[.-][a-z0-9]+)*\.v[1-9][0-9]*$/,
  "renderer-capability":
    /^renderer-capability\.[a-z0-9]+(?:[.-][a-z0-9]+)*\.v[1-9][0-9]*$/,
  family: /^family\.[a-z0-9]+(?:[.-][a-z0-9]+)*\.v[1-9][0-9]*$/
} as const satisfies Readonly<Record<KpEquationMotionVocabularyKind, RegExp>>);

export function createKpMotifId(value: string): KpMotifId {
  return parseId("motif", value) as KpMotifId;
}

export function createKpRecipeId(value: string): KpRecipeId {
  return parseId("recipe", value) as KpRecipeId;
}

export function createKpOperationKind(value: string): KpOperationKind {
  return parseId("operation", value) as KpOperationKind;
}

export function createKpRendererCapabilityId(
  value: string
): KpRendererCapabilityId {
  return parseId("renderer-capability", value) as KpRendererCapabilityId;
}

export function createKpFamilyId(value: string): KpFamilyId {
  return parseId("family", value) as KpFamilyId;
}

export function isKpMotifId(value: unknown): value is KpMotifId {
  return matchesId("motif", value);
}

export function isKpRecipeId(value: unknown): value is KpRecipeId {
  return matchesId("recipe", value);
}

export function isKpOperationKind(value: unknown): value is KpOperationKind {
  return matchesId("operation", value);
}

export function isKpRendererCapabilityId(
  value: unknown
): value is KpRendererCapabilityId {
  return matchesId("renderer-capability", value);
}

export function isKpFamilyId(value: unknown): value is KpFamilyId {
  return matchesId("family", value);
}

/**
 * These are references, not an exhaustive registry. Packs can declare more
 * canonical IDs without editing this module; registry closure is compiled at
 * build time by the equation pack that opts into them.
 */
export const kpCanonicalEquationMotionVocabulary = Object.freeze({
  motifs: Object.freeze({
    functionWrapV1: createKpMotifId("motif.function-wrap.v1")
  }),
  recipes: Object.freeze({
    functionApplicationV1: createKpRecipeId(
      "recipe.equation.function-application.v1"
    )
  }),
  operations: Object.freeze({
    wrapFunctionV1: createKpOperationKind("operation.wrap-function.v1")
  }),
  rendererCapabilities: Object.freeze({
    nativeKatexV1: createKpRendererCapabilityId(
      "renderer-capability.equation.native-katex.v1"
    )
  }),
  families: Object.freeze({
    structuralWrapV1: createKpFamilyId("family.equation.structural-wrap.v1")
  })
});

function parseId(
  kind: KpEquationMotionVocabularyKind,
  value: string
): string {
  if (!matchesId(kind, value)) {
    throw new Error(
      `Invalid ${kind} id ${JSON.stringify(value)}; expected a lowercase, versioned ${kind}.*.vN identifier.`
    );
  }
  return value;
}

function matchesId(
  kind: KpEquationMotionVocabularyKind,
  value: unknown
): value is string {
  return typeof value === "string" && idPatterns[kind].test(value);
}
