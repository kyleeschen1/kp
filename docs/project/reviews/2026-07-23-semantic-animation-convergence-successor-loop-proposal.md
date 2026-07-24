# Semantic animation convergence successor loop proposal

Date: 2026-07-23

Status: selected successor priority; exact run contract awaiting approval

Requested use: human-readable source of truth for the successor priority and
its proposed Theseus long-loop contract. Product implementation remains
unauthorized until the user approves the exact contract below.

## Executive recommendation

The predecessor loop has closed at its authorized boundary. Make a bounded
semantic-animation convergence tranche the next priority before resuming broad
animation-library or cross-domain expansion.

The purpose is not to redesign KP, formalize the current semantic editor, or
finish a universal ontology. The purpose is to remove architectural ambiguity
and compatibility debt that taxes every new animation:

- multiple partially overlapping transformation representations;
- porous dependency direction between semantic, animation, and rendering code;
- stringly typed presentation recipes accumulating in generic metadata;
- several plausible frame, timeline, and choreography authorities;
- a broad `KpAnimationAsset` aggregate that mixes semantic animation,
  presentation, checks, exports, and catalog concerns;
- equation-specific contracts that may be mistaken for universal animation
  contracts as KP expands into programs, topology, diagrams, and other domains.

This should be a behavior-preserving convergence loop. It must protect the
accepted animation cohort, exact seek and rewind, semantic identity,
correspondence, lineage, native endpoint authority, routes, and review
provenance.

Once convergence is complete, the recommended first diagnostic expansion is a
small Lisp evaluation animation. That exemplar should pressure the stabilized
identity, structure, execution, substitution, environment, and nested-flow
contracts without authorizing a full programming editor or a second runtime.

## Authority and activation boundary

This document now owns the rationale and proposed scope for the selected
successor priority. It is not an approved run contract and does not authorize
implementation.

The predecessor `run-contract.kp.authoritative-roadmap-workbench-v1` reached
`COMPLETE` with all 30 slices resolved. Its final slices established:

1. exact radical native settlement;
2. a human Workbench and radical checkpoint;
3. lesson-first canonical presentation lineage;
4. card and Workbench projection from canonical choreography;
5. unified review and promotion lineage.

Those outcomes satisfy the prerequisites for this convergence proposal.
Project memory may record this document as the successor direction now. The
following control-plane changes remain approval-gated:

1. preview, approve, and activate `plan-revision.kp.v7`;
2. mark `authoritative-roadmap-workbench` and `radical-native-settlement`
   complete in that successor revision without rewriting revision 6;
3. add `semantic-animation-convergence` as the sole `now` implementation phase;
4. move `quadratic-semantic-branching` to `next`;
5. preserve every later and someday roadmap row and every existing evidence
   link;
6. create `run-contract.kp.semantic-animation-convergence-v1` from the exact
   proposal below;
7. keep live slice status, verification evidence, and stop state only in that
   contract.

Until the user approves this exact proposal, revision 6 remains the active
approved roadmap and no successor contract may execute.

Per the repository plan-ownership rule, do not copy this proposal into
`docs/superpowers/plans/` or create a second manually maintained slice tracker.

## Why this should be the next priority

KP's semantic-animation subsystem fares substantially better than the entire
application architecture. Its strongest contracts are already unusually
rigorous:

- semantic objects and selectors have stable identity;
- transformations name source and target boundaries and preservation claims;
- rich correspondence represents persistence, role change, introduction,
  removal, cancellation, fan-in, fan-out, and visual artifacts;
- lineage makes one-to-many and many-to-one history explicit;
- epistemic status distinguishes valid, provisional, unverified,
  misconception, invalid, and counterexample states;
- externally owned progress can drive deterministic direct seek, scroll,
  playback, rewind, and export sampling;
- runtime frames expose active transformations, focus, selectors, child
  animations, render targets, and diagnostics;
- laws check reference closure, determinism, correspondence closure,
  associativity, shared-clock composition, temporal continuity, and exact
  reverse equivalence;
- unsupported equation transitions can become typed semantic gaps instead of
  silently pretending that a generic fade communicates semantic identity.

The problem is not the absence of a real engine. The problem is that several
generations of that engine coexist, and a contributor adding a new animation
cannot immediately tell which representation owns meaning at each stage.

This is now high-leverage debt:

- the animation library is large enough to reveal recurring structure;
- the current gold and reviewable exemplars provide preservation evidence;
- the test and law infrastructure makes behavior-preserving migration feasible;
- the current loop is already removing duplicate presentation authority;
- every new domain added before convergence creates more compatibility
  obligations;
- code, topology, exact arithmetic, diagrams, and cross-view mathematics will
  otherwise inherit equation-specific assumptions or invent parallel runtimes.

The strategic ordering remains consistent with `docs/project/strategy.md`:

```text
semantics first
-> runtime second
-> renderers third
-> authoring and generation fourth
```

The convergence tranche strengthens the first three layers. It deliberately
does not make the current editor, Markdown, dashboard, or authoring UI part of
the cleanup target.

## Candidate comparison

Scores are 1-5. Higher is better except risk, where lower is better.

| Candidate | Fast iteration | Reliability | Reuse | Stale-system reduction | Risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Bounded semantic-animation convergence after the active loop | 5 | 5 | 5 | 5 | 3 | Make next priority |
| Continue expanding equation families immediately | 4 | 4 | 3 | 1 | 2 | Resume after convergence |
| Build a cross-domain exemplar before any cleanup | 3 | 3 | 5 | 2 | 4 | Use as the immediate post-convergence probe |
| Formalize the semantic editor | 2 | 3 | 2 | 2 | 4 | Defer |
| Rewrite the complete semantic model | 1 | 2 | 4 | 5 | 5 | Reject |

## Current subsystem evidence

The relevant implementation is substantial:

- `src/semantic`: about 89 TypeScript files and 24k lines;
- `src/animation`: about 158 TypeScript files and 40k lines;
- `src/rendering`: about 95 TypeScript files and 27k lines.

