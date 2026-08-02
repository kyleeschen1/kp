# Animation Catalogue Seam Atlas and Provisional Queue

Date: 2026-08-01
Status: updated after native generated solve-x integration

## Outcome

The internal catalogue now has one row for each of 36 concrete lazy-loadable
assets across 12 packs. The catalogue load probe loaded and routed every row:
34 meaningfully painted through a native adapter, two stopped at explicit
programming capability gaps, none failed loading, and none used an iframe. The
Graph3D surface transition now uses the bounded lazy Three.js adapter over its
semantic SVG fallback and shared WebGL lease pool.

This collapses most of the apparent port backlog while correcting one earlier
false positive. There is no catalogue-host port to perform for the 34
meaningfully painted assets. The remaining observed hosting seam is
programming, shared by one pure execution trace and one composite comparison.

Every human disposition remains `Unreviewed`. The final column below is a
provisional question, not approval: `Keep?` means only that the asset is
hostable and ready for visual/content review; `Repair?` identifies observed
missing capability; and `Keep or Retire?` identifies ambiguous authored intent.

## Atlas

| Concrete asset | Pack | Surface | Observed host | Contexts | Provisional question |
| --- | --- | --- | --- | ---: | --- |
| `animation.comparison.jacobian-hessian` | comparison | equation | Painted · KaTeX | 1 | Keep? |
| `animation.comparison.linear-solve-programming` | comparison | composite | Gap · programming adapter | 1 | Repair? |
| `animation.derivative-rules.tangent-graph` | graph | graph | Painted · SVG graph | 3 | Keep? |
| `animation.dot-projection.basic` | graph | graph | Painted · SVG graph | 3 | Keep? |
| `animation.economics.supply-demand-equilibrium-shift` | economics | graph | Painted · exact SVG graph | 1 | Approved exemplar |
| `animation.exact-fraction-quantity.third-plus-sixth` | exact-quantity | diagram | Painted · synchronized fraction | 1 | Keep? |
| `animation.generated.add-zero` | generated-drafts | equation | Painted · KaTeX | 1 | Keep? |
| `animation.generated.calculus.derivative.power-rule-x-cubed` | generated-problems | equation | Painted · KaTeX | 3 | Keep? |
| `animation.generated.calculus.derivative.sum-rule-polynomial` | generated-problems | equation | Painted · KaTeX | 1 | Keep? |
| `animation.generated.calculus.integral.power-rule-quadratic` | generated-problems | equation | Painted · KaTeX | 1 | Keep? |
| `animation.generated.distribution.expand-a-sum` | algebra | equation | Painted · KaTeX | 4 | Keep? |
| `animation.generated.distribution.factor-common-a` | algebra | equation | Painted · KaTeX | 3 | Keep? |
| `animation.generated.exponent.square-as-product` | algebra | equation | Painted · KaTeX | 3 | Keep? |
| `animation.generated.fraction-expression.two-fourths` | algebra | equation | Painted · KaTeX | 3 | Keep? |
| `animation.generated.function-wrap.apply-f` | algebra | equation | Painted · KaTeX | 3 | Keep? |
| `animation.generated.linear-algebra.dot-product.three-vector` | generated-problems | equation | Painted · KaTeX | 1 | Keep? |
| `animation.generated.linear-algebra.matrix-matrix.two-by-two` | generated-problems | equation | Painted · KaTeX | 3 | Keep? |
| `animation.generated.linear-algebra.matrix-vector.two-by-two` | generated-problems | equation | Painted · KaTeX | 3 | Keep? |
| `animation.generated.linear-solve.linear-68c15d41` | algebra | equation | Painted · verified native KaTeX | 2 | Keep? |
| `animation.generated.pipeline-diagram` | generated-drafts | diagram | Painted · SVG diagram | 1 | Keep? |
| `animation.generated.radical.square-root-as-power` | algebra | equation | Painted · KaTeX | 5 | Keep? |
| `animation.generated.substitute-three` | generated-drafts | equation | Painted · KaTeX | 1 | Keep? |
| `animation.generated.substitute-three.provisional-incorrect` | generated-drafts | equation | Painted · KaTeX | 1 | Keep or Retire? |
| `animation.graph.surface-mode.mesh-to-donut` | graph | graph | Painted · lazy WebGL / semantic SVG | 1 | Keep? |
| `animation.graph.vector.linear-map-scale` | graph | graph | Painted · SVG graph | 3 | Keep? |
| `animation.inequality.sign-flip.basic` | algebra | equation | Painted · KaTeX | 3 | Keep? |
| `animation.integral-ftc.area-sweep` | graph | graph | Painted · SVG graph | 3 | Keep? |
| `animation.linear-solve.solve-x` | algebra | equation | Painted · KaTeX | 7 | Keep? |
| `animation.operation-evaluation.five-plus-two` | operation-evaluation | equation | Painted · native KaTeX operation | 1 | Keep? |
| `animation.operation-evaluation.one-plus-two` | operation-evaluation | equation | Painted · native KaTeX operation | 2 | Keep? |
| `animation.operation-evaluation.three-sixths` | operation-evaluation | equation | Painted · native KaTeX operation | 1 | Keep? |
| `animation.place-value-addition.278-plus-156` | place-value | diagram | Painted · synchronized place value | 2 | Keep? |
| `animation.physics.constant-force-work-energy` | physics | graph | Painted · exact SVG graph/diagram | 1 | Approved exemplar |
| `animation.programming.add.execution-trace` | programming | programming | Gap · programming adapter | 1 | Repair? |
| `animation.sample.fourier-transform-pair` | complex-katex | equation | Painted · KaTeX | 1 | Keep? |
| `animation.sample.fundamental-theorem-calculus` | complex-katex | equation | Painted · KaTeX | 3 | Keep? |

