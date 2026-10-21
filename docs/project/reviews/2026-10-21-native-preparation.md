# Native equation preparation

Scope and authority: [approved investigation](../2026-10-21-native-preparation-investigation.md).
Theseus run `run-contract.kp.native-preparation-v1` owns execution status.

## Finding and repair

The combined tax reader's first-transition window includes logarithm preparation.
Source-mapped sampling attributes substantial cost to native baseline probes,
material-clone construction and clone alignment. These are overlapping stacks,
not additive independent costs. The baseline owner inserted, measured and removed
one marker per glyph, repeatedly flushing layout during a scene observation.

`measureKpNativeKatexBaselines` batches independent text-bearing leaves within
one synchronous observation. Every probe is removed in `finally`, including
partial insertion or failed measurement. Later observations measure afresh.
The scene observer uses this only for glyph baselines; wrapper baselines keep
their original measurement. No cross-frame cache or new renderer authority.

An initial unrestricted batch failed in Chromium, Firefox and WebKit: nested
wrapper probes changed each other's line boxes by roughly 58px in the pressure
fixture. The repair now rejects that optimization whenever any candidate has
children or lacks text, falling back to individual measurements. The executable
browser fixture checks both paths against individual measurements for fractions,
matrices and logarithms, including nested scripts, scaling and font-size changes.
That limitation is part of the implementation, not a caller convention.

## Measurement

Commands:

- `npm run build:bundle -- --sourcemap`
- `npm run audit:architecture-cost -- --browser --tax-only --activation --tax-profile`
- `npm run build:bundle`
- `npm run audit:architecture-cost -- --browser --tax-only --activation --acceptance`

Instrumented first-transition window, 6x CPU throttle, three complete-workflow
samples before and after (local production files, 390×844 DPR1):

| Measure | Before | After |
| --- | --- | --- |
| Layout count | 478 / 444 / 526 | 324 / 306 / 333 |
| Layout time, ms | 139.91 / 103.23 / 113.40 | 105.87 / 62.23 / 69.26 |

Median layout count fell 32.2%; median layout time fell 38.9%. These are
instrumented attribution results, not ordinary latency or phone certification.
Native material cloning remains significant. This repair does not establish that
the first-interaction stall is solved. The post-profile final guard also excludes
empty leaves; observed glyph candidates already contained text.

## Verification checkpoint

- Three baseline unit tests passed: phase ordering, cleanup, fresh measurements,
  scroll anchoring and compound/empty-owner fallback.
- `npm run visual:native-preparation`: three browser engines passed the narrowed
  implementation; the unrestricted attempt failed and was repaired.
- `npm run test:real-katex-glyph-compositor`: 82 passed.
- `npm run test:canonical-equation-renderer`: 33 passed.
- Application TypeScript passed before the final conservative empty-leaf guard;
  final integration verification follows in the contract's verification slice.

An initial sandboxed audit launch failed in Chromium with SIGTRAP. The same
repo-owned command completed outside the sandbox. No browser failures or missing
assets were suppressed. Production timing and final integration results will be
recorded before closeout.
