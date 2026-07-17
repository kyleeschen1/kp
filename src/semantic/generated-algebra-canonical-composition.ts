import type { KpCanonicalOperationId } from "./canonical-operation.ts";

// Render-time motif selection needs only this compact projection. Keeping it
// separate prevents the full governed registry from entering the editor shell.
export function canonicalCompositionForGeneratedTransform(
  transformType: string
): readonly KpCanonicalOperationId[] {
  switch (transformType) {
    case "subtractBothSides":
    case "addBothSides":
      return ["kp.core.persist", "kp.core.introduce"];
    case "divideBothSides":
      return ["kp.core.persist", "kp.core.wrap"];
    case "cancelAdditiveInverses":
    case "cancelMultiplicativeInverses":
    case "simplifyUnitFractionFactor":
      return ["kp.core.persist", "kp.core.eliminate"];
    case "simplifyConstantDifference":
    case "simplifyConstantSum":
    case "simplifyConstantQuotient":
    case "mergeFractionCommonFactor":
      return ["kp.core.merge"];
    case "splitFractionFactors":
      return ["kp.core.persist", "kp.core.reorder", "kp.core.wrap"];
    case "lowerExponent":
      return ["kp.core.persist", "kp.core.reorder"];
    case "unwrapUnitExponent":
      return ["kp.core.unwrap", "kp.core.eliminate"];
    case "rewritePowerAsRoot":
      return ["kp.core.persist", "kp.core.substitute", "kp.core.wrap"];
    case "wrapFunction":
      return ["kp.core.wrap"];
    case "distributeMultiplication":
      return ["kp.core.persist", "kp.core.fan-out", "kp.core.eliminate", "kp.core.reorder"];
    case "factorCommonTerm":
      return ["kp.core.persist", "kp.core.merge", "kp.core.group"];
    default:
      throw new Error(`Generated transform ${transformType} has no canonical operation composition.`);
  }
}
