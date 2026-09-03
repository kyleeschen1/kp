# Persistent Semantic State Foundation Closeout

Date: 2026-09-03
Status: `HUMAN_CHECKPOINT`
Run: `run-contract.kp.persistent-semantic-state-foundation-v1`
Source proposal:
`2026-09-02-persistent-semantic-state-foundation-long-loop-proposal.md`
Active thread: `../threads/typed-semantic-authoring-framework.md`

## Recommendation

Accept the nonvisual foundation and keep it internal. It establishes a coherent
identity and state model, restores the broad repository signal, reduces the
repeated unit-scalar authoring burden, and preserves exact-rational economics
authority. It does not yet establish a pleasant authoring interface.

If the checkpoint is approved, the next loop should put one narrow, generated
or statically typed author facade over the existing kernel and add explicit
derived-value evaluation behind that facade. It should begin without runtime
`Proxy` read tracking. Dependencies, updates, aliases, and copies should remain
explicit in the compiled representation even if the author syntax becomes
property-shaped. A proxy may later be evaluated as replaceable syntax sugar,
but it should not become identity, dependency, or transaction authority.

Do not expose the 101 direct-module declarations as a public package, optimize
the storage into a general persistent collection, integrate a renderer, or
begin interpolation from this checkpoint. Those decisions need pressure from
the next author-facing market proof.

## Outcome

All 30 approved slices reached their specified boundary:

- 49 baseline failures were classified and all stale closed-world ledgers were
  reconciled to their canonical owners without weakening a ceiling or changing
  product behavior merely to satisfy a test.
- The internal unit-scalar helper now derives only repeated construction,
  guarding, provenance, evidence, and map-wrapping plumbing. Market and circle
  formulas, derivatives, units, and physical predicates remain caller-owned.
- A one-way adapter projects the canonical exact-rational supply-tax model into
  the typed market and checks equilibrium, incidence, and welfare parity.
  Non-exact `number` projection and unsupported price-floor parity are explicit
  gaps.
- The new internal state kernel separates entity, immutable version, aggregate
  snapshot, contextual slot, occurrence, author alias, label, representation,
  transformation definition, transformation application, and derivation IDs.
- Immutable stores and complete aggregate snapshots support branch isolation,
  exact pinned recovery without replay, explicit absence, and deterministic
  successor identity.
- Scoped transactions provide read-your-writes, atomic commit or abort,
  `update`, shared `bind`, `bindCopy`, `introduce`, and `remove`. Updating an
  entity advances every role that already aliases that entity; a copy receives
  a distinct entity and exact source-version provenance.
- Derived bindings are serializable, read-only declarations only. Evaluation,
  dependency caching, invalidation, cycles, and dynamic read discovery remain
  deliberately absent.
- Transaction commits project one way into the existing change-set,
  correspondence, semantic-entity provenance, and lineage authorities. Opaque
  generic staged writes and ambiguous operation histories fail closed.

No public semantic-state facade, runtime proxy, global store, renderer,
timeline, Article change, interpolation, or supply-tax animation integration
was added.

The standalone `next-action.kp.typed-math.unit-scalar-map-helper` control
record is resolved because slices s06-s12 completed it. The executable queue
is intentionally empty at this checkpoint; a loop-2 action and contract must
come from a new reviewed proposal rather than an automatic refill.

## Acceptance Contract

| Requirement | Result |
| --- | --- |
| Trustworthy broad signal | Passed at 6,175 tests with zero failures. |
| Unit-scalar helper | Retained after reducing the measured repeated plumbing while preserving caller-authored math and diagnostics. |
| Exact economics authority | Preserved upstream through a one-way checked adapter; no floating-point or price-floor claim is manufactured. |
| Identity distinctions | Nominal deterministic factories distinguish all accepted identity kinds without JavaScript reference or glyph equality. |
| Update, alias, copy, and lifecycle laws | Passed for same-entity revision, shared-role propagation, independent copies, introductions, removals, and typed absence. |
| Atomic scoped transactions | Passed for read-your-writes, failure isolation, commit, abort, foreign scope, expired scope, and reentrant or nondeterministic updates. |
| Direct historical recovery | Exact snapshot, entity, version, and slot-version handles resolve against materialized committed state without replay. |
| Existing authority convergence | Change sets, occurrence correspondence, provenance registries, and lineage are projected without inspecting values, renderers, or journal order. |
| Internal and framework-neutral | No public facade or framework/runtime/render imports; architecture check passes with zero exceptions. |
| Bounded compiler cost | Repository inference remains below its ratchets at 102,058 types and 170,776 instantiations. |

## API And Evidence Surface

The foundation comprises nine internal implementation modules: eight under
`src/semantic-state/` and one one-way adapter under `src/semantic/`. Together
they contain 3,322 lines and 101 exported declarations. Those exports are
direct-module implementation seams, not a reviewed public API.

Twelve focused runtime files and nine negative type fixtures contain 3,307
lines. `npm run test:semantic-state` executes 65 laws. This near one-to-one
implementation/evidence ratio is appropriate while identity semantics are
being established, but it is also evidence that ordinary authors must not be
asked to assemble the kernel directly.

