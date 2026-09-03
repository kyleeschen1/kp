# Typed Semantic State Facade And Derived Graph Closeout

Date: 2026-09-03

Status: `HUMAN_CHECKPOINT`

Run: `run-contract.kp.typed-semantic-state-facade-derived-graph-v3`

Source proposal:
`2026-09-03-typed-semantic-state-facade-derived-graph-long-loop-proposal.md`

Active thread: `../threads/typed-semantic-authoring-framework.md`

## Recommendation

Accept the typed facade and explicit derived graph as the internal authoring
boundary for semantic state. They restore exact leaf types, remove routine
kernel identities and storage operations from author code, preserve the
existing immutable transaction authority, and make lazy derived evaluation
selective, deterministic, caller-cached, and history-free.

Do not promote this as a public API yet. The realistic supply-tax packet still
coordinates schema compilation, handle creation, derivation definitions,
snapshot materialization, graph compilation, and transformation application.
That ceremony is reasonable for an internal proof but has not earned a stable
package surface. The fixed LLM-shaped corpus proves deterministic typed repair
for nine curated cases; it does not measure live-model authoring quality.

If this checkpoint is approved, propose a separate Loop 3 contract for one
nonvisual applied semantic-state family. It should vary only the declared tax
input, derive intermediate exact-rational market consequences through the
canonical economics model, and expose a pure ephemeral `at(progress)` with
exact endpoint, seek, rewind, retry, and cache-lifetime laws. Semantic,
presentation-only, and discrete transition modes must remain explicit. Stop
again before aggregate timeline composition, URL addressing, a renderer,
Article integration, public promotion, or live-model evaluation.

## Canonical Boundary

| Concern | Authority at this checkpoint |
| --- | --- |
| Canonical artifact | Internal `createKpSemanticStateSupplyTaxAuthoring` pressure exemplar |
| Host | None; the exemplar is exercised from direct internal tests |
| Renderer | None; this run is intentionally nonvisual |
| Semantic state source of truth | Immutable aggregate snapshots and explicit derived declarations under `src/semantic-state/` |
| Economics source of truth | Canonical exact-rational per-unit-tax model and accounting under `domains/economics/` |
| Evaluation state | Definition-local graph plus caller-owned disposable cache; neither belongs to semantic history |

## Outcome

The completed facade and graph now provide:

- nested required, optional, and derived descriptors with exact inferred value
  types and deterministic schema paths;
- ordinary frozen handle objects, with exact pinned before/after reads and no
  runtime `Proxy` or observed-read authority;
- named `update`, `bind`, `bindCopy`, `introduce`, `remove`, and `derive`
  operations compiled through the existing scoped transaction kernel;
- definition-scoped derived compute capability paired with serializable
  declarations and explicit typed dependency tuples;
- local missing, duplicate, self, cross-schema, kind, capability, and cycle
  diagnostics before compute execution;
- lazy requested-closure evaluation from one explicitly pinned snapshot;
- exact entity/version and nested-derived fingerprints plus a caller-owned
  cache whose contents never affect semantic equality or recovery;
- selective recomputation, typed absence and failure semantics, retry on a
  valid successor, and no partial or failed cached value; and
- direct historical recovery whose snapshot, version, journal, change,
  correspondence, provenance, and lineage inventories do not depend on reads
  or cache activity.

No public facade, compatibility migration, proxy observation, ambient state,
global registry, filesystem generation, persistent-collection redesign,
interpolation, timeline, renderer, browser, Article, Focus Deck, catalogue,
broad economics, CAS, knowledge/procedure system, or live LLM path was added.

## Acceptance Contract

| Requirement | Result |
| --- | --- |
| Exact typed author operations | Passed. Update callbacks and derivation tuples retain their declared domain values; invalid values, lifecycle operations, and derived writes fail at the typed boundary. |
| Existing kernel authority | Passed. Facade operations converge on the same immutable transactions, journals, changes, correspondence, provenance, and lineage as direct kernel construction. |
| Explicit graph authority | Passed. Dependency edges come from declared handles; graph validation and cycles complete before compute runs. |
| Lazy and selective evaluation | Passed. Only a requested closure evaluates, and changed versions recompute only affected requested descendants. |
| History-free caching | Passed. Caller-owned cache hits, misses, failures, resets, and repeated reads add no committed authority. |
| Exact economics parity | Passed for the two tested linear supply-tax markets. Domain constructors and evaluators remain upstream; the exemplar imports no exact-rational formula helpers. |
| Author and generation pressure | Passed at the bounded level: zero routine low-level IDs, stores, casts, or generic staging in the ordinary packet and fixed nine-case corpus. |
| Scale and compiler boundary | Passed. The representative graph remains shared and selective; inference stays below frozen ratchets without another ceiling change. |
| Broad repository health | Passed at 6,263 tests, typecheck, architecture, inference, bundle, reachability, preservation, and Theseus validation. |
| Public API readiness | Not claimed. Direct-module imports and lifecycle ceremony remain intentionally internal pending the next pressure loop. |