These counts are directional snapshots from the active worktree, not product
metrics. They show why conceptual convergence matters: semantic animation and
rendering already form a roughly 90k-line subsystem before broad cross-domain
expansion.

A focused read-only review ran 87 pure semantic-animation tests covering:

- animation assets and reference closure;
- runtime frames and shared-clock child sampling;
- seek and rewind equivalence;
- transformation-tree composition;
- correspondence composition and lifecycle closure;
- semantic lineage and ancestry;
- semantic scene projection;
- equation transition IR;
- equation motion plans and samplers;
- program-trace assets and frame previews.

All 87 passed in that review. This is evidence for a safe migration substrate,
not a substitute for the eventual contract's full focused, standard, broad,
browser, visual, and release gates.

The most recent completed performance evidence recorded:

- normal playback near one 60 Hz frame budget;
- geometry cached before playback instead of repeatedly measured in the hot
  frame loop;
- bounded diagnostic publication;
- explicit residual low-end debt under heavy CPU throttling;
- initial transfer still above the desired product target;
- Three.js absent from the relevant initial equation request set.

The convergence loop should preserve those properties and must not obscure
performance regressions behind a widened baseline.

## Current model strengths to preserve

### Semantic assets

`src/semantic/asset.ts` provides generic semantic objects with:

- stable IDs;
- string object types;
- values;
- selector ownership;
- provenance;
- diagnostics and metadata.

This generic layer is valuable because it can carry equation, graph, matrix,
source-file, program, diagram, and future domain payloads without requiring the
animation kernel to own each domain's full type system.

### Semantic transformations

`src/semantic/asset-transformation.ts` provides transformation instances and
reusable definitions with:

- source and target object boundaries;
- preservation claims;
- rich or compatibility correspondence;
- assumptions;
- law references;
- validation against the source asset bundle.

This is the strongest candidate for the authoritative semantic transformation
instance. The loop must inspect actual consumers before finalizing that
authority.

### Correspondence and lineage

`src/semantic/correspondence.ts` and
`src/semantic/semantic-lineage-graph.ts` model identity and historical
relationships that ordinary token-animation libraries cannot express
honestly. Preserve their endpoint and multiplicity laws.

### Transformation composition

`src/semantic/transformation-composition.ts` provides sequence and parallel
trees plus pause, focus, unfocus, and emphasis annotations. Preserve editable
composition and exact mirrored rewind.

### Canonical operations

Canonical operations, contracts, packs, specs, bindings, and executions encode
reusable mathematical meaning, roles, invariants, lineage, reverse meaning,
motif requirements, pacing, costs, fixtures, counterexamples, and
accessibility variants.

These layers are valuable, but their exact relationship to transformation
definitions and presentation profiles is not yet simple enough. The loop must
clarify compilation and ownership instead of deleting them by name.

### Runtime sampling

`src/animation/kernel.ts`, `src/animation/asset.ts`, and
`src/animation/runtime-sampler.ts` establish:

- externally supplied progress;
- renderer-neutral motion and runtime frame contracts;
- timeline normalization from progress, elapsed time, or beats;
- child animations sampled from a shared parent clock;
- phase and selector diagnostics;
- direct seek and rewind without a controller owning semantic time.

This denotational `Time -> Frame` direction is foundational and must not change.

### Equation semantic compilation

`src/rendering/semantic-equation-transition-compiler.ts` validates semantic
transformations, selector correspondence, lifecycle closure, transformation
definition bindings, and canonical operation execution before producing
equation-transition IR. Unsupported transitions produce diagnostics and typed
gaps, with legacy fades retained as an explicit compatibility policy.

The compiler behavior is strong. Its package location and relationship to
renderer-neutral animation layers require convergence.

### Executable laws

`src/semantic/asset-laws.ts`, `src/animation/runtime-laws.ts`,
`src/animation/temporal-continuity-laws.ts`, and related focused law modules
turn architectural claims into executable checks. The loop should consolidate
law ownership only when it reduces ambiguity without weakening evidence.

## Current liabilities to address

### 1. Ambiguous transformation pipeline

Current representations include:

- `KpSemanticTransformation`;
- `KpSemanticTransformationDefinition`;
- `SemanticTransformationRef`;
- semantic transformation tree nodes;
- canonical operations;
- canonical operation contracts;
- canonical operation specifications;
- canonical operation executions;
- choreography plans;
- choreography timelines;
- equation-transition IR;
- equation motion plans;
- animation runtime frames;
- frame descriptors and domain-specific frames.

Many of these are legitimate compiler stages. The defect is not their count by
itself. The defect is that their authority, conversion direction, and
compatibility status are not obvious from their names or module boundaries.

The loop must classify each representation as one of:

- authoritative semantic source;
- reusable definition;
- bound invocation;
- compiled semantic intermediate;
- presentation policy;
- executable choreography;
- renderer motion plan;
- sampled frame;
- compatibility adapter;
- renderer output.

No representation should remain an unexplained peer.

### 2. Dependency-direction inversions

The desired dependency direction is:

```text
semantic <- animation <- rendering
```

Concrete inversions currently include semantic or animation files importing:

- equation-transition IR from `src/rendering`;
- semantic equation transition compilation from `src/rendering`;
- visual motif types and defaults from `src/rendering`;
- equation-specific easing and motion-plan types from `src/rendering`;
- graph SVG interpolation helpers from `src/rendering`;
- measured cancellation topology and resolution from `src/rendering`;
- equation matrix, dot-product, rearrangement, and motif implementations from
  `src/rendering`.

Some imports may reveal that a supposedly rendering-owned contract is actually
neutral and belongs in a domain or animation IR package. Others may show that
animation modules are presentation adapters and should be renamed or relocated.

The loop must establish and gate a dependency graph. It must not mechanically
move files without clarifying ownership.

