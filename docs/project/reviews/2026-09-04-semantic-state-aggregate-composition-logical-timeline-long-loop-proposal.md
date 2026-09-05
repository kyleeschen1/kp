# Semantic State Aggregate Composition And Logical Timeline Long-Loop Proposal

Date: 2026-09-04
Status: COMPLETE; `HUMAN_CHECKPOINT`
Proposed target:
`next-action.kp.typed-authoring.aggregate-composition-logical-timeline`
Active run contract:
`run-contract.kp.aggregate-composition-logical-timeline-v1`
Active thread: `../threads/typed-semantic-authoring-framework.md`
Source checkpoint:
`2026-09-04-semantic-state-families-interpolation-closeout.md`
Accepted direction:
`../decisions/2026-09-04-semantic-state-family-checkpoint-and-next-sequence.md`

## Recommendation

The user approved this exact 26-slice proposal on 2026-09-04. The active
Theseus run contract owns slice order, live status, verification evidence, and
the final stop state; this proposal remains the rationale and approved scope.

Approve a 26-slice, nonvisual Loop 4 that composes several internal semantic
state-family applications into one immutable logical timeline. The timeline
should retain every ordinary persistent endpoint, give settled boundaries and
in-transition samples different address types, diagnose conflicts before a
composition can escape, and support direct historical inspection and coherent
branching without replay or object-local mutation.

Use three explicit composition forms: ordered sequence, a named nested group,
and a demonstrated-independent cohort. Sequence is the only form that may
write the same slot more than once. An independent cohort must have disjoint
declared writes, one compatible schema and graph, and a deterministic
confluence proof; the implementation may then choose one stable application
order while presenting the cohort as one logical transition. Nesting supplies
stable scope and address structure, not hidden execution order.

Pressure the result with one production-shaped exact-rational market packet
that contains two independently owned facts: demand price intercept and
per-unit tax. One family changes demand intercept, one changes tax, and shared
derived market evaluation depends on both. This demonstrates composition in a
single domain aggregate without copying economics formulas or placing a
renderer beside the existing tax and circle fixtures.

Stop at a mandatory architecture/API checkpoint. Runtime clock quantization,
sampled-frame and motion-plan adaptation, URL routing, Graph2D, KaTeX, Article,
public promotion, and existing-transformation migration remain later work.

## Why This Loop Is Current

Loop 3 answered the single-family question: persistent endpoint application
is ordinary semantic history, while exact-progress sampling is pure ephemeral
evaluation over declared independent drivers. It also proved that exact
economics and nonlinear unit-tagged math can share that boundary.

The next unresolved question is how several such transformations form one
coherent semantic progression. Connecting a renderer now would force clocks,
route state, or visual adapters to invent sequencing, conflict, historical
recovery, and nested-address rules. A public facade would freeze the same
missing decisions. Loop 4 resolves those rules below presentation while all
current visual behavior remains unchanged.

Long mode is appropriate because the work crosses family application,
persistent endpoint chains, write-conflict analysis, nested identity, logical
addressing, aggregate ephemeral evaluation, exact domain composition,
recovery, compiler cost, and durable project memory. Expected effort is
approximately 14-22 agent hours. This is an architecture-risk estimate, not a
delivery promise.

## Architecture Decision To Pressure

The proposed boundary is:

```text
one persistent source snapshot
+ named sequence / nested group / demonstrated-independent cohort
+ prepared typed family applications and declared write footprints
-> validate the complete composition before exposure
-> apply leaves through the existing family and transaction kernel
-> retain immutable settled boundary snapshots
-> address either a settled boundary or one exact-progress transition
-> sample one leaf or merge one independent cohort's driver overlays
-> evaluate only the requested derived closure
-> return a frozen historical view without changing current state
```

The important distinctions are:

- A logical timeline groups semantic transformations. It is not a motion
  block, clock, event log, router, playback controller, or renderer schedule.
- Every persistent boundary is an existing aggregate snapshot produced by the
  current family and transaction machinery. The composer does not merge
  entity stores or mint synthetic endpoint authority.
