# Semantic Material Motion And Performance Long-Loop Proposal

Date: 2026-07-17  
Status: awaiting explicit execution approval  
Target: `workflow.kp.dashboard-animation-system`

## Goal

Replace generic equation fades and partial-copy choreography with governed,
materially continuous semantic operations while establishing bundle and frame
performance boundaries before the new motif family expands.

## Ordered Slices

### 1. Materialize the approved run contract

Target: `next-action.kp.material-motion.record-contract-v0`  
Change: create the 30-slice run contract and preserve the accepted boundaries.  
Risk: low. Verification: standard.  
Checks: `npm run theseus -- validate`; `npm run theseus -- run-contract-hygiene-report`.  
Commit: decision, proposal, graph nodes, and contract only.  
Stop if: the approved slice order or boundaries differ from this proposal.

### 2. Establish reproducible performance baselines

Target: `next-action.kp.material-motion.performance-baseline-v0`  
Change: add production bundle, initial-request, hydration, and throttled-frame
measurements with stored budgets.  
Risk: low. Verification: broad plus manual/runtime.  
Checks: `npm run build`; new focused performance harness; `npm run typecheck`.  
Commit: harness, scripts, baseline, and focused tests.  
Stop if: headless measurements cannot be made deterministic enough to gate.

### 3. Defer Three.js until a visible 3D surface needs it

Target: `next-action.kp.material-motion.lazy-three-v0`  
Change: remove unconditional WebGL hydration/import while preserving 3D startup.  
Risk: medium. Verification: broad.  
Checks: focused WebGL loading browser test; `npm run typecheck`; Theseus validate.  
Commit: loader boundary, browser evidence, and graph evidence.  
Stop if: deferral requires a general graph-renderer rewrite.

### 4. Separate catalog metadata from asset construction

Target: `next-action.kp.material-motion.catalog-metadata-v0`  
Change: make lightweight descriptors inspectable without constructing every asset.  
Risk: medium. Verification: standard.  
Checks: animation catalog/library tests; typecheck; Theseus validate.  
Commit: metadata contract, compatibility adapter, and tests.  
Stop if: public SDK identity or selection persistence would break.

### 5. Load animation families as capability packs

Target: `next-action.kp.material-motion.lazy-family-packs-v0`  
Change: dynamically load selected equation, graph, diagram, and programming
families at editor/dashboard boundaries.  
Risk: high. Verification: broad.  
Checks: editor library browser suite; build chunk inspection; typecheck; validate.  
Commit: loader registry, migrated call sites, and loading tests.  
Stop if: the split creates a second catalog or changes stable asset ids.

### 6. Remove diagnostics reconstruction from the frame loop

Target: `next-action.kp.material-motion.diagnostics-cadence-v0`  
Change: sample animation every frame but update diagnostics at a bounded cadence
or on semantic changes.  
Risk: medium. Verification: broad.  
Checks: player/diagnostics tests; editor animation browser suite; frame harness.  
Commit: cadence seam and regression evidence.  
Stop if: authoring or accessibility state becomes stale or nondeterministic.

### 7. Cache playback nodes and premeasure geometry

Target: `next-action.kp.material-motion.premeasured-hot-path-v0`  
Change: cache stable DOM references and geometry outside active motion; keep the
hot path primarily transform/opacity writes.  
Risk: high. Verification: broad plus manual/runtime.  
Checks: equation renderer tests; overflow/visual browser suites; frame harness.  
Commit: cache lifecycle, invalidation rules, comments explaining ordering, tests.  
Stop if: caching permits stale geometry after content, font, or resize changes.

### 8. Define and freeze render-quality tiers

Target: `next-action.kp.material-motion.quality-tiers-v0`  
Change: add auto/full/balanced/efficient independently from motion accessibility,
persist overrides, and freeze a tier for each playback.  
Risk: medium. Verification: standard plus browser.  
Checks: quality selection unit tests; editor persistence browser checks; typecheck.  
Commit: quality state, resolver, controls, and tests.  
Stop if: a quality tier changes semantic steps, witnesses, or duration.

### 9. Add a static animation cost model

