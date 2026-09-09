# R4A: supported authoring entrypoint convergence

Date: 2026-09-08
Status: APPROVED — user accepted with “approve”; Theseus owns execution
Contract: `run-contract.kp.authoring-entrypoint-convergence-v1`
Target: `next-action.kp.authoring-entrypoint-convergence`

## Outcome and why now

Make supported KP authoring easier to enter, check, repair and hand off to the
existing preview/publication owners. A human or LLM should not need to discover
which experiment-specific command, response shape or trusted source binder is
required for a supported task. This is an authoring workflow integration run,
not an animation redesign or a universal semantic schema.

R1–R3 are complete; preserve their results. The roadmap names bounded R4 planning
next. This proposal delivers the local convergence portion, R4A. Actual external
model evaluation and broader public promotion remain separately bounded work;
do not describe R4A completion as completion of every R4 horizon obligation.

Direct source evidence:

- `scripts/author-reasoning.ts` exposes equation/code checking and examples.
- `scripts/author-bayesian-reasoning.ts` exposes a separate checker/result shape.
- `docs/project/authoring/authoring-round-trip-packet.md` documents a pinned
  equation CLI example alongside a browser path with supported numeric edits.
- `scripts/cross-domain-gallery-generation-router.ts` already owns exact
  frontend selection, capability pins and result-authority validation. Reuse
  it where applicable; do not build a competing generation router.
- `scripts/gallery-graph-3d-saddle-parameter-frontend.ts` supports a pinned
  fixed-camera four-to-eight denominator change, not arbitrary Graph3D edits.
- The R3 closeout records passing release evidence but only 222 types of
  inference headroom. Measure new consumer costs at the start.

Planning inspection found no active contract. `theseus plan refill --limit 5`
failed its existing output budget (810 tokens versus 800); no budget was raised
and no candidate was materialized. The generic workflow capsule still mentions
R1. Reconcile that stale summary when this new run is approved; do not restart R1.

## Concrete author tasks

1. Retain an authored urn variant: change the prior to 1/3, keep likelihoods
   1/4 and 3/4, and select the existing key-steps reading. Exact posterior is
   1/7. Check, preview all seven stops, export the applied source and verify a
   local static edition without renderer code. This is a useful content artifact,
   not a substitute for a live-model benchmark.
2. Revise the already supported numeric logarithm change-of-base request through
   both CLI and browser. Equivalent input must bind the same verified domain
   source and produce matching endpoints/revisions under the existing policy.
   The compiler, not matching LaTeX strings, supplies operation authority.
3. Pressure routing with the existing code reasoning caller and pinned Graph3D
   saddle request. Preserve their narrower capability and publication boundaries.
   Keep supply-tax/Graph2D as preservation and capability-report pressure.

The proposed read-only command is `npm run author:check`, with explicit task
selection and example/check modes. Final names are fixed in the first slice.
Existing commands remain compatibility entrypoints that delegate where migrated.
Browser Apply remains explicit; no file watcher, HTTP write API or automatic
publication is introduced. A preview handoff is not a claim that a source has
already been applied, and a compiled artifact is not a published edition.

## Architectural boundary

Unify task discovery, invocation and reporting only as far as demonstrated.
Keep probability, equation, code and Graph3D source schemas, trusted binders,
diagnostics, evidence and renderers domain-owned. Reuse existing request/result
contracts where they fit; retain narrow adapters where they do not. Do not force
probability or code into equation semantics to obtain a common interface.

Prefer closed discriminated results and validated constructors. Represent
unsupported preview/publication as explicit capabilities or typed gaps, not
optional fields that imply success. Preserve diagnostic paths and domain codes.
Input never supplies proof, geometry, timing or renderer authority. Keep trusted
TypeScript construction distinct from untrusted JSON/LaTeX/model text; do not
evaluate user TypeScript. Share compilation within a domain, not mathematical
truth between domains.

## Ordered slices

Each row is one independently reversible commit containing implementation and
Theseus evidence. F = focused deterministic checks; S = F plus project typecheck
and Theseus validation; B = S plus affected architecture/inference, integration
and production checks; V = scoped browser/runtime preservation. Every row also
inherits the global stops below. Exact existing owner paths are pinned in s01.

