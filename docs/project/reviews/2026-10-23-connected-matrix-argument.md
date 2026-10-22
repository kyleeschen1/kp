# Connected input-recovery argument

Plan: [approved bounded exemplar](../2026-10-23-connected-matrix-argument.md).
Candidate: <http://localhost:8000/experiments/matrix-column-combinations/?argument=1>.

The main reading connects a column combination to information retained, a lost
input change, a free variable and impossible outputs. All connecting reasoning
is visible without opening an inspection. Three optional inspections reuse the
existing column and comparison players; closing releases their material and
clock, retaining only fractional progress. Reopening returns to that position.
The original page location is not owned or rewritten by a child player.

## Authoring intervention and limits

The existing column player already separated playback from document navigation.
The comparison did not; its extraction into `comparison-player.ts` removes that
embedding blocker, preserving its native view, clock, timing and source format.
Column card markup also has one reusable function, shared with its old page.
The new source connects actual existing mathematical objects, not copies of
motion plans. This required a new local reading host and bounded editorial
composition; it is **not** an already source-only Article/publication workflow.
There is no arbitrary solver, no new motion motif and no claim of general
composition until a structurally different argument tests this boundary.

The source permits variable-length prose/equation/inspection/question blocks.
Unique identities and supported block kinds are checked, copies frozen. General
algebra in prose is authored reasoning, not a newly certified symbolic proof.
The displayed numerical map is pinned to its stated premise; samples pressure
the retained-weight identity and solution family through the matrix authority.
Static means animation-independent reading after JavaScript loads; this preview
is not a no-JavaScript or immutable portable edition. Inspection progress is
retained during the session, not serialized in the URL or across reloads.

## Verification

- `npm run test:matrix-argument`: nine semantic/source tests pass. An initial
  unsupported TypeScript parameter property was corrected to erasable syntax;
  full application/node/test/Svelte/domain typechecking then passed.
- `npm run visual:matrix-comparison`: all eight Chromium preservation checks pass.
- `npm run visual:matrix-interpretations`: all 29 Chromium checks pass.
- `npm run visual:matrix-argument`: five final Chromium checks pass, covering lazy
  activation, one live player, fractional reopening, stale-load cancellation,
  narrow reading, reduced motion, return focus/viewport and disposal. Its initial
  expected MathML count was eight instead of the source's nine; corrected test,
  complete rerun passed. Final desktop and phone captures were inspected. The
  added theme regression checks that action ink follows the reader's theme and
  native comparison typography matches the standalone accepted player.
- `npm run check:architecture`, `npm run build:matrix-interpretations`,
  `npm run test:fraction-chain` (39 tests), and `theseus workspace validate` pass.
- Final `npm run typecheck` and `npm run build:bundle` pass. The build retains
  existing large-chunk warnings outside this bounded reader; it is not evidence
  that all application bundles are small.
- The fraction/scalar/energy shared-style Chromium check passes after the CSS
  extraction. Existing light defaults and native-math typography are preserved.
- `npm run test:semantic-cost` passes 26 tests. The production command
  `npm run visual:semantic-cost -- --grep 'matrix source navigation|comparison production routes|connected argument'`
  passes all three checks, including old route isolation and the new reading.

The impact selector had no focused rule for these files and suggested its broad
fallback. This visual discovery uses the plan's focused source/lifecycle/browser
checks plus full types and affected build; it does not repeat the recently passed
7,415-test full repository suite or claim a new full-suite result.

## Styling and cost investigation

The first capture exposed light-only disclosure ink on a dark matrix page. The
shared action owner now accepts theme ink/focus roles, retaining previous light
defaults. Document layout and action CSS have narrow shared entrypoints so the
matrix host need not import KaTeX again or unused equation-rail rules. No local
font family, math size or choreography was introduced.

Initial complete matrix-union CSS was 26,384 bytes gzip; the narrow imports reduce
it to 16,123, saving 10,261 bytes. Against the previous complete union, the final
increase is 778 CSS bytes and 8,105 JS bytes. The source and embedding boundaries
are useful capabilities with a real cost, not a claimed optimization overall.