Target: `next-action.kp.material-motion.cost-model-v0`  
Change: estimate token, simultaneous-group, fragment, shadow, and 3D costs before
rendering and emit actionable compiler diagnostics.  
Risk: medium. Verification: standard.  
Checks: new cost-model tests; typecheck; Theseus validate.  
Commit: pure cost model, budgets, diagnostics, and tests.  
Stop if: the model requires browser geometry or runtime timing to compile.

### 10. Define the canonical-operation registry

Target: `next-action.kp.material-motion.operation-registry-v0`  
Change: register roles, lineage, ownership, laws, witnesses, reverse meaning,
motifs, pacing, costs, and fixtures through one extensible contract.  
Risk: high. Verification: standard.  
Checks: registry validation/composition tests; typecheck; Theseus validate.  
Commit: registry types, core registrations, extension law tests.  
Stop if: the registry duplicates semantic transformation truth.

### 11. Enforce the author/compiler authority boundary

Target: `next-action.kp.material-motion.author-compiler-boundary-v0`  
Change: accept operation, roles, lineage, ownership, salience, explanation depth,
and epistemic status while preventing raw primitive/keyframe authority.  
Risk: high. Verification: broad.  
Checks: authoring contract and rejected-draft tests; typecheck; browser smoke.  
Commit: schema/compiler boundary, diagnostics, and examples.  
Stop if: legacy generated drafts cannot receive explicit compatibility diagnostics.

### 12. Generalize the material-junction primitive

Target: `next-action.kp.material-motion.material-junction-v0`  
Change: compile fine annotations into correct-Gestalt source/target bundles with
operation-specific anchors, measured refinement, readiness, and native settlement.  
Risk: high. Verification: broad plus manual/runtime.  
Checks: junction planner tests; KaTeX transition/browser tests; visual inspection.  
Commit: planner, sampler, DOM realization, and conformance fixture.  
Stop if: implementation depends on unsafe private KaTeX internals.

### 13. Port the normative radical transition

Target: `next-action.kp.material-motion.radical-normative-port-v0`  
Change: make the generated fractional-exponent/radical animation use the original
shared-bundle geometry and handoff while retaining granular semantics.  
Risk: high. Verification: broad plus manual/runtime.  
Checks: focused radical tests; editor visual browser suite; progress screenshots.  
Commit: radical adapter, material grouping, and exact baseline evidence.  
Stop if: the original exemplar cannot remain the visual source of truth.

### 14. Gate radical continuity and settlement

Target: `next-action.kp.material-motion.radical-conformance-v0`  
Change: gate forward/reverse grouping, diagonal corner transfer, clipping,
font continuity, native settlement, and no whole-structure scaling.  
Risk: medium. Verification: broad.  
Checks: KaTeX browser suite; editor animation visual/overflow suites; build.  
Commit: conformance evaluator, baselines, and browser assertions.  
Stop if: screenshot tolerances conceal a visible discontinuity.

### 15. Define successor synthesis

Target: `next-action.kp.material-motion.successor-synthesis-v0`  
Change: plan input convergence, catalyst roles, readiness-gated target birth, and
source retirement for operations such as `7 - 4 -> 3`.  
Risk: high. Verification: standard.  
Checks: successor planner/sampler tests; typecheck; Theseus validate.  
Commit: semantic plan, sampler, laws, and fixtures.  
Stop if: result synthesis must be inferred from typography rather than semantics.

### 16. Apply successor synthesis to linear solving

Target: `next-action.kp.material-motion.linear-successor-v0`  
Change: replace the collapse/appearance of `7 - 4` with the shared successor
motion while preserving invariant reflow and KaTeX typography.  
Risk: high. Verification: broad plus manual/runtime.  
Checks: linear choreography tests; editor visual browser suite; runtime review.  
Commit: adapter integration and regression evidence.  
Stop if: unchanged equation continuants shake, resize, or remount.

### 17. Define cancellation witnesses and slot ownership

Target: `next-action.kp.material-motion.cancellation-witness-v0`  
Change: derive additive `0` and multiplicative `1`, attach them to the actual
algebraic slot, and encode witness visibility as presentation.  
Risk: medium. Verification: standard.  
Checks: semantic law/witness tests; typecheck; Theseus validate.  
Commit: witness contracts, laws, and fixtures.  
Stop if: render code would have to invent the witness value.

