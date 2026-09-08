# R3 Bayesian flagship — bounded long-loop proposal

Date: 2026-09-08
Status: APPROVED — user said “go” on 2026-09-08; first visual gate remains required
Mode: theseus-long-loop, 26 ordered slices, many hours across resumable sessions
Target: `next-action.kp.bayesian-flagship`
Execution contract: `run-contract.kp.bayesian-flagship-v2`
The unstarted v1 omitted execution metadata and was superseded without scope change.
The proposal-era descriptions below are retained rationale; Theseus owns live state.

## Outcome and why now

Make one original Bayesian explanation authorable as a coherent semantic source:
build a probability tree, collapse branches into marginals, condition on evidence,
and change branching order without changing the joint distribution. Its tree,
equations, prose, exact return, retrieval prompts and local static edition must
agree after supported edits. A second problem must reuse the implementation.

R1 and R2 are complete. The accepted successor horizon selects Bayes next;
neither completed integration nor the broader curriculum should restart.
The principal experiment is authoring leverage, not another standalone animation.
See [R2 closeout](2026-09-08-reusable-reasoning-closeout.md) and the
[reconciled horizon](2026-09-07-reconciled-authoring-loop-horizon.md).

| Candidate | Authoring value | Reliability/reuse | Speculation and continuity | Recommendation |
| --- | --- | --- | --- | --- |
| Bounded Bayes source-to-projections | High: new content and numeric edits | Pressures existing controls, evidence, revision and publication seams | New domain and new motion; accepted next milestone | Do next, with early visual gate |
| Complete all equation/code feature parity | Useful, but deepens old fixtures | High preservation value | Lower novelty; delays accepted flagship | Retain concrete gaps for R4 |
| Broad mathematical motif expansion | High eventual value | Uneven existing coverage | Too broad before another authored-domain proof | Retain M1–M6; do not activate here |

This is a proposal, not a populated Theseus queue. On inspection, `loop:status`
reported no active loop and `theseus plan run` reported an empty ready queue.
`theseus plan refill --limit 5` failed with `action-plan token count 810 exceeds
budget 800`; no budget was raised and no candidate selected. The delivery
workflow's brief objective still mentions R1, so its stale summary must be
reconciled after approval, not interpreted as authority to restart it.

## Evidence and ownership audit

- `domains/math/exact-rational.ts` already exposes normalized rational
  arithmetic through the provider protocol. Reuse it; do not introduce a second
  numerical package or import economics semantics into probability.
- Bounded searches of `domains`, `protocols`, `src` and tests did not locate an
  implemented Bayes domain owner. The R1 probability deduction fixture is a
  capability probe, not an executable probability frontend.
- `src/semantic/diagram-scene.ts` describes positioned nodes, edges, groups,
  labels and selector correspondence. It is not probability truth.
- `src/editor/diagram-svg-adapter.ts` is editor-coupled, replaces SVG markup,
  and uses generic lifecycle opacity/scale treatment. It is not an established
  tree-flipping motif. Reuse suitable primitives and correspondence contracts;
  do not import the editor player or silently accept generic fades as the lesson.
- `src/semantic/asset-diagram.ts` composes transformation explanations. Its
  `tree` is parent/reason structure, not a probability sample space.
- `src/authoring/governed-canonical-construction-compiler.ts` checks requests
  against domain-supplied animation authority. New probability operations need
  explicit lawful evidence through this seam, not the equation reasoning binder.
- `src/tutorial/focus-deck-{scaffold,keyboard,native-input,playback,beat-navigation}.ts`
  and the existing timeline playback clock own accepted interaction. Bayes
  supplies checkpoints and frames, not another gesture controller or timer.
- Existing semantic-scene, salience-plan, attention-projector, semantic-focus
  and cross-view-attention seams own attention. No parallel salience store.
- R2 demonstrates atomic source compilation, revision-pinned disclosure,
  prompt projection and immutable local publication. Some implementation is
  equation-specific: reuse responsible machinery without pretending the binder
  is domain-neutral or duplicating a second publication authority.

The [recorded McKeon reference](../decisions/2026-09-07-tax-integration-then-bayesian-flagship.md)
confirms the user's intended build/collapse/flip method. It does not contain a
permission-cleared exact visual specification of his handouts. This run creates
original content and an original reviewed treatment; it does not claim to
reproduce his precise diagram conventions or measured teaching effectiveness.

