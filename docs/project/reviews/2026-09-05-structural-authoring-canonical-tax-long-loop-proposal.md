# Structural authoring proof and canonical supply-tax adoption

Date: 2026-09-05
Status: exact 28-slice proposal approved; Theseus owns execution
Mode: long, explicitly requested through theseus-long-loop
Contract: `run-contract.kp.structural-authoring-canonical-tax-v2`
Target: `next-action.kp.structural-authoring-canonical-tax`

## Outcome and why now

Make the new authoring architecture earn canonical adoption: first exercise
structure-changing equation operations, then make the existing supply-tax URL
consume the framework-derived model, samples, and bound prose. The previous
28-slice integration is complete; no active executable continuation exists.
The user accepted the order in
`../decisions/2026-09-05-canonical-supply-tax-migration-order.md`, then explicitly
approved this exact 28-slice proposal. The target and contract are materialized;
G0 authoring/API/visual approval remains separate from execution approval.

This is a many-hour, cross-subsystem loop, provisionally 10–20 active engineering
hours plus human review waits. The estimate is not a deadline or permission to
skip gates. The main uncertainty is the structural correspondence bridge, not
the route switch. If that requires new mathematical or presentation authority,
stop and revise scope rather than consuming migration slices for a framework
rewrite.

## Dependencies and canonical references

- Completed integration and pending authoring/API/visual review:
  `2026-09-05-authoring-integration-market-preview-closeout.md` and
  `2026-09-05-authoring-market-author-review.md`.
- Existing internal assembly and aggregate recovery in `src/semantic-state/`;
  existing bounded bridge `src/math/typed-math-state-optics.ts`. Do not loosen
  same-cardinality safety for all callers; add only demonstrated, explicitly
  authorized structural behavior.
- Distribution reference: the reviewed distribution transition inside the
  canonical fraction-composition asset, through
  `src/animation/fraction-composition-equation-adapter.ts` and its real native
  equation session. Do not substitute the unrelated distribution-area or
  foldable-distribution host. Slice 2 pins the exact transition, canonical host,
  semantic trace, compositor path, and reusable mechanism evidence before edits.
- Second reference: existing carrier-preserving simplification, whose browser
  evidence is `tests/carrier-preserving-simplification.browser.spec.ts` and
  registered surface is
  `editor-animation-surface.operation-evaluation.carrier-preserving-simplification`.
- Canonical economics host:
  `src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-entry.ts`;
  existing page calls it without a supplied source. Authoring injection already
  exists in `src/experiments/authoring-market/authoring-market-host.ts`.
- Exact economics remains domain-owned; state owns history, registered
  operations own legality, the existing reader owns time, and native KaTeX/SVG
  own paint. No new global state or interpolation engine.

## Review gates and preservation

G0, after slice 1: explicitly accept the existing market authoring/API/visual
checkpoint. Approval of this plan alone does not imply G0 approval. Prepare the
review evidence and stop if that approval is absent.

G1, after slice 12: review the distribution integration, including real native
source, transition, and target phases. Stop before second-caller promotion.

G2, after slice 18: accept the two-caller structural/API evidence before any
canonical economics cutover work.

G3, after slice 28: review canonical migration parity before merge or any
further generalization. Branch merge/deletion is not included in this proposal.

Preserve approved choreography, layout, native paint ownership, semantic object
identity, operation authority, the four-card Focus Deck, and existing URLs.
No new visual motif is proposed. If preserving an exemplar requires subjective
retiming/restyling, stop for a separate decision. Unsupported structural work
returns a typed gap; no generic fade or inferred lineage from matching glyphs.

Rollback units: one structural adapter/caller commit at a time; the canonical
route switch and its superseded default wiring retire together in slice 23.
Evidence commits may precede that switch, but no permanent dual-authority flag
or fallback is introduced. Original domain constructors used by other callers
remain. Migration cleanup requires an audited consumer list.

## Verification and execution cadence

- F (focused): deterministic tests for the named behavior and Theseus validation
  after durable mutations.
- S (standard): F plus `npm run typecheck`.
- B (broad): S plus relevant integration, architecture/dependency/import-closure
  and scoped browser checks; full `npm test` and `npm run build` at the explicit
  structural and final release boundaries, not every helper slice.
- H: explicit human review of the named artifact; screenshots and machine tests
  cannot mark that judgment passed.

Existing commands: `npm run test:authoring-integration`,
`npm run test:carrier-preserving-simplification`,
`npm run visual:carrier-preserving-simplification`,
`npm run visual:authoring-market`,
`npm run test:browser:economics-supply-tax`,
`npm run check:equation-reachability`, `npm run typecheck`, `npm test`,
`npm run build`, and `theseus workspace validate`.
The existing fraction-composition dry-run test is planning evidence only;
native compositor certification requires the actual runtime path.

Proposed stable commands to add in slice 3: `npm run test:authoring-structural`
and `npm run visual:authoring-structural`. They must invoke committed tests or
scripts, keep disposable captures in `tmp/codex/`, and exercise the integrated
canonical session, not only a synthetic or legacy side path. Later slices
extend these same entrypoints. Promotion browser cohorts are selected from the
repository's supported-browser policy; missing engines are reported as gaps.

