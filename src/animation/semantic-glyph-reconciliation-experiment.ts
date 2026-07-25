export type KpGlyphReconciliationRelation =
  | "one-to-one"
  | "many-to-one"
  | "one-to-many"
  | "crowded-responsive";

export interface KpGlyphReconciliationExperimentCase {
  readonly id: string;
  readonly title: string;
  readonly assetId: string;
  readonly route: string;
  readonly relation: KpGlyphReconciliationRelation;
  readonly transitionId: string;
  readonly requiredCapabilities: readonly (
    | "accessibility"
    | "annotation"
    | "branching"
    | "cloze"
    | "direct-seek"
    | "hover"
    | "responsive"
    | "rewind"
  )[];
  readonly viewports: readonly {
    readonly id: "wide" | "phone";
    readonly widthPx: number;
    readonly heightPx: number;
  }[];
}

export interface KpGlyphReconciliationExperimentBudget {
  readonly maxPlannerOperations: number;
  readonly maxColdPlanP95Ms: number;
  readonly maxCachedPlanP95Ms: number;
  readonly maxFrameSampleP95Ms: number;
  readonly maxSerializedPlanBytes: number;
  readonly maxRouteGzipGrowthBytes: number;
}

export interface KpGlyphReconciliationPolicyBaseline {
  readonly scheduleModeIds: readonly string[];
  readonly sourceFiles: readonly string[];
  readonly sourceReferenceCount: number;
}

export interface KpGlyphReconciliationExperimentLedger {
  readonly schemaVersion: "kp.glyph-reconciliation-experiment.v1";
  readonly cases: readonly KpGlyphReconciliationExperimentCase[];
  readonly budget: KpGlyphReconciliationExperimentBudget;
  readonly policyBaseline: KpGlyphReconciliationPolicyBaseline;
  readonly passCriteria: readonly string[];
  readonly failCriteria: readonly string[];
}

const wide = Object.freeze({
  id: "wide" as const,
  widthPx: 1_440,
  heightPx: 900
});
const phone = Object.freeze({
  id: "phone" as const,
  widthPx: 390,
  heightPx: 844
});

