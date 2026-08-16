export const typescriptInferenceBudget = Object.freeze({
  schemaVersion: "kp.typescript-inference-budget.v1",
  measuredAt: "2026-08-16",
  fixtureCount: 21,
  libraryBaseline: Object.freeze({
    types: 27_947,
    instantiations: 27_046
  }),
  measuredProject: Object.freeze({
    types: 52_864,
    instantiations: 71_006
  }),
  ceilings: Object.freeze({
    // The narrow headroom catches structural growth without treating host timing as stable.
    types: 55_000,
    instantiations: 75_000
  })
} as const);
