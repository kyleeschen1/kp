# Governed Semantic Animation Grammar Long-Loop Proposal

Date: 2026-07-15
Status: proposed; awaiting explicit loop approval

## Conclusion

The next loop should turn the completed semantic transition compiler into a
governed semantic animation grammar. The work begins with executable
conformance fixtures and typed canonical operations, then adds provenance and
lineage, salience compilation, constraint-planned motion, editor inspection,
and generated vertical-slice examples. It deliberately improves the compiler
already in KP instead of creating another renderer or playback clock.

## Why This Loop Is Current

- Generated equation transitions now preserve tokens, but several still use
  jerky interpolation, centroid shifts, opacity handoffs, or motifs that diverge
  from the approved dashboard examples.
- `wrapFunction` has a canonical motif while distribution is still mapped to
  generic artifact replacement, so the runtime cannot communicate copying the
  source factor across addends.
- Transform definitions, definition binding, correspondence, motif defaults,
  motion planning, LLM draft compilation, and editor playback already exist.
  The missing layer is a governed contract joining symbolic meaning to reusable
  choreography and measurable continuity.
- The accepted authoring goal requires LLMs to express derivations and salience
  while KP remains authoritative for semantics, layout, and motion.

## Proposed 30-Slice Contract

Each slice ends with focused verification and one commit. `standard` adds
`npm run typecheck` and `npm run theseus -- validate`; `broad` additionally
runs the affected browser or integration suite. Browser checks use Chromium.

### Foundation And Governance

1. **Capture wrap and distribution conformance baselines**
   Target: `next-action.kp.animation-grammar.conformance-baseline-v0`
   Risk: medium. Verification: broad plus manual/runtime.
   Checks: focused motion-plan tests; the wrap and distribution cases in
   `tests/editor-animation-visuals.browser.spec.ts`; captured start, semantic
   midpoint, settle, and rewind geometry.
   Commit: fixtures, measurements, and failure assertions only.
   Stop if: the existing examples cannot be observed without changing runtime
   behavior.

2. **Define universal canonical operation identifiers and semantic roles**
   Target: `next-action.kp.animation-grammar.canonical-operation-core-v0`
   Risk: low. Verification: standard.
   Checks: new canonical-operation unit tests; typecheck; Theseus validate.
   Commit: core operation and role types with no renderer changes.
   Stop if: the core must encode algebra-specific target equations.

3. **Define versioned core, shared-domain, and project operation packs**
   Target: `next-action.kp.animation-grammar.operation-pack-contract-v0`
   Risk: low. Verification: standard.
   Checks: pack schema and version-resolution tests; typecheck; Theseus validate.
   Commit: pack identity, scope, dependency, and pinning contracts.
   Stop if: pack resolution would silently upgrade existing projects.

4. **Define declarative canonical operation specifications**
   Target: `next-action.kp.animation-grammar.operation-spec-v0`
   Risk: medium. Verification: standard.
   Checks: schema tests covering roles, invariants, lineage, motifs, examples,
   counterexamples, rewind, and accessibility.
   Commit: operation specification schema and validation diagnostics.
   Stop if: the schema admits coordinates, DOM, raw SVG, or keyframes.

5. **Implement proposal, experimental, and promoted lifecycle laws**
   Target: `next-action.kp.animation-grammar.operation-promotion-laws-v0`
   Risk: medium. Verification: standard.
   Checks: promotion-law tests; existing generated-definition coverage tests;
   typecheck; Theseus validate.
   Commit: promotion checks and path-specific failures.
   Stop if: an experimental operation can introduce an unreviewed primitive.

6. **Resolve canonical operations through layered packs**
   Target: `next-action.kp.animation-grammar.operation-registry-v0`
   Risk: medium. Verification: standard.
   Checks: deterministic resolver, namespace collision, version pin, and
   unknown-operation tests.
   Commit: registry and resolution API plus migration adapter for current
   generated algebra definitions.
   Stop if: current promoted definitions cannot be adapted without changing
   their behavior.

7. **Replace generated generic fallback with typed semantic gaps**
   Target: `next-action.kp.animation-grammar.typed-gap-v0`
   Risk: medium. Verification: standard.
   Checks: transition compiler and LLM draft rejection tests; typecheck;
   Theseus validate.
   Commit: gap model, diagnostics, and compatibility boundary.
   Stop if: legacy authored playback would be removed rather than isolated.