### 3. Presentation metadata as a shadow type system

Polished animation adapters currently use generic metadata keys such as:

- `equationMotionPresentationRecipe`;
- `equationNativeHandoffRecipe`;
- `equationZeroWitnessPresentationRecipe`;
- `equationSuccessorPresentationRecipe`;
- `equationDepthPresentationRecipe`;
- `equationContinuantPresentationRecipe`;
- `equationBranchPresentationStrategy`.

These keys were useful experimentation seams. Successful recipes now need a
typed, versioned presentation profile so new animations can discover,
validate, compose, and migrate them without copying string keys from an
exemplar.

The loop must preserve current behavior through compatibility parsing. It
should not force every experimental metadata key into a permanent universal
schema.

### 4. Broad animation aggregate

`KpAnimationAsset` currently includes:

- semantic bundles;
- transformations;
- transformation trees;
- timelines;
- layouts;
- render targets;
- law/check refs;
- export targets;
- dashboard metadata;
- generic metadata.

The source describes this as a thin composition contract, but it is also a
product manifest. The loop should distinguish at least these conceptual
projections:

1. semantic animation;
2. animation presentation;
3. product, catalog, review, or export metadata.

This does not require an immediate breaking serialized format. A compatible
facade may remain while consumers migrate to narrower projections.

### 5. Multiple frame authorities

The system has generic runtime frames, frame descriptors, semantic equation
frames, equation motion frames, graph runtime frames, visual frames, program
trace frames, and renderer-specific samples.

Different domains legitimately need different payloads. The loop should not
force them into one universal pose object. It should establish:

- one canonical semantic-animation sampled-frame envelope;
- one shared clock and direction convention;
- one rule for semantic refs, active transformations, selectors, focus, child
  frames, diagnostics, and presentation refs;
- typed domain payloads compiled from that envelope;
- typed renderer motion plans compiled from domain semantic frames.

### 6. Equation maturity mistaken for universal maturity

Equation animation has the deepest compiler, correspondence, motif,
choreography, geometry, native-settlement, performance, and browser evidence.
Graphs and program traces prove useful seams but remain thinner.

The convergence loop must remove known equation-specific leakage without
designing a universal ontology in advance. The later Lisp diagnostic exemplar
will test whether the stabilized boundaries actually support a structurally
different domain.

### 7. Compatibility paths without retirement status

Important compatibility paths include:

- legacy selector-pair correspondence alongside rich correspondence maps;
- typed semantic gaps alongside legacy fades;
- older animation intents and behaviors;
- multiple timeline and phase vocabularies;
- generated fixture and canonical operation resolution paths;
- card, lesson, editor, and runtime projections of overlapping animations;
- module-scoped registries retained for compatibility.

The loop should assign each path an explicit status:

- permanent;
- compiles forward;
- compatibility-only;
- retirement candidate;
- retained fixture.

Compatibility must not be deleted merely to reduce file count. Conversely, it
must not remain immortal because no owner recorded its intended sunset.

## Authoritative target pipeline

The intended convergence target is:

```text
domain semantic state
    |
    v
semantic transformation instance
    |
    v
reusable operation/definition resolution
    |
    v
bound correspondence and lineage
    |
    v
typed presentation profile
    |
    v
choreography plan and shared timeline
    |
    v
domain/renderer motion plan
    |
    v
canonical semantic-animation sampled frame
    |
    v
domain frame payload and renderer adapter
```

Required properties:

- semantic truth does not import animation or rendering implementations;
- renderer-neutral animation does not import concrete rendering
  implementations;
- renderers may consume semantic and animation contracts;
- clocks remain externally owned;
- semantic reverse meaning is distinct from merely playing historical visuals
  backward;
- correspondence and lineage remain authoritative across renderers;
- presentation profiles can vary without changing semantic truth;
- one animation can project into cards, lessons, exports, and future editors
  without duplicating semantic or choreography authority;
- unsupported semantics remain diagnosed rather than silently animated.

The downstream loop may refine names and package locations after direct source
inspection. It must preserve these dependency and authority properties.

## Fixed decisions

The following decisions should be treated as accepted scope when this proposal
is explicitly promoted:

1. Run convergence only after the predecessor loop's completed boundary.
2. Use a long-loop contract because the work crosses semantic, animation,
   rendering, compatibility, and visual-preservation boundaries.
3. Preserve behavior; do not use cleanup to redesign accepted animations.
4. Keep the semantic editor ad hoc and out of scope.
5. Enforce a one-way semantic-to-animation-to-rendering dependency direction.
6. Create a typed versioned presentation-profile seam.
7. Clarify one canonical sampled-frame envelope without erasing typed domain
   payloads.
8. Separate semantic animation, presentation, and product metadata at least as
   explicit projections.
9. Inventory and classify compatibility paths before deleting them.
10. Protect a representative gold cohort and stop for human review before any
    behavior-affecting generalization.
11. Follow convergence immediately with one small Lisp diagnostic exemplar.
12. Do not create a universal scene graph, general CAS, theorem prover,
    arbitrary-code renderer, dynamic package loader, or second animation
    runtime.

## Open implementation questions

The downstream planning session should answer these from current source
evidence:

1. Should `KpSemanticTransformationDefinition` compile into canonical operation
   specs, should canonical operations compile into definitions, or do they own
   different reusable meanings?
2. Which current transformation representation is the durable serialized
   instance and which should become narrow refs?
3. Where should equation-transition IR live if both animation compilation and
   rendering consume it?
4. Which motif descriptors are neutral presentation vocabulary and which are
   equation-domain vocabulary?
5. Should `KpAnimationAsset` be physically split now, or should compatible
   projections land first with a later format revision?
6. Which runtime-frame and frame-descriptor fields are genuinely duplicated?
7. How should typed domain payloads attach to the canonical sampled-frame
   envelope without introducing unsafe `unknown` plumbing?
