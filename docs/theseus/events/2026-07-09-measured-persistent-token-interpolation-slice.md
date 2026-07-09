# Measured Persistent Token Interpolation Slice

Target: `frontier.motion.measured-persistent-token-interpolation-v1`

## Summary

Moved persistent-token layout interpolation into the sampled equation motion
plan.

Previously, source-to-target layout deltas were added inside the DOM renderer
after `sampleEquationMotion` returned a frame. That made persistent movement
less inspectable and less composable than opacity/scale tracks. The runtime now
measures source and target token anchors, injects those deltas into copied
motion tracks, and then lets the shared player sample those tracks for both
animation frames and scrubber-driven playback.

The visible beat scrubber now labels 50 beats while preserving the normalized
semantic beat timing.

## Sources

- `src/rendering/equation-motion-plan.ts`
  - Added `applyMeasuredMotionDeltas` for context-measured track deltas.
- `src/editor/equation-motion-demo-controller.ts`
  - Builds measured runtime plans before playback/scrubbing and removes
    renderer-side layout offset injection.
- `src/editor/equation-animation-catalog.ts`
  - Sets equation animation beat labels to 50.
- `tests/equation-motion-plan.test.ts`
  - Covers measured deltas as first-class sampled track data.
- Browser/editor tests
  - Updated scrubber expectations from 20 to 50 labeled beats.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts tests/editor.test.ts`
  - Passed 35 tests.
- `npm run typecheck`
  - Passed app, node, and test TypeScript projects.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `npm test`
  - Passed 263 tests.
- `npm run test:browser:dashboard`
  - Passed 1 Playwright test.
- Runtime Chromium probe against `http://127.0.0.1:8004/`
  - Confirmed the scrubber max is 50 and adjacent beat samples move `lhs.x`
    smoothly through measured track poses.

## Port Note

Port 8000 was not free during the slice; it was held by `node` PID `27105`, so
the existing dev server on 8004 was left running.
