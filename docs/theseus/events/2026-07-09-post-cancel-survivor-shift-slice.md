# Post-Cancel Survivor Shift Slice

Target: `frontier.motion.post-cancel-survivor-shift-v1`

## Summary

Made the survivor-token layout shift after cancellation easier to see.

The first subtract-both-sides transition already moved persisted tokens, but
the cancellation transition held survivors still until beat 35. At the default
900 ms duration, the remaining `x` layout shift only had the last 270 ms of the
animation, so it read as a late snap or as if `x` did not move.

The cancellation timeline still preserves the cancellation pause, but the
post-cancel layout shift now starts at beat 30 and runs through beat 50. The
default equation animation duration is now 1200 ms, giving the post-cancel
survivor shift roughly 480 ms by default.

## Sources

- `src/rendering/semantic-beat-compiler.ts`
  - Moves `post-cancel-layout-shift` from beats 35-50 to 30-50.
- `src/editor/equation-animation-catalog.ts`
  - Raises catalog default duration to 1200 ms.
- `src/editor/equation-motion-demo-controller.ts`
  - Raises runtime fallback duration to 1200 ms.
- `tests/equation-motion-sampler.test.ts`
  - Locks the new post-cancel beat range and progress.
- `tests/editor.test.ts`
  - Locks rendered duration defaults.
- `tests/katex-transition.browser.spec.ts`
  - Locks browser duration defaults.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/equation-motion-sampler.test.ts tests/editor.test.ts`
  - Passed 27 tests.
- Runtime Chromium probe against `http://127.0.0.1:8000/`
  - Confirmed the default duration is `1200`.
  - During the `1 -> 2` cancellation transition, sampled `lhs.x` progressing
    through `translate(1.03651px, 0px)`, `translate(8.55387px, 0px)`,
    `translate(17.8989px, 0px)`, `translate(25.8844px, 0px)`, and
    `translate(29.2096px, 0px)`.

## Port Note

Port 8000 was held by `node` PID `27105`; that process was killed and the dev
server is now running at `http://127.0.0.1:8000/`.
