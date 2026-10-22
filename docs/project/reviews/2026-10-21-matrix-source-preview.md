# Checked matrix source preview evidence

Scope and preservation: [approved continuation](../2026-10-21-matrix-source-preview.md).

The matrix compiler now issues immutable drafts and serializes source only from
those drafts. Copying an object cannot manufacture checked authority; checking its
source again can. The matrix session uses the existing prepared-revision owner.
Displayed resource ownership remains with the host after synchronous publication.

`node --disable-warning=ExperimentalWarning --test tests/matrix-column-source.test.ts tests/matrix-column-session.test.ts`
passes all ten cases: source semantics and paint range, forged drafts, serialization,
invalid edits, preparation/publication failure, newer valid and invalid edits,
invalidation and disposal. These are objective transaction guarantees, not browser
or visual certification. Browser integration and complete cost gates follow.

The optional `?author=1` host now loads a starter or local UTF-8 JSON, applies
explicitly, keeps both column controls and held progress, and downloads draft and
displayed source separately. Reload intentionally restores the starter. Imported
files are bounded at 100,000 bytes before reading; later typing or selection
invalidates a pending file read. Staging retains the mounted DOM root because the
existing player queries that root on every sample. Font preparation is shared with
the unchanged ordinary reader.

`npm run visual:matrix-authoring -- --project=chromium` passes five browser cases:
edit/apply/export/reload, file round trip and malformed UTF-8/oversize rejection,
file/preview supersession, failed mount/repeated replacement/disposal, and phone
layout plus the ordinary reader's absence of editor requests. Initial full
`npm run typecheck` also passed. Complete cost and supported-browser checks remain
integration work; the first cost run diagnosed small shared-chunk overruns and the
new editor's addition to the formerly read-only all-chunks union.

## Explicit cost-policy amendment

The complete independently built matrix compiler consumer now includes serialization:
5,275 gzip bytes, 63,139 types, 84,028 instantiations (previous compiler-only export
5,174 / 63,125 / 83,995). Its existing ceilings remain. The new complete session
consumer is 5,606 / 63,238 / 84,056, bounded at 6,000 / 66,000 / 87,000. All six
previous consumers remain measured; matrix source-only checking stays 1,670 gzip
bytes. Neither domain consumer imports a renderer, host or content.

Production multi-entry attribution measured dependent-columns at 110,637 gzip JS
bytes (previous 110,232); all read-only matrix sources at 116,315 (previous 115,904).
The existing 111,000 selected-reader and 117,000 all-reader limits remain. The new
complete author activation is 116,459, bounded at 118,000. `matrix-all` still counts
**every** lazy chunk, now including the editor: 122,137, bounded at 124,000. A new
`matrix-reader-all` cohort preserves the former reader-only union rather than
hiding the editor or charging readers for unactivated editor ownership. Ordinary
closures reject editor/session/staging modules. All CSS ceilings remain 16,000.

Adding shared editor consumers changed multi-entry chunk partitioning/exports,
including shared semantic and preload code; unchanged non-matrix callers moved
slightly. Row-composition-variation is 124,140 against 124,000; collection-polynomials
is 112,002 against 112,000. Explicit bounded ceiling amendments are 125,000 and
113,000 respectively. This is accounting headroom, not an optimization claim.
An isolated build per page would change the existing cost model and obscure the
real shared deployment; manual chunk splitting would add build policy for a small
compression/export effect. No consumer or required type fixture is removed.
These measurements come from the same complete build and `measure:semantic-cost`;
the final check must still pass every cohort. Browser transfer/timing are separate
from summed per-file gzip estimates.

The independent immutable edition reader measures 107,436 gzip JS bytes versus
107,431 before this pass (56 modules instead of 55 after extracting the shared
font-readiness helper). Its budgets stay unchanged. All four complete static and
interactive edition packages also pass; editor/session/staging imports are now
explicitly forbidden in their reader gate, with executable negative controls.

The supported-engine editor cohort passed 15 checks; the separate production
cohort passed three checks against emitted assets alone, importing the accepted
projection source and verifying both result columns, contributor IDs, reversible
samples and exported revision. The existing reader passed all 29 Chromium checks.
During final race review, the file picker was changed to clear its selection before
asynchronous reading: cancellation must not prevent choosing that same file again.
The strengthened race test waits for actual candidate mounting and disposal before
asserting that a newer draft wins, and passes in all three engines.

Keyboard column navigation restores focus to the replacement link only while the
original link still owns focus; it does not steal focus after the user moves on.
The initial WebKit assertion used a pointer click, which follows different focus
behavior; the corrected regression uses focused Enter activation. Two test-fixture
ID edits initially violated the starter's literal ID type; constructing a new
plain source with the changed ID fixed the fixtures without weakening source types.

The first complete `npm test` run failed only the generated reachability file count:
5,095 versus 5,096 after adding the production spec. Regeneration through
`npm run generate:equation-reachability` changes only that count, retaining all 68
roots. `npm run check:equation-reachability` passes, and the clean complete
`npm test` rerun passes all 7,405 tests. The standalone production build passes with existing large
chunk warnings, not a claim that every unrelated bundle is small.

Final gates: full `npm run typecheck`; `npm test`; `npm run build:bundle`;
`npm run test:matrix-source` (15); `npm run visual:matrix-authoring` (18), with the
final keyboard/import refinement checked by `npm run visual:matrix-authoring -- --grep explicit`
(6); `npm run visual:matrix-interpretations` (29); complete
`npm run measure:authoring-boundaries -- --types --check`,
`npm run build:semantic-cost`, `npm run measure:semantic-cost`, and
`npm run measure:matrix-editions`; current reachability and Theseus validation.
The shared server returns HTTP 200 at the authoring URL. No new visual approval is
claimed or required for this objective authoring workflow; accepted animation
geometry, timing and typography remain unchanged.

Limits: the editor is local and has no autosave or persistent draft URL. It applies
the existing fixed sequence to finite numerical 2×2 sources; it neither checks
editorial claims nor supplies arbitrary choreography. Phone stages retain their
existing horizontal scrolling. This verifies authoring mechanics and preservation,
not learner outcomes or a new visual treatment.