export const kpGlyphReconciliationExperimentLedger:
KpGlyphReconciliationExperimentLedger = Object.freeze({
  schemaVersion: "kp.glyph-reconciliation-experiment.v1",
  cases: Object.freeze([
    experimentCase({
      id: "case.solve-x.one-to-one",
      title: "Solve-x one-to-one identity and rearrangement",
      assetId: "animation.linear-solve.solve-x",
      route: "/reader/solve-x/",
      relation: "one-to-one",
      transitionId: "transform.linear-solve.subtract-both-sides",
      requiredCapabilities: [
        "accessibility",
        "annotation",
        "direct-seek",
        "hover",
        "responsive",
        "rewind"
      ],
      viewports: [wide, phone]
    }),
    experimentCase({
      id: "case.fraction.many-to-one",
      title: "Numerator fraction merge with settled Cloze",
      assetId: "animation.numerator-split-merge.round-trip",
      route: "/reader/split-merge-fractions/",
      relation: "many-to-one",
      transitionId: "transform.numerator-split-merge.merge",
      requiredCapabilities: [
        "accessibility",
        "annotation",
        "cloze",
        "direct-seek",
        "hover",
        "responsive",
        "rewind"
      ],
      viewports: [wide, phone]
    }),
    experimentCase({
      id: "case.quadratic.one-to-many",
      title: "Quadratic plus-minus branch",
      assetId: "animation.algebra.quadratic.solution-branching",
      route: "/reader/quadratic-branching/",
      relation: "one-to-many",
      transitionId: "operation.quadratic.create-plus-minus-branches",
      requiredCapabilities: [
        "accessibility",
        "annotation",
        "branching",
        "direct-seek",
        "hover",
        "responsive",
        "rewind"
      ],
      viewports: [wide, phone]
    }),
    experimentCase({
      id: "case.quadratic.crowded-responsive",
      title: "Crowded quadratic discriminant merge",
      assetId: "animation.algebra.quadratic.solution-branching",
      route: "/reader/quadratic-branching/",
      relation: "crowded-responsive",
      transitionId: "transition.quadratic.formula.subtract-discriminant",
      requiredCapabilities: [
        "accessibility",
        "annotation",
        "direct-seek",
        "hover",
        "responsive",
        "rewind"
      ],
      viewports: [wide, phone]
    })
  ]),
  budget: Object.freeze({
    maxPlannerOperations: 10_000,
    maxColdPlanP95Ms: 12,
    maxCachedPlanP95Ms: 2,
    maxFrameSampleP95Ms: 1,
    maxSerializedPlanBytes: 32_768,
    maxRouteGzipGrowthBytes: 12_000
  }),
  policyBaseline: Object.freeze({
    scheduleModeIds: Object.freeze([
      "reserve-then-transit-v1",
      "transit-then-reflow-v1",
      "concurrent-clearance-v1"
    ]),
    sourceFiles: Object.freeze([
      "src/animation/divide-both-sides-equation-adapter.ts",
      "src/animation/equation-presentation-profile.ts",
      "src/animation/fractional-linear-equation-adapter.ts",
      "src/animation/fractional-linear-transfer-comparison-adapter.ts",
      "src/animation/linear-solve-adapter.ts",
      "src/animation/numerator-split-merge-equation-adapter.ts",
      "src/rendering/equation-linear-rearrangement.ts"
    ]),
    sourceReferenceCount: 10
  }),
  passCriteria: Object.freeze([
    "Every visual match stays inside executor-established semantic lineage.",
    "All four cases use one matcher and one bounded scheduler.",
    "Ambiguity and over-budget geometry choose an inspectable conservative fallback.",
    "Branching, Cloze, hover, annotations, accessibility, seek, and rewind remain semantic projections.",
    "Published cases execute from serialized static JavaScript data.",
    "Scheduling policy sites decrease and no operation-specific mode is added.",
    "Human review finds the result at least as clear as the preserved baseline."
  ]),
  failCriteria: Object.freeze([
    "Any case requires an operation-, family-, branch-, or viewport-specific scheduler.",
    "Glyph equality is required to establish semantic identity or multiplicity.",
    "Measured geometry or backend resources must enter the durable artifact.",
    "A required capability is silently flattened or removed.",
    "Performance or payload budgets pass only through case-specific optimization.",
    "Scheduling policy sites or operation-specific modes increase."
  ])
});

export function validateKpGlyphReconciliationExperimentLedger(
  ledger: KpGlyphReconciliationExperimentLedger
): readonly string[] {
  const issues: string[] = [];
  const caseIds = ledger.cases.map(({ id }) => id);
  if (new Set(caseIds).size !== caseIds.length) {
    issues.push("Experiment case ids must be unique.");
  }
  const relations = new Set(ledger.cases.map(({ relation }) => relation));
  for (const required of [
    "one-to-one",
    "many-to-one",
    "one-to-many",
    "crowded-responsive"
  ] as const) {
    if (!relations.has(required)) {
      issues.push(`Experiment is missing the ${required} pressure case.`);
    }
  }
  for (const candidate of ledger.cases) {
    if (candidate.viewports.length === 0) {
      issues.push(`Experiment case ${candidate.id} requires a viewport.`);
    }
    if (!candidate.requiredCapabilities.includes("direct-seek")) {
      issues.push(`Experiment case ${candidate.id} must preserve direct seek.`);
    }
    if (!candidate.requiredCapabilities.includes("rewind")) {
      issues.push(`Experiment case ${candidate.id} must preserve rewind.`);
    }
  }
  if (ledger.budget.maxPlannerOperations <= 0) {
    issues.push("Planner operation budget must be positive.");
  }
  if (ledger.policyBaseline.scheduleModeIds.length === 0) {
    issues.push("Policy baseline must name the existing schedule modes.");
  }
  if (ledger.passCriteria.length === 0 || ledger.failCriteria.length === 0) {
    issues.push("Experiment requires explicit pass and fail criteria.");
  }
  return Object.freeze(issues);
}

function experimentCase(
  input: KpGlyphReconciliationExperimentCase
): KpGlyphReconciliationExperimentCase {
  return Object.freeze({
    ...input,
    requiredCapabilities: Object.freeze([...input.requiredCapabilities]),
    viewports: Object.freeze(input.viewports.map((viewport) =>
      Object.freeze({ ...viewport })
    ))
  });
}
