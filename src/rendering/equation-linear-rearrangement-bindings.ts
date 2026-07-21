import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  createKpSuccessorSynthesisBindingFromMetadata,
  type KpSuccessorSynthesisBinding
} from "../animation/successor-synthesis.ts";
import {
  kpEquationLinearRearrangementKindForTransformType,
  type KpEquationLinearRearrangementKind
} from "./equation-linear-rearrangement.ts";

export interface KpEquationLinearRearrangementBinding {
  readonly transformationId: string;
  readonly kind: KpEquationLinearRearrangementKind;
  readonly successorSynthesisBinding?: KpSuccessorSynthesisBinding | undefined;
}

export function createKpEquationLinearRearrangementBindings(
  animation: KpAnimationAsset
): readonly KpEquationLinearRearrangementBinding[] {
  return animation.transformations.flatMap((transformation) => {
    const kind = kpEquationLinearRearrangementKindForTransformType(
      transformation.transformType
    );
    if (kind === undefined) return [];
    const causalRecord = transformation.correspondenceMap?.records.find(
      (record) => record.relation !== "identity"
    );
    if (causalRecord === undefined) {
      throw new Error(
        `Linear rearrangement ${transformation.id} requires a causal correspondence.`
      );
    }
    return [{
      transformationId: transformation.id,
      kind,
      ...(isSuccessorKind(kind)
        ? {
            successorSynthesisBinding:
              createKpSuccessorSynthesisBindingFromMetadata({
                bundle: animation.bundle,
                transformation,
                correspondence: causalRecord,
                operationId: `kp.algebra.${kind}`
              })
          }
        : {})
    }];
  });
}

function isSuccessorKind(kind: KpEquationLinearRearrangementKind): boolean {
  return kind === "simplify-constant-difference" || kind === "simplify-constant-product";
}