| # | Target and change / commit boundary | Risk | Verification | Additional stop |
| --- | --- | --- | --- | --- |
| 01 | Pin the two author tasks, owner/host/capability map, output baselines and command names; reconcile stale workflow summary | Low | F: exact arithmetic, source/host refs, clean baseline | Conflicting current authority |
| 02 | Register real consumer cost fixtures and measure import/inference costs before designing shared exports | Medium | S: unchanged fixtures/ceilings; negative type cases | Cannot fit without broader redesign or budget waiver |
| 03 | Derive the bounded task/capability inventory from existing owners; distinguish check, preview, extraction and publication | Medium | S: coverage matches executed capabilities; unknown task negatives | New universal capability ontology required |
| 04 | Define the smallest reporting adapter over existing results; preserve domain diagnostics and source authority | Medium | S: exhaustive success/gap cases, no forged prepared/publication states | Loss of domain information or new truth owner |
| 05 | Add explicit read-only example/check dispatch with exact task selection and lazy owner loading | Medium | B: invalid selection, missing source, size limits, import isolation | Dynamic plugin loading or user-code execution needed |
| 06 | Route Bayes through its existing checker; preserve both input forms, zero-condition gaps and revision pins | Medium | S: old/new invocation equivalence and complete failure payloads | Probability grammar expansion |
| 07 | Expose the existing numeric equation draft compilation through the same domain-owned boundary used by the browser | High | B: numeric domain restrictions, exact endpoints, forged source rejection | New algebra or motif required |
| 08 | Make the selected equation CLI path use that boundary; retain the explicitly pinned legacy example contract | Medium | S: reference and numeric variants, narration, typed repairs | Silent change to legacy command meaning |
| 09 | Align existing browser preparation with the shared domain boundary without changing Apply or playback ownership | High | B + V: last-valid, stale preparation, atomic count/text/ink, reverse and interruption | New host state machine or choreography needed |
| 10 | Run the two primary author workflows end to end and produce a compact comparison packet | Medium | V: real CLI-to-existing-editor-to-local-edition exercise | Material new visual/editorial decision needs human review before propagation |
| 11 | Route existing reusable equation reasoning through its owner; preserve assumptions, extraction and exact return | Medium | S + V: source/revision/prompt parity and return address | General knowledge ontology required |
| 12 | Pressure the reporting/dispatch seam with existing code reasoning without claiming arbitrary-source generation | High | B: language authority, unsupported transformations, accepted control behavior | New language/refactor topology or false publication parity |
| 13 | Pressure with the pinned Graph3D saddle frontend through the existing gallery router | High | B + V: trace, camera/topology pins, actual host; reject unrepresented edits | New Graph3D content or equation-shaped semantics needed |
| 14 | Check supply-tax/Graph2D capability reporting and preserve its current source/publication path | Medium | B: parameter/fact coherence and existing production route | Economics migration beyond reporting/preservation |
| 15 | Finalize per-task preview and projection capability reports from these actual callers | Medium | S: a route link cannot prove an applied revision; no implied feature parity | Requires a new universal host/publication interface |
| 16 | Verify exact source handoff to existing local edition builders; expose only currently supported publication paths | High | B: stale draft, immutable bytes, no-JS output and unsupported-domain gaps | Browser writes, remote storage or public deployment required |
| 17 | Add held-out valid/invalid task cases and request-fulfillment checks separate from compilation success | Medium | S: untouched starter fails changed-task intent; editorial truth qualified | Requires free-prose automatic grading |
| 18 | Harden untrusted invocation boundaries and cross-domain spoofing cases | High | B: size/path/read errors, wrong domain/pins, forged result/source, zero fallback | New execution authority or package loader required |
| 19 | Prove narrow frontend entrypoints with two structurally different consumers; retain only measured common plumbing | High | B: type/import cost, public-export compatibility, domain evidence retained | Speculative abstraction or fixed-gate failure cannot be repaired in scope |
| 20 | Retire duplicated mechanics beside migrated callers; preserve legacy command behavior with delegation | Medium | B: old/new result parity, no duplicate authority, source graph checks | Unrelated compatibility migration |
| 21 | Update the canonical generation routing guide and executable task packet with accepted/rejected examples | Low | F: every example executes; supported-input distinctions remain explicit | Packet advertises unsupported generation or model success |
| 22 | Execute the retained author tasks and record source bytes, files touched, repair steps and specialist interventions | Medium | S + V: actual authored outputs, coherent preview/edition, no invented timing | Subjective new output needs approval; no live call implied |
| 23 | Run broad release and supported-browser preservation; repair attributable failures at their owners | High | B + V: full tests/build, fixed budgets, R1/R2/R3/tax and selected code/Graph3D checks | Unrelated repairs, unsafe authority or new visual treatment |
| 24 | Record measured benefit, remaining R4 obligations and mathematical-expansion handoff; close receipts and commit | Low | F: exact evidence, validated Theseus, clean scoped worktree | Required proof or approved work incomplete |

