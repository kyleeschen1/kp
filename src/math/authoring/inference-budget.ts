export const kpTypedMathAuthoringInferenceBudget = Object.freeze({
  schemaVersion: "kp.typed-math-authoring-inference-budget.v1",
  measuredAt: "2026-09-02",
  measuredProject: "tsconfig.typed-math-authoring-inference.json",
  fixtureCount: 6,
  measured: Object.freeze({
    types: 34_176,
    instantiations: 40_254
  }),
  ceilings: Object.freeze({
    // Keep enough headroom for TypeScript patch releases without hiding API growth.
    types: 36_000,
    instantiations: 43_000
  })
} as const);
