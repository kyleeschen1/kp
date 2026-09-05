# Authoring Integration To Market Preview — Long-Loop Proposal

Date: 2026-09-05
Status: APPROVED; exact 28-slice execution authorized on 2026-09-05
Approval: user replied "approve" to the explicit request to execute this scope.
Accepted direction: `../decisions/2026-09-05-authoring-integration-priority-and-sequence.md`
Active thread: `../threads/typed-semantic-authoring-framework.md`
Run ID: `run-contract.kp.authoring-integration-market-preview-v1`
Executable contract: Theseus owns live status, evidence, and stop state.

Amendment approved 2026-09-05: s13 includes the bounded economics operation-pack
and explicit before/after lifecycle prerequisite in
`2026-09-05-authoring-integration-source-authority-stop.md`. The user approved
that prerequisite and resuming s13–s28. Existing order, 28-slice limit, broad
verification, fixed budgets, preservation boundaries, and final checkpoint
remain unchanged. Register only this domain's existing per-unit-tax operation;
do not invent a universal relation or modify rendering to force a semantic fit.

Workflow amendment approved 2026-09-05: s21 uses a local-file save/build/preview
adapter for trusted typed model and Article-template inputs. Use existing dev
build tooling; preserve edited source and last valid preview on failure, tag
diagnostics by source revision, and reject stale results. No new HTTP write
authority, arbitrary browser evaluation, or replacement editor is permitted.
See `2026-09-05-authoring-integration-save-boundary-stop.md`. Remaining slice
order, verification, budgets, and final human checkpoint are unchanged.

## Outcome And Why Now

An author should be able to express the market, name its changes and
explanation, edit its inputs, and see one coherent preview through the existing
economics, compiler, clock, SVG, KaTeX, Article, and attention boundaries.
The finished review artifact is an isolated, production-shaped authoring
exemplar plus a readable source specimen, not a replacement Studio.

Loops 1–4 provide the internal foundation. The next uncertainty is how its
pieces work together at authoring scale, not whether another isolated kernel
can be implemented. An observed three-member independence counterexample must
be repaired before building on that promise. The first authoring assembly
then needs typed-math pressure and one real downstream consumer.

This is a many-hour integration run, plausibly several working sessions.
Twenty-eight commits describe bounded review/rollback units, not a schedule
guarantee. If a slice requires a new architecture decision, stop and revise
the proposal; do not use the slice count to justify scope growth.

## Scope And Dependencies

The approved scope is correctness repair, internal assembly,
bounded math/optics integration, and one market author-to-preview path.
Dependencies are strictly ordered: safe composition precedes assembly;
assembly and pinned math recovery precede lowering; one authoritative sampled
model precedes paint and prose projections; lifecycle and author-cost evidence
precede the human checkpoint.

The internal assembly should expose three responsibilities without fixing
names prematurely:

1. define concrete and derived model properties with explicit dependencies;
2. apply named domain-verified transformations and compose the explanation;
3. recover/query a pinned state and compile its supported projections.

Construction may hide schema compilation, handles, graph construction,
endpoint/resolver binding, and evaluator allocation. It may not hide semantic
assumptions, operation evidence, unsupported capabilities, branch decisions,
or cache lifetime. Do not introduce another transaction engine.

The existing governed compiler requires trusted source authority containing an
asset; the new state graph is not already that authority. Supply a bounded
domain adapter, preserving verification and canonical artifact pins.
Likewise, a scalar/value snapshot cannot serialize a callable differentiable
map: durable typed structure and local identity/version-pinned capabilities
must remain separate.

## Canonical Exemplar And Ownership