- A sequence has explicit order. Repeated writes are legal only across
  distinct ordered transitions and therefore have an inspectable settled
  boundary between them.
- An independent cohort has no semantic order. It must prove disjoint declared
  writes and deterministic confluence before the implementation chooses one
  stable internal application order for persistent endpoint construction.
- A named nested group provides stable scoped identity and reusable address
  structure. Source order, object iteration, or statement order cannot become
  implicit choreography.
- A settled address resolves to a pinned persistent snapshot. An
  in-transition address resolves to an ephemeral exact-progress sample. The
  two cannot be confused through one permissive state union.
- Historical access is read-only. Continuing from a historical settled
  boundary creates a new immutable timeline branch with explicit lineage; it
  never rewinds one object inside a newer aggregate snapshot.
- During an independent cohort, the evaluator combines only the cohort's
  declared driver overlays against its shared persistent boundary and then
  asks the existing derived graph for the requested closure. It does not
  blend already-derived outputs.
- Stable logical address encoding is a pure semantic protocol. Mapping it to a
  browser URL, numeric clock, or navigation gesture is deferred.

The exact TypeScript spelling remains subject to pressure. In particular, the
run may choose whether prepared family invocations or a thin compiled-member
record is the best composition input. It may not create a second transaction,
snapshot, derived-graph, or identity implementation.

## Canonical Boundaries

- **Canonical artifacts:** the new internal aggregate composition records,
  logical addresses, evaluator, and exact two-change market pressure packet.
- **Host:** none. All work is exercised through direct internal runtime and
  type tests.
- **Renderer:** none. No Graph2D, KaTeX, SVG, Canvas, WebGL, DOM, CSS, or code
  renderer changes are authorized.
- **Persistent semantic source of truth:** existing immutable snapshots,
  transactions, state-family applications, correspondence, provenance,
  lineage, and pinned recovery under `src/semantic-state/`.
- **Logical progression authority:** the compiled composition tree, its stable
  scopes, explicit sequence or independence declarations, and retained
  persistent boundary table.
- **In-transition state:** a pure aggregate ephemeral overlay at normalized
  exact progress, resolved by the existing state-family and derived-evaluation
  seams.
- **Economics source of truth:** canonical exact-rational supply, demand,
  per-unit-tax, market-clearing, and accounting constructors under
  `domains/economics/`.
- **Rollback unit:** one verified slice commit. Reverting Loop 4 must not
  revert the completed snapshot kernel, typed facade, derived graph, applied
  families, tax/circle pressure, or any reviewed visual exemplar.

## Next-Step Candidate Comparison

Scores run from 1 (low) to 5 (high); higher risk means more speculative
complexity.

| Candidate | Authoring | Reliability | Reuse | Risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | --- |
| Aggregate composition plus logical addressing | 5 | 5 | 5 | 4 | Do next; this proposal |
| First Graph2D/KaTeX adapter exemplar | 5 | 3 | 5 | 4 | Wait for this aggregate checkpoint |
| Existing KaTeX transformation migration | 4 | 2 | 4 | 5 | Wait for the reviewed adapter exemplar |
| Public semantic-state facade | 4 | 3 | 5 | 4 | Wait for aggregate and renderer API pressure |
| Knowledge/procedure declarations | 5 | 3 | 5 | 5 | Defer until state and timeline seams pass |
| Live LLM generation pressure | 4 | 2 | 4 | 5 | Defer until the authoring boundary stabilizes |

This preserves the accepted sequence: this proposal is nonvisual Loop 4;
Loop 5 is the first reviewed Graph2D/KaTeX connection; selected migration is a
separate later compatibility contract.

## Acceptance Contract

The loop succeeds only if all of the following are true:

1. Composition supports explicit ordered sequence, named nesting, and
   demonstrated-independent cohorts without deriving meaning from statement
   or collection order.
2. Every member uses the existing state-family definition/application and
   transaction boundary; no family implementation or persistent-state kernel
   is copied into the composer.
3. The complete composition is validated before its endpoint table, logical
   addresses, or evaluator can escape.
4. Independent cohorts reject overlapping writes, foreign schemas or graphs,
   duplicate application identities, and any unresolved read/write hazard.