8. Which metadata recipes have enough successful reuse to be promoted now?
9. Which compatibility adapters have enough reference and route evidence to
   retire safely?
10. Which architecture boundary can be enforced immediately, and which needs a
    frozen exception ratchet during migration?

These questions are planning tasks, not permission to broaden the objective.

## Suggested long-loop tranche structure

The downstream session should propose 20-30 small, independently verifiable
slices. The exact slices must come from current source inspection, but the
contract should preserve this tranche order.

### Tranche A: authority and preservation baseline

Goals:

- freeze the active gold cohort and current serialized shapes;
- inventory every semantic-animation compiler stage;
- map current dependency inversions;
- identify all generic presentation recipe keys;
- record route, review, animation ID, and compatibility preservation;
- establish focused and broad verification commands.

Expected outputs:

- an executable authority inventory or checked fixture;
- no production behavior changes;
- a precise migration map;
- rollback units for later tranches.

### Tranche B: dependency-direction repair

Goals:

- define semantic, renderer-neutral animation, domain IR, presentation, and
  renderer ownership;
- relocate or wrap neutral contracts currently owned by rendering;
- remove semantic-to-rendering imports;
- remove renderer-neutral-animation-to-rendering imports;
- add a ratcheting architecture gate;
- freeze only the minimum temporary exceptions.

Stop if moving a contract changes runtime behavior or exposes unclear
authority. Resolve ownership before continuing.

### Tranche C: typed presentation profiles

Goals:

- define a versioned presentation-profile contract;
- classify experimental, exemplar-local, and promoted recipe fields;
- compile existing successful metadata into typed profiles;
- retain compatibility reads for current assets;
- prove profile substitution does not change semantic transformations,
  correspondence, clocks, or endpoint truth;
- keep visual style and semantic operation distinct.

Use one canonical exemplar first. Stop for visual review if observable motion
changes.

### Tranche D: canonical frame and compiler-stage convergence

Goals:

- name one semantic-animation sampled-frame envelope;
- define typed domain payload attachment;
- clarify frame-descriptor ownership;
- make equation, graph, diagram, and program-trace adapters compile in one
  direction;
- preserve child animation sampling and shared clocks;
- preserve direct seek, rewind, reduced/static projections, and export
  sampling;
- avoid introducing a universal renderer pose model.

### Tranche E: animation asset projections

Goals:

- expose narrow semantic-animation, presentation, and product-manifest
  projections;
- migrate representative consumers to narrow inputs;
- keep a compatible `KpAnimationAsset` facade while needed;
- ensure dashboard, export, review, route, and authoring concerns are not
  required by the semantic runtime;
- avoid unrelated UI or authoring redesign.

### Tranche F: compatibility classification and bounded deletion

Goals:

- assign durable statuses to old correspondence, fallback, timeline, intent,
  registry, and projection paths;
- migrate references where authority is proven;
- remove only paths with complete reference, route, review, and fixture
  closure;
- record retained fixtures and explicit sunset conditions;
- reduce frozen exceptions rather than merely renaming them.

### Tranche G: gold-cohort release and human checkpoint

Goals:

- run focused semantic laws;
- run subsystem typecheck and architecture gates;
- run representative browser, visual, performance, production-closure, and
  export checks required by affected paths;
- create deterministic comparison evidence for the gold cohort;
- prove no changes to IDs, semantic meaning, seek, rewind, endpoint authority,
  routes, or review lineage;
- stop for human visual review;
- close the loop with a candid deletion, simplification, and residual-debt
  report.

## Exact proposed typed run contract

This is the exact execution proposal. Approval should authorize creation and
activation of the successor plan revision and this contract, followed by slice
execution. It should not authorize work outside these fields.

| Field | Proposed value |
| --- | --- |
| Contract ID | `run-contract.kp.semantic-animation-convergence-v1` |
| Plan revision | `plan-revision.kp.v7`, superseding revision 6 without rewriting it |
| Plan phase | `semantic-animation-convergence` |
| Source reference | This proposal |
| Goal | Converge KP's semantic-animation compiler into one enforceable dependency direction, typed presentation seam, canonical sampled-frame convention, narrow asset projections, and classified compatibility surface while preserving every accepted behavior in the gold cohort. |
| Target | `src/semantic`, `src/animation`, neutral domain IR, affected `src/rendering` adapters, focused architecture/verification scripts, tests, and the minimum documentation/evidence needed for the migration |
| Allowed changes | Behavior-preserving type extraction, dependency inversion, compatible facades and decoders, architecture gates, narrow projections, compiler/frame adapter migration, deterministic preservation fixtures, bounded deletion with closure evidence |
| Disallowed changes | New curriculum or domains; editor, Workbench, reader, dashboard, or authoring redesign; universal scene graph; CAS; theorem prover; second runtime or clock; arbitrary code execution; broad aesthetic changes; deletion without route/review/export/reference closure |
| Maximum slices | 28 |
| Context budget | Brief Theseus receipt at every slice boundary; one working packet only when a slice needs source detail; checkpoint or handoff before unrelated context is loaded |
| Commit cadence | One focused commit for every completed slice; never combine independently reversible migrations; derive `npm run --silent loop:status` at slice start, completion, commit boundary, and final stop |
| Verification cadence | Focused convergence suite every slice; typecheck and architecture gate for boundary/type changes; full suite at slices 6, 13, 22, and 28; visual/browser checks at slices 6, 17, 18, and 28; production/build/performance/export checks at release |
| Rollback unit | The current slice commit: one inventory/gate, one compiler-stage move, one profile migration, one frame adapter, one projection consumer cohort, or one compatibility deletion |
| Human checkpoint | Mandatory stop after slice 17 before profile promotion; mandatory final visual acceptance at slice 28 |
| Success state | `COMPLETE` only after all 28 slices and the done contract pass |
| Required intermediate stop | `HUMAN_CHECKPOINT` after slice 17 |

### Exact ordered slices

