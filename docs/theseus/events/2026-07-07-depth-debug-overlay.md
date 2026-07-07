# Depth Debug Overlay

Date: 2026-07-07
Project: kp
Status: complete

## Summary

Completed the approved depth debug overlay slice:

- Added an optional SVG depth-buffer debug overlay behind
  `graph.debug.depthOverlay`.
- Sampled the software depth buffer into a coarse 20px grid so the overlay stays
  bounded instead of emitting one SVG element per buffer cell.
- Exposed overlay sample dimensions through
  `data-kp-debug-sample-columns` and `data-kp-debug-sample-rows`.
- Emitted debug cells with sampled depth and normalized depth weight metadata.
- Added noninteractive CSS for the debug overlay.

## Source Refs

- `src/rendering/graph-svg.ts`: gated depth overlay renderer and sampled cells.
- `src/styles.css`: noninteractive debug overlay styling.
- `tests/rendering.test.ts`: overlay metadata and cell coverage.

## Verification

Passed:

- `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts`: 16 tests passed, 0 failed.
- `npm run typecheck`: passed.
- `git diff --check`: clean.

## Deferred

- Editor UI for toggling the debug overlay remains deferred.
- Richer debug views for line visibility boundaries and overlap regions remain
  deferred to later geometry slices.
