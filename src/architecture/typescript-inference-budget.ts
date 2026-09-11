export const typescriptInferenceBudget = Object.freeze({
  schemaVersion: "kp.typescript-inference-budget.v1",
  measuredAt: "2026-09-10",
  fixtureCount: 49,
  libraryBaseline: Object.freeze({
    types: 27_947,
    instantiations: 27_046
  }),
  measuredProject: Object.freeze({
    types: 115_317,
    instantiations: 197_053
  }),
  ceilings: Object.freeze({
    // Approved algebra-v2 release: restore 2% only for the exceeded type cap.
    // Preserve the passing instantiation cap and all 49 core consumers.
    types: 117_700,
    instantiations: 198_900
  })
} as const);