5. Repeated writes are accepted only in an explicit sequence with a retained
   persistent boundary between the writes.
6. Independent-cohort endpoint construction has one deterministic internal
   order and proves a value-equivalent result under the opposite legal order.
7. Stable scoped names and generated boundary/member handles survive nesting,
   serialization, reconstruction, and unrelated sibling insertion.
8. A settled logical address and an in-transition address are disjoint typed
   values with canonical encoding, decoding, validation, and equality.
9. Settled direct seek returns the exact pinned persistent boundary snapshot;
   no replay, sampling, interpolation, or cache population is required.
10. In-transition direct seek samples exactly one sequence leaf or one
    independent cohort against its own shared persistent boundary. Earlier
    members remain settled and later members remain unapplied.
11. An independent-cohort sample overlays only its declared drivers and
    evaluates requested derived consequences once from their combined state;
    it never interpolates derived outputs separately.
12. Presentation-only and discrete transition metadata remain distinct from
    semantic writes when aggregated, and no composition rule invents timing
    or thresholds.
13. Historical and nested local access is read-only. Continuing from an old
    settled boundary creates a new coherent branch with lineage and cannot
    mutate a newer aggregate snapshot.
14. Correspondence, provenance, lineage, structural sharing, operation
    journals, pinned recovery, and exact persistent history remain attributable
    to their existing member applications and aggregate branch.
15. The production-shaped market packet composes independently owned exact
    demand-intercept and per-unit-tax changes, derives shared equilibrium and
    accounting through domain-owned authority, and diagnoses an intentionally
    conflicting second tax write.
16. The semantic-state suite, exact economics checks, typecheck,
    architecture, inference, complete tests, production bundle, and Theseus
    validation pass at the final checkpoint.

## Allowed Work

- New internal aggregate-composition declaration, compilation, diagnostics,
  scoped-name, boundary-handle, logical-address, aggregate-sample, and
  aggregate-evaluator modules under `src/semantic-state/`
- Narrow compatible extensions to state-family definition/application,
  transition-plan footprint, sample-source overlay, derived evaluator,
  fingerprints, and pinned-recovery seams when aggregate use exposes a shared
  missing contract
- A canonical exact-rational economics adapter that evaluates explicit demand
  intercept and tax parameters by reusing current market and accounting
  constructors rather than copying formulas
- One internal production-shaped market schema with separate demand-shift and
  per-unit-tax families, shared derived evaluation, nested/independent
  composition, and an explicit overlapping-write negative fixture
- Test-owned generic composition fixtures for ordered overlap, nested scope,
  independent confluence, failure atomicity, address round trips, direct seek,
  history, branch recovery, cache isolation, and negative TypeScript cases
- Focused law tests, authoring and allocation metrics, a bounded dense-seek
  probe, compiler attribution, durable Theseus evidence, and closeout updates
- At most one measured post-core inference-ratchet refresh at s18, only if the
  direct aggregate fixture explains the growth, no broad import caused it,
  and ceilings equal `ceil100(measured types * 1.02)` and
  `ceil100(measured instantiations * 1.03)`

## Disallowed Work

- Runtime clocks, duration, easing, frame cadence, numeric-clock
  quantization, sampled-frame or motion-plan integration, playback, input
  gestures, navigation, browser history, or URL routing
- Graph2D, KaTeX, SVG, Canvas, WebGL, DOM, CSS, browser, Animation Catalogue,
  Focus Deck, Article, public-route, publication, or code-renderer integration
- Migration or rewrite of any existing KaTeX transformation, compositor
  session, native endpoint, economics frame, animation asset, or visual
  state adapter
- A public semantic-state facade, root namespace, broad barrel,
  compatibility layer, package promotion, or catalogue-wide rollout
- Synthetic merged snapshots, copied entity stores, family-specific
  transactions, alternate derived graphs, aggregate event logs, or
  object-local mutable cursors
- Implicit parallelism, last-writer-wins conflict resolution, statement-order
  choreography, guessed nesting, guessed thresholds, or runtime read
  observation as dependency authority
