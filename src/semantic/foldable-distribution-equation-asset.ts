import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpAssetSelector,
  type KpSemanticAssetObject
} from "./asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import type {
  CorrespondenceMap,
  SelectorCorrespondenceRecord
} from "./correspondence.ts";
import {
  createKpFoldableDistributionFanOutCertificates,
  createKpFoldableFinalCollectionCertificate,
  createKpFoldableProductEvaluationCertificates,
  createKpFoldableSignedTermGroupingCertificate
} from "./foldable-distribution-operation-certificates.ts";
import {
  createKpFoldableDistributionEndpointSpecs
} from "./foldable-distribution-endpoint-spec.ts";

export interface KpFoldableDistributionEquationAsset {
  readonly sourceTraceId: "trace.algebra.foldable-distribution";
  readonly bundle: ReturnType<typeof createKpAssetBundle>;
  readonly transformations: readonly KpSemanticTransformation[];
}

const sourceTraceId = "trace.algebra.foldable-distribution";
const requiredRelationGroupIds = new Set([
  "grouped.term-3x",
  "grouped.term-2x"
]);
const transformIds = Object.freeze({
  leftFanOut: "transform.foldable-distribution.left.fan-out",
  rightFanOut: "transform.foldable-distribution.right.fan-out",
  leftProduct:
    "transform.foldable-distribution.product.three-times-two",
  rightProduct:
    "transform.foldable-distribution.product.two-times-negative-one",
  grouping: "transform.foldable-distribution.group-like-terms",
  collection: "transform.foldable-distribution.collect-results"
});

export function createKpFoldableDistributionEquationAsset():
  KpFoldableDistributionEquationAsset {
  const endpoints = createKpFoldableDistributionEndpointSpecs();
  const fanOut = createKpFoldableDistributionFanOutCertificates();
  const products = createKpFoldableProductEvaluationCertificates();
  const grouping = createKpFoldableSignedTermGroupingCertificate();
  const collection = createKpFoldableFinalCollectionCertificate();
  const factoredId = endpoints[0]!.objectId;
  const rawId = endpoints[1]!.objectId;
  const leftFanOut = transformation({
    id: fanOut[0]!.execution.transformationId,
    definitionId: "definition.generated.distribution.distribute-multiplication",
    transformType: "distributeMultiplication",
    title: "Distribute the left factor",
    sourceObjectId: factoredId,
    targetObjectId: rawId,
    correspondenceMap: extendMap(
      fanOut[0]!.execution.correspondenceMap,
      [
        identity(
          "foldable-distribution.outer-plus-persists",
          "factored.outer-plus",
          "distribution.outer-plus",
          "The plus between the two distributed branches persists."
        ),
        introduction(
          "foldable-distribution.left-product-operator-enters",
          "expression.foldable-distribution.distributed.operator.three-times-two",
          "The explicit multiplication dot clarifies the new constant product."
        )
      ]
    )
  });
  const rightFanOut = transformation({
    id: fanOut[1]!.execution.transformationId,
    definitionId: "definition.generated.distribution.distribute-multiplication",
    transformType: "distributeMultiplication",
    title: "Distribute the right factor",
    sourceObjectId: factoredId,
    targetObjectId: rawId,
    correspondenceMap: extendMap(
      fanOut[1]!.execution.correspondenceMap,
      [
        introduction(
          "foldable-distribution.right-product-operator-enters",
          "expression.foldable-distribution.distributed.operator.two-times-negative-one",
          "The explicit multiplication dot clarifies the signed product."
        )
      ]
    )
  });
  const leftProduct = transformationFromCertificate(
    products[0]!.transformation,
    extendMap(products[0]!.transformation.correspondenceMap!, [
      fanIn(
        "foldable-distribution.left-variable-product-settles",
        ["distribution.left.factor-3-x", "distribution.left.x"],
        "distributed.term-3x",
        "The left coefficient and variable settle as the persistent term 3x."
      ),
      identity(
        "foldable-distribution.left-plus-persists",
        "expression.foldable-distribution.left.distributed-raw.connector",
        "distributed.plus-left",
        "The plus after the left variable term persists."
      ),
      identity(
        "foldable-distribution.product-outer-plus-persists",
        "distribution.outer-plus",
        "distributed.outer-plus",
        "The plus between distributed branches persists."
      )
    ])
  );
  const rightProduct = transformationFromCertificate(
    products[1]!.transformation,
    extendMap(products[1]!.transformation.correspondenceMap!, [
      fanIn(
        "foldable-distribution.right-variable-product-settles",
        ["distribution.right.factor-2-x", "distribution.right.x"],
        "distributed.term-2x",
        "The right coefficient and variable settle as the persistent term 2x."
      ),
      roleChange(
        "foldable-distribution.signed-connector-settles",
        "expression.foldable-distribution.right.distributed-raw.connector",
        "distributed.minus-right",
        "The connector settles as the explicit sign of negative two."
      )
    ])
  );
  const transformations = Object.freeze([
    leftFanOut,
    rightFanOut,
    leftProduct,
    rightProduct,
    grouping.transformation,
    collection.transformation
  ]);
  const bundle = createKpAssetBundle({
    id: "asset.foldable-distribution-equation",
    title: "Distribute and collect like terms",
    objects: endpoints.map((endpoint, index) =>
      equationObject({
        endpoint,
        sourceId: index === 0 ? undefined : endpoints[index - 1]!.objectId,
        transformationId: index === 0
          ? undefined
          : index === 1
            ? "evaluation.foldable-distribution.distribute"
            : index === 2
              ? "evaluation.foldable-distribution.evaluate-products"
              : transformations[index + 1]?.id
      })
    )
  });

  return Object.freeze({
    sourceTraceId,
    bundle,
    transformations
  });
}

