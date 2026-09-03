export const typescriptInferenceBudget = Object.freeze({
  schemaVersion: "kp.typescript-inference-budget.v1",
  measuredAt: "2026-09-03",
  fixtureCount: 44,
  libraryBaseline: Object.freeze({
    types: 27_947,
    instantiations: 27_046
  }),
  measuredProject: Object.freeze({
    types: 106_981,
    instantiations: 181_525
  }),
  ceilings: Object.freeze({
    // The approved family-core checkpoint gives the attributed direct-owner
    // fixture 2% type and 3% instantiation headroom, rounded to hundreds.
    types: 109_200,
    instantiations: 187_000
  })
} as const);
