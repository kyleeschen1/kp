# Reader payload recovery and visual-preservation boundary

Status: HUMAN_CHECKPOINT — approval needed for shared visual-preservation repair
Contract: `run-contract.kp.structural-authoring-canonical-tax-v2`

## What is now repaired

All 12 manifest readers pass the unchanged raw HTML, gzip HTML, and JS/CSS
startup-closure budgets. The shared equation closure is **137,654 gzip bytes**,
down from **175,703**, under the fixed **145,000** ceiling. This is measured
startup closure, not the entire dynamically loaded animation runtime.

Two eager imports were responsible for unnecessary startup dependencies:

- The canonical frame planner imported the comprehensive reader runtime
  facade, bringing lesson-specific URL/evaluation machinery into ordinary
  startup. It now uses the existing learner facade.
- The equation render-plan implementation imported the comprehensive domain-IR
  barrel instead of its existing semantic transition compiler. It now imports
  that exact owner, preserving the public facade for its other callers.

Those changes alone measured 139,949 gzip bytes. Grouping the existing reader
playback clock, timeline clock and frame scheduler into one production chunk
then reduced fragmented requests, dependency-tag HTML and compression overhead.
The all-route manifest measurement still includes the entire static dependency
closure and CSS. No runtime code, HTML content, budget baseline, or ceiling was
removed from measurement. No new clock or semantic authority was introduced.

The forbidden-asset predicate now distinguishes the native paint-geometry
helper from the actual KaTeX parser asset. Tests still reject bare, minified,
and hashed KaTeX JavaScript; native geometry still counts against the bytes.
This classification repair is separate from the numeric reduction.

The new `npm run visual:reader-production` command serves the ordinary built
site and reuses manifest-driven conformance: hydration, fonts, renderer identity,
direct progress, TOC, share/reload, phone containment and no-JavaScript content.
It additionally rejects development requests, missing assets and page errors.
It runs on a temporary test server, not a second persistent review server.

## What the browser gate exposed

Eight of twelve built routes pass. Solve-x, fractional-linear, divide-both-sides,
and foldable-distribution fail the existing shared continuity guard. The same
four routes fail development conformance, which also fails five associated
motion checks. This is not a production-only chunk-delivery failure. There was
no pre-change browser baseline for these four routes in this session; do not
attribute their history solely from the new test's discovery date.

The source and captured native measurements establish two distinct causes:

1. **Mixed renderer typography.** Those first three descriptors select only
   some transitions for the canonical compositor. Bootstrap adds canonical
   typography classes only to those transitions. One retained solve-x equals
   sign measures 18.078125 × 27.875 px in the preceding transition and
   30.125 × 46.453125 px in the selected canonical transition. Its annotated
   markup is identical. The guard correctly rejects a shape-changing handoff.
2. **Operation selection is not full endpoint coverage.** Foldable distribution
   intentionally switches from compound term selectors to their primitive
   members between grouping and factoring. Its binder preserves the complete
   native member identities for certified stage layout while changing active
   operation anchors. The continuity guard compares the latter and reports
   an endpoint-closure change. It needs the complete certified native members,
   not a weakened intersection of the two selector sets.

The authoring distribution and simplification Focus Cards pass their complete
24-check Chromium/Firefox/WebKit cohort. These older reader failures do not
invalidate the two-caller semantic-state proof, but required preservation gates
remain red, so G2 release readiness and canonical migration are not claimed.

## Pending bounded repair — not implemented

Recommended scope:

1. Retain a mixed reader host's existing text-size authority across both legacy
   and native transitions. Renderer selection must not independently resize a
   shared endpoint. Preserve all-canonical Focus Card typography and form.
2. Compare complete native endpoint members from the existing certified stage
   bindings when those bindings exist. Keep operation-specific material plans,
   semantic selection, exact endpoint identity, row ownership, paint geometry
   and the 0.5 px continuity tolerance intact. Do not compare only intersecting
   selectors, disable certification, or introduce glyph-specific offsets.
3. Verify one representative mixed-reader handoff and the structurally different
   compound/member boundary, then rerun affected browser and release gates.
   Stop for review if restoring continuity requires a new aesthetic choice.

The execution safety reviewer rejected the proposed shared typography and
continuity edits pending explicit visual approval. **Neither edit was applied.**
They can affect older readers' visible scale and handoff behavior, so approval
of this bounded repair is required before implementation. The payload repair
does not grant that approval. This is not a G2 approval request or a request
to raise budgets; G2 remains required before supply-tax migration.

Rollback unit: the bounded mixed-host typography and certified-member
measurement repair, separate from the nonvisual payload recovery. No semantic
schema, choreography, renderer replacement or catalogue-wide style rollout.

## Executed verification

- `npm run build`: pass; final separate `npm run typecheck`: pass.
- Architecture/dependency preflight and inference: pass at 112,090 types /
  191,101 instantiations, under unchanged ceilings.
- `npm run check:reader-budgets`: all 12 routes pass. HTML headroom remains
  tight (split/merge has 14 gzip bytes and radical succession 15); do not treat
  this as permission to grow payloads unchecked.
- `npm run check:reader-production`: 12 routes pass.
- `npm run check:dev-review-production`: 442 files / 12 forbidden markers pass.
- `npm run check:equation-reachability`: current, 68 roots.
- `npm run test:canonical-equation-renderer`: 29 pass.
- `npm run test:equation-surface-preservation`: 11 pass.
- `npm run visual:authoring-structural -- --project=firefox --project=webkit`:
  24 pass, including real native observation, direct seek and reverse.
- `npm test`: completed 6,589 tests, 6,587 pass / 2 fail. Both failures were
  inventories affected by this change: the broad/learner facade caller ledger
  and generated exact reachability. Both are repaired; their focused rerun
  together with frame-plan and budget tests passes all 20. The entire suite was
  not rerun afterward; a fully green full-suite run is not claimed.
- `npm run visual:reader-production`: 8 pass / 4 fail as diagnosed above.
- `npm run test:browser:reader-conformance`: 8 pass / 9 fail, the same four
  routes plus their five motion assertions.

## Inspect and resume

Shared review server: `npm run dev`, public origin `http://127.0.0.1:8000`.

- Working authoring distribution:
  `http://127.0.0.1:8000/experiments/authoring-distribution-focus-card/`
- Working authoring simplification:
  `http://127.0.0.1:8000/experiments/authoring-simplification-focus-card/`
- Mixed-reader failure reference: `http://127.0.0.1:8000/reader/solve-x/`
- Compound/member failure reference:
  `http://127.0.0.1:8000/reader/foldable-distribution/`

The latter two show current failure references, not a repaired candidate.
After approval, resume the same s18 with `theseus work resume`; keep G2 and G3.
The persistent continuation rule is recorded in
`../decisions/2026-09-06-persistent-loop-continuation.md` and root `AGENTS.md`.
It correctly keeps routine nonvisual repairs running without waiving visual
judgment or an explicit execution-safety rejection.