| Concern | Reference / permitted integration |
| --- | --- |
| Canonical visual host | Existing `/experiments/kinetic-figure/supply-tax/`; inspect its actual asset path, not just matching IDs |
| New host | One opt-in, independently removable authoring-market experiment; no default-route cutover |
| Semantic truth | Canonical exact-rational economics under `domains/economics/`, assembled through existing immutable aggregate state and verified operation evidence |
| Time | Existing reader clock mapped explicitly into exact logical progress; no independent animation loop or durable per-frame commits |
| Paint | Existing supply-tax SVG Graph2D and native KaTeX label/ledger owners in `src/experiments/kinetic-figure-supply-tax/` |
| Prose/order | Existing Article v1 and a bounded typed companion binding declaration; preserve source text and existing score semantics |
| Attention | Existing semantic-scene, salience-plan, reader-focus, attention-projector, and cross-view-attention seams |
| Historical recovery | Existing aggregate snapshot, logical address, and explicit branch authorities; old scene APIs remain compatibility projections |
| Final review | Authored source, diagnostics, canonical/variant previews, replay and direct-jump behavior, phone/reduced-motion captures, API cost and closure evidence |

First reproduce demand 12−Q, supply 2+Q, and final tax 4, including quantity 3,
buyer/seller prices 9/5, surpluses 9/2 each, revenue 12, and deadweight loss 4.
Only then show the explicitly distinct demand-intercept-14, tax-2 variant.
Recompute the variant's prose bindings, graph extents, labels, welfare ledger,
and static facts; never reuse hardcoded reference claims.

No new motion language is proposed. Preserve reference phases, semantic
checkpoints, focus hierarchy, paint ownership, and native endpoints. A visual
change needed to make the adapter work is a reason for an early human
checkpoint, not permission to redesign or generalize.

## Acceptance And Measurement

- The known three-member counterexample returns a typed unsupported-cohort
  gap before application; supported two-member and ordered/nested behavior
  remains valid under its stated bounded checks.
- The author-facing specimen requires no manual compile/handle/graph/
  endpoint/resolver/evaluator pipeline. Ordinary input and explanation edits
  do not require engine changes.
- Freeze the existing 205-nonblank-line composed-market setup measurement in
  `tests/semantic-state-composed-market.test.ts` before changing it. Report
  total authored setup, orchestration-only subset, shared helper implementation,
  declaration surface, and import/typecheck costs separately. Target at least
  50% reduction in the identically classified orchestration subset; do not
  achieve it by excluding relocated caller-specific glue or minifying code.
- Typed math retains static shape inference, honest existential dynamic
  dimensions, stable entity/selection identity, immutable correspondence, and
  exact historical recovery. Unsupported cardinality changes remain typed gaps.
- The same playhead and model revision produce identical model/label/prose/
  attention state after forward play, reverse, interruption, and direct seek.
  Cache eviction or disposal cannot change semantics.
- Compile failure retains the last valid preview and the author's source;
  stale asynchronous results cannot replace newer valid revisions. No arbitrary
  browser evaluation of typed source is introduced.
- Reviewed choreography and native endpoints remain intact. Static fallback
  remains meaningful; reduced motion retains the same instructional facts.
- No public facade or renderer migration is inferred from passing this run.

## Verification Tiers And Commands

Each row names a tier and concrete expected behavior. Checks are implemented
with their owning slice, not represented as already existing coverage.

- **F — focused:** named unit/type-contract checks plus `git diff --check`.
- **S — standard:** focused checks, `npm run typecheck`, and
  `theseus workspace validate`.
- **B — broad:** standard plus relevant integration suites,
  `npm run check:dependency-direction` and `npm run check:architecture`.
  Persistence/lowering/route changes also run `npm test` at their commit
  boundary. Browser-owning slices add the stable scoped runtime check.
- Final release-shaped checkpoint additionally runs `npm run check:inference`,
  `npm run build`, and the existing supply-tax preservation checks.

Existing commands include `npm run test:semantic-state`,
`npm run test:economics-supply-tax`,
`npm run test:browser:economics-supply-tax`, and
`npm run visual:economics-supply-tax-focus-deck`.
Add `npm run test:authoring-integration` in slice 1 and
`npm run visual:authoring-market` with a committed browser entrypoint in slice
14; these two commands are proposed, not available at proposal time.
Focused typed-math checks use committed named test files, including
`tests/typed-math-scene.test.ts` and Jacobian/Hessian/optics contracts.