- Persisting arbitrary transition samples, aggregate cache entries, compute
  closures, or logical-address lookups as semantic history
- Runtime `Proxy`, ambient assignment or transaction state, global mutable
  registry, import-order authority, filesystem code generation, persistent
  collection redesign, or a general reactive store
- A new economics solver, copied equilibrium or welfare formulas, broad
  economics ontology, general unit algebra, CAS, theorem prover, public
  HKT/typeclass hierarchy, or arbitrary nested workflow engine
- Knowledge declarations, compositional procedure language, broad semantic
  macros, generated authoring catalogue, or live LLM evaluation
- A second inference-ceiling increase or an unexplained first increase

## Dependencies

- The accepted persistent-state direction and sequencing review
- The completed immutable snapshot, transaction, change, correspondence,
  provenance, lineage, and pinned-recovery kernel
- The completed typed property facade, explicit derived graph, requested
  evaluator, dependency fingerprints, and caller-owned caches
- The accepted Loop 3 state-family definition/application, exact-progress,
  transition-mode, ephemeral-source, overlay-aware evaluation, and
  reparameterization boundaries
- The canonical exact-rational supply-demand and per-unit-tax economics model
  and accounting constructors
- Current semantic-state, economics, type, architecture, inference, complete
  test, production-bundle, impact, and Theseus validation commands

## Verification And Context Cadence

- **Focused:** run the named law test or negative type fixture and inspect
  `npm run verify:impact -- --path <changed-path>` before following its scoped
  recommendation.
- **Standard:** focused proof plus `npm run typecheck` and
  `theseus workspace validate`.
- **Broad:** standard proof plus applicable `npm run check:architecture`,
  `npm run check:inference`, `npm test`, and `npm run build:bundle` gates.
- No browser or manual visual check belongs to this nonvisual loop. The final
  human checkpoint reviews architecture, API shape, exact domain evidence,
  metrics, and the retained/deferred boundaries.
- Every completed slice records its Theseus context and verification evidence
  and normally produces one exact-path commit containing implementation,
  tests, and the completed-slice event.
- Start each slice from one brief Theseus context capsule. Use working context
  only for a source-dependent question the capsule cannot answer.
- Derive progress from `npm run --silent loop:status` at every slice start,
  completion, commit boundary, and before a stop or final response.

## Proposed Ordered Slices

Every row is one independently reversible commit boundary.