### 18. Implement organic witnessed annihilation

Target: `next-action.kp.material-motion.annihilation-v0`  
Change: symmetric contact, compression, inward focus/shadow pulse, witness dwell,
absorption, then survivor compaction.  
Risk: high. Verification: broad plus manual/runtime.  
Checks: sampler/renderer tests; editor visual browser suite; frame harness.  
Commit: shared primitive, default organic style, and conformance fixture.  
Stop if: layout compacts before the witness is readable.

### 19. Apply annihilation across representative operations

Target: `next-action.kp.material-motion.annihilation-adapters-v0`  
Change: migrate additive inverse and multiplicative cancellation without bespoke
fixture choreography.  
Risk: medium. Verification: broad.  
Checks: linear/fraction tests; editor visual browser suite; typecheck.  
Commit: adapters, representative fixtures, and browser evidence.  
Stop if: either family needs a second cancellation primitive.

### 20. Define ownership-aware fission and fusion

Target: `next-action.kp.material-motion.fission-fusion-v0`  
Change: distinguish source-replacing fission/fusion from persistent-source copy,
with one shared junction and semantic-order micro-stagger.  
Risk: high. Verification: standard.  
Checks: ownership/lineage and forward/reverse law tests; typecheck; validate.  
Commit: plans, samplers, laws, and minimal fixtures.  
Stop if: ownership remains an opacity heuristic instead of semantic data.

### 21. Apply fission to distribution

Target: `next-action.kp.material-motion.distribution-fission-v0`  
Change: replace the original factor wholly with ordered descendants traveling on
arcs while addends persist and reflow.  
Risk: high. Verification: broad plus manual/runtime.  
Checks: distribution tests; editor visual browser suite; performance harness.  
Commit: adapter integration, motif baseline, and regression tests.  
Stop if: the origin remains partially visible after descendants own the material.

### 22. Apply fusion to factoring

Target: `next-action.kp.material-motion.factoring-fusion-v0`  
Change: converge repeated factors into one replacement origin and establish
factoring as the explicit semantic reverse of distribution.  
Risk: high. Verification: broad plus manual/runtime.  
Checks: factoring/reverse laws; editor visual browser suite; runtime review.  
Commit: fusion adapter, reverse evidence, and tests.  
Stop if: reverse playback is only a time-reversed fission without causal emphasis.

### 23. Add work-proportional timing

Target: `next-action.kp.material-motion.semantic-duration-v0`  
Change: give up to five serial operations full minimum time and represent longer
sequences through explicit first-two/middle-sweep/final compression or long form.  
Risk: medium. Verification: standard.  
Checks: duration/pattern-compression tests; typecheck; Theseus validate.  
Commit: pure duration planner, diagnostics, and tests.  
Stop if: any path silently accelerates to fit a fixed duration.

### 24. Apply proportional timing to matrix-vector motion

Target: `next-action.kp.material-motion.matrix-vector-pacing-v0`  
Change: time row dot products by semantic work and use traversal/index order for
stagger and accumulation.  
Risk: medium. Verification: broad.  
Checks: matrix-vector tests; editor visual browser suite; frame harness.  
Commit: adapter migration and timing evidence.  
Stop if: pacing changes numerical resolution order.

### 25. Apply proportional timing to matrix-matrix motion

Target: `next-action.kp.material-motion.matrix-matrix-pacing-v0`  
Change: give each result cell a legible serial action or governed repeated-pattern
sweep, with stable accumulated cells.  
Risk: high. Verification: broad plus manual/runtime.  
Checks: matrix-matrix tests; editor visual browser suite; throttled frame harness.  
Commit: adapter migration, compression fixture, and evidence.  
Stop if: longer timing produces concurrent players or unbounded battery cost.

### 26. Add explicit reverse choreography laws

