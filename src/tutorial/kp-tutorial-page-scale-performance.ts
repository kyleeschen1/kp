export const kpTutorialPageScalePerformanceBudget = Object.freeze({
  projectionNeighborhoodRadius: 2,
  maxProjectedBlocks: 5,
  maxNearViewportBlocks: 3,
  maxHydratedPassages: 3,
  maxActiveMotionPassages: 1,
  maxScrollListeners: 1,
  maxResizeListeners: 1,
  maxScheduledFramesPerScrollBurst: 1,
  maxOrdinaryScrollRegistrationReads: 0,
  maxOrdinaryScrollLayoutReads: 0,
  maxCapabilityLoadsPerIdentity: 1
} as const);

export interface KpTutorialPageScalePerformanceObservation {
  readonly passageCount: number;
  readonly initialRegistrationReads: number;
  readonly initialLayoutReads: number;
  readonly scrollListenerCount: number;
  readonly resizeListenerCount: number;
  readonly maxScheduledFramesPerScrollBurst: number;
  readonly maxProjectedBlocks: number;
  readonly maxNearViewportBlocks: number;
  readonly ordinaryScrollRegistrationReads: number;
  readonly ordinaryScrollLayoutReads: number;
  readonly maxHydratedPassages: number;
  readonly maxActiveMotionPassages: number;
  readonly distinctCapabilityCount: number;
  readonly capabilityLoadCount: number;
  readonly maxCapabilityLoadsPerIdentity: number;
}

export interface KpTutorialPageScalePerformanceDiagnostic {
  readonly metric: keyof KpTutorialPageScalePerformanceObservation;
  readonly actual: number;
  readonly limit: number;
}

export interface KpTutorialPageScalePerformanceAudit {
  readonly passed: boolean;
  readonly diagnostics: readonly KpTutorialPageScalePerformanceDiagnostic[];
}

/**
 * The boundary is intentionally count-independent after initial geometry.
 * This keeps a longer essay from silently increasing work in every scroll frame.
 */
export function auditKpTutorialPageScalePerformance(
  observation: KpTutorialPageScalePerformanceObservation
): KpTutorialPageScalePerformanceAudit {
  const budget = kpTutorialPageScalePerformanceBudget;
  const diagnostics: KpTutorialPageScalePerformanceDiagnostic[] = [];
  checkAtMost(diagnostics, "initialRegistrationReads", observation, observation.passageCount);
  checkAtMost(diagnostics, "initialLayoutReads", observation, observation.passageCount);
  checkAtMost(diagnostics, "scrollListenerCount", observation, budget.maxScrollListeners);
  checkAtMost(diagnostics, "resizeListenerCount", observation, budget.maxResizeListeners);
  checkAtMost(
    diagnostics,
    "maxScheduledFramesPerScrollBurst",
    observation,
    budget.maxScheduledFramesPerScrollBurst
  );
  checkAtMost(diagnostics, "maxProjectedBlocks", observation, budget.maxProjectedBlocks);
  checkAtMost(
    diagnostics,
    "maxNearViewportBlocks",
    observation,
    budget.maxNearViewportBlocks
  );
  checkAtMost(
    diagnostics,
    "ordinaryScrollRegistrationReads",
    observation,
    budget.maxOrdinaryScrollRegistrationReads
  );
  checkAtMost(
    diagnostics,
    "ordinaryScrollLayoutReads",
    observation,
    budget.maxOrdinaryScrollLayoutReads
  );
  checkAtMost(
    diagnostics,
    "maxHydratedPassages",
    observation,
    budget.maxHydratedPassages
  );
  checkAtMost(
    diagnostics,
    "maxActiveMotionPassages",
    observation,
    budget.maxActiveMotionPassages
  );
  checkAtMost(
    diagnostics,
    "capabilityLoadCount",
    observation,
    observation.distinctCapabilityCount
  );
  checkAtMost(
    diagnostics,
    "maxCapabilityLoadsPerIdentity",
    observation,
    budget.maxCapabilityLoadsPerIdentity
  );
  return Object.freeze({
    passed: diagnostics.length === 0,
    diagnostics: Object.freeze(diagnostics)
  });
}

function checkAtMost(
  diagnostics: KpTutorialPageScalePerformanceDiagnostic[],
  metric: keyof KpTutorialPageScalePerformanceObservation,
  observation: KpTutorialPageScalePerformanceObservation,
  limit: number
): void {
  const actual = observation[metric];
  if (!Number.isFinite(actual) || actual > limit) {
    diagnostics.push(Object.freeze({ metric, actual, limit }));
  }
}
