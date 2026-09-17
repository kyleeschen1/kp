# Applied mathematics implementation audit

Source inspection: 2026-09-16. Most new curriculum rows are explicitly unaudited.
This records positive evidence and bounded partial support, not a proof that
everything else is absent. Checked rows are bounded semantic/presentation callers;
their examples illustrate scope and are not claims of arbitrary source generation.

## Calculus

- `calc.diff.power`, `motif.calc.power`: [semantic roles](../../../src/semantic/derivative-power-rule-semantics.ts), [semantic tests](../../../tests/kp-derivative-power-rule-semantics.test.ts), [choreography](../../../src/animation/derivative-power-choreography.ts). The existing power-rule authority requires an integer exponent greater than one. Negative/fractional/general-power differentiation remains partial; numerical special cases are not a license to widen that API.
- `calc.diff.dot`, `motif.calc.product`: [force/energy inspection](../threads/2026-09-16-force-energy-inspection.md) records the checked vector self-dot-product derivation, collection and cancellation. It is not evidence for every scalar product or chain rule.
- `calc.int.power`: [governed fixture](../../../src/authoring/governed-integration-power-rule-fixture.ts), [semantic tests](../../../tests/kp-antiderivative-power-rule-semantics.test.ts). Partial pending exact complete presentation/authoring scope audit. The exceptional 1/x antiderivative is a separate row.
- `calc.multi.partial`, `.total`, `.direction`, `.gradient`, `.tangent` and `motif.calc.contour`: [quadratic model tests](../../../tests/gradient-contour-model.test.ts), [sequence and rendered annotation tests](../../../tests/gradient-contour-sequence.test.ts), [production browser checks](../../../tests/gradient-contour-production.browser.spec.ts). The quadratic source supplies local derivatives, unit-direction comparison, gradient and level-curve relationships. The model explicitly distinguishes a straight tangent step from a finite constant-height path, and a stationary point has no fabricated unique uphill direction. These are bounded tutorial capabilities, not arbitrary surface authoring.

## Linear algebra

- `la.matrix.multiply-vector`, `.columns`, `.rows`, `motif.la.row-column`: [canonical asset](../../../tests/matrix-linear-map-canonical-asset.test.ts), [semantics and shared equation/graph target](../../../tests/matrix-linear-map-semantics.test.ts), [SVG tests](../../../tests/matrix-linear-map-svg.test.ts). The exact matrix [[2,1],[0,3]] acting on [4,5] produces [13,15]. Columns are mapped domain-basis vectors; rows are output-coordinate functionals. Equation and graph views share the operation/timeline. This is stronger evidence than the previous semantic-only row, but does not promote every matrix size, basis change or decomposition.
- Projection, rank, eigenvectors, SVD and least squares remain unaudited at the listed scope. The mathematical existence of a matrix kernel is not a presentation certificate for those topics.

## Probability and statistics

- `prob.joint`, `.marginal`, `.condition`, `.bayes`, `.tree-reorder`, and both binary-population motifs: [binary model tests](../../../tests/bayesian-reasoning-model.test.ts), [tree semantic sampling and SVG tests](../../../tests/bayesian-reasoning-tree.test.ts), [publication](../../../tests/bayesian-reasoning-publication.test.ts). The ticket source uses prior 1/5 and likelihoods 4/5 and 1/10. Its four exact joint masses survive population normalization and event-order changes. Conditioning on the flag yields 2/3. Do not extend this check to arbitrary event graphs, continuous Bayesian inference, intervention, or statistical estimation.
- `prob.zero-condition`: the binary model handles zero joint outcomes without inventing branches, but the requested general explanation of undefined conditioning is not established; partial.
- Statistics rows are unaudited. A visually represented distribution does not establish sampling design, confidence intervals, hypothesis tests or causal interpretation.

## Differential equations, optimization and numerical methods

These are a scoped curriculum first pass, not an implementation-completeness
audit. Rows remain unaudited. In particular, a gradient illustration does not
establish a gradient-descent solver, convergence argument or optimization lesson.
An animation's numerical interpolation is not evidence for a curriculum-level
numerical-analysis capability. Introductory PDE and Fourier rows mark a boundary;
advanced PDE theory remains excluded in the scope document.

## Shared mathematics

Algebra rows own general fraction/logarithm manipulations; domain rows own their
use under additional assumptions. A worked integral, ODE or statistical derivation
may reference both. The existence of all isolated steps would still leave
composition, explanatory text coordination and domain proof obligations to check.