The recurring focused command introduced in slice 2 is
`npm run test:semantic-animation-convergence`. The recurring deterministic
visual command introduced in slice 6 is
`npm run visual:semantic-animation-convergence`. These stable entry points
replace changing scratch scripts for the remainder of the run.

| Slice | Target and intended change | Primary risk | Required verification | Commit boundary and stop condition |
| --- | --- | --- | --- | --- |
| 01 | **Canonical preservation manifest.** Resolve the final lesson-first canonical IDs for solve-x, distribution/factoring, fractions, radical, exponent/function-wrap, matrix or dot product, equation/graph, and program trace. Record their routes, review identities, exports, source owners, and native endpoints in one checked fixture. | Freezing a stale card duplicate instead of the lesson-owned choreography. | Focused manifest test; `npm run typecheck`; `theseus validate workspace`. | Commit only the fixture/test/docs. Stop if any canonical owner or duplicate lineage is ambiguous. |
| 02 | **Stable focused suite.** Add `test:semantic-animation-convergence` over transformation binding, correspondence, lineage, composition, runtime frames, seek/rewind, equation IR/motion, and program-trace frame tests. | A misleadingly narrow suite that omits a contract later migrated. | Run the new command twice with identical results; `npm run typecheck`. | One verification-infrastructure commit. Stop if tests depend on order or mutable external state. |
| 03 | **Executable compiler-stage inventory.** Encode every current semantic transformation, definition/operation resolution, correspondence/lineage, presentation, choreography, motion-plan, frame, and renderer stage with its owner and allowed dependencies. | Documentation diverges from executable reality. | Inventory closure test; `npm run test:semantic-animation-convergence`; `npm run typecheck`. | One inventory commit. Stop on two competing authorities that cannot yet be classified. |
| 04 | **Dependency inversion baseline.** Inventory all direct semantic/animation imports of rendering modules, classify each by intended owner, and freeze the exact temporary exception set. | Normalizing an inversion that should be removed immediately. | Import-fitness unit tests; `npm run check:architecture`; focused suite. | One baseline commit. No wildcard exceptions; stop if an exception lacks a named retirement slice. |
| 05 | **Recipe and compatibility ledger.** Enumerate generic presentation metadata keys plus correspondence, fallback, timeline, intent, registry, and projection compatibility paths; assign owner, consumers, status candidate, and closure evidence needed. | Missing dynamic or fixture-only consumers. | Reference-closure tests and repository search assertions; focused suite; `npm run typecheck`. | One ledger commit. Stop if a path cannot be traced to an owner or consumer. |
| 06 | **Deterministic gold baseline.** Add `visual:semantic-animation-convergence` to capture phase-aligned forward, direct-seek, rewind, and native-endpoint evidence for the manifest without changing production presentation. | Nondeterministic captures create false regressions. | New visual command; `npm test`; `npm run build`; `npm run perf:animation`. | One baseline-tooling commit. Stop if captures are nondeterministic or canonical routes differ from the manifest. |
| 07 | **Layer ownership contract.** Define the enforceable semantic → renderer-neutral animation/domain IR → presentation → rendering direction and public seams, using the stage inventory rather than directory names alone. | An equation-specific type is mislabeled universal. | Boundary contract tests; focused suite; `npm run typecheck`. | One contract commit. Stop if the proposed neutral layer contains DOM, KaTeX node, SVG, pixel, Three.js, or renderer-resource state. |
| 08 | **Ratcheting architecture gate.** Add a semantic-animation import-fitness checker to `check:architecture`, permitting only the frozen slice-4 exceptions and forbidding new inversions. | Gate noise blocks unrelated work or deep imports escape detection. | Checker unit tests with positive and negative fixtures; `npm run check:architecture`; focused suite. | One gate commit. Stop if the gate cannot characterize current exceptions exactly. |
| 09 | **Neutral equation-transition IR ownership.** Move or compatibly re-export equation transition IR from rendering ownership into the neutral domain/animation layer; preserve serialized shape and public imports. | Circular dependencies or asset-format drift. | Equation IR, correspondence, and semantic scene tests; focused suite; `npm run typecheck`; architecture gate. | One IR migration commit. Stop on serialized, diagnostic, or correspondence drift. |
| 10 | **Semantic equation compiler ownership.** Move or invert the semantic transformation-to-equation-IR compiler so rendering consumes its result rather than owning semantic compilation. | Renderer geometry or policy leaks into the semantic compiler. | Equation compiler/IR/motion tests; focused suite; typecheck; architecture gate. | One compiler-stage commit. Stop if output depends on DOM measurement or renderer state. |
| 11 | **Neutral motif vocabulary boundary.** Separate renderer-neutral motif descriptors/default contracts from concrete visual implementations and preserve compatibility exports. | Presentation vocabulary is either over-generalized or stripped of needed domain meaning. | Motif/default tests and affected animation tests; focused suite; typecheck; architecture gate. | One motif-boundary commit. Stop if a moved contract carries concrete drawing resources. |
| 12 | **Neutral utility ownership.** Extract the minimum shared easing, tween, and cancellation-topology contracts currently imported from rendering; leave concrete interpolation and resolver implementations downstream. | Broad utility extraction creates a dumping-ground package. | Utility and cancellation tests; focused suite; typecheck; architecture gate. | One narrow utility commit. Stop if the move broadens public API beyond current consumers. |
| 13 | **Close dependency inversions.** Migrate remaining classified imports to the new seams, shrink the frozen exception set to the evidence-backed minimum, and document every residual exception. | A compatibility import hides a runtime behavior change. | Focused suite; `npm run check:architecture`; `npm test`; `npm run build`. | One inversion-closeout commit. Stop unless every residual exception has owner, rationale, and retirement condition. |
| 14 | **Versioned typed presentation profile.** Define a renderer-neutral profile envelope with explicit schema version, equation-domain payload, promoted recipe fields, and extension rules that do not change semantic truth. | Current equation maturity becomes a false universal schema. | Profile construction/validation/substitution tests; focused suite; typecheck; architecture gate. | One type-contract commit. Stop if domain payloads require unsafe untyped bags. |
| 15 | **Legacy metadata decoder.** Centralize generic metadata reads in one compatibility decoder that produces the typed profile, rejects conflicting authority, and emits deterministic diagnostics. | Silent fallback changes accepted recipes. | Exhaustive legacy-key, invalid-value, default, and conflict tests; focused suite; typecheck. | One decoder commit. Stop on any canonical asset profile mismatch. |
| 16 | **Solve-x profile exemplar.** Migrate only the lesson-owned solve-x canonical presentation to author a typed profile; keep legacy reads for all other assets and preserve semantic transformation, correspondence, clock, and native endpoint data byte-for-byte where serialized. | Observable choreography changes despite equivalent semantics. | Focused suite; solve-x browser conformance; `npm run visual:linear-equation`; direct-seek/rewind assertions; typecheck. | One exemplar commit. Stop on any unexplained semantic, timing, layout, or review-lineage delta. |
| 17 | **Exemplar comparison and mandatory human checkpoint.** Produce phase-aligned baseline/current evidence for solve-x across lesson, card, Workbench, direct seek, rewind, responsive states, and native settlement. Make no family-wide migration. | Automation misses a perceptible continuity or focus regression. | `npm run visual:semantic-animation-convergence`; `npm run visual:reader-gold-parity`; `npm run test:browser:reader-conformance`; focused suite. | Evidence-only commit if needed, then report `HUMAN_CHECKPOINT`. Do not begin slice 18 without explicit visual acceptance. |
| 18 | **Promote proven profiles.** After checkpoint approval, migrate only already-successful distribution, fraction, radical, and exponent/function-wrap recipes to typed authoring; leave experimental recipe fields exemplar-local. | Family-wide promotion changes pacing, settlement, or reverse motion. | Focused suite; `npm run visual:distribution-area`; `npm run visual:fractional-linear-equation`; `npm run visual:exponent-radical`; `npm run visual:function-wrap`; relevant browser tests. | One promotion commit. Stop on any unexplained visual delta; roll back this slice without touching the profile seam. |
| 19 | **Canonical sampled-frame envelope.** Define the minimal common frame authority—clock, progress, plan/timeline identity, semantic activity, diagnostics, and typed payload attachment—while distinguishing it from frame descriptors and renderer poses. | A universal pose model erases domain structure. | Frame-envelope and sampling law tests; focused suite; typecheck; architecture gate. | One frame-contract commit. Stop if graph, equation, or program trace needs renderer resources in the envelope. |
| 20 | **Typed domain payload convention.** Add closed, validated equation, graph/diagram, and program-trace payload attachment patterns without an unvalidated `unknown` metadata channel. | Unsafe payload casting or cross-domain coupling. | Payload construction, validation, mismatch, and round-trip tests; focused suite; typecheck. | One payload-contract commit. Stop if payload consumers need unchecked casts. |
| 21 | **Equation frame adaptation.** Compile equation frame descriptors/runtime frames through the canonical envelope and typed equation payload while preserving public compatibility views. | Seek, rewind, child sampling, or diagnostics change. | Equation frame, motion-plan, sampler, temporal continuity, and reverse-equivalence tests; focused suite; visual linear equation; typecheck. | One equation-adapter commit. Stop on clock, endpoint, or diagnostic drift. |
| 22 | **Graph and program-trace adaptation.** Compile representative graph/shared-clock and program-trace frames through the same envelope with domain payloads, without routing them through equation contracts. | “Universal” abstractions become equation-shaped or child clocks fork. | Graph composition, child-frame, program-trace frame, direct-seek, and rewind tests; focused suite; `npm test`; `npm run build`; architecture gate. | One non-equation adapter commit. Stop if any child or representation gains an independent clock. |
| 23 | **Narrow asset projections.** Add explicit semantic-animation, presentation, and product-manifest projections over `KpAnimationAsset`, retaining the aggregate as a compatible facade and preserving version 1 serialization. | Projection boundaries duplicate state or invent new authorities. | Projection completeness, immutability, round-trip, and serialization tests; focused suite; typecheck. | One projection-contract commit. Stop if two projections can disagree about shared identity. |
| 24 | **Runtime/compiler consumer migration.** Move semantic runtime, validation, compilers, and samplers to the semantic-animation projection so dashboard, review, export, and catalog fields are not required by the kernel. | Narrowing drops required semantic refs or diagnostics. | Asset validation, runtime sampling, composition, frame, and law tests; focused suite; typecheck; architecture gate. | One runtime-consumer commit. Stop on semantic reference or validation drift. |
| 25 | **Product consumer migration.** Move catalog, Workbench/card projection, review lineage, route, and export consumers to presentation/product projections while preserving lesson-first canonical ownership and the aggregate facade. | Routes, reviews, exports, or canonical card projection lose identity. | Workbench/card, roadmap-authority, canonical cross-surface, review, export, and production-closure tests; focused suite; build. | One product-consumer commit. Stop on any route, review ID, lesson/card lineage, or export artifact change. |
| 26 | **Compatibility status enforcement.** Convert the slice-5 ledger into checked `canonical`, `compatibility-only`, `retirement-candidate`, or `retained-fixture` statuses with owner and sunset evidence. | Classification becomes documentation without enforcement. | Ledger closure and live-reference tests; architecture gate; focused suite; typecheck. | One status-enforcement commit. Stop if any compatibility path remains unclassified. |
| 27 | **Bounded compatibility deletion.** Delete only retirement candidates with complete reference, route, review, export, fixture, and replacement closure; reduce exception baselines and preserve explicit facades still in use. | Historical or obscure consumers break. | Repository reference closure; focused suite; `npm test`; typecheck; architecture gate; relevant route/review/export tests. | One deletion commit, limited to the proven cohort. Stop rather than deleting any path with incomplete closure. |
| 28 | **Release proof and final human checkpoint.** Run the full preservation matrix, compare the gold cohort, record ownership/deletion/residual-debt evidence, reconcile Theseus/project memory, and close only if every done condition holds. | Passing structural checks masks perceptible motion, accessibility, performance, or production regressions. | `npm run test:semantic-animation-convergence`; `npm test`; `npm run typecheck`; `npm run build`; `npm run check:architecture`; reader/dev-review production closure; reader conformance; animation Workbench browser; all gold visual commands; `npm run perf:animation`; export checks; `theseus validate workspace`. | Final release/evidence commit, then `HUMAN_CHECKPOINT`. Mark `COMPLETE` only after explicit acceptance; otherwise report the exact stop condition. |

