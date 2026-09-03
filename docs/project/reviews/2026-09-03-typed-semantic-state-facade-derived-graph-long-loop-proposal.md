# Typed Semantic State Facade And Derived Graph Long-Loop Proposal

Date: 2026-09-03
Status: V2 STOPPED AT S14; V3 RECOVERY APPROVED
Target:
`next-action.kp.typed-authoring.semantic-state-facade-derived-graph`
Active contract:
`run-contract.kp.typed-semantic-state-facade-derived-graph-v3`
Active thread: `../threads/typed-semantic-authoring-framework.md`
Source checkpoint:
`2026-09-03-persistent-semantic-state-foundation-closeout.md`

## Recommendation

Accept all five foundation-checkpoint recommendations and run a 26-slice,
nonvisual second loop. Put one internal, descriptor-driven, statically typed
property facade over the existing semantic-state kernel, then add an explicit
derived dependency graph, lazy requested evaluation, dependency-version
caching, and local cycle and absence diagnostics.

The author surface should consist of ordinary nested TypeScript objects built
from a declared schema. TypeScript mapped types retain each leaf's domain value
type, and each runtime handle closes over an explicit stable slot reference.
Dependency selectors return declared handles; property reads are never
observed to discover dependencies. Runtime `Proxy`, generic staged writes,
ambient assignment, global registries, and import-order authority remain out
of the facade.

The loop ends with one compact, exact-rationally checked supply-tax authoring
proof, a fixed LLM-shaped fixture corpus, compiler-cost attribution, and a
representative state-graph scale probe. It stops before interpolation,
aggregate timelines, renderers, Article integration, public promotion, or a
general economics pack.

## Why This Loop Is Current

The first semantic-state loop established executable identity, alias, copy,
transaction, structural-sharing, recovery, and authority-projection laws, but
its raw packet still asks authors to create identity scopes, slots, entity
stores, complete snapshots, applied transformations, transaction write IDs,
and revisions manually. It also erases a slot's domain value type at the raw
transaction boundary. Those are precisely the abstraction costs that the
accepted architecture said Loop 2 should remove.

Derived declarations already exist in snapshots, but reads intentionally fail.
Adding evaluation before typed dependencies would preserve the wrong boundary:
authors would receive the broad persistent-value union, and a later convenience
layer might be tempted to infer dependencies from runtime reads. This loop
therefore restores exact leaf types and explicit handles first, proves that all
author operations compile to the existing kernel, and only then activates the
derived graph.

Long mode is appropriate because the change crosses recursive TypeScript
inference, deterministic identity generation, transaction compilation,
derived graph validation, cache semantics, exact economics parity, LLM-shaped
authoring pressure, and repository-wide inference and dependency gates. The
expected effort is approximately 12-20 agent hours. That is an estimate, not a
delivery promise.

## Proposed Author Boundary

The exact spelling remains pressure-tested rather than pre-frozen, but the
facade should support this semantic shape:

```ts
const market = defineKpSemanticState("lesson.tax", {
  market: group({
    supply: value(supply),
    demand: value(demand)
  }),
  equilibrium: derived<Equilibrium>(),
  governmentRevenue: optional<Money>()
});

const addTax = market.transform("add-tax", state => {
  state.market.supply.update(previous => previous.withSellerTax(tax));
  state.equilibrium.derive({
    from: [state.market.demand, state.market.supply],
    compute: ([demand, supply]) => solveEquilibrium(demand, supply)
  });
});

const applied = addTax.apply(market.initial);
applied.before.market.supply.read();
applied.after.equilibrium.read();
```

This sketch is a usability target, not an already approved public signature.
The implementation may use a two-stage schema builder if that materially
improves inference or diagnostics. It may not replace explicit dependency
handles with observed reads or turn callbacks into semantic identity.

## Canonical Boundaries

- **State source of truth:** the internal contracts under
  `src/semantic-state/`, especially aggregate snapshots, transactions,
  derived-binding declarations, and pinned recovery.