## Manual API Packet

The frozen raw market and the current equivalent typed packet compare as
follows:

| Measure | Raw kernel | Typed facade |
| --- | ---: | ---: |
| Manual identity-factory calls | 10 | 0 |
| Low-level state construction calls | 7 | 0 |
| Manual kernel operation metadata fields | 7 | 0 |
| Persistent-value runtime narrowings | 1 | 0 |
| Author casts | not separately measured | 0 |
| Derived `.slotId` references | not separately measured | 0 |
| Nonblank authored setup lines | 69 | 34 |

The 35-line reduction is useful, but the decisive result is semantic: the
author sees `TypedMarketCurve` in the update callback and exact dependency
tuple values in a derivation while the kernel remains hidden.

The canonical supply-tax pressure packet is 82 nonblank authoring lines. It
contains three exact-rational derived outcomes, a multi-object update, shared
and copied roles, a compiled graph, and direct before/after recovery. It uses
zero manual identity factories, low-level stores, manual kernel metadata,
casts, or market-specific facade primitives. This is stronger pressure than
the tiny market packet, but the additional compile/materialize/graph ceremony
is why public promotion is premature.

The internal implementation currently spans 18 `src/semantic-state/` modules,
5,512 lines, and 185 direct-module exported declarations. The six facade
modules account for 1,362 lines and 51 exported declarations. These are
implementation seams, not a reviewed package inventory; a later public
promotion would need curated entrypoints and a consumer-only closure proof.

## Author And LLM Assessment

The author-facing strengths are now concrete:

- path-shaped handles give autocomplete and exact operation capabilities;
- aliases, copies, lifecycle changes, and derivations are distinct verbs;
- explicit dependency tuples make review and diagnostics local;
- pinned views prevent ambient recency from changing a handle's meaning; and
- typed failures retain exact schema and dependency paths.

The remaining author-facing costs are also concrete. Authors still perform a
multi-stage internal compilation sequence, choose when to materialize and
compile the graph, and own the domain compute closures. That is acceptable
inside a domain implementation, but it is not yet evidence for freezing names
or exporting one root facade.

The fixed generation-shaped corpus contains three accepted programs, three
runtime graph repairs, and three compile-time repairs. Repeated execution is
byte-stable, and ordinary cases contain no low-level IDs, stores, casts, or
generic staging. This demonstrates that the surface is structurally legible;
it does not demonstrate live model reliability, prompt independence, repair
success rates, or domain correctness beyond the fixed cases.

## Scale And Compiler Evidence

The representative probe contains 128 concrete leaves, 64 derived nodes, 184
dependency edges, 16 one-operation revisions, and 17 snapshots. Every revision
shares 127 of 128 entity stores, 127 of 128 bindings, and all 64 derived
declarations. Priming eight terminal chains and rereading after changes yields
120 cache misses, one hit, and no recomputation in the untouched chain. The
machine-time and heap observations remain advisory rather than thresholds.

The complete inference project measures 104,742 types and 176,892
instantiations against frozen ceilings of 106,300 and 181,400, leaving 1,558
and 4,508 of headroom respectively. The direct-import scale fixture accounts
for 32,616 types, 4,669 types over its library baseline, and 36,966
instantiations, with zero public-barrel imports. The scale evidence does not
justify a storage redesign or another budget increase.

## Retained Abstractions

- The foundation's entity, version, snapshot, slot, alias, copy, occurrence,
  transformation, correspondence, provenance, and lineage distinctions.
- Descriptor-derived stable paths and nominal defaults, separate from entity
  identity and payload equality.
- Ordinary frozen typed handles with explicit pinning.
- Named facade operations compiled one way into the existing transaction
  kernel; generic staging stays internal and non-projectable.
- Serializable derived declarations paired with definition-local compute
  capability and explicit dependency handles.
- Pre-execution graph validation, deterministic dependency ordering, and
  requested-closure evaluation.
- Exact version-derived fingerprints and caller-owned disposable caching.
- Canonical exact-rational economics upstream of the experimental state
  exemplar.
- Correctness-first array and index containers until measured product pressure
  demonstrates a storage problem.

## Rejected Or Deferred Abstractions

- No runtime `Proxy`, getter observation, implicit assignment, ambient
  transaction state, or statement-order identity.