`npm run build:matrix-interpretations` and `npm run measure:semantic-cost` measure
complete activated closures, not just route chunks. The pre-change source at
`c77d93535` was replayed through the same scoped Vite configuration. That baseline
reproduces the previous review's costs exactly for both comparisons, dependent
columns and the all-route union. Per-file gzip sums below exclude fonts/HTML and
are compressed estimates, not browser transfer or latency measurements.

| Complete consumer | Before | Final JS gzip |
| --- | ---: | ---: |
| Ordinary column reader | 112,582 | 113,808 |
| Dependent-columns reader | 113,932 | 115,006 |
| Projection-loss reader | 113,474 | 114,701 |
| Basis-composition reader | 116,246 | 117,468 |
| Lost-difference comparison | 102,549 | 104,022 |
| Distinguished comparison | 101,011 | 102,641 |
| Complete rectangular-product union | 146,852 | 147,161 |
| Complete matrix-route union, retaining editor and old walk | 139,896 | 148,001 |
| New argument, no inspection | — | 109,630 |
| Argument plus column inspection | — | 121,678 |
| Argument plus comparison inspection | — | 121,598 |
| Argument plus all inspections | — | 127,741 |

The old readers' small increases come from the reusable-player split and
shared-chunk/import attribution. Their production inventories reject the new
argument host, and the unopened argument rejects material players/compositors.
Keeping full stylesheet imports was rejected after measurement. Reverting the
player extraction would remove local inspection or require duplicate playback;
an iframe would add a document and lose the intended in-place ownership. A broad
manual chunking policy is not justified for this exemplar. Removing old route
consumers to make the union pass was also rejected.

Standing engineering-budget authority covers the diagnosed, explicit amendment
in `scripts/semantic-cost-budgets.json`. Existing JS ceilings change to:
rectangular union 147,750; row-guided 118,500; row-composition 124,500; ordinary
default/numeric 114,500; projection 115,500; dependent 116,000; lost comparison
105,000; distinguished 103,500; basis composition 118,250; reader union 121,500;
matrix union 149,000. Row-guided and row-composition retain modest headroom after
the same shared-chunk change (measured 117,982 and 124,000). Other existing JS
ceilings remain. Matrix-union CSS becomes 16,500; other existing CSS ceilings
remain. New reading/columns/comparison/all JS ceilings are 110,500 / 122,500 /
122,500 / 128,750; their CSS ceilings are 16,000 / 16,000 / 16,500 / 16,500.
**All 29 complete-consumer gates pass.** No failing gate was disabled or consumer
omitted; earlier failures are the diagnosis above, not relabelled passes.

Production retention: after warming all three inspections, four further full
open/seek/reverse/close cycles retain one document, 3,221 DOM nodes and 49
listeners, with zero additional requests. Heap rises about 207 KB in this sample;
this is not a proof of zero leakage or many-card scalability. Only the active
inspection owns a clock, observer and material; closed slots retain progress.
The sampled reading's encoded subresources total 221,078 bytes, rising to 239,650
after all inspections. These include four font files (Math Italic 16,440, Main
Regular 26,272, AMS 28,076, Main Bold 25,324 bytes), exclude the main document,
and are not a cold-network timing experiment. No continuous idle sampling or
additional dependency was introduced.

The source now supplies local inspection context explicitly: B contains the
example inputs in the column view, and the altered map is labelled A inside its
existing comparison. Reuse must carry that notation bridge; matching an asset
does not guarantee that its labels make sense in a new argument.

## Human review question

Read the main argument first. Open the lost-change inspection, stop midway,
return, and reopen it. Does this feel like inspecting a reason in the argument,
or leaving it for another lesson? Judge whether optional detail helps more than
the complete static explanation. The changed-map section should retain the
distinction between detecting this difference and proving general injectivity.
Tests cannot establish that the prose, pacing or local inspection is useful.

Outcome: **HUMAN_CHECKPOINT**. All three implementation packages are complete;
the contract is deferred for this first connected-reading judgment. Resume with
`theseus work context task.kp.connected-matrix-argument --mode brief` after review.
The generic workspace handoff still reports two pre-existing audited nodes
without source references; this run has complete references and closed receipts.
Those old global queue findings are not the reason for this visual checkpoint.
