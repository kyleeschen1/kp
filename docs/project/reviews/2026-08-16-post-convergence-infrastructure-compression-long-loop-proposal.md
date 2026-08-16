# Post-Convergence Infrastructure Compression Long-Loop Proposal

Date: 2026-08-16  
Status: proposed; requires explicit approval before execution  
Prospective target: `next-action.kp.post-convergence-infrastructure-compression-v0`

## Why This Loop Is Current

The equation narrow-core refactor has established the important direction:
open typed declarations feed validated, generated, closed execution. The next
useful move is not another animation family or another product layout. It is to
prove that the new architecture is cheaper to extend, remove only redundancy
that can now be proved unreachable, finish the remaining extensibility seams,
and reduce the compiler and verification cost paid by every later iteration.

The durable control plane has not yet caught up with the completed refactor.
`docs/project/roadmap.md` and the architecture-convergence thread still describe
the overnight equation run as proposed or active, while `theseus plan run`
reports an empty queue and an older gold-equation-reader frontier. This loop
therefore starts by reconciling project truth before mutating production code.

The six goals are:

1. reconcile the roadmap, threads, generated inventories, and Theseus control
   plane around the completed convergence work;
2. pressure the governed equation authoring path with three contrasting,
   LLM-shaped requests and measure repair burden and time to reviewable proof;
3. audit reachability and retire only adjacent, demonstrably redundant
   compatibility, manifest, fixture, and test authority;
4. replace the remaining closed selected-capability loader chain with typed,
   immutable declarations while retaining literal dynamic imports and chunking;
5. decompose the two highest-churn equation modules along proven ownership
   boundaries rather than arbitrary line-count targets; and
6. provide one narrow authoring entrance, attribute TypeScript inference cost,
   simplify verification commands, and reset budgets only from evidence.

This is an architecture-only loop. The generation pressure uses semantic and
runtime proofs, not subjective visual tuning. Any unexplained rendered change
fires a human checkpoint rather than being approved implicitly.

## Baseline And the “50k Types” Question

`npm run check:inference` currently reports:

```text
Types:          57,283
Instantiations: 79,220
Check time:     2.79s
```

The `Types` value from TypeScript's `--extendedDiagnostics` is **not** a count
of handwritten aliases, interfaces, classes, or unique KP domain concepts. It
is the number of compiler-internal type objects created for this compilation.
It includes standard-library types, literals, inferred anonymous structural
types, unions and intersections, mapped and conditional results, and generic
specializations made reachable through imports. `Instantiations` separately
counts generic-instantiation work. The numbers are related, and generic or
structural composition can expand the compiler workset combinatorially, but
`57,283` is not a claim that the repository defines 57,283 meaningful types.

The inference project contains only 21 fixture files and 1,160 fixture lines,
but those fixtures import a large public type closure. The repository's 50,000
ceiling is a locally chosen cost budget, not a TypeScript limit. It was useful
as a ratchet when the measured baseline was below it; it is now red and cannot
distinguish a broad-import regression from legitimate accumulated coverage.
This loop will attribute cost by entrypoint and import closure, reduce
unnecessary closure or generic expansion where possible, then preserve or
rebase the ceiling with explicit evidence and headroom. It will not weaken
types, enable broad `skipLibCheck`, or simply raise the number to make the gate
green.

Other current pressure points:

- `src/editor/equation-surface-adapter.ts`: 4,233 lines;
- `src/animation/symbolic-manipulation-family-registry.ts`: 5,236 lines;
- `src/editor/selected-surface-capability-host.ts`: a 208-line literal-import
  loader with a handwritten capability conditional chain;
- `package.json`: 321 lines and more than 200 named verification-related
  commands; and
- unrelated user work is already present in the economics lesson, its generated
  publication, and several untracked documents. Those paths are protected.

## Allowed Work

- project-control documentation and generated project counts;
- reproducible architecture, reachability, inference, and iteration-economics
  measurements;
- typed equation-authoring requests, repair diagnostics, and one narrow compile
  facade over the existing compiler;
- immutable family, capability, and loader declarations with generated or
  exhaustively validated projections;
- behavior-preserving ownership extraction from the two named high-churn
  modules;