## Gold preservation cohort

The contract should preserve at least:

1. solve-x continuous semantic motion;
2. distribution and reverse factoring;
3. fraction split, merge, or transfer behavior;
4. radical succession and exact native settlement;
5. one exponent or function-wrap structural animation;
6. one dot-product, matrix-vector, or matrix-matrix higher-order composition;
7. one equation/graph synchronized animation;
8. one program-trace frame sample.

The predecessor loop changed which artifacts are canonical. Slice 1 must
resolve the final lesson-owned canonical identities rather than copying stale
card IDs from an older inventory.

## Verification expectations

### Focused

- transformation validation and definition binding;
- correspondence and lineage closure;
- transformation-tree composition;
- runtime frame and child-frame sampling;
- direct seek and exact rewind laws;
- temporal continuity and reverse equivalence;
- presentation-profile parsing and compatibility;
- canonical frame and domain payload compilation;
- architecture import fitness.

### Standard

- focused tests for all touched modules;
- relevant TypeScript projects;
- architecture gates;
- inference and reference-closure gates;
- Theseus workspace validation;
- exact changed-path impact checks.

### Broad

- full unit test suite at meaningful tranche boundaries;
- application and test typecheck;
- production build;
- reader and dev-review production closure when shared build paths change;
- relevant browser equation, graph, animation, accessibility, and rewind
  cohorts;
