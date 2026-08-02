import type { KpVector2 } from "./vector-dot-projection-exemplar-contract.ts";

export type KpVectorDotProjectionDiagnosticCode =
  | "vector.component.non-finite"
  | "vector.component.non-integer"
  | "projection.target.zero";

export interface KpVectorDotProjectionDiagnostic {
  readonly code: KpVectorDotProjectionDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

export interface KpVectorDotProjectionComponentLineage {
  readonly id: string;
  readonly index: 0 | 1;
  readonly axis: "x" | "y";
  readonly sourceSelectorId: string;
  readonly targetSelectorId: string;
  readonly productObjectId: string;
  readonly sourceGeometryId: string;
  readonly targetGeometryId: string;
  readonly projectionGeometryId: string;
  readonly sourceComponent: number;
  readonly targetComponent: number;
  readonly product: number;
  readonly cumulativeDotProduct: number;
}

export interface KpVectorDotProjectionSemanticModel {
  readonly schemaVersion: "kp.vector-dot-projection-semantic-model.v1";
  readonly id: string;
  readonly sourceVectorId: string;
  readonly targetVectorId: string;
  readonly projectionVectorId: string;
  readonly residualVectorId: string;
  readonly sourceVector: KpVector2;
  readonly targetVector: KpVector2;
  readonly projectionVector: KpVector2;
  readonly residualVector: KpVector2;
  readonly residualTargetDotProduct: number;
  readonly sourceNormSquared: number;
  readonly targetNormSquared: number;
  readonly dotProduct: number;
  readonly projectionScale: {
    readonly numerator: number;
    readonly denominator: number;
    readonly value: number;
  };
  readonly angleRadians: number | null;
  readonly componentLineage: readonly KpVectorDotProjectionComponentLineage[];
  readonly accessibleDescription: string;
}

export type KpVectorDotProjectionSemanticModelResult =
  | {
      readonly status: "compiled";
      readonly model: KpVectorDotProjectionSemanticModel;
    }
  | {
      readonly status: "rejected";
      readonly diagnostics: readonly KpVectorDotProjectionDiagnostic[];
    };

export function compileKpVectorDotProjectionSemanticModel(input: {
  readonly id: string;
  readonly sourceVectorId: string;
  readonly targetVectorId: string;
  readonly projectionVectorId: string;
  readonly residualVectorId: string;
  readonly sourceVector: KpVector2;
  readonly targetVector: KpVector2;
}): KpVectorDotProjectionSemanticModelResult {
  const diagnostics = validateVector("sourceVector", input.sourceVector)
    .concat(validateVector("targetVector", input.targetVector));
  const targetNormSquared = dot(input.targetVector, input.targetVector);
  if (targetNormSquared === 0) {
    diagnostics.push({
      code: "projection.target.zero",
      path: "targetVector",
      message: "Vector projection requires a non-zero target vector."
    });
  }
  if (diagnostics.length > 0) {
    return Object.freeze({
      status: "rejected" as const,
      diagnostics: Object.freeze(diagnostics.map((diagnostic) =>
        Object.freeze({ ...diagnostic })
      ))
    });
  }

  const dotProduct = dot(input.sourceVector, input.targetVector);
  const sourceNormSquared = dot(input.sourceVector, input.sourceVector);
  const projectionScale = dotProduct / targetNormSquared;
  const projectionVector = scale(input.targetVector, projectionScale);
  const residualVector = subtract(input.sourceVector, projectionVector);
  const residualTargetDotProduct = dot(residualVector, input.targetVector);
  const axes = ["x", "y"] as const;
  let cumulativeDotProduct = 0;
  const componentLineage = axes.map((axis, index) => {
    const sourceComponent = input.sourceVector[index]!;
    const targetComponent = input.targetVector[index]!;
    const product = sourceComponent * targetComponent;
    cumulativeDotProduct += product;
    return Object.freeze({
      id: `lineage.dot-projection.component.${axis}`,
      index: index as 0 | 1,
      axis,
      sourceSelectorId: `${input.sourceVectorId}.${axis}`,
      targetSelectorId: `${input.targetVectorId}.${axis}`,
      productObjectId: `expression.dot-projection.component-pair.${axis}`,
      sourceGeometryId: `geometry.${input.sourceVectorId}.component.${axis}`,
      targetGeometryId: `geometry.${input.targetVectorId}.component.${axis}`,
      projectionGeometryId:
        `geometry.${input.projectionVectorId}.component.${axis}`,
      sourceComponent,
      targetComponent,
      product,
      cumulativeDotProduct
    });
  });
  const angleRadians = sourceNormSquared === 0
    ? null
    : Math.acos(clamp(
        dotProduct / Math.sqrt(sourceNormSquared * targetNormSquared),
        -1,
        1
      ));

  return Object.freeze({
    status: "compiled" as const,
    model: Object.freeze({
      schemaVersion: "kp.vector-dot-projection-semantic-model.v1" as const,
      id: input.id,
      sourceVectorId: input.sourceVectorId,
      targetVectorId: input.targetVectorId,
      projectionVectorId: input.projectionVectorId,
      residualVectorId: input.residualVectorId,
      sourceVector: Object.freeze([...input.sourceVector]) as KpVector2,
      targetVector: Object.freeze([...input.targetVector]) as KpVector2,
      projectionVector: Object.freeze(projectionVector),
      residualVector: Object.freeze(residualVector),
      residualTargetDotProduct,
      sourceNormSquared,
      targetNormSquared,
      dotProduct,
      projectionScale: Object.freeze({
        numerator: dotProduct,
        denominator: targetNormSquared,
        value: projectionScale
      }),
      angleRadians,
      componentLineage: Object.freeze(componentLineage),
      accessibleDescription: accessibleDescription({
        sourceVector: input.sourceVector,
        targetVector: input.targetVector,
        dotProduct,
        projectionVector,
        residualVector,
        angleRadians
      })
    })
  });
}

function validateVector(
  path: "sourceVector" | "targetVector",
  vector: KpVector2
): KpVectorDotProjectionDiagnostic[] {
  const diagnostics: KpVectorDotProjectionDiagnostic[] = [];
  vector.forEach((component, index) => {
    if (!Number.isFinite(component)) {
      diagnostics.push({
        code: "vector.component.non-finite",
        path: `${path}[${index}]`,
        message: "Exact vector components must be finite."
      });
    } else if (!Number.isSafeInteger(component)) {
      diagnostics.push({
        code: "vector.component.non-integer",
        path: `${path}[${index}]`,
        message: "The exact exemplar accepts safe-integer vector components."
      });
    }
  });
  return diagnostics;
}

function accessibleDescription(input: {
  readonly sourceVector: KpVector2;
  readonly targetVector: KpVector2;
  readonly dotProduct: number;
  readonly projectionVector: KpVector2;
  readonly residualVector: KpVector2;
  readonly angleRadians: number | null;
}): string {
  const angle = input.angleRadians === null
    ? "The source vector has zero length, so its angle is undefined."
    : `Their angle is approximately ${(input.angleRadians * 180 / Math.PI).toFixed(2)} degrees.`;
  return `Vector a is (${input.sourceVector.join(", ")}); vector b is ` +
    `(${input.targetVector.join(", ")}). Their dot product is ` +
    `${input.dotProduct}. ${angle} The projection of a onto b is ` +
    `(${input.projectionVector.join(", ")}), leaving perpendicular residual ` +
    `(${input.residualVector.join(", ")}).`;
}

function dot(left: KpVector2, right: KpVector2): number {
  return left[0] * right[0] + left[1] * right[1];
}

function scale(vector: KpVector2, scalar: number): [number, number] {
  return [vector[0] * scalar, vector[1] * scalar];
}

function subtract(left: KpVector2, right: KpVector2): [number, number] {
  return [left[0] - right[0], left[1] - right[1]];
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