Target: `next-action.kp.material-motion.reverse-operations-v0`  
Change: require reverse meaning and causal emphasis for material junction,
successor synthesis, annihilation, fission, and fusion.  
Risk: high. Verification: broad.  
Checks: reverse semantic laws; representative rewind browser tests; typecheck.  
Commit: inverse registry fields, plans, narration hooks, and tests.  
Stop if: a reverse path falsely claims an invalid mathematical inverse.

### 27. Add epistemic channels and provisional branches

Target: `next-action.kp.material-motion.provisional-incorrect-state-v0`  
Change: animate student proposals from the last trusted state, then commit or
mark/retract them; permit explicit historical replay for uploaded material.  
Risk: high. Verification: broad.  
Checks: correctness/provisional-state tests; editor browser suite; accessibility checks.  
Commit: semantic state, branch renderer, diagnostics, and fixtures.  
Stop if: an invalid state can settle without a persistent disclosure.

### 28. Integrate governed operations into LLM compilation

Target: `next-action.kp.material-motion.llm-operation-compiler-v0`  
Change: compile constrained LLM drafts through registered semantics, costs, and
diagnostics while rejecting arbitrary motion or renderer instructions.  
Risk: high. Verification: standard plus browser smoke.  
Checks: accepted/rejected LLM draft tests; typecheck; representative editor smoke.  
Commit: schema revision, compiler, migrations, examples, and diagnostics.  
Stop if: the compiler must trust unvalidated target math or executable code.

### 29. Gate motif, style, complexity, and quality combinations

Target: `next-action.kp.material-motion.promotion-matrix-v0`  
Change: require low/medium/high fixtures across applicable motifs and Gestalt
styles, including quality parity, no hot-path layout reads, and no surprise loads.  
Risk: high. Verification: broad plus manual/runtime.  
Checks: promotion tests; production build/request audit; throttled frame harness;
editor browser suite.  
Commit: promotion matrix, budgets, CI-facing report, and baselines.  
Stop if: the gate is flaky enough to encourage widening budgets blindly.

### 30. Verify and close or refill the loop

Target: `next-action.kp.material-motion.loop-closeout-v0`  
Change: run broad verification, capture visual/performance deltas, update Theseus,
and report residual risks and the next exact slices.  
Risk: medium. Verification: broad plus manual/runtime.  
Checks: `npm test`; `npm run typecheck`; `npm run build`; relevant Playwright
suites; performance gates; `npm run theseus -- validate`; final compact reports.  
Commit: closeout evidence and project-memory state.  
Stop if: any focused failure is hidden by a broader unrelated suite result.

## Boundaries

Allowed:

- shared semantic contracts, compilers, samplers, render adapters, catalog
  loading, performance harnesses, editor diagnostics, representative fixtures,
  tests, and Theseus evidence required by these slices;
- focused refactoring needed to keep measurements outside active playback;
- configurable Gestalt styles and progressive surface-quality reduction.

Deferred:

- a general computer algebra system or arbitrary target-math generation;
- arbitrary LLM-authored DOM, JavaScript, pixels, shaders, or keyframes;
- broad curriculum generation, live model-provider integration, or upload UX;
- new mathematical families that do not exercise the canonical operations in
  this proposal;
- a general 3D engine rewrite or new particle system;
- unrelated dashboard, export, or authoring feature expansion.

## Stop Conditions

- Stop when a focused verification failure requires product or architecture
  judgment.
- Stop before broadening beyond the approved semantic-motion and performance
  boundaries.
- Stop if exact KaTeX continuity would require unsafe dependence on private KaTeX
  internals.
- Stop if a performance optimization changes semantic ordering, witnesses,
  duration, or correctness disclosure.
- Stop when all approved slices are complete or no materializable slice remains.

## Verification Cadence

This loop follows the accepted
[risk-weighted validation cadence](../decisions/2026-07-17-kp-risk-weighted-validation-cadence.md).
Focused verification is the run default; browser, build, performance, overflow,
KaTeX, and accessibility checks are added only when the slice touches those
risks.

The remaining broad checkpoints are slices 19, 24, 29, and the mandatory
closeout at slice 30. The full suite completed after slice 13 is the baseline for
slices 14–18. Heavy full-suite, browser, and performance jobs run separately so
resource contention does not inflate feedback time or corrupt timing evidence.