- performance regression checks;
- deterministic visual contact sheets for the gold cohort;
- export or frame-sequence checks when asset projection changes affect them.

The downstream plan must use repository-stable commands. If a recurring visual
check needs new automation, add or extend a committed `npm run visual:<scope>`
entry point rather than relying on changing scratch scripts.

No check may be claimed unless it ran. Existing evidence should be treated as a
baseline, not as proof of the migrated result.

## Human exemplar checkpoint

This is primarily an architecture migration, but it touches the contracts that
produce subjective motion. The run contract must name:

- canonical reference: the final current-loop gold cohort;
- observable acceptance: no perceptible regression in identity, continuity,
  pacing, focus, native settlement, responsive behavior, and reverse motion;
- preservation boundary: semantic identity, accepted choreography, routes,
  review history, accessibility, performance, and exports;
- smallest rollback unit: one compiler-stage migration or compatibility
  adapter;
- promotion criteria: focused and broad gates pass, deterministic comparisons
  are available, and a human accepts any behavior-affecting change;
- stop condition: any unexplained visual or semantic drift.

Do not generalize a new presentation profile across families before one
representative exemplar is accepted.

## Explicit exclusions

The convergence loop must not:

- formalize, redesign, or polish the current semantic editor;
- change Markdown, prose authoring, dashboard UX, Workbench UX, reader UX, or
  curriculum navigation except for compatibility required by core migration;
- implement Lisp, topology, quadratic, arithmetic, logarithm, trigonometry,
  geometry, probability, data, economics, physics, or other new content;
- build a complete expression system, CAS, theorem prover, physics engine,
  economics solver, compiler, LSP, or arbitrary-code executor;
- create a universal scene graph without exemplar pressure;
- create a second graph, code, WebGL, tutorial, or export clock;
- let LLMs author DOM, coordinates, pixels, keyframes, renderer code, or
  unverified semantic targets;
- introduce dynamic capability loading;
- replace successful animation behavior merely to fit a cleaner abstraction;
- delete fixtures, aliases, routes, or review provenance without complete
  closure evidence;
- edit Theseus graph or event JSON directly;
- expand into the post-convergence Lisp exemplar inside the same contract.

## Stop conditions

Stop and report if:

- the active predecessor loop has not reached an authorized boundary;
- the intended migration conflicts with lesson-first canonical presentation
  ownership established by the predecessor;
- two representations have genuinely different semantic responsibilities and
  cannot be safely collapsed;
- a proposed neutral contract still contains renderer resources, DOM state,
  pixels, or WebGL handles;
- exact seek or rewind changes;
- correspondence or lineage becomes lossy;
- a canonical animation ID, route, review identity, or export artifact cannot
  be preserved;
- a visual change lacks a canonical exemplar and human checkpoint;
- performance regression exceeds the stored allowance;
- work requires formalizing the semantic editor or building a new domain;
- the loop would exceed its approved slice count or scope;
- the worktree contains overlapping user or concurrent-session changes that
  cannot be isolated safely.

## Done contract

The convergence loop is complete only when:

1. the semantic-animation compiler pipeline is documented and executable in one
   direction;
2. every important intermediate representation has a named owner and stage;
3. semantic and renderer-neutral animation modules no longer import concrete
   rendering implementations, except for explicitly frozen and justified
   migration exceptions;
4. an architecture gate prevents new dependency inversions;
5. promoted animation presentation recipes use a typed versioned profile;
6. experimental recipes remain explicitly local rather than silently joining a
   generic metadata language;
7. one canonical sampled-frame envelope and typed domain payload convention are
   established;
8. semantic animation, presentation, and product metadata are available through
   explicit narrow projections;
9. compatibility paths have durable statuses and sunset evidence;
10. the gold cohort preserves semantic identity, correspondence, seek, rewind,
    native endpoints, routes, review provenance, accessibility, performance,
    and export behavior;
