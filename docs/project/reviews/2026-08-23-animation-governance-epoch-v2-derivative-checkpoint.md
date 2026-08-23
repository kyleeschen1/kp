# Animation Governance Epoch v2 Derivative Checkpoint

Status: canonical exemplar at mandatory human checkpoint
Prepared: 2026-08-23
Run contract: `run-contract.kp.animation.animation-governance-epoch-v2-approved`

## Outcome

The approved 30-slice governance epoch has reached its final visual gate. The
derivative power-rule exemplar now compiles through equation grammar v2 while
retaining the authored three-state explanation:

\[
\frac{d}{dx}x^3 \longrightarrow 3x^{3-1} \longrightarrow 3x^2.
\]

The v2 compiler binds the existing power-rule operation and the authored
`simplifyConstantDifference` evaluation as two distinct semantic transitions. It adds
no renderer, timing, path, glyph inference, or caller-owned presentation.

## Canonical Boundary

| Concern | Authority |
| --- | --- |
| Artifact | `animation.generated.calculus.derivative.power-rule-x-cubed` |
| Host | Internal Studio Animation Catalogue |
| Canonical URL | `/?artifact=animation.generated.calculus.derivative.power-rule-x-cubed&playhead=0` |
| Renderer | `editor-animation-surface.equation.katex` |
| Semantic source | `src/semantic/generated-calculus-problem-fixture.ts` plus `src/semantic/derivative-power-rule-semantics.ts` |
| Presentation source | `src/animation/derivative-power-choreography.ts` |
| Accepted visual baseline | commit `31a609b0` |

The stable asset ID alone does not establish this host or renderer. Human
review should use the Catalogue URL above and the repository-owned
`npm run visual:derivative-power` capture command.

## Baseline Comparison

The semantic fixture, correspondence, choreography, selector-annotated KaTeX,
browser lifecycle contract, and visual capture script have no diff from
`31a609b0`. The slice changes only governance compilation and generated
evidence. The preserved observable contract is:

- the derivative operator is consumed only after its action is legible;
- the base `x` remains one continuant;
- the source exponent branches into coefficient and decrement-input roles;
- `3-1` remains an explicit middle state and resolves through registered
  subtraction evaluation;
- playback, direct seek, rewind, and native settlement reach the same states;
- glyph paint stays flat 2D, without scale or text-shadow material treatment.

## Verification Evidence

- `npm run test:equation-derivative-power-migration-v2` — 11 passed;
- `npm run test:differentiation-exemplar` — 26 passed;
- `npm run test:equation-surface-preservation` — 11 passed;
- `npm run test:browser:differentiation-exemplar` — 2 Chromium lifecycle and
  direct-restoration checks passed;
- `npm run visual:derivative-power` — seven deterministic review frames and a
  flat-glyph manifest produced;
- `npm run build` — typecheck, Svelte diagnostics, domain checks, publication
  freshness, and the production bundle passed;
- generated governance inventory, conformance manifest, reverse dependencies,
  conformance registrations, authority graph, and preservation matrix are
  current.

`npm run verify:equation:release` remains red at the pre-existing strict
inference ceiling: 91,745 types and 149,050 instantiations, both below the
run-entry quarantine of 93,651 and 150,979. No ceiling was raised. A direct
continuation through the broad unit suite passed 5,678 of 5,743 tests; the
remaining failures include sandbox-only listen `EPERM` cases and stale global
inventories and baselines outside this bounded visual checkpoint. Theseus
records the gate as failed rather than treating classification as release
closure. Passing focused automation is not human visual approval.

## Human Review

Review what owns attention during exponent branching, whether the operator
withdrawal remains legible, whether the explicit `3-1` state reads as one
causal beat, and whether the registered evaluation handoff feels continuous
through forward play, direct seeking, and rewind. Exact cadence, paths,
contrast, and optical treatment remain exemplar-local until approved.

Stop before a second caller, shared differentiation profile, timing
generalization, or family promotion.

## Conditional Expansion Order

If this checkpoint is approved, the next animation-family order is:

1. pressure differentiation with one structurally different sum or
   constant-multiple caller and promote only the laws both callers prove;
2. build one independently reversible integration exemplar and stop at its
   own human checkpoint;
3. pressure integration with a second caller before narrow promotion; and
4. return to the bounded Graph3D semantic-scene proof as separate spatial
   mathematics work, not symbolic material depth.

Fraction structural repair, Graph2D function translation, legacy Direct
case-ledger migration, material-depth promotion, and broad catalogue rollout
remain deferred.

## Preservation And Rollback

Preserve the verified semantic trace, exact endpoint mathematics, stable IDs,
Catalogue URL, Native KaTeX geometry, deterministic clock, case-ledger gaps,
and flat-2D baseline. The independently reversible rollback unit is the final
governance slice commit; rollback must not remove the earlier reviewed
derivative exemplar.