Keep existing inference, closure, route, and architecture ceilings. Refresh an
exact source inventory only when the approved slice changes its ownership
legitimately, with before/after evidence; do not raise a numerical budget,
waive a law, or delete a negative fixture to pass. An unresolvable budget
failure is a stop condition. Theseus validation follows every durable
control-record mutation regardless of verification tier.

During visual discovery use one Chromium exemplar, sparse phase checkpoints,
and phone/reduced-motion/static smoke. Do not add a full aesthetic certification
matrix before human review. Reuse the existing canonical checks and require
executed mechanism evidence if a real native compositor mechanism changes;
such a change otherwise exceeds this preservation-only run.

## Ordered Slices

Every numbered row is one focused implementation-and-evidence commit.
The common stop rules below apply to every row in addition to its local stop.
This table defines proposal scope; after approval, live progress belongs only
to Theseus.

| # | Target and intended change | Risk | Tier and expected checks | Commit boundary | Local stop |
| --- | --- | --- | --- | --- | --- |
| 01 | Author-task fixtures and source map: freeze current model/renderer/score authority, 205-line baseline, task classification, and add the integration test command | Low: moving measurement goalposts | F: repeatable unchanged baseline; identify unsupported tasks as gaps, not passing workflows | Baseline fixtures, runner, and provenance | Cannot reproduce baseline or identify canonical host |
| 02 | Composition declaration/endpoints: add the A/B/C regression and reject independent cohorts larger than two before apply | High: overbroad certification | S: counterexample rejected; two-member, ordered, nested, and no-side-effect negatives | Bounded correctness repair and tests | Repair requires arbitrary-cohort inference or breaks retained two-member laws |
| 03 | Existing two-member independence boundaries: pressure aliases, hidden reads, dependencies, conflict detection, and honest certificate terminology | High: unsound promise survives cap | S: canonical/reverse comparison, overlap/read negatives, composition suite | Bounded evidence/diagnostic corrections | Safe retained scope cannot be specified without new read/write capability architecture |
| 04 | Internal assembly construction over current schemas/handles: define concrete and derived properties once and build the existing graph | Medium: parallel state authority | S: inference, cycle/missing-dependency diagnostics, same immutable snapshots | Model assembly plus contracts | New transaction engine, proxy tracking, or second graph authority needed |
| 05 | Assembly transformation/composition binding: infer existing handles and bind named applied families, ordered/nested groups, and bounded independent pairs | High: hidden assumptions | S: same plans/endpoints/operation provenance; preflight before apply | Named explanation assembly | Semantics disappear behind unverified generic update |
| 06 | Assembly queries and lifecycle: expose pinned recovery/evaluation with explicit cache reset/dispose ownership | Medium: stale reads or memory retention | S: history, branching, cache-isolation/eviction laws; no persistent sample growth | Recovery/evaluator assembly | Unbounded application cache required or eviction affects truth |
| 07 | Assembly diagnostics: carry declaration/source paths and typed missing, stale, foreign, invalid-operation gaps | Medium: errors become opaque | S: malformed-author fixtures and stable source-target mapping | Diagnostic surface and fixtures | Silent fallback or fabricated operation evidence required |
| 08 | Migrate the internal market specimen through assembly while retaining old characterization as comparison evidence | Medium: fake ergonomics via domain shortcut | S: identical exact market states/composition; author-cost report | Market assembly specimen and parity tests | Caller-specific glue merely moves outside measured boundary |
| 09 | Typed-math/state value bridge: register immutable typed structure separately from local version-pinned callable capabilities | High: serialization/identity confusion | B: round-trip value records, missing capability/version diagnostics, existing map behavior | Data/capability bridge and ownership checks | Serializing functions or a second semantic object store becomes necessary |
| 10 | Pinned typed-optics bridge: recover selections and apply supported immutable same-cardinality rewrites through aggregate authority | High: path mistaken for identity | S: historic selections, stable correspondence, stale/foreign handles; scene compatibility | Optics/recovery adapter | Structural rewrite needs invented correspondence or old scene becomes co-authority |
| 11 | Existing affine Jacobian and quadratic Hessian pressure: prove macro descriptors, static shapes, and honest dynamic dimensions through bridge | Medium: shape widening | S: J/H values, compile-time negatives, unsupported cardinality/capability gaps | Nonvisual math pressure fixtures | Requires new differentiation/CAS or equation renderer work |
| 12 | Assembly boundary review fixture: lock author import direction, inferred signatures, cost accounting, and capability gaps | Medium: premature facade | S plus inference/dependency gates: no renderer imports into state; fixed ceilings | Internal facade/closure contracts | Existing budget cannot be met without a new approved ceiling |
| 13 | Economics source-authority lowering: adapt verified state/model operations into the existing canonical asset/compiler entrance | High: bypassed verification | B plus economics suite: forged update rejected, exact source/operation pins, same asset semantics | Bounded domain lowering adapter | Generic state mutation would grant equivalence or animation authority |
| 14 | Isolated opt-in authoring-market host and committed scoped visual harness; leave canonical route unchanged | High: routing/host duplication | B: lazy loading, host disposal, stable visual command, baseline mount | Host entrypoint, route, and harness | Default cutover, second clock, or copied canonical paint implementation needed |
| 15 | Exact clock adapter: map existing reader time into bounded rational logical addresses with documented quantization and endpoint rules | High: discontinuity or time split | B: exact endpoints/boundaries, monotonicity, error bound, direct seek/rewind | Clock-to-address adapter | Requires wall-clock semantic state or per-frame commits |
| 16 | One sampled economics frame: project state-derived curves, clearing, incidence, and welfare without a second interpolation/evaluation authority | High: model and paint disagree | B plus economics suite: canonical numeric parity at sparse/dense semantic samples | Shared sampled-frame projection | Adapter duplicates authoritative economics calculations |
| 17 | Existing SVG integration: feed sampled curves/regions through current Graph2D paint owner | High: paint or viewport regression | B plus scoped visual smoke: canonical phase/geometry and endpoint parity | SVG input adapter only | New graph renderer or motif-specific offsets needed |
| 18 | Existing KaTeX label/ledger integration: derive exact math and accessible values from the same revision/frame | High: stale labels/native ownership | B plus scoped visual smoke: graph/label/ledger agreement, native settled paint | Label/ledger input adapter | New compositor mechanism, second label truth, or glyph-specific fix needed |
| 19 | Article/order/focus binding: map current semantic beats through a bounded companion declaration into existing score and attention seams | High: competing source lists/store | B: source refs resolve; playhead focus deterministic; canonical score parity | Companion-to-score/attention adapter | New Article grammar or global salience store required |
| 20 | Explicit typed fact/formula bindings: supply prose values and meaningful static facts from model revision without rewriting authored prose | High: mathematically stale explanation | B: tax-4 facts, invalid refs, missing capabilities, static fallback; no arbitrary Markdown JS | Fact-binding projection and tests | Needs free-prose verification or uncontrolled source replacement |
| 21 | Local edit/compile/preview lifecycle: use existing dev save/rebuild boundary, revision-tag diagnostics, and last-valid preview | High: stale or lost work | B: invalid edit preserves source/preview; out-of-order result ignored; no browser code execution | Narrow authoring revision lifecycle | Requires replacing editor/session system or expanding save authority |
| 22 | Authored parameter variation: demand 14/tax 2 and ordered demand/tax explanation, with independently recomputed narrative, baseline, and bounds | Medium: plausible but false reuse | B plus economics and scoped visual: Q=5, prices 9/7, revenue=10, total=35; same assembly no engine edit | Separately identified variation specimen | Variant needs hardcoded canonical facts or new choreography |
| 23 | Cross-view history/interrupt pressure: align state, formulas, prose and attention for reverse, branch inspection, direct jumps and cache eviction | High: history-dependent output | B: fixed-playhead equality, last-valid revision isolation, no snapshot growth | End-to-end deterministic-state tests/repairs | Restore requires replaying intermediate motion |
| 24 | Host lifecycle and local address restoration: disposal, re-entry, resize, bounded resources, and isolated deep links | High: route/resource leaks | B plus scoped runtime: repeated mounts, restored endpoints, no inactive sampling | Lifecycle/address hardening | Existing public URLs or unrelated routes must change |
| 25 | Final author-source specimen and fair ergonomics measurement: demonstrate everyday input/order/query edits with the internal surface | Medium: ceremony remains hidden | S plus inference: at least 50% orchestration reduction with helper cost disclosed; unchanged task scope | Reviewable specimen and measured report | Target missed; requires new facade semantics rather than bounded assembly |
| 26 | Prepare canonical/variant human-review captures: desktop, phone, reduced motion, static output, forward/reverse and direct jumps | High: functional pass mistaken for visual approval | B plus stable sparse visual commands; accessibility and preservation smoke | Review harness checkpoints and durable command references | Any material new treatment or legibility regression requires earlier human judgment |
| 27 | Broad checkpoint gate and regression closure across state, math, economics, host and build boundaries | High: local proof hides integration debt | B plus full test, inference, build and existing canonical browser preservation suites | Gate evidence and only in-scope regression repairs | Fixed budget/law fails or repair exceeds scope |
| 28 | Closeout with exact authored example, ownership map, measurements, gaps and review questions; stop before generalization | Low: inaccurate completion/promotion | F plus Theseus validation/status and evidence audit | Closeout docs and completed contract evidence | Missing proof: do not mark successful; otherwise mandatory HUMAN_CHECKPOINT |