Each numbered row is one focused commit boundary including completed-slice
Theseus evidence. No empty implementation commits to manufacture progress.
Use brief context per slice, working context only for a named missing authority;
do not reload the historical corpus. Select impact checks from changed paths
and preserve type/inference/bundle thresholds. No automatic ratchet refresh.
Follow repository feature-branch and Git sandbox protocols before execution;
preserve the previous review branch and all user changes.

Every slice inherits stop condition X: failed required checks that cannot be
repaired inside scope; absent authority; changed review assumptions; unrelated
dirty-worktree collision; unsupported new paint mechanism; required budget
increase; or scope expansion. The table adds slice-specific stops. A failure
must retain its primary error and durable evidence, not be relabeled success.

## Ordered proposal — 28 slices

| # | Target and intended change | Risk | Verification / expected checks | Commit boundary | Additional stop |
| --- | --- | --- | --- | --- | --- |
| 1 | Current market checkpoint: reproduce the author edit/error/repair and settled-demand workflow; record explicit review disposition | Medium: mistaking order acceptance for visual approval | B + H: authoring 68-test baseline, visual:authoring-market, source/prose review | Market checkpoint evidence | G0 approval absent |
| 2 | Structural references: pin exact distribution and simplification sources, canonical hosts, lifecycle mechanisms and preservation manifest | Medium: wrong canonical path | F: source-map assertions, existing canonical tests, phase-by-phase baseline | Reference and preservation manifest | Canonical source/host or reviewed treatment cannot be established |
| 3 | Structural test seam: add stable focused and runtime commands with one reusable browser harness | Medium: testing a parallel path | S: harness smoke and actual session instrumentation | Scoped committed test entrypoints | Harness cannot reach the real compositor |
| 4 | Equation state value: adapt existing immutable semantic structure into aggregate storage without erasing IDs or evidence | High: duplicate AST authority | S: round-trip, immutable identity and callable/data tests | Bounded state adapter | Requires a universal AST or second store |
| 5 | Structural selection: pin existing expression selections and reject stale/foreign versions | Medium: selector becoming identity | S: historical recovery, stale selection and exact entity tests | Structural selection binding | Selection requires renderer nodes |
| 6 | Operation receipt: connect registered distribution legality to explicit before/after and lifecycle evidence | High: update granting proof | S: rejected forged/mismatched authority, operation parity | Distribution authority adapter | New rewrite mathematics is required |
| 7 | Atomic structural commit: publish the supported distribution successor through existing transactions | High: partial publication | B: abort, determinism, immutable predecessor and aggregate tests | Distribution transaction integration | General cardinality safety must be disabled |
| 8 | Derived/history integration: ensure derived results and pinned reads follow structural version changes | Medium: stale computed values | S: invalidation, direct historical query, cache/history bounds | Structural query coverage | Replay or mutable global current state is needed |
| 9 | Explanation assembly: compose the bounded distribution step with logical addresses and semantic references | Medium: second timeline | S: settled/transition address and reference identity tests | Distribution explanation binding | New clock or arbitrary branch editor is needed |
| 10 | Governed projection: lower the authored distribution into existing operation-specific animation authority | High: accidental new presentation semantics | B: lifecycle completeness, exact source/target, legality and dependency checks | Governed distribution projection | Missing canonical operation/motif support |
| 11 | Native runtime integration: execute that projection through the real canonical source-native/material/target-native path | High: paint ownership regression | B: structural runtime canary, realized continuity, exclusive ownership, native endpoints | Reversible distribution runtime adapter | Requires glyph offsets, duplicate paint, or new choreography |
| 12 | Distribution checkpoint: capture source/transit/target, seek/reverse, reduced-motion and preserved reference comparison | High: machine proof mistaken for visual approval | B + H: visual:authoring-structural and human phase review | Distribution checkpoint evidence | G1 approval absent |
| 13 | Simplification authority: map the reviewed carrier-preserving operation into the same structural receipt boundary | High: wrong carrier lineage | S: retained/removed entities, legality and typed-gap tests | Simplification authority binding | Different mathematical or visual operation required |
| 14 | Second structural caller: compose simplification state, selection, transaction and historical query using the proved seam | High: false genericity | B: structural suite plus carrier-preserving suite; no first-caller special cases | Simplification assembly integration | Needs another state engine or broad abstraction |
| 15 | Second native caller: execute simplification through its existing canonical paint owner and shared integration | High: ownership/topology mismatch | B: integrated runtime continuity and existing simplification browser checks | Simplification runtime adapter | Existing reviewed mechanism cannot express operation |
| 16 | Cross-caller pressure: test direct seek, reverse, interruption, disposal, recovery and typed failures across both callers | Medium: state leakage | B: bounded runtime corpus, history/cache counts, source revision isolation | Cross-caller preservation tests | Tests only exercise legacy rather than integrated paths |
| 17 | Authoring cost and API review: compare both callers, retain only demonstrated shared helpers, measure import/type costs | Medium: hiding complexity | S: consumer fixtures, negative types, unchanged inference/closure gates, charged cost inventory | Two-caller API/cost evidence | Public hierarchy or budget increase is needed |
| 18 | Structural release and checkpoint: run broad gates and present two-caller evidence for migration readiness | High: premature promotion | B + H: npm test, build, reachability, integrated supported-browser representative cohort | Structural closeout evidence | G2 approval absent or required release evidence missing |
| 19 | Canonical migration inventory: audit route consumers, default source wiring, baseline labels/URL/interaction and sibling preservation | Medium: deleting shared owners | S: consumer inventory, canonical economics tests and parity manifest | Migration preservation manifest | Unrelated callers depend on proposed retirement |
| 20 | Build-delivery boundary: factor the minimum framework-derived source preparation for ordinary page builds | High: dev service in reader | B: ordinary build, import closure, no SSR author-module execution or preview endpoint dependency in reader | Build-safe source preparation | Requires new publication platform or untrusted execution |
| 21 | Instructional parity: prepare bound prose, facts and score for the canonical reference revision | Medium: semantic or narrative drift | S: exact economics/claims, beat order, shared revision and accessibility text tests | Canonical instruction preparation | New prose/choreography decision is necessary |
| 22 | Cutover contract tests: exercise original URL behavior against the prepared source and verify single evaluator ownership | High: hidden second sampler | B: canonical scoped browser checks, deterministic sample and source ownership tests | Cutover parity harness | Source-driven host cannot preserve existing behavior |
| 23 | Canonical cutover: inject framework source at existing URL and retire its superseded default wiring in the same rollback unit | High: route regression | B: canonical browser checks, authoring integration, build/import closure and single-path assertions | Route switch plus adjacent wiring retirement | Another live caller still needs removed wiring; no blanket domain deletion |
| 24 | Navigation and lifecycle: pressure canonical deep links, reverse, resize, interruption, disposal and sibling cards | High: shared host regressions | B: canonical browser suite and scoped Focus Deck preservation checks | Canonical lifecycle evidence/repairs | Repair changes reader clock or approved interaction design |
| 25 | Build-served delivery: verify canonical page works without the authoring dev plugin and preserves static/reduced-motion content | High: development-only success | B: built-site runtime check, no preview requests, exact facts and accessibility smoke | Build-delivery runtime evidence | Normal build cannot deliver the page within existing infrastructure |
| 26 | Authoring-preview convergence: ensure local preview and canonical page consume the same source preparation with separate delivery lifecycles | Medium: diverging copies | B: visual:authoring-market, save/error/repair, revision isolation and canonical baseline | Shared-source convergence evidence | Preview lifecycle leaks into normal reader delivery |
| 27 | Migration release: run full repository gates, supported-browser representative cohort and unchanged budgets | High: incomplete certification | B: npm test, build, reachability, scoped economics/structural/browser checks, Theseus validation | Release verification evidence | Any mandatory gate unavailable or failing |
| 28 | Canonical adoption checkpoint: document retired wiring, preserved contracts, source workflow, costs and remaining publication work | Medium: overstated completion | H + F: human canonical-page parity review, docs consistency and Theseus validation | Migration closeout and review evidence | G3 approval absent; no merge/generalization |