- **Existing semantic authority:** the one-way adapter in
  `src/semantic/semantic-state-authority-adapter.ts`; the facade compiles into
  this authority rather than creating parallel provenance or correspondence.
- **Economics source of truth:** the exact-rational supply-tax model under
  `domains/economics/`. The typed market experiment remains a pressure caller
  and must not become competing production authority.
- **Authoring pressure caller:**
  `src/experiments/typed-linear-supply-demand/` plus its existing runtime and
  type fixtures.
- **Host and renderer:** none. This loop changes no Article, Focus Deck,
  Graph2D, KaTeX, animation, URL, CSS, or browser behavior.
- **Rollback unit:** one verified slice commit. The facade and evaluator must
  remain removable without reverting the foundation, promoted typed-math
  entrances, canonical economics model, or reviewed visual exemplars.

## Acceptance Contract

The loop succeeds only if all of the following are true:

1. A nested schema deterministically produces stable slot, entity, derivation,
   operation, and source identities without ordinary authors minting low-level
   brands or IDs.
2. Plain nested handle objects preserve each leaf's exact value type. An update
   to `market.supply` receives and returns the declared supply-curve type, and
   incompatible values fail at compile time.
3. Typed `read`, `update`, shared `bind`, `bindCopy`, `introduce`, `remove`, and
   `derive` operations compile to the existing immutable transaction kernel.
   Generic `stage` is absent from the author surface.
4. Facade transactions preserve read-your-writes, alias propagation, copy
   independence, optional-slot lifecycle, atomic commit or abort, exact
   before/after recovery, and scoped capability expiry.
5. Derived dependencies are declared as typed stable handles. The serializable
   snapshot declaration and the definition-scoped compute implementation remain
   separate; executable closures are not claimed to be serializable semantics.
6. The graph rejects self, duplicate, missing, cross-schema, writable-derived,
   and cyclic dependencies with local typed diagnostics before a partial value
   can escape.
7. Evaluation is lazy and requested: reading one derived leaf evaluates only
   its dependency closure. Unrequested independent descendants do not run.
8. A cache key includes the derivation identity and the exact resolved
   dependency-version fingerprint. Unchanged branches reuse results; a changed
   dependency invalidates only affected requested descendants.
9. Reads, graph validation, cache fills, cache hits, and failed evaluations do
   not create versions, snapshots, changes, correspondence, lineage, or
   transaction journal entries.
10. The supply-tax proof authors a typed supply update and derived equilibrium,
    incidence, and government-revenue values compactly while retaining exact
    parity and one-way canonical economics authority.
11. A fixed LLM-shaped corpus needs no low-level IDs, preserves deterministic
    output, and receives compile-time or typed repair diagnostics for invalid
    value, lifecycle, dependency, and write attempts. This is a generation
    fixture, not a claim about model quality.
12. A representative graph probe records operation counts, sharing, cache
    behavior, and compiler cost without introducing a persistent-collection
    dependency. The repository inference ratchets, architecture, typecheck,
    bundle, complete tests, and Theseus validation remain green.

## Allowed Work

- New internal semantic-state schema, descriptor, typed-handle, transform,
  dependency-graph, evaluator, cache, and diagnostic modules
- Narrow extensions to aggregate snapshots, successor construction,
  transactions, derived-binding declarations, pinned recovery, and the
  existing authority adapter required by named facade operations
- Runtime law tests, negative TypeScript fixtures, deterministic authoring
  fixtures, inference attribution, and scale instrumentation
- Migration of only the typed linear supply-demand pressure caller into one
  facade example while preserving its current behavior and exact-rational
  authority boundary
- Documentation and durable Theseus evidence required by this contract

## Disallowed Work

- A public package facade, root namespace export, compatibility migration, or
  catalogue-wide rollout
- Runtime `Proxy` dependency discovery, getter observation, implicit
  assignment, ambient transaction state, global mutable store, evaluator
  registry, or import-order authority
- Exposure of generic `stage` or low-level entity-store replacement through
  the author facade
