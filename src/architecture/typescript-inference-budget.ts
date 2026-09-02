export const typescriptInferenceBudget = Object.freeze({
  schemaVersion: "kp.typescript-inference-budget.v1",
  measuredAt: "2026-09-02",
  fixtureCount: 30,
  libraryBaseline: Object.freeze({
    types: 27_947,
    instantiations: 27_046
  }),
  measuredProject: Object.freeze({
    types: 98_881,
    instantiations: 164_998
  }),
  ceilings: Object.freeze({
    // The 30-fixture baseline includes the direct Native KaTeX compositor
    // contract closure; narrow headroom still exposes structural API growth.
    types: 103_000,
    instantiations: 176_000
  })
} as const);
