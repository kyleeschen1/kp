# Semantic State Architecture Sequencing Review

Date: 2026-09-02
Status: ACCEPTED DIRECTION; EXECUTION REQUIRES LOOP-SPECIFIC APPROVAL
Active thread: `../threads/typed-semantic-authoring-framework.md`

## Context

This review synthesizes the authoring and semantic-state discussion after the
nonlinear circle-area pressure implementation. The user accepted its direction
on 2026-09-02. It extends the typed semantic authoring program but does not
replace the currently accepted unit-scalar differentiable-map helper
experiment, authorize renderer changes, or by itself start a Theseus run.

The central proposal is a persistent semantic object graph with a scoped,
typed transactional authoring facade. Authors should be able to write concise,
locally mutable-looking transformations while KP retains immutable versions,
explicit identity and lineage, deterministic derivation, exact state recovery,
and renderer-independent correspondence.

## Conclusions Reached

### Knowledge and domain declarations

- Definitions, claims, theorems, lemmas, properties, examples, close
  counterexamples, procedures, and formula schemas should be first-class and
  referable, but they should not be collapsed into one universal object type.
- A market is best understood as a domain-owned semantic context that binds
  supply, demand, policy, equilibrium, welfare, and other roles together. A
  perspective such as household, firm, or government projects meaning from
  that shared context; it does not create an unrelated copy of truth.
- Procedures require typed inputs, ordered rules and judgments, nested calls,
  provenance, and independently selectable presentation granularity. An outer
  matrix-multiplication procedure may invoke dot products without erasing the
  nested trace.
- Semantic macros should construct typed objects rather than substitute
  strings. Candidate families include indexed sums and products, series views,
  Taylor and Maclaurin expansions, differential and integral forms, gradients,
  trigonometric identities, and parameterized domain formulas.
- Conditions and algebraic properties carry evidence and assumptions. KP
  should not turn `isMonoid`, `symmetric`, or a similar boolean into proof.

### Identity, versions, and provenance

- A mathematical relation or snapshot is immutable. A persistent domain
  entity such as a market may retain identity across a succession of immutable
  versions.
- Semantic entity identity, immutable version identity, contextual role,
  authored alias, display label, state occurrence, representation, and
  equivalence are separate notions.
- States should not be intrinsically named after the event that preceded them.
  An author may bind a useful alias, while generated IDs and transformation
  provenance remain the stable recovery mechanism.
- A semantic transformation applied to one starting snapshot and typed inputs
  produces an applied transformation with `before`, `after`, a change set,
  correspondence, assumptions, and provenance.
- Scrubbing does not create an indefinite durable history. `at(progress)` is a
  deterministic, ephemeral evaluation within one applied transformation;
  meaningful endpoints and checkpoints remain persistent.
- Historical inspection, reverting, and branching are distinct. Any old
  object may be inspected or projected, but making one old child current while
  retaining incompatible dependents must be a new coherent transformation.

### Aggregate state and transformations

- One learner-visible step may aggregate changes across multiple domain
  objects. The consistency boundary is therefore an aggregate semantic
  snapshot, not an isolated object-local history.
- Unchanged roles persist through structural sharing. Changed roles carry
  explicit correspondence and disposition such as persisted, revised,
  introduced, removed, copied, or derived.
- Multiple transformations that write the same entity must explicitly
  sequence, compose, or demonstrate safe independence. Last-write-wins is not
  semantic authority.
- The active timeline location distinguishes a stable state from progress
  inside a transformation. Text, behavior, navigation, and URLs bind to
  logical `before`, `during`, and `after` anchors rather than browser time.
- A text-only hold or attention change may have identical semantic endpoints;
  it remains an explicit attentional or presentation event rather than a fake
  domain mutation.

### Typed transactional facade

- Inside a transformation callback, a scoped state facade may provide
  read-your-writes behavior while every operation still creates immutable
  versions behind the scenes.
- A live reference resolves the latest local version in the current
  transaction. A pinned reference resolves one exact snapshot or version.
  Live references must not escape their transaction scope.
- Properties expose explicit identity-aware operations rather than accepting
  ambiguous plain assignment:
  - `update(previous => next)` creates a new version for the same entity;
  - `bind(other)` makes two roles refer to the same entity;
  - `bindCopy(other)` creates a distinct entity with `copiedFrom` lineage; and
  - `derive(compute)` creates a dependency-backed relationship rather than a
    copied value.
- True aliases in the same transaction observe the same revised entity.
  Previously committed snapshots remain pinned, which prevents spooky action
  across history.
- A runtime `Proxy` may improve authoring ergonomics and record access paths,
  but TypeScript types, explicit identity operations, and deterministic
  semantic records remain authoritative. A proxy cannot infer causal meaning,
  law evidence, copy intent, or domain correctness.

### Derived values and interpolation