- adjacent removal of a compatibility path, projection, fixture, test, or
  script only after its final live caller and stronger invariant owner are
  proved; and
- small command-surface improvements that retain compatibility aliases while
  establishing discoverable inner, boundary, and release gates.

## Disallowed Work

- visual timing, geometry, choreography, salience, layout, typography, or
  animation-content redesign;
- promotion of the pending log-product visual candidate or any new motif;
- edits to the protected economics source/publication or unrelated untracked
  documents;
- a live LLM runtime, arbitrary model-authored code, or a claim of measured
  cross-model generation quality;
- a universal plugin system, universal domain compiler, scene graph, new clock,
  new renderer authority, or mutable global registry;
- broad Graph3D, Canvas, WebGL, public-site, curriculum, SRS, editor, or
  educator-product work;
- package installation, directory-wide namespace moves, formatting churn,
  blanket test deletion, or compatibility removal without exact reachability;
  and
- consolidating context-specific HTML escaping helpers without a separate
  output-context and security audit.

## Preservation Boundary

- semantic object identity, correspondence, lineage, operations, and typed
  repair behavior;
- the one deterministic clock, native settled endpoints, direct seek, rewind,
  interruption, reduced motion, and accessibility truth;
- lazy literal imports, existing production chunks, route identities, review
  capture, and catalogue selection behavior;
- current approved equation, graph, program, and publication callers;
- current public API compatibility unless a caller-complete retirement is
  proved; and
- all pre-existing dirty worktree paths.

## Ordered Slices

Every slice is one independently reversible commit. `Focused` means exact
unit, type-fixture, or generated-closure checks. `Standard` adds project
typecheck, architecture checks, and Theseus validation. `Broad` adds the
affected production build, bundle, browser, or integration boundary.

