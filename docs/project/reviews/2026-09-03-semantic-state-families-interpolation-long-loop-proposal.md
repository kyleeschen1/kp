# Semantic State Families And Ephemeral Interpolation Long-Loop Proposal

Date: 2026-09-03
Status: APPROVED; V2 ACTIVE
Target:
`next-action.kp.typed-authoring.semantic-state-families-interpolation`
Active contract:
`run-contract.kp.semantic-state-families-interpolation-v2`
Superseded preflight contract:
`run-contract.kp.semantic-state-families-interpolation-v1`
Active thread: `../threads/typed-semantic-authoring-framework.md`
Source checkpoint:
`2026-09-03-typed-semantic-state-facade-derived-graph-closeout.md`

## Recommendation

Approve a 26-slice, nonvisual Loop 3 that adds one internal applied semantic
state-family boundary over the completed persistent snapshot and derived-graph
kernel. An applied family should retain exact persistent `before` and `after`
snapshots while a caller-owned disposable evaluator supplies pure ephemeral
`at(progress)` samples. Intermediate samples must overlay only declared
independent drivers, recompute requested derived descendants, and mint no
snapshot or version authority.

Use exact rational progress for the semantic boundary. The canonical
supply-tax pressure case should change only one independently declared tax
amount and obtain equilibrium, incidence, and government revenue from
domain-owned exact-rational economics. Use the existing renderer-free circle
measurement caller as the structurally different second family: interpolate a
unit-tagged radius and derive its nonlinear area and point-dependent response.

Keep semantic interpolation, discrete or piecewise change, and
presentation-only transition declarations distinct. Stop at a mandatory API
and architecture checkpoint before aggregate timeline composition, runtime
clock adaptation, URL addressing, public promotion, Graph2D, KaTeX, Article,
or live-model work.

## Why This Loop Is Current

The completed Loop 2 established the hard prerequisites: exact typed handles,
immutable endpoint application, an explicit dependency graph, lazy requested
evaluation, exact dependency-version fingerprints, a caller-owned cache, and
history-free recovery. It deliberately did not answer how one applied
transformation represents meaningful intermediate semantic states.

Moving directly to a timeline or renderer would leave that question to clock
code or presentation adapters. The likely failure modes are already visible:
arbitrary progress values could be persisted as snapshots, derived market
outcomes could be independently interpolated instead of recomputed, floating
progress could weaken exact economics, or renderer code could become the first
owner of state-family semantics. This loop resolves those risks without a
visible surface.

Long mode is appropriate because the work crosses transformation application,
ephemeral value resolution, graph evaluation, cache authority, exact
economics, unit-tagged nonlinear math, TypeScript inference, and durable
history laws. The expected effort is approximately 12-20 agent hours. That is
an architecture-risk estimate, not a delivery promise.

## Architecture Decision To Pressure

The proposed boundary is:

```text
persistent before snapshot
+ typed family parameters and source provenance
+ declared semantic, discrete, or presentation-only transitions
-> persistent applied transformation and after snapshot
-> disposable evaluator
-> at(exact progress)
-> endpoint pin OR ephemeral driver overlay
-> requested derived closure
-> frozen sample view with no durable identity
```

The important distinctions are:

- A state-family definition reuses the existing transformation-definition and
  applied-transformation identity kinds; it does not create a parallel
  identity system.
- An applied family persists parameters, source provenance, its exact endpoint
  application, and the transition declarations needed to reproduce it.
- Exact endpoints return the already committed snapshots. `at(0)` does not
  rebuild `before`, and `at(1)` does not rebuild `after`.
- An interior sample is a read source over a persistent base snapshot plus
  transient declared-driver values. It is not an aggregate snapshot, cannot be
  pinned into recovery, and owns no semantic version ID.
- A transient dependency token may key a disposable cache, but it is not
  semantic identity. Its inputs include the applied transformation, driver,
  normalized exact progress, endpoint versions, and interpolation declaration.
- Derived values are recomputed from the sampled independent driver. They are
  never interpolated independently merely because a renderer wants a smooth
  number.
- State-family application is separate from evaluator lifecycle.
  Reparameterization creates a new applied transformation; it never mutates an
  existing family, endpoint, cache, or provenance record.