function equationObject(input: {
  readonly endpoint:
    ReturnType<typeof createKpFoldableDistributionEndpointSpecs>[number];
  readonly sourceId?: string | undefined;
  readonly transformationId?: string | undefined;
}): KpSemanticAssetObject {
  const annotationSelectors = input.endpoint.tokens.map(
    ([selectorId, latex]) => ({
      id: selectorId,
      kind: selectorKind(latex),
      label: readableLabel(latex),
      metadata: {
        equationStructureRole: selectorKind(latex),
        nativeEndpoint: true,
        ...successorMetadata(input.endpoint.objectId, selectorId),
        activeTransformationIds: selectorScopes(
          input.endpoint.objectId,
          selectorId
        ).join(",")
      }
    })
  );
  const relationGroups = input.endpoint.groupEnvelopes
    .filter(({ id }) => requiredRelationGroupIds.has(id))
    .map(({ id, memberSelectorIds }) => ({
      id,
      kind: "semantic-group",
      label: id.endsWith("term-3x") ? "3x" : "2x",
      metadata: {
        equationStructureRole: "semantic-group",
        memberSelectorIds: memberSelectorIds.join(","),
        activeTransformationIds: selectorScopes(
          input.endpoint.objectId,
          id
        ).join(",")
      }
    }));
  return createKpSemanticAssetObject({
    id: input.endpoint.objectId,
    objectType: "equation",
    title: input.endpoint.label,
    value: {
      latex: input.endpoint.tokens.map(([, latex]) => latex).join(" ")
    },
    selectors: [...annotationSelectors, ...relationGroups],
    provenance: input.sourceId === undefined
      ? {
          kind: "authored",
          sourceIds: [sourceTraceId],
          summary: "Verified factored source expression."
        }
      : {
          kind: "transformed",
          sourceIds: [input.sourceId],
          ...(input.transformationId === undefined
            ? {}
            : { transformationId: input.transformationId })
        }
  });
}

function successorMetadata(
  objectId: string,
  selectorId: string
): Readonly<Record<string, string | number | boolean>> {
  if (objectId.endsWith(".distributed-raw")) {
    const sourceRank = new Map([
      ["distribution.left.factor-3-constant", 0],
      ["distribution.left.constant-2", 1],
      ["distribution.right.factor-2-constant", 0],
      ["distribution.right.negative-one", 1]
    ]).get(selectorId);
    if (sourceRank !== undefined) {
      return {
          successorContribution: "material-input",
          successorRole: "factor",
          successorRank: sourceRank
      };
    }
    if (
      selectorId ===
        "expression.foldable-distribution.distributed.operator.three-times-two" ||
      selectorId ===
        "expression.foldable-distribution.distributed.operator.two-times-negative-one"
    ) {
      return {
        successorContribution: "catalyst",
        successorRole: "multiplication-operator",
        successorRank: 0
      };
    }
    return {};
  }
  if (
    objectId.endsWith(".distributed") &&
    (selectorId === "distributed.constant-6" ||
      selectorId === "distributed.negative-2")
  ) {
    return {
      successorTarget: true,
      successorRole: "evaluated-product",
      successorRank: 0
    };
  }
  return {};
}