## Canonical exemplar and semantic boundary

Proposed artifact: `animation.probability.flagged-ticket-bayes`.
Proposed development host: `/experiments/bayesian-reasoning/` on the existing
`http://localhost:8000` server. **This route does not exist yet.**
Renderer: a bounded probability-tree SVG adapter with persistent semantic
owners, existing native KaTeX for notation, shared Focus Card form and one
existing sampled timeline. New tree presentation stays exemplar-local until
approval and second-caller evidence. Geometry is derived presentation data.

Use a fictional collection of 100 support tickets, sampled uniformly:

| Joint outcome | Exact count |
| --- | ---: |
| Urgent and flagged | 16 |
| Urgent and not flagged | 4 |
| Not urgent and flagged | 8 |
| Not urgent and not flagged | 72 |

The prior urgent fraction is 20/100. Among flagged tickets, 16 of 24 are urgent:
`P(urgent | flagged) = 16/24 = 2/3`. The model is a stipulated finite population,
not real ticket data or a claim about classifier performance.

One canonical immutable four-cell joint distribution owns the numbers. The
author may provide four exact masses or a bounded prior/likelihood declaration
that compiles once into those masses; these are discriminated input variants,
not simultaneous independently editable truths. Stable event and outcome IDs
are distinct from labels, tree positions, branch occurrences and revisions.

Required invariants:

- Nonnegative exact masses sum to one; malformed numbers and oversized input
  fail before arithmetic or compilation. Never silently normalize bad totals.
- Marginalization sums a named partition. Conditioning carries an explicit
  reference-population ID and requires a validated positive denominator.
- A zero-probability event is valid. Conditioning on it is undefined and returns
  a typed gap, not zero, NaN, an invented uniform split or a fabricated branch.
- Reordering changes factorization and branch occurrences, not joint outcome
  identity. Derived conditionals require the same positive-mass checks.
  A zero-mass parent may be represented as unreachable without claiming its
  outgoing conditional probabilities are known.
- No independence is inferred. Unsupported independence-based shortcuts are
  rejected; a numerical independence check, if needed, must be explicit and exact.
- Constructing/reordering a representation, deriving a quantity and conditioning
  are different operation kinds. Conditioning is not visual hiding; changing
  tree order is not reversing causation.
- Provenance and exact equation bindings derive from domain operations. Free
  prose remains editorial. Hashes pin source revisions; they are not proof.
- Use validated constructors, opaque capabilities and discriminated results
  where they exclude invalid states. External JSON, clocks and paint still need
  runtime checks and executable tests; do not promise all bugs become impossible.

## First review: small but coherent

The initial exemplar should let the reader construct the two branching levels,
see the four joint outcomes, gather flagged outcomes into their marginal,
restrict the reference population, read the conditional fraction, and refactor
the original joint distribution into the opposite branching order. Explain the
distinction between gathering, conditioning and reordering at the moment it matters.

The teaching sequence may revisit the unconditioned source before reordering;
it must not silently flip a conditional distribution and label it the original.
Keep joint outcome identities perceptually trackable, and keep the denominator
visibly tied to the selected population. Branch lines do not imply causation or
probability-scaled width unless that meaning is explicitly authored and reviewed.

Acceptance: continuous passage/stage control, animated arrow/button traversal,
exact semantic stops and immediate `n / total` feedback all agree. Reversal and
direct seek recover the same state. Plain initial content is legible without
flashes of measurement equations. Reduced motion remains explicit. Full population
context remains retrievable when the conditional population owns attention.

One bundled human gate occurs after slice 9, before reusable motif promotion or
the full authoring/publication matrix. Supply the working URL, exact number of
checkpoints, desktop/narrow captures and concrete forward/reverse inspection
instructions. Exact timing, paths, grouping and emphasis remain provisional
until then. Review arithmetic animation only through existing certified native
mechanisms; do not silently substitute a new glyph transition. If the desired
equation mechanism lacks authority, expose the gap before the checkpoint.

Approval of this proposal preauthorizes the second problem to use the same
accepted treatment, not a new aesthetic family. No repeated review of unchanged
visuals. If later integration needs a materially new presentation, batch those
changes into another visual checkpoint before promotion.

## Ordered implementation slices

