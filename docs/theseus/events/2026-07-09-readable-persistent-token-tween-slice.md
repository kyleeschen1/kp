# Readable Persistent Token Tween Slice

Target: `frontier.motion.readable-persistent-token-tween-v1`

## Summary

Made persistent-token equation motion readable during button playback, not only
when driven by the beat scrubber.

The `x` token was already receiving measured source-to-target deltas, but the
first transition compressed that movement into 8 of 20 internal beats at a 420
ms default duration. Button playback also eased the whole normalized clock
before sampling per-track easing, so the visible motion read as an abrupt jump.

The semantic timeline now uses 50 internal beats. The first layout shift spans
beats 0 through 25, introduced tokens enter from beats 25 through 50, and the
cancel/simplify motifs use the same 50-beat scale. Button playback now advances
the shared player with a linear clock, leaving easing inside the sampled motion
tracks. The default duration is 900 ms so the first persistent-token shift has
enough real time to be inspected.

## Sources

- `src/rendering/semantic-beat-compiler.ts`
  - Scales the equation demo semantic beat timeline to 50 beats.
- `src/editor/equation-motion-demo-controller.ts`
  - Uses a linear playback clock and raises the fallback duration to 900 ms.
- `src/editor/equation-animation-catalog.ts`
  - Sets catalog animation defaults to 900 ms.
- `tests/equation-motion-sampler.test.ts`
  - Locks the updated semantic beat ranges and normalized progress values.
- `tests/editor.test.ts`
  - Locks the rendered default duration and 50-beat controls.
- `tests/katex-transition.browser.spec.ts`
  - Locks browser defaults and samples entering tokens after the delayed entry
    phase begins.

## Verification

- `npm run typecheck`
  - Passed app, node, and test TypeScript projects.
- `npm test`
  - Passed 263 tests.
- `npm run test:browser:katex`
  - Passed 2 Playwright tests.
- `npm run test:browser:dashboard`
  - Passed 1 Playwright test.
- `git diff --check`
  - Passed.
- Runtime Chromium probe against `http://127.0.0.1:8004/`
  - Sampled `lhs.x` during button playback. Across 18 animation-frame samples,
    progress advanced from `0.060889` to `0.375778`, and the inline transform
    advanced smoothly from `translate(-1.05617px, 0px)` to
    `translate(-24.9901px, 0px)`.

## Port Note

Port 8000 was still held by `node` PID `27105` during this slice, so the
existing dev server on 8004 was left running.