- A later runtime adapter may quantize a clock's numeric progress into this
  exact boundary. That policy belongs to aggregate timeline/runtime work and is
  intentionally absent here.

The exact TypeScript spelling remains pressure-tested rather than pre-frozen.
Definition-scoped interpolation and compute functions may remain executable
capabilities paired with serializable declarations, as the derived graph does
today. They must not be represented as durable semantic data or discovered by
observing reads.

## Canonical Boundaries

- **Canonical artifact:** the new internal applied state-family records and
  the supply-tax and circle pressure fixtures described below.
- **Host:** none. Every proof is exercised through direct internal runtime and
  type tests.
- **Renderer:** none. No Graph2D, KaTeX, SVG, Canvas, WebGL, DOM, or code
  renderer changes are authorized.
- **Semantic state source of truth:** immutable aggregate snapshots,
  transactions, typed handles, explicit derived declarations, and the
  dependency graph under `src/semantic-state/`.
- **Economics source of truth:** the exact-rational per-unit-tax model and
  accounting under `domains/economics/`. State-family code may interpolate the
  declared tax input, but it may not copy equilibrium or welfare formulas.
- **Second pressure source:** the existing unit-tagged circle map in
  `tests/fixtures/typed-circle-measurement.ts`. Its algebraic signed-coordinate
  extension and current unit guards remain authoritative for that fixture.
- **Evaluation state:** ephemeral sample overlays, request-local memoization,
  and explicitly bounded caller-owned caches. None enter semantic history or
  recovery.
- **Rollback unit:** one verified slice commit. Reverting the state-family
  modules and pressure fixtures must not revert the completed snapshot kernel,
  derived graph, canonical economics, typed-math helpers, or reviewed visual
  exemplars.

## Next-Step Candidate Comparison

Scores run from 1 (low) to 5 (high); higher risk means more speculative
complexity.

| Candidate | Authoring | Reliability | Reuse | Risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | --- |
| Applied state families plus pure ephemeral sampling | 5 | 5 | 5 | 4 | Do next; this proposal |
| Aggregate composition and timeline addressing | 4 | 4 | 5 | 4 | Wait for one-family laws and two callers |
| First Graph2D and KaTeX projection | 5 | 3 | 5 | 4 | Wait for Loop 3 and aggregate Loop 4 |
| Public facade and compatibility migration | 4 | 3 | 4 | 4 | Wait for cross-caller API review |
| Knowledge, procedure, and macro families | 5 | 2 | 5 | 5 | Defer beyond state and timeline proof |
| Live LLM generation and repair evaluation | 4 | 2 | 4 | 5 | Defer until the public authoring shape stabilizes |

This keeps the accepted horizon intact: this proposal is Loop 3, aggregate
composition is Loop 4, and the first reviewed Graph2D/KaTeX connection is Loop
5. Existing KaTeX transformations remain on their current canonical path until
that reviewed integration loop; this proposal does not rewrite them.

## Acceptance Contract

The loop succeeds only if all of the following are true:

1. Exact normalized semantic progress has one canonical representation,
   rejects invalid or out-of-range values, and makes equivalent fractions the
   same sampling and cache input.
2. State-family declarations distinguish semantic interpolation, discrete or
   piecewise change, and presentation-only change without letting any mode
   silently substitute for another.
3. Applying a family creates one ordinary persistent endpoint transformation
   with exact `before`, `after`, commit, change, correspondence, lineage,
   parameters, and source provenance.
4. Endpoint writes are limited to declared semantic or discrete drivers.
   Presentation-only declarations authorize no semantic write.
5. `at(0)` returns the exact committed `before` authority and `at(1)` returns
   the exact committed `after` authority without interpolation or derived
   recomputation.
6. Interior samples mint no aggregate snapshot IDs, entity versions,
   transaction journals, changes, correspondence, provenance, lineage, or
   recovery entries.
7. A sample overlays only declared driver values. Unchanged concrete
   dependencies retain exact persistent entity/version tokens.
8. Derived evaluation accepts a bounded read-source abstraction that preserves
   all existing snapshot behavior and can also resolve ephemeral driver
   tokens without pretending they are version IDs.