## Common Stop Conditions

Stop on absent approval, unresolved semantic authority, failed preserved law,
unrepairable verification within the slice, a required budget increase,
unrelated dirty-worktree overlap, or work beyond the listed ownership boundary.
Retain the original failing evidence. Do not record a slice complete because
its time allocation ended or defer its required check silently.

The final state is `HUMAN_CHECKPOINT`, not public promotion. Ask the user to
review whether the authored source is genuinely comprehensible, model/prose/
paint agree, historical editing is explicit, and the canonical choreography
is preserved. If new subjective visual choices arise sooner, stop at that
earlier exemplar checkpoint and leave the remaining contract slices pending.

## Preservation, Rollback, And Promotion

Preserve all completed Loops 1–4 evidence except explicitly qualify and repair
the unsupported independence claim. Preserve the canonical supply-tax route,
Article v1, existing SVG/KaTeX owners, semantic clock, public API exports,
Focus Deck callers, and unrelated code/equation/Graph3D assets.

Each row's commit is the smallest rollback unit. The host and adapters must
also remain removable together without reverting the underlying state model.
Do not couple an integration rollback to deletion of accepted semantic work.

Public promotion requires human approval of this exemplar, a separately
approved structural-equation caller, demonstrated shared boundaries, and
promotion-tier verification. This proposal contains no post-approval
generalization slices: structural equation pressure is a separate next
contract, not an automatic continuation.

