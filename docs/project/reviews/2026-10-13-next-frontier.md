# Next frontier: propagation of small changes

User feedback: the affine example works, but revisits material built months ago.
Treat that as acceptance of the desktop candidate, not phone support or approval
of another algebra rollout. Its contribution is bounded source-driven reuse;
it does not demonstrate a new learner capability. This review proposes next
scope only. No new implementation is authorized.

Recommend one explanation of small-change propagation through a composition:
`u = x²`, `y = sin(u)`. Show an input change `h` passing through both functions,
retaining the actual finite change separately from the linear prediction
`dy = cos(u) · 2x · h`. The learner can shrink h, move the base point, and inspect
either local factor without losing the composed relationship.

This should not be a formula-substitution animation. Its new test is whether KP
can explain an approximation: which quantities are exact, where first-order
terms come from, what is omitted, and how error changes with the input change.
In particular, `Δy` and `dy` must not become one semantic object; equality and
approximation must remain distinct. A zero derivative does not imply that all
finite changes vanish. Signed local factors should make reversal intelligible.

## Existing evidence and bounded scope

The code already contains a derivative/secant-tangent asset
(`src/animation/derivative-tangent-adapter.ts`), derivative rules and a chain-rule
family declaration (`src/animation/symbolic-manipulation-families/calculus.ts`),
and differentiable maps/Jacobian projections (`src/math/algebra/`). This is not
a claim that calculus, composition, or local linear maps are new to KP.
The inspected files do not establish the integrated, learner-controlled
finite-change versus differential explanation proposed here.

Retain existing domain authorities and the native equation renderer. Equations
and moving semantic components lead; graphs are optional corroboration. Before
implementation, audit the precise host/renderer path and supported motifs for
the candidate. Unsupported transitions must yield repair gaps. Do not build a
general differentiator, automatic proof search, new layout framework, or broad
calculus library to deliver this one example.

Smallest useful outcome: one composed function, controls for base point and
finite input change, visible exact/predicted output change and residual, local
inspection, and deterministic reversal. Use one ordinary base point and one
where the derivative changes sign or vanishes. Review before generalization.
Ask whether the user can predict the output direction and explain why the
linear prediction gets worse for larger changes. That is a learning hypothesis,
not something browser tests alone establish.

## Alternatives

| Candidate | Authoring/reuse benefit | New explanatory test | Cost/risk | Recommendation |
| --- | --- | --- | --- | --- |
| Small-change propagation | Composes existing calculus/LA foundations | Approximation, error and signed sensitivity | Medium; exact/differential distinction is essential | Next exemplar |
| Select a step and inspect its assumptions | Useful across domains; existing assumption/branch owners exist | Reader-directed validity inspection | Medium; can become another inspector over fixed data | Strong alternative |
| More coefficient variants or new algebra fixtures | Further source coverage | Little beyond current evidence | Low per variant, accumulating maintenance | Stop as default progression |

Subsequent possibilities, not approved scope: compose two local linear maps,
make their Jacobians multiply, then explore reverse accumulation/backpropagation.
This connects existing LA to calculus and optimization through a concrete
operation rather than opening several content libraries.

Planning rule proposed for this next direction: each loop must state the new
reasoning action it enables. Parameter coverage and reliability are supporting
work, not automatically a reason for another visible lesson. The accepted affine
candidate remains preserved; its known phone layout incompatibility stays open.