- Interpolation, `at(progress)`, continuous or discrete regime projection,
  aggregate timelines, navigation, URL state, replay scheduling, or clocks
- Article, Focus Deck, Graph2D, Graph3D, KaTeX, SVG, Canvas, WebGL, CSS,
  browser, or animation integration
- A full supply-demand ontology, elasticity, floors or ceilings, IS/LM,
  shortages or surpluses, general policy composition, or domain pack
  promotion
- Derived unit algebra, inferred formulas, inferred derivatives, law evidence,
  bases, equality, or physical-domain predicates
- A general event store, persistent-collection library, reactive framework,
  spreadsheet engine, CAS, theorem prover, HKT/typeclass hierarchy, knowledge
  catalogue, procedure system, macro catalogue, or live LLM integration
- Filesystem code generation or a runtime proxy fallback if the statically
  typed descriptor design fails; that failure returns to an API checkpoint

## Dependencies

- The accepted identity and state direction in
  `../decisions/2026-09-02-persistent-semantic-state-architecture-direction.md`
- The sequencing review in
  `2026-09-02-semantic-state-architecture-sequencing-review.md`
- The completed foundation and exact checkpoint recommendations in
  `2026-09-03-persistent-semantic-state-foundation-closeout.md`
- Existing semantic-state laws and negative type fixtures
- Existing typed market, unit-scalar helper, and exact-rational economics
  parity evidence
- Current architecture, inference, typecheck, impact, bundle, complete-test,
  and Theseus validation commands

## Verification And Context Cadence

- **Focused:** run the named semantic-state test or negative type fixture and
  inspect `npm run verify:impact -- --path <changed-path>` before following its
  scoped recommendation.
- **Standard:** focused proof plus `npm run typecheck` and
  `theseus workspace validate`.
- **Broad:** standard proof plus applicable `npm run check:architecture`,
  `npm run check:inference`, `npm test`, and `npm run build:bundle` gates.
- Every completed slice records Theseus context and verification evidence and
  normally produces one exact-path commit containing implementation, tests,
  and its completed-slice event.
- Start each slice from one brief Theseus context capsule. Escalate to working
  context only for a source-dependent question the capsule cannot answer.
- Derive progress from `npm run --silent loop:status` at slice start,
  completion, commit boundaries, and before any stop or final response.

## Proposed Ordered Slices

Every row is one independently reversible commit boundary.