Each row targets the proposed Bayes next-action. File locations below name
responsibilities, not a mandate to duplicate existing infrastructure.
Dependencies are sequential unless a row explicitly narrows them. Every row is
one independently verifiable commit including its Theseus evidence; review rows
commit their packet, not invented acceptance. The live contract alone will own
per-slice status after approval.

Verification: **F** focused deterministic checks; **S** focused plus project
typecheck and Theseus validation; **B** affected integration checks plus S, with
the broad final suite reserved for release. **V** means actual runtime evidence;
only **H** means human visual acceptance. Every row also inherits the stop rules
below. A repairable in-scope test failure is repaired before completing the row.

| # | Target and intended change / commit boundary | Risk | Verification and expected checks | Additional stop condition |
| --- | --- | --- | --- | --- |
| 01 | Freeze owner/capability and author-task baseline; pin original problem, preservation URLs and exact commands; reconcile stale delivery summary | Low | F: source/ref audit, exact fixture arithmetic, unchanged worktree baseline | Conflicting active authority or required capability outside this envelope |
| 02 | Add bounded probability source constructors and canonical immutable joint model over existing rational arithmetic | Medium | S: malformed JSON/numbers, duplicate IDs, negative/bad totals, exact normalization of representation only, immutability and negative type tests | Needs general event algebra or a second arithmetic owner |
| 03 | Add typed marginal and conditional query evidence with positive-reference-population capability | Medium | S: exact sums/ratios, complement partitions, zero masses, impossible conditioning, forged capability rejection | Undefined conditional would be represented as a number |
| 04 | Derive both binary tree orders and explicit construction/collapse/condition/reorder operations with occurrence correspondence | High | S: same four joint masses both orders, reachable branch sums, round-trip order, unchanged source identity | Branch order becomes truth or causation authority |
| 05 | Bind bounded probability evidence into existing asset/operation/governed construction seams; explicit unsupported cases | High | B: law/ref/revision/role closure, forged authority and unknown operation negatives, architecture/import checks | Requires bypassing governance or a universal operation schema |
| 06 | Bind tree labels, quantity references and native equation endpoints to the same evidence; declare actual motion capability signatures | Medium | S: every displayed value matches exact evidence; native endpoints and named existing evaluation mechanism canary | Needed new compositor mechanism exceeds bounded reuse |
| 07 | Mount minimal proposed Focus Card with static first frame and existing clock, checkpoint mapping, keyboard, buttons and gestures | High | B + V: scoped Chromium smoke for stops/count, continuous intermediate frames, reverse/interruption, no initial duplicate paint | Second clock, private input policy or accepted-card regression |
| 08 | Implement one reversible SVG tree choreography and semantic attention packet for all four operations | High | S + V: pure sampling, identity/ownership checks, direct seek, smallest contact sheet, narrow and reduced-motion smoke | Unresolved correspondence or motion requires unrelated generic fallback |
| 09 | Produce coherent exemplar review packet and runnable URL; commit checkpoint evidence | High | V + H: inspect meaning, population change, tracking, cadence, typography, tree/equation handoff and controls | Mandatory HUMAN_CHECKPOINT before slice 10 until accepted |
| 10 | Encode accepted motif regressions without globalizing provisional choices | Medium | S + V: accepted source/intermediate/target checkpoints, reverse/interrupt, accessible state and stable paint owners | Requested visual revision changes accepted treatment |
| 11 | Add bounded author draft/checker with both declared input forms, semantic edit diagnostics and unknown-operation gaps | Medium | S: valid numeric/label/order/detail edits; malformed/unsupported request repair; no generated geometry or timing authority | Arbitrary probability language or parser inference is needed |
| 12 | Apply edits atomically to prepared tree, notation, prose bindings and navigation; retain complete last-valid revision on failure | High | B + V: edit-while-playing/gesturing; stale preparation cancellation; outputs/count all update together; failed draft retention | One projection changes revision independently |
| 13 | Derive full and compact readings through existing Article/projection contracts with mandatory definitions and population context | Medium | S: reference closure and same revision/facts in both readings; context cannot be dropped by compression | Requires new universal Article grammar |
| 14 | Add one bounded parent/reason/return path and context-preserving extraction for the denominator reasoning | Medium | S + V: exact interrupted return, required population/assumption refs, stale/forged revision rejection | Probability evidence forced through equation-specific binder |
| 15 | Add validated revision-pinned URL/history restoration and disposal/bfcache behavior through existing lifecycle mechanisms | High | B + V: refresh, Back/Forward, direct jump, source change, untrusted hash, paused resume, listener cleanup | Needs remote persistence, hidden revision store or replay-to-restore |
| 16 | Derive prediction and reconstruction prompts from the same conditional query and extraction; preserve explicit answers/context | Medium | S: posterior direction, denominator explanation structure, answer/revision coherence and no answer leakage before reveal | Claims automated grading of unrestricted explanatory prose |
| 17 | Compile selected Bayes source into existing publication artifact envelope with static SVG/native math/full context | High | B: exact source/output pins, reproducible no-JS content, escaping, no interactive/editor imports, existing edition preservation | New publication authority or public delivery mutation required |
| 18 | Join applied-source download, immutable edition creation and verification; reject stale draft publication | High | B + V: edit/export/build/open/rebuild selected revision, invalid draft exports last-valid source, no overwritten prior editions | Browser gains filesystem writes or old distributed bytes are mutated |
| 19 | Add a second original binary problem primarily as source: opposite posterior direction and asymmetric joint masses | Medium | S + V: exact second answer, same operation/renderer/input paths, changed labels/order/numbers, zero new timeline implementation | New topology or aesthetic treatment required; request bounded review before it |
| 20 | Pressure conditional support boundaries with zero cells, unreachable branches, equal likelihoods, complements and bounded exact-number stress | Medium | S: property/table tests, undefined-parent omission vs typed gap, source order permutations, input size limits | Scope expands into arbitrary multi-event trees or approximate inference |
| 21 | Measure both callers and extract only duplicated mechanical plumbing demonstrated by them, within probability | Medium | B: both unchanged outputs, actual inference/import costs, source-only second-caller edits, removal of superseded local glue | Universal renderer/public API proposal needed or fixed budget cannot be met |
| 22 | Publish bounded human/LLM packet and run one actual generation-plus-repair trial through existing access | Medium | S: held-out valid/invalid cases; request fulfillment distinct from compilation; exact captured source/diagnostics; at most two model calls | No existing access or new paid/account authority needed; report missing live evidence honestly |
| 23 | Profile multi-card mounting, inactive work, source preparation and frame cost; repair owning seams within fixed budgets | High | B + V: deterministic performance harness, idle/offscreen suspension, bounded layout reads/caches, accepted R2/tax preservation | Requires budget waiver, renderer rewrite or unreviewed choreography |
| 24 | Run responsive/theme/accessibility and supported-browser integration cohort after accepted two-caller treatment | High | B + V: Chromium/Firefox/WebKit, keyboard/wheel/drag, forward/back settlement, reduced motion, light/dark, narrow, static reading | Material new visual judgment needed; physical-device behavior remains qualified |
| 25 | Run broad release gates and fix attributable failures without weakening gates | High | B: full tests/typecheck/build, architecture/inference and unchanged reader budgets, R1/R2/tax preservation, Theseus validation | Unrelated repair, unsafe operation or architectural expansion needed |
| 26 | Record costs, author-task outcomes, capability limits and R4 handoff; close receipts/target/contract and commit closeout | Low | F: evidence links/actual counts, no open receipts, clean scoped worktree and final durable progress | Any required slice or proof remains incomplete |

