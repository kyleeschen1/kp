# Structural authoring: two-caller G2 checkpoint

Status: STOP_CONDITION at reader payload budgets; G2 not ready
Contract: `run-contract.kp.structural-authoring-canonical-tax-v2`

## What the proof establishes

Distribution and carrier-preserving simplification now connect retained semantic
state, exact version selections, verified operation receipts, atomic successors,
historical queries, data-only preparation and restoration, and existing native
renderers. Their Focus Cards use the shared form and playback controller.
Domain legality and presentation authority remain operation-owned. There is no
universal expression model, replacement renderer, public authoring facade, or
new animation clock.

The prior compiler-cost stop was repaired in `1da51de31`: geometry declarations
and the existing pure frame sampler no longer import legacy DOM/token machinery
into the real native consumer. Existing exports and the concrete consumer
fixtures remain intact. After the lifecycle repair the unchanged gate measures
112,090 types / 191,101 instantiations, below 112,500 / 195,800. Source accounting
also passes with the extracted owners included; headroom remains tight.

## Release failures and repairs

The historical failure evidence remains in
`2026-09-06-structural-authoring-release-stop.md`.

**Carrier invalidation:** a seek or reduced-motion event can precede delivery of
ResizeObserver. The adapter formerly sampled its existing playback despite a
changed viewport fingerprint, correctly triggering the compositor's stale-handle
guard. The adapter now checks freshness before sampling and schedules replacement
through its existing lifecycle. The latest pending semantic playhead is retained.
The compositor guard, clock, identity-shrink treatment, and endpoint authority are
unchanged. The regression forces width mutation and input in one browser task,
before the observer can deliver, then checks restoration and absence of errors.

**Structural paint observation:** group observation formerly inserted a text
baseline probe into every presentation owner, including empty CSS rules. On
WebKit, inserting and removing that probe changed an empty rule's inline baseline
placement by 33.9375 px. Equivalent states that had and had not been observed
therefore disagreed at the next stage seam despite identical rule markup and
computed styles. Structural-only groups now report `baselineY: null`, already
allowed by the observation contract; text-bearing groups retain measured text
baselines. This repairs the shared observer, not one fraction spelling. No
browser dispatch, glyph offset, CSS workaround, or tolerance increase remains.

Canonical and authored paths traverse the real compositor and repeat observation
on native endpoints. The regression requires structural-only baselines to be
absent and every observed owner rectangle to remain unchanged. Continuity errors
now include numerical residuals so future failures are diagnosable without
loosening the guard. CSS/probe experiments were removed.

**Direction checks:** the human-readable next-actions summary still pointed at
the completed predecessor's G0 checkpoint. It now links that completed proposal
as provenance and the approved structural/migration successor as current scope.
Its tests retain explicit G2/G3 and nonvisual-preapproval boundaries. This is
memory reconciliation, not new execution authority.

## Executed verification

- Structural supported-browser cohort: 24 passed across Chromium, Firefox and
  WebKit, including same-task invalidation/seek pressure.
- Strengthened canonical/authored observation checks: 6 passed across all three
  browsers using `npm run visual:authoring-structural -- --project=firefox --project=webkit --grep 'distribution traverses'`.
- `npm run visual:authoring-distribution-card`: 30 passed, Chromium and Firefox;
  loading, no-JS text, native motion, coherent chunk transport, reduced motion,
  cache parity, disposal and restoration remain intact.
- `npm run test:canonical-equation-renderer`: 29 passed, including unchanged
  source ceilings and real native import closure.
- `npm run test:carrier-preserving-simplification`: 29 passed.
- Current-direction ratchet: 3 passed.
- `npm run check:inference`: passed at the counts above.
- `npm run check:equation-reachability`: current, 68 roots.

- `npm run build`: passed, including full typechecking; the existing large-chunk
  warning remains advisory.
- `npm run test:browser:native-katex-compositor-conformance`: 2 passed on the
  reusable Chromium page, covering actual paint seams and lifecycle pressure.
- `npm run visual:carrier-preserving-simplification`: 5 passed, preserving both
  existing carrier callers.
- `npm run test:equation-surface-preservation`: 11 passed.
- `npm run check:reader-production`: passed, 12 manifest routes.
- `npm run check:dev-review-production`: passed, 448 files / 12 forbidden markers.
- `npm run check:reader-budgets`: failed; details below.

`npm test` completed: 6,588 passed / 1 failed. The sole failure was an outdated
legacy-policy inventory that did not count the extracted frame sampler. The
inventory now charges that file's two surviving references, preserving both the
frozen baseline and expected reduction; its focused four-test suite passes.
The entire suite was not rerun after that test-only repair, so this is not a
claim of a completely green full-suite run.
Theseus owns live progress; this report is not a second slice-status table.

## Remaining release stop: reader payload budgets

The impact-selected reader budget check fails for the ten equation routes;
the two non-equation reader routes pass. Their shared built JS/CSS closure is
**175,703 gzip bytes**, against an unchanged **145,000-byte** ceiling (138,095
baseline plus 5%). The overage is **30,703 bytes**. All ten also exceed HTML gzip
ceilings, and six exceed raw HTML ceilings. For example, fraction composition
is 8,142 gzip bytes against 8,048, and solve-x is 40,077 raw / 5,452 gzip bytes
against 39,867 / 5,227.

Attribution through the validator's existing `inspectKpReaderRouteBudgets` API
shows shared public-api (17,931 gzip bytes), reader CSS (12,013), material plan
(9,972), entry shell (9,836), visual motif (9,340), responsive fit (9,093), and
semantic motion source authority (8,918), among other chunks. These are current
costs, not a historical regression attribution. No pre-repair production build
was measured, so the overage is not attributed to these small lifecycle fixes.

Separately, the forbidden-asset predicate's `/katex-.*\.js/` pattern flags the
required `native-katex-paint-geometry` helper (2,127 gzip bytes). This filename
classification is broader than the intended KaTeX runtime-parser exclusion.
Correcting that classifier would not erase any numeric overage; no predicate,
baseline or ceiling was changed in this repair.

The next bounded task is built-payload attribution and reduction, including HTML
generation and shared-chunk import boundaries, while retaining real consumers,
ordinary build delivery, semantics and native paint. Do not reduce measured scope,
rename a forbidden dependency, omit CSS, or refresh baselines to manufacture a
pass. This exceeds the specific browser-measurement defect repair resumed here;
the s18 required-release-evidence stop remains active before G2 or migration.

## Review destination and remaining boundary

Both canonical authoring product exemplars returned HTTP 200 on the shared server:

- `http://127.0.0.1:8000/experiments/authoring-distribution-focus-card/`
- `http://127.0.0.1:8000/experiments/authoring-simplification-focus-card/`

The full fraction reader is additional stage-path evidence, not the canonical
product format. The accepted motion, typography and identity treatment are
preserved; this repair introduces no new visual motif for generalization.

G2 asks whether this two-caller authoring/integration proof is sufficient to begin
the already-approved canonical supply-tax migration. That migration must preserve
the current URL, exact economics, bound prose, interactions, native renderers and
ordinary build delivery, retiring superseded default wiring beside the cutover.
It has not started. G3 remains required before merge or further generalization.

This does not establish an arbitrary-equation authoring API, live-model benchmark,
generalized structural rewriting, publication service, or universal smooth-frame
guarantee. Firefox handoff stalls remain a measured limitation of the reviewed
fraction card. Compiler and source headroom are small. The long-loop ordering has
been useful: two real callers exposed dependency and measurement defects before
canonical economics adoption, without rolling back the semantic architecture.