| Slice | Target and intended change | Risk | Verification level and expected checks | Commit boundary | Slice stop condition |
| --- | --- | --- | --- | --- | --- |
| s01 | **Authoring and compiler baseline.** Characterize the raw foundation packet, count manual identities and low-level calls for a small nested market, freeze current inference counts, and add a disposable-by-design scale fixture specification. | Medium: measuring an unrepresentative packet could optimize the wrong surface. | Broad diagnostic: semantic-state suite, typed market fixture, typecheck, inference, architecture, complete test, bundle, and Theseus validation. | Commit characterization fixtures and dated metrics only. | Stop if the broad foundation signal is no longer green or the existing market boundary cannot serve as pressure evidence. |
| s02 | **Schema leaf and group vocabulary.** Add internal descriptors for required value leaves, optional leaves, derived leaves, and nested groups with exact generic value types. | High: recursive conditional types can erase inference or explode compiler work. | Standard: positive inference examples, invalid descriptor type fixtures, focused schema tests, typecheck, Theseus validation. | Commit descriptor types and tests without runtime state creation. | Stop if ordinary leaf types require manual casts, explicit branded IDs, or an inference-ceiling increase. |
| s03 | **Deterministic schema paths and identities.** Flatten descriptor paths into stable slot, entity, derivation, source, and operation defaults with collision and invalid-segment diagnostics. | High: path identity could accidentally become entity identity or depend on object enumeration accidents. | Focused: nested path, stable-order, collision, reserved-name, and namespace-isolation laws. | Commit identity compilation and diagnostics only. | Stop if aliases or copies cannot retain identity distinct from their slot paths. |
| s04 | **Initial snapshot materialization.** Compile required and optional schema leaves into the existing stores, bindings, absences, derived declarations, and complete immutable initial snapshot. | High: a parallel snapshot model would split authority. | Standard: exact raw-kernel equivalence, frozen-value, optional-absence, derived-declaration, typecheck, Theseus validation. | Commit schema-to-foundation materialization only. | Stop if materialization bypasses current constructors or weakens their validation. |
| s05 | **Typed read and pinned-view handles.** Build ordinary nested runtime handle objects whose leaf reads retain the declared type and whose pinned before/after views recover exact snapshot values. | High: a convenience view could become mutable current-state authority. | Standard: exact value inference, historical pinning, missing/absent diagnostics, no-Proxy check, typecheck, Theseus validation. | Commit read-only handle and view layer only. | Stop if reads consult ambient current state, replay history, or runtime property observation. |
| s06 | **Transformation definition and application shell.** Define a scoped author transformation that receives typed operation handles and applies through the existing transaction lifecycle. | High: callback execution order could become semantic or animation identity. | Standard: deterministic transformation IDs, scope expiry, commit/abort, empty-transform, typecheck, Theseus validation. | Commit transformation shell without leaf mutations. | Stop if author callbacks or statement order must mint snapshot identity or pedagogical order. |
| s07 | **Typed update compilation.** Expose leaf `update(previous => next)` with the exact domain type and derive internal write, source, and revision IDs deterministically. | High: callback typing or default IDs may hide nondeterminism. | Standard: supply-shaped update, incompatible-return type fixture, alias propagation, deterministic-update errors, typecheck, Theseus validation. | Commit update facade and laws only. | Stop if the callback receives the persistent-value union, can mutate a prior value, or needs author-minted low-level IDs. |
| s08 | **Typed shared bind.** Expose explicit shared binding between compatible writable leaf handles and compile it to kernel alias semantics. | High: structural compatibility can be mistaken for semantic sameness. | Standard: exact type compatibility, alias update propagation, cross-schema and incompatible-value negatives, typecheck, Theseus validation. | Commit shared-bind facade and tests only. | Stop if binding copies a value, relies on equality, or permits cross-scope identity leakage. |
| s09 | **Typed copy binding.** Expose `bindCopy` with a deterministic new entity identity and exact copied-from provenance while retaining the leaf value type. | Medium: generated identity can collide across repeated applications. | Standard: distinct identity, deterministic application scoping, equal initial value, independent divergence, lineage, typecheck, Theseus validation. | Commit copy facade and laws separately from aliasing. | Stop if source changes propagate, copies share entity IDs, or callers must supply brands. |
| s10 | **Optional introduce and remove.** Expose lifecycle operations only on schema-compatible optional leaves, with typed absence and required-leaf rejection. | Medium: optionality can degrade into `undefined` ambiguity. | Standard: introduce/read/remove, repeated lifecycle errors, required-slot and wrong-value type fixtures, typecheck, Theseus validation. | Commit optional lifecycle facade and tests only. | Stop if absence is represented by nullish value, presentation state, or a missing snapshot entry. |
| s11 | **Facade transaction convergence.** Pressure multiple updates, aliases, copies, and lifecycle changes in one transform and prove exact raw transaction, journal, change-set, correspondence, provenance, and lineage equivalence. | High: facade bookkeeping could become a second authority. | Broad: all state and adapter laws, architecture, inference, typecheck, bundle, complete test, Theseus validation. | Commit convergence fixes and evidence as one rollback unit. | Stop if the adapter must inspect author objects, values, or statement order to infer authority. |
| s12 | **Facade API gate.** Compare the raw and typed packets, measure manual IDs, low-level calls, setup lines, diagnostics, autocomplete-relevant types, and compiler cost; retain or make one bounded shape correction. | High: attractive syntax can conceal unstable recursive types. | Broad plus manual API review packet; expected result is zero ordinary low-level IDs and exact leaf callback types. | Commit the internal API decision and at most one narrow descriptor-shape correction. | Stop if evidence is ambiguous, a second redesign is needed, compiler ratchets fail, or runtime `Proxy`/codegen appears necessary. |
| s13 | **Typed derivation definition.** Pair serializable derived declarations with definition-scoped typed compute implementations and explicit dependency handle tuples. | High: executable closures could be mistaken for durable semantic data. | Standard: dependency tuple inference, result type, stable derivation identity, serialization-boundary tests, typecheck, Theseus validation. | Commit definition contracts without evaluating them. | Stop if compute functions enter snapshots, require a global registry, or dependencies are discovered by executing reads. |
| s14 | **Derived-binding transaction operation.** Let `derive` introduce or replace a compatible derived binding through a named transaction operation while preserving read-only behavior. | High: derived replacement changes snapshot evolution and change projection. | Broad: initial and replacement declarations, writable-derived negatives, successor sharing, change-set/adapter laws, architecture, typecheck, Theseus validation. | Commit foundation extension, facade operation, and tests together. | Stop if a derived slot can be updated as an entity value or a replacement cannot name exact before/after authority. |
| s15 | **Dependency graph validation.** Build a definition-local graph that validates missing, duplicate, self, cross-schema, absent-capability, and incompatible dependency declarations. | High: late failures make author diagnostics nonlocal. | Standard: each diagnostic code, stable path/source reporting, negative type fixtures where statically knowable, typecheck, Theseus validation. | Commit graph construction and local diagnostics only. | Stop if validation depends on first evaluation or silently drops an invalid edge. |
| s16 | **Cycle detection and ordering.** Detect direct and indirect cycles deterministically and compute a stable dependency order without making order semantic. | High: cycle bugs can recurse indefinitely or make output order-dependent. | Standard: self, two-node, long-cycle, diamond, and declaration-order permutation tests, typecheck, Theseus validation. | Commit cycle/order machinery and tests only. | Stop if any cycle reaches a compute callback or declaration order changes a result. |
| s17 | **Lazy requested evaluator.** Resolve concrete and derived dependencies from one pinned snapshot and compute only the closure requested by a typed read. | High: evaluation could leak partial values or mutate state. | Standard: base read, single derived read, diamond closure, unrequested-branch call counts, thrown-compute diagnostic, typecheck, Theseus validation. | Commit evaluator without caching. | Stop if evaluation creates semantic history, exposes a partial result, or consults ambient current state. |
| s18 | **Dependency-version fingerprints.** Derive deterministic cache fingerprints from derivation identity plus exact concrete-version and nested-derived dependency tokens. | High: value equality or snapshot identity would invalidate too much or too little. | Focused: same-dependency reuse, changed-version distinction, branch equivalence, alias, copy, and nested-derived fingerprint laws. | Commit fingerprint contracts and tests only. | Stop if fingerprints depend on payload serialization, JavaScript reference equality, or whole-snapshot identity alone. |
| s19 | **Caller-owned lazy cache.** Add a bounded evaluator cache outside snapshots and transactions, keyed by the exact fingerprints from s18. | High: global cache state can become identity authority or leak histories. | Standard: hit/miss counts, evaluator isolation, branch reuse, disposal/reset, frozen result, typecheck, Theseus validation. | Commit cache implementation and laws only. | Stop if cache contents affect semantic equality, survive by global registration, or require mutating a snapshot. |
| s20 | **Selective recomputation.** Prove that a changed dependency recomputes only requested affected descendants while unaffected and unrequested nodes remain untouched. | High: accidental eager invalidation recreates a broad reactive engine. | Standard: chain, diamond, independent branch, alias update, copy divergence, and optional dependency call-count laws; typecheck and Theseus validation. | Commit selective evaluation logic and instrumentation only. | Stop if committing a transaction eagerly computes or walks every derived value. |
| s21 | **Absence and failure semantics.** Localize optional-absence, removed dependency, compute failure, invalid result, and stale-definition diagnostics without caching failures as values. | Medium: ambiguous absence can be mistaken for a legitimate derived value. | Standard: typed error codes and paths, retry after valid successor, no partial-cache, typecheck, Theseus validation. | Commit failure contracts and tests only. | Stop if `undefined`, `NaN`, generic exceptions, or stale cache entries conceal an invalid derivation. |
| s22 | **History and recovery law gate.** Prove that reads, cache events, failures, and repeated recovery add no versions, snapshots, journal entries, changes, correspondence, provenance, or lineage. | High: a reactive implementation can silently become event sourcing. | Broad: exact before/after authority inventories, pinned recovery, all state and adapter laws, architecture, inference, typecheck, bundle, complete test, Theseus validation. | Commit law evidence and any bounded authority correction only. | Stop if evaluator behavior is required to reconstruct committed semantic state. |
| s23 | **Supply-tax facade exemplar.** Re-author one internal market state with typed demand and supply leaves, a typed seller-tax update, and explicit derived equilibrium, incidence, and government-revenue dependencies. | High: the facade may become economics-specific or fork formulas. | Standard: compact author packet, exact callback/result inference, existing typed-market tests, exact-rational parity fixture, typecheck, Theseus validation. | Commit the one pressure exemplar and its tests; do not migrate other callers. | Stop if the facade needs market-specific primitives or duplicates canonical exact-rational authority. |
| s24 | **Multi-object transform and direct recovery pressure.** Apply one transform that changes supply while reading unchanged demand and derived values through exact typed before/after views, including alias/copy and a branch from the same source. | High: convenient current-state semantics can obscure which snapshot is read. | Standard: before/after pinning, branch isolation, exact recovery handles, cache fingerprints, typecheck, Theseus validation. | Commit pressure laws and minimal facade corrections only. | Stop if a handle's meaning changes with ambient recency or a branch requires replay. |
| s25 | **LLM-shaped corpus and representative scale probe.** Freeze several compact valid authoring cases and invalid repairs, then exercise a 128-concrete-leaf/64-derived-node graph with 16 changes using operation counts, sharing assertions, cache counts, and compiler attribution. | High: synthetic cases can overstate usability or justify premature optimization. | Broad: corpus compile/runtime fixtures, exact diagnostic inventory, scale laws, inference, architecture, typecheck, complete test, bundle, Theseus validation. | Commit fixtures, measurements, and only evidence-required bounded fixes. | Stop if ordinary cases need low-level IDs/casts, current inference ratchets fail, or scale pressure suggests a storage redesign; do not add that redesign here. |
| s26 | **Loop closeout and mandatory API checkpoint.** Measure final surface, tests, compiler cost, scale behavior, author/LLM ergonomics, retained and rejected abstractions, and the evidence for or against public promotion and Loop 3. | High: passing mechanics do not justify interpolation or renderer integration. | Broad plus manual author packet: semantic-state suite, market parity, corpus, scale probe, `npm test`, typecheck, architecture, inference, bundle, and Theseus validation. | Commit closeout and durable execution evidence only. | Always stop at `HUMAN_CHECKPOINT`; also stop on any unresolved broad failure, unclear dependency authority, or unstable author API. |