- Derived values are evaluated lazily, cached by the derivation definition and
  complete dependency-version tuple, and invalidated only when their
  dependencies change.
- Cache population and ordinary reads are not semantic events. The dependency
  engine must detect cycles and report the semantic dependency path.
- Transformation callbacks must be deterministic from their starting
  snapshot, typed inputs, and normalized progress. Ambient time, randomness,
  mutable closure state, and external effects cannot supply semantic truth.
- Interpolation should change independent inputs and recompute dependent
  values. It should not independently interpolate equilibrium, revenue,
  surplus, labels, and geometry when those values are semantically derived.
- Only the affected dependency subgraph and the values requested by active
  projections need to be evaluated at each sample. Intermediate caches should
  be short-lived rather than permanently indexed by arbitrary floating-point
  progress values.
- KP needs three explicit transition modes: semantic interpolation for
  meaningful intermediate states, presentation interpolation for visual
  choreography between fixed semantic endpoints, and discrete or piecewise
  transitions for regime changes and discontinuities.
- Ordered callback operations are valuable provenance and may define a
  procedure trace, but source-code statement order must not silently become
  animation choreography. Named semantic or pedagogical beats own visible
  ordering.

## Candidate Comparison

Scores run from 1 (low) to 5 (high). Higher slice scores mean smaller and more
reversible work; higher risk scores mean more speculative complexity.

| Candidate | Authoring | Reliability | Reuse | Slice | Risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Finish test-ledger recovery and the accepted unit-scalar helper | 5 | 5 | 5 | 4 | 2 | Preserve as current prerequisite |
| Specify identity, snapshot, slot, and transformation laws | 4 | 5 | 5 | 5 | 2 | First new architecture step |
| Implement explicit persistent snapshots and slot operations | 5 | 4 | 5 | 4 | 3 | First bounded runtime proof |
| Add lazy dependency evaluation and ephemeral `at(progress)` | 5 | 4 | 5 | 3 | 4 | Add only after identity laws pass |
| Aggregate multiple object changes into global timeline steps | 4 | 4 | 5 | 3 | 4 | Pressure after one-object proof |
| Connect semantic changes to Graph2D and KaTeX motion | 5 | 3 | 5 | 2 | 4 | Wait for semantic exemplar review |
| Build broad definitions, procedures, and formula packs | 5 | 2 | 5 | 1 | 5 | Defer broad work; add bounded callers later |
| Pressure LLM authoring and generated plumbing | 5 | 3 | 4 | 4 | 3 | Run after the public authoring shape stabilizes |

## Recommended Order

### 0. Finish the existing bounded work

First restore or explicitly classify the stale repository-wide test ledger,
then implement and review the already accepted internal
`defineKpAuthoredUnitScalarMap` experiment. Do not pull the proposed state
architecture into that helper. The helper is lower-level typed-math
compression and gives the next work a healthier, smaller foundation.

After the helper checkpoint, reconcile the typed market pressure caller with
the canonical exact-rational supply-tax model before exposing a visible market
runtime. KP must retain one economics source of truth.

### 1. Write the semantic state contract and executable laws

Define only the minimum distinctions needed by the exemplar:

- aggregate snapshot and snapshot ID;
- semantic entity ID and immutable version ID;
- role or slot ID;
- live and pinned references;
- transformation definition and applied transformation IDs;
- author aliases versus display labels;
- update, bind, copy, derived, introduce, and remove dispositions; and
- exact `before`, `after`, and `at(progress)` laws.

Test aliasing, copying, structural sharing, branch isolation, endpoint
equivalence, deterministic replay, and invalid cross-scope reference escape.
Do not begin with a universal entity-component system or global store.

### 2. Implement an explicit persistent snapshot kernel

Build the internal value/version/binding representation and the four explicit
slot operations without relying on transparent proxy magic. Use one tiny
nonvisual fixture first. A transaction should provide read-your-writes,
collect an ordered diagnostic journal, freeze atomically, and return an applied
transformation record.

The semantic result should be a complete immutable snapshot. The journal is
provenance and procedural evidence, not the only way to recover current state.

### 3. Add the typed ergonomic facade

Once the explicit kernel is correct, add the scoped TypeScript facade and only
then evaluate whether a runtime `Proxy` materially improves hand authoring.
Preserve local autocomplete, reserve unambiguous framework operations, reject
plain assignment, and invalidate live references when the callback ends.

Measure authored lines, manual identity literals, error locality, and inferred
compiler closure against the explicit form. Keep the facade only if it reduces
work without hiding identity semantics.

### 4. Add the derived dependency graph

Declare equilibrium and related values once in the market schema rather than
inside every policy transformation. Support lazy reads, dependency-version
memoization, targeted invalidation, dynamic-read capture where safe, explicit
dependencies where required, cycle diagnostics, and read-only derived slots.