| # | Target and intended change | Risk | Verification and expected checks | Commit boundary and local stop condition |
| ---: | --- | --- | --- | --- |
| 1 | **Control-plane truth.** Record the completed narrow-core refactor, replace stale active/proposed language in the roadmap and architecture thread, and name this proposal as the sole candidate lane without creating an execution contract yet. | Low | Focused documentation-link and generated-count checks; `theseus workspace validate`. | One docs/control-plane commit. Stop if current Theseus state conflicts with the completed commit history in a way that needs a user priority decision. |
| 2 | **Derived inventory truth.** Regenerate or verify catalogue, equation-surface, capability, compatibility, and disposition counts from their canonical declarations; remove stale prose totals rather than hand-editing competing numbers. | Low | Focused generation freshness and exact-set tests. | One inventory/docs commit. Stop if two live sources both claim canonical ownership. |
| 3 | **Deferred-work register.** Put every out-of-scope item from this proposal into the architecture thread with an owner, trigger, and reason for deferral; do not populate the executable queue with them. | Low | Focused link and vocabulary review; Theseus validation. | One durable-record commit. Stop if a deferred item is already required by an active production consumer. |
| 4 | **Measured post-refactor baseline.** Capture equation iteration economics, affected bundle closures, focused/standard/release durations, large-module ownership, compatibility denominator, and current verification-command surface. | Low | `npm run measure:equation-iteration-economics`, bundle-boundary checks, timing report with reproducible commands. | One measurement/report commit. Stop on unexplained bundle or generated-source drift before establishing a baseline. |
| 5 | **Inference attribution harness.** Measure each inference fixture and public import closure separately, including direct module imports versus broad barrels; report `Types`, `Instantiations`, check time, and reachable roots. | Medium | Focused harness tests plus `npm run check:inference`; repeatability within structural counts. | One tooling/report commit. Stop if measurement requires compiler patches or nondeterministic wall-clock thresholds. |
| 6 | **Verification tiers.** Establish or finish stable equation inner, boundary, and release commands through the existing impact selector, keeping broad release checks out of ordinary authoring. | Medium | Selector contract tests, dry-run command manifests, project reliability checks. | One verification-routing commit. Stop if a lower tier can omit semantic truth, type safety, deterministic endpoints, or generated freshness. |
| 7 | **Generation pressure contract.** Specify three LLM-shaped requests—canonical function wrap, cancellation, and distribution/factoring—with fixed allowed vocabulary, success criteria, repair accounting, and no geometry/timing fields. | Low | Focused schema and malformed-request tests. | One fixture-contract commit. Stop if the fixtures require a new semantic operation or visual motif. |
| 8 | **Function-wrap first-pass trial.** Author the request using only the governed catalogue, validate it, compile it through the current authority, and record first-pass validity, repairs, files touched, and time to deterministic proof. | Medium | Focused catalogue, validator, compiler, endpoint, direct-seek, and no-fallback checks. | One evidence/fixture commit. Stop on any rendered behavior change or hidden direct compiler bypass. |
| 9 | **Cancellation first-pass trial.** Repeat the same bounded trial for cancellation, including opposite-side role binding and annihilation semantics without presentation authorship. | Medium | Focused typed-repair, cancellation law, compiler, endpoint, and seek/rewind checks. | One evidence/fixture commit. Same visual/bypass stop as slice 8. |
| 10 | **Distribution/factoring first-pass trial.** Repeat for a one-to-many/many-to-one operation to pressure cardinality and correspondence without adding choreography. | Medium | Focused distribution/factoring laws, correspondence closure, compiler, endpoints, and deterministic sampling. | One evidence/fixture commit. Stop if the governed contract cannot express the operation without caller-authored geometry. |
| 11 | **Generation-gap synthesis.** Compare the three trials; classify failures as missing declaration, ambiguous role, catalogue omission, typed repair gap, or implementation bug, and authorize only complexity-negative repairs already inside scope. | Medium | Exact before/after fixture comparison and architecture checks. | One diagnosis/minimal-repair commit. Stop and defer if a new motif, semantic family, or subjective policy is required. |
| 12 | **Narrow `compileEquationIntent` facade.** Add one direct-import authoring function returning either an accepted governed plan or a typed repair result over the existing compiler; do not introduce a second compiler or export through the broad root barrel. | High | Focused positive/negative type fixtures, deterministic compilation, authority-firewall, and no-fallback tests; standard typecheck. | One API commit. Stop if the facade owns timing, geometry, rendering, or duplicate semantic truth. |
| 13 | **Tool-neutral request adapter.** Add a small JSON/TypeScript request adapter and stable repository command so Codex, other editors, and future LLM tooling can invoke the facade without loading the catalogue application. | Medium | Focused CLI/request fixtures, stable diagnostics, exit codes, and production-closure check. | One adapter/command commit. Stop if this pulls editor/Svelte/browser modules into the authoring closure. |
| 14 | **Generation boundary proof.** Run all three requests through the direct entrypoint, compare repair count and time to the baseline, and lock the public import and bundle boundary. | Medium | Standard generation fixture suite, inference attribution, architecture, production-closure, and bundle checks. | One proof/report commit. Stop if success depends on a broad barrel, app runtime, or live model. |
| 15 | **Exact reachability graph.** Build a generated caller graph for equation compilers, generic paint/fallback paths, manifests, capability loaders, compatibility entries, and public projections. | Medium | Focused graph closure, unknown-node, exact-root, and generated-freshness tests. | One architecture-evidence commit. Stop if dynamic reachability cannot be proved; classify it retained rather than guessing. |
| 16 | **Generic equation fallback audit.** Classify every whole-equation/generic-paint path as live canonical, live compatibility, diagnostic-only, or unreachable, with its last caller and replacement owner. | Medium | Focused authority graph, production-route, and runtime-selection checks. | One audit commit. Stop before deletion when any route or fixture still owns unique behavior. |
| 17 | **Manifest/projection authority audit.** Identify duplicate hand-maintained membership, count, capability, disposition, and catalogue projections; select one declaration owner for each fact. | Medium | Exact-set equality and generated-closure checks. | One audit or zero-behavior projection commit. Stop if merging authorities would couple domain semantics to application layout. |
| 18 | **Fixture/test authority audit.** Map generated fixtures and source-shape/count tests to the invariant they claim; nominate replacements only where a stronger public protocol, exact set, runtime law, or bundle check already exists. | Medium | Focused historical-regression comparison and test-owner inventory. | One audit commit. Stop if a test's historical failure has no replacement owner. |
| 19 | **Adjacent retirement A.** Remove the highest-confidence unreachable compatibility or generic-fallback path together with its final declaration, projection, and superseded tests. | High | Broad affected semantic/runtime/browser/bundle checks plus full reachability regeneration. | One deletion commit with exact rollback. Stop if any live consumer, endpoint, or chunk changes unexpectedly. |
| 20 | **Adjacent retirement B or explicit deferral.** Retire one second independently proved redundancy; if no second safe candidate exists, record that finding rather than manufacture pruning work. | High | Same broad checks as slice 19, or focused durable deferral evidence. | One deletion or evidence-only commit. Stop on weak reachability evidence. |
| 21 | **Capability loader declarations.** Define a narrow immutable declaration type whose entries retain literal dynamic-import factories, adapter IDs, and registration policy; validate exhaustiveness and uniqueness without a universal registry. | High | Focused type laws, duplicate/unknown capability diagnostics, and literal-import source generation tests; standard typecheck. | One declaration/protocol commit. Stop if imports become computed strings or all capabilities become eagerly reachable. |
| 22 | **Equation capability migration.** Move equation/log/fraction/operation capability cases from the handwritten conditional chain to the declarations while preserving exact registration and retry behavior. | High | Broad selected-capability, concurrent-load, retry, lazy-chunk, catalogue, and equation browser checks. | One equation-loader commit. Stop on chunk merging, duplicate registration, or selection drift. |
| 23 | **Cross-domain capability migration.** Move graph SVG, economics graph, Graph3D, programming, and place-value cases to explicitly composed domain declarations without importing equation recipes. | High | Broad cross-domain host, graph/code/3D selection, lazy-loading, bundle attribution, and lifecycle checks. | One cross-domain loader commit. Stop if a universal semantic compiler or eager domain closure appears. |
| 24 | **Closed loader retirement.** Delete the old `loadCapability` conditional chain after generated/exhaustive declaration coverage proves every selected capability has one literal loader and registration owner. | High | Broad architecture, exact capability-set, production build, bundle, browser, and unknown-capability failure checks. | One retirement commit. Stop if any compatibility alias lacks a declared disposition. |
| 25 | **Equation adapter ownership map.** Produce an import/dependency and responsibility map for the 4,233-line adapter; identify semantic projection, planning, measurement, sampling, paint, and compatibility boundaries with measurable inputs/outputs. | Low | Focused static graph and cycle checks; no production behavior change. | One architecture-evidence commit. Stop if the proposed seams would split tightly coupled state merely to reduce line count. |
| 26 | **Equation adapter extraction A.** Extract the strongest independently testable non-paint owner selected by slice 25, preserve public imports through a compatibility facade, and remove duplicate local helpers. | High | Standard focused laws, typecheck, architecture, native endpoints, sampled-frame equality, and direct seek/rewind. | One extraction commit. Stop on frame, semantic ID, endpoint, or public import drift. |
| 27 | **Equation adapter extraction B.** Extract one additional ownership boundary only if slice 26 reduced churn/import closure without creating circular dependencies; otherwise record why the monolith remains partly intentional. | High | Standard plus affected renderer/browser check; before/after dependency and inference measurement. | One extraction or evidence-only commit. Stop if the first extraction failed to improve ownership or cost. |
| 28 | **Symbolic family registry decomposition.** Split the 5,236-line registry into domain/pack declaration modules and one generated or validated index; preserve exact catalogue metadata, family IDs, lazy loading, and tree-shaking. | High | Broad exact family-set, metadata generation, resolver, pack, bundle, and catalogue browser checks. | One declaration-sharding commit, or two commits only if generation and migration are independently complete. Stop on metadata, order, chunk, or family-resolution drift. |
| 29 | **Inference and command-surface closeout.** Apply only attribution-proven type/import simplifications, set a justified inference budget with recorded headroom, and organize package commands around discoverable inner/boundary/release entrypoints while retaining needed aliases. | High | `npm run check:inference`, type fixture isolation, typecheck, command-manifest tests, architecture, and impacted package-script callers. | One compiler-cost/command commit. Stop if passing requires weaker types, less fixture coverage, `skipLibCheck`, or silent alias deletion. |
| 30 | **Release closure and economics comparison.** Run the broad health, build, browser, bundle, generated-source, authoring, and Theseus gates; compare files touched, repairs, focused-check time, type workset, high-churn ownership, compatibility paths, and bundle closures to slices 4–5. Update durable truth and close the contract. | High | `npm run health:pre-expansion:release`, generation proof command, inference check, iteration economics, production build/bundle, and `theseus workspace validate`. | One closeout/evidence commit. Stop with the exact failed invariant; do not weaken a gate or claim completion with unexplained regressions. |