9. Evaluation remains lazy and requested. A sample recomputes only affected
   requested descendants, and unrequested or unaffected branches do not run.
10. Caller-owned sample caching has an explicit capacity and disposal
    lifecycle. Cache state affects performance only, never equality, recovery,
    or semantic history.
11. Direct seek, rewind-shaped access, repeated sampling, equivalent rational
    progress, failure/retry, and sampling order are deterministic.
12. Reparameterization creates a distinct applied transformation with frozen
    parameters and explicit provenance back to the source application; it does
    not mutate the source application or share mutable evaluator state.
13. The supply-tax family changes one exact tax driver and derives
    buyer-facing supply, equilibrium, incidence, and government revenue from
    canonical domain-owned exact-rational economics at endpoints and sampled
    intermediate values.
14. The circle family uses the same generic state-family and sample machinery
    to change one unit-tagged radius and derive nonlinear area and a
    point-dependent response while retaining compile-time and runtime unit
    rejection.
15. Cross-caller authoring remains free of routine low-level semantic IDs,
    stores, fake snapshots, casts, generic staging, renderer concepts, and
    caller-specific evaluator branches.
16. The semantic-state suite, exact domain parity, typecheck, architecture,
    inference, bundle, complete tests, and Theseus validation pass at the final
    checkpoint.

## Allowed Work

- New internal exact-progress, state-family declaration/application,
  ephemeral sample-source/view, generalized derived-resolution, transient
  fingerprint, and bounded evaluator-cache modules under `src/semantic-state/`
- Narrow compatible extensions to the existing transform application,
  handle-view, derived evaluator, fingerprint, and cache boundaries required
  to read an ephemeral source while preserving snapshot overloads
- One canonical domain-owned exact-rational parameterized-tax evaluation seam
  under `domains/economics/`, implemented by reusing existing market and
  accounting authority rather than copying formulas into semantic state
- One internal supply-tax state-family pressure fixture and its exact runtime
  and type tests
- One test-owned circle state-family pressure fixture that reuses the existing
  typed circle measurement and unit-scalar map
- Focused law tests, negative TypeScript fixtures, authoring metrics, cache and
  history instrumentation, one attributed inference fixture, and durable
  Theseus evidence
- At most one measured post-core inference-ratchet refresh at s16, only if the
  new direct fixture explains the growth, no broad import caused it, and the
  new ceilings equal `ceil100(measured types * 1.02)` and
  `ceil100(measured instantiations * 1.03)`
- Closeout and project-memory updates required by the approved run

## Disallowed Work

- Aggregate timeline composition, multiple-family scheduling, clock ownership,
  numeric-clock quantization policy, logical URL addressing, navigation, or
  playback controls
- Graph2D, KaTeX, SVG, Canvas, WebGL, DOM, CSS, browser, Animation Catalogue,
  Focus Deck, Article, public-route, or publication integration
- Migration or rewrite of existing KaTeX transformations, compositor sessions,
  economics frames, or visual state adapters
- A public semantic-state facade, root namespace, compatibility migration,
  broad barrel, or catalogue-wide rollout
- Persisting arbitrary progress samples, sample tokens, cache entries, compute
  closures, or evaluator lifecycle into snapshots or recovery
- Floating-point progress as exact economics authority, unbounded cache keys,
  independently interpolated equilibrium/welfare values, or renderer-derived
  semantic truth
- Runtime `Proxy` observation, implicit assignment, ambient transaction state,
  global mutable stores, evaluator registries, import-order authority, or
  filesystem code generation
- A general reactive graph, event store, persistent-collection redesign,
  spreadsheet engine, universal state manager, unit algebra, economics
  ontology, CAS, theorem prover, HKT/typeclass hierarchy, knowledge catalogue,
  procedure system, or macro catalogue
- Broad generated-authoring or live-LLM evaluation; unsupported declaration
  shapes must remain typed errors or explicit repair gaps
- A second inference-ceiling increase or an unexplained first increase

## Dependencies

- The accepted architecture ordering in
  `2026-09-02-semantic-state-architecture-sequencing-review.md`