## Shared Seams

The catalogue crosses five surface shapes: 24 equation, seven graph, three
diagram, one composite, and one programming asset. Adapter reuse is strong:
the general KaTeX adapter participates in 22 rows, the SVG graph adapter in six,
the canonical operation-evaluation adapter in three, the bounded Graph3D
adapter in one, and three specialized diagram adapters each cover one row.
This is evidence for keeping the adapter registry seam, not for inventing a
universal renderer.

The meaningful-hostability correction is recorded in
`docs/project/reviews/2026-08-01-animation-catalogue-meaningful-hostability-contract.md`.
The prior SVG adapter did not render 3D semantic content; plot chrome alone no
longer counts as paint.

The exact-fraction caller pressure-tested the shell without a caller-specific
exception. It demonstrates a useful specialized adapter boundary, but it is
not a new canonical-port candidate merely because it rendered successfully.

## Context Consolidation Queue

The 36 assets currently carry 78 related display contexts: 55 editor, 17 card,
four reader, and two diagnostic. These contexts stay under Details and do not
mint additional catalogue rows.

The highest-information consolidation audits are:

1. `animation.linear-solve.solve-x`: seven contexts across editor, card,
   reader, and diagnostic hosts;
2. `animation.generated.radical.square-root-as-power`: five contexts;
3. `animation.generated.distribution.expand-a-sum`: four contexts;
4. thirteen assets with three contexts each.

Seven display entries labelled playable still do not resolve to concrete
loadable assets. They remain compatibility evidence, not confirmed duplicates:

- `animation.divide-both-sides.solve-3x-equals-12`
- `animation.foldable-distribution.collect-like-terms`
- `animation.fraction-composition.two-thirds-solve`
- `animation.fractional-linear.solve-x-over-2`
- `animation.fractional-linear.x-over-2.balanced-proof`
- `animation.fractional-linear.x-over-2.fluent-projection`
- `animation.numerator-split-merge.round-trip`

Each needs a human `Keep`, `Merge`, `Canonical port`, or `Retire` decision
before any route is removed. The current inventory does not prove that any two
are semantically interchangeable.

## Evidence-Ranked Port Hypotheses

1. Define the programming execution-trace semantic model and canonical visual
   exemplar. Information gain is high because the execution trace does not yet
   exist as a verified catalogue surface. This is the long pole, not shell
   wiring.
2. Add one programming surface adapter for
   `animation.programming.add.execution-trace`. Once the trace contract exists,
   the catalogue port itself should be bounded and relatively fast.
3. Reuse that adapter in
   `animation.comparison.linear-solve-programming` and verify synchronized
   composite timing. This tests whether the seam genuinely crosses callers.
4. Stop. The inventory currently supplies no evidence for another canonical
   port. Review and context consolidation should choose the next candidate.

This order answers the verification concern directly: implementing only a host
would be fast but would certify nothing useful. Establishing execution-trace
semantics, choreography, and acceptance evidence is the larger piece.

## Morning Review

The next session should browse the running catalogue and decide, in batches:

1. which painted assets are credible `Keep` candidates versus visually or
   semantically in need of `Repair`;
2. whether the provisional-incorrect substitution is an intentional teaching
   artifact or a retirement candidate;
3. whether the programming execution trace is the next approved exemplar;
4. which high-fan-out contexts carry unique value before consolidation.

The economics and physics rows were added afterward as bounded cross-domain
exemplars. No public-site, LLM explanation, route deletion, universal renderer,
canonical port, or human disposition assignment was performed.

## Cross-Domain API Audit

The two approved exemplars now justify promoting only reversible presentation
progress, the dimensional-continuity graph profile, fixed moving-value display,
and bounded integer query encoding. Their models, narratives, SVG compositions,
and parameter-to-model construction remain domain-owned. The executable tier
classification and pruning boundary are recorded in
`src/architecture/cross-domain-animation-api-audit.ts` and
`docs/project/reviews/2026-08-01-cross-domain-api-motif-audit.md`.
