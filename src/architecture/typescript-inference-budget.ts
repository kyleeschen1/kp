export const typescriptInferenceBudget = Object.freeze({
  schemaVersion: "kp.typescript-inference-budget.v1",
  measuredAt: "2026-09-09",
  fixtureCount: 48,
  libraryBaseline: Object.freeze({
    types: 27_947,
    instantiations: 27_046
  }),
  measuredProject: Object.freeze({
    types: 112_727,
    instantiations: 193_102
  }),
  ceilings: Object.freeze({
    // R4B's versioned compiler is now exercised by all existing core consumers.
    // Retain fixed 2% type and 3% instantiation headroom, rounded to hundreds.
    types: 115_000,
    instantiations: 198_900
  })
} as const);
