# Native KaTeX Compositor Conformance Long-Loop Proposal

Date: 2026-08-19
Status: approved
Contract: `run-contract.kp.native-katex-compositor-conformance-v2`
Return target: `run-contract.kp.carrier-preserving-simplification-v4`

The `v1` control record was superseded before implementation because the
specialist CLI's abbreviated help omitted the run-mode, cadence, limit, and
stop-condition flags. `v2` is the exact executable contract for this reviewed
proposal.

## Objective

Build a bounded, development-only conformance suite that detects continuity,
ownership, and lifecycle failures in the native KaTeX compositor by feature
class rather than by collecting ad hoc animation regressions. Repair the shared
typography handoff exposed by the rejected add-zero `x` checkpoint, prove the
clean `2` control remains unchanged, and stop for human review before expanding
the suite or resuming carrier-family promotion.

The suite is diagnostic infrastructure. Its fixtures, generator, observer,
reporter, and visual surface must contribute zero bytes to production browser
closures.

## Rejected checkpoint and baseline evidence

The carrier-preserving simplification loop is preserved at its second human
checkpoint. Promotion is rejected until this conformance run closes the shared
paint seam:

- add-zero `x`: native source and target ink tops are approximately `266.64px`,
  while the material clone top is approximately `280.47px`;
- the handoff therefore introduces an approximately `13.8px` vertical drop and
  endpoint correction;
- the clean canonical `2` control has approximately `0.28px` total vertical
  excursion;
- `= 4` remains stationary;
- existing checks prove planned geometry and ownership but do not observe the
  realized glyph ink position at the native-to-material seam.

## Canonical reference and first exemplar

- Canonical reference: the already-approved canonical `2` carrier animation.
- Failing pressure exemplar: the add-zero italic `x` carrier.
- The first promotion boundary is only the `2`/`x` pair.
- Human acceptance requires that source, material, and target paint share the
  intended baseline without a seam correction in forward, direct-seek, and
  reverse playback.

## Coverage model

Coverage is generated over semantic feature classes:

```text
paint class
× context mutation
× ownership topology
× lifecycle action
× rendering mode
```

A deterministic pairwise covering array supplies the routine scenarios.
Explicit three-way cases cover known interaction risks. Unsupported
transitions must be classified and rejected rather than silently approximated.
The suite jointly covers shape/paint continuity, correspondence topology, and
lifecycle determinism; it does not certify aesthetics.

## Cost budgets

- Fast canary: at most 24 scenarios and five paint samples per transition.
- Promotion suite: at most 96 generated scenarios.
- Cross-browser release cohort: at most 12 representative scenarios per
  engine.
- One persistent server, browser, reusable page, and worker.
- No routine screenshots or default unseeded fuzzing.
- Advisory wall times: planner/unit work under 5 seconds, Chromium canary
  approximately 20–30 seconds, promotion under 2 minutes, and supported-browser
  release cohort under 5 minutes.

Scenario, page, and sample counts are hard limits. Wall-clock limits are
advisory because host load varies.

## Allowed work

- Test-only typed shape descriptors, risk tags, deterministic coverage
  selection, manifests, and diagnostic reports.
- An actual-visible-ink observer derived from the existing measurement seam.
- Native-source to material to native-target seam traces.
- Baseline, ink-rectangle, scale, ownership, and lifecycle continuity laws.
- A reusable development-only browser harness and compact diagnostic surface.
- One shared compositor/typography-handoff repair when the evidence identifies
  the responsible authority.
- Atomic KaTeX shapes, scripts, font styles, rules, roots, accents, delimiters,
  compound layouts, and two diagnostic matrix fixtures.
- Focused lifecycle pressure across seek, reverse, interruption, font loading,
  resize, DPR, theme, reduced motion, and supported engines.
- Production-closure, bundle, architecture, cost, and workspace gates.

## Disallowed work

- Glyph-, equation-, fixture-, or caller-specific offsets.
- Changes to carrier semantics, correspondence, fade-only choreography, timing,
  IDs, URLs, or static endpoints.
- Authoring, lesson, layout, public-product, dashboard, or Svelte feature work.
- SVG, Canvas, WebGL, or other renderer-family expansion.
- Matrix lesson design; matrices are diagnostic compound shapes only.
- A universal aesthetics schema or visual certification matrix before the
  exemplar checkpoint.
- Planned geometry masquerading as actual paint observation.
- Shipping the conformance suite or its registry in a production closure.

## Ordered slices

