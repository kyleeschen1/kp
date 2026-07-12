import type {
  TransformTreeVisualMotifRule
} from "./visual-motif-composition.ts";
import {
  equationVisualMotifDescriptors,
  type EquationMotionPrimitiveId,
  type EquationVisualMotifDescriptor,
  type EquationVisualMotifKind,
  type EquationVisualMotifPhaseId
} from "./visual-motif.ts";

export type EquationTransformVisualMotifRule = TransformTreeVisualMotifRule<
  EquationVisualMotifKind,
  EquationMotionPrimitiveId,
  EquationVisualMotifPhaseId
>;

export const defaultEquationTransformVisualMotifRules:
  readonly EquationTransformVisualMotifRule[] = [
    {
      transformationKind: "wrapFunction",
      descriptor: descriptorForEquationMotif("wrap"),
      summary: "Persistent arguments shift while function wrapper artifacts enter."
    },
    {
      transformationKind: "unwrapFunction",
      descriptor: descriptorForEquationMotif("unwrap"),
      summary: "Function wrapper artifacts exit while persistent arguments shift."
    }
  ];

function descriptorForEquationMotif(
  kind: EquationVisualMotifKind
): EquationVisualMotifDescriptor {
  const descriptor = equationVisualMotifDescriptors.find(
    (candidate) => candidate.kind === kind
  );

  if (descriptor === undefined) {
    throw new Error(`Unknown equation visual motif kind: ${kind}`);
  }

  return descriptor;
}