## Contract-Level Stop Conditions

Stop the run immediately if:

- a typed leaf loses its declared value type or ordinary authoring requires
  casts, branded IDs, low-level stores, snapshots, or staged writes;
- the property facade requires runtime `Proxy`, getter observation, implicit
  assignment, filesystem code generation, ambient transaction state, or a
  global/import-ordered registry;
- schema paths, object references, payload equality, callback identity, or
  statement order replace explicit entity, version, slot, transformation, or
  dependency identity;
- a derived dependency is discovered from execution, a cycle reaches a compute
  callback, or an invalid/partial derived result escapes;
- reads or cache activity mutate a snapshot, create semantic history, or
  become necessary for exact recovery;
- exact-rational economics authority forks, depends on the experimental
  facade, or is approximated with `number` while parity is claimed;
- public exports, renderers, animation, interpolation, timeline, Article,
  Focus Deck, URL, CSS, or browser behavior become necessary;
- the TypeScript inference ratchets fail or the scale probe indicates a
  persistent-storage redesign is required; or
- any required broad verification gate fails and cannot be repaired within
  the current slice's stated ownership boundary.

## Explicit Deferrals

After this loop, separate reviewed contracts would still be required for:

1. transformation families and deterministic `at(progress)` interpolation;
2. composition of multiple object transformations into one aggregate timeline;
3. runtime reparameterization and discrete regime changes;
4. Graph2D and KaTeX projection of one reviewed supply-tax exemplar;
5. Article, navigation, URL, and author-file integration;
6. public facade promotion or compatibility migration;
7. wider economics and other domain packs;
8. first-class definitions, relations, theorems, and contextual perspectives;
9. compositional procedures, semantic macros, generated plumbing, and bounded
   LaTeX elaboration expansion; and