### Meaning, Provenance, And Authoring

8. **Add epistemic status and disclosure policy**
   Target: `next-action.kp.animation-grammar.epistemic-status-v0`
   Risk: low. Verification: standard.
   Checks: valid, hypothesis, unverified, misconception, invalid, and
   counterexample schema tests.
   Commit: state/edge status and separately sampled disclosure metadata.
   Stop if: invalidity is inferred solely from visual styling.

9. **Define hierarchical semantic entity identity and source provenance**
   Target: `next-action.kp.animation-grammar.semantic-entity-provenance-v0`
   Risk: medium. Verification: standard.
   Checks: semantic node, display-fragment, parsed, inferred, authored, and
   pedagogical-source tests.
   Commit: renderer-neutral identity and provenance contracts.
   Stop if: rendered glyph identity becomes the semantic authority.

10. **Define copy, split, merge, introduction, and removal lineage**
    Target: `next-action.kp.animation-grammar.lineage-graph-v0`
    Risk: medium. Verification: standard.
    Checks: lineage closure, multiplicity, cycle, and endpoint law tests.
    Commit: lineage graph and hard continuity laws.
    Stop if: fan-out requires fabricating one-to-one identity.

11. **Make operation binding emit authoritative identity and lineage**
    Target: `next-action.kp.animation-grammar.operation-lineage-binding-v0`
    Risk: high. Verification: standard.
    Checks: transformation-definition binding, correspondence composition, and
    semantic transition compiler tests.
    Commit: operation execution result and compatibility projection to current
    correspondence maps.
    Stop if: structural matching must silently resolve ambiguous selectors.

12. **Introduce a shared semantic scene protocol**
    Target: `next-action.kp.animation-grammar.semantic-scene-protocol-v0`
    Risk: medium. Verification: standard.
    Checks: equation and `DiagramScene` conformance tests; typecheck; Theseus
    validate.
    Commit: common entity, relation, group, region, fragment, and lineage seam.
    Stop if: this expands into a general graph-layout engine.

13. **Define the LLM-authored salience plan**
    Target: `next-action.kp.animation-grammar.salience-plan-v0`
    Risk: medium. Verification: standard.
    Checks: notice, compare, transmit, predict, question, reveal, and supporting
    context validation tests.
    Commit: renderer-neutral salience intent with no timing coordinates.
    Stop if: the model can directly author arbitrary trajectories or keyframes.

14. **Define a versioned derivation-graph animation draft**
    Target: `next-action.kp.animation-grammar.llm-draft-v2-v0`
    Risk: high. Verification: standard.
    Checks: v2 schema, operation-pack pins, roles, provenance, salience,
    epistemic status, and v1 compatibility tests.
    Commit: draft schema and migration reader; no provider integration.
    Stop if: accepting v2 requires trusting an unregistered target rewrite.

15. **Compile and repair derivation drafts with typed patches**
    Target: `next-action.kp.animation-grammar.llm-repair-loop-v0`
    Risk: high. Verification: standard.
    Checks: path-specific diagnostic, local patch, provenance retention,
    deterministic recompilation, and typed-gap tests.
    Commit: compiler/repair API without a live model-provider call.
    Stop if: a local repair regenerates unrelated accepted derivation nodes.

### Executable Visual Grammar

16. **Centralize the executable motif grammar**
    Target: `next-action.kp.animation-grammar.motif-grammar-v0`
    Risk: high. Verification: standard.
    Checks: motif defaults, visual-motif composition, and promoted-definition
    coverage tests.
    Commit: canonical semantic events mapped to trusted motif compositions.
    Stop if: domain packs must own duplicate low-level timelines.

17. **Turn curated motifs into semantic conformance fixtures**
    Target: `next-action.kp.animation-grammar.motif-conformance-v0`
    Risk: medium. Verification: broad.
    Checks: wrap/distribution semantic phases, identity, ordering, reduced
    motion, start/midpoint/end/rewind browser assertions.
    Commit: executable fixture harness and approved exemplar metadata.
    Stop if: conformance depends on brittle pixel-perfect screenshots.

