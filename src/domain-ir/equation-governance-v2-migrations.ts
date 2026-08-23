export interface KpEquationGovernanceV2MigrationDeclaration {
  readonly assetId: string;
  readonly compilerId:
    | "kp.equation-evaluation-migration-compiler.v2"
    | "kp.equation-asset-migration-compiler.v2"
    | "kp.equation-presentation-plan.v2";
  readonly compilerSourcePath:
    | "src/domain-ir/equation-evaluation-migration-v2.ts"
    | "src/domain-ir/equation-asset-migration-v2.ts"
    | "src/semantic/log-product-equivalence-frame.ts";
  readonly adapterId: string;
  readonly typographyPolicyId: "typography.equation.stage.v2";
}

const directAdapterId =
  "editor-animation-surface.operation-evaluation.canonical-native-katex";
const carrierAdapterId =
  "editor-animation-surface.operation-evaluation.carrier-preserving-simplification";

/**
 * A declaration is earned only after the actual asset compiles in the
 * migration contract tests. Keeping this table data-only lets inventory and
 * conformance generation see the route without eagerly importing asset packs.
 */
export const kpEquationGovernanceV2MigrationDeclarations:
readonly KpEquationGovernanceV2MigrationDeclaration[] = Object.freeze([
  ...[
    "animation.operation-evaluation.one-plus-two",
    "animation.operation-evaluation.five-plus-two",
    "animation.operation-evaluation.three-sixths",
    "animation.operation-evaluation.two-times-three"
  ].map((assetId) => declaration(assetId, directAdapterId)),
  declaration(
    "animation.operation-evaluation.two-times-one-carrier",
    carrierAdapterId
  ),
  declaration("animation.generated.add-zero", carrierAdapterId),
  ...[
    [
      "animation.algebra.exponential-homomorphism.sum-to-product",
      "editor-animation-surface.exponential-homomorphism.canonical-native-katex"
    ],
    [
      "animation.algebra.exponential-homomorphism.difference-to-quotient",
      "editor-animation-surface.exponential-homomorphism.canonical-native-katex"
    ],
    [
      "animation.algebra.log-exponent.solve-two-power-x",
      "editor-animation-surface.log-exponent.canonical-native-katex"
    ],
    [
      "animation.equation.logarithm-change-of-base.v1",
      "editor-animation-surface.logarithm-change-of-base.canonical-native-katex"
    ],
    [
      "animation.algebra.log-quotient.difference-to-quotient",
      "editor-animation-surface.log-quotient.canonical-native-katex"
    ],
    [
      "animation.algebra.log-product.product-to-sum",
      "editor-animation-surface.log-product.canonical-native-katex"
    ],
    [
      "animation.algebra.log-product.three-factors-to-sum",
      "editor-animation-surface.log-product.canonical-native-katex"
    ],
    [
      "animation.generated.exponent.square-as-product",
      "editor-animation-surface.equation.katex"
    ],
    [
      "animation.generated.function-wrap.apply-f",
      "editor-animation-surface.equation.katex"
    ]
  ].map(([assetId, adapterId]) => structuralDeclaration(
    assetId!,
    adapterId!
  )),
  Object.freeze({
    assetId: "animation.algebra.log-product.equivalence-frame",
    compilerId: "kp.equation-presentation-plan.v2" as const,
    compilerSourcePath:
      "src/semantic/log-product-equivalence-frame.ts" as const,
    adapterId:
      "editor-animation-surface.log-product.equivalence-frame.native-katex",
    typographyPolicyId: "typography.equation.stage.v2" as const
  })
]);

export function findKpEquationGovernanceV2Migration(
  assetId: string
): KpEquationGovernanceV2MigrationDeclaration | undefined {
  return kpEquationGovernanceV2MigrationDeclarations.find(
    (declaration) => declaration.assetId === assetId
  );
}

function declaration(
  assetId: string,
  adapterId: string
): KpEquationGovernanceV2MigrationDeclaration {
  return Object.freeze({
    assetId,
    compilerId: "kp.equation-evaluation-migration-compiler.v2" as const,
    compilerSourcePath:
      "src/domain-ir/equation-evaluation-migration-v2.ts" as const,
    adapterId,
    typographyPolicyId: "typography.equation.stage.v2" as const
  });
}

function structuralDeclaration(
  assetId: string,
  adapterId: string
): KpEquationGovernanceV2MigrationDeclaration {
  return Object.freeze({
    assetId,
    compilerId: "kp.equation-asset-migration-compiler.v2" as const,
    compilerSourcePath:
      "src/domain-ir/equation-asset-migration-v2.ts" as const,
    adapterId,
    typographyPolicyId: "typography.equation.stage.v2" as const
  });
}