10. live LLM generation and repair evaluation.

## Approval Effect

Approval authorizes creation of
`run-contract.kp.typed-semantic-state-facade-derived-graph-v2` with these exact
26 slices, allowed and disallowed work, verification cadence, commit cadence,
and stop conditions. It authorizes autonomous execution until the mandatory
s26 `HUMAN_CHECKPOINT` or an earlier named stop condition. It does not approve
any deferred work.

The unstarted v1 control record was superseded before implementation because
it omitted required typed-autonomy metadata. The v2 contract preserves the
reviewed slice order and scope while adding the complete execution metadata.

## Approved V3 Inference-Recovery Addendum

The user approved this addendum on 2026-09-03 after v2 stopped at s14. V2's
completed s01-s13 history remains authoritative. V3 supersedes only the
unexecuted remainder, retains the same target and scope, and absorbs the
preserved uncommitted s14 implementation as its first rollback unit.

The inference stop is resolved through one measured post-s14 budget refresh,
not an open-ended exception. The existing attribution command must cover the
actual `derive` authoring contract and first remove any accidental broad
closure. The refreshed ceilings are deterministic:

- types: `ceil100(measured types * 1.03)`;
- instantiations: `ceil100(measured instantiations * 1.05)`.

No later ceiling increase is allowed in v3. Fixture removal, `skipLibCheck`,
casts, weakened leaf or derived types, broad barrel imports, and unexplained
compiler growth are stop conditions. The refresh and the derived-binding
operation commit together so reverting that commit restores both the feature
and its budget boundary.

