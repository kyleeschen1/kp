const MAXIMUM_PAIRWISE_CANDIDATE_COMBINATIONS = 100_000;

export interface KpConformanceCoverageFactor {
  readonly id: string;
  readonly values: readonly string[];
}

export interface KpConformanceThreeWayOverride {
  readonly id: string;
  readonly riskFactorIds: readonly [string, string, string];
  readonly assignments: Readonly<Record<string, string>>;
}

export interface KpConformanceCoverageScenario {
  readonly id: string;
  readonly assignments: Readonly<Record<string, string>>;
  readonly inclusion: {
    readonly kind: "pairwise" | "three-way-override";
    readonly newlyCoveredPairKeys: readonly string[];
    readonly overrideIds: readonly string[];
  };
}

export interface KpConformanceCoveragePlan {
  readonly kind: "native-katex-conformance-coverage-plan";
  readonly factors: readonly KpConformanceCoverageFactor[];
  readonly scenarios: readonly KpConformanceCoverageScenario[];
  readonly requiredPairKeys: readonly string[];
  readonly coveredPairKeys: readonly string[];
  readonly overrideIds: readonly string[];
}

export function planKpNativeKatexPairwiseCoverage(input: {
  readonly factors: readonly KpConformanceCoverageFactor[];
  readonly overrides?: readonly KpConformanceThreeWayOverride[] | undefined;
  readonly maximumScenarios: number;
}): KpConformanceCoveragePlan {
  const factors = validateFactors(input.factors);
  requirePositiveInteger(input.maximumScenarios, "maximum scenarios");
  const overrides = validateOverrides(factors, input.overrides ?? []);
  const candidates = cartesianAssignments(factors);
  if (candidates.length > MAXIMUM_PAIRWISE_CANDIDATE_COMBINATIONS) {
    throw new Error(
      `Pairwise candidates ${candidates.length} exceed the ` +
      `${MAXIMUM_PAIRWISE_CANDIDATE_COMBINATIONS} combination safety limit.`
    );
  }
  const requiredPairKeys = enumerateKpConformancePairKeys(factors);
  const uncovered = new Set(requiredPairKeys);
  const selected = new Map<string, MutableSelectedScenario>();

  for (const override of overrides) {
    const key = assignmentKey(factors, override.assignments);
    const scenario = selected.get(key) ?? {
      assignments: override.assignments,
      newlyCoveredPairKeys: [] as string[],
      overrideIds: [] as string[]
    };
    scenario.overrideIds.push(override.id);
    selected.set(key, scenario);
  }
  for (const scenario of selected.values()) {
    scenario.newlyCoveredPairKeys.push(
      ...consumeCoveredPairs(factors, scenario.assignments, uncovered)
    );
  }

  while (uncovered.size > 0) {
    if (selected.size >= input.maximumScenarios) {
      throw new Error(
        `Pairwise coverage requires more than ${input.maximumScenarios} scenarios; ` +
        `${uncovered.size} pair requirements remain.`
      );
    }
    const unselected = candidates.filter((candidate) =>
      !selected.has(assignmentKey(factors, candidate))
    );
    const ranked = unselected.map((assignments) => ({
      assignments,
      key: assignmentKey(factors, assignments),
      pairKeys: pairKeysForAssignments(factors, assignments)
        .filter((pairKey) => uncovered.has(pairKey))
    })).filter(({ pairKeys }) => pairKeys.length > 0)
      .sort((left, right) =>
        right.pairKeys.length - left.pairKeys.length ||
        left.key.localeCompare(right.key)
      );
    const best = ranked[0];
    if (best === undefined) {
      throw new Error("Pairwise planner cannot cover the remaining requirements.");
    }
    const newlyCoveredPairKeys = consumeCoveredPairs(
      factors,
      best.assignments,
      uncovered
    );
    selected.set(best.key, {
      assignments: best.assignments,
      newlyCoveredPairKeys: [...newlyCoveredPairKeys],
      overrideIds: []
    });
  }

  const scenarios = [...selected.entries()].map(([key, scenario]) =>
    Object.freeze({
      id: `scenario.${key}`,
      assignments: scenario.assignments,
      inclusion: Object.freeze({
        kind: scenario.overrideIds.length > 0
          ? "three-way-override" as const
          : "pairwise" as const,
        newlyCoveredPairKeys: Object.freeze([
          ...scenario.newlyCoveredPairKeys
        ].sort()),
        overrideIds: Object.freeze([...scenario.overrideIds].sort())
      })
    })
  );
  const coveredPairKeys = [...new Set(scenarios.flatMap((scenario) =>
    pairKeysForAssignments(factors, scenario.assignments)
  ))].sort();
  if (
    requiredPairKeys.some((pairKey) => !coveredPairKeys.includes(pairKey))
  ) {
    throw new Error("Pairwise planner returned an incomplete coverage proof.");
  }
  return Object.freeze({
    kind: "native-katex-conformance-coverage-plan" as const,
    factors,
    scenarios: Object.freeze(scenarios),
    requiredPairKeys,
    coveredPairKeys: Object.freeze(coveredPairKeys),
    overrideIds: Object.freeze(overrides.map(({ id }) => id))
  });
}