18. **Compile canonical wrap and unwrap choreography**
    Target: `next-action.kp.animation-grammar.wrap-choreography-v0`
    Risk: medium. Verification: broad.
    Checks: motion-plan, sampler, editor motif, and focused wrap browser tests.
    Commit: persistent argument motion, enclosure introduction/removal, and
    conformance evidence.
    Stop if: the argument is remounted or fades during wrapping.

19. **Compile canonical copy and fan-out choreography**
    Target: `next-action.kp.animation-grammar.copy-fanout-choreography-v0`
    Risk: high. Verification: standard.
    Checks: source persistence, nonzero source scale, descendant lineage,
    mirrored rewind, and independent destination tests.
    Commit: reusable contraction, branching, transit, and arrival phases.
    Stop if: copies appear without a continuous path from their source.

20. **Move distribution and factoring onto copy/fan-out and merge motifs**
    Target: `next-action.kp.animation-grammar.distribution-choreography-v0`
    Risk: high. Verification: broad plus manual/runtime.
    Checks: motion-plan, catalog projection, distribution/factoring browser
    cases, path inspection, and rewind.
    Commit: definition composition, factor shifts, fan-out arcs, and conformance
    evidence.
    Stop if: factors must teleport, collide, or fall back to artifact replacement.

21. **Compile canonical substitution choreography**
    Target: `next-action.kp.animation-grammar.substitution-choreography-v0`
    Risk: medium. Verification: broad.
    Checks: source-to-target salience transfer, replaced-expression lifecycle,
    mixed equation/diagram scene test, and rewind.
    Commit: substitution motif and one generated fixture.
    Stop if: substitution loses the identity of the value being transferred.

### Constraint-Planned Smooth Motion

22. **Define stable layout snapshots, reservations, and semantic waypoints**
    Target: `next-action.kp.animation-grammar.layout-plan-v0`
    Risk: high. Verification: standard.
    Checks: deterministic start/end snapshots, transit-space reservation,
    resize-between-steps, and no-midflight-reflow tests.
    Commit: layout-plan IR and deterministic solver boundary.
    Stop if: planning requires measuring changing geometry during playback.

23. **Add deterministic path variants and collision scoring**
    Target: `next-action.kp.animation-grammar.path-planner-v0`
    Risk: high. Verification: standard.
    Checks: above/below/around variants, arc sampling, collision, reading order,
    travel distance, and deterministic tie-breaking tests.
    Commit: path planner used first by copy/fan-out.
    Stop if: the planner expands into arbitrary diagram routing.

24. **Add continuous interpolation and perceptual quality budgets**
    Target: `next-action.kp.animation-grammar.motion-quality-v0`
    Risk: high. Verification: standard.
    Checks: position/scale continuity, velocity and acceleration bounds,
    motif-boundary continuity, crowding, collision, and deterministic sampling.
    Commit: easing/path sampler and hard-versus-scored quality diagnostics.
    Stop if: quality can only be assessed through subjective snapshots.

25. **Compile reversible semantic event timelines**
    Target: `next-action.kp.animation-grammar.semantic-timeline-v0`
    Risk: high. Verification: standard.
    Checks: named phases, stable checkpoints, pause, seek, speed, rewind, and
    reduced-motion equivalence tests.
    Commit: semantic timeline compiler on the existing shared player clock.
    Stop if: implementation introduces a second playback clock.

26. **Integrate precomputed plans with the persistent editor stage**
    Target: `next-action.kp.animation-grammar.editor-motion-integration-v0`
    Risk: high. Verification: broad plus manual/runtime.
    Checks: semantic player adapter, mounted-stage lifecycle, start/mid/end,
    rapid seek, resize between steps, and focused Chromium coverage.
    Commit: layout/path/timeline integration without reactive remounts.
    Stop if: stable motion IDs cannot survive editor rerenders.

### Editor Proof And Gate

27. **Expose semantic inspection and presentation constraints in KP**
    Target: `next-action.kp.animation-grammar.editor-authoring-controls-v0`
    Risk: high. Verification: broad.
    Checks: role, lineage, provenance, salience, correctness, typed-gap,
    spacing, tempo, and path-preference editor tests.
    Commit: semantic/presentation edit modes and regeneration behavior.
    Stop if: direct manipulation must store raw coordinates by default.

