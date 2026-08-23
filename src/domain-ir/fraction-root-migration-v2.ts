import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import type { KpAssetSelector, KpSemanticAssetObject } from
  "../semantic/asset.ts";
import type { CorrespondenceMap } from "../semantic/correspondence.ts";
import {
  compileKpEquationAssetMigrationV2,
  type KpEquationAssetMigrationOperationV2,
  type KpEquationAssetMigrationV2
} from "./equation-asset-migration-v2.ts";

type Context = Readonly<{
  animation: KpAnimationAsset;
  transformation: KpSemanticTransformation;
  sourceObjects: readonly KpSemanticAssetObject[];
  targetObjects: readonly KpSemanticAssetObject[];
  sourceSelectors: readonly KpAssetSelector[];
  targetSelectors: readonly KpAssetSelector[];
}>;

interface Protocol {
  readonly operationId: string;
  readonly semanticClass: "evaluation" | "transformation";
  readonly bindRoles: (context: Context) =>
    Readonly<Record<string, readonly string[]>>;
}

const protocols = new Map<string, Protocol>([
  entry("scaleFractionEquivalently",
    "kp.algebra.scale-fraction-equivalently", "transformation",
    bindFractionEquivalence),
  entry("introduceUnitFactor", "kp.algebra.introduce-unit-factor",
    "transformation", bindUnitIntroduction),
  entry("alignCommonDenominator", "kp.algebra.align-common-denominator",
    "transformation", bindCommonDenominator),
  entry("simplifyConstantProduct", "kp.arithmetic.multiply", "evaluation",
    bindWholeExpressionEvaluation),
  entry("splitFractionFactors", "kp.algebra.split-fraction-factors",
    "transformation", bindFractionSplit),
  entry("mergeFractionCommonFactor",
    "kp.algebra.merge-fraction-common-factor", "transformation",
    bindFractionMerge),
  entry("simplifyUnitFractionFactor",
    "kp.algebra.simplify-unit-fraction-factor", "evaluation",
    bindUnitFractionSimplification),
  entry("rewritePowerAsRoot", "kp.algebra.rewrite-power-as-root",
    "transformation", bindPowerAsRoot),
  entry("operation.equation.apply-inverse-power.v1",
    "operation.equation.apply-inverse-power.v1", "transformation",
    bindInversePower),
  entry("operation.arithmetic.evaluate-real-root.v1",
    "operation.arithmetic.evaluate-real-root.v1", "evaluation",
    bindRealRootEvaluation),
  entry("compound-carrier-normalization",
    "operation.root.compound-carrier-normalization", "transformation",
    bindCompoundCarrier)
]);

export function compileKpFractionRootMigrationV2(
  animation: KpAnimationAsset
): KpEquationAssetMigrationV2 {
  const operations = animation.transformations.map((transformation) => {
    const protocol = protocols.get(transformation.transformType);
    if (protocol === undefined) {
      throw new Error(
        `${animation.id} has unsupported fraction/root operation ` +
        transformation.transformType
      );
    }
    const sourceObjects = objectsFor(animation,
      transformation.sourceObjectIds);
    const targetObjects = objectsFor(animation,
      transformation.targetObjectIds);
    const context = Object.freeze({
      animation,
      transformation,
      sourceObjects,
      targetObjects,
      sourceSelectors: sourceObjects.flatMap(({ selectors }) => selectors),
      targetSelectors: targetObjects.flatMap(({ selectors }) => selectors)
    });
    return Object.freeze({
      transformationId: transformation.id,
      operationId: protocol.operationId,
      semanticClass: protocol.semanticClass,
      roleBindings: protocol.bindRoles(context),
      projectionIntent: "replacement" as const,
      correspondenceMap: transformation.correspondenceMap ??
        deriveCompatibilityCorrespondence(context)
    } satisfies KpEquationAssetMigrationOperationV2);
  });
  return compileKpEquationAssetMigrationV2({ animation, operations });
}