11. focused, standard, broad, and visual gates required by the contract pass;
12. Theseus workspace validation passes;
13. a human accepts any behavior-affecting visual change;
14. the closeout identifies what was deleted, what was simplified, what remains
    transitional, and what is now unlocked.

## Post-convergence diagnostic exemplar

After the convergence loop closes, the recommended next priority is one small
Lisp evaluation animation:

```lisp
((lambda (x) (+ x 1)) 4)
-> (+ 4 1)
-> 5
```

Its purpose is architectural diagnosis, not content breadth. It should test:

- syntax-tree and subexpression identity;
- binding and environment provenance;
- substitution without text-diff identity fraud;
- application opening and collapsing;
- code flowing through code;
- semantic execution distinct from visual presentation;
- nested structure and selector locality;
- direct seek and exact rewind;
- use of the same animation clock, correspondence, lineage, focus, and sampled
  frame laws;
- whether a subject-native programming semantic pack can exist without a new
  runtime.

The exemplar must not begin until convergence closes and a separate priority
decision authorizes it.

## Risks and mitigations

### Premature equation-shaped generalization

Risk: consolidation freezes equation assumptions into universal contracts.

Mitigation: standardize identity, lineage, clock, staging, and dependency
direction; keep domain payloads typed; use Lisp immediately afterward as a
diagnostic pressure test.

### Behavior regression hidden by semantic tests

Risk: types and laws pass while accepted motion becomes perceptually worse.

Mitigation: preserve a gold cohort, deterministic captures, performance checks,
and a human visual checkpoint.

### Endless architecture gardening

Risk: the loop grows into a universal redesign and delays visible progress.

Mitigation: fixed slice count, explicit exclusions, compatibility facades,
behavior-preserving scope, done contract, and immediate post-loop exemplar.

### False simplification

Risk: legitimate compiler stages are collapsed because they appear redundant.

Mitigation: classify stage responsibilities before migration; collapse only
competing authorities, not meaningful compilation boundaries.

### Compatibility immortality

Risk: every old path remains forever in the name of preservation.

Mitigation: assign statuses and measurable sunset conditions; require the
closeout to report deleted and retained debt explicitly.

### Concurrent-session conflict

Risk: this successor work overlaps the still-running current loop.

Mitigation: do not activate until the predecessor closes; begin with a fresh
worktree audit and final canonical identity inventory.

## Source references

Primary direction:

- `docs/project/strategy.md`
- `docs/project/roadmap.md`
- `docs/project/threads/semantic-runtime.md`
- `docs/project/threads/cross-domain-tutorial-platform.md`
- `docs/project/reviews/2026-07-23-authoritative-roadmap-workbench-successor-loop-proposal.md`
- `docs/project/reviews/2026-07-23-kp-capability-pressure-domain-order-next-step-review.md`

Core semantic and animation contracts:

- `src/semantic/asset.ts`
- `src/semantic/asset-transformation.ts`
- `src/semantic/transformation-composition.ts`
- `src/semantic/correspondence.ts`
- `src/semantic/semantic-lineage-graph.ts`
- `src/semantic/semantic-scene-protocol.ts`
- `src/semantic/canonical-operation-contract.ts`
- `src/semantic/canonical-operation-spec.ts`
- `src/semantic/transformation-definition-binding.ts`
- `src/animation/kernel.ts`
- `src/animation/asset.ts`
- `src/animation/runtime-sampler.ts`
- `src/animation/runtime-laws.ts`
- `src/animation/temporal-continuity-laws.ts`
- `src/animation/choreography-plan.ts`
- `src/animation/choreography-timeline.ts`
- `src/rendering/semantic-equation-transition-compiler.ts`
- `src/rendering/equation-transition-ir.ts`
- `src/rendering/equation-motion-plan.ts`
- `src/rendering/equation-motion-sampler.ts`
- `src/rendering/visual-motif.ts`

Representative adapters and preservation evidence:

- `src/animation/linear-solve-adapter.ts`
- `src/animation/distribution-adapter.ts`
- `src/animation/exponent-radical-adapter.ts`
- `src/animation/graph-adapter.ts`
- `src/animation/programming-adapter.ts`
- `docs/project/reviews/2026-07-17-semantic-material-motion-performance-loop-closeout.md`

Focused test references:

- `tests/kp-animation-asset.test.ts`
- `tests/kp-animation-runtime-laws.test.ts`
- `tests/kp-animation-runtime-sampler.test.ts`
- `tests/kp-animation-transform-tree-composition-contract.test.ts`
- `tests/correspondence-composition.test.ts`
- `tests/semantic-lineage-graph.test.ts`
- `tests/semantic-scene-protocol.test.ts`
- `tests/equation-transition-ir.test.ts`
- `tests/equation-motion-plan.test.ts`
- `tests/equation-motion-sampler.test.ts`
- `tests/kp-program-trace-asset.test.ts`
- `tests/program-trace-frame-preview.test.ts`

Future diagnostic design:

- `docs/superpowers/specs/2026-07-21-semantic-programming-language-theater-design.md`
- `docs/project/decisions/2026-07-21-kp-semantic-explanatory-atlas-exploration.md`

## Exact handoff request for the next session

The next approval request should be interpreted as:

> Make
> `docs/project/reviews/2026-07-23-semantic-animation-convergence-successor-loop-proposal.md`
> the new successor priority after confirming the predecessor contract is at
> its completed boundary. Use `$theseus-project` and `$theseus-loop long`.
> Reconcile roadmap, thread, plan revision, priority, and run-contract authority
> without deleting historical plans. Propose the exact 20-30-slice typed run
> contract recorded above, including its preservation boundary, verification
> cadence, rollback units, stop conditions, and human checkpoint. Do not
> execute until I approve this exact proposal.

The document and priority record do not authorize execution. The user must
explicitly approve `run-contract.kp.semantic-animation-convergence-v1`.
