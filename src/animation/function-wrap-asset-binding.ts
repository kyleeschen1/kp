import type { KpAnimationAsset } from "./asset.ts";
import {
  createKpFunctionWrapEquationExtensionPack,
  kpFunctionWrapEquationExtensionPackId
} from "./equation-extension-packs/function-wrap.ts";
import { kpFunctionWrapMotifSchema } from "./function-wrap-motif.ts";
import {
  compileKpMotifInvocation,
  createKpMotifEntityBinding,
  createKpMotifInvocation,
  type KpCompiledMotifPlan,
  type KpMotifInvocation
} from "../domain-ir/equation-motif-invocation.ts";
import {
  validateKpEquationExtensionPack,
  type KpValidatedEquationExtensionPack
} from "../domain-ir/equation-extension-pack-validator.ts";
import {
  kpCanonicalEquationMotionVocabulary,
  type KpOperationKind,
  type KpRecipeId,
  type KpRendererCapabilityId
} from "../domain-ir/equation-motion-vocabulary.ts";
import type { KpAssetSelector } from "../semantic/asset.ts";

const vocabulary = kpCanonicalEquationMotionVocabulary;

export const kpCanonicalFunctionWrapAssetDeclaration = Object.freeze({
  packId: kpFunctionWrapEquationExtensionPackId,
  operationKind: vocabulary.operations.wrapFunctionV1,
  recipeId: vocabulary.recipes.functionApplicationV1,
  motifId: vocabulary.motifs.functionWrapV1,
  rendererCapabilityId: vocabulary.rendererCapabilities.nativeKatexV1
});

export interface KpFunctionWrapAssetBinding {
  readonly schemaVersion: "kp.function-wrap-asset-binding.v1";
  readonly kind: "function-wrap-asset-binding";
  readonly assetId: string;
  readonly transformationId: string;
  readonly argumentCorrespondenceRecordId: string;
  readonly wrapperCorrespondenceRecordIds: readonly string[];
  readonly sourceArgumentEntityIds: readonly string[];
  readonly targetArgumentEntityIds: readonly string[];
  readonly wrapperEntityIds: readonly string[];
  readonly packId: typeof kpCanonicalFunctionWrapAssetDeclaration.packId;
  readonly operationKind: KpOperationKind;
  readonly recipeId: KpRecipeId;
  readonly rendererCapabilityId: KpRendererCapabilityId;
  readonly invocation: KpMotifInvocation;
  readonly compiledMotifPlan: KpCompiledMotifPlan;
  readonly registryAuthority: KpValidatedEquationExtensionPack;
}

const bindings = new WeakMap<KpAnimationAsset, KpFunctionWrapAssetBinding>();

/**
 * The generated exemplar supplies semantic correspondence and notation roles;
 * this compiler supplies executable motif authority. Keeping that join here
 * prevents either the fixture or renderer from recreating wrap timing.
 */
