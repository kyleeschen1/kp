# KP Symbolic Manipulation Animation Library Plan

Status: accepted
Date: 2026-07-14

## Context

KP has closed the first animation-library expansion loop. The project now has
`AnimationAsset`, semantic transformations, runtime frames, visual frames,
generated problem fixtures, graph/vector runtime consumers, flashcard renderer
samples, paused-frame drill-down data, and dashboard progress rows.

The next risk is breadth without structure. KP should not grow by hand-making
isolated visual demos. It should grow by modeling the major symbolic
manipulations that recur across algebra, calculus, linear algebra, and their
graphical equivalents.

## Decision

Make the major symbolic manipulation library the current long-term KP plan.
Each manipulation family should be modeled as a reusable semantic animation
asset family, not as a one-off rendered effect.

Each family should provide:

1. semantic object and selector shapes;
2. `SemanticTransformation` definitions with provenance and correspondence;
3. identity and persistence rules;
4. default visual motifs;
5. runtime-frame and visual-frame samples;
6. graphical equivalents where mathematically honest;
7. law checks for reference closure, rewind, correspondence, and
   representation preservation;
8. dashboard/search rows;
9. generated problem and flashcard hooks when the family is ready.

The first library expansion should cover canonical transformations across:

- algebra: both-sides operations, cancellation, combine like terms,
  distribution/factoring, fractions, exponent/log laws, wrapping, and
  inequalities;
- calculus: limits, derivative rules, integrals, FTC, tangent/area views,
  Taylor/local linearization, gradient, Jacobian, Hessian, and optimization;
- linear algebra: vector add/scale, dot product, projection, matrix-vector,
  matrix-matrix as composed dot products, row operations, determinant as
  area/volume scaling, inverse, basis change, eigenvectors/eigenvalues, and
  diagonalization;
- graphical equivalents: equation-to-graph, symbolic transform mirrored as
  graph transform, derivative as tangent, integral as area, matrix as linear
  map, Jacobian as local linear map, and Hessian as curvature/quadratic form.

## Consequences

- The next long loop should start with library schemas and canonical families,
  not with visual polish.
- Graphical equivalents must preserve provenance honestly. Sampled graph data
  can show samples and fits, but cannot pretend to be exact symbolic math.
- Matrix multiplication and similar higher-order operations should be modeled
  compositionally, for example as dot-product subanimations.
- Flashcards, generated problems, dashboard rows, and paused-frame drill-downs
  should project from the same animation assets rather than becoming separate
  lesson markup.
- Renderer work should consume runtime and visual frames. It should not own
  semantic timing or identity.

## Near-Term Execution Shape

The next executable loop should create a small but representative library:

- one shared symbolic manipulation family schema;
- algebra families for both-sides operations, cancellation, distribution,
  factoring, fraction simplify, exponent laws, log/exp inverse, and
  inequalities;
- calculus families for derivative rules, integrals/FTC, Taylor/local
  linearization, Jacobian/Hessian, and optimization;
- linear algebra families for vectors, dot products, projections,
  matrix-vector, matrix-matrix, row operations, determinant, inverse, basis
  change, and eigen examples;
- graphical equivalent assets for equation graphs, tangent/area views, vector
  transforms, local linear maps, and curvature views;
- dashboard rows, generated problem registry links, flashcard hooks, and
  readiness reporting.

## Non-Goals

- Do not build a full CAS.
- Do not prove every theorem inside KP.
- Do not make graphical views a separate animation system.
- Do not add media encoders or dynamic package loading in this tranche.
- Do not polish every visual motif before the semantic family contracts are
  reusable.