## Global Stop Conditions

The future run must stop with a named outcome when:

1. any slice requires human judgment of motion, visual hierarchy, timing,
   geometry, layout, or aesthetic equivalence;
2. semantic identity, lineage, native endpoints, deterministic seek/rewind,
   reduced motion, accessibility, or the single-clock law changes;
3. an initial or selected bundle closure regresses beyond its recorded budget or
   literal dynamic imports stop producing the intended chunks;
4. deletion reaches a live or ambiguously reachable caller;
5. a decomposition creates circular imports, duplicate authority, a broader
   public closure, or more ownership ambiguity than it removes;
6. inference-budget compliance would require weaker types, lower coverage, or
   a budget increase without attribution;
7. the work would touch the protected dirty files or another subsystem outside
   the allowed boundary; or
8. an approved slice becomes a new motif, product feature, renderer, semantic
   family, or universal framework rather than infrastructure compression.

## Durable Deferral Register

These are intentionally preserved for later retrieval rather than squeezed
into the 30-slice execution contract:

1. **Visual motif work:** review the pending binary log-product collision and
   function-wrap timing; pressure three-factor product/quotient aesthetics only
   after human approval.
2. **Product and layout:** public reader selection, attentional-stage work,
   educator discovery, navigation, responsive presentation, curriculum, SRS,
   learner models, and public/editor applications.
