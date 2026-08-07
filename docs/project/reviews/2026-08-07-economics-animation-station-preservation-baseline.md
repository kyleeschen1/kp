# Economics Animation-Station Preservation Baseline

Date: 2026-08-07
Status: frozen pre-choreography reference
Run Contract:
`../../theseus/nodes/run-contracts/run-contract.kp.motion-passage-publication-authoring-v2.json`
Slice: `s01`

## Reference

The canonical discovery route is
`/tutorials/economics/demand-shift/?layout=animation-station` at a 1280 by 800
CSS-pixel viewport. The checked fixture is
`../../../tests/fixtures/economics-animation-station-preservation-baseline.json`.
It records source ownership, required DOM anchors, initial CSS geometry tokens,
canonical pixel geometry, visible structure, screenshot checkpoints,
performance ceilings, the last observed pressure, and the rollback boundary.

This is a preservation reference, not an approval of the current cue opacity,
blur, pinning, spacing, or release choreography. Those behaviors are exactly
what later exemplar slices may replace.

## Ownership

- `KpEconomicsDemandShiftTutorial.svelte` owns route composition and binds the
  query-selected station presenter to shared lesson/runtime state.
- `economics-demand-shift-animation-station.css` owns only station paint and
  query-local geometry defaults.
- `economics-demand-shift-layout.ts` owns pure station geometry, cue, exit, and
  motion-corridor projections.
- `economics-demand-shift-motion-blocks.ts` and the retained animation-player
  session own semantic time; the station presenter cannot introduce another
  clock.
- `content/lessons/economics-demand-shift-two-column.json` remains authored
  lesson truth. The generated publication artifact remains derived truth.
- `economics-animation-station.browser.spec.ts` owns the disposable screenshot
  checkpoints under `tmp/codex/economics-animation-station/`.

## Screenshot Anchors

The stable npm entrypoint `npm run visual:economics-animation-station` captures
the ready station, focused cue, handoff, settled motion, and station exit. The
test also observes the exact reverse return from exit to the settled graph.
These names remain stable so later slices can compare current, proposed, and
approved phases without adopting image files as committed goldens.

## Runtime And Performance Baseline

Before this choreography tranche, the shared player and retained SVG session
already provide deterministic direct seek and reverse motion. The last recorded
production sample had 149,990 initial script bytes, 42 resources, zero CLS,
34.2 ms active p95 frames, and no active long tasks. Initial transfer was
250,869 bytes against a 250,000-byte ceiling and the sampled startup longest
task was 160 ms against 150 ms. Those two pressures are preserved as known debt,
not normalized into larger budgets.

## Preservation And Rollback

The smallest visual rollback is the `animation-station` query presenter, its
local station stylesheet, and its station-only browser assertions. Rejection of
the new choreography must not roll back the economics model, compiled lesson
source, retained SVG runtime session, semantic salience roles, themes, Review
capture, URL reconstruction, direct seek/rewind, or the split projection.

The repository already contains user-owned modifications to the authored
two-column lesson source and its generated publication. This preservation slice
reads those files but does not stage, overwrite, normalize, or claim them.

## Verification

- `npm run test:economics-demand-shift-tutorial`
- `npm run test:economics-demand-shift-css`
- `npm run visual:economics-animation-station`
- `theseus workspace validate`