Suggested second source: select urn A or B with equal prior. Red likelihoods
are 1/4 and 3/4 respectively, yielding joint masses 1/8, 3/8, 3/8, 1/8 and
`P(A | red) = 1/4`. This changes the direction of evidence relative to the
flagged-ticket problem. It pressures content, conditioning roles and factorization;
it does **not** certify a new branching topology. Zero-support variants in slice
20 pressure structural reachability without claiming arbitrary tree support.

## Verification commands and cadence

Before adding checks, inspect `npm run verify:impact -- --path <changed-path>`.
Establish stable repo-owned commands in the owning implementation slice:

- Proposed `npm run test:bayesian-reasoning` for domain/source/projection laws.
- Proposed `npm run visual:bayesian-reasoning:shared` for bounded browser checks
  on port 8000, including contact-sheet captures and later browser cohorts.
- Proposed `npm run author:bayesian-reasoning` for read-only draft checking and
  complete examples, routed from the canonical generation entrypoint.
- Reuse/extend the existing publication and live-trial machinery through a
  scope-specific entrypoint; do not create scratch approval-dependent scripts.

These commands are proposed, not available or passed today. Exact command names
and arguments become recorded evidence once implemented. Existing release gates:
`npm test`, `npm run typecheck`, `npm run build`, `npm run check:architecture`,
`npm run check:inference`, `npm run check:reader-production`,
`npm run check:reader-budgets`, `npm run test:reusable-reasoning`,
`npm run visual:reusable-reasoning:shared`,
`npm run visual:canonical-tax-production`, and `theseus workspace validate`.
Select exact R1 source/publication preservation cases at the baseline slice.