- No global or import-ordered registry and no filesystem code generation.
- No value serialization, JavaScript object identity, whole-snapshot identity,
  or callback identity as dependency or cache authority.
- No cache state inside snapshots, transactions, semantic equality, or durable
  recovery.
- No economics-specific facade primitives, duplicated rational arithmetic,
  inferred formulas, inferred units, or broad market ontology.
- No public facade, root namespace, compatibility migration, or broad barrel.
- No persistent collection, event store, reactive framework, spreadsheet
  engine, CAS, theorem prover, or general state manager.
- No interpolation, timeline, runtime reparameterization, URL state, renderer,
  animation, Article, Focus Deck, browser, or catalogue integration.
- No broad knowledge declarations, procedures, semantic macro catalogue,
  generated authoring rollout, or live LLM evaluation.

## Loop 3 Candidate Comparison

Scores run from 1 (low) to 5 (high); higher risk means more speculative
complexity.

| Candidate | Authoring | Reliability | Reuse | Risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | --- |
| Applied state family and pure `at(progress)` over one tax driver | 5 | 5 | 5 | 4 | Propose next |
| Aggregate transformation composition and timeline addressing | 4 | 4 | 5 | 4 | Wait for the one-family proof |
| Graph2D and KaTeX projection of the tax exemplar | 5 | 3 | 5 | 4 | Wait for the nonvisual runtime checkpoint |
| Public facade and compatibility migration | 4 | 3 | 4 | 4 | Wait for a second state-family caller and consumer proof |
| Knowledge, procedure, and macro families | 5 | 2 | 5 | 5 | Defer beyond state and timeline evidence |
| Live LLM generation and repair evaluation | 4 | 2 | 4 | 5 | Defer until the public authoring boundary stabilizes |

## Proposed Loop 3 Boundary

The smallest useful next loop should:

1. define one applied state family as persistent `before` and `after`
   snapshots plus a pure, disposable evaluator;
2. prove exact `at(0)` and `at(1)` equivalence, deterministic direct seek,
   rewind, repeated sampling, and explicit disposal;
3. distinguish semantic interpolation, presentation-only transition, and
   discrete or piecewise regime changes in the type surface;
4. interpolate only an independently declared tax driver, then rebuild and
   derive requested equilibrium, incidence, and revenue through canonical
   exact-rational economics;
5. keep arbitrary progress samples and caches ephemeral and bounded;
6. reparameterize by constructing a distinct applied transformation with
   preserved input and source provenance rather than mutating one run; and
7. pressure one structurally different nonvisual state family before proposing
   shared promotion.

The separate Loop 3 proposal must choose that second caller and its exact
rollback units. This closeout does not authorize execution.

## Checkpoint Questions

1. Accept the descriptor, typed-handle, named-operation, explicit-dependency,
   lazy-evaluator, and caller-owned-cache boundary as the internal Loop 2
   result?
2. Keep runtime observation, ambient state, global registration, and generic
   staging out of authoring and dependency authority?
3. Keep the current direct-module surface internal rather than promoting it as
   a public package now?
4. Accept the measured linear container and compiler costs until a real
   state-family caller demonstrates a problem?
5. Authorize a separate Loop 3 proposal for the bounded nonvisual state-family
   boundary above, with another mandatory API checkpoint before aggregate
   timelines or renderer work?

Recommended disposition: approve all five. Then draft and review the Loop 3
contract; do not begin it from this closeout alone.

## Verification

- `npm run test:semantic-state`: 153/153 passed.
- Canonical supply-tax pressure: compact authoring, exact dependencies, two
  exact-rational markets, branch/recovery, and no-formula-fork laws passed.
- LLM-shaped corpus: 3 accepted cases, 3 runtime repairs, and 3 compile-time
  repairs passed deterministically.
- Scale probe: exact operation, structural-sharing, cache, and selective
  recomputation counts passed.
- `npm test`: 6,263/6,263 passed.
- `npm run typecheck`: application, Node, tests, Svelte, and domains passed.
- `npm run check:architecture`: passed across 2,001 source files with zero
  dependency-direction exceptions.
- `npm run check:inference`: 104,742 types and 176,892 instantiations, below
  frozen ceilings.
- `npm run test:equation-reachability`: 4,129 scanned files and 12 laws passed.
- `npm run test:equation-surface-preservation`: 11/11 passed.
- `npm run build:bundle`: passed; the existing chunks-over-500-kB advisory
  remains nonblocking.
- `theseus workspace validate`: passed before final closeout recording.

The run now stops at the mandatory human architecture and API checkpoint. No
Loop 3 implementation is authorized by this document.
