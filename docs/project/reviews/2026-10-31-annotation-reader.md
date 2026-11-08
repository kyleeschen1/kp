# Annotation reader integration evidence

Scope: [approved delivery](../2026-10-31-annotation-reader-delivery.md).
Execution: `run-contract.kp.annotation-reader-v1`.

## Shared document projection conversion

The fractional reader now selects the document theater explicitly. The static
prose compiler constructs the intro, story pin, actual passage blocks and
continuation from the parsed document, and the page shell constructs Options and
static fallback directly. `fractional-caption-shell.ts` and its completed-page
HTML rewrite are removed. The layout boundary rejects multiple/missing stories,
nested attention sequences, unknown passage bindings and unowned mathematical
progress before emitting a partial page.

Document styles, scroll geometry, passage focus and lifecycle now have shared
document names. The entry selects the compiled layout declaration rather than
the fractional lesson ID. The fractional operation associations remain with
their semantic source. Existing script/test consumers use the new owners;
the native equation renderer, source, semantic URLs and visual values are
unchanged. No compatibility facade or new clock was added.

Baseline and converted `npm run visual:fractional-linear-equation -- --rising
--base-url=http://127.0.0.1:8011` both passed desktop/phone reading, generous
handoffs, held math, reversal, slider retirement, reflow, native find, Read all
and static/print checks. Four focused compiler/scroll/passage suites pass all
14 tests. Application, Node and test TypeScript projects pass, as does
`npm run check:architecture`. The exact reachability graph is regenerated for
the moved modules; no budget was raised and no runtime speedup is claimed.

The first exact-caller check rejected the old alphabetical ordering after module
renaming; the corrected exact list passes all 12 reachability/caller tests. The
first endpoint-boundary capture sampled a missing progress value while startup
restored the URL. Its clean rerun passed all desktop/phone endpoints; the harness
now waits for the existing font-stable host-ready marker before measuring, rather
than treating early shell hydration as readiness. No visual assertion is relaxed.

This checkpoint established the shared projection with the original consumer
preserved at `e3a607a4a`. The second package below replaces the old candidate.

## Integrated candidate — human checkpoint

