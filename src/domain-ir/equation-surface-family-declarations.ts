export type KpEquationSelectedSurfaceCapability =
  | "equation-katex"
  | "log-exponent"
  | "log-quotient"
  | "log-product"
  | "exact-fraction-quantity"
  | "operation-evaluation"
  | "place-value-addition";

export type KpEquationPrimarySurfaceCapability =
  | "equation-katex"
  | "log-exponent"
  | "log-quotient"
  | "log-product"
  | "operation-evaluation";

export type KpDeclaredEquationSurfaceDisposition =
  | "canonical"
  | "adapter-backed"
  | "static-only"
  | "unsupported"
  | "retirement-candidate";

export type KpDeclaredEquationMigrationWave =
  | "wave-a-operation-plan"
  | "wave-b-structural-native-math"
  | "wave-c-generated-bespoke-diagnostic-static";

export interface KpEquationSurfaceFamilyProjection {
  readonly selectedCapabilityIds:
    readonly KpEquationSelectedSurfaceCapability[];
  readonly primaryCapabilityId: KpEquationPrimarySurfaceCapability;
  readonly rendererAdapterId: string;
  readonly rendererSourcePath: string;
  readonly disposition: KpDeclaredEquationSurfaceDisposition;
  readonly migrationWave: KpDeclaredEquationMigrationWave;
  readonly preCheckpointAdapterSlice?: "s20" | "s21" | "s22" | undefined;
}

interface KpEquationSurfaceFamilyDeclaration {
  readonly id: string;
  readonly matches: (animationId: string) => boolean;
  readonly selectedCapabilityIds:
    readonly KpEquationSelectedSurfaceCapability[];
  readonly primaryCapabilityId: KpEquationPrimarySurfaceCapability;
  readonly rendererAdapterId: string;
  readonly rendererSourcePath: string;
}

export const kpEquationSurfaceFamilyDeclarations:
readonly KpEquationSurfaceFamilyDeclaration[] = Object.freeze([
  declaration({
    id: "family.equation.exact-fraction-quantity",
    matches: (id) => id === "animation.exact-fraction-quantity.third-plus-sixth",
    selectedCapabilityIds: ["exact-fraction-quantity", "equation-katex"],
    primaryCapabilityId: "equation-katex",
    rendererAdapterId: "editor-animation-surface.equation.katex",
    rendererSourcePath: "src/editor/equation-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.place-value-addition",
    matches: (id) => id === "animation.place-value-addition.278-plus-156",
    selectedCapabilityIds: ["place-value-addition"],
    primaryCapabilityId: "equation-katex",
    rendererAdapterId: "editor-animation-surface.equation.katex",
    rendererSourcePath: "src/editor/equation-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.operation-evaluation",
    matches: (id) => id.startsWith("animation.operation-evaluation."),
    selectedCapabilityIds: ["operation-evaluation", "equation-katex"],
    primaryCapabilityId: "operation-evaluation",
    rendererAdapterId:
      "editor-animation-surface.operation-evaluation.canonical-native-katex",
    rendererSourcePath: "src/editor/operation-evaluation-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.log-exponent",
    matches: (id) => id === "animation.algebra.log-exponent.solve-two-power-x",
    selectedCapabilityIds: ["log-exponent"],
    primaryCapabilityId: "log-exponent",
    rendererAdapterId:
      "editor-animation-surface.log-exponent.canonical-native-katex",
    rendererSourcePath: "src/editor/log-exponent-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.log-quotient",
    matches: (id) => id === "animation.algebra.log-quotient.difference-to-quotient",
    selectedCapabilityIds: ["log-quotient"],
    primaryCapabilityId: "log-quotient",
    rendererAdapterId:
      "editor-animation-surface.log-quotient.canonical-native-katex",
    rendererSourcePath: "src/editor/log-quotient-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.log-product",
    matches: (id) => id.startsWith("animation.algebra.log-product."),
    selectedCapabilityIds: ["log-product"],
    primaryCapabilityId: "log-product",
    rendererAdapterId:
      "editor-animation-surface.log-product.canonical-native-katex",
    rendererSourcePath: "src/editor/log-product-surface-adapter.ts"
  }),
  declaration({
    id: "family.equation.generic-katex",
    matches: () => true,
    selectedCapabilityIds: ["equation-katex"],
    primaryCapabilityId: "equation-katex",
    rendererAdapterId: "editor-animation-surface.equation.katex",
    rendererSourcePath: "src/editor/equation-surface-adapter.ts"
  })
]);

const staticOnlyIds = Object.freeze([
  "animation.comparison.jacobian-hessian",
  "animation.comparison.linear-solve-programming",
  "animation.sample.fourier-transform-pair",
  "animation.sample.fundamental-theorem-calculus"
]);
const retirementCandidateIds = Object.freeze([
  "animation.generated.substitute-three.provisional-incorrect"
]);
const waveAIds = Object.freeze([
  "animation.generated.add-zero",
  "animation.generated.cancellation.additive-inverses",
  "animation.generated.distribution.expand-a-sum",
  "animation.generated.distribution.factor-common-a",
  "animation.generated.linear-solve.linear-68c15d41",
  "animation.linear-solve.solve-x",
  "animation.operation-evaluation.five-plus-two",
  "animation.operation-evaluation.one-plus-two",
  "animation.operation-evaluation.three-sixths"
]);
const waveBIds = Object.freeze([
  "animation.algebra.log-exponent.solve-two-power-x",
  "animation.algebra.log-quotient.difference-to-quotient",
  "animation.generated.exponent.square-as-product",
  "animation.generated.fraction-expression.two-fourths",
  "animation.generated.function-wrap.apply-f",
  "animation.generated.linear-algebra.dot-product.three-vector",
  "animation.generated.linear-algebra.matrix-matrix.two-by-two",
  "animation.generated.linear-algebra.matrix-vector.two-by-two",
  "animation.generated.radical.square-root-as-power"
]);

export function projectKpEquationSurfaceFamily(
  animationId: string
): KpEquationSurfaceFamilyProjection {
  const family = kpEquationSurfaceFamilyDeclarations.find(
    ({ matches }) => matches(animationId)
  )!;
  const disposition = retirementCandidateIds.includes(animationId)
    ? "retirement-candidate" as const
    : staticOnlyIds.includes(animationId)
      ? "static-only" as const
      : family.primaryCapabilityId === "operation-evaluation"
        ? "canonical" as const
        : "adapter-backed" as const;
  const migrationWave = waveAIds.includes(animationId)
    ? "wave-a-operation-plan" as const
    : waveBIds.includes(animationId)
      ? "wave-b-structural-native-math" as const
      : "wave-c-generated-bespoke-diagnostic-static" as const;
  const preCheckpointAdapterSlice = animationId.includes("log-quotient")
    ? "s20" as const
    : animationId.includes("distribution")
      ? "s21" as const
      : animationId.includes("cancellation")
        ? "s22" as const
        : undefined;
  return Object.freeze({
    selectedCapabilityIds: family.selectedCapabilityIds,
    primaryCapabilityId: family.primaryCapabilityId,
    rendererAdapterId: family.rendererAdapterId,
    rendererSourcePath: family.rendererSourcePath,
    disposition,
    migrationWave,
    ...(preCheckpointAdapterSlice === undefined
      ? {}
      : { preCheckpointAdapterSlice })
  });
}

function declaration(
  input: KpEquationSurfaceFamilyDeclaration
): KpEquationSurfaceFamilyDeclaration {
  return Object.freeze({
    ...input,
    selectedCapabilityIds: Object.freeze([...input.selectedCapabilityIds])
  });
}
