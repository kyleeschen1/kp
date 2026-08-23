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
import {
  compileKpLinearOperationMigrationV2
} from "./linear-operation-migration-v2.ts";

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
  entry("finiteBinderExpand", "operation.equation.finite-binder-expand.v1",
    bindFiniteBinder),
  entry("multiplyNegativeBothSidesInequality",
    "kp.semantic-motion.multiply-negative-inequality", bindInequality),
  entry("substituteValue", "kp.semantic-motion.substitute-value",
    bindSubstitution),
  entry("applyDerivativeSumRule", "kp.semantic-motion.derivative-sum-rule",
    bindDerivativeSum),
  entry("applyDerivativePowerRulesToTerms",
    "kp.semantic-motion.resolve-derivative-terms", bindDerivativeResolution),
  entry("applyAntiderivativePowerRule",
    "kp.semantic-motion.antiderivative-power-rule", bindAntiderivative),
  entry("simplifyAntiderivativePowerRule",
    "kp.semantic-motion.resolve-antiderivative", bindAntiderivativeResolution),
  entry("computeDotProduct", "kp.semantic-motion.dot-product", bindDotProduct),
  entry("multiplyMatrixVector", "kp.semantic-motion.matrix-vector",
    bindMatrixVector),
  entry("multiplyMatrices", "kp.semantic-motion.matrix-matrix",
    bindMatrixMatrix),
  entry("presentLatexForm", "kp.equation.present-latex-form", bindPresentForm),
  entry("compareDerivativeMatrixForms", "kp.equation.compare-latex-forms",
    bindFormComparison),
  entry("compareFundamentalTheoremForms", "kp.equation.compare-latex-forms",
    bindFormComparison),
  entry("compareFourierTransformPair", "kp.equation.compare-latex-forms",
    bindFormComparison)
]);

const linearComparisonId = "animation.comparison.linear-solve-programming";

export function compileKpTerminalEquationMigrationV2(
  animation: KpAnimationAsset
): KpEquationAssetMigrationV2 {
  if (animation.id === linearComparisonId) {
    return compileKpLinearOperationMigrationV2(projectTransformations(
      animation,
      ({ transformType }) => transformType !== "advanceExecutionTrace"
    ));
  }
  const projected = projectMatrixIntermediates(animation);
  const operations = projected.transformations.map((transformation) => {
    const protocol = protocols.get(transformation.transformType);
    if (protocol === undefined) {
      throw new Error(
        `${animation.id} has unsupported terminal equation operation ` +
        transformation.transformType
      );
    }
    const sourceObjects = objectsFor(projected,
      transformation.sourceObjectIds);
    const targetObjects = objectsFor(projected,
      transformation.targetObjectIds);
    const context: Context = Object.freeze({
      animation: projected,
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
      correspondenceMap: correspondenceFor(context)
    } satisfies KpEquationAssetMigrationOperationV2);
  });
  return compileKpEquationAssetMigrationV2({ animation: projected, operations });
}

function bindFiniteBinder(context: Context) {
  return bindings({
    "operator-before": byKind(context.sourceSelectors, "operator"),
    "binder-before": byKind(context.sourceSelectors, "binder-declaration"),
    "lower-bound-before": byKind(context.sourceSelectors, "lower-bound"),
    "upper-bound-before": byKind(context.sourceSelectors, "upper-bound"),
    "body-before": byKind(context.sourceSelectors, "body-template"),
    "bound-reference-before": byKind(context.sourceSelectors,
      "bound-reference"),
    "instances-after": byKind(context.targetSelectors, "body-instance"),
    "instantiated-references-after": byKind(context.targetSelectors,
      "instantiated-reference"),
    "connectors-after": context.targetSelectors.filter(({ kind }) =>
      kind === "additive-connector" ||
      kind === "implicit-multiplicative-adjacency").map(({ id }) => id)
  });
}

function bindInequality(context: Context) {
  return bindings({
    "sides-before": context.sourceSelectors.filter(({ kind }) =>
      kind !== "relation").map(({ id }) => id),
    "relation-before": byKind(context.sourceSelectors, "relation"),
    "negative-factor": context.targetSelectors.filter(({ id }) =>
      id.includes("multiplier")).map(({ id }) => id),
    "sides-after": context.targetSelectors.filter(({ kind }) =>
      kind !== "relation").map(({ id }) => id),
    "relation-after": byKind(context.targetSelectors, "relation")
  });
}

