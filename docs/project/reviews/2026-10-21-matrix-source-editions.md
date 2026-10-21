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
