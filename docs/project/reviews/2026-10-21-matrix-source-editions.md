# Checked matrix source editions: evidence

Scope and acceptance: [approved continuation](../2026-10-21-matrix-source-editions.md).
The mathematical owner remains `M.product` and its column combinations. Editorial
claims are not certified. The accepted renderer and choreography are preserved.

## Source boundary

`kp.matrix-columns.v1` checks dense finite 2×2 factors, exact plain-data fields,
complete seven-beat cues for both columns and bounded editorial text. It copies
and freezes source data, derives products through the existing semantic objects,
and returns a content revision. Authored results, renderer instructions, sparse
arrays, accessors, symbols, excessive transport size/depth and product/sum overflow
are located repair gaps. The starter derives from the accepted source, rather
than duplicating lesson values or prose. Discovery imports no renderer or checker.

Focused checks: `npm run test:matrix-source` (6 tests),
`npm run test:authoring-entrypoints` (51 tests), and
`node --disable-warning=ExperimentalWarning --test tests/author-example-loading.test.ts`
(14 tests). Starter module loading is bounded at the measured 12-file closure.
Initial failures exposed unsupported strip-only parameter properties and test
assumptions about function equality/column-view shape; these were repaired before
the clean runs. The starter now makes mutable plain-data row copies so editing a
draft cannot mutate the immutable semantic source.

Full type checking and subsequent integration evidence are recorded with Theseus.
No runtime presentation change is part of this source boundary.

## Shared reader boundary

The canonical registry entry and the file edition now call the same local reader
controller and HTML scaffold. The extraction preserves the player, presentation,
continuity, clock, font wait, failure restoration and disposal owners. Edition
locations require the exact source revision alongside fractional progress; unknown
registry selection, duplicate fields and invalid columns/positions are rejected.

`npm run visual:matrix-interpretations -- --project=chromium` passes all 29 existing
browser checks after extraction, including reversal, native handoff geometry,
delayed/failed selection, font readiness, phone playback, preparation failure and
history restoration. `npm run typecheck` passes. The two tests in
`tests/matrix-edition-location.test.ts` pass. Production edition integration is
checked in the packaging package; these checks alone do not certify that path.

## Selected-source editions

`author:matrix-publication` uses the existing immutable writer and publication
artifact contract. Static and interactive editions retain exact source bytes,
both derived result columns, fourteen editorial cues, complete local styles/fonts
and source-revision evidence. Interactive editions use the shared reader; source
checking remains report-only. The existing algebra builder now delegates its
unchanged Vite options/output capture to the same local build helper.

`npm run test:matrix-source` passes 11 checks; `npm run test:authoring-entrypoints`
passes 51. `npm run visual:matrix-editions -- --project=chromium` passes four
production checks covering both accepted sources, both columns, exact reversible
paint, contributor provenance, numeric endpoints, pinned reload/fresh context,
phone width, static fallback, rejected source/foreign position and page lifecycle.
The browser harness serves only files named in the immutable manifest; no dev
server or external resource fallback supplies missing edition dependencies.

Initial packaging tests correctly rejected an unsorted publication math manifest;
the builder now normalizes that inventory through the existing contract. The
first browser assertion incorrectly expected stripped source markers on material
copies and was corrected to inspect actual material pose and contributor IDs.
Phone testing exposed overflow from the revision hash, repaired by allowing that
metadata to wrap. The test retains a 390px document-width bound.

Inspection also found that arbitrary finite JS numbers could serialize as `1e-7`
and silently paint an algebraic e. The source compiler now rejects scientific
notation in factors, products or sums with `matrix.numeric-notation`; superscript
motion is not claimed. Regression cases cover source and derived notation. No
accepted source or choreography changes. Arithmetic remains JS numeric arithmetic.

`npm run measure:algebra-editions` passes unchanged budgets after build-helper
extraction: complete edition JS 370,261 gzip bytes; editor JS 402,329. This is a
sum of per-file compression estimates, not measured network transfer. Full new
edition/boundary cost and supported-browser integration follow separately.

## Complete consumers and integration