| Slice | Target | Intended change | Verification boundary |
| --- | --- | --- | --- |
| ncc01 | Priority cutover | Record the rejected carrier checkpoint and move conformance ahead of promotion. | Theseus validation and return-target evidence. |
| ncc02 | Baseline evidence | Freeze the measured `x` regression and clean `2` control. | Deterministic baseline fixture. |
| ncc03 | Inventory | Inventory ink observers, endpoint handles, ownership/lifecycle tests, and harnesses. | Bounded architecture note. |
| ncc04 | Terminology | Define shape class, context mutation, topology, seam, realized paint, and supported transition. | Type/document vocabulary check. |
| ncc05 | Budgets | Freeze test-cost, scenario, sampling, and browser budgets. | Budget contract. |
| ncc06 | Shape schema | Add a typed test-only shape descriptor schema. | Type and negative-boundary tests. |
| ncc07 | Risk tags | Add glyph, rule, script, vertical-list, delimiter, multirow, and font-style tags. | Exhaustive tag checks. |
| ncc08 | Pairwise planner | Implement deterministic pairwise selection plus explicit three-way overrides. | Coverage-planner unit tests. |
| ncc09 | Coverage manifest | Generate an inspectable explanation for every selected scenario. | Stable manifest snapshot/data check. |
| ncc10 | Ink observer | Build an actual-visible-ink observer from the existing measurement seam. | Observer contract tests. |
| ncc11 | Seam traces | Define native-source to material to native-target traces. | Trace ordering and coordinate-space tests. |
| ncc12 | Continuity laws | Encode baseline, ink-rect, scale, and ownership continuity. | Law-level unit tests. |
| ncc13 | Diagnostics | Report semantic ID, shape ID, progress, coordinate space, rectangles, and deltas. | Stable structured report checks. |
| ncc14 | Browser harness | Build a test-only persistent-page harness. | Single-worker Chromium smoke. |
| ncc15 | Production exclusion | Add negative production-import and bundle-closure gates. | Production closure and build checks. |
| ncc16 | Clean control | Prove the canonical `2` passes actual-paint continuity. | Focused browser canary. |
| ncc17 | Failing regression | Reproduce `x` displacement as a mandatory failing regression. | Diagnostic must identify the old seam. |
| ncc18 | Shared repair | Make measured paint own realized carrier position without glyph/caller branches. | `2`/`x` laws, type, and architecture checks. |
| ncc19 | Exemplar checkpoint | Re-run `2`/`x` and prepare a compact overlay/contact sheet. | **Mandatory human visual checkpoint.** |
| ncc20 | Atomic shapes | Add digit, italic, descender, Greek, operator, relation, and punctuation representatives. | Bounded promotion cohort. |
| ncc21 | Script/style shapes | Add script and font-style representatives. | Bounded promotion cohort. |
| ncc22 | Structured shapes | Add fraction, root, rule, accent, and fixed/stretchy delimiter representatives. | Bounded promotion cohort. |
| ncc23 | Context mutations | Add shorter/longer/tall siblings, grouping, and math-style mutations. | Pairwise manifest and canary. |
| ncc24 | Matrices | Add whole-matrix and heterogeneous cell-level persistence fixtures. | Diagnostic-only compound-shape checks. |
| ncc25 | Compound risks | Add large operators, cases/alignment, and one nested three-way fixture. | Bounded promotion suite. |
| ncc26 | Lifecycle/browser pressure | Pressure seek, reverse, interruption, font, resize, DPR, theme, reduced motion, and supported engines. | Representative cross-browser release cohort. |
| ncc27 | Closeout | Run architecture, production closure, bundle, cost, and workspace gates; reactivate the carrier loop. | Closeout evidence and return-target activation. |

## Slice 19 acceptance criteria

- `x` source, material, and target paint occupy the intended baseline.
- Neither handoff requires visible endpoint correction.
- The canonical `2` remains visually unchanged.
- `= 4` remains stationary.
- Forward playback, direct seek, and reverse playback realize the same geometry.
- No glyph-, equation-, or caller-specific adjustment exists.
- The diagnostic suite demonstrably catches the pre-repair regression.
- The canary remains inside its scenario, sample, worker, and wall-time budgets.

## Preservation and rollback

Carrier semantic evidence and correspondence remain authoritative and
unchanged. The repair is limited to the paint/typography seam. Schema/planner,
observer/reporter, shared compositor repair, fixture families, and production
exclusion are independent rollback units. The carrier loop remains recoverable
at its rejected checkpoint and may resume only after conformance closeout.

## Stop conditions

Stop immediately if test-only code enters a production closure; a glyph- or
caller-specific offset is required; the observer measures planned rather than
actual paint; browser variance cannot be classified; hard budgets are exceeded;
the suite begins encoding aesthetics; a new semantic or timing authority is
introduced; matrix work expands into lesson design; or approved behavior
outside the paint seam changes.

The first approved tranche ends as `HUMAN_CHECKPOINT` at `ncc19`. Slices
`ncc20`–`ncc27` remain approved but cannot begin until the exemplar passes that
checkpoint.
