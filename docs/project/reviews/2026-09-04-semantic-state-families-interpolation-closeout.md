# Semantic State Families And Ephemeral Interpolation Closeout

Date: 2026-09-04

Status: `HUMAN_CHECKPOINT`

Disposition: accepted by the user on 2026-09-04; the separately reviewed
Loop 4 proposal is not yet approved for execution.

Run: `run-contract.kp.semantic-state-families-interpolation-v2`

Source proposal:
`2026-09-03-semantic-state-families-interpolation-long-loop-proposal.md`

Active thread: `../threads/typed-semantic-authoring-framework.md`

## Recommendation

Accept the applied-state-family and pure ephemeral sampling boundary as the
internal Loop 3 result. It retains persistent `before` and `after` snapshots,
changes only declared independent semantic drivers, derives requested
consequences from the existing dependency graph, and keeps arbitrary
`at(progress)` samples outside semantic identity, versions, transactions,
history, and recovery.

Do not promote the direct-module surface as a public API yet. The supply-tax
and circle packets use the same high-level family and evaluator seam without
low-level identities, stores, transactions, casts, or caller-specific
sampling machinery, but both still coordinate schema compilation, handles,
derivations, snapshot materialization, and graph compilation. Two nonvisual
callers prove a useful internal boundary, not a stable package or renderer
contract.

If this checkpoint is approved, the next work should be a separately reviewed
nonvisual Loop 4 proposal for aggregate transformation composition and stable
timeline addressing. It should coordinate multiple family applications,
diagnose write conflicts, preserve coherent branch and historical recovery,
and distinguish logical `before`, `during`, and `after` locations without
adding renderer time or presentation policy.

KaTeX adoption belongs after that checkpoint. Loop 5 should connect one
canonical production-shaped Graph2D/KaTeX exemplar to the aggregate sampled
state and stop for human visual and API review. Existing KaTeX
transformations should migrate only in a later bounded compatibility contract
after that exemplar proves the adapter and ownership boundary. This closeout
does not authorize a bulk migration or imply that matching asset IDs already
share the new state-family path.

## Canonical Boundary

| Concern | Authority at this checkpoint |
| --- | --- |
| Canonical artifacts | The internal supply-tax state family and the test-owned nonlinear circle state family |
| Host | None; both callers are exercised through direct internal tests |
| Renderer | None; Loop 3 is intentionally nonvisual |
| Persistent semantic source of truth | Immutable aggregate `before` and `after` snapshots produced by the existing transaction kernel |
| Transition authority | Serializable, disjoint semantic-interpolation, discrete, and presentation-only declarations plus definition-local capabilities |
| Intermediate state | A pure ephemeral read-source overlay at normalized exact progress |
| Derived truth | The existing explicit dependency graph evaluated only for the requested closure |
| Cache ownership | Optional, bounded, application-local evaluator storage; capacity defaults to zero and disposal is explicit |
| Economics truth | Canonical exact-rational per-unit-tax model and accounting under `domains/economics/` |
| Circle truth | Existing renderer-free typed circle differentiable map; number-valued magnitude approximation is explicit at the caller boundary |

## Outcome

The completed Loop 3 provides:

- normalized exact semantic progress with canonical zero, one, comparison,
  encoding, decoding, and equivalent-fraction identity;
- disjoint serializable transition declarations for semantic interpolation,
  discrete or piecewise selection, and presentation-only choreography;
- immutable family definitions with typed parameters, definition-local
  transition capabilities, deterministic identities, and structural
  validation;
- applied families whose persistent endpoints are ordinary transaction
  commits with the existing change, correspondence, provenance, lineage, and
  recovery authority;
- exact endpoint short-circuiting, so `at(0)` and `at(1)` reuse the pinned
  persistent snapshots and do not invoke interpolation callbacks;
- ephemeral interior read sources that overlay only declared drivers and have
  no snapshot, entity, version, journal, or recovery identity;
- typed interpolation callbacks that receive the driver's actual value type,
  family parameters, endpoint values, and exact normalized progress;
- deterministic discrete selection with explicit change points and no
  semantic write from presentation-only declarations;
- transient dependency tokens and derived fingerprints composed from family,
  application, declaration, endpoint-version, slot, and normalized-progress
  authority rather than payload or object identity;
- requested-closure derived evaluation over mixed persistent and transient
  dependencies, with unchanged dependencies retaining persistent tokens;