28. **Add generated vertical-slice examples and intentional-error reveal**
    Target: `next-action.kp.animation-grammar.generated-proof-cohort-v0`
    Risk: high. Verification: broad plus manual/runtime.
    Checks: generated wrap, distribution, substitution, invalid-step disclosure,
    typed-gap rejection, determinism, and human-readable diagnostics.
    Commit: draft fixtures, catalog/editor availability, and browser evidence.
    Stop if: any generated example bypasses canonical operation resolution.

29. **Add full, reduced-motion, static, narrated, and keyboard variants**
    Target: `next-action.kp.animation-grammar.accessible-motif-contract-v0`
    Risk: high. Verification: broad plus manual/runtime.
    Checks: reduced-motion media behavior, static checkpoints, accessible names,
    narration ordering, keyboard stepping, rewind, and semantic equivalence.
    Commit: motif accessibility contract and vertical-slice implementations.
    Stop if: reduced motion merely disables animation without preserving salience.

30. **Run the grammar quality gate and close the loop**
    Target: `next-action.kp.animation-grammar.loop-closeout-v0`
    Risk: high. Verification: broad.
    Checks: all focused suites; `npm run typecheck`; `npm test`; `npm run build`;
    `npm run theseus -- validate`; full affected Chromium suite; manual review of
    wrap, distribution, substitution, intentional error, rewind, and reduced
    motion.
    Commit: residual-risk report, version pins, migration guidance, and Theseus
    closeout evidence.
    Stop if: focused semantic or perceptual gates fail; separate unrelated broad
    failures explicitly rather than hiding them.

## Expected End State

- Autogenerated `f(x)` wrapping uses the established canonical enclosure motif.
- Distribution visibly preserves and contracts the source multiplier, moves
  existing factors, and sends lineage-bearing copies along smooth arcs to each
  addend; factoring plays the meaningful inverse.
- Substitution visibly transmits a value between source and destination instead
  of replacing layers.
- Persistent elements remain continuous through playback, seek, pause, rewind,
  resizing between steps, and editor rerenders.
- LLM drafts select versioned canonical operations, supply derivation and
  salience intent, retain provenance, and receive patchable diagnostics.
- Intentional invalid states animate coherently without being represented as
  valid, and correctness disclosure can be delayed pedagogically.
- Unsupported generated semantics appear as typed gaps, never generic fades.
- KP authors can inspect and edit semantics separately from visual constraints.
- The vertical slice has accessible motion, static, narrated, and keyboard forms
  and a deterministic compiler result.

## Deferred

- Live model-provider integration and prompt hosting: deferred until the v2
  draft and repair boundary are stable.
- Broad calculus, linear-algebra, geometry, and programming operation packs:
  deferred until the algebra vertical slice proves governance and choreography.
- A general CAS: KP validates registered operation laws rather than arbitrary
  symbolic equivalence in this loop.
- General diagram routing or layout: only the shared scene seam and substitution
  proof are in scope.
- Automatic promotion without human review: promotion remains governed while
  evidence and quality thresholds mature.
- Automatic migration of published projects: projects remain version-pinned and
  upgrades require preview and acceptance.
- Raw timeline, DOM, SVG, pixel, and keyframe generation by LLMs: disallowed by
  the accepted compiler boundary.
- Unrelated dashboard, curriculum, export, package, and media expansion: deferred
  to protect the animation-grammar vertical slice.

## Loop Stop Conditions

Stop and report if a slice requires a second playback clock, arbitrary
model-authored geometry, silent structural matching, unsafe KaTeX internals, a
general CAS, a general graph-layout engine, automatic published-project
migration, or work outside the approved vertical slice. Also stop when a
focused verification failure needs product or architecture judgment.

## Why This Loop Now

- It directly addresses the observed jerky motion and motif drift.
- It turns the completed compiler into the safe authoring target required by
  student prompts and uploaded instructional material.
- Its slices are independently verifiable and commit-sized.
- It proves vocabulary expansion without allowing unreviewed runtime behavior.
- It postpones broad operation coverage until the semantic and motion grammar is
  demonstrably sound.