The remaining visual scope is none. The estimate is 8-14 agent hours. Every
slice is one independently reversible commit, starts from bounded Theseus
context, records focused evidence, and uses standard or broad verification at
the named boundary.

### V3 Ordered Slices

| Slice | Target and intended change | Risk | Verification | Commit boundary and stop condition |
| --- | --- | --- | --- | --- |
| s01 | Recover v2 s14: finish typed `derive`, successor evolution, exact change records, adapter projection, attribution, and the single budget refresh. | High | Broad plus derived-operation runtime/type laws and inference attribution. | Commit the stopped slice and ratchet together. Stop on broad imports, weakened types, unexplained cost, or failure under the calculated ceiling. |
| s02 | Normalize typed dependency declarations into definition-local graph input. | Medium | Standard plus stable-edge and source-path laws. | Commit normalization only. Stop if execution or global registration discovers dependencies. |
| s03 | Add missing, duplicate, and self-dependency diagnostics. | High | Standard plus exact diagnostic-code and path tests. | Commit local validation only. Stop if invalid edges survive until evaluation. |
| s04 | Add cross-schema, incompatible-value, and absent-capability validation with negative type fixtures. | High | Standard plus compile-time and runtime rejection fixtures. | Commit boundary diagnostics only. Stop on casts or scope leakage. |
| s05 | Detect direct, two-node, and long cycles before compute execution. | High | Standard plus cycle tests proving zero callback calls. | Commit cycle detection only. Stop if a callback observes a cyclic graph. |
| s06 | Produce deterministic topological ordering without making declaration order semantic. | Medium | Standard plus diamond and permutation laws. | Commit ordering only. Stop if permutations change results. |
| s07 | Resolve concrete dependencies from one explicitly pinned snapshot. | High | Standard plus alias, copy, absence, and historical-read laws. | Commit concrete resolution only. Stop on ambient-current-state reads. |
| s08 | Evaluate single and nested derived dependencies without caching. | High | Standard plus exact result-type and nested-chain laws. | Commit derived resolution only. Stop if evaluation creates history or partial values escape. |
| s09 | Restrict evaluation to the requested dependency closure. | High | Standard plus diamond and independent-branch call counts. | Commit laziness mechanics only. Stop on eager whole-graph traversal. |
| s10 | Make compute failures atomic and locally diagnostic. | High | Standard plus thrown-compute and invalid-result tests. | Commit evaluator failure boundary only. Stop if a partial result or generic exception escapes. |
| s11 | Fingerprint concrete dependencies using exact entity/version authority. | High | Focused update, alias, copy, and branch laws. | Commit concrete tokens only. Stop on payload serialization, value equality, or object identity. |
| s12 | Compose nested-derived fingerprints deterministically. | High | Standard chain, diamond, and equivalent-branch laws. | Commit derived tokens only. Stop on whole-snapshot identity or order dependence. |
| s13 | Add a caller-owned disposable lazy cache outside snapshots and transactions. | High | Standard hit/miss, isolation, reset, and frozen-result laws. | Commit cache lifecycle only. Stop on global state or semantic-equality dependence. |
| s14 | Recompute only requested descendants affected by changed dependency versions. | High | Standard chain, diamond, alias-update, copy-divergence, and branch counts. | Commit selective recomputation only. Stop on commit-time evaluation or broad invalidation. |
| s15 | Localize optional absence, removed dependencies, stale definitions, compute failures, and retry behavior. | High | Standard typed-error inventory and no-failure-cache laws. | Commit failure semantics only. Stop if `undefined`, `NaN`, or stale values conceal failure. |
| s16 | Prove evaluation and caching add no semantic history or authority. | High | Broad exact-inventory and pinned-recovery comparison. | Commit the history/recovery gate. Stop if evaluation is needed to reconstruct committed state. |
| s17 | Re-author the internal supply-tax base schema and typed supply update. | High | Standard authoring metrics, exact types, and existing market tests. | Commit schema/update pressure only. Stop on economics-specific facade primitives. |
| s18 | Add explicit equilibrium, incidence, and government-revenue derivations with exact-rational parity. | High | Standard canonical-economics parity and dependency laws. | Commit the derived market proof only. Stop if formulas fork or use approximate authority. |
| s19 | Pressure pinned views, alias/copy behavior, branching, and direct recovery in one multi-object transform. | High | Standard pinned-view, branch-isolation, recovery, and fingerprint laws. | Commit pressure laws and bounded corrections. Stop if meaning depends on ambient recency or replay. |
| s20 | Freeze a compact LLM-shaped valid/invalid authoring corpus with deterministic typed repairs. | Medium | Standard output-stability and exact-diagnostic inventory. | Commit corpus only. Stop if ordinary cases require IDs, stores, casts, or generic staging. |
| s21 | Run the 128-concrete/64-derived/16-change scale probe and final compiler attribution. | High | Broad operation-count, sharing, cache, inference, and bundle gates. | Commit measurements and bounded fixes. Stop if another ratchet increase or storage redesign is indicated. |
| s22 | Produce the closeout, retained/rejected abstraction record, and Loop 3 recommendation. | High | Broad plus manual API packet. | Commit closeout evidence, then always stop at `HUMAN_CHECKPOINT`. |

### V3 Preserved Boundary And Deferrals

Semantic state remains authoritative under `src/semantic-state/`; existing
semantic projection remains one-way; exact-rational economics remains
canonical. V3 does not authorize a public facade, compatibility migration,
Proxy observation, global registry, ambient transaction state, filesystem code
generation, storage redesign, interpolation, timeline, runtime
reparameterization, renderer, animation, Article, Focus Deck, URL, browser,
catalogue, broad economics, knowledge/procedure, CAS, or live-LLM work.
