import { findKpAssetSelector } from "./asset.ts";
import { composeCorrespondenceMapsSequence } from "./correspondence.ts";
import {
  kpFractionalLinearCertifiedTransferProjectionId
} from "./fractional-linear-certified-transfer-contract.ts";

export {
  kpFractionalLinearCertifiedTransferProjectionId,
  kpFractionalLinearCertifiedTransferProxyRecordId
} from "./fractional-linear-certified-transfer-contract.ts";
import {
  createFractionalLinearEquationKpAsset,
  fractionalLinearEquationAssetIds as ids,
  type FractionalLinearEquationKpAsset
} from "./fractional-linear-equation-asset.ts";

export interface KpCertifiedFluentTransferProjection {
  readonly id: typeof kpFractionalLinearCertifiedTransferProjectionId;
  readonly kind: "certified-fluent-transfer-projection";
  readonly sourceTraceId: string;
  readonly sourceObjectId: string;
  readonly bridgeObjectId: string;
  readonly targetObjectId: string;
  readonly proofTransformationIds: readonly string[];
  readonly continuants: readonly {
    readonly sourceSelectorId: string;
    readonly bridgeSelectorId: string;
  }[];
  readonly denominatorProxy: {
    readonly kind: "presentation-proxy";
    readonly sourceSelectorId: string;
    readonly bridgeSelectorId: string;
    readonly balancedFactorSelectorIds: readonly [string, string];
    readonly cancellationSelectorIds: readonly [string, string];
  };
  readonly productDerivation: {
    readonly sourceSelectorIds: readonly [string, string, string];
    readonly targetSelectorId: string;
  };
}

const proofTypes = [
  "multiplyBothSides",
  "cancelMultiplicativeInverses",
  "simplifyConstantProduct"
] as const;

/**
 * The fluent view compresses three proved operations; it does not manufacture
 * a semantic “move across equals” transformation or claim that the displayed
 * denominator and multiplier are the same algebraic object.
 */