| Slice | Target and intended change | Risk | Verification level and expected checks | Commit boundary | Slice stop condition |
| --- | --- | --- | --- | --- | --- |
| s01 | **Baseline and aggregate-law ledger.** Freeze Loop 3 semantic-state, economics, history, authoring, allocation, and inference metrics; characterize the exact absence of aggregate composition and logical-address APIs. | Medium: an incomplete baseline could hide authority growth or regressions. | Broad diagnostic: semantic-state and supply-tax/circle suites, typecheck, architecture, inference, complete test, bundle, and Theseus validation. | Commit characterization tests and dated metrics only. | Stop if the Loop 3 gates are no longer green or persistent inventories cannot be compared exactly. |
| s02 | **Aggregate identity and stable scoped names.** Add thin internal identities for a composition, nested group, transition member, and settled boundary by extending the current deterministic identity-scope rules. | High: a parallel identity system would break lineage and reconstruction. | Standard: deterministic IDs, valid/invalid local names, sibling insertion stability, foreign-scope rejection, typecheck, and Theseus validation. | Commit identity helpers and focused laws only. | Stop if IDs depend on object order, payloads, random values, or cannot reuse the current identity authority. |
| s03 | **Composition declaration grammar.** Add disjoint serializable declarations for ordered sequence, named nested group, and demonstrated-independent cohort over typed family application records. | High: one permissive tree could hide order or admit renderer choreography. | Standard: positive declarations, exhaustive narrowing, empty/recursive/ambiguous shape diagnostics, invalid type fixtures, typecheck, and Theseus validation. | Commit declaration types and constructors without execution. | Stop if statement order supplies undeclared semantics, closures enter serializable truth, or a clock/presentation concept is required. |
| s04 | **Structural composition validation.** Validate unique scopes, compatible schema namespace, known family definitions, unique application identities, finite acyclic nesting, and complete source metadata for the whole tree. | High: partial validation could allow an unusable plan or endpoint to escape. | Standard: duplicate, foreign, cyclic, missing-source, reused-application, and valid nested fixtures; typecheck and Theseus validation. | Commit compiler diagnostics without applying a family. | Stop if validation requires executing author callbacks, observing reads, or mutating a global registry. |
| s05 | **Declared transition footprints.** Derive immutable semantic-write, discrete-write, and presentation-only target footprints from each existing family transition plan, preserving typed paths and ownership. | High: an approximate footprint would make conflict checks unsound. | Standard: one/many target extraction, mode separation, duplicate normalization, derived-target rejection, exact path identity, typecheck, and Theseus validation. | Commit footprint projection and laws only. | Stop if footprints must inspect runtime writes, renderer nodes, or broad object diffs. |
| s06 | **Conflict and hazard diagnostics.** Reject overlapping semantic/discrete writes inside an independent cohort and diagnose foreign base snapshots, incompatible graphs, duplicate members, and unresolved hazards before endpoint work. | High: last-writer-wins or late conflict discovery would corrupt aggregate meaning. | Broad: conflict matrix, nested diagnostics with scoped paths, zero family-apply calls on failure, architecture, typecheck, inference measurement, and Theseus validation. | Commit preflight diagnostics and failure-atomicity evidence. | Stop if a conflict can reach family application, endpoint exposure, or sample evaluation. |
| s07 | **Deterministic composition compilation.** Compile valid trees into frozen scoped members, groups, cohorts, and boundary specifications with one stable canonical internal order independent of insertion order. | High: unstable ordering would change snapshot/version identities between reconstructions. | Standard: permutation equality, canonical encodings, nested scope retention, reconstruction, frozen records, typecheck, and Theseus validation. | Commit compiled-plan records without endpoint application. | Stop if canonical order changes explicit sequence order, erases authored grouping, or uses runtime object identity. |
| s08 | **Persistent ordered endpoint chain.** Apply sequence leaves through the existing family and transaction kernel, retaining every ordinary before/after snapshot and exposing nothing until the complete immutable chain succeeds. | High: a composer-specific commit path or partial return would fork persistence authority. | Broad: endpoint identity, transaction/change/correspondence preservation, structural sharing, mid-chain failure isolation, recovery, architecture, typecheck, complete test, bundle, and Theseus validation. | Commit ordered endpoint assembly and preservation laws together. | Stop if the composer copies family authoring, mints synthetic snapshots, mutates an input, or returns a partial chain. |
| s09 | **Independent-cohort confluence and endpoint order.** Apply disjoint cohort members in one deterministic internal order and prove that the opposite legal order yields value-equivalent affected and derived state while the canonical order fixes persistent identity. | High: declared independence may be false even with disjoint writes. | Broad: two-order value confluence, stable canonical endpoint, unchanged unrelated slots, exact history inventory, typecheck, architecture, inference measurement, and Theseus validation. | Commit cohort endpoint behavior and confluence laws only. | Stop if legal orders disagree in semantic values, a hidden dependency makes order meaningful, or confluence is asserted rather than executed. |
| s10 | **Explicit overlapping-write sequence.** Permit repeated writes only across named ordered transitions, retain the intervening persistent boundary, and reject the same members when marked independent. | High: collapsing ordered writes could erase a meaningful intermediate state. | Standard: two-write sequence, exact middle/after recovery, independent rejection, no last-writer-wins shortcut, typecheck, and Theseus validation. | Commit ordered-overlap laws and bounded compiler corrections. | Stop if the middle state is not recoverable or conflict behavior depends on declaration iteration. |
| s11 | **Nested group ownership and aggregate provenance.** Retain group/member source refs and project member commits, changes, correspondence, provenance, and lineage into one read-only aggregate index without rewriting them. | High: aggregate summaries could become competing semantic evidence. | Broad: nested attribution, exact member record identity, lineage traversal, source reconstruction, branch provenance, architecture, typecheck, complete test, bundle, and Theseus validation. | Commit aggregate evidence index and tests only. | Stop if aggregation rewrites member evidence, invents correspondence, or hides which application owns a change. |
| s12 | **Generated boundary and member handles.** Generate stable typed handles for composition before/after, every settled boundary, nested group, and transition member from the compiled plan. | High: loosely typed string lookup would weaken direct recovery and author ergonomics. | Standard: exact handle inference, path stability, sibling insertion, invalid-handle type fixtures, serialization metadata, typecheck, and Theseus validation. | Commit handle generation without address resolution. | Stop if ordinary authors need manual semantic IDs, casts, or renderer-shaped names. |
| s13 | **Disjoint logical address protocol.** Add canonical serializable `settled` and `in-transition` address values; transition addresses contain one scoped member/cohort handle and exact normalized progress. | High: a permissive union could treat ephemeral samples as settled state. | Standard: constructor, equality, encoding/decoding, equivalent-fraction normalization, malformed/foreign address diagnostics, exhaustive narrowing, typecheck, and Theseus validation. | Commit logical address values and focused tests only. | Stop if addresses contain wall time, duration, URL syntax, snapshot payloads, or allow progress on a settled boundary. |
| s14 | **Settled direct seek and pinned inspection.** Resolve any settled handle/address directly to its exact retained persistent snapshot and typed state handles without replay or cache mutation. | High: replay-based recovery would make order and failures observable. | Broad: strict snapshot equality at every boundary, pinned reads, zero family/evaluator calls, historical branch lookup, architecture, typecheck, inference measurement, and Theseus validation. | Commit settled resolver and recovery laws only. | Stop if resolution replays a prefix, reconstructs a value-equal snapshot, or needs current mutable cursor state. |
| s15 | **Single-member transition seek.** Resolve an in-transition address for an ordered leaf through the existing state-family evaluator, with prior boundaries settled and later transformations absent. | High: sampling against the wrong boundary could combine past and future state. | Broad: exact endpoints/interiors, direct/nonmonotonic seek, preceding-state retention, later-write absence, selective derived reads, architecture, typecheck, complete test, bundle, and Theseus validation. | Commit leaf transition resolution and laws only. | Stop if a leaf samples from the composition root or final snapshot instead of its own persistent boundary. |
| s16 | **Independent-cohort aggregate overlays.** Combine a cohort's declared driver overlays at one exact progress over its shared persistent boundary, then expose one frozen aggregate sample source without minting snapshot authority. | High: merging samples could copy stores, collide tokens, or interpolate derived values. | Broad: multi-driver overlay, token uniqueness, exact endpoints, equivalent progress, no snapshot/version/history growth, architecture, typecheck, inference measurement, and Theseus validation. | Commit cohort sample-source behavior and laws only. | Stop if overlays target the same slot, merge entity stores, create a persistent snapshot, or blend derived results. |
| s17 | **Aggregate requested derived evaluation.** Evaluate one requested closure once against the combined cohort source while retaining unaffected persistent dependency tokens and current graph authority. | High: evaluating each member separately could expose inconsistent mixed states. | Broad: chain/diamond/shared-derived cases, affected and unaffected counts, no partial result, failure/retry, all existing evaluator laws, architecture, typecheck, complete test, bundle, and Theseus validation. | Commit aggregate evaluation and handle-view integration together. | Stop if derived definitions change per composition, unrequested nodes run, or per-member derived outputs are merged. |
| s18 | **Mode, authority, and compiler checkpoint.** Aggregate discrete and presentation-only metadata without semantic substitution; prove all seeks leave persistent history unchanged; attribute the completed core's compiler cost and use the one formula-based ratchet refresh only if required. | High: a correct runtime surface could still leak authority or exceed its compiler budget. | Broad: mode matrix, history/recovery inventory, direct inference fixture, typecheck, architecture, inference, complete test, bundle, and Theseus validation. | Commit authority evidence and, only if justified, the single calculated inference refresh. | Stop on guessed thresholds/timing, semantic presentation writes, unexplained growth, growth beyond the formula, or need for a second refresh. |
| s19 | **Bounded aggregate evaluator lifecycle.** Add caller-owned cache capacity, stats, reset, and idempotent disposal keyed by composition, logical address, member endpoints, and exact progress while preserving member-cache isolation. | High: aggregate caching can retain arbitrary history or become global authority. | Standard: zero/default/bounded capacity, deterministic eviction, reset/disposal, cross-composition isolation, failed-sample exclusion, typecheck, and Theseus validation. | Commit evaluator lifecycle and cache laws only. | Stop if cache data enters equality/recovery, is unbounded/global, or mutates member evaluators. |
| s20 | **Seek, rewind, nesting, and local-inspection laws.** Pressure arbitrary address permutations, direct deep-nested access, equivalent progress, retries, disposal/recreation, and historical local reads while a newer aggregate boundary remains current. | High: a hidden cursor could make access order semantic. | Broad: deterministic permutation corpus, direct-versus-sequential equality, unchanged current state, no failed cache values, architecture, typecheck, inference, complete test, bundle, and Theseus validation. | Commit deterministic access laws and bounded shared fixes. | Stop if a result depends on prior address, direction, wall time, mutable closure, or object-local cursor state. |
| s21 | **Coherent branch continuation.** Create a new immutable composition branch from any settled historical boundary, retaining source timeline/address lineage and independent boundary/evaluator storage. | High: branch convenience could mutate or truncate the original timeline. | Standard: root/middle/final branches, distinct IDs, shared historical snapshots, new endpoint recovery, frozen lineage, cache isolation, typecheck, and Theseus validation. | Commit branch records and recovery laws only. | Stop if the source timeline changes, history is copied unnecessarily, or branching from an ephemeral address is silently accepted. |
| s22 | **Historical local restore contract.** Make local restore either a read-only historical inspection or an explicit new branch transformation; reject attempts to splice an old object version into an otherwise current aggregate. | High: partial rewind would create a semantically incoherent snapshot. | Broad: local inspection, invalid splice diagnostics, explicit branch alternative, correspondence/lineage preservation, architecture, typecheck, complete test, bundle, and Theseus validation. | Commit restore diagnostics and branch guidance only. | Stop if the API can mutate one member in place, bypass a transaction, or infer a coherent branch without an authored transformation. |
| s23 | **Canonical demand-intercept-plus-tax economics seam.** Add one exact-rational domain adapter for explicit demand intercept and tax amount by rebuilding the canonical model input and delegating market clearing and accounting to existing constructors. | High: the adapter could fork economics formulas or alter current assets. | Standard: two-market endpoint and interior parity, exact clearing/wedge/accounting laws, invalid parameter/axis diagnostics, existing economics tests, typecheck, and Theseus validation. | Commit domain adapter and tests without semantic-state or renderer migration. | Stop if a formula is copied, approximate numbers enter authority, or any existing frame/model output changes. |
| s24 | **Production-shaped two-family market packet.** Author one shared schema and graph with independent exact demand-intercept and tax slots, separate family definitions, shared derived market evaluation, and named nested composition. | High: the fixture could smuggle in a market-specific composer or repeat low-level plumbing. | Broad: authoring metrics, two independent writes, exact endpoint chain, scoped handles, shared graph, no casts/low-level stores, architecture, typecheck, complete test, bundle, and Theseus validation. | Commit the market packet and endpoint evidence only. | Stop if composition needs economics-specific core code, duplicate formulas, manual identities/stores, generic staging, or renderer concepts. |
| s25 | **Market cohort, conflict, branch, and scale pressure.** Run the two market families as a demonstrated-independent cohort and ordered nested sequence, sample a 257-address deterministic corpus, derive exact joint outcomes, reject a conflicting second tax family, branch from the middle boundary, and freeze final allocation/history/inference metrics. | High: one friendly example could hide conflict, cache, or compiler failure. | Broad: confluence, exact demand/tax/equilibrium/incidence/revenue, conflict-before-apply counts, direct seek/rewind, branch recovery, bounded cache, zero durable sample growth, architecture, inference, typecheck, complete test, bundle, and Theseus validation. | Commit production pressure, measurements, and at most one narrow shared shape correction; no new ratchet refresh. | Stop if joint results are independently interpolated, conflict escapes, capacity/history grows, authoring needs casts, or inference needs another increase. |
| s26 | **Closeout and mandatory architecture/API checkpoint.** Record retained/rejected abstractions, exact metrics, address and recovery laws, conflict matrix, market packet, control-plane updates, and the bounded Loop 5 Graph2D/KaTeX recommendation. | High: a nonvisual aggregate proof still does not certify clocks, renderers, public APIs, or migration. | Broad plus manual architecture/API review: all Loop 4 focused suites, `npm test`, typecheck, architecture, inference, bundle, and Theseus validation. | Commit closeout and durable execution evidence only. | Always stop at `HUMAN_CHECKPOINT`; also stop on any unresolved broad failure, unstable API, incoherent recovery, or evidence against the adapter boundary. |