The inference measurements are compiler workset counts, not counts of semantic
concepts or handwritten types:

| Boundary | Types | Instantiations | Interpretation |
| --- | ---: | ---: | --- |
| Run baseline | 98,881 | 164,998 | Included the pre-existing 30-fixture repository closure. |
| Foundation checkpoint | 102,058 | 170,776 | Includes ledger repairs, the unit-scalar helper, economics parity, and the complete state foundation. |
| Net run change | +3,177 | +5,778 | Within the existing ratchets; no ceiling was raised. |

The complete suite grew from 6,080 baseline tests, of which 49 initially
failed, to 6,175 passing tests. The state kernel itself entered after the
economics gate, when 6,110 tests were passing.

## Identity And State Semantics

The accepted meanings are now executable rather than nomenclature alone:

- An **entity** is the persistent semantic continuant.
- A **version** is one immutable value of that entity with exact provenance.
- A **snapshot** is one complete aggregate state, including required roles,
  optional roles, explicit absences, derived declarations, and materialized
  entity stores.
- A **slot** is a contextual role such as `market.supply`; it is not the entity.
- Two slots are true aliases when they bind the same exact entity and version.
  An update advances all such slots in the scoped transaction.
- A **copy** creates a new entity whose initial version records the exact source
  entity and version. It can then diverge independently.
- An **occurrence** is a snapshot-local display or correspondence address. It
  does not replace entity identity.
- Labels, author aliases, and representations are separate identity kinds.
  The foundation reserves their nominal identities; the future author facade
  still needs to decide how authors bind and retrieve them.
- A transaction journal is diagnostic and procedural evidence. Its statement
  sequence does not mint snapshot, version, correspondence, or lineage
  identity.

This resolves the central market question: a post-tax market state is not
named *marketWithTax* as its essence. It is the exact output snapshot of one
applied transformation, and its provenance can be followed backward while the
state remains independently addressable.

## Memory And Structural Sharing

The current implementation proves semantic sharing but is not a general HAMT,
event store, or incremental database:

| Behavior | Current result |
| --- | --- |
| Unchanged version object | Reused by reference in successor stores. |
| Unchanged entity store | Reused by reference in successor snapshots. |
| Unchanged slot binding or absence | Reused by reference after successor validation. |
| Changed entity | Receives a new store whose prior version objects are shared and whose new version is frozen. |
| Branch | Retains the same parent objects and independently materializes only its declared changes. |
| Copy | Clones and freezes the source payload under a distinct entity, retaining exact copied-from provenance. |
| Recovery | Uses caller-owned snapshot and version indexes; it does not replay journals. |
| Container cost | Successor construction rebuilds and validates aggregate arrays and indexes in linear time over the snapshot. Appending a version copies the store's version array and index. |

This is the right correctness-first boundary for the present small graphs. It
would be premature to replace it with a persistent collection library before a
real author-facing market graph measures unacceptable time or memory. The next
loop should add a representative scale probe, not a speculative storage stack.

## Current Internal Authoring Packet

The following is representative of the executable low-level API. It is precise
and inspectable, but too verbose for article authors or routine model output:

```ts
const ids = createKpSemanticStateIdentityScope("lesson.tax");
const supplySlot = ids.slot("market.supply");
const demandSlot = ids.slot("market.demand");
const supply = createKpSemanticEntityVersionStore({
  identities: ids,
  entityId: ids.entity("supply"),
  value: { intercept: 2, slope: 1 },
  sourceId: "lesson.initial-supply"
});
const demand = createKpSemanticEntityVersionStore({
  identities: ids,
  entityId: ids.entity("demand"),
  value: { intercept: 12, slope: -1 },
  sourceId: "lesson.initial-demand"
});

const before = createKpAggregateSemanticSnapshot({
  identities: ids,
  snapshotId: ids.initialSnapshot(),
  requiredSlotIds: [supplySlot, demandSlot],
  bindings: [
    { slotId: supplySlot, entityId: supply.entityId,
      versionId: supply.latestVersionId },
    { slotId: demandSlot, entityId: demand.entityId,
      versionId: demand.latestVersionId }
  ],
  entityStores: [supply, demand]
});

const addTax = ids.appliedTransformation(
  ids.transformation("add-tax"),
  "example"
);
const tx = beginKpSemanticTransaction({
  identities: ids,
  before,
  transformationId: addTax
});
tx.update(tx.scope, {
  id: "update.taxed-supply",
  sourceId: "lesson.add-tax",
  revisionId: "taxed-supply",
  slotId: supplySlot,
  update: () => ({ intercept: 6, slope: 1 })
});
const committed = tx.commit(tx.scope);
```

Before this foundation, a domain caller could produce named immutable scenario
objects, but it had no shared language for role aliasing, copy identity,
transaction scope, exact snapshot recovery, or canonical change projection.
After the foundation, all of those meanings are explicit—but direct authoring
requires more setup. The result simplifies framework internals and future
generation; it does not yet simplify a handwritten lesson.