function bindFractionEquivalence(context: Context) {
  const sourceFraction = context.sourceObjects.find(({ objectType }) =>
    objectType === "equation");
  const factor = context.sourceObjects.find(({ objectType }) =>
    objectType === "parameter");
  return frozenBindings({
    "fraction-before": requiredIds(sourceFraction?.id),
    "scale-factor": requiredIds(factor?.id),
    "fraction-after": context.transformation.targetObjectIds,
    "scale-factor-copies": relationIds(context, "fan-out", "target")
  });
}

function bindUnitIntroduction(context: Context) {
  return frozenBindings({
    "expression-before": context.transformation.sourceObjectIds,
    "expression-after": context.transformation.targetObjectIds,
    "unit-factor-after": context.transformation.targetObjectIds
  });
}

function bindCommonDenominator(context: Context) {
  return frozenBindings({
    "staged-expression": context.transformation.sourceObjectIds,
    "aligned-expression": context.transformation.targetObjectIds
  });
}

function bindWholeExpressionEvaluation(context: Context) {
  return frozenBindings({
    "operands-before": context.sourceSelectors.map(({ id }) => id),
    "result-after": context.transformation.targetObjectIds
  });
}

function bindFractionSplit(context: Context) {
  return frozenBindings({
    "fraction-before": context.transformation.sourceObjectIds,
    "factors-after": relationIds(context, "fan-out", "target"),
    "fraction-structure-after": idsOfKind(context.targetSelectors, "artifact")
  });
}

function bindFractionMerge(context: Context) {
  return frozenBindings({
    "factors-before": idsOfKind(context.sourceSelectors, "term"),
    "common-factor-after": context.transformation.targetObjectIds,
    "fraction-after": context.transformation.targetObjectIds
  });
}

function bindUnitFractionSimplification(context: Context) {
  return frozenBindings({
    "fraction-before": context.transformation.sourceObjectIds,
    "unit-factor": context.transformation.sourceObjectIds,
    "fraction-after": context.transformation.targetObjectIds
  });
}

function bindPowerAsRoot(context: Context) {
  const base = relationIds(context, "role-change", "source").slice(0, 1);
  const radicand = relationIds(context, "role-change", "target").slice(0, 1);
  return frozenBindings({
    "base-before": base,
    "exponent-fragments": context.sourceSelectors
      .map(({ id }) => id).filter((id) => !base.includes(id)),
    "radicand-after": radicand,
    "radical-fragments": context.targetSelectors
      .map(({ id }) => id).filter((id) => !radicand.includes(id))
  });
}

function bindInversePower(context: Context) {
  return frozenBindings({
    "equation-before": context.transformation.sourceObjectIds,
    "exponent-before": idsOfKind(context.sourceSelectors, "exponent"),
    "equation-after": context.transformation.targetObjectIds,
    "root-index-after": idsOfKind(context.targetSelectors, "root-index"),
    "branches-after": context.targetSelectors.filter(({ kind }) =>
      kind === "operator" || kind === "root-expression")
      .map(({ id }) => id)
  });
}

function bindRealRootEvaluation(context: Context) {
  return frozenBindings({
    "operands-before": idsOfKind(context.sourceSelectors, "root-expression"),
    "result-after": idsOfKind(context.targetSelectors, "value")
  });
}

function bindCompoundCarrier(context: Context) {
  return frozenBindings({
    "carrier-before": idsOfKind(context.sourceSelectors, "carrier"),
    "root-shell-before": context.sourceSelectors.filter(({ kind }) =>
      ["radical", "enclosure", "exponent"].includes(kind))
      .map(({ id }) => id),
    "carrier-after": idsOfKind(context.targetSelectors, "carrier"),
    "absolute-shell-after": context.targetSelectors.filter(({ kind }) =>
      kind === "enclosure-leading" || kind === "enclosure-trailing")
      .map(({ id }) => id)
  });
}

