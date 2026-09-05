export const typescriptInferenceBudget = Object.freeze({
  schemaVersion: "kp.typescript-inference-budget.v1",
  measuredAt: "2026-09-04",
  fixtureCount: 45,
  libraryBaseline: Object.freeze({
    types: 27_947,
    instantiations: 27_046
  }),
  measuredProject: Object.freeze({
    types: 110_237,
    instantiations: 190_072
  }),
  ceilings: Object.freeze({
    // The approved aggregate-core checkpoint gives the attributed direct-owner
    // fixture 2% type and 3% instantiation headroom, rounded to hundreds.
    types: 112_500,
    instantiations: 195_800
  })
} as const);