Do not run the full suite per tiny slice or freeze an unapproved aesthetic into
a large visual matrix. Use minimal discovery truth checks, accepted-motif and
second-caller checks next, and the expensive release cohort last. Full production
checks preserve existing delivered routes; the new development host is not thereby
deployed. Browser automation is not physical Safari/trackpad certification.

## Autonomy, preservation, costs and stops

One consolidated approval activates the exact ordered scope. Create the proposed
target and contract through Theseus only then; attach this proposal as source.
Use brief tracked receipts per slice, working context only if needed, and no graph
dumps. No subagents. One bounded live generation/repair trial is evaluation,
not implementation delegation; use existing access without new spending authority.
Record every check and commit each completed slice with evidence. Project memory
changes on direction/conclusions, not as a duplicate progress table.

Continue through routine nonvisual decisions and repairable failures across
sessions. The expected user interruptions are scope approval now and the slice-9
visual packet. After acceptance continue automatically through approved work.
Later material visual changes or genuine authority/scope blockers remain stops.

Preserve accepted tax, distribution, evaluation, equation reasoning and code
rendering/navigation, existing domain truth, fixed inference/payload budgets,
production erasure guards and one persistent port-8000 server. Changes to shared
owners must reproduce the violated invariant and protect existing callers.

Smallest rollback unit is each commit. During discovery, the new route and local
probability SVG treatment must be independently removable without changing
semantic source or existing exemplars. Later integration commits keep adapters
separate from domain truth; never roll back the semantic architecture to undo a
visual choice. No merge, deployment or branch cleanup is authorized here.

Stop for missing visual acceptance, user pause, irreconcilable ownership evidence,
unsafe/external authority, unavailable required evidence, a fixed-budget failure
that cannot be repaired in scope, or work outside this envelope. Repair first
when possible; never treat a failed routine test as an automatic user checkpoint.
Never relax a gate, call a fixture a live-model trial, or promote a manifest as
executed renderer certification.

Explicit deferrals: arbitrary event algebras; three-plus-stage or continuous
probability; general Bayesian networks/causal inference; arbitrary LaTeX-to-proof
or CAS; a universal knowledge/diagram schema; blanket motif/API promotion;
catalogue migration; code feature-parity expansion; new Graph3D content; the
tabled matrix asset; M1–M6 curriculum waves; SRS/accounts; arbitrary browser writes;
SvelteKit migration; public rollout; media export; Theseus package/budget repairs.
These remain separate horizon obligations, not rejected directions.

The uncertain cost is tree occurrence/paint continuity, coherent source replacement,
and fitting existing publication/governance seams without domain leakage. Expect
many hours, potentially multiple sessions plus visual review; 26 commits is an
execution envelope, not a time guarantee. Measure added shared/domain/caller glue,
source-only variants, author interventions, model outcomes and runtime cost. Do
not infer lower authoring cost from line count alone.

## Done and handoff

Completion means the approved exemplar plus second source pass the declared
semantic, authoring, retrieval, publication, interaction and release checks;
the live trial has honest captured evidence; unsupported cases remain typed gaps;
all required visual decisions are accepted; and Theseus has no open work from
this contract. It does not mean generalized probability support or proven learning
outcomes. Predicting posterior direction, explaining the denominator and transfer
to another problem become ready comprehension probes, not claimed results.

Next planning boundary is R4 frontend convergence/earned promotion informed by
measured R3 costs, with equation/code/Graph3D obligations retained. Do not activate
R4 automatically.

Scope approval is recorded above. The next human gate is the slice-9 exemplar,
not another scope or routine technical approval. For a later model handoff,
start with `$theseus-project` and `theseus work resume`, then follow actual
contract state rather than this proposal's static slice list.