## Review and execution policy

One approval activates these 24 slices; no routine phase approvals thereafter.
Expect a many-hour run, possibly multiple sessions. No new visual treatment is
planned, so unchanged animations do not receive ceremonial reapproval. If the
s10 comparison exposes a material new visual/editorial choice, stop with one
working shared-server URL and a concrete comparison before propagating it.
Use the same rule for genuinely new findings later, not every numeric variant.

Canonical preservation targets are the accepted Bayes Focus Card (exact joint
model; SVG plus native KaTeX), the authoring-market equation card (verified
numeric change of base; native KaTeX), reusable equation/code hosts (their own
evidence and renderers), canonical supply-tax, and the existing pinned Graph3D
Catalogue host (scene trace and its existing surface adapter). Record artifact,
host, renderer and semantic source pins before touching any visible caller.
Do not infer canonical host identity from an asset ID.

One slice is the rollback unit. Presentation repairs must preserve semantic
source/contracts. Check an exemplar before propagation; promotion requires two
different callers, unchanged semantic/output evidence, declared capability
limits, fixed costs, and retirement of adjacent duplicated authority. This run
permits a narrow internal frontend seam, not blanket public API promotion.

Use brief tracked Theseus receipts and one human proposal, with execution state
only in the run contract. No subagents. Keep the existing port-8000 server;
adapt browser checks to it rather than resurrecting the legacy gallery server.
Do not merge or clean up the existing branch without separate authority.

## Verification and hard stops

At the start inspect `npm run verify:impact -- --path <changed-path>`. Add stable
scope-specific test commands only where existing commands cannot cover the new
seam. Proposed `test:authoring-entrypoints` and `visual:authoring-entrypoints`
must be repo-owned entrypoints, not disposable script names. Existing gates
include `test:bayesian-reasoning`, `test:reusable-reasoning`,
`test:authoring-round-trip`, `test:cross-domain-gallery`, `check:architecture`,
`check:inference`, `check:reader-budgets`, `check:reader-production`,
`check:dev-review-production`, `npm test`, `npm run build`, and
`theseus workspace validate`. Use scoped Chromium checks during development;
run the supported-browser cohort at the affected promotion/release boundary.
These commands are planned checks, not results from this planning turn.

Continue repairing attributable nonvisual failures inside scope. Stop for
missing approval, user pause, new visual judgment, loss of semantic authority,
unavailable required evidence, unsafe action or substantive scope expansion.
No budget increases, omitted real fixtures, weakened assertions, trusted casts
in place of validation, generic motion fallbacks or new renderer frameworks.
Bounded internal type/import cuts are permitted only when measurements show
they restore the unchanged gate without changing validation or public behavior.

## Explicit deferrals and done condition

No external model calls are authorized by this proposal. Preserve the accepted
R3 live-trial deferral: a future real-task trial needs explicit payload and
destination approval. R4A can prepare its local packet and deterministic task
assessment but cannot claim model-assisted success or a completed live benchmark.

Also defer arbitrary LaTeX/proof generation, new math families/motifs, universal
schemas/CAS, general code or Graph3D generation, editor redesign, SvelteKit
migration, accounts/SRS, public delivery, media export, remote writes, Theseus
package work, blanket promotion, catalogue migration and the tabled matrix asset.

Done means the primary author tasks work through discoverable consistent
entrypoints, domain authority and canonical rendering remain intact, supported
source-to-edition handoff is coherent, cross-domain limitations are executable,
duplicated migrated mechanics are removed, and fixed release gates pass. Report
measured author effort honestly; line counts are not human or LLM productivity.
Live author evaluation, learner comprehension, physical Safari certification and
broader public promotion remain named evidence gaps, not inferred successes.

Approval is recorded above; do not request routine scope approval again.
Fresh-session inspection starts with the roadmap, this proposal and
`theseus plan run`, then the current tracked slice rather than this static table.