## Explicit Deferrals

No arbitrary independent cohorts/read-tracking architecture, structural
equation migration, generic CAS, universal semantic model or renderer,
knowledge/procedure catalogue, broad macro/code generation, live LLM benchmark,
Graph3D/code expansion, complete authoring UI, new Article grammar,
publication-platform migration, public state facade, compatibility sweep,
accounts, SRS, or new visual motif in this run.

The bounded preview includes trustworthy static facts; complete versioned
publication/editing UX is the later roadmap milestone, not claimed shipped
here. TypeScript is the first concrete authoring entrance; LaTeX and model
frontends follow evidence from the stabilized seam.

## Execution After Approval

Create the exact proposed run contract only after approval. This document
owns rationale and scope; Theseus owns slice order, status, tracked context
receipts, verification, commits, and stop state. Do not create a second
manually maintained phase-plan tree.

Use one brief target context per slice, widening only for a named missing
dependency. Mark in-progress before implementation; close context receipts,
record checks and completion, validate, and commit implementation with its
evidence after each verified slice. Emit `npm run --silent loop:status` at
slice starts, completions, commit boundaries, and before handoff.

At the approved run's start, commit any intended direction/proposal changes
before implementation if still uncommitted. Preserve unrelated user work.
After a stop, resume with `theseus work resume` from the repository root;
unapproved remaining work stays unapproved.
