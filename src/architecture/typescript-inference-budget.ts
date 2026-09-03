export const typescriptInferenceBudget = Object.freeze({
  schemaVersion: "kp.typescript-inference-budget.v1",
  measuredAt: "2026-09-03",
  fixtureCount: 42,
  libraryBaseline: Object.freeze({
    types: 27_947,
    instantiations: 27_046
  }),
  measuredProject: Object.freeze({
    types: 103_192,
    instantiations: 172_704
  }),
  ceilings: Object.freeze({
    // The post-derived-binding baseline keeps direct-owner fixtures and gives
    // the approved remaining graph work narrow, explicit compiler headroom.
    types: 106_300,
    instantiations: 181_400
  })
} as const);