`npm run visual:matrix-editions` passes all 12 checks across Chromium, Firefox and
WebKit. These execute packaged production bytes, not a development build.
`npm run measure:matrix-editions` measures the complete reader at 362,825 raw /
107,431 gzip bytes (one chunk, 55 emitted modules). The two static editions span
1,212,681–1,213,888 raw / 891,656–892,995 per-file gzip bytes; interactive editions
span 1,578,741–1,580,046 raw / 999,845–1,001,386 gzip bytes. Static/interactive
manifests add 8,499/8,591 bytes separately. All fonts and alternate font formats
are counted; this is portable-package size, not actual browser transfer.

New fixed-cohort budgets: reader 380,000 raw / 112,000 gzip; static complete closure
1,280,000 / 940,000; interactive closure 1,660,000 / 1,055,000; manifest 9,000 bytes.
These retain about 4–6% measured headroom, preserve every asset, and reject omitted
cohort members or accidental registry/editor/lesson dependencies. They are new
consumer budgets, not raised historical ceilings or limits on all possible prose.

`npm run measure:authoring-boundaries -- --check --types` retains all four existing
consumers and adds two complete independently built consumers. Matrix source:
1,670 gzip bytes, 59,132 types, 76,880 instantiations; budgets 1,800 / 62,000 / 81,000.
Matrix compiler: 5,174 gzip bytes, 63,125 types, 83,995 instantiations; budgets
5,500 / 66,000 / 87,000. Source parsing loads only its own data validator and shared
transport guard. Compiler imports cannot acquire presentation, editor or lessons.

The first full `npm test` stopped at architecture checks: the starter imported
content from inside the authoring boundary, and hashing used a kernel deep import.
The starter now lives beside its accepted content in
`content/authoring/convergence/matrix-example.ts`; compilation imports the kernel
public API. Architecture and starter-loading checks pass after repair. The public
API adds three static imports and 661 types / 1,605 instantiations versus the
initial deep import, but emitted bytes are unchanged and existing budgets hold.
No exception or boundary waiver was introduced. A new negative cost fixture also
needed a literal tuple annotation; full type/test reruns follow that correction.

`npm run build:bundle` passes (existing large-chunk warnings remain).
`npm run build:semantic-cost` and `npm run measure:semantic-cost` pass unchanged
historical ceilings: selected dependent source 110,232 gzip JS versus 110,160
before; all-source union 115,904 versus 115,835; CSS 14,558 versus 14,533. The
reader extraction adds 69–72 gzip JS bytes and the hash-wrapping rule adds 25 CSS
bytes to the existing host. The new checker and edition entry do not enter that
host's runtime closure. Reachability regeneration changes only scanned-file count;
the 68 canonical roots and their graph remain unchanged.

Control-record limitation: the initial contract used the creation command's
advertised fields, which omit its run-mode/cadence/stop metadata options. Those
constraints are explicit in the approved plan and were followed, but the global
autonomy report flags the missing fields. The installed update command cannot
amend those fields. Do not confuse workspace schema validation, recorded slice
completion or passing product checks with a clean global readiness report.
No competing contract or direct graph-file edit was used to hide the warning.

Final integration: `npm test` passes all 7,402 tests after the architecture repair;
`npm run typecheck` passes all app/node/test/Svelte/domain checks after the literal
tuple correction. The final `npm run build:bundle` passes. The focused matrix
command passes 12 tests, and all 14 discovery-loading checks pass after moving the
starter. New cost gates and historical matrix/algebra budgets pass without raising
any existing ceiling. The regenerated reachability count is 5,089 versus 5,071;
no canonical root or edge changed.

Local review artifact (existing port-8000 server, HTTP 200 verified):
`/tmp/codex/matrix-editions/ec12cb34dee5aed554702642bef04dff65447de653ca77cc21ae0b2baa0320ae/index.html`.
The artifact directory is disposable generated output; the commands and accepted
source that reproduce it are committed. Its complete production bytes, independent
of this development preview, are exercised by `visual:matrix-editions`.

Outcome: source-file authoring and portable editions within the accepted numerical
2×2 sequence. No registry/player edits are needed for another supported source.
New maintenance consists of the bounded source checker, edition location/entry,
publication adapter and their checks; page/player and local build ownership are
shared. No new aesthetic, pedagogical-effectiveness claim or general matrix API
is introduced. Long labels, unusually wide decimal values and free prose still
need author review; checking does not certify arbitrary layout or explanation.