- an optional deterministic LRU sample cache with a default capacity of zero,
  local reset, hit/miss inspection, idempotent disposal, and no durable
  authority;
- exact seek, rewind, equivalent-progress, repeat, retry, reset, disposal,
  and recreation laws; and
- immutable reparameterization into a distinct applied family from the same
  persistent source, with immediate-source provenance and isolated caches.

No aggregate timeline, clock policy, URL addressing, Graph2D, KaTeX, SVG,
Canvas, WebGL, DOM, CSS, browser, Article, Focus Deck, Catalogue, public facade,
compatibility migration, storage redesign, CAS, knowledge/procedure system,
or live-model evaluation was added.

## Acceptance Contract

| Requirement | Result |
| --- | --- |
| Persistent endpoint reuse | Passed. Zero and one return pinned persistent samples backed by the exact committed snapshots. |
| Ephemeral interior authority | Passed. Interior samples overlay declared drivers only and create no snapshot, entity, version, transaction, journal, change, correspondence, provenance, lineage, or recovery entry. |
| Exact progress identity | Passed. Equivalent rational progress values normalize to one encoding, sample key, and transient dependency fingerprint. |
| Explicit transition modes | Passed. Semantic interpolation, discrete selection, and presentation-only declarations cannot silently substitute for one another. |
| Typed driver interpolation | Passed. Callbacks retain exact driver and parameter types; broad persistent-value interpolation and derived-target writes fail closed. |
| Selective derivation | Passed. Only requested affected descendants compute; unchanged dependencies retain persistent authority. |
| Bounded lifecycle | Passed. The cache defaults off, respects fixed capacity, evicts deterministically, resets locally, and clears on idempotent disposal. |
| Reparameterization | Passed. Branches retain the original persistent source, distinct endpoints and fingerprints, immediate-source provenance, direct recovery, and cache isolation. |
| Exact economics | Passed across two markets and alternate tax branches. Only `market.taxAmount` interpolates; equilibrium, incidence, buyer-facing supply, and revenue are recomputed through canonical exact-rational economics. |
| Nonlinear/unit pressure | Passed. One typed radius driver recomputes nonlinear area and point-dependent response; wrong units fail statically and at runtime. |
| Shared cross-caller API | Passed without a shape correction. Supply-tax and circle use the same family definition, application, evaluator, source, progress, and derived-graph seams. |
| Compiler boundary | Passed below the one approved formula-derived ratchet; no second refresh was used. |
| Broad repository health | Passed at 6,375 tests plus typecheck, architecture, inference, reachability, production bundle, and Theseus validation. |
| Public or renderer readiness | Not claimed. Aggregate composition, timeline addressing, a production host, and a reviewed projection remain absent. |

## Authoring And API Packet

The supply-tax packet is 106 nonblank authoring lines. The circle packet is 70
nonblank authoring lines. Each packet contains:

- one ordinary typed `.update(...)` for its independent driver;
- zero manual identity-scope, entity-store, aggregate-snapshot, or transaction
  constructors;
- zero author casts;
- one family definition and one declared semantic interpolation; and
- no renderer, Article, DOM, Svelte, animation, or publication import.

The different packet sizes come from domain structure rather than sampling
ceremony. Supply-tax declares five derived nodes and delegates exact market
evaluation upstream. Circle declares two derived nodes and delegates its
number-valued nonlinear map upstream. Neither caller implements cache,
endpoint, seek, rewind, or ephemeral-source behavior.

The current `src/semantic-state/` implementation contains 24 modules, 7,784
lines, and 271 direct-module exported declarations. Relative to the Loop 3
baseline, the family work added six modules and changed three existing ones,
for 2,320 added and 48 removed source lines. Relative to Loop 2's closeout,
that is a net increase of 2,272 lines and 86 direct-module exports. These
figures reinforce the recommendation to keep the implementation internal and
curate a public consumer surface only after aggregate and renderer pressure.

## State, History, And Allocation Laws

Each canonical family application owns exactly one durable update operation.
The complete persistent inventories before and after dense sampling remain
byte-stable: endpoints, entity versions, slot bindings, transaction journal,
change set, correspondence, provenance, lineage, parameters, and pinned
recovery do not grow or change.

The final cross-caller probe runs two independent evaluators per caller. Each
evaluator visits 257 exact positions from `0/256` through `256/256` and
immediately repeats every request. The two persistent endpoints bypass the
cache; the 255 interior positions produce 255 misses and 255 immediate hits.
With capacity fixed at 16, each evaluator retains exactly 16 entries and
disposal returns that count to zero.