export function compileAndBindKpFunctionWrapAnimationAsset(
  animation: KpAnimationAsset
): KpFunctionWrapAssetBinding {
  const existing = bindings.get(animation);
  if (existing !== undefined) return existing;

  const packResult = validateKpEquationExtensionPack(
    createKpFunctionWrapEquationExtensionPack()
  );
  if (packResult.status !== "valid") {
    throw new Error(
      `Function-wrap extension pack is invalid: ${packResult.diagnostics[0]?.message ?? "unknown diagnostic"}`
    );
  }
  const transformation = requireOnly(
    animation.transformations.filter(
      ({ transformType }) => transformType === "wrapFunction"
    ),
    `Animation ${animation.id} function-wrap transformation`
  );
  const records = transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error(
      `Function-wrap transformation ${transformation.id} requires correspondence authority.`
    );
  }
  const argumentRecord = requireOnly(
    records.filter(({ relation }) => relation === "role-change"),
    `Function-wrap transformation ${transformation.id} argument role change`
  );
  const wrapperRecords = records.filter(
    ({ relation }) => relation === "introduction"
  );
  if (wrapperRecords.length === 0) {
    throw new Error(
      `Function-wrap transformation ${transformation.id} requires wrapper introduction.`
    );
  }

  const selectorById = new Map(
    animation.bundle.objects.flatMap((object) =>
      object.selectors.map((selector) => [selector.id, selector] as const)
    )
  );
  const targetArgumentSelectors = argumentRecord.targetSelectorIds.map(
    (id) => requireSelector(selectorById, id)
  );
  const wrapperSelectors = wrapperRecords.flatMap(({ targetSelectorIds }) =>
    targetSelectorIds.map((id) => requireSelector(selectorById, id))
  );
  const functionSelectors = wrapperSelectors.filter(
    ({ kind }) => kind === "function"
  );
  const leadingEnclosures = wrapperSelectors.filter(
    (selector) => selector.kind === "delimiter" && isLeadingEnclosure(selector)
  );
  const trailingEnclosures = wrapperSelectors.filter(
    (selector) => selector.kind === "delimiter" && isTrailingEnclosure(selector)
  );
  const classifiedWrapperIds = new Set([
    ...functionSelectors,
    ...leadingEnclosures,
    ...trailingEnclosures
  ].map(({ id }) => id));
  if (
    functionSelectors.length === 0 ||
    leadingEnclosures.length === 0 ||
    trailingEnclosures.length === 0 ||
    classifiedWrapperIds.size !== wrapperSelectors.length
  ) {
    throw new Error(
      `Function-wrap transformation ${transformation.id} must classify every introduced selector as function, leading enclosure, or trailing enclosure.`
    );
  }

  const invocation = createKpMotifInvocation(kpFunctionWrapMotifSchema, {
    id: `invocation.${transformation.id}.function-wrap`,
    motifId: vocabulary.motifs.functionWrapV1,
    operationKind: vocabulary.operations.wrapFunctionV1,
    roleBindings: {
      argument: targetArgumentSelectors.map(entityBinding),
      function: functionSelectors.map(entityBinding),
      "leading-enclosure": leadingEnclosures.map(entityBinding),
      "trailing-enclosure": trailingEnclosures.map(entityBinding)
    }
  });
  const compilation = compileKpMotifInvocation({
    schema: kpFunctionWrapMotifSchema,
    invocation,
    rendererCapabilityIds: [
      vocabulary.rendererCapabilities.nativeKatexV1
    ]
  });
  if (compilation.status !== "compiled") {
    throw new Error(
      `Function-wrap invocation ${invocation.id} is invalid: ${compilation.diagnostics[0]?.message ?? "unknown diagnostic"}`
    );
  }

  const binding = Object.freeze({
    schemaVersion: "kp.function-wrap-asset-binding.v1" as const,
    kind: "function-wrap-asset-binding" as const,
    assetId: animation.id,
    transformationId: transformation.id,
    argumentCorrespondenceRecordId: argumentRecord.id,
    wrapperCorrespondenceRecordIds: Object.freeze(
      wrapperRecords.map(({ id }) => id)
    ),
    sourceArgumentEntityIds: Object.freeze([
      ...argumentRecord.sourceSelectorIds
    ]),
    targetArgumentEntityIds: Object.freeze([
      ...argumentRecord.targetSelectorIds
    ]),
    wrapperEntityIds: Object.freeze(wrapperSelectors.map(({ id }) => id)),
    packId: kpCanonicalFunctionWrapAssetDeclaration.packId,
    operationKind: kpCanonicalFunctionWrapAssetDeclaration.operationKind,
    recipeId: kpCanonicalFunctionWrapAssetDeclaration.recipeId,
    rendererCapabilityId:
      kpCanonicalFunctionWrapAssetDeclaration.rendererCapabilityId,
    invocation,
    compiledMotifPlan: compilation.plan,
    registryAuthority: packResult.validatedPack
  });
  bindings.set(animation, binding);
  return binding;
}

export function requireKpFunctionWrapAssetBinding(
  animation: KpAnimationAsset
): KpFunctionWrapAssetBinding {
  const binding = bindings.get(animation);
  if (binding !== undefined) return binding;
  if (!declaresCanonicalFunctionWrapExtension(animation)) {
    throw new Error(
      `Animation ${animation.id} has no declared canonical function-wrap extension binding.`
    );
  }
  // Catalogue and publication boundaries intentionally copy plain asset data.
  // Recompilation from exact declaration metadata preserves that hostability
  // without a mutable global registry or trust in transform-name heuristics.
  return compileAndBindKpFunctionWrapAnimationAsset(animation);
}

function declaresCanonicalFunctionWrapExtension(
  animation: KpAnimationAsset
): boolean {
  const metadata = animation.metadata;
  return metadata?.["equationExtensionPackId"] ===
      kpCanonicalFunctionWrapAssetDeclaration.packId &&
    metadata["equationOperationKind"] ===
      kpCanonicalFunctionWrapAssetDeclaration.operationKind &&
    metadata["equationRecipeId"] ===
      kpCanonicalFunctionWrapAssetDeclaration.recipeId &&
    metadata["equationMotifId"] ===
      kpCanonicalFunctionWrapAssetDeclaration.motifId &&
    metadata["equationRendererCapabilityId"] ===
      kpCanonicalFunctionWrapAssetDeclaration.rendererCapabilityId;
}

function entityBinding(selector: KpAssetSelector) {
  return createKpMotifEntityBinding({
    entityId: selector.id,
    semanticObjectId: selector.objectId
  });
}

function requireSelector(
  byId: ReadonlyMap<string, KpAssetSelector>,
  id: string
): KpAssetSelector {
  const selector = byId.get(id);
  if (selector === undefined) {
    throw new Error(`Function-wrap correspondence references missing selector ${id}.`);
  }
  return selector;
}

function requireOnly<T>(values: readonly T[], label: string): T {
  if (values.length !== 1) {
    throw new Error(`${label} requires exactly one match; received ${values.length}.`);
  }
  return values[0]!;
}

function isLeadingEnclosure(selector: KpAssetSelector): boolean {
  return selector.label === "(" || selector.label === "[" || selector.label === "\\{";
}

function isTrailingEnclosure(selector: KpAssetSelector): boolean {
  return selector.label === ")" || selector.label === "]" || selector.label === "\\}";
}