Prove that reading or failing to read a derived value never changes semantic
history and that two structurally shared snapshots reuse unaffected results.

### 5. Add applied transformations as state families

Represent an applied transformation as persistent endpoints plus a pure,
ephemeral `at(progress)` evaluator. Prove `at(0)` equals `before`, `at(1)`
equals `after`, backward and repeated sampling are deterministic, and changing
the runtime input produces a separate applied transformation with preserved
provenance.

Interpolate only declared independent drivers. Recompute requested descendants
incrementally. Add explicit discrete and presentation-only modes instead of
forcing discontinuous domain changes through a generic `lerp`.

### 6. Pressure with the canonical supply-tax exemplar

Apply the kernel to one supply-demand tax transformation after exact-rational
parity exists. Recover baseline and taxed states directly, reparameterize the
tax at runtime, sample intermediate market states, and verify equilibrium,
incidence, welfare, units, lineage, and cache invalidation without a renderer.

This is the ROI gate. Continue only if the transformation author changes a
small number of independent facts while the shared domain declaration supplies
correct consequences and useful diagnostics.

### 7. Add aggregate composition and timeline addressing

Allow one global semantic transformation step to coordinate several domain
objects and nested transformations. Add explicit sequencing and conflict
diagnostics, stable scoped names, generated state handles, `before`, `after`,
and historical `at` access, branch recovery, and logical URL locations for
state versus in-transition progress.

Do not make object-local rewind mutate an otherwise current aggregate. A local
restore is either historical inspection or a new coherent transformation.

### 8. Connect one reviewed projection

Project the supply-tax change through the existing Graph2D and KaTeX seams.
Use semantic correspondence to show persistent material, revised curves,
historical traces, and derived labels. Keep semantic interpolation distinct
from renderer-owned movement, opacity, and layout. Attach prose and controls to
logical before/during/after anchors and stop for human review.

Only after approval should a second domain caller pressure aggregate
composition or a shared visual treatment.

### 9. Layer knowledge objects and procedures onto the proved state model

Add one bounded definition/claim family, one parameterized formula schema, and
one compositional procedure. A useful pressure set would combine a formula
with conditions and examples, a finite sigma expansion, and matrix
multiplication invoking dot-product traces at selectable granularity.

Keep semantic procedure trace separate from visible disclosure. Do not build a
universal ontology, broad formula catalogue, theorem prover, or CAS.

### 10. Add generated plumbing and LLM authoring pressure

Generate only deterministic mechanical artifacts: optics, schemas,
serialization, autocomplete documentation, catalogue metadata, and
conformance fixtures. Then ask an LLM to author a fixed valid and invalid
corpus through curated imports. Measure compilation, repairs, diagnostics,
typed gaps, runtime reparameterization, and whether the model avoids minting
identity, evidence, timing, geometry, or domain truth.

## Stop Conditions

- The design requires one mutable global proxy or import-order registry.
- Plain JavaScript assignment or object identity becomes semantic authority.
- Reading a derived value changes committed state or transformation history.
- Arbitrary progress samples accumulate as permanent snapshots or cache keys.
- Statement order silently becomes learner-facing choreography.
- A local rewind can create an aggregate state that violates dependencies.
- The framework guesses aliases, copies, causal meaning, units, laws, or
  domain assumptions that the author did not state.
- The experiment grows into a general CAS, theorem prover, universal ontology,
  renderer, or state manager before the market proof establishes ROI.

## Current Recommendation

Preserve the accepted test-ledger and unit-scalar-helper sequence. After that
checkpoint, begin with the state contract and executable identity laws,
followed by an explicit nonvisual snapshot kernel. The first major continuation
decision belongs after the canonical supply-tax transformation demonstrates
concise authoring, deterministic interpolation, exact recovery, and coherent
derived values.

## Long-Loop Estimate

The stale-ledger recovery and unit-scalar helper should remain one or two
focused short iterations; padding them into a long loop would increase scope
without improving evidence. After that preflight, the accepted direction has
three useful completion horizons:

- **Three long loops** reach the decisive nonvisual semantic proof: persistent
  state laws and kernel; transactional facade and derivation graph; then state
  families, interpolation, and the canonical market pressure caller.
- **Five long loops** reach a visible production-shaped exemplar: the first
  three, followed by aggregate composition and timeline addressing, then one
  Graph2D/KaTeX projection with a mandatory human checkpoint.
- **Seven long loops** cover the full recorded horizon: the first five,
  followed by bounded knowledge objects/procedures/macros, then generated
  plumbing and LLM authoring pressure.

This is an architecture-risk estimate rather than a duration promise. Each
loop should contain roughly 20-30 independently verifiable slices and stop at
its stated API, semantic, or human checkpoint. Do not materialize all seven
contracts in advance: later loop contents must respond to the evidence and API
shape produced by the preceding checkpoint.