- The completed persistent snapshot and transaction kernel
- The completed typed facade, explicit derived graph, evaluator,
  dependency-version fingerprint, caller-owned cache, and history laws in
  `2026-09-03-typed-semantic-state-facade-derived-graph-closeout.md`
- The canonical exact-rational per-unit-tax model, accounting, and parity tests
- The retained internal `defineKpAuthoredUnitScalarMap` helper and existing
  nonlinear circle pressure fixture
- Current semantic-state, economics, typed-math, architecture, inference,
  typecheck, bundle, complete-test, impact, and Theseus validation commands

## Verification And Context Cadence

- **Focused:** run the named law test or negative type fixture and inspect
  `npm run verify:impact -- --path <changed-path>` before following its scoped
  recommendation.
- **Standard:** focused proof plus `npm run typecheck` and
  `theseus workspace validate`.
- **Broad:** standard proof plus applicable `npm run check:architecture`,
  `npm run check:inference`, `npm test`, and `npm run build:bundle` gates.
- No browser or manual visual check belongs to this nonvisual loop. The final
  manual checkpoint reviews only the architecture, API packet, metrics, and
  retained/deferred boundaries.
- Every completed slice records its Theseus context and verification evidence
  and normally produces one exact-path commit containing implementation,
  tests, and the completed-slice event.
- Start each slice from one brief Theseus context capsule. Use working context
  only for a source-dependent question the capsule cannot answer.
- Derive progress from `npm run --silent loop:status` at slice start,
  completion, commit boundaries, and before any stop or final response.

## Proposed Ordered Slices

Every row is one independently reversible commit boundary.