Open [What counts as one thing?](http://localhost:8011/reader/what-counts/) and
scroll from the opening passage. Ordinary prose carries the move; the following
annotation stop gives its explanation directly around the stationary equation.
Use Options to jump to “Notice: look inside” or open
[that exact stop](http://localhost:8011/reader/what-counts/#state.what-counts.counted).
The two labels should have room to read without a competing foreground paragraph.
Reverse the scroll, then try Read all. The annotations' wording and equations
remain in the actual document for selection, native find and static reading.

Compare the same format at
[the fractional reader](http://localhost:8011/reader/solve-fractional-linear/).
The review question is the integrated handoff and reading cadence, especially
on a phone. Automated checks do not settle that visual or pedagogical judgment.
Status: **HUMAN_CHECKPOINT**; local annotation acceptance predates this integration,
but this candidate is not yet visually accepted or promoted.

The same revision-pinned source (`content/authoring/algebra/what-counts.json`)
now supplies the shared reader page and native compositor. The native descriptor
is extracted from the existing checked algebra mount, preserving evaluation
certificates, endpoint handoffs and semantic-envelope layout. Both hosts use it.
The document clock maps serialized checkpoint permilles exactly to the three
semantic phase intervals, without rounding a native boundary into material transit.
Page building lives with the server/build composition scripts; the compiler and
browser layers retain their separate dependencies. No architectural exception was
added to admit the candidate.

Annotation/prose ownership is a deterministic discriminated reading state.
An annotation's arrival withdraws prose; incoming prose reclaims the next moment.
Selection also returns attention to the real paragraph through the existing
reader scheduler. Native anchors still require one measurable selector in the
passed native endpoint view; missing or duplicate selectors clear labels and
report a typed repair. Resize invalidates label geometry, and inverse scroll
restoration lands inside the selected passage despite browser pixel rounding.
Shared annotation typography remains in screen space.

The standalone card entry, page and stylesheet are removed. Its original
`?example=anchored-algebra` link redirects to the reader with query and fragment
preserved. Valid state fragments restore through the document's existing seek
path; stale revisions and unknown state IDs report explicit repair feedback.
The route remains a local development candidate, outside the production manifest.
Several-target comments, shared annotation promotion and catalogue migration
remain excluded.

### Verification and repairs

- `npm run visual:anchored-algebra`: all three integrated browser tests pass.
  Desktop/phone native endpoints, all three interior moves, reversal, reduced
  motion, shared-link reload, selection, Read all, no-JavaScript reading, legacy
  link restoration, stale/unknown links and missing/duplicate selectors execute
  against the actual reader. Desktop and phone captures were inspected.
- `npm run visual:algebra-mount -- --grep 'complete algebra native handoff'`:
  both four-state and five-state canaries pass through the existing mounts.
  The isolated test server now uses 8013, leaving review 8011 and reader checks
  8012 available without killing or reusing another process.
- `npm run visual:fractional-linear-equation -- --rising --base-url=http://127.0.0.1:8011`:
  the final integrated reader preserves the accepted desktop/phone behavior.
  The matching `--passage-boundaries` run also passes first/last retreat and reverse.
- Seven focused compiler/descriptor/reading/binding suites pass 23 tests.
  `npm run test:equation-surface-preservation` passes 11; `npm run test:project-vision`
  passes 67. `npm run typecheck` passes all application, Node, test, Svelte and
  domain projects. `npm run check:architecture` passes without new exceptions.
- The reachability graph records the extracted algebra descriptor as the new
  twentieth reader-runtime facade consumer. The exact caller test was updated
  to assert that named owner; its clean complete rerun passes all 12 tests.
  This is an inventory change, not a cost-budget amendment or performance claim.

Early integrated browser runs exposed missing stage-owned accessible states,
an annotation arrival still waiting for outgoing prose, and resize rounding just
before the annotation boundary. Each was repaired at its owner and the complete
three-test command rerun cleanly. The page composition initially violated both
the neutral compiler and browser dependency rules; moving build-only composition
to its script owner resolves those violations rather than waiving them. The first
descriptor type test and exact-caller inventory also rejected the new registered
consumer; the final explicit inventories and full checks pass.

Impact selection was inspected for shared reader/template/compiler changes.
This is the approved exemplar checkpoint: broad production build/payload closure,
cross-browser release certification and motif promotion are not claimed. No
budget ceiling was raised. The development review API on 8001 was not started;
its toolbar query logs connection failures, independently of the passing reader.

Rollback units: the explicit projection conversion commit, then this integrated
candidate commit. The mathematical source and independent workbench are preserved.
Theseus owns the live contract state and verification receipts; this document is
the review packet, not a duplicated slice queue.

## Firefox disappearance follow-up

The user reported equation ink appearing and vanishing, then recovering, in
Firefox. Earlier integration evidence covered Chromium. The added real-reader
startup/reload check reproduced a Firefox failure: the fixed 82px document
viewport could not contain its measured 236.41×68.42px certified content at the
existing 0.68 readable scale with 18px padding. It required 83px height.

The canonical measurement boundary can now request a bounded height reserve
from the document host and remeasure once. The host retains that reserve and
preserves its previous reading geometry until the layout callback captures the
active beat. Changing the reading line early had moved an exact final-state link
back to its preceding prose passage. Neither minimum scale nor padding changed;
insufficient width or a refused/ineffective reserve still fails the fit guard.

Reload also exposed a focus identity gap: one native view of the counted
coefficient was blue while the equivalent successor view was unhighlighted.
Focus lineage now traverses the existing verifier-issued endpoint partitions in
both directions. A unit regression checks complete group coverage, unrelated
groups and rejection of fabricated handoffs. Paint/style/baseline comparison
remains strict, with more useful mismatch diagnostics.

Viewport changes could additionally render before ResizeObserver invalidated
the previous row certificate. This reproduced in both Firefox and Chromium.
The reader's resize handler now invalidates before restoring its playhead;
native measurement and motion routing consume the same layout revision. The
transit failure was stale geometry, not a reason to change the motif or relax
its collision checks.

Verification uses `npm run visual:anchored-algebra -- --project=firefox`, which
runs both Chromium and Firefox. The new regression checks actual visible native
ink on initial load and reload, opening and direct-state links, desktop and
phone widths, and a delayed sample after readiness. Existing navigation,
reversal, selection, Read all, static reading, repair gaps and legacy-link checks
remain intact. Firefox desktop and phone reload captures were inspected.
Focused focus/session/baseline suites pass 10 tests; the two native handoff
canaries, fractional document preservation, full TypeScript, architecture and
11 equation-surface preservation checks also pass. The final combined browser
run passes all 8 tests (4 per browser); its receipt is recorded in Theseus.

This repairs the existing candidate; its integration remains at the same visual
checkpoint. To verify the bug fix, reload the reader and its direct annotation
link above in Firefox: the equation should stay painted, and the selected
annotation should survive restoration and resizing. No workbench, mathematical
source, timing, annotation wording or production registration changes are made.

## November 8 typography refinement

The user says the reader looks good and asks for absent or more modest headlines,
with annotations in the prose font. The candidate now uses a modest opening title;
passage headings remain hidden. Annotation sentences use the shared supporting
text role and inherit the actual reader prose family, replacing the bold serif
label treatment. The change is local to this exemplar and preserves source,
wording, native mathematics, semantic anchors and attention timing.

An initial custom-property inheritance attempt still selected the serif fallback
in the browser. Direct family inheritance fixes that cascade boundary. The
existing annotation browser check now compares both annotation lines' computed
family with actual prose at every stop and both widths, alongside its fit and
reading-ownership checks. This checks the user's requested relationship rather
than freezing a particular font name or size as a global policy.

Review the opening title, then
[the counted-whole annotation](http://localhost:8011/reader/what-counts/#state.what-counts.counted).
Both lines should read as prose, without a bold headline above each comment.
This is a refinement of the current candidate, not shared annotation promotion.

Final verification: `npm run visual:anchored-algebra -- --project=firefox` passes
all eight Chromium/Firefox checks, including computed font parity, desktop/phone
fit, native paint after reload, reversal, selection, Read all and static reading.
Final desktop and phone captures were inspected. The five focused tests in
`tests/anchored-algebra.test.ts` and `tests/focus-deck-annotation.test.ts` also pass.
The optional development-review API on port 8001 remains unavailable; its existing
proxy diagnostics do not prevent the reader or these checks from working.