## Contract-Level Stop Conditions

Stop the approved run immediately if:

- composition requires a second snapshot, entity-version, transaction,
  derived-graph, identity, correspondence, provenance, lineage, or recovery
  implementation;
- any composition diagnostic occurs after an endpoint, logical address, or
  evaluator has escaped;
- an independent cohort has overlapping writes, an unresolved hazard, or
  order-dependent semantic values;
- sequence order comes from statement or collection iteration, nesting hides
  order, or last-writer-wins resolves a conflict;
- a settled address reconstructs or replays state, an in-transition address
  becomes persistent authority, or exact progress becomes floating-point
  authority;
- aggregate sampling merges derived outputs, mints synthetic snapshots or
  versions, changes persistent history, or evaluates unrequested graph nodes;
- historical local access mutates current aggregate state or creates a branch
  without explicit transformation and lineage;
- stable scoped names or addresses depend on payload serialization, object
  identity, random values, wall time, duration, renderer nodes, or URL state;
- a cache becomes unbounded, global, durable, or semantically observable;
- exact-rational economics formulas fork into semantic-state code or the
  production packet needs a domain-specific composer;
- runtime `Proxy`, implicit assignment, ambient state, import-order
  registration, filesystem generation, or persistent-storage redesign becomes
  necessary;