## Done contract and deferred work

Technical completion requires two structurally distinct integrated equation
callers, demonstrated authority/identity/history/native-paint agreement, the
existing supply-tax URL using framework-derived source without a second default
sampler, and successful ordinary build-served delivery. Both local editing and
reader paths retain coherent source revisions. Required review decisions remain
separate from machine verification. The final outcome is HUMAN_CHECKPOINT until
canonical parity review is explicitly accepted.

Deferred: broad public API promotion, catalog-wide equation migration, new
choreography or salience motifs, animated demand, arbitrary independence,
general CAS/ontology, general structural rewrite completeness, editor redesign,
HTTP writes, untrusted TypeScript execution, durable last-valid publication
storage, full publication UX, knowledge/procedures, LaTeX/LLM expansion, new
domain frontends, framework upgrades, performance rewrites without pressure,
branch merge/deletion, and deployment to external infrastructure.

## Planning diagnostics

Execution setup correction: v1 retained the approved text and slice order but
omitted typed run mode, maximum slices, cadence, verification level and stop
fields because the CLI short help did not list them. V1 is superseded, not
deleted. V2 preserves the exact approved scope and supplies those fields;
`theseus plan run` passes its autonomy gate. The target also now has explicit
done criteria. This is metadata repair, not new execution authority.

The following thin-queue diagnostic describes pre-approval planning, not the
current active contract:

`theseus plan run` reports a thin queue and no active contract. The prescribed
bounded refill query failed with `action-plan token count 810 exceeds budget
800`; no budget was changed and no refill candidate was selected. Brief
workflow context was retrieved instead; its old objective still references the
completed integration. This accepted decision and proposal should be attached
as workflow sources now. After exact approval, materialize the proposed target
and contract through supported Theseus commands; do not edit graph/event JSON.

Resume planning with `theseus plan run` from the repository root and this
proposal. After contract issuance, use
`theseus work resume next-action.kp.structural-authoring-canonical-tax`.