| Slice | Target and intended change | Risk | Verification level and expected checks | Commit boundary | Slice stop condition |
| --- | --- | --- | --- | --- | --- |
| s01 | **Baseline and law ledger.** Freeze the current semantic-state, economics, circle, history, inference, and authoring metrics; record the exact absence of sampling APIs and identify the persistent inventories that arbitrary samples must not change. | Medium: a weak baseline could miss hidden authority growth. | Broad diagnostic: semantic-state suite, supply-tax and circle tests, typecheck, architecture, inference, complete test, bundle, and Theseus validation. | Commit characterization tests and dated metrics only. | Stop if Loop 2's broad gates are no longer green or the persistent history inventories cannot be compared exactly. |
| s02 | **Exact semantic progress.** Add one thin internal progress validator over the existing exact-rational provider, with comparison/encoding helpers and canonical zero and one values. | Medium: a second rational implementation or lossy normalization would split authority. | Focused: zero, one, proper fractions, equivalent fractions, negative, over-one, zero-denominator, canonical encoding, and frozen-value laws. | Commit progress value and focused tests only. | Stop if progress requires floating-point authority, duplicates rational arithmetic, or cannot canonicalize equivalent fractions. |
| s03 | **Transition-mode declarations.** Add disjoint serializable declarations for semantic interpolation, discrete/piecewise change, and presentation-only transition, each with exact target/source metadata and locally typed diagnostics. | High: one permissive union could let presentation metadata authorize semantic writes. | Standard: positive declaration fixtures, exhaustive narrowing, duplicate/foreign target diagnostics, invalid mixed-mode type fixtures, typecheck, and Theseus validation. | Commit declaration types and validation without sampling behavior. | Stop if a mode can silently fall back to another, infer a target from reads, or store executable closures as serializable truth. |
| s04 | **Typed family definition and application records.** Pair the serializable transition declarations with definition-scoped application/interpolation capabilities, typed parameters, source provenance, and existing transformation IDs. | High: a new family identity system or captured mutable parameter could fork transformation authority. | Standard: exact parameter inference, deterministic definition/application IDs, frozen inputs, source provenance, invalid parameter fixtures, typecheck, and Theseus validation. | Commit record/capability shells without interior sampling. | Stop if family identity cannot reuse current transformation identities, parameters require casts, or callback identity becomes authority. |
| s05 | **Persistent endpoint application.** Apply typed family parameters through the existing transaction and transform kernel to produce the ordinary commit, change set, correspondence, lineage, and exact pinned endpoints. | High: a family-specific commit path would create a second persistent-state implementation. | Broad: exact equivalence with the existing transform application, commit/abort, structural sharing, adapter projection, recovery, architecture, typecheck, inference, bundle, complete test, and Theseus validation. | Commit endpoint integration and preservation tests together. | Stop if the family bypasses current transactions, weakens atomicity, or needs new snapshot/version authority. |
| s06 | **Declared-driver write gate.** Compare the endpoint change set with transition declarations and reject undeclared writes, missing semantic/discrete writes, presentation-only writes, and changed derivation authority. | High: endpoint validation after commit could permit an incoherent application to escape. | Standard: one-driver success plus undeclared, missing, presentation-only, cross-schema, derived-write, and graph-change failures; typecheck and Theseus validation. | Commit application validation and typed errors only. | Stop if endpoint application can escape before validation, or a family requires implicit whole-object diff semantics. |
| s07 | **Ephemeral sample-source contract.** Introduce a read-source abstraction that can describe a persistent snapshot endpoint or an interior base-plus-driver overlay without presenting the overlay as `KpAggregateSemanticSnapshot`. | High: a convenient view could accidentally become recoverable semantic state. | Broad: structural source laws, snapshot adapter parity, no snapshot/version ID on interior samples, frozen overlay data, exact history inventory, architecture, typecheck, and Theseus validation. | Commit source contracts and snapshot adapter without graph evaluation. | Stop if an interior source must mint a snapshot/version ID, enter recovery, or mutate the base snapshot. |
| s08 | **Exact endpoint short-circuit.** Add the evaluator shell and make exact zero and one return the already committed endpoint sources and pinned handle views without interpolation, overlay allocation, compute calls, or cache insertion. | High: reconstructed endpoints could be value-equal while losing exact identity and provenance. | Broad: strict endpoint snapshot equality, pinned reads, zero interpolation/compute/cache counts, branch recovery, architecture, typecheck, inference, and Theseus validation. | Commit endpoint behavior and laws only. | Stop if either endpoint is reconstructed, assigned transient tokens, or differs from the committed application authority. |
| s09 | **Typed semantic-driver interpolation.** Evaluate one declared semantic driver at interior exact progress through its typed definition-scoped interpolator and expose it in the ephemeral overlay. | High: generic persistent-value interpolation would erase domain types and invite derived-value lerp. | Standard: exact callback types, one-driver overlay, canonical equivalent-progress result, invalid result diagnostics, typecheck, and Theseus validation. | Commit semantic interpolation capability and focused laws only. | Stop if the callback receives the broad persistent-value union, writes another slot, or can interpolate a derived target. |
| s10 | **Discrete and presentation-only semantics.** Implement exact piecewise selection for a bounded discrete fixture and define presentation-only sampling as unchanged semantic authority plus explicit transition metadata. | High: thresholds can become hidden choreography or fake domain mutation. | Standard: exact threshold boundaries, direct/rewind access, unchanged presentation-only reads, zero presentation writes, exhaustiveness, typecheck, and Theseus validation. | Commit mode behavior and law fixtures only. | Stop if statement order, renderer timing, or an implicit default threshold determines semantic state. |
| s11 | **Generalized concrete resolution.** Extend the existing concrete dependency resolver behind a compatible source interface so committed snapshots retain exact entity/version results while driver overlays return explicit transient dependency tokens. | High: changing the evaluator seam can regress every derived snapshot caller. | Broad: all current concrete-resolution, alias, copy, absence, foreign-scope, and historical snapshot laws plus new overlay cases; architecture, inference, typecheck, complete test, bundle, and Theseus validation. | Commit the compatible resolver seam and preservation evidence. | Stop if current snapshot APIs break, transient tokens masquerade as versions, or resolution consults ambient state. |
| s12 | **Transient derivation fingerprints.** Compose fingerprints from existing exact version tokens and explicit transient driver tokens that include family application, driver declaration, endpoint versions, and normalized progress. | High: weak tokens can return stale derived values; overly broad tokens can defeat selective reuse. | Standard: equivalent-progress equality, changed-progress distinction, application/parameter separation, unaffected concrete-token reuse, nested-derived determinism, typecheck, and Theseus validation. | Commit fingerprint union and focused tests only. | Stop if keys use payload serialization, JavaScript object identity, whole-sample identity, raw non-normalized fractions, or fake semantic IDs. |
| s13 | **Derived evaluation over a sample source.** Evaluate one requested derived closure against the overlay-aware resolver while retaining definition authority from the persistent base and exposing a frozen typed sample view. | High: mixed persistent/transient reads can leak partial or stale values. | Broad: single, chain, diamond, unaffected branch, stale definition, invalid result, and no-partial-result laws; all existing evaluator tests, architecture, inference, typecheck, complete test, bundle, and Theseus validation. | Commit sample-aware evaluation and handle-view integration together. | Stop if graph definitions change per sample, unrequested nodes run, or a partial sample view escapes. |
| s14 | **Bounded caller-owned evaluator cache.** Add explicit capacity, stats, reset, and idempotent disposal to the applied-family evaluator; keep request memoization separate and preserve the current snapshot cache. | High: an unbounded progress cache can retain arbitrary history or become global authority. | Standard: deterministic eviction, capacity zero/minimum/limit cases, hit/miss accounting, reset, double disposal, post-disposal errors, application isolation, typecheck, and Theseus validation. | Commit evaluator lifecycle and cache laws only. | Stop if entries are unbounded, globally registered, attached to snapshots/applications, or visible to semantic equality and recovery. |
| s15 | **Seek, rewind, repeat, and retry laws.** Pressure nonmonotonic access orders, direct midpoint access, repeated equivalent progress, evaluator reset, disposal/recreation, and recovery after one failed sample. | High: hidden previous-sample state would make playback direction authoritative. | Broad: permutation corpus over exact progress, equality of direct and sequential access, no failed cache value, history inventory, architecture, inference, typecheck, complete test, bundle, and Theseus validation. | Commit deterministic law corpus and bounded corrections only. | Stop if results depend on prior samples, direction, wall time, randomness, mutable closures, or a failed attempt. |
| s16 | **Authority and compiler checkpoint.** Prove that every sampling and cache action leaves snapshots, versions, journal, change, correspondence, provenance, lineage, and recovery unchanged; attribute the completed core's TypeScript cost and apply the one approved formula-based ratchet refresh only if required. | High: the core may be correct at runtime but too expensive or secretly event-sourced. | Broad: exact before/after inventory comparison, all state/history/recovery tests, direct inference fixture, architecture, inference, typecheck, complete test, bundle, and Theseus validation. | Commit law evidence and, only if justified, the single calculated inference refresh in the same rollback unit. | Stop on unexplained/broad-import growth, growth beyond the approved formula, a second refresh need, or any sampling-derived durable authority. |
| s17 | **Immutable reparameterization.** Add an explicit operation that applies the same family from the same persistent source with new typed parameters, a distinct application ID, and provenance back to the source application. | High: convenience reparameterization could mutate endpoints or share mutable cache state. | Standard: source immutability, distinct IDs/endpoints, frozen parameter records, source provenance, evaluator isolation, reused-source-application-ID rejection, typecheck, and Theseus validation. | Commit reparameterization records and laws only. | Stop if the original application changes, caches are shared mutably, or new parameters lose their authored/source provenance. |
| s18 | **Canonical parameterized-tax economics seam.** Add one domain-owned exact-rational way to evaluate a market and accounting outcome at an explicit tax amount by reusing current model/accounting authority; characterize exact endpoint parity. | High: a helper could become a competing formula implementation or alter visible frames. | Standard: two-market endpoint parity, intermediate exact clearing/wedge/accounting laws, invalid tax/axes diagnostics, no semantic-state dependency, typecheck, and Theseus validation. | Commit canonical domain seam and tests without state-family or renderer migration. | Stop if equilibrium/welfare formulas are copied outside canonical economics, approximate numbers enter authority, or existing model/frame output changes. |
| s19 | **Supply-tax family and one-driver endpoint.** Author a dedicated internal state schema whose endpoint application changes only exact `market.taxAmount`; derive buyer-facing supply and market outcomes through explicit graph dependencies. | High: retaining the old phase/supply writes would defeat the one-driver ROI test. | Standard: compact authoring metrics, exact tax type, one changed driver, stable derivation declarations, persistent endpoints, existing market parity, typecheck, and Theseus validation. | Commit the new pressure family and endpoint tests; preserve the Loop 2 fixture. | Stop if the family needs economics-specific semantic-state primitives, multiple independent market writes, low-level IDs/stores, casts, or generic staging. |
| s20 | **Exact supply-tax intermediate samples.** Sample a bounded exact progress grid and derive equilibrium, incidence, and government revenue from the canonical parameterized-tax seam at every point. | High: interpolating outputs instead of causes would look correct for the linear fixture while violating the semantic contract. | Broad: exact tax, market clearing, wedge, incidence, revenue, endpoint, direct-seek, requested-closure, and no-formula-fork laws across two markets; architecture, inference, typecheck, complete test, bundle, and Theseus validation. | Commit market sampling and exact evidence only. | Stop if any derived market result is independently interpolated, formula authority enters the fixture, or rational progress is converted to `number`. |
| s21 | **Supply-tax sample-status and cache pressure.** Keep baseline/intermediate/target status as ephemeral evaluation metadata derived from exact progress, not a second semantic driver or economic phase; prove unaffected dependencies reuse persistent tokens while affected requested descendants recompute. | High: a visual transit label could be mistaken for economic truth or smuggle in a second write. | Standard: exact status boundaries, separation from the s10 discrete-mode fixture, one-driver change inventory, call counts for requested/unrequested branches, bounded eviction, reset/disposal, typecheck, and Theseus validation. | Commit sample-status and selective-cache laws with only bounded API corrections. | Stop if sample status determines economics, writes a semantic slot, needs renderer time, or gives unchanged dependencies transient tokens. |
| s22 | **Supply-tax reparameterization branches.** Apply alternate final taxes from the same baseline, sample them in interleaved order, and prove distinct endpoints, exact results, provenance, recovery, and cache isolation. | High: application IDs or tokens may collide when source and definition are shared. | Broad: two alternate tax branches, original branch recovery, exact fingerprints, interleaved sampling, isolated disposal, history inventory, architecture, inference, typecheck, complete test, bundle, and Theseus validation. | Commit branch/reparameterization pressure and bounded corrections only. | Stop if one branch mutates another, tokens collide, recovery needs sample history, or source provenance becomes ambiguous. |
| s23 | **Circle state-family fixture.** Wrap the existing renderer-free circle measurement in the generic family boundary with one unit-tagged radius driver and explicit derived area and point-dependent response slots. | High: the second caller could accidentally duplicate the mechanism or persist executable math objects. | Standard: compact schema/family packet, exact unit-ID inference, stable semantic IDs, one changed driver, renderer-neutral imports, typecheck, and Theseus validation. | Commit the test-owned second family and its endpoint laws only. | Stop if the fixture needs a circle-specific evaluator branch, persists functions/authoring contexts, or widens the unit helper. |
| s24 | **Nonlinear circle sampling and unit repairs.** Sample nonmonotonic exact progress over radius, derive nonlinear area and the point-dependent response, and retain compile-time and runtime wrong-unit rejection. | High: converting exact progress into an already approximate numeric domain could be mislabeled as exact or lose type safety. | Broad: endpoint and midpoint values, nonlinear non-lerp result, derivative-at-point result, equivalent-progress/repeat/rewind laws, negative type fixture, runtime forgery, cache/history invariants, architecture, inference, typecheck, complete test, bundle, and Theseus validation. | Commit nonlinear pressure evidence and only shared-mechanism fixes. | Stop if circle outputs are linearly interpolated, the result claims exact arithmetic, unit IDs widen to `string`, or caller-specific sampling code is required. |
| s25 | **Cross-caller API, scale, and compiler pressure.** Compare supply-tax and circle author packets, run a bounded dense-sampling probe with an unaffected branch and fixed cache capacity, and freeze final operation, allocation, history, and inference metrics. | High: synthetic scale can justify premature storage or public API promotion. | Broad: authoring metrics, 257 exact sample requests with deterministic repeats, fixed cache ceiling, affected/unaffected compute counts, no durable inventory growth, architecture, inference, typecheck, complete test, bundle, and Theseus validation. | Commit measurements and at most one narrow cross-caller shape correction; no new ratchet refresh. | Stop if ordinary callers require low-level identities/casts, capacity is exceeded, inference fails, or evidence suggests a storage redesign; do not implement that redesign here. |
| s26 | **Closeout and mandatory API checkpoint.** Record the retained/rejected abstractions, exact metrics, author packet, state/history laws, economics and circle results, control-plane updates, and recommendation for aggregate Loop 4. | High: two nonvisual callers still do not prove timeline, renderer, or public-facade readiness. | Broad plus manual architecture/API review: all Loop 3 focused suites, `npm test`, typecheck, architecture, inference, bundle, and Theseus validation. | Commit closeout and durable execution evidence only. | Always stop at `HUMAN_CHECKPOINT`; also stop on any unresolved broad failure, unclear transient authority, unstable API, or evidence against aggregate composition. |