- a clock, sampled-frame, motion-plan, renderer, Graph2D, KaTeX, URL, Article,
  Focus Deck, public facade, compatibility migration, knowledge system, or live
  model becomes necessary;
- TypeScript inference needs more than the one explicitly bounded s18 refresh,
  or that growth is unexplained; or
- any required broad verification gate fails and cannot be repaired inside
  the current slice's ownership boundary.

## Explicit Deferrals

After this loop, separate reviewed contracts would still be required for:

1. numeric clock-to-exact-progress quantization, runtime duration/easing, and
   one deterministic sampled-frame adapter;
2. the first canonical production-shaped Graph2D/KaTeX projection, including
   renderer ownership and a mandatory human visual/API checkpoint;
3. any migration of selected existing KaTeX transformations or economics
   animation frames onto the new semantic source;
4. browser URL encoding, route restoration, navigation, playback controls,
   and input gesture policy for logical addresses;
5. Article, Focus Deck, Catalogue, publication, and public-route integration;
6. public semantic-state facade promotion, consumer-only closure proof,
   compatibility policy, and package migration;
7. broader economics, physics, calculus, code, Graph2D, Graph3D, or diagram
   state families;
8. first-class definitions, claims, contextual perspectives, and
   compositional procedures;
9. generated semantic macros or authoring plumbing beyond existing bounded
   descriptors; and
10. live LLM generation, typed repair-rate measurement, and prompt-independent
    evaluation.

## Execution Outcome

The user approved this exact proposal on 2026-09-04. All 26 slices completed
under `run-contract.kp.aggregate-composition-logical-timeline-v1`, and the run
stopped at its mandatory human architecture/API checkpoint on 2026-09-05.
Exact results, metrics, retained and rejected abstractions, and the bounded
Loop 5 recommendation are recorded in
`2026-09-05-semantic-state-aggregate-composition-logical-timeline-closeout.md`.
No Loop 5 implementation or KaTeX compatibility migration is authorized by
this proposal or its closeout.
