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

| Measure | Before | After baseline batching only |
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

After baseline batching only, ordinary production first-transition maximum RAF gaps at 6x were
482.6 / 315.6 / 216.9 ms before and 267.4 / 367.5 / 216.6 ms after. The ranges
overlap substantially; these three-sample cohorts do not establish a reliable
latency improvement. At 1x neither cohort had a frame gap over 50ms. Initial
reader JavaScript changes from 387,681 to 387,786 gzip bytes (+105); complete
companion activation acceptance passes with no missing assets or browser errors.
Startup readiness is noisy and is not claimed as an improvement from this fix.

Integration exposed three stale logarithm test setups: interruption, readiness
waiting and runtime-failure tests waited for an offscreen deferred stage without
activating its card. They now scroll the card into view as neighboring tests
already do; assertions and production activation behavior are preserved. The
first nine-test selection had six passes and these three setup failures. Its
first Theseus failure receipt used `prepared-selected-cohort` as a shorthand
label, not a literal invocation; the actual command is the selected cohort below.

`npm run visual:focus-deck-input -- --grep 'prepared logarithm|final equation rewrites|automatic exponent|automatic division|disposing an active|arrow.*interrupt|equation edge|previous.*rewrite|native.*failure'`

The first full-suite attempt ran inside the sandbox; server tests could not
listen on loopback (`EPERM`). A focused `node --test server/app.test.ts`
reproduced that environment failure in all six HTTP tests. The full suite must
be rerun outside the sandbox; a focused success will not substitute for it.

## First-mount lifetime repair

During verification, source inspection found a second independent cost:
`applyFrame` creates and calibrates the next native session, then unconditionally
clears the material layer. On first mount there is no predecessor to retire.
The new browser regression observed eight freshly calibrated owners removed and
rebuilt before readiness. Retaining them when `activeTransit` is absent removes
that redundant work; actual operation switches keep retirement and clearing so
generic track IDs cannot retain a preceding operation's paint. Failure cleanup
and disposal still clear their material layer.

The reproduction failed before this repair and passes afterward. All ten tests
in the selected logarithm cohort pass, including next-operation paint, remount,
backward replay, interruption, readiness waiting and runtime failure. This is a
first-mount lifetime correction, not shared paint caching across operations.
Final production measurements follow both repairs together.

The sandboxed full suite completed with 7,337 passes and 14 failures: thirteen
loopback permission failures and one stale generated reachability file count.
`npm run generate:equation-reachability` updates only scanned-file count
5,031 → 5,032 for the added browser fixture; declared roots and callers do not
change. The complete suite is rerunning outside the sandbox.