## Contract-Level Stop Conditions

Stop the approved run immediately if:

- an interior sample must become an aggregate snapshot, semantic entity
  version, recovery entry, or transaction event;
- equivalent exact progress values do not normalize to the same sampling and
  cache input, or exact economics depends on floating-point progress;
- interpolation writes anything other than a declared independent driver, or
  a derived market/circle result is interpolated independently;
- presentation-only metadata authorizes semantic mutation, discrete thresholds
  are guessed, or statement order becomes transition order;
- endpoint application bypasses the current transaction, change,
  correspondence, provenance, lineage, or recovery authority;
- graph definitions vary per sample, sample reads discover dependencies, or a
  cycle/invalid result reaches a caller;
- an ephemeral token masquerades as entity/version identity, a cache becomes
  unbounded/global/durable, or sampling order changes a result;
- reparameterization mutates an application, endpoint, parameter record,
  source provenance, or evaluator cache;
- exact-rational economics formulas fork into semantic state, the circle
  pressure weakens unit inference, or either caller needs a domain-specific
  evaluator branch;
- runtime `Proxy`, implicit assignment, ambient state, import-order
  registration, filesystem generation, or a persistent-storage redesign
  becomes necessary;
- a renderer, timeline, clock, URL, Article, Focus Deck, public facade,
  compatibility migration, live model, or broad domain system becomes
  necessary;
