export interface KpLinearSolveBehaviorReachabilityAudit {
  readonly symbol: "createLinearSolveKpBehavior";
  readonly currentOwner: "src/semantic/linear-solve-asset.ts";
  readonly prohibitedDependency: "src/tutorial/linear-solve-card-sample.ts";
  readonly productionImporters: readonly [];
  readonly testImporters: readonly string[];
  readonly descriptiveMentions: readonly string[];
  readonly disposition: "move-to-experience";
  readonly preservation: readonly string[];
}

/**
 * The behavior wrapper is useful test/example composition, but it is not
 * semantic authority and has no production caller. It therefore belongs beside
 * the tutorial sampler it wraps rather than pulling tutorial code into core.
 */
export const kpLinearSolveBehaviorReachabilityAudit = Object.freeze({
  symbol: "createLinearSolveKpBehavior",
  currentOwner: "src/semantic/linear-solve-asset.ts",
  prohibitedDependency: "src/tutorial/linear-solve-card-sample.ts",
  productionImporters: Object.freeze([]),
  testImporters: Object.freeze([
    "tests/kp-asset-decomposition.test.ts",
    "tests/kp-asset-inspection.test.ts",
    "tests/kp-linear-solve-asset.test.ts"
  ]),
  descriptiveMentions: Object.freeze(["src/project-dashboard/data.ts"]),
  disposition: "move-to-experience",
  preservation: Object.freeze([
    "behavior.linear-solve.card identity",
    "2400ms parent timeline duration",
    "absolute progress sampling",
    "deterministic active transformation frames"
  ])
} as const satisfies KpLinearSolveBehaviorReachabilityAudit);
