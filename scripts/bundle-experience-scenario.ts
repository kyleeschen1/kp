export type KpBundleExperienceScenarioId = `bundle-experience.${string}`;
export type KpBundleBuildId = `bundle-build.${string}`;

export type KpBundleExperiencePhase =
  | "entry"
  | "experience"
  | "incremental";

export type KpBundleResourceKind =
  | "script"
  | "style"
  | "font"
  | "asset"
  | "total";

export interface KpBundleExperienceActivation {
  readonly id: string;
  readonly manifestRoots: readonly string[];
}

export interface KpBundleExperienceBudget {
  readonly phase: KpBundleExperiencePhase;
  readonly resource: KpBundleResourceKind;
  readonly gzipBytes: number;
}

export interface KpBundleExperienceScenario {
  readonly schemaVersion: "kp.bundle-experience-scenario.v1";
  readonly id: KpBundleExperienceScenarioId;
  readonly title: string;
  readonly buildId: KpBundleBuildId;
  readonly entryRoots: readonly string[];
  readonly activations: readonly KpBundleExperienceActivation[];
  readonly comparisonBaseId?: KpBundleExperienceScenarioId | undefined;
  readonly expectedOwners: readonly string[];
  readonly forbiddenOwners: readonly string[];
  readonly budgets: readonly KpBundleExperienceBudget[];
}

export type KpBundleExperienceScenarioInput = Omit<
  KpBundleExperienceScenario,
  "schemaVersion"
>;

/**
 * Scenario declarations are build evidence, not executable loaders. Keeping
 * exact manifest roots as data lets the build and browser verifiers share one
 * vocabulary without importing application implementations.
 */
export function defineKpBundleExperienceScenario(
  input: KpBundleExperienceScenarioInput
): KpBundleExperienceScenario {
  assertNonEmpty("scenario id", input.id);
  assertNonEmpty("scenario title", input.title);
  assertNonEmpty("scenario build id", input.buildId);
  if (input.entryRoots.length === 0) {
    throw new Error(`Bundle scenario ${input.id} requires an entry root.`);
  }

  const entryRoots = freezeUniqueStrings(
    `${input.id} entry roots`,
    input.entryRoots
  );
  const activationIds = new Set<string>();
  const allRoots = new Set(entryRoots);
  const activations = Object.freeze(input.activations.map((activation) => {
    assertNonEmpty(`${input.id} activation id`, activation.id);
    if (activationIds.has(activation.id)) {
      throw new Error(
        `Bundle scenario ${input.id} repeats activation ${activation.id}.`
      );
    }
    activationIds.add(activation.id);
    if (activation.manifestRoots.length === 0) {
      throw new Error(
        `Bundle scenario ${input.id} activation ${activation.id} requires a root.`
      );
    }
    const manifestRoots = freezeUniqueStrings(
      `${input.id} activation ${activation.id} roots`,
      activation.manifestRoots
    );
    for (const root of manifestRoots) {
      if (allRoots.has(root)) {
        throw new Error(
          `Bundle scenario ${input.id} reaches root ${root} more than once.`
        );
      }
      allRoots.add(root);
    }
    return Object.freeze({ id: activation.id, manifestRoots });
  }));

  if (input.comparisonBaseId === input.id) {
    throw new Error(`Bundle scenario ${input.id} cannot compare with itself.`);
  }
  const expectedOwners = freezeUniqueStrings(
    `${input.id} expected owners`,
    input.expectedOwners
  );
  const forbiddenOwners = freezeUniqueStrings(
    `${input.id} forbidden owners`,
    input.forbiddenOwners
  );
  const expectedOwnerSet = new Set(expectedOwners);
  for (const owner of forbiddenOwners) {
    if (expectedOwnerSet.has(owner)) {
      throw new Error(
        `Bundle scenario ${input.id} both expects and forbids owner ${owner}.`
      );
    }
  }

  const budgetKeys = new Set<string>();
  const budgets = Object.freeze(input.budgets.map((budget) => {
    if (!Number.isSafeInteger(budget.gzipBytes) || budget.gzipBytes <= 0) {
      throw new Error(
        `Bundle scenario ${input.id} has invalid gzip budget ${budget.gzipBytes}.`
      );
    }
    if (budget.phase === "incremental" &&
        input.comparisonBaseId === undefined) {
      throw new Error(
        `Bundle scenario ${input.id} needs a comparison base for an incremental budget.`
      );
    }
    const key = `${budget.phase}:${budget.resource}`;
    if (budgetKeys.has(key)) {
      throw new Error(
        `Bundle scenario ${input.id} repeats budget ${key}.`
      );
    }
    budgetKeys.add(key);
    return Object.freeze({ ...budget });
  }));

  return Object.freeze({
    schemaVersion: "kp.bundle-experience-scenario.v1" as const,
    id: input.id,
    title: input.title,
    buildId: input.buildId,
    entryRoots,
    activations,
    ...(input.comparisonBaseId === undefined
      ? {}
      : { comparisonBaseId: input.comparisonBaseId }),
    expectedOwners,
    forbiddenOwners,
    budgets
  });
}

function freezeUniqueStrings(
  label: string,
  values: readonly string[]
): readonly string[] {
  const seen = new Set<string>();
  return Object.freeze(values.map((value) => {
    assertNonEmpty(label, value);
    if (seen.has(value)) throw new Error(`${label} repeats ${value}.`);
    seen.add(value);
    return value;
  }));
}

function assertNonEmpty(label: string, value: string): void {
  if (value.trim() === "") throw new Error(`${label} must not be empty.`);
}