export function enumerateKpConformancePairKeys(
  factors: readonly KpConformanceCoverageFactor[]
): readonly string[] {
  const pairs: string[] = [];
  for (let left = 0; left < factors.length; left += 1) {
    for (let right = left + 1; right < factors.length; right += 1) {
      for (const leftValue of factors[left]!.values) {
        for (const rightValue of factors[right]!.values) {
          pairs.push(pairKey(
            factors[left]!.id,
            leftValue,
            factors[right]!.id,
            rightValue
          ));
        }
      }
    }
  }
  return Object.freeze(pairs.sort());
}

interface MutableSelectedScenario {
  readonly assignments: Readonly<Record<string, string>>;
  readonly newlyCoveredPairKeys: string[];
  readonly overrideIds: string[];
}

function validateFactors(
  input: readonly KpConformanceCoverageFactor[]
): readonly KpConformanceCoverageFactor[] {
  if (input.length < 2) {
    throw new Error("Pairwise coverage requires at least two factors.");
  }
  const ids = input.map(({ id }) => id);
  if (ids.some((id) => id.trim() === "") || new Set(ids).size !== ids.length) {
    throw new Error("Coverage factor IDs must be unique and non-empty.");
  }
  return Object.freeze(input.map((factor) => {
    if (
      factor.values.length === 0 ||
      factor.values.some((value) => value.trim() === "") ||
      new Set(factor.values).size !== factor.values.length
    ) {
      throw new Error(
        `Coverage factor ${factor.id} values must be non-empty and unique.`
      );
    }
    return Object.freeze({
      id: factor.id,
      values: Object.freeze([...factor.values])
    });
  }));
}

function validateOverrides(
  factors: readonly KpConformanceCoverageFactor[],
  overrides: readonly KpConformanceThreeWayOverride[]
): readonly KpConformanceThreeWayOverride[] {
  const ids = overrides.map(({ id }) => id);
  if (ids.some((id) => id.trim() === "") || new Set(ids).size !== ids.length) {
    throw new Error("Three-way override IDs must be unique and non-empty.");
  }
  const factorById = new Map(factors.map((factor) => [factor.id, factor]));
  return Object.freeze([...overrides].sort((left, right) =>
    left.id.localeCompare(right.id)
  ).map((override) => {
    if (new Set(override.riskFactorIds).size !== 3) {
      throw new Error(`${override.id} must name three distinct risk factors.`);
    }
    const assignmentIds = Object.keys(override.assignments).sort();
    const factorIds = factors.map(({ id }) => id).sort();
    if (
      assignmentIds.length !== factorIds.length ||
      factorIds.some((id, index) => assignmentIds[index] !== id)
    ) {
      throw new Error(`${override.id} must assign every coverage factor.`);
    }
    for (const riskFactorId of override.riskFactorIds) {
      if (!factorById.has(riskFactorId)) {
        throw new Error(`${override.id} names unknown risk factor ${riskFactorId}.`);
      }
    }
    for (const [factorId, value] of Object.entries(override.assignments)) {
      if (!factorById.get(factorId)?.values.includes(value)) {
        throw new Error(`${override.id} assigns unknown ${factorId} value ${value}.`);
      }
    }
    return Object.freeze({
      id: override.id,
      riskFactorIds: Object.freeze([...override.riskFactorIds]) as
        readonly [string, string, string],
      assignments: Object.freeze({ ...override.assignments })
    });
  }));
}

function cartesianAssignments(
  factors: readonly KpConformanceCoverageFactor[]
): readonly Readonly<Record<string, string>>[] {
  return factors.reduce<readonly Readonly<Record<string, string>>[]>(
    (assignments, factor) => assignments.flatMap((assignment) =>
      factor.values.map((value) => Object.freeze({
        ...assignment,
        [factor.id]: value
      }))
    ),
    [Object.freeze({})]
  );
}

function pairKeysForAssignments(
  factors: readonly KpConformanceCoverageFactor[],
  assignments: Readonly<Record<string, string>>
): readonly string[] {
  const keys: string[] = [];
  for (let left = 0; left < factors.length; left += 1) {
    for (let right = left + 1; right < factors.length; right += 1) {
      keys.push(pairKey(
        factors[left]!.id,
        assignments[factors[left]!.id]!,
        factors[right]!.id,
        assignments[factors[right]!.id]!
      ));
    }
  }
  return keys;
}

function consumeCoveredPairs(
  factors: readonly KpConformanceCoverageFactor[],
  assignments: Readonly<Record<string, string>>,
  uncovered: Set<string>
): readonly string[] {
  const consumed = pairKeysForAssignments(factors, assignments)
    .filter((pairKey) => uncovered.delete(pairKey));
  return Object.freeze(consumed.sort());
}

function pairKey(
  leftFactorId: string,
  leftValue: string,
  rightFactorId: string,
  rightValue: string
): string {
  return JSON.stringify([
    [leftFactorId, leftValue],
    [rightFactorId, rightValue]
  ]);
}

function assignmentKey(
  factors: readonly KpConformanceCoverageFactor[],
  assignments: Readonly<Record<string, string>>
): string {
  return factors.map(({ id }) => `${id}=${assignments[id]}`).join(";");
}

function requirePositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
}
