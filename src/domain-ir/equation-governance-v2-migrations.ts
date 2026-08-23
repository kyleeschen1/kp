export interface KpEquationGovernanceV2MigrationDeclaration {
  readonly assetId: string;
  readonly compilerId: "kp.equation-evaluation-migration-compiler.v2";
  readonly compilerSourcePath:
    "src/domain-ir/equation-evaluation-migration-v2.ts";
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
  declaration("animation.generated.add-zero", carrierAdapterId)
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