function bindSubstitution(context: Context) {
  return bindings({
    value: relationIds(context, "fan-out", "source"),
    replaced: relationIds(context, "removal", "source"),
    replacement: relationIds(context, "fan-out", "target")
      .filter((id) => id.includes("replacement"))
  });
}

function bindDerivativeSum(context: Context) {
  return bindings({
    "operator-before": relationIds(context, "fan-out", "source"),
    "addends-before": relationIds(context, "identity", "source")
      .filter((id) => selectorKind(context.sourceSelectors, id) === "term"),
    "operators-after": relationIds(context, "fan-out", "target"),
    "addends-after": relationIds(context, "identity", "target")
      .filter((id) => selectorKind(context.targetSelectors, id) === "term")
  });
}

function bindDerivativeResolution(context: Context) {
  return bindings({
    "terms-before": byKind(context.sourceSelectors, "term"),
    "terms-after": context.targetSelectors.filter(({ kind }) =>
      kind === "term" || kind === "constant").map(({ id }) => id)
  });
}

function bindAntiderivative(context: Context) {
  const fanOutSource = relationIds(context, "fan-out", "source");
  const fanOutTarget = relationIds(context, "fan-out", "target");
  return bindings({
    "base-before": relationIds(context, "identity", "source"),
    "exponent-before": fanOutSource,
    "base-after": relationIds(context, "identity", "target"),
    "successor-exponents": fanOutTarget,
    "quotient-structure": context.targetSelectors.filter(({ id }) =>
      id.includes("numerator-coefficient") ||
      id.includes("denominator-increment")).map(({ id }) => id)
  });
}

function bindAntiderivativeResolution(context: Context) {
  return bindings({
    "construction-before": context.sourceSelectors.map(({ id }) => id),
    "result-after": context.transformation.targetObjectIds.slice(0, 1),
    "integration-constant": byKind(context.targetSelectors, "constant")
  });
}

function bindDotProduct(context: Context) {
  return bindings({
    "left-components": context.sourceSelectors.filter(({ id }) =>
      id.includes("leftVector.component")).map(({ id }) => id),
    "right-components": context.sourceSelectors.filter(({ id }) =>
      id.includes("rightVector.component")).map(({ id }) => id),
    products: intermediateObjectIds(context, ".intermediate.product."),
    "partial-sums": intermediateObjectIds(context, ".intermediate.partial-sum."),
    result: byKind(context.targetSelectors, "scalar")
  });
}

function bindMatrixVector(context: Context) {
  return bindings({
    "matrix-rows": context.sourceSelectors.filter(({ id }) =>
      id.includes(".matrix.entry.")).map(({ id }) => id),
    "vector-components": context.sourceSelectors.filter(({ id }) =>
      id.includes(".vector.component.")).map(({ id }) => id),
    "row-products": intermediateObjectIds(context,
      ".intermediate.row-dot-product."),
    "result-entries": byKind(context.targetSelectors, "component")
  });
}

function bindMatrixMatrix(context: Context) {
  return bindings({
    "left-rows": context.sourceSelectors.filter(({ id }) =>
      id.includes(".left.matrix.entry.")).map(({ id }) => id),
    "right-columns": context.sourceSelectors.filter(({ id }) =>
      id.includes(".right.matrix.entry.")).map(({ id }) => id),
    "cell-products": intermediateObjectIds(context,
      ".intermediate.cell-dot-product."),
    "result-cells": byKind(context.targetSelectors, "entry")
  });
}

function bindPresentForm(context: Context) {
  return bindings({
    "form-before": context.transformation.sourceObjectIds,
    "form-after": context.transformation.targetObjectIds
  });
}

function bindFormComparison(context: Context) {
  return bindings({
    "forms-before": context.transformation.sourceObjectIds,
    "comparison-after": context.transformation.targetObjectIds
  });
}