- TypeScript inference needs more than the one explicitly bounded s16 refresh,
  or that growth is unexplained; or
- any required broad verification gate fails and cannot be repaired inside the
  current slice's ownership boundary.

## Explicit Deferrals

After this loop, separate reviewed contracts would still be required for:

1. aggregate composition, explicit conflict handling, and nested state-family
   sequencing;
2. one logical timeline, clock-to-exact-progress policy, direct addresses, and
   before/during/after URL anchors;
3. the first Graph2D and KaTeX projection of the reviewed supply-tax state
   family, with a mandatory human visual checkpoint;
4. any migration of existing KaTeX transformations or economics runtime
   frames onto the new semantic source;
5. Article, Focus Deck, Catalogue, navigation, publication, and public-route
   integration;
6. public semantic-state facade promotion, consumer-only closure proof, and
   compatibility retirement;
7. broader economics, physics, calculus, or other domain families;
8. first-class definitions, claims, contextual perspectives, compositional
   procedures, and semantic macros;
9. generated authoring plumbing beyond the existing bounded descriptors; and
10. live LLM generation, repair-rate measurement, and prompt-independent
    evaluation.

## Approval And Contract Outcome

The user explicitly approved this proposal on 2026-09-03. The initial v1
contract was superseded before implementation because its first materialized
record omitted required typed-autonomy metadata. V2 preserves the reviewed 26
slices, allowed and disallowed work, verification cadence, commit cadence,
single conditional inference refresh, and stop conditions while recording the
complete run metadata required by the autonomy gate.

The generic delivery frontier and its older gold-equation visual checkpoint
were not selected. V2 is authorized for autonomous execution through the
mandatory s26 `HUMAN_CHECKPOINT` or an earlier named stop condition.
