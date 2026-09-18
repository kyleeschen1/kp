# Infrastructure, repertoire and queue audit

Date: 2026-09-17. Status: audit complete; proposed implementation unapproved.

## User direction and scope

The user currently has no available readers or teaching collaborators and wants
to invest in infrastructure. Public tutorials and reader recruitment are not
prerequisites for the next engineering work. Preserve the accepted interfaces.
The preceding scope concern is material: KP checks supported semantic moves to
protect presentation meaning; this is not a mandate to build a general algebra
solver, simplifier or theorem prover. Further arithmetic variants need a concrete
reuse or instructional reason.

This is a source-based integration audit, not a complete security, performance,
type-soundness or compositor certification. No product code, coverage claims or
Theseus execution statuses changed. Older plans were inspected as provenance,
not reactivated. Canonical direction remains the relational reader.

## Dashboard snapshot

The [dashboard](http://localhost:8000/experiments/repertoire/) responds HTTP 200.
Markdown remains its sole inventory source; no second dashboard is proposed.
Counts below were read directly from the checkbox and Audit lines on this date.
They combine semantic moves and motifs; they are not curriculum completion rates.

| Discipline | Checked | Total |
| --- | ---: | ---: |
| Algebra | 42 | 196 |
| Calculus | 10 | 84 |
| Linear algebra | 4 | 48 |
| Probability/statistics | 7 | 53 |
| Differential equations | 0 | 30 |
| Optimization | 0 | 23 |
| Numerical methods | 0 | 27 |
| Mechanics | 7 | 88 |
| Programming | 12 | 98 |
| Economics | 9 | 89 |
| Shared reading | 5 | 11 |
| Total | 96 | 747 |

The 651 unchecked rows comprise 16 partial, 2 evidenced gaps and 633 unaudited
entries. An unchecked row is not evidence that no implementation exists. A checked
row is bounded demonstrated coverage, not arbitrary authorability.

Confirmed stale claim: `reading.middle` in [shared reading](../repertoire/shared.md)
still describes nonterminal/scalar transfer as the next experiment. The
[completed chain-first delivery](2026-09-17-chain-first-authoring-closeout.md)
records that transfer. Review its exact scope and update the existing row in a
reconciliation slice; do not use this discovery to promote all reading mechanisms.
The September 16 algebra audit's 94-check snapshot and pending subtraction are
historical evidence, not the current count or remaining-work list.

## Infrastructure findings

| Boundary | Evidence and finding | Useful next work |
| --- | --- | --- |
| Semantic and renderer ownership | Fresh architecture gates pass. Domain owners, conformance registration, compiler authority and framework-neutral boundaries already exist. | Preserve these owners; no new universal semantic layer. |
| Supported authoring discovery | `supported-author-tasks.ts` lists ten bounded tasks, with separate preview/extraction/publication capabilities. Dispatch lazily selects the responsible checker. | Expose the existing mechanics checker through this seam with honest limitations; do not add physical inference. |
| Fraction authoring versus hosting | Checker accepts 2–8 states; publication supports only `align,combine` and `align,combine,reduce`. Runtime directly indexes alignment, merge, evaluation and optional reduction stages. | Make host eligibility explicit and source-to-preview predictable within existing operations; preserve typed gaps for unsupported sequences. |
| Marginal reuse cost | Closeout records nine production modules plus two configuration files for first numeric variation; twelve plus two for subtraction. Later checker-only trials required source edits alone. | Measure visual authoring separately from checking. Require a supported variation to reach the existing host without renderer, CSS, clock or route edits. |
| Runtime loading | Fraction entry eagerly imports compilation and native surfaces, recompiles embedded source and prepares all stages. Last release measured 450,628 startup / 492,302 activated gzip JS/CSS bytes. | Attribute and reduce initial dependencies while preserving first-drag readiness. Lazy imports alone do not reduce total activated cost. |
| Shared presentation | Typography, rails, disclosure and inset styles have central owners and participating-host parity checks. | Reuse and extend the cohort when a host is added; do not reopen accepted styling or rename compatibility classes for cleanliness alone. |
| Code/text coordination | Centroid inspection uses the existing native code renderer and shared clock, but replaces `narration.textContent` with the current beat. | One bounded persistent-text exemplar using accepted motion; test long prose and exact return before shared abstraction. |
| Explanation quality | An accepted deferred best-practices note already separates objective checks from editorial judgment. | Retained good/broken/paraphrased examples, actionable diagnostics and false-alarm checks; no claimed automated proof of pedagogy. |
| Planning/context maintenance | Roadmap and active thread retain many old statements labelled current; resume exceeds its output budget. Refill suggests an old graph checkpoint. | Reconcile current state and reduce default context while keeping linked history and required stop conditions. |

Source anchors: [fraction runtime](../../../src/tutorial/fraction-chain/entry.ts),
[publication](../../../src/tutorial/fraction-chain/publication.ts),
[compilation](../../../src/authoring/fraction-chain-compilation.ts),
[task inventory](../../../src/authoring/supported-author-tasks.ts),
[dispatch](../../../scripts/author-check-owner-dispatch.ts),
[code inspection](../../../src/tutorial/code-reasoning/centroid-inspection.ts),
[presentation contract](../principles/reasoning-passage-presentation.md),
[cost evidence](2026-09-17-chain-first-release-budget.md), and
[domain boundaries](2026-09-17-chain-first-domain-boundaries.md).
Cost figures are previous release artifact measurements, not new network or
latency measurements. This audit did not rerun the full release suite.

## What is actually enqueued

`loop:status` reports no active loop. `theseus plan run` reports no ready action.
The completed chain-first contract is not a source of remaining work.
Paginated `theseus work list --state deferred --limit 5` returns 37 records:
these include both actions and contracts, plus superseded versions. They are
not 37 independent approved future loops.

| Stored family or horizon | Current interpretation |
| --- | --- |
| Reader l1–l6 horizon | Desktop local access, child reasoning, scalar reuse, force/energy and graph work have subsequent evidence. Phone remains provisional. Code motion is accepted; persistent code/text coordination remains a useful transfer. Do not replay the old sequence wholesale. |
| Relational reader v1/v2; local inspection; mechanics motion | Deferred history with work partly delivered through successors. Reconcile exact remaining obligations before any resumption. |
| Force–energy graph v1 | Only blocked record returned by Theseus. Its checkpoint description still asks for long-text/edge-drag judgment, while roadmap and later repairs record acceptance. This is a reconciliation candidate, not a reason to ask for the same review again. Closure still requires checking stored contract obligations. |
| R1/R2/R3/R4A/R4B authoring horizon | Roadmap records completed authoring round trip, reusable reasoning, Bayes, entrypoint convergence and authored-explanation coherence. Old horizon language is not an automatic successor queue. |
| Ownership/lifecycle types; HTML boundary; exact navigation; proof-carrying promotion; carrier-preserving simplification v1–v3 | Potential infrastructure candidates. Titles alone do not establish surviving defects; inspect against current owners and tests before selecting one. |
| Code network/BFS, TypeScript/Python frontends, economics projection, matrix/linear map, FTC, differentiation, integration, Scheme | Preserved subject or medium work, sometimes superseded by later accepted callers. No blanket restart or broad subject expansion recommended. |
| Media export, dynamic packages, curriculum/cards, upload authoring, publication tranches | Optional product horizons, not prerequisites for the next reusable passage. |
| Explanation best practices | Accepted deferred recommendation with a concrete bounded design; worth reselecting after authoring integration, without pretending it measures learner understanding. |

Queue tooling findings: `theseus work resume` and `--limit 1` both fail with
1,647 tokens against 1,200. `theseus plan refill --limit 5` fails at 819 against
800; `--limit 1` succeeds and returns the old graph checkpoint. Bounded context,
list and run queries work. Do not blindly raise ceilings or edit graph JSON;
diagnose the responsible output/selection boundary during reconciliation.

## Recommended bounded infrastructure sequence

These are proposed outcomes, not a second executable slice ledger or permission
to run all items. Theseus should own implementation status once scope is approved.

1. **Reconcile current truth, with a strict time bound.** Correct demonstrated
   dashboard staleness, reconcile the old graph checkpoint against its contract,
   and make the current roadmap/queue cheap to retrieve without discarding
   history. Finish with a short live shortlist, not an expanded planning system.
2. **Make supported source reach a usable preview more cheaply.** Use the
   accepted fraction passage as the canonical artifact and host, its existing
   domain-issued transformations as truth, and the native KaTeX compositor as
   renderer. Expose exact host eligibility; reduce compilation/loading coupling;
   prove a supported source/prose variation without engine or route edits.
   Connect existing mechanics discovery only through its own authority. Measure
   source edits, engine edits, initial/activated payload and first inspection
   readiness separately. No new algebra laws, renderer or arbitrary chain promise.
3. **Transfer persistent text coordination to code.** Use the existing centroid
   artifact, language-owned evidence and native code renderer. Preserve accepted
   motion; one visual checkpoint before generalizing interaction or layout.
4. **Add bounded explanation-authoring review support.** Execute the already
   recorded [best-practices direction](../threads/2026-09-11-deferred-explanation-best-practices.md)
   against existing passages. Objective invariants may be enforced; editorial
   findings must remain qualified and pressure-tested against valid alternatives.

| Candidate | Authoring value | Reliability | Reuse | Speculative risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Truth/queue reconciliation | Medium | High | High across sessions | Low if bounded | Short prerequisite |
| Existing-operation source-to-preview and cost | High | High | High | Medium | Main next infrastructure investment |
| Code/text transfer | High | Medium | High across media | Medium; needs visual review | Next product-facing infrastructure test |
| Explanation review fixtures | High | Medium | High | Medium; false confidence possible | Bounded follow-up |
| More algebra families/general solver | Unclear marginal value now | Unclear | Potential | High | Defer |
| Broad cleanup of every deferred contract | Low immediate value | Unclear | Unclear | High scope/context cost | Do not start |

The proposed main loop ends when supported authoring has demonstrably lower glue
cost and honest host eligibility, not when the dashboard fills with checks.
Preserve accepted visuals, exact return, source revisions and native endpoints.
New visible treatments still require their normal exemplar judgment; nonvisual
integration does not require recruiting readers or inventing new lessons.

## Verification

- `npm run test:repertoire`: 8 passed; inventory structure and links, not truth of
  all 747 claims.
- `npm run check:architecture`: all gates passed, including eight conformance
  tests. Dependency gate inspected 2,297 TypeScript modules; other gates have
  their own scopes and counts. No blanket architecture-completeness claim.
- Existing local dashboard returned HTTP 200; no fresh visual review claimed.
- Read-only Theseus run/list/context/refill queries supplied the queue findings.
- Current focus: infrastructure reuse within existing semantics. Next action:
  propose the bounded reconciliation/source-to-preview run for approval.

Files changed by this audit: this review, the roadmap pointer and the active
thread pointer. Stale-plan findings remain explicit above; no historical contract
was silently closed, resumed or duplicated.