The desired next-layer shape is closer to the following non-executable design
sketch:

```ts
const marketState = defineState("lesson.tax", {
  market: { supply, demand },
  governmentRevenue: optional()
});

const taxed = marketState.transform("add-tax", state => {
  state.market.supply.update(previous => addTaxWedge(previous, tax));
  state.governmentRevenue.derive(
    [state.market, tax],
    deriveGovernmentRevenue
  );
});
```

That facade should compile to the existing IDs, slots, stores, explicit
dependency declarations, and transaction operations. Property access should
be ergonomic syntax, not runtime evidence that a dependency or identity
exists.

## Author And LLM Implications

The foundation is favorable for both authors and LLMs once hidden behind a
small facade:

- stable paths can drive autocomplete, generated names, and deterministic
  references without authors minting every ID;
- explicit operation verbs make `update`, alias, copy, introduction, removal,
  and derivation difficult to conflate;
- immutable before/after values and exact recovery make reordering,
  reparameterizing, inspecting, and reusing transformations tractable;
- one authoritative change projection can generate correspondence and lineage
  instead of asking authors or models to annotate the same relation repeatedly;
- typed gaps localize unsupported work rather than inviting a guessed generic
  transition; and
- serializable declarations remain suitable for generation while TypeScript
  library calls retain IDE inference.

The present weaknesses are equally important. The raw API has too many names,
requires authors to understand storage topology, and erases value-specific
slot types at the aggregate transaction boundary. Update callbacks therefore
receive the persistent-value union rather than a domain-specific value unless
the next facade restores that type. LLMs would also overproduce IDs and
boilerplate if asked to author this layer directly. These are facade problems,
not evidence that entity/version/snapshot semantics are wrong.

## Retained Abstractions

- deterministic nominal identity factories scoped by an explicit namespace;
- frozen structural semantic values and append-only immutable versions;
- complete aggregate snapshots with explicit optional absence;
- slots as contextual roles, with shared binding distinct from copying;
- applied transformations as the source of successor snapshot and version IDs;
- scoped explicit transactions with atomic commit and diagnostic journals;
- declaration-only derived bindings with explicit dependency slots;
- exact pinned recovery against materialized caller-owned indexes; and
- one-way projection into existing provenance, correspondence, lineage, and
  change-set authority.

## Rejected Or Deferred Abstractions

- No public state API or root namespace in this loop.
- No global mutable registry, import-order authority, event-sourcing framework,
  or reconstruction from a genesis log.
- No plain assignment or runtime object identity as semantic change.
- No runtime proxy read tracking as dependency authority.
- No lazy evaluator, dependency cache, invalidation engine, or cycle handling
  yet; only declarations exist.
- No interpolation, `at(progress)` family, aggregate timeline, URL, Article,
  Focus Deck, renderer, Graph2D, KaTeX, CSS, or browser integration.
- No inferred derivatives, units, bases, equalities, law evidence, or physical
  domain predicates.
- No CAS, theorem prover, ontology, universal typeclass/HKT hierarchy,
  knowledge catalogue, procedure system, broad macro catalogue, or LLM
  authoring rollout.
- No persistent-collection dependency or storage optimization before measured
  scale pressure.

## Checkpoint Questions

1. Accept the entity/version/snapshot/slot distinction and the explicit
   alias-versus-copy laws as the internal semantic foundation?
2. In loop 2, prefer a narrow statically typed or generated property facade
   with explicit dependency declarations, leaving runtime `Proxy` tracking out
   of authority unless later evidence requires it?
3. Keep generic `stage` as an internal escape hatch that cannot project into
   canonical authority, and expose only named semantic operations through the
   future author facade?
4. Treat aggregate linear-copy costs as acceptable until a realistic market
   graph measures otherwise?
5. Restore domain-specific value types at the author facade before adding lazy
   derivation, so `state.market.supply.update(...)` receives a typed supply
   curve rather than the broad persistent-value union?

Recommended disposition: approve all five, then propose a separately reviewed
loop-2 contract for the typed facade and explicit derived dependency graph. Do
not begin loop 2 from this closeout alone.

## Verification

- `npm run test:semantic-state`: 65/65 passed.
- Focused state-authority, correspondence, provenance, lineage, and composition
  cohort: 35/35 passed.
- `npm test`: 6,175/6,175 passed.
- `npm run typecheck`: application, Node, tests, Svelte, and domains passed.
- `npm run check:architecture`: 1,989 modules, zero exceptions.
- `npm run check:inference`: 102,058 types and 170,776 instantiations, within
  the current ratchets.
- `npm run check:equation-reachability`: current at 68 roots.
- `npm run build:bundle`: production build passed; the existing advisory for
  chunks above 500 kB remains non-blocking.
- `theseus workspace validate`: passed before closeout recording.

The final closeout commit will contain documentation and durable execution
evidence only. The run must stop here as `HUMAN_CHECKPOINT`.