export function createFractionalLinearCertifiedTransferProjection(
  asset: FractionalLinearEquationKpAsset = createFractionalLinearEquationKpAsset()
): KpCertifiedFluentTransferProjection {
  const proofTransformationIds = [
    ids.multiply,
    ids.cancelDenominator,
    ids.simplifyProduct
  ];
  const proof = proofTransformationIds.map((id) => {
    const transformation = asset.transformations.find((candidate) => candidate.id === id);
    if (transformation === undefined) {
      throw new Error(`Certified transfer is missing proof transformation ${id}.`);
    }
    return transformation;
  });

  proof.forEach((transformation, index) => {
    if (transformation.transformType !== proofTypes[index]) {
      throw new Error(
        `Certified transfer expected ${proofTypes[index]} at proof step ${index + 1}.`
      );
    }
    if (!transformation.lawRefs?.some((law) => law.level === "strict")) {
      throw new Error(`Certified transfer proof ${transformation.id} requires a strict law.`);
    }
    const next = proof[index + 1];
    if (next !== undefined && transformation.targetObjectIds[0] !== next.sourceObjectIds[0]) {
      throw new Error(`Certified transfer proof is discontinuous after ${transformation.id}.`);
    }
  });

  const projection = {
    id: kpFractionalLinearCertifiedTransferProjectionId,
    kind: "certified-fluent-transfer-projection",
    sourceTraceId: asset.sourceTraceId,
    sourceObjectId: ids.rightSimplified,
    bridgeObjectId: ids.denominatorCancelled,
    targetObjectId: ids.solved,
    proofTransformationIds,
    continuants: [
      pair("fraction.numerator.x", "lhs.x"),
      pair("equals", "equals"),
      pair("rhs.4", "rhs.4")
    ],
    denominatorProxy: {
      kind: "presentation-proxy",
      sourceSelectorId: selector(ids.rightSimplified, "fraction.denominator.2"),
      bridgeSelectorId: selector(ids.denominatorCancelled, "rhs.multiplier.2"),
      balancedFactorSelectorIds: [
        selector(ids.multiplied, "lhs.multiplier.2"),
        selector(ids.multiplied, "rhs.multiplier.2")
      ],
      cancellationSelectorIds: [
        selector(ids.multiplied, "lhs.multiplier.2"),
        selector(ids.multiplied, "fraction.denominator.2")
      ]
    },
    productDerivation: {
      sourceSelectorIds: [
        selector(ids.denominatorCancelled, "rhs.multiplier.2"),
        selector(ids.denominatorCancelled, "rhs.product"),
        selector(ids.denominatorCancelled, "rhs.4")
      ],
      targetSelectorId: selector(ids.solved, "rhs.8")
    }
  } as const satisfies KpCertifiedFluentTransferProjection;

  for (const selectorId of projectionSelectorIds(projection)) {
    if (findKpAssetSelector(asset.bundle, selectorId) === undefined) {
      throw new Error(`Certified transfer references missing selector ${selectorId}.`);
    }
  }

  const bridgeCorrespondence = composeCorrespondenceMapsSequence(
    `${projection.id}.balanced-bridge`,
    proof.slice(0, 2).map((transformation) => {
      if (transformation.correspondenceMap === undefined) {
        throw new Error(`Certified transfer proof ${transformation.id} lacks correspondence.`);
      }
      return transformation.correspondenceMap;
    })
  );
  for (const continuant of projection.continuants) {
    if (!bridgeCorrespondence.records.some((record) =>
      record.relation === "identity" &&
      record.sourceSelectorIds.includes(continuant.sourceSelectorId) &&
      record.targetSelectorIds.includes(continuant.bridgeSelectorId)
    )) {
      throw new Error(
        `Certified transfer cannot prove continuant ${continuant.sourceSelectorId}.`
      );
    }
  }
  if (bridgeCorrespondence.records.some((record) =>
    record.sourceSelectorIds.includes(projection.denominatorProxy.sourceSelectorId) &&
    record.targetSelectorIds.includes(projection.denominatorProxy.bridgeSelectorId)
  )) {
    throw new Error("Certified transfer denominator proxy must not claim semantic identity.");
  }
  requireRelation(
    proof[0]!,
    "introduction",
    [],
    projection.denominatorProxy.balancedFactorSelectorIds
  );
  requireRelation(
    proof[1]!,
    "cancelation",
    projection.denominatorProxy.cancellationSelectorIds,
    []
  );
  requireRelation(
    proof[2]!,
    "fan-in",
    projection.productDerivation.sourceSelectorIds,
    [projection.productDerivation.targetSelectorId]
  );

  return Object.freeze({
    ...projection,
    proofTransformationIds: Object.freeze([...projection.proofTransformationIds]),
    continuants: Object.freeze(projection.continuants.map((pairValue) =>
      Object.freeze({ ...pairValue })
    )),
    denominatorProxy: Object.freeze({
      ...projection.denominatorProxy,
      balancedFactorSelectorIds: Object.freeze([
        ...projection.denominatorProxy.balancedFactorSelectorIds
      ]) as unknown as readonly [string, string],
      cancellationSelectorIds: Object.freeze([
        ...projection.denominatorProxy.cancellationSelectorIds
      ]) as unknown as readonly [string, string]
    }),
    productDerivation: Object.freeze({
      ...projection.productDerivation,
      sourceSelectorIds: Object.freeze([
        ...projection.productDerivation.sourceSelectorIds
      ]) as unknown as readonly [string, string, string]
    })
  });
}

function requireRelation(
  transformation: FractionalLinearEquationKpAsset["transformations"][number],
  relation: "introduction" | "cancelation" | "fan-in",
  requiredSourceSelectorIds: readonly string[],
  requiredTargetSelectorIds: readonly string[]
): void {
  const matched = transformation.correspondenceMap?.records.some((record) =>
    record.relation === relation &&
    requiredSourceSelectorIds.every((id) => record.sourceSelectorIds.includes(id)) &&
    requiredTargetSelectorIds.every((id) => record.targetSelectorIds.includes(id))
  );
  if (!matched) {
    throw new Error(
      `Certified transfer proof ${transformation.id} lacks its ${relation} witness.`
    );
  }
}

function pair(sourcePath: string, bridgePath: string) {
  return {
    sourceSelectorId: selector(ids.rightSimplified, sourcePath),
    bridgeSelectorId: selector(ids.denominatorCancelled, bridgePath)
  };
}

function selector(objectId: string, path: string): string {
  return `${objectId}.${path}`;
}

function projectionSelectorIds(
  projection: KpCertifiedFluentTransferProjection
): readonly string[] {
  return [
    ...projection.continuants.flatMap((pairValue) => [
      pairValue.sourceSelectorId,
      pairValue.bridgeSelectorId
    ]),
    projection.denominatorProxy.sourceSelectorId,
    projection.denominatorProxy.bridgeSelectorId,
    ...projection.denominatorProxy.balancedFactorSelectorIds,
    ...projection.denominatorProxy.cancellationSelectorIds,
    ...projection.productDerivation.sourceSelectorIds,
    projection.productDerivation.targetSelectorId
  ];
}
