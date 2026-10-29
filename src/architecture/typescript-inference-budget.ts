export const typescriptInferenceBudget = Object.freeze({
  schemaVersion: "kp.typescript-inference-budget.v1",
  measuredAt: "2026-10-29",
  fixtureCount: 49,
  libraryBaseline: Object.freeze({
    types: 27_947,
    instantiations: 27_046
  }),
  measuredProject: Object.freeze({
    types: 116_885,
    instantiations: 200_009
  }),
  ceilings: Object.freeze({
    // Rendering changes since the October 21 baseline add 1,103 instantiations.
    // Retain all 49 consumers and the passing type cap; restore 0.5% headroom.
    // Explicit policy amendment: reviews/2026-10-29-algebra-api-retirement.md.
    types: 117_700,
    instantiations: 201_100
  })
} as const);
