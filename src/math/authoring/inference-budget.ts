export const kpTypedMathAuthoringInferenceBudget = Object.freeze({
  schemaVersion: "kp.typed-math-authoring-inference-budget.v1",
  measuredAt: "2026-09-02",
  measuredProject: "tsconfig.typed-math-authoring-inference.json",
  fixtureCount: 5,
  measured: Object.freeze({
    types: 32_313,
    instantiations: 34_388
  }),
  ceilings: Object.freeze({
    // Keep enough headroom for TypeScript patch releases without hiding API growth.
    types: 34_000,
    instantiations: 37_000
  })
} as const);