Requested derived-compute counts remain selective for each 257-position run:

| Caller and requested result | Computed | Uncomputed |
| --- | --- | --- |
| Supply-tax government revenue | market evaluation 257; government revenue 257 | buyer-facing supply 0; equilibrium 0; incidence 0 |
| Circle point-dependent response | response 257 | area 0 |

These are bounded correctness measurements, not a production throughput
benchmark. They do not justify a persistent collection, global cache,
reactive store, or storage redesign.

## Domain Results

### Supply tax

The family changes only one exact-rational `market.taxAmount` driver. At every
sample, the domain-owned parameterized-tax evaluator reconstructs the market
and accounting result through existing supply, demand, clearing, incidence,
and welfare constructors. Five-point checks across two markets, alternate
tax-2 and tax-6 branches, and the dense grid preserve exact clearing,
price-wedge, incidence, and government-revenue laws. No floating-point
progress or duplicated economics formula enters semantic authority.

### Circle

The structurally different fixture changes one radius with an exact unit ID.
It derives `A(r) = pi r^2` and the point-dependent response from the existing
differentiable map. Midpoint area is recomputed as `9 pi`, not linearly
interpolated from endpoint areas. The existing circle map stores JavaScript
number magnitudes, so normalized exact progress is converted to a number at
one explicitly named approximate caller boundary. The resulting radius, area,
and response retain their unit IDs and make no exact-rational claim.

This distinction is intentional: the shared framework preserves the caller's
numeric authority instead of pretending that every domain has exact scalar
semantics.

## Compiler And Repository Metrics

| Boundary | Semantic-state tests | Repository tests | Types | Instantiations |
| --- | ---: | ---: | ---: | ---: |
| Loop 3 baseline | 155 | 6,265 | 104,742 | 176,892 |
| Loop 3 checkpoint | 260 | 6,375 | 107,053 | 181,758 |
| Net change | +105 | +110 | +2,311 | +4,866 |

The completed core first measured 106,981 types and 181,525 instantiations at
slice 16. The run used its sole approved inference refresh there, setting the
formula-derived ceilings to 109,200 and 187,000. The final measurement leaves
2,147 types and 5,242 instantiations of headroom. Slices 17 through 26 used no
further ratchet change.

## Retained Abstractions

- Persistent entity, version, snapshot, slot, alias, copy, occurrence,
  transformation, correspondence, provenance, lineage, and recovery
  distinctions from the foundation.
- The descriptor-driven typed facade and ordinary frozen handles from Loop 2.
- Explicit dependency tuples, deterministic graph validation, requested-
  closure evaluation, and exact version-derived fingerprints.
- Persistent applied endpoints produced only by the existing transaction
  kernel.
- Exact normalized progress as a small internal protocol over the canonical
  rational implementation.
- Disjoint transition declarations and definition-local executable
  capabilities.
- Ephemeral read-source overlays and transient dependency tokens without fake
  persistent identities.
- Typed caller-owned interpolation of declared independent drivers.
- Bounded application-local evaluator caches with zero as the default.
- Domain-owned exact economics and typed circle math upstream of semantic
  state.

## Rejected Or Deferred Abstractions

- No arbitrary progress snapshot, entity, version, transaction, event, or
  permanent recovery index.
- No floating progress as exact authority, whole-sample fingerprint, payload
  serialization, or JavaScript object identity as a cache key.
- No broad persistent-value lerp, independently interpolated derived values,
  guessed discrete threshold, or presentation state written as semantics.
- No runtime `Proxy`, ambient assignment, observed-read dependency capture,
  mutable global registry, or import-order authority.
- No evaluator-owned graph definitions, compute closures in durable records,
  global cache, reactive store, event store, persistent collection, or
  storage optimization.
- No economics-specific state primitive, duplicate market formula, inferred
  unit product, physical-domain policy, or universal scalar system.
- No public facade, root namespace, compatibility migration, or broad barrel.
- No aggregate timeline, clock, URL, navigation, playback, renderer, Article,
  Focus Deck, Catalogue, publication, or browser path.
- No bulk KaTeX transformation migration. Existing compositor, native
  endpoint, paint-ownership, and mechanism-conformance authorities remain
  intact and downstream.
- No knowledge ontology, procedure engine, broad semantic macro generation,
  CAS, theorem prover, or live LLM evaluation.

## Proposed Loop 4 Boundary

