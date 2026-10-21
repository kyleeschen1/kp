export const typescriptInferenceBudget = Object.freeze({
  schemaVersion: "kp.typescript-inference-budget.v1",
  measuredAt: "2026-10-21",
  fixtureCount: 49,
  libraryBaseline: Object.freeze({
    types: 27_947,
    instantiations: 27_046
  }),
  measuredProject: Object.freeze({
    types: 116_499,
    instantiations: 198_906
  }),
  ceilings: Object.freeze({
    // Issued-draft positive/negative coverage adds 86 instantiations. Keep all
    // 49 consumers and the passing type cap; restore 0.5% rounded headroom.
    // Explicit policy amendment: reviews/2026-10-21-engineering-discipline.md.
    types: 117_700,
    instantiations: 199_900
  })
} as const);
