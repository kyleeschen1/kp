import { typescriptInferenceBudget } from "./typescript-inference-budget.ts";

// Reviewed membership is explicit: adding coverage requires assigning a cohort,
// never quietly removing an old consumer to recover compiler headroom.
export const coreInferenceFixtures = [
  "tests/type-fixtures/animation-authoring-public-api.ts",
  "tests/type-fixtures/authoring-structural-callers.ts",
  "tests/type-fixtures/bayesian-authoring.ts",
  "tests/type-fixtures/concept-manifest-inference.ts",
  "tests/type-fixtures/concept-room-inference.ts",
  "tests/type-fixtures/concept-room-state-inference.ts",
  "tests/type-fixtures/concept-room-theme-inference.ts",
  "tests/type-fixtures/equation-protected-transit.ts",
  "tests/type-fixtures/equation-stage-layout-proof.ts",
  "tests/type-fixtures/equation-visible-paint-contact.ts",
  "tests/type-fixtures/executable-motif-continuity-compiler.ts",
  "tests/type-fixtures/executable-successor-motif-program.ts",
  "tests/type-fixtures/factoring-motif-binding.ts",
  "tests/type-fixtures/fraction-composition-certificates.ts",
  "tests/type-fixtures/fraction-composition-promotion-certificate.ts",
  "tests/type-fixtures/generated-cancellation-presentation.ts",
  "tests/type-fixtures/linear-problem-protocol-inference.ts",
  "tests/type-fixtures/native-katex-executable-scene.ts",
  "tests/type-fixtures/native-katex-scene-track-opacity.ts",
  "tests/type-fixtures/operation-evaluation-presentation-registry.ts",
  "tests/type-fixtures/persistent-workspace-lifetimes.ts",
  "tests/type-fixtures/place-value-addition-promotion-certificate.ts",
  "tests/type-fixtures/place-value-addition-terminal-output.ts",
  "tests/type-fixtures/place-value-addition-written-ownership.ts",
  "tests/type-fixtures/semantic-entity-version-store.ts",
  "tests/type-fixtures/semantic-state-aggregate-snapshot.ts",
  "tests/type-fixtures/semantic-state-assembly-inference.ts",
  "tests/type-fixtures/semantic-state-authoring-surface.ts",
  "tests/type-fixtures/semantic-state-authority-adapter.ts",
  "tests/type-fixtures/semantic-state-bind-copy.ts",
  "tests/type-fixtures/semantic-state-composition-inference.ts",
  "tests/type-fixtures/semantic-state-derived-binding.ts",
  "tests/type-fixtures/semantic-state-family-inference.ts",
  "tests/type-fixtures/semantic-state-identity.ts",
  "tests/type-fixtures/semantic-state-pinned-recovery.ts",
  "tests/type-fixtures/semantic-state-scale-probe.ts",
  "tests/type-fixtures/semantic-state-slot-lifecycle.ts",
  "tests/type-fixtures/semantic-state-transaction.ts",
  "tests/type-fixtures/semantic-state-update.ts",
  "tests/type-fixtures/typed-linear-supply-demand.ts",
  "tests/type-fixtures/typed-math-authoring-builders.ts",
  "tests/type-fixtures/typed-math-authoring-ergonomic-public-api.ts",
  "tests/type-fixtures/typed-math-authoring-public-api.ts",
  "tests/type-fixtures/typed-math-linear-maps.ts",
  "tests/type-fixtures/typed-math-second-derivative-maps.ts",
  "tests/type-fixtures/typed-math-semantic-spaces.ts",
  "tests/type-fixtures/typed-math-unit-tagged-economics.ts",
  "tests/type-fixtures/unit-scalar-map-helper-core.ts"
] as const;
export const frontendInferenceFixtures = ["tests/type-fixtures/authoring-entrypoint-consumers.ts"] as const;
export const combinedInferenceBudget = Object.freeze({
  measuredProject: { types: 142_266, instantiations: 239_250 },
  // R4B adds actual view and editorial-binding consumers; retain fixed 2% / 3% headroom.
  ceilings: { types: 145_200, instantiations: 246_500 }
} as const);
export const inferenceCohorts = [
  { name: "core", config: "tsconfig.inference-core.json", fixtures: coreInferenceFixtures, budget: typescriptInferenceBudget },
  { name: "combined", config: "tsconfig.inference.json", fixtures: [...coreInferenceFixtures, ...frontendInferenceFixtures], budget: combinedInferenceBudget }
] as const;

export function assertInferenceMembership(actual: readonly string[], expected: readonly string[]): void {
  if (new Set(actual).size !== actual.length || new Set(expected).size !== expected.length)
    throw new Error("Duplicate inference fixture membership");
  const missing = expected.filter(path => !actual.includes(path));
  const unexpected = actual.filter(path => !expected.includes(path));
  if (missing.length || unexpected.length)
    throw new Error(`Inference membership drift: missing=${missing.join(",")} unexpected=${unexpected.join(",")}`);
}