3. **Framework/application migration:** SvelteKit may own app composition and
   lifecycle later; it must not absorb framework-neutral assets, semantic
   truth, clocks, frames, authoring commands, or publication bundles.
4. **HTML output encoding:** the current inventory treats output-context
   encoders as deliberately distinct. Consolidate only after a security and
   context audit proves identical contracts.
5. **Compatibility outside exact pressure:** timeline-vocabulary bridges,
   lightweight transformation projections, selector-pair views, saddle intent,
   generated-fixture resolution, and the older public SDK
   `EquationMotionFrame` remain until a caller-complete migration owns them.
6. **Renderer/domain expansion:** Graph3D promotion, shared Canvas/WebGL
   infrastructure, another program language, and a general cross-domain
   compiler remain outside this equation-centered compression pass.
7. **Live model evaluation:** once the deterministic request contract is
   stable, run a separate multi-model evaluation for first-pass validity,
   repair count, motif selection, and semantic-role binding. The three fixtures
   in this loop measure the tool contract, not market-ready model quality.
8. **Physical reorganization:** directory moves, namespace cleanup, and a
   repository-wide package split wait until dependency direction and public
   closure evidence make the move mechanical.
9. **Broader test migration:** only tests adjacent to touched authorities may
   retire here. A global test-directory rewrite or purge needs its own measured
   proposal based on duration, flake rate, unique failures, and invariant owner.

## Done Contract

The loop is complete only when:

- project memory and Theseus agree on the active frontier and derived counts;
- the three contrasting requests compile through one governed, direct-import
  facade with deterministic typed repairs and recorded iteration economics;
- exact reachability has removed at least one real redundant path, or has
  durably proved why no safe removal is available;
- selected capabilities are added through immutable declarations and literal
  loader factories rather than a handwritten core conditional chain;
- the two large modules have clearer ownership boundaries, with extraction
  performed only where dependency and behavior evidence supports it;
- inference cost is attributable and its budget is honest, stable, and green
  without weaker type safety or reduced coverage;
- routine equation authoring has one fast truthful gate while release closure
  remains available and broad; and
- the broad release gate passes with no unexplained semantic, runtime, bundle,
  accessibility, or visual delta.

After explicit approval, Theseus should materialize the exact slice order and
boundaries above as the executable run contract. Until then this document is
the reviewed human-readable proposal and no implementation slice is approved.
