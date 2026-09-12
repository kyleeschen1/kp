# Gradient → mechanics: reuse boundary, not a promoted family

This handoff preserves the accepted mechanics-from-zero priority and independent
mathematics reuse. It does not start mechanics content, move gradients ahead of
position/displacement prerequisites, or introduce a universal transformation type.

## What actually exists

`gradient-contour-model.ts` checks a bounded quadratic source, then derives its
height, notation and gradient from the same expression. `compileGradient` in
`src/math/expression.ts` differentiates the expression and compiles those
derivatives for numerical evaluation. `gradientLocalHeight` is explicitly
distinct from true field height. `gradientStraightStep` exposes both predicted
first-order and actual finite change. Unit-direction construction plus runtime
norm checks enforce fair comparisons; stationary points have a separate result.

The current model accepts a,b in [0.25,4] and point coordinates in [-1.5,1.5].
The authored lesson is narrower: positive x/y, field height in [0.25,4], a regular
point and a satisfied readable-stage fit. Other mathematically valid cases are
pedagogical repair gaps, not permission to reuse a false compass explanation.
See the model, authoring and sequence tests; 19 focused checks passed on handoff.

Canonical host: `/experiments/kinetic-figure/gradient-contour/`.
Canonical paint: the shared surface-contour Graph3D stage plus its gradient
explanatory SVG overlay. Semantic truth: the checked model/source expression,
not sampled pixels, camera state, passage wording or independently supplied LaTeX.

## Meaning that must survive extraction

For f(x,y)=a x²+b y² at p and a small displacement h:

- The differential df at p is the linear map h ↦ ∇f(p)·h in these Cartesian,
  equal-distance Euclidean coordinates.
- The local model is L(p+h)=f(p)+∇f(p)·h, not a replacement for f.
- For this quadratic, the remainder is exactly a h_x²+b h_y² as an algebraic
  identity. Implemented number evaluation uses floating-point tolerances.
- A unit direction maximizes the first-order rate when aligned with a nonzero
  gradient. A contour tangent has zero first-order rate, not generally zero
  finite straight-step change. Curved travel on the level set is different.
- At a stationary point, no unique first-order uphill direction is fabricated.

Do not label a numerical sample “exact proof.” Keep symbolic identity, numerical
evidence and first-order approximation distinguishable in objects, operations,
prose and exports. Outside orthonormal Euclidean coordinates, identifying the
differential with a gradient vector needs an explicit metric; do not silently
generalize the current dot-product formula to arbitrary coordinates.

## Proposed joint for a real second caller

Separate reusable mathematics from pedagogical context when the second caller
demonstrates the seam:

| Owner | Reusable truth / caller-specific responsibility |
| --- | --- |
| Field and point | Expression revision, point identity, coordinate frame and quantity units |
| Differential evidence | Derivative construction, assumptions, evaluated covector/gradient, regular/stationary result |
| Local approximation | Base point, linear map and explicit remainder/validity claim |
| Domain binding | What the field measures and why the operation answers this question |
| Score and projection | Motivation, prerequisite bridges, attention order, native motif and accessible reading |

Candidate future mechanics question: “Why does a conservative force point down
potential energy?” Bind F=−∇V with explicit force/energy/distance units and the
conservative-potential assumption. Do not confuse force with velocity, infer an
entire trajectory from one vector, or rename the current height lesson as physics.
It requires its own motivation and negative-gradient reasoning; the present
first-quadrant uphill story cannot simply be reused verbatim.

Issue serializable data through the checked immutable asset seam where applicable;
reconstruct executable domain models through their checked compiler. Never try
to serialize/freeze renderer handles or executable closures as plain asset data.
Register semantic objects/operations and correspondence through existing governed
construction; keep domain evidence separate from law-reference labels. A future
renderable differential family is not promoted merely because these functions
or a LaTeX expression exist.

## Promotion and repair requirements

Before shared-family promotion, demonstrate the independent mathematics reading
and one mechanics caller sharing evidence but retaining distinct motivation.
Pressure source changes, signs/quadrants, unequal slopes, stationary repair,
units, derivative/remainder checks and exact return. Use the established native
stage/motif; unsupported pedagogy or paint must return a repair gap. Human review
selects new visual treatment before broader promotion, per the generation entrypoint.

Shared style/motion repairs belong to their existing owners. Recompile projections
from source; issue new immutable byte editions rather than mutating old ones.
The gradient's actual 3D camera transition still has a documented low-powered
CPU limitation: see `2026-09-12-gradient-runtime-acceptance.md`. Do not use reuse as
an excuse to certify that limitation away or add another camera/renderer path.

References: `../principles/system-vocabulary.md`,
`../authoring/llm-generation-entrypoint.md`, `2026-09-11-mechanics-from-zero-curriculum.md`,
`2026-09-12-transformation-law-enforcement.md`,
`2026-09-12-static-edition-repair-workflow.md`.