function projectMatrixIntermediates(animation: KpAnimationAsset):
KpAnimationAsset {
  if (!animation.id.startsWith("animation.generated.linear-algebra.")) {
    return animation;
  }
  const transformations = animation.transformations
    .filter(({ transformType }) => transformType !== "applyLinearMapToVector")
    .map((transformation) => {
      const intermediateIds = animation.bundle.objects
        .filter(({ id }) => id.includes(".intermediate."))
        .map(({ id }) => id);
      return Object.freeze({
        ...transformation,
        // Intermediate products are semantic target context for governance,
        // even though the legacy asset renders only its terminal expression.
        targetObjectIds: Object.freeze([
          ...transformation.targetObjectIds,
          ...intermediateIds
        ])
      });
    });
  return Object.freeze({ ...animation, transformations: Object.freeze(
    transformations
  ) });
}

function projectTransformations(
  animation: KpAnimationAsset,
  keep: (transformation: KpSemanticTransformation) => boolean
): KpAnimationAsset {
  return Object.freeze({
    ...animation,
    transformations: Object.freeze(animation.transformations.filter(keep))
  });
}

function correspondenceFor(context: Context): CorrespondenceMap {
  const original = context.transformation.correspondenceMap ??
    legacyCorrespondence(context);
  const referencedTargets = new Set(original.records.flatMap(
    ({ targetSelectorIds }) => targetSelectorIds
  ));
  const intermediateTargets = context.transformation.targetObjectIds.filter(
    (id) => id.includes(".intermediate.") && !referencedTargets.has(id)
  );
  if (intermediateTargets.length === 0) return original;
  return Object.freeze({
    id: `${original.id}.with-intermediates`,
    records: Object.freeze([
      ...original.records,
      Object.freeze({
        id: "intermediate-context-introduced",
        relation: "introduction" as const,
        sourceSelectorIds: Object.freeze([]),
        targetSelectorIds: Object.freeze(intermediateTargets),
        summary:
          "Expose authored intermediate products as governed target context."
      })
    ])
  });
}

function legacyCorrespondence(context: Context): CorrespondenceMap {
  const pairs = context.transformation.correspondence ?? [];
  if (pairs.length === 0) {
    return Object.freeze({
      id: `correspondence.${context.transformation.id}.whole-objects`,
      records: Object.freeze([Object.freeze({
        id: "whole-object-relation",
        relation: "role-change" as const,
        sourceSelectorIds: Object.freeze(
          context.transformation.sourceObjectIds
        ),
        targetSelectorIds: Object.freeze(
          context.transformation.targetObjectIds
        ),
        summary: "Relate the authored source and target semantic objects."
      })])
    });
  }
  return Object.freeze({
    id: `correspondence.${context.transformation.id}.legacy-pairs`,
    records: Object.freeze(pairs.map((pair, index) => Object.freeze({
      id: `legacy-pair-${index + 1}`,
      relation: pair.preserves.includes("identity")
        ? "identity" as const
        : "role-change" as const,
      sourceSelectorIds: Object.freeze([pair.sourceSelectorId]),
      targetSelectorIds: Object.freeze([pair.targetSelectorId]),
      summary: "Preserve the authored semantic occurrence pair."
    })))
  });
}

function entry(
  transformType: string,
  operationId: string,
  bindRoles: Protocol["bindRoles"]
): readonly [string, Protocol] {
  return [transformType, Object.freeze({
    operationId,
    semanticClass: "transformation" as const,
    bindRoles
  })];
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
  return unique((context.transformation.correspondenceMap?.records ?? [])
    .filter((record) => record.relation === relation)
    .flatMap((record) => endpoint === "source"
      ? record.sourceSelectorIds
      : record.targetSelectorIds));
}

function intermediateObjectIds(context: Context, marker: string) {
  return context.transformation.targetObjectIds.filter((id) =>
    id.includes(marker));
}

function byKind(selectors: readonly KpAssetSelector[], kind: string) {
  return selectors.filter((selector) => selector.kind === kind)
    .map(({ id }) => id);
}

function selectorKind(selectors: readonly KpAssetSelector[], id: string) {
  return selectors.find((selector) => selector.id === id)?.kind;
}

function bindings(value: Record<string, readonly string[]>):
Readonly<Record<string, readonly string[]>> {
  return Object.freeze(Object.fromEntries(Object.entries(value).map(
    ([id, ids]) => [id, Object.freeze([...ids])]
  )));
}

function unique(values: readonly string[]) {
  return [...new Set(values)];
}