function deriveCompatibilityCorrespondence(context: Context):
CorrespondenceMap {
  const legacy = context.transformation.correspondence ?? [];
  if (legacy.length > 0) {
    const pairedSource = new Set(legacy.map(({ sourceSelectorId }) =>
      sourceSelectorId));
    const pairedTarget = new Set(legacy.map(({ targetSelectorId }) =>
      targetSelectorId));
    return Object.freeze({
      id: `correspondence.${context.transformation.id}.migration-v2`,
      records: Object.freeze([
        ...legacy.map((pair, index) => Object.freeze({
          id: `legacy-pair-${index + 1}`,
          relation: pair.preserves.includes("identity")
            ? "identity" as const
            : "role-change" as const,
          sourceSelectorIds: Object.freeze([pair.sourceSelectorId]),
          targetSelectorIds: Object.freeze([pair.targetSelectorId]),
          summary: "Preserve the authored semantic occurrence pair."
        })),
        lifecycle("unpaired-source", "removal", context.sourceSelectors
          .map(({ id }) => id).filter((id) => !pairedSource.has(id)), []),
        lifecycle("unpaired-target", "introduction", [],
          context.targetSelectors.map(({ id }) => id)
            .filter((id) => !pairedTarget.has(id)))
      ].filter((record) => record.sourceSelectorIds.length > 0 ||
        record.targetSelectorIds.length > 0))
    });
  }
  return Object.freeze({
    id: `correspondence.${context.transformation.id}.object-context-v2`,
    records: Object.freeze([lifecycle(
      "whole-expression-transition",
      context.transformation.transformType === "simplifyConstantProduct"
        ? "fan-in"
        : "role-change",
      context.transformation.transformType === "simplifyConstantProduct"
        ? context.sourceSelectors.map(({ id }) => id)
        : context.transformation.sourceObjectIds,
      context.transformation.targetObjectIds
    )])
  });
}

function entry(
  transformType: string,
  operationId: string,
  semanticClass: Protocol["semanticClass"],
  bindRoles: Protocol["bindRoles"]
): readonly [string, Protocol] {
  return [transformType, Object.freeze({ operationId, semanticClass,
    bindRoles })];
}

function objectsFor(animation: KpAnimationAsset, ids: readonly string[]) {
  return ids.map((id) => {
    const object = animation.bundle.objects.find((entry) => entry.id === id);
    if (object === undefined) throw new Error(`${animation.id} has no ${id}.`);
    return object;
  });
}

function relationIds(
  context: Context,
  relation: string,
  endpoint: "source" | "target"
): readonly string[] {
  return [...new Set((context.transformation.correspondenceMap?.records ?? [])
    .filter((record) => record.relation === relation)
    .flatMap((record) => endpoint === "source"
      ? record.sourceSelectorIds
      : record.targetSelectorIds))];
}

function idsOfKind(selectors: readonly KpAssetSelector[], kind: string) {
  return selectors.filter((selector) => selector.kind === kind)
    .map(({ id }) => id);
}

function requiredIds(id: string | undefined): readonly string[] {
  if (id === undefined) throw new Error("Required semantic object is missing.");
  return Object.freeze([id]);
}

function frozenBindings(
  value: Record<string, readonly string[]>
): Readonly<Record<string, readonly string[]>> {
  return Object.freeze(Object.fromEntries(Object.entries(value).map(
    ([id, ids]) => [id, Object.freeze([...ids])]
  )));
}

function lifecycle(
  id: string,
  relation: "identity" | "role-change" | "fan-in" | "removal" |
    "introduction",
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[]
) {
  return Object.freeze({
    id,
    relation,
    sourceSelectorIds: Object.freeze([...sourceSelectorIds]),
    targetSelectorIds: Object.freeze([...targetSelectorIds]),
    summary: "Migration correspondence derived from authored semantic state."
  });
}