The smallest useful next proposal should:

1. compose multiple applied state families into one coherent aggregate
   semantic step without copying their implementations;
2. require explicit sequencing, nesting, or demonstrated independence when
   transformations write overlapping entities;
3. diagnose conflicts before any aggregate sample or endpoint escapes;
4. preserve structural sharing, correspondence, provenance, lineage, pinned
   historical inspection, branch recovery, and deterministic direct seek;
5. provide stable logical addresses for aggregate `before`, `during`, and
   `after` state, including a typed distinction between a settled state and
   progress inside a transformation;
6. coordinate nested or domain-local transformations without allowing a local
   rewind to mutate an otherwise current aggregate; and
7. stop again for architecture/API review before a clock, renderer, Graph2D,
   KaTeX, Article, public facade, compatibility migration, or visual policy.

Loop 4 should use at least two independently owned state changes in one
production-shaped semantic example. It should not generalize from the
single-driver tax or circle fixtures alone.

## KaTeX Migration Gate

The sequence now has a concrete checkpoint boundary:

1. **Now:** Loop 3 is complete and awaiting acceptance. KaTeX is unchanged.
2. **Next, if approved:** Loop 4 proves aggregate composition and logical
   timeline addressing without a renderer.
3. **Then:** Loop 5 connects one canonical Graph2D/KaTeX exemplar through the
   existing sampled-frame and renderer-adapter ownership chain and stops for
   human visual/API review.
4. **Only after approval:** a separate migration contract can move selected
   existing KaTeX transformations family by family, preserving canonical
   native endpoints, compositor ownership, deterministic clocks, semantic
   correspondence, and mechanism-conformance evidence.

The first KaTeX use of the new system is therefore a Loop 5 integration goal,
not a Loop 3 result or Loop 4 task. A catalogue-wide migration has no honest
date or authorization yet; its order and rollback units must come from the
reviewed exemplar rather than from this internal API alone.

## Checkpoint Questions

1. Accept persistent endpoints plus pure ephemeral `at(progress)` as the
   internal state-family boundary?
2. Keep arbitrary samples, transient tokens, derived reads, and evaluator
   caches outside durable semantic history and recovery?
3. Keep the direct-module surface internal despite successful supply-tax and
   circle pressure?
4. Accept explicit caller-owned interpolation rather than a generic scalar or
   derived-value lerp?
5. Authorize drafting, but not executing, a separate Loop 4 aggregate
   composition and logical timeline proposal with another mandatory API
   checkpoint?
6. Keep the first Graph2D/KaTeX integration in Loop 5 and defer existing KaTeX
   transformation migration until that exemplar is human-approved?

Recommended disposition: approve all six. Then draft and review Loop 4; do not
begin it from this closeout alone.

The user approved all six recommendations on 2026-09-04. The resulting
decision is recorded in
`../decisions/2026-09-04-semantic-state-family-checkpoint-and-next-sequence.md`.
The exact Loop 4 proposal lives in
`2026-09-04-semantic-state-aggregate-composition-logical-timeline-long-loop-proposal.md`
and still requires explicit execution approval.

## Verification

- `npm run test:semantic-state`: 260/260 passed.
- Cross-caller scale: two independent runs per caller; 257 exact positions,
  255 deterministic interior hits, 255 misses, 16 retained entries, selective
  compute counts, one durable operation, and zero history growth passed.
- Canonical supply-tax: two markets, five-point exact sampling, alternate
  branch/recovery, fingerprint, cache, and canonical recomputation laws
  passed.
- Nonlinear circle: endpoint, nonmonotonic sampling, nonlinear recomputation,
  response, unit, approximate-boundary, history, and cache laws passed.
- `npm test`: 6,375/6,375 passed.
- `npm run typecheck`: application, Node, tests, Svelte, and domains passed.
- `npm run check:architecture`: passed across 2,007 TypeScript modules with
  zero dependency-direction exceptions and all cross-domain gates green.
- `npm run check:inference`: 107,053 types and 181,758 instantiations, below
  the one approved formula-derived ceilings.
- `npm run test:equation-reachability`: 12/12 laws passed with the generated
  root inventory current.
- `npm run build:bundle`: passed; the existing chunks-over-500-kB advisory
  remains nonblocking.
- `theseus workspace validate`: passed before final closeout recording.

The run stops here at its mandatory human architecture and API checkpoint. No
Loop 4 implementation or KaTeX migration is authorized by this document.