function selectorScopes(
  objectId: string,
  selectorId: string
): readonly string[] {
  if (objectId.endsWith(".factored")) {
    return selectorId === "factored.outer-plus" ||
      selectorId.startsWith("factored.left-") ||
      selectorId.includes(".left.factored.")
      ? [transformIds.leftFanOut]
      : [transformIds.rightFanOut];
  }
  if (objectId.endsWith(".distributed-raw")) {
    if (
      selectorId === "distribution.outer-plus" ||
      selectorId.includes(".left.") ||
      selectorId.endsWith(".three-times-two")
    ) {
      return [transformIds.leftFanOut, transformIds.leftProduct];
    }
    return [transformIds.rightFanOut, transformIds.rightProduct];
  }
  if (objectId.endsWith(".distributed")) {
    const left = new Set([
      "distributed.term-3x",
      "distributed.plus-left",
      "distributed.constant-6",
      "distributed.outer-plus"
    ]);
    return left.has(selectorId)
      ? [transformIds.leftProduct, transformIds.grouping]
      : [transformIds.rightProduct, transformIds.grouping];
  }
  if (objectId.endsWith(".grouped")) {
    if (
      selectorId === "grouped.term-3x" ||
      selectorId === "grouped.term-2x"
    ) {
      return [transformIds.grouping];
    }
    if ([
      "grouped.coefficient-3",
      "grouped.x-from-left",
      "grouped.coefficient-2",
      "grouped.x-from-right"
    ].includes(selectorId)) {
      return [transformIds.collection];
    }
    return [transformIds.grouping, transformIds.collection];
  }
  return [transformIds.collection];
}

function transformation(input: {
  readonly id: string;
  readonly definitionId?: string | undefined;
  readonly transformType: string;
  readonly title: string;
  readonly sourceObjectId: string;
  readonly targetObjectId: string;
  readonly correspondenceMap: CorrespondenceMap;
}): KpSemanticTransformation {
  return createKpSemanticTransformation({
    id: input.id,
    ...(input.definitionId === undefined
      ? {}
      : { definitionId: input.definitionId }),
    transformType: input.transformType,
    title: input.title,
    sourceObjectIds: [input.sourceObjectId],
    targetObjectIds: [input.targetObjectId],
    preserves: ["identity", "value", "structure"],
    correspondenceMap: input.correspondenceMap,
    lawRefs: [{
      id: input.transformType === "distributeMultiplication"
        ? "kp.algebra.distribute.v1"
        : "law.arithmetic.constant-product",
      level: "strict"
    }]
  });
}

function transformationFromCertificate(
  source: KpSemanticTransformation,
  correspondenceMap: CorrespondenceMap
): KpSemanticTransformation {
  return createKpSemanticTransformation({
    ...source,
    correspondenceMap
  });
}

function extendMap(
  map: CorrespondenceMap,
  records: readonly SelectorCorrespondenceRecord[]
): CorrespondenceMap {
  return {
    id: map.id,
    records: [...map.records, ...records]
  };
}

function identity(
  id: string,
  sourceSelectorId: string,
  targetSelectorId: string,
  summary: string
): SelectorCorrespondenceRecord {
  return {
    id,
    relation: "identity",
    sourceSelectorIds: [sourceSelectorId],
    targetSelectorIds: [targetSelectorId],
    summary
  };
}

function roleChange(
  id: string,
  sourceSelectorId: string,
  targetSelectorId: string,
  summary: string
): SelectorCorrespondenceRecord {
  return {
    id,
    relation: "role-change",
    sourceSelectorIds: [sourceSelectorId],
    targetSelectorIds: [targetSelectorId],
    summary
  };
}

function fanIn(
  id: string,
  sourceSelectorIds: readonly string[],
  targetSelectorId: string,
  summary: string
): SelectorCorrespondenceRecord {
  return {
    id,
    relation: "fan-in",
    sourceSelectorIds,
    targetSelectorIds: [targetSelectorId],
    summary
  };
}

function introduction(
  id: string,
  targetSelectorId: string,
  summary: string
): SelectorCorrespondenceRecord {
  return {
    id,
    relation: "introduction",
    sourceSelectorIds: [],
    targetSelectorIds: [targetSelectorId],
    summary
  };
}

function selectorKind(latex: string): KpAssetSelector["kind"] {
  if (latex === "(" || latex === ")") return "artifact";
  if (latex === "+" || latex === "-" || latex === "\\cdot") return "operator";
  return "term";
}

function readableLabel(latex: string): string {
  if (latex === "\\cdot") return "multiplication";
  if (latex === "(") return "left parenthesis";
  if (latex === ")") return "right parenthesis";
  return latex;
}
