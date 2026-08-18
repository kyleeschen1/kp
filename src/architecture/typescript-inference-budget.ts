export const typescriptInferenceBudget = Object.freeze({
  schemaVersion: "kp.typescript-inference-budget.v1",
  measuredAt: "2026-08-18",
  fixtureCount: 21,
  libraryBaseline: Object.freeze({
    types: 27_947,
    instantiations: 27_046
  }),
  measuredProject: Object.freeze({
    types: 53_903,
    instantiations: 72_992
  }),
  ceilings: Object.freeze({
    // The narrow headroom catches structural growth without treating host timing as stable.
    types: 55_000,
    instantiations: 75_000
  })
} as const);
